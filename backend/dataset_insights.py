from __future__ import annotations

import base64
import csv
import hashlib
import io
import json
import os
import re
import threading
import time
import uuid
from dataclasses import dataclass
from typing import Any

import numpy as np
import httpx
from fastapi import APIRouter, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


router = APIRouter()


_STORE_LOCK = threading.Lock()
_DATASETS: dict[str, "DatasetHandle"] = {}
_REPORTS: dict[str, dict[str, Any]] = {}

_DATASET_TTL_S = 60 * 60
_MAX_FILE_BYTES = 15_000_000
_MAX_ROWS = 120_000
_MAX_COLS = 250
_PREVIEW_ROWS = 25
_TEXT_PROFILE_MAX_DOCS = 60_000
_TEXT_PROFILE_MAX_TOKENS_PER_DOC = 400


_EMAIL_RX = re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")
_PHONE_RX = re.compile(r"(?i)\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}\b")
_IP_RX = re.compile(r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b")
_CC_RX = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
_TOKEN_RX = re.compile(r"(?i)\b(bearer|api[_-]?key|token)\b[^\n]{0,200}")


def _now() -> float:
    return time.time()


def _cleanup_expired() -> None:
    cutoff = _now() - _DATASET_TTL_S
    with _STORE_LOCK:
        expired = [k for k, v in _DATASETS.items() if v.created_at < cutoff]
        for k in expired:
            _DATASETS.pop(k, None)
            _REPORTS.pop(k, None)


def _safe_dataset_id() -> str:
    return uuid.uuid4().hex


def _hash_pseudo(value: str, salt: str) -> str:
    d = hashlib.sha256((salt + value).encode("utf-8", errors="ignore")).digest()
    return base64.urlsafe_b64encode(d[:16]).decode().rstrip("=")


def _redact_text(text: str, *, salt: str, mode: str) -> str:
    t = text
    if mode == "none":
        return t

    def repl(rx: re.Pattern[str], label: str) -> str:
        def _r(m: re.Match[str]) -> str:
            s = m.group(0)
            if mode == "mask":
                return f"[{label}]"
            return f"[{label}:{_hash_pseudo(s, salt)}]"

        return rx.sub(_r, t)

    t = repl(_EMAIL_RX, "email")
    t = repl(_IP_RX, "ip")
    t = repl(_PHONE_RX, "phone")
    t = repl(_CC_RX, "cc")
    t = repl(_TOKEN_RX, "token")
    return t


def _infer_type(values: list[str]) -> str:
    non_empty = [v for v in values if v is not None and str(v).strip() != ""]
    if not non_empty:
        return "empty"
    if all(str(v).strip().lower() in {"true", "false", "0", "1", "yes", "no"} for v in non_empty[:400]):
        return "bool"
    numeric_ok = 0
    for v in non_empty[:800]:
        try:
            float(str(v).replace(",", ""))
            numeric_ok += 1
        except Exception:
            pass
    if numeric_ok / max(1, min(800, len(non_empty))) >= 0.92:
        return "numeric"
    return "text"


def _tokenize(text: str) -> list[str]:
    t = re.sub(r"[\W_]+", " ", text.lower()).strip()
    if not t:
        return []
    parts = [p for p in t.split() if 2 <= len(p) <= 24]
    return parts[:2000]


def _build_tfidf(texts: list[str], *, max_features: int) -> tuple[np.ndarray, list[str]]:
    df: dict[str, int] = {}
    docs_tokens: list[list[str]] = []
    for t in texts:
        toks = _tokenize(t)
        docs_tokens.append(toks)
        seen = set(toks)
        for w in seen:
            df[w] = df.get(w, 0) + 1
    if not df:
        return np.zeros((len(texts), 0), dtype=np.float32), []
    terms = sorted(df.items(), key=lambda x: x[1], reverse=True)[:max_features]
    vocab = [t for t, _ in terms]
    idx = {t: i for i, t in enumerate(vocab)}
    n_docs = max(1, len(texts))
    idf = np.zeros((len(vocab),), dtype=np.float32)
    for t, c in terms:
        idf[idx[t]] = float(np.log((n_docs + 1) / (c + 1)) + 1.0)
    X = np.zeros((len(texts), len(vocab)), dtype=np.float32)
    for i, toks in enumerate(docs_tokens):
        if not toks:
            continue
        counts: dict[int, int] = {}
        for w in toks:
            j = idx.get(w)
            if j is None:
                continue
            counts[j] = counts.get(j, 0) + 1
        if not counts:
            continue
        norm = 0.0
        for j, c in counts.items():
            tf = float(c)
            v = tf * float(idf[j])
            X[i, j] = v
            norm += v * v
        norm = float(np.sqrt(norm)) if norm > 0 else 1.0
        X[i, :] /= norm
    return X, vocab


def _kmeans(X: np.ndarray, k: int, *, iters: int = 25, seed: int = 7) -> tuple[np.ndarray, np.ndarray]:
    n, d = X.shape
    if n == 0 or d == 0:
        return np.zeros((0,), dtype=np.int32), np.zeros((k, d), dtype=np.float32)
    k = int(max(2, min(k, n)))
    rng = np.random.default_rng(seed)
    centers = X[rng.choice(n, size=k, replace=False)].copy()
    labels = np.zeros((n,), dtype=np.int32)
    for _ in range(iters):
        distances = ((X[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
        new_labels = distances.argmin(axis=1).astype(np.int32)
        if np.array_equal(new_labels, labels):
            break
        labels = new_labels
        for j in range(k):
            mask = labels == j
            if mask.any():
                centers[j] = X[mask].mean(axis=0)
    return labels, centers


def _train_val_split(n: int, *, seed: int = 7, frac: float = 0.2) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    idx = np.arange(n)
    rng.shuffle(idx)
    cut = int(max(1, min(n - 1, int(n * (1 - frac)))))
    return idx[:cut], idx[cut:]


def _kfold_indices(n: int, k: int, *, seed: int = 7) -> list[tuple[np.ndarray, np.ndarray]]:
    k = int(max(2, min(k, n)))
    rng = np.random.default_rng(seed)
    idx = np.arange(n)
    rng.shuffle(idx)
    folds = np.array_split(idx, k)
    out: list[tuple[np.ndarray, np.ndarray]] = []
    for i in range(k):
        val = folds[i]
        train = np.concatenate([f for j, f in enumerate(folds) if j != i])
        out.append((train, val))
    return out


def _softmax(z: np.ndarray) -> np.ndarray:
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / (e.sum(axis=1, keepdims=True) + 1e-12)


def _one_hot(y: np.ndarray, n_classes: int) -> np.ndarray:
    Y = np.zeros((y.shape[0], n_classes), dtype=np.float32)
    Y[np.arange(y.shape[0]), y] = 1.0
    return Y


def _logreg_train(X: np.ndarray, y: np.ndarray, *, lr: float = 0.25, iters: int = 140, l2: float = 1e-3) -> dict[str, Any]:
    n, d = X.shape
    classes = sorted(set(int(v) for v in y.tolist()))
    class_to_idx = {c: i for i, c in enumerate(classes)}
    y_idx = np.array([class_to_idx[int(v)] for v in y.tolist()], dtype=np.int32)
    k = len(classes)
    W = np.zeros((d, k), dtype=np.float32)
    b = np.zeros((k,), dtype=np.float32)
    Y = _one_hot(y_idx, k)
    for _ in range(iters):
        logits = X @ W + b
        P = _softmax(logits)
        grad_W = (X.T @ (P - Y)) / max(1, n) + l2 * W
        grad_b = (P - Y).mean(axis=0)
        W -= lr * grad_W
        b -= lr * grad_b
    return {"type": "logreg", "classes": classes, "W": W, "b": b}


def _logreg_predict(model: dict[str, Any], X: np.ndarray) -> np.ndarray:
    W = model["W"]
    b = model["b"]
    logits = X @ W + b
    P = _softmax(logits)
    pred_idx = P.argmax(axis=1)
    classes = model["classes"]
    return np.array([classes[int(i)] for i in pred_idx.tolist()], dtype=np.int32)


def _mlp_train(X: np.ndarray, y: np.ndarray, *, hidden: int = 64, lr: float = 0.08, iters: int = 160, l2: float = 1e-4, seed: int = 7) -> dict[str, Any]:
    n, d = X.shape
    classes = sorted(set(int(v) for v in y.tolist()))
    class_to_idx = {c: i for i, c in enumerate(classes)}
    y_idx = np.array([class_to_idx[int(v)] for v in y.tolist()], dtype=np.int32)
    k = len(classes)
    rng = np.random.default_rng(seed)
    W1 = (rng.normal(0, 0.12, size=(d, hidden))).astype(np.float32)
    b1 = np.zeros((hidden,), dtype=np.float32)
    W2 = (rng.normal(0, 0.12, size=(hidden, k))).astype(np.float32)
    b2 = np.zeros((k,), dtype=np.float32)
    Y = _one_hot(y_idx, k)

    for _ in range(iters):
        Z1 = X @ W1 + b1
        A1 = np.maximum(0.0, Z1)
        logits = A1 @ W2 + b2
        P = _softmax(logits)
        dlogits = (P - Y) / max(1, n)
        dW2 = A1.T @ dlogits + l2 * W2
        db2 = dlogits.sum(axis=0)
        dA1 = dlogits @ W2.T
        dZ1 = dA1 * (Z1 > 0)
        dW1 = X.T @ dZ1 + l2 * W1
        db1 = dZ1.sum(axis=0)
        W1 -= lr * dW1
        b1 -= lr * db1
        W2 -= lr * dW2
        b2 -= lr * db2

    return {"type": "mlp", "classes": classes, "W1": W1, "b1": b1, "W2": W2, "b2": b2}


def _mlp_predict(model: dict[str, Any], X: np.ndarray) -> np.ndarray:
    Z1 = X @ model["W1"] + model["b1"]
    A1 = np.maximum(0.0, Z1)
    logits = A1 @ model["W2"] + model["b2"]
    P = _softmax(logits)
    pred_idx = P.argmax(axis=1)
    classes = model["classes"]
    return np.array([classes[int(i)] for i in pred_idx.tolist()], dtype=np.int32)


def _confusion(y_true: np.ndarray, y_pred: np.ndarray) -> tuple[list[int], list[list[int]]]:
    labels = sorted(set(int(v) for v in np.concatenate([y_true, y_pred]).tolist()))
    idx = {c: i for i, c in enumerate(labels)}
    m = [[0 for _ in labels] for _ in labels]
    for a, b in zip(y_true.tolist(), y_pred.tolist(), strict=False):
        m[idx[int(a)]][idx[int(b)]] += 1
    return labels, m


def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, Any]:
    labels = sorted(set(int(v) for v in np.concatenate([y_true, y_pred]).tolist()))
    tp = {c: 0 for c in labels}
    fp = {c: 0 for c in labels}
    fn = {c: 0 for c in labels}
    for yt, yp in zip(y_true.tolist(), y_pred.tolist(), strict=False):
        yt = int(yt)
        yp = int(yp)
        if yt == yp:
            tp[yt] += 1
        else:
            fp[yp] += 1
            fn[yt] += 1
    per = {}
    f1s = []
    ps = []
    rs = []
    for c in labels:
        p = tp[c] / max(1, (tp[c] + fp[c]))
        r = tp[c] / max(1, (tp[c] + fn[c]))
        f1 = 2 * p * r / max(1e-12, (p + r))
        per[str(c)] = {"precision": round(p, 4), "recall": round(r, 4), "f1": round(f1, 4)}
        f1s.append(f1)
        ps.append(p)
        rs.append(r)
    acc = float((y_true == y_pred).mean()) if y_true.size else 0.0
    return {
        "accuracy": round(acc, 4),
        "precision_macro": round(float(np.mean(ps)) if ps else 0.0, 4),
        "recall_macro": round(float(np.mean(rs)) if rs else 0.0, 4),
        "f1_macro": round(float(np.mean(f1s)) if f1s else 0.0, 4),
        "per_class": per,
    }


def _standardize(X: np.ndarray) -> tuple[np.ndarray, dict[str, Any]]:
    if X.size == 0:
        return X, {"mean": [], "std": []}
    mean = np.nanmean(X, axis=0)
    std = np.nanstd(X, axis=0)
    std = np.where(std < 1e-6, 1.0, std)
    Xn = (np.nan_to_num(X, nan=mean) - mean) / std
    return Xn.astype(np.float32), {"mean": mean.tolist(), "std": std.tolist()}


def _select_numeric_matrix(rows: list[dict[str, Any]], cols: list[str]) -> np.ndarray:
    X = np.zeros((len(rows), len(cols)), dtype=np.float32)
    for i, r in enumerate(rows):
        for j, c in enumerate(cols):
            v = r.get(c)
            if v is None or str(v).strip() == "":
                X[i, j] = np.nan
            else:
                try:
                    X[i, j] = float(str(v).replace(",", ""))
                except Exception:
                    X[i, j] = np.nan
    return X


def _best_text_column(schema: dict[str, Any]) -> str | None:
    best = None
    best_score = -1
    for c in schema.get("columns", []):
        if c.get("type") != "text":
            continue
        score = int(c.get("non_empty", 0))
        if score > best_score:
            best_score = score
            best = c.get("name")
    return best


@dataclass
class DatasetHandle:
    dataset_id: str
    created_at: float
    salt: str
    pii_mode: str
    schema: dict[str, Any]
    rows_preview: list[dict[str, Any]]
    numeric_cols: list[str]
    text_col: str | None
    rows_count: int
    numeric_profile: dict[str, Any]
    text_profile: dict[str, Any]


class DatasetUploadResponse(BaseModel):
    dataset_id: str
    data_schema: dict[str, Any]  # Renamed from 'schema' to avoid shadowing BaseModel.schema
    preview: list[dict[str, Any]]
    rows: int


class DatasetAnalyzeRequest(BaseModel):
    dataset_id: str
    task: str = Field(default="auto")
    target: str | None = None
    model: str = Field(default="auto")
    k_folds: int = Field(default=5, ge=2, le=10)
    n_clusters: int = Field(default=5, ge=2, le=12)
    max_tfidf_features: int = Field(default=1200, ge=200, le=5000)


class DatasetAIInsightsRequest(BaseModel):
    dataset_id: str
    provider: str = "auto"
    language: str = "ar"


def _parse_csv_bytes(b: bytes) -> list[dict[str, Any]]:
    text = b.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    rows: list[dict[str, Any]] = []
    for i, row in enumerate(reader):
        if i >= _MAX_ROWS:
            break
        rows.append({k: (v if v is not None else "") for k, v in row.items()})
        if len(row) > _MAX_COLS:
            raise HTTPException(status_code=400, detail="عدد الأعمدة كبير جداً")
    return rows


def _parse_jsonl_bytes(b: bytes) -> list[dict[str, Any]]:
    text = b.decode("utf-8", errors="replace").splitlines()
    rows: list[dict[str, Any]] = []
    for i, line in enumerate(text):
        if i >= _MAX_ROWS:
            break
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            raise HTTPException(status_code=400, detail="jsonl غير صالح")
        if not isinstance(obj, dict):
            raise HTTPException(status_code=400, detail="jsonl يجب أن يكون كائن لكل سطر")
        rows.append(obj)
        if len(obj) > _MAX_COLS:
            raise HTTPException(status_code=400, detail="عدد الأعمدة كبير جداً")
    return rows


def _infer_schema(rows: list[dict[str, Any]]) -> dict[str, Any]:
    if not rows:
        raise HTTPException(status_code=400, detail="dataset فارغ")
    cols = sorted({k for r in rows for k in r.keys()})
    if len(cols) > _MAX_COLS:
        raise HTTPException(status_code=400, detail="عدد الأعمدة كبير جداً")
    col_values: dict[str, list[str]] = {c: [] for c in cols}
    for r in rows[: min(len(rows), 5000)]:
        for c in cols:
            v = r.get(c, "")
            col_values[c].append("" if v is None else str(v))
    columns = []
    for c in cols:
        values = col_values[c]
        t = _infer_type(values)
        non_empty = sum(1 for v in values if str(v).strip() != "")
        columns.append({"name": c, "type": t, "non_empty": non_empty})
    numeric_cols = [c["name"] for c in columns if c["type"] == "numeric"]
    text_cols = [c["name"] for c in columns if c["type"] == "text"]
    return {"columns": columns, "numeric_cols": numeric_cols, "text_cols": text_cols}


def _sanitize_rows(rows: list[dict[str, Any]], *, salt: str, mode: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for r in rows:
        rr: dict[str, Any] = {}
        for k, v in r.items():
            if v is None:
                rr[k] = ""
                continue
            if isinstance(v, (int, float, bool)):
                rr[k] = v
                continue
            s = str(v)
            rr[k] = _redact_text(s, salt=salt, mode=mode)
        out.append(rr)
    return out


def _profile_numeric(rows: list[dict[str, Any]], cols: list[str]) -> dict[str, Any]:
    if not cols:
        return {"columns": [], "stats": {}}
    stats: dict[str, Any] = {}
    for c in cols:
        count = 0
        missing = 0
        mean = 0.0
        m2 = 0.0
        vmin = None
        vmax = None
        for r in rows:
            v = r.get(c)
            if v is None or str(v).strip() == "":
                missing += 1
                continue
            try:
                x = float(str(v).replace(",", ""))
            except Exception:
                missing += 1
                continue
            count += 1
            if vmin is None or x < vmin:
                vmin = x
            if vmax is None or x > vmax:
                vmax = x
            delta = x - mean
            mean += delta / count
            delta2 = x - mean
            m2 += delta * delta2
        var = (m2 / max(1, count - 1)) if count >= 2 else 0.0
        stats[c] = {
            "count": int(count),
            "missing": int(missing),
            "mean": float(mean) if count else None,
            "std": float(np.sqrt(var)) if count else None,
            "m2": float(m2) if count else 0.0,
            "min": float(vmin) if vmin is not None else None,
            "max": float(vmax) if vmax is not None else None,
        }
    return {"columns": cols, "stats": stats}


def _merge_numeric_profile(base: dict[str, Any], new_rows: list[dict[str, Any]], cols: list[str]) -> dict[str, Any]:
    if not cols:
        return {"columns": [], "stats": {}}
    stats = dict((base.get("stats") or {}) if isinstance(base, dict) else {})
    for c in cols:
        s = stats.get(c) or {}
        n1 = int(s.get("count") or 0)
        mean1 = float(s.get("mean") or 0.0) if n1 else 0.0
        m2_1 = float(s.get("m2") or 0.0) if n1 else 0.0
        missing1 = int(s.get("missing") or 0)
        vmin = s.get("min")
        vmax = s.get("max")

        n2 = 0
        mean2 = 0.0
        m2_2 = 0.0
        missing2 = 0
        vmin2 = None
        vmax2 = None
        for r in new_rows:
            v = r.get(c)
            if v is None or str(v).strip() == "":
                missing2 += 1
                continue
            try:
                x = float(str(v).replace(",", ""))
            except Exception:
                missing2 += 1
                continue
            n2 += 1
            if vmin2 is None or x < vmin2:
                vmin2 = x
            if vmax2 is None or x > vmax2:
                vmax2 = x
            delta = x - mean2
            mean2 += delta / n2
            delta2 = x - mean2
            m2_2 += delta * delta2

        if n2 == 0:
            stats[c] = {
                "count": n1,
                "missing": missing1 + missing2,
                "mean": float(mean1) if n1 else None,
                "std": float(s.get("std")) if s.get("std") is not None else None,
                "m2": float(m2_1) if n1 else 0.0,
                "min": vmin,
                "max": vmax,
            }
            continue

        if n1 == 0:
            var = (m2_2 / max(1, n2 - 1)) if n2 >= 2 else 0.0
            stats[c] = {
                "count": n2,
                "missing": missing2,
                "mean": float(mean2),
                "std": float(np.sqrt(var)),
                "m2": float(m2_2),
                "min": float(vmin2) if vmin2 is not None else None,
                "max": float(vmax2) if vmax2 is not None else None,
            }
            continue

        delta = mean2 - mean1
        n = n1 + n2
        mean = mean1 + delta * (n2 / n)
        m2 = m2_1 + m2_2 + (delta * delta) * (n1 * n2 / n)
        var = (m2 / max(1, n - 1)) if n >= 2 else 0.0
        mn = vmin
        mx = vmax
        if vmin2 is not None:
            mn = float(vmin2) if mn is None else float(min(float(mn), float(vmin2)))
        if vmax2 is not None:
            mx = float(vmax2) if mx is None else float(max(float(mx), float(vmax2)))
        stats[c] = {
            "count": int(n),
            "missing": int(missing1 + missing2),
            "mean": float(mean),
            "std": float(np.sqrt(var)),
            "m2": float(m2),
            "min": mn,
            "max": mx,
        }
    return {"columns": cols, "stats": stats}


def _profile_text(rows: list[dict[str, Any]], col: str | None) -> dict[str, Any]:
    if not col:
        return {"text_column": None, "docs": 0, "top_tokens": [], "top_bigrams": []}
    df: dict[str, int] = {}
    tf: dict[str, int] = {}
    bi: dict[str, int] = {}
    docs = 0
    for r in rows[:_TEXT_PROFILE_MAX_DOCS]:
        t = str(r.get(col, "") or "")
        toks = _tokenize(t)[:_TEXT_PROFILE_MAX_TOKENS_PER_DOC]
        if not toks:
            continue
        docs += 1
        seen = set()
        for w in toks:
            tf[w] = tf.get(w, 0) + 1
            seen.add(w)
        for w in seen:
            df[w] = df.get(w, 0) + 1
        for a, b in zip(toks, toks[1:], strict=False):
            key = f"{a} {b}"
            bi[key] = bi.get(key, 0) + 1
    top_tokens = sorted(tf.items(), key=lambda x: x[1], reverse=True)[:40]
    top_bigrams = sorted(bi.items(), key=lambda x: x[1], reverse=True)[:30]
    return {
        "text_column": col,
        "docs": int(docs),
        "top_tokens": [{"token": k, "count": int(v), "df": int(df.get(k, 0))} for k, v in top_tokens],
        "top_bigrams": [{"bigram": k, "count": int(v)} for k, v in top_bigrams],
    }


@router.post("/api/datasets/upload", response_model=DatasetUploadResponse, tags=["Datasets"])
async def dataset_upload(
    request: Request,
    file: UploadFile,
    pii_mode: str = "hash",
):
    _cleanup_expired()
    if pii_mode not in {"none", "mask", "hash"}:
        raise HTTPException(status_code=400, detail="pii_mode غير صالح")
    content = await file.read()
    if len(content) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="الملف كبير جداً")

    name = (file.filename or "").lower()
    if name.endswith(".csv"):
        rows = _parse_csv_bytes(content)
    elif name.endswith(".jsonl"):
        rows = _parse_jsonl_bytes(content)
    else:
        raise HTTPException(status_code=400, detail="صيغة غير مدعومة (csv أو jsonl)")

    dataset_id = _safe_dataset_id()
    salt = uuid.uuid4().hex
    safe_rows = _sanitize_rows(rows, salt=salt, mode=pii_mode)
    schema = _infer_schema(safe_rows)
    numeric_cols = list(schema.get("numeric_cols", []))
    text_col = _best_text_column(schema)
    preview = safe_rows[:_PREVIEW_ROWS]
    numeric_profile = _profile_numeric(safe_rows, numeric_cols)
    text_profile = _profile_text(safe_rows, text_col)

    handle = DatasetHandle(
        dataset_id=dataset_id,
        created_at=_now(),
        salt=salt,
        pii_mode=pii_mode,
        schema=schema,
        rows_preview=preview,
        numeric_cols=numeric_cols,
        text_col=text_col,
        rows_count=len(safe_rows),
        numeric_profile=numeric_profile,
        text_profile=text_profile,
    )

    with _STORE_LOCK:
        _DATASETS[dataset_id] = handle
        _REPORTS.pop(dataset_id, None)

    return DatasetUploadResponse(dataset_id=dataset_id, data_schema=schema, preview=preview, rows=len(safe_rows))


def _load_dataset_preview(dataset_id: str) -> DatasetHandle:
    _cleanup_expired()
    with _STORE_LOCK:
        h = _DATASETS.get(dataset_id)
    if not h:
        raise HTTPException(status_code=404, detail="dataset غير موجود أو انتهت صلاحيته")
    return h


class DatasetUpdateResponse(BaseModel):
    ok: bool
    dataset_id: str
    rows_total: int
    preview_rows: int


@router.post("/api/datasets/update", response_model=DatasetUpdateResponse, tags=["Datasets"])
async def dataset_update(dataset_id: str, file: UploadFile):
    h = _load_dataset_preview(dataset_id)
    content = await file.read()
    if len(content) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="الملف كبير جداً")
    name = (file.filename or "").lower()
    if name.endswith(".csv"):
        rows = _parse_csv_bytes(content)
    elif name.endswith(".jsonl"):
        rows = _parse_jsonl_bytes(content)
    else:
        raise HTTPException(status_code=400, detail="صيغة غير مدعومة (csv أو jsonl)")
    safe_rows = _sanitize_rows(rows, salt=h.salt, mode=h.pii_mode)
    schema2 = _infer_schema(safe_rows)
    cols1 = {c["name"] for c in h.schema.get("columns", [])}
    cols2 = {c["name"] for c in schema2.get("columns", [])}
    if cols2 - cols1:
        raise HTTPException(status_code=400, detail="dataset الجديد يحتوي أعمدة غير معروفة")

    with _STORE_LOCK:
        hh = _DATASETS.get(dataset_id)
        if not hh:
            raise HTTPException(status_code=404, detail="dataset غير موجود")
        merged_preview = (hh.rows_preview + safe_rows)[:_PREVIEW_ROWS]
        hh.rows_preview = merged_preview
        hh.rows_count += len(safe_rows)
        hh.numeric_profile = _merge_numeric_profile(hh.numeric_profile, safe_rows, hh.numeric_cols)
        hh.text_profile = _profile_text((hh.rows_preview + safe_rows[:4000]), hh.text_col)
        _DATASETS[dataset_id] = hh
        _REPORTS.pop(dataset_id, None)
        rows_total = hh.rows_count
        preview_rows = len(hh.rows_preview)

    return DatasetUpdateResponse(ok=True, dataset_id=dataset_id, rows_total=rows_total, preview_rows=preview_rows)


@router.post("/api/datasets/analyze", tags=["Datasets"])
async def dataset_analyze(req: DatasetAnalyzeRequest):
    h = _load_dataset_preview(req.dataset_id)
    rows = h.rows_preview
    schema = h.schema
    numeric_cols = h.numeric_cols
    text_col = h.text_col

    report: dict[str, Any] = {
        "dataset_id": h.dataset_id,
        "rows_preview": len(rows),
        "rows_total": h.rows_count,
        "schema": schema,
        "created_at": h.created_at,
        "generated_at": _now(),
        "gdpr": {
            "pii_handling": h.pii_mode,
            "data_minimization": True,
            "retention_s": _DATASET_TTL_S,
            "notes": "يتم الاحتفاظ بعيّنة مُنقّحة فقط (preview) لتوليد التقرير؛ لا يتم حفظ البيانات الخام في الخادم.",
        },
        "profiles": {"numeric": h.numeric_profile, "text": h.text_profile},
    }

    insights: list[dict[str, Any]] = []
    if numeric_cols:
        Xn = _select_numeric_matrix(rows, numeric_cols)
        Xz, stats = _standardize(Xn)
        report["numeric"] = {
            "columns": numeric_cols,
            "standardization": stats,
            "nan_ratio": float(np.isnan(Xn).mean()) if Xn.size else 0.0,
            "means": np.nanmean(Xn, axis=0).tolist(),
            "stds": np.nanstd(Xn, axis=0).tolist(),
        }
        if Xz.shape[0] >= 6 and Xz.shape[1] >= 2:
            labels, _ = _kmeans(Xz, min(req.n_clusters, max(2, int(np.sqrt(Xz.shape[0])))))
            counts = {str(int(k)): int(v) for k, v in zip(*np.unique(labels, return_counts=True), strict=False)}
            report["unsupervised"] = {"kmeans_numeric": {"k": int(max(labels) + 1) if labels.size else 0, "counts": counts}}

    if text_col:
        texts = [str(r.get(text_col, "") or "") for r in rows]
        Xtxt, vocab = _build_tfidf(texts, max_features=req.max_tfidf_features)
        report["nlp"] = {
            "text_column": text_col,
            "vocab_size": len(vocab),
            "samples": [t[:260] for t in texts[:8]],
        }
        if Xtxt.shape[1] > 0 and Xtxt.shape[0] >= 6:
            labels, centers = _kmeans(Xtxt, min(req.n_clusters, max(2, int(np.sqrt(Xtxt.shape[0])))))
            top_terms: list[list[str]] = []
            for c in centers:
                if c.size == 0:
                    top_terms.append([])
                    continue
                idx = np.argsort(-c)[:8]
                top_terms.append([vocab[int(i)] for i in idx.tolist()])
            counts = {str(int(k)): int(v) for k, v in zip(*np.unique(labels, return_counts=True), strict=False)}
            report.setdefault("unsupervised", {})
            report["unsupervised"]["kmeans_text"] = {"k": int(max(labels) + 1), "counts": counts, "top_terms": top_terms}

    target = (req.target or "").strip()
    if target and any(c.get("name") == target for c in schema.get("columns", [])):
        y_raw = [r.get(target) for r in rows]
        y_map: dict[str, int] = {}
        y: list[int] = []
        for v in y_raw:
            s = "" if v is None else str(v).strip()
            if s == "":
                continue
            if s not in y_map:
                y_map[s] = len(y_map)
            y.append(y_map[s])
        if len(y) >= max(4, 2 * int(req.k_folds)):
            feats = []
            if numeric_cols:
                Xn = _select_numeric_matrix(rows, numeric_cols)
                Xz, _ = _standardize(Xn)
                feats.append(Xz)
            if text_col:
                texts = [str(r.get(text_col, "") or "") for r in rows]
                Xtxt, _ = _build_tfidf(texts, max_features=min(1000, req.max_tfidf_features))
                feats.append(Xtxt)
            if feats:
                X = np.concatenate(feats, axis=1) if len(feats) > 1 else feats[0]
                y_arr = np.array(y[: X.shape[0]], dtype=np.int32)
                folds = _kfold_indices(X.shape[0], req.k_folds)
                fold_metrics = []
                models = []
                for train_idx, val_idx in folds:
                    Xtr, Xva = X[train_idx], X[val_idx]
                    ytr, yva = y_arr[train_idx], y_arr[val_idx]
                    model_type = req.model
                    if model_type == "auto":
                        model_type = "mlp" if X.shape[1] >= 10 else "logreg"
                    if model_type == "mlp":
                        m = _mlp_train(Xtr, ytr, hidden=min(96, max(16, int(X.shape[1] * 1.5))))
                        yp = _mlp_predict(m, Xva)
                    else:
                        m = _logreg_train(Xtr, ytr)
                        yp = _logreg_predict(m, Xva)
                    fold_metrics.append(_metrics(yva, yp))
                    models.append(m)

                agg = {
                    "accuracy": round(float(np.mean([m["accuracy"] for m in fold_metrics])), 4),
                    "precision_macro": round(float(np.mean([m["precision_macro"] for m in fold_metrics])), 4),
                    "recall_macro": round(float(np.mean([m["recall_macro"] for m in fold_metrics])), 4),
                    "f1_macro": round(float(np.mean([m["f1_macro"] for m in fold_metrics])), 4),
                }
                train_idx, val_idx = _train_val_split(X.shape[0])
                model_type = req.model
                if model_type == "auto":
                    model_type = "mlp" if X.shape[1] >= 10 else "logreg"
                if model_type == "mlp":
                    final_model = _mlp_train(X[train_idx], y_arr[train_idx], hidden=min(96, max(16, int(X.shape[1] * 1.5))))
                    y_pred = _mlp_predict(final_model, X[val_idx])
                else:
                    final_model = _logreg_train(X[train_idx], y_arr[train_idx])
                    y_pred = _logreg_predict(final_model, X[val_idx])
                labels, cm = _confusion(y_arr[val_idx], y_pred)
                report["supervised"] = {
                    "target": target,
                    "classes": list(y_map.keys()),
                    "model": model_type,
                    "cross_validation": {"k_folds": req.k_folds, "metrics_mean": agg, "folds": fold_metrics},
                    "holdout": {"confusion_labels": labels, "confusion_matrix": cm, "metrics": _metrics(y_arr[val_idx], y_pred)},
                }
            else:
                insights.append({"severity": "warning", "title": "لا توجد ميزات كافية للتدريب", "detail": "لم يتم العثور على أعمدة رقمية أو نصية مناسبة."})
        else:
            insights.append({"severity": "warning", "title": "بيانات هدف غير كافية", "detail": "عدد العينات المعلّمة في preview غير كافٍ لتدريب نموذج."})

    if (report.get("seo") is None) and (report.get("nlp") is None) and (report.get("numeric") is None):
        insights.append({"severity": "warning", "title": "لم يتم استخراج إشارات كافية", "detail": "dataset قد يكون غير منظم أو فارغاً."})

    quality_score = 100
    try:
        num_stats = (h.numeric_profile.get("stats") or {}) if h.numeric_profile else {}
        if num_stats:
            missing_ratios = []
            for _, st in num_stats.items():
                cnt = int(st.get("count") or 0)
                miss = int(st.get("missing") or 0)
                denom = max(1, cnt + miss)
                missing_ratios.append(miss / denom)
            mr = float(np.mean(missing_ratios)) if missing_ratios else 0.0
            quality_score -= int(min(30, mr * 100))
    except Exception:
        pass
    if h.text_col and (h.text_profile.get("docs") or 0) == 0:
        quality_score -= 12
    quality_score = max(0, min(100, quality_score))

    report["scores"] = {
        "data_quality": quality_score,
        "coverage_numeric": 100 if bool(h.numeric_cols) else 0,
        "coverage_text": 100 if bool(h.text_col) else 0,
        "privacy": 95 if h.pii_mode in {"hash", "mask"} else 70,
    }

    report["insights"] = insights

    with _STORE_LOCK:
        _REPORTS[h.dataset_id] = report
    return JSONResponse(content=report)


@router.get("/api/datasets/report/{dataset_id}", tags=["Datasets"])
async def dataset_report(dataset_id: str):
    _cleanup_expired()
    with _STORE_LOCK:
        r = _REPORTS.get(dataset_id)
    if not r:
        raise HTTPException(status_code=404, detail="لا يوجد تقرير")
    return JSONResponse(content=r)


_DATASET_AI_SYSTEM_AR = """أنت خبير تحليل بيانات (Data Science) في منصة QURABIA.
مهمتك: قراءة تقرير تحليل dataset (JSON) وإنتاج:
1) رؤى وأنماط رئيسية (NLP + Unsupervised + Structured)
2) توصيات تحسين جودة البيانات (Data Quality) والمعالجة المسبقة
3) خطة نمذجة: أي نموذج مناسب ولماذا، وكيفية cross-validation
4) مخاطر الخصوصية وGDPR (Data minimization, retention, pseudonymization)
قواعد: لا تخترع بيانات. استشهد بأرقام وحقول من التقرير. اكتب بالعربية، مختصرًا ومنظمًا."""


_DATASET_AI_SYSTEM_EN = """You are a senior data science auditor for QURABIA.
Task: read a dataset analysis report (JSON) and produce:
1) key insights/patterns (NLP + unsupervised + structured)
2) data quality & preprocessing recommendations
3) modeling plan with cross-validation guidance
4) GDPR/privacy risks and mitigations
Rules: do not invent data. Reference concrete values from the report. Keep it structured and concise."""


@router.post("/api/datasets/ai-insights", tags=["Datasets"])
async def dataset_ai_insights(req: DatasetAIInsightsRequest):
    _cleanup_expired()
    with _STORE_LOCK:
        report = _REPORTS.get(req.dataset_id)
    if not report:
        raise HTTPException(status_code=404, detail="لا يوجد تقرير")

    provider = (req.provider or "auto").strip().lower()
    lang = (req.language or "ar").strip().lower()
    system_prompt = _DATASET_AI_SYSTEM_AR if lang.startswith("ar") else _DATASET_AI_SYSTEM_EN
    compact = {
        "scores": report.get("supervised", {}).get("cross_validation", {}).get("metrics_mean") if report.get("supervised") else None,
        "schema": report.get("schema"),
        "rows_total": report.get("rows_total"),
        "profiles": report.get("profiles"),
        "unsupervised": report.get("unsupervised"),
        "insights": report.get("insights"),
        "gdpr": report.get("gdpr"),
    }
    prompt_content = "DATASET_REPORT_JSON:\n" + json.dumps(compact, ensure_ascii=False)[:14000]

    async def try_gemini() -> str | None:
        key = (os.environ.get("GEMINI_API_KEY") or "").strip()
        if not key:
            return None
        payload = {"contents": [{"parts": [{"text": system_prompt + "\n\n" + prompt_content}]}]}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}"
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
        if not r.is_success:
            return None
        data = r.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return text.strip() if isinstance(text, str) else None

    async def try_grok() -> str | None:
        key = (os.environ.get("GROK_API_KEY") or "").strip()
        if not key:
            return None
        payload = {
            "model": "grok-1",
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt_content}],
            "stream": False,
            "temperature": 0.3,
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.post(
                "https://api.x.ai/v1/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
            )
        if not r.is_success:
            return None
        data = r.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return text.strip() if isinstance(text, str) else None

    async def try_openrouter() -> str | None:
        key = (os.environ.get("OPENROUTER_API_KEY") or "").strip()
        if not key:
            return None
        model = (os.environ.get("OPENROUTER_MODEL") or "openai/gpt-4o-mini").strip()
        payload = {
            "model": model,
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt_content}],
            "temperature": 0.3,
            "stream": False,
        }
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {key}", "X-Title": "QURABIA"}
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
        if not r.is_success:
            return None
        data = r.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return text.strip() if isinstance(text, str) else None

    async def local_fallback() -> str:
        prof = report.get("profiles", {})
        ncols = (prof.get("numeric") or {}).get("columns") or []
        tcol = (prof.get("text") or {}).get("text_column")
        lines = []
        if lang.startswith("ar"):
            lines.append(f"تحليل Dataset — عدد السجلات (إجمالي): {report.get('rows_total')}")
            if ncols:
                lines.append(f"- أعمدة رقمية: {len(ncols)}")
            if tcol:
                lines.append(f"- عمود نصي مرجّح: {tcol}")
            if report.get("unsupervised"):
                lines.append("- توجد نتائج تجميع (Unsupervised) ضمن التقرير.")
            if report.get("supervised"):
                m = report["supervised"]["cross_validation"]["metrics_mean"]
                lines.append(f"- أداء CV: accuracy={m.get('accuracy')} f1_macro={m.get('f1_macro')}")
            lines.append("توصية: ثبّت سياسة الاحتفاظ، وابقِ إرسال البيانات الخارجية على ملخصات فقط لتوافق GDPR.")
        else:
            lines.append(f"Dataset analysis — rows_total: {report.get('rows_total')}")
            if ncols:
                lines.append(f"- numeric columns: {len(ncols)}")
            if tcol:
                lines.append(f"- likely text column: {tcol}")
            if report.get("unsupervised"):
                lines.append("- unsupervised clustering results present.")
            if report.get("supervised"):
                m = report["supervised"]["cross_validation"]["metrics_mean"]
                lines.append(f"- CV: accuracy={m.get('accuracy')} f1_macro={m.get('f1_macro')}")
            lines.append("Recommendation: enforce retention, and only send summaries to external AI for GDPR.")
        return "\n".join(lines)

    text: str | None = None
    used = "local"
    mode = "local_fallback"
    if provider in {"auto", "gemini"}:
        try:
            t = await try_gemini()
            if t:
                text = t
                used = "gemini"
                mode = "ai"
        except Exception:
            pass
    if text is None and provider in {"auto", "grok"}:
        try:
            t = await try_grok()
            if t:
                text = t
                used = "grok"
                mode = "ai"
        except Exception:
            pass
    if text is None and provider in {"auto", "openrouter"}:
        try:
            t = await try_openrouter()
            if t:
                text = t
                used = "openrouter"
                mode = "ai"
        except Exception:
            pass
    if text is None:
        text = await local_fallback()
    return JSONResponse(content={"provider": used, "text": text[:9000], "mode": mode})


@router.post("/api/datasets/delete/{dataset_id}", tags=["Datasets"])
async def dataset_delete(dataset_id: str):
    with _STORE_LOCK:
        existed = dataset_id in _DATASETS
        _DATASETS.pop(dataset_id, None)
        _REPORTS.pop(dataset_id, None)
    return JSONResponse(content={"ok": True, "existed": existed})
