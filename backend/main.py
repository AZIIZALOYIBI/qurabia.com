import asyncio
import base64
import hashlib
import hmac
import ipaddress
import json
import logging
import os
import re
import secrets
import signal
import socket
import sqlite3
import sys
import threading
import time
from collections import defaultdict, deque
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
import structlog
from arabic_quantum_bridge import router as arabic_quantum_router
from auth_service import (
    GoogleAuthRequest,
    UserCreate,
    UserLogin,
    get_user_profile,
    login_user,
    login_with_google,
    register_user,
    update_user_plan,
)
from cache_service import (
    generate_fingerprint_key,
    generate_multipath_key,
    get_cache,
    get_cache_stats,
    set_cache,
)
from dataset_insights import router as dataset_router
from dna_detector import dna_detector
from fastapi import FastAPI, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from memory_system import MemoryEntry, MemoryType, StructuredMemoryStore, memory_freshness_warning
from pydantic import BaseModel, Field, model_validator
from quantum_agi_engine import ErrorEvent, GenesisAlgorithmDNA, GenesisEngine, LearningMemory, QuantumAGIEngine
from quantum_chemistry import quantum_chemistry_engine
from security_engine_service import (
    EncryptionPath,
    MultiPathEncryptionResult,
    PQCAlgorithm,
    PerformanceMetrics,
    QuantumFingerprint,
    ThreatClassification,
    get_security_engine,
)
from security_shield import security_shield
from starlette.middleware.gzip import GZipMiddleware
from starlette.responses import StreamingResponse


def _load_dotenv_file(path: str) -> None:
    try:
        with open(path, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except OSError:
        return

    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        if key not in os.environ or os.environ.get(key, "") == "":
            os.environ[key] = value


_load_dotenv_file(os.path.join(os.path.dirname(__file__), ".env"))

# ── Structured logging configuration ──────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
        if os.environ.get("APP_ENV") == "production"
        else structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger("qurabia.api")

_start_time = time.monotonic()

app = FastAPI(
    title="QURABIA Backend API",
    # تفعيل Swagger/OpenAPI في بيئة التطوير فقط — تُعطَّل في الإنتاج
    docs_url="/docs" if os.environ.get("APP_ENV") != "production" else None,
    redoc_url="/redoc" if os.environ.get("APP_ENV") != "production" else None,
    openapi_url="/openapi.json" if os.environ.get("APP_ENV") != "production" else None,
)
app.include_router(arabic_quantum_router)
app.include_router(dataset_router)
engine = QuantumAGIEngine()
genesis = GenesisEngine()


def _env_int(name: str, default: int) -> int:
    """Parse an integer environment variable, falling back to *default* on invalid input."""
    try:
        return int(os.environ.get(name, str(default)))
    except ValueError:
        logger.warning("Invalid value for env var %s; using default %d", name, default)
        return default


# ── Startup Environment Validation ────────────────────────────────────────────
def _validate_env() -> None:
    """Verify critical environment variables at startup.

    In production (APP_ENV=production), missing cryptographic secrets cause a
    hard failure so the operator can fix the deployment before serving traffic.
    In non-production environments a warning is logged instead.
    """
    env = os.environ.get("APP_ENV", "production")
    is_prod = env == "production"
    missing: list[str] = []

    # Critical secrets that must be set in production
    _REQUIRED_IN_PROD = ["KEM_MASTER_SEED", "DSA_SIGNING_KEY"]
    for var in _REQUIRED_IN_PROD:
        val = os.environ.get(var, "")
        if not val:
            missing.append(var)

    if missing:
        msg = "Missing required environment variable(s): %s"
        if is_prod:
            logger.critical(msg, ", ".join(missing))
            raise SystemExit(
                f"FATAL: {msg % ', '.join(missing)}. "
                "Set them in your deployment environment or use APP_ENV=development to skip this check."
            )
        else:
            logger.warning(msg + " (non-production — continuing with empty defaults)", ", ".join(missing))

    # Advisory secrets — warn but do not block startup
    _ADVISORY = ["OPENROUTER_API_KEY"]
    for var in _ADVISORY:
        if not os.environ.get(var, ""):
            logger.info("Optional env var %s not set — related features will use local fallback", var)


_validate_env()


learning = LearningMemory(
    max_events=_env_int("LEARNING_MAX_EVENTS", 500),
    db_path=os.environ.get("LEARNING_DB_PATH"),
    db_max_rows=_env_int("LEARNING_DB_MAX_ROWS", 25000),
)
memory_store = StructuredMemoryStore(
    storage_path=os.environ.get("MEMORY_STORE_PATH"),
    max_entries=_env_int("MEMORY_MAX_ENTRIES", 200),
)

try:
    from blackbody import BlackbodyEngine

    _blackbody = BlackbodyEngine()
    _blackbody_error: str | None = None
except Exception as exc:
    logger.warning("BlackbodyEngine could not be loaded: %s", exc)
    _blackbody = None
    _blackbody_error = "import_failed"

# ── CORS: تحديد الأصول بحسب البيئة ──────────────────────────────────────────
_APP_ENV = os.environ.get("APP_ENV", "production")
_PROD_ORIGINS = [
    "https://qurabia.com",
    "https://www.qurabia.com",
]
_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
_ALLOWED_ORIGINS = _PROD_ORIGINS + (_DEV_ORIGINS if _APP_ENV != "production" else [])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Admin-Code"],
)

app.add_middleware(GZipMiddleware, minimum_size=800)

# ── Rate Limiting: حد أقصى 60 طلب/دقيقة لكل IP ──────────────────────────────
_RATE_LIMIT_REQUESTS = _env_int("RATE_LIMIT_REQUESTS", 60)
_RATE_LIMIT_WINDOW = _env_int("RATE_LIMIT_WINDOW_S", 60)
_MAX_BODY_BYTES = _env_int("MAX_BODY_BYTES", 1024 * 256)
_RATE_LIMIT_DB_PATH = os.environ.get("RATE_LIMIT_DB_PATH", "")

_SECURITY_EVENTS = deque(maxlen=_env_int("SECURITY_MAX_EVENTS", 600))
_SECURITY_BLOCKED: dict[str, dict[str, Any]] = {}
_SECURITY_LOCK = threading.Lock()
_SECURITY_REQ_WINDOW_S = _env_int("SECURITY_REQ_WINDOW_S", 60)
_SECURITY_REQ_SPIKE = _env_int("SECURITY_REQ_SPIKE", 180)
_SECURITY_BLOCK_THRESHOLD = float(os.environ.get("SECURITY_BLOCK_THRESHOLD", "0.92"))
_SECURITY_ALERT_THRESHOLD = float(os.environ.get("SECURITY_ALERT_THRESHOLD", "0.72"))
_SECURITY_BLOCK_SECONDS = _env_int("SECURITY_BLOCK_SECONDS", 900)
_SECURITY_DEMO_PQC = (os.environ.get("SECURITY_PQC_DEMO") or "").strip() == "1"

_SECURITY_REQS: dict[str, deque] = defaultdict(deque)
_SECURITY_STATS: dict[str, Any] = {
    "total_requests": 0,
    "blocked_requests": 0,
    "alerts": 0,
    "last_event_ts": 0.0,
}

_SECURITY_SUSPICIOUS_RX = re.compile(
    r"(?i)(\.\./|%2e%2e%2f|%2e%2e/|<script|%3cscript|union\s+select|or\s+1=1|/etc/passwd|wp-admin|\.git/|/actuator|/graphql|/login\?|/admin\b)"
)
_SECURITY_SCANNER_UA_RX = re.compile(r"(?i)(sqlmap|nmap|nikto|acunetix|nessus|dirbuster|masscan|zgrab|curl/|wget/|python-requests)")


def _security_now() -> float:
    return time.time()


def _security_prune_ip(ip: str, now: float) -> int:
    q = _SECURITY_REQS[ip]
    cutoff = now - _SECURITY_REQ_WINDOW_S
    while q and q[0] < cutoff:
        q.popleft()
    return len(q)


def _security_is_blocked(ip: str, now: float) -> dict[str, Any] | None:
    with _SECURITY_LOCK:
        entry = _SECURITY_BLOCKED.get(ip)
        if not entry:
            return None
        until = float(entry.get("until", 0.0))
        if until and now >= until:
            del _SECURITY_BLOCKED[ip]
            return None
        return entry


def _security_block_ip(ip: str, now: float, seconds: int, reason: str, score: float) -> None:
    until = now + max(1, int(seconds))
    with _SECURITY_LOCK:
        _SECURITY_BLOCKED[ip] = {"ip": ip, "until": until, "reason": reason, "score": float(score), "ts": now}


def _security_event(
    *,
    ts: float,
    category: str,
    severity: str,
    ip: str,
    method: str,
    path: str,
    ua: str,
    score: float,
    reason: str,
    status_code: int | None = None,
) -> dict[str, Any]:
    ev = {
        "ts": ts,
        "category": category,
        "severity": severity,
        "ip": ip,
        "method": method,
        "path": path,
        "ua": (ua or "")[:240],
        "score": round(float(score), 4),
        "reason": (reason or "")[:240],
        "status_code": status_code,
    }
    with _SECURITY_LOCK:
        _SECURITY_EVENTS.append(ev)
        _SECURITY_STATS["last_event_ts"] = ts
        if severity in {"high", "critical"}:
            _SECURITY_STATS["alerts"] = int(_SECURITY_STATS.get("alerts", 0)) + 1
    return ev


def _security_score(ip: str, method: str, path_with_query: str, ua: str, now: float) -> tuple[float, str]:
    reasons: list[str] = []
    score = 0.0

    if _SECURITY_SUSPICIOUS_RX.search(path_with_query or ""):
        score = max(score, 0.9)
        reasons.append("suspicious_path")

    ua_l = (ua or "").strip()
    if not ua_l:
        score = max(score, 0.4)
        reasons.append("missing_user_agent")
    elif _SECURITY_SCANNER_UA_RX.search(ua_l):
        score = max(score, 0.85)
        reasons.append("scanner_user_agent")

    q = _SECURITY_REQS[ip]
    q.append(now)
    n = _security_prune_ip(ip, now)
    if n >= _SECURITY_REQ_SPIKE:
        score = max(score, 0.95)
        reasons.append("request_spike")
    elif n >= int(_SECURITY_REQ_SPIKE * 0.6):
        score = max(score, 0.78)
        reasons.append("elevated_rate")

    if method not in {"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"}:
        score = max(score, 0.6)
        reasons.append("unusual_method")

    return min(0.999, score), ",".join(reasons) if reasons else "ok"


def _security_metrics(now: float) -> dict[str, Any]:
    with _SECURITY_LOCK:
        blocked = list(_SECURITY_BLOCKED.values())
        blocked_count = len(blocked)
        alerts = int(_SECURITY_STATS.get("alerts", 0))
        total_requests = int(_SECURITY_STATS.get("total_requests", 0))
        blocked_requests = int(_SECURITY_STATS.get("blocked_requests", 0))
        last_event_ts = float(_SECURITY_STATS.get("last_event_ts", 0.0))

    top_ips: list[dict[str, Any]] = []
    for ip, _q in list(_SECURITY_REQS.items())[:5000]:
        n = _security_prune_ip(ip, now)
        if n:
            top_ips.append({"ip": ip, "rps": round(n / max(1, _SECURITY_REQ_WINDOW_S), 4), "count": n})
    top_ips.sort(key=lambda x: x["count"], reverse=True)

    risk = 0.0
    if blocked_count > 0:
        risk = max(risk, 0.75)
    if alerts > 0:
        risk = max(risk, min(0.95, 0.55 + (alerts / 25.0)))
    if top_ips and top_ips[0]["count"] >= int(_SECURITY_REQ_SPIKE * 0.6):
        risk = max(risk, 0.7)
    if last_event_ts and now - last_event_ts < 60:
        risk = max(risk, 0.65)

    return {
        "ts": now,
        "risk_score": round(risk, 4),
        "window_s": _SECURITY_REQ_WINDOW_S,
        "request_spike_threshold": _SECURITY_REQ_SPIKE,
        "total_requests": total_requests,
        "blocked_requests": blocked_requests,
        "alerts": alerts,
        "blocked_ips": blocked_count,
        "top_ips": top_ips[:8],
        "demo": {"pqc": _SECURITY_DEMO_PQC},
    }

# ── In-memory fallback store (used when no DB path is configured) ──────────
_rate_store: dict = defaultdict(deque)
_CLEANUP_INTERVAL = 500
_request_counter = 0
_rate_lock = threading.Lock()

# ── SQLite-backed persistent store (optional) ─────────────────────────────
_rate_db: sqlite3.Connection | None = None
if _RATE_LIMIT_DB_PATH:
    try:
        _rate_db = sqlite3.connect(_RATE_LIMIT_DB_PATH, check_same_thread=False)
        _rate_db.execute("PRAGMA journal_mode=WAL")
        _rate_db.execute("CREATE TABLE IF NOT EXISTS rate_hits (ip TEXT NOT NULL, ts REAL NOT NULL)")
        _rate_db.execute("CREATE INDEX IF NOT EXISTS idx_rate_ip_ts ON rate_hits (ip, ts)")
        _rate_db.commit()
        logger.info("Persistent rate limiting enabled: %s", _RATE_LIMIT_DB_PATH)
    except Exception as exc:
        logger.warning("Could not open rate-limit DB (%s): %s — falling back to in-memory", _RATE_LIMIT_DB_PATH, exc)
        _rate_db = None


def _get_client_ip(request: Request) -> str:
    """استخرج عنوان IP الحقيقي مع دعم البروكسيات العكسية.

    يُستخدم آخر عنوان في X-Forwarded-For لأنه يُضاف بواسطة البروكسي الموثوق
    ولا يمكن للعميل انتحاله، مما يمنع تجاوز حدود المعدل عبر تزوير العنوان.
    """
    forwarded_for = request.headers.get("X-Forwarded-For", "").strip()
    if forwarded_for:
        # آخر عنوان في القائمة هو المصدر الذي أضافه البروكسي الموثوق
        return forwarded_for.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(request: Request) -> bool:
    """يُعيد True إذا كان الطلب مسموحاً به، وFalse إذا تجاوز الحد."""
    if (request.client and request.client.host == "testclient") and not request.headers.get("X-Forwarded-For"):
        return True
    if _rate_db is not None:
        return _check_rate_limit_persistent(request)
    return _check_rate_limit_memory(request)


def _check_rate_limit_memory(request: Request) -> bool:
    """In-memory rate limiting (original implementation)."""
    global _request_counter
    client_ip = _get_client_ip(request)
    now = time.monotonic()
    window_start = now - _RATE_LIMIT_WINDOW
    with _rate_lock:
        q = _rate_store[client_ip]
        while q and q[0] <= window_start:
            q.popleft()
        if len(q) >= _RATE_LIMIT_REQUESTS:
            return False
        q.append(now)

        # تنظيف دوري: احذف مدخلات IPs التي لم تُستخدم منذ نافذة كاملة
        _request_counter += 1
        if _request_counter % _CLEANUP_INTERVAL == 0:
            stale_ips = [ip for ip, ts in list(_rate_store.items()) if len(ts) == 0 or ts[-1] < window_start]
            for ip in stale_ips:
                del _rate_store[ip]

    return True


def _check_rate_limit_persistent(request: Request) -> bool:
    """SQLite-backed rate limiting — state survives server restarts.

    On DB error, falls back to the in-memory limiter so protection is never lost.
    """
    assert _rate_db is not None
    client_ip = _get_client_ip(request)
    now = time.time()
    window_start = now - _RATE_LIMIT_WINDOW
    with _rate_lock:
        try:
            # Periodic cleanup — only purge old rows every CLEANUP_INTERVAL requests
            global _request_counter
            _request_counter += 1
            if _request_counter % _CLEANUP_INTERVAL == 0:
                _rate_db.execute("DELETE FROM rate_hits WHERE ts < ?", (window_start,))

            row = _rate_db.execute(
                "SELECT COUNT(*) FROM rate_hits WHERE ip = ? AND ts >= ?",
                (client_ip, window_start),
            ).fetchone()
            count = row[0] if row else 0
            if count >= _RATE_LIMIT_REQUESTS:
                _rate_db.commit()
                return False
            _rate_db.execute(
                "INSERT INTO rate_hits (ip, ts) VALUES (?, ?)",
                (client_ip, now),
            )
            _rate_db.commit()
        except Exception:
            logger.exception("Rate-limit DB error — falling back to in-memory limiter")
            return _check_rate_limit_memory(request)
    return True


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    now = _security_now()
    client_ip = _get_client_ip(request)
    ua = request.headers.get("user-agent", "")
    path = request.url.path
    method = request.method

    with _SECURITY_LOCK:
        _SECURITY_STATS["total_requests"] = int(_SECURITY_STATS.get("total_requests", 0)) + 1

    blocked = _security_is_blocked(client_ip, now)
    if blocked:
        with _SECURITY_LOCK:
            _SECURITY_STATS["blocked_requests"] = int(_SECURITY_STATS.get("blocked_requests", 0)) + 1
        _security_event(
            ts=now,
            category="firewall",
            severity="high",
            ip=client_ip,
            method=method,
            path=path,
            ua=ua,
            score=float(blocked.get("score", 1.0)),
            reason=f"blocked:{blocked.get('reason','policy')}",
            status_code=403,
        )
        return JSONResponse(status_code=403, content={"detail": "Blocked by adaptive firewall"})

    score, reason = _security_score(
        client_ip,
        method,
        f"{path}?{request.url.query}" if request.url.query else path,
        ua,
        now,
    )
    if score >= _SECURITY_ALERT_THRESHOLD:
        severity = "critical" if score >= 0.95 else "high" if score >= 0.85 else "medium"
        _security_event(
            ts=now,
            category="threat_detection",
            severity=severity,
            ip=client_ip,
            method=method,
            path=path,
            ua=ua,
            score=score,
            reason=reason,
        )
        if score >= _SECURITY_BLOCK_THRESHOLD:
            _security_block_ip(client_ip, now, _SECURITY_BLOCK_SECONDS, reason, score)

    if request.method in {"POST", "PUT", "PATCH"}:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > _MAX_BODY_BYTES:
                    return JSONResponse(status_code=413, content={"detail": "Request entity too large"})
            except Exception:
                return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})
    if not _check_rate_limit(request):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."},
            headers={"Retry-After": str(_RATE_LIMIT_WINDOW)},
        )
    resp = await call_next(request)
    if resp.status_code >= 500:
        _security_event(
            ts=_security_now(),
            category="server",
            severity="medium",
            ip=client_ip,
            method=method,
            path=path,
            ua=ua,
            score=0.55,
            reason="server_error",
            status_code=resp.status_code,
        )
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Referrer-Policy", "no-referrer")
    resp.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    resp.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    if _APP_ENV == "production":
        resp.headers.setdefault(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload",
        )
    return resp


class ProcessRequest(BaseModel):
    input: str
    context: dict[str, Any] = {}


@app.get("/health")
def health() -> dict:
    t0 = time.monotonic()

    shield_stats = security_shield.stats()

    # ── Database check ────────────────────────────────────────────
    db_ok = True
    db_error: str | None = None
    if _rate_db is not None:
        try:
            _rate_db.execute("SELECT 1")
        except Exception:
            db_ok = False
            db_error = "connection_failed"

    # ── Memory usage ──────────────────────────────────────────────
    mem_mb: float | None = None
    try:
        import resource

        rss_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        # macOS returns bytes, Linux returns KB
        import platform

        mem_mb = round(rss_kb / (1024 * 1024), 1) if platform.system() == "Darwin" else round(rss_kb / 1024, 1)
    except (ImportError, AttributeError):
        pass  # resource module unavailable (Windows)

    # ── Uptime ────────────────────────────────────────────────────
    uptime_s = round(time.monotonic() - _start_time, 1)

    response_ms = round((time.monotonic() - t0) * 1000, 2)

    return {
        "status": "ok" if db_ok else "degraded",
        "uptime_s": uptime_s,
        "response_ms": response_ms,
        "memory_mb": mem_mb,
        "database": {"ok": db_ok, "error": db_error},
        "blackbody": {"available": _blackbody is not None, "error": _blackbody_error},
        "learning": {"total_events": learning.summary(top=1).get("total_events", 0)},
        "security_shield": shield_stats,
    }


class SecurityFirewallBlockRequest(BaseModel):
    ip: str = Field(..., max_length=64)
    seconds: int = Field(default=900, ge=1, le=86400)
    reason: str = Field(default="manual", max_length=120)


class SecurityFirewallUnblockRequest(BaseModel):
    ip: str = Field(..., max_length=64)


class SecurityPQCEncryptRequest(BaseModel):
    plaintext: str = Field(..., max_length=20000)
    aad: str | None = Field(default="", max_length=2000)


class SecurityPQCDecryptRequest(BaseModel):
    envelope: dict[str, Any]
    aad: str | None = Field(default="", max_length=2000)


def _pqc_demo_keystream(key: bytes, nonce: bytes, nbytes: int) -> bytes:
    out = bytearray()
    counter = 0
    while len(out) < nbytes:
        counter_bytes = counter.to_bytes(4, "big")
        out.extend(hashlib.sha256(key + nonce + counter_bytes).digest())
        counter += 1
    return bytes(out[:nbytes])


def _pqc_demo_encrypt(plaintext: bytes, aad: bytes) -> dict[str, Any]:
    seed = (os.environ.get("KEM_MASTER_SEED") or "dev-seed-not-for-production").encode()
    nonce = secrets.token_bytes(16)
    key = hashlib.sha256(seed + nonce).digest()
    ct = bytes(a ^ b for a, b in zip(plaintext, _pqc_demo_keystream(key, nonce, len(plaintext)), strict=False))
    tag = hmac.new(key, aad + ct, hashlib.sha256).digest()
    return {
        "alg": "PQC-DEMO-ENVELOPE",
        "nonce_b64": base64.b64encode(nonce).decode(),
        "ct_b64": base64.b64encode(ct).decode(),
        "tag_b64": base64.b64encode(tag).decode(),
        "ts": time.time(),
    }


def _pqc_demo_decrypt(envelope: dict[str, Any], aad: bytes) -> bytes:
    nonce = base64.b64decode(envelope.get("nonce_b64", ""))
    ct = base64.b64decode(envelope.get("ct_b64", ""))
    tag = base64.b64decode(envelope.get("tag_b64", ""))
    seed = (os.environ.get("KEM_MASTER_SEED") or "dev-seed-not-for-production").encode()
    key = hashlib.sha256(seed + nonce).digest()
    expected = hmac.new(key, aad + ct, hashlib.sha256).digest()
    if not hmac.compare_digest(expected, tag):
        raise ValueError("tag_mismatch")
    return bytes(a ^ b for a, b in zip(ct, _pqc_demo_keystream(key, nonce, len(ct)), strict=False))


@app.get("/api/security/metrics", tags=["Security Center"])
def security_metrics(limit: int = Query(30, ge=0, le=200)) -> dict[str, Any]:
    now = _security_now()
    metrics = _security_metrics(now)
    with _SECURITY_LOCK:
        events = list(_SECURITY_EVENTS)[-limit:] if limit else []
        blocked = list(_SECURITY_BLOCKED.values())
    return {"metrics": metrics, "events": events[::-1], "firewall": {"blocked": blocked}}


@app.get("/api/security/events", tags=["Security Center"])
def security_events(limit: int = Query(60, ge=1, le=500)) -> dict[str, Any]:
    with _SECURITY_LOCK:
        events = list(_SECURITY_EVENTS)[-limit:]
    return {"events": events[::-1]}


@app.get("/api/security/firewall", tags=["Security Center"])
def security_firewall() -> dict[str, Any]:
    now = _security_now()
    with _SECURITY_LOCK:
        blocked = [b for b in _SECURITY_BLOCKED.values() if float(b.get("until", 0.0)) > now]
    blocked.sort(key=lambda x: float(x.get("until", 0.0)), reverse=True)
    return {"blocked": blocked, "window_s": _SECURITY_BLOCK_SECONDS}


@app.post("/api/security/firewall/block", tags=["Security Center"])
def security_firewall_block(req: SecurityFirewallBlockRequest) -> dict[str, Any]:
    now = _security_now()
    _security_block_ip(req.ip.strip(), now, req.seconds, req.reason.strip() or "manual", 1.0)
    _security_event(
        ts=now,
        category="firewall",
        severity="high",
        ip=req.ip.strip(),
        method="ADMIN",
        path="/api/security/firewall/block",
        ua="",
        score=1.0,
        reason=f"manual:{req.reason.strip() or 'manual'}",
        status_code=200,
    )
    return {"ok": True}


@app.post("/api/security/firewall/unblock", tags=["Security Center"])
def security_firewall_unblock(req: SecurityFirewallUnblockRequest) -> dict[str, Any]:
    ip = req.ip.strip()
    with _SECURITY_LOCK:
        existed = ip in _SECURITY_BLOCKED
        if existed:
            del _SECURITY_BLOCKED[ip]
    now = _security_now()
    _security_event(
        ts=now,
        category="firewall",
        severity="medium",
        ip=ip,
        method="ADMIN",
        path="/api/security/firewall/unblock",
        ua="",
        score=0.4,
        reason="manual_unblock" if existed else "manual_unblock_noop",
        status_code=200,
    )
    return {"ok": True, "existed": existed}


@app.get("/api/security/predict", tags=["Security Center"])
def security_predict(window_s: int = Query(900, ge=60, le=86400)) -> dict[str, Any]:
    now = _security_now()
    cutoff = now - float(window_s)
    with _SECURITY_LOCK:
        events = [e for e in list(_SECURITY_EVENTS) if float(e.get("ts", 0.0)) >= cutoff]
    by_reason: dict[str, int] = {}
    by_path: dict[str, int] = {}
    by_ip: dict[str, int] = {}
    for e in events:
        by_reason[e.get("reason", "unknown")] = by_reason.get(e.get("reason", "unknown"), 0) + 1
        by_path[e.get("path", "unknown")] = by_path.get(e.get("path", "unknown"), 0) + 1
        by_ip[e.get("ip", "unknown")] = by_ip.get(e.get("ip", "unknown"), 0) + 1
    def top(d):
        return sorted(({"key": k, "count": v} for k, v in d.items()), key=lambda x: x["count"], reverse=True)[:8]
    metrics = _security_metrics(now)
    forecast = "low"
    if metrics["risk_score"] >= 0.85:
        forecast = "high"
    elif metrics["risk_score"] >= 0.65:
        forecast = "medium"
    return {
        "window_s": window_s,
        "forecast": forecast,
        "risk_score": metrics["risk_score"],
        "top_reasons": top(by_reason),
        "top_paths": top(by_path),
        "top_ips": top(by_ip),
    }


@app.get("/api/security/report", tags=["Security Center"])
def security_report(window_s: int = Query(3600, ge=60, le=86400)) -> dict[str, Any]:
    now = _security_now()
    cutoff = now - float(window_s)
    with _SECURITY_LOCK:
        events = [e for e in list(_SECURITY_EVENTS) if float(e.get("ts", 0.0)) >= cutoff]
        blocked = list(_SECURITY_BLOCKED.values())
    metrics = _security_metrics(now)
    return {
        "generated_at": now,
        "window_s": window_s,
        "metrics": metrics,
        "firewall": {"blocked": blocked},
        "events": events[::-1][:200],
    }


@app.get("/api/security/stream", tags=["Security Center"])
async def security_stream():
    async def gen():
        last_push = 0.0
        last_seen_ts = 0.0
        while True:
            now = _security_now()
            payload: dict[str, Any] = {"metrics": _security_metrics(now)}
            with _SECURITY_LOCK:
                tail = list(_SECURITY_EVENTS)[-20:]
            newest_ts = tail[-1]["ts"] if tail else 0.0
            if newest_ts and newest_ts != last_seen_ts:
                last_seen_ts = newest_ts
                payload["events"] = tail[::-1]
            if now - last_push >= 2.0:
                last_push = now
                data = json.dumps(payload, ensure_ascii=False)
                yield f"data: {data}\n\n"
            await asyncio.sleep(0.35)

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.post("/api/security/pqc/encrypt", tags=["Security Center"])
def security_pqc_encrypt(req: SecurityPQCEncryptRequest) -> dict[str, Any]:
    if not _SECURITY_DEMO_PQC:
        raise HTTPException(status_code=501, detail="PQC demo is disabled")
    aad = (req.aad or "").encode()
    env = _pqc_demo_encrypt(req.plaintext.encode(), aad)
    return {"envelope": env}


@app.post("/api/security/pqc/decrypt", tags=["Security Center"])
def security_pqc_decrypt(req: SecurityPQCDecryptRequest) -> dict[str, Any]:
    if not _SECURITY_DEMO_PQC:
        raise HTTPException(status_code=501, detail="PQC demo is disabled")
    aad = (req.aad or "").encode()
    try:
        pt = _pqc_demo_decrypt(req.envelope, aad)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid envelope")
    return {"plaintext": pt.decode(errors="replace")}


_ENABLE_RUNTIME_SECRET_CONFIG = (os.environ.get("ENABLE_RUNTIME_SECRET_CONFIG") or "").strip() == "1"
_ADMIN_ACCESS_CODE = (os.environ.get("ADMIN_ACCESS_CODE") or "").strip()


class OpenRouterRuntimeConfigRequest(BaseModel):
    api_key: str = Field(..., min_length=10, max_length=240)
    model: str | None = Field(default=None, max_length=120)


def _require_admin_runtime_config(request: Request) -> None:
    if not _ENABLE_RUNTIME_SECRET_CONFIG:
        raise HTTPException(status_code=403, detail="Runtime secret config is disabled")
    if not _ADMIN_ACCESS_CODE:
        raise HTTPException(status_code=503, detail="Admin access is not configured")
    code = (request.headers.get("X-Admin-Code") or "").strip()
    if not secrets.compare_digest(code, _ADMIN_ACCESS_CODE):
        raise HTTPException(status_code=403, detail="Forbidden")


@app.get("/api/admin/openrouter/status", tags=["Admin"])
def admin_openrouter_status(request: Request) -> dict[str, Any]:
    _require_admin_runtime_config(request)
    model = (os.environ.get("OPENROUTER_MODEL") or "").strip()
    has_key = bool((os.environ.get("OPENROUTER_API_KEY") or "").strip())
    return {"provider": "openrouter", "enabled": True, "has_key": has_key, "model": model}


@app.post("/api/admin/openrouter/config", tags=["Admin"])
def admin_openrouter_config(req: OpenRouterRuntimeConfigRequest, request: Request) -> dict[str, Any]:
    _require_admin_runtime_config(request)
    key = req.api_key.strip()
    model = (req.model or "").strip()
    os.environ["OPENROUTER_API_KEY"] = key
    if model:
        os.environ["OPENROUTER_MODEL"] = model
    return {"ok": True, "provider": "openrouter", "has_key": True, "model": (os.environ.get("OPENROUTER_MODEL") or "").strip()}


# ── Security Engine Service API (v1) ─────────────────────────────────────────


class ScanFingerprintRequest(BaseModel):
    """طلب فحص بصمة كمومية"""

    source_ip: str = Field(..., min_length=7, max_length=45, description="عنوان IP المصدر")
    seed: str | None = Field(default=None, max_length=100, description="Seed اختياري للتوليد المحدد")


class ScanFingerprintResponse(BaseModel):
    """استجابة فحص البصمة الكمومية"""

    fingerprint: dict[str, Any] = Field(..., description="البصمة الكمومية")
    detection_time_ms: float = Field(..., description="وقت الكشف بالملي ثانية")
    ok: bool = True


class EncryptMultiPathRequest(BaseModel):
    """طلب تشفير متعدد المسارات"""

    target_url: str = Field(..., min_length=10, max_length=500, description="عنوان URL الهدف")
    path_count: int = Field(default=5, ge=1, le=20, description="عدد المسارات")


class EncryptMultiPathResponse(BaseModel):
    """استجابة التشفير متعدد المسارات"""

    result: dict[str, Any] = Field(..., description="نتيجة التشفير")
    encryption_time_ms: float = Field(..., description="وقت التشفير بالملي ثانية")
    ok: bool = True


@app.post("/api/v1/security/scan_fingerprint", tags=["Security Engine"], response_model=ScanFingerprintResponse)
def api_scan_fingerprint(req: ScanFingerprintRequest) -> ScanFingerprintResponse:
    """
    فحص بصمة كمومية لعنوان IP

    يولد بصمة كمومية فريدة بناءً على:
    - مصفوفة الكثافة (Density Matrix)
    - الطور الكمومي (Quantum Phase)
    - مستوى التشابك (Entanglement Level)

    ويُصنّف التهديد تلقائياً إلى: legitimate | suspicious | malicious | unknown

    **تحسين الأداء**: يستخدم Redis caching لتسريع الطلبات المتكررة
    """
    # 1. توليد مفتاح الـ cache
    cache_key = generate_fingerprint_key(req.source_ip, req.seed)

    # 2. محاولة الحصول على البيانات من الـ cache (CACHE HIT)
    cached_result = get_cache(cache_key)
    if cached_result:
        logger.info(
            "fingerprint_cache_hit",
            source_ip=req.source_ip,
            cache_key=cache_key,
            msg="✅ Returning cached fingerprint result",
        )
        return ScanFingerprintResponse(
            fingerprint=cached_result["fingerprint"],
            detection_time_ms=cached_result["detection_time_ms"],
        )

    # 3. CACHE MISS - إجراء الحساب الفعلي
    logger.info(
        "fingerprint_cache_miss",
        source_ip=req.source_ip,
        cache_key=cache_key,
        msg="🔍 Cache miss - performing quantum fingerprint calculation",
    )

    engine = get_security_engine()
    fingerprint, detection_time_ms = engine.scan_fingerprint(req.source_ip, req.seed)

    # 4. إعداد الاستجابة
    fingerprint_dict = {
        "id": fingerprint.id,
        "source_ip": fingerprint.source_ip,
        "state_signature": fingerprint.state_signature,
        "entanglement_level": fingerprint.entanglement_level,
        "quantum_phase": fingerprint.quantum_phase,
        "density_matrix": fingerprint.density_matrix,
        "confidence": fingerprint.confidence,
        "classification": fingerprint.classification.value,
        "timestamp": fingerprint.timestamp,
        "metadata": fingerprint.metadata,
    }

    # 5. تخزين النتيجة في الـ cache (صلاحية: ساعة واحدة)
    cache_data = {
        "fingerprint": fingerprint_dict,
        "detection_time_ms": round(detection_time_ms, 2),
    }
    set_cache(cache_key, cache_data, expiry_seconds=3600)

    return ScanFingerprintResponse(
        fingerprint=fingerprint_dict,
        detection_time_ms=round(detection_time_ms, 2),
    )


@app.post("/api/v1/security/encrypt_multipath", tags=["Security Engine"], response_model=EncryptMultiPathResponse)
def api_encrypt_multipath(req: EncryptMultiPathRequest) -> EncryptMultiPathResponse:
    """
    تشفير باستخدام مسارات متعددة

    يُنشئ مسارات تشفير متعددة باستخدام خوارزميات PQC مختلفة:
    - CRYSTALS-Kyber-1024
    - CRYSTALS-Dilithium-5
    - SPHINCS+-SHA2-256f
    - Classic-McEliece-6960119
    - BIKE-L3
    - HQC-256

    يوفر:
    - تكرار عالي (High Redundancy)
    - احتمال نجاح مرتفع (High Success Probability)
    - أمان مُجمّع قوي (Strong Combined Security)

    **تحسين الأداء**: يستخدم Redis caching لتسريع توليد المسارات المتكررة
    """
    # 1. توليد مفتاح الـ cache
    cache_key = generate_multipath_key(req.target_url, req.path_count)

    # 2. محاولة الحصول على البيانات من الـ cache (CACHE HIT)
    cached_result = get_cache(cache_key)
    if cached_result:
        logger.info(
            "multipath_cache_hit",
            target_url=req.target_url,
            path_count=req.path_count,
            cache_key=cache_key,
            msg="✅ Returning cached multipath encryption result",
        )
        return EncryptMultiPathResponse(
            result=cached_result["result"],
            encryption_time_ms=cached_result["encryption_time_ms"],
        )

    # 3. CACHE MISS - إجراء التوليد الفعلي
    logger.info(
        "multipath_cache_miss",
        target_url=req.target_url,
        path_count=req.path_count,
        cache_key=cache_key,
        msg="🔍 Cache miss - generating multipath encryption",
    )

    engine = get_security_engine()
    result, encryption_time_ms = engine.encrypt_multipath(req.target_url, req.path_count)

    # 4. إعداد الاستجابة
    result_dict = {
        "paths": [
            {
                "path_id": p.path_id,
                "algorithm": p.algorithm.value,
                "hop_count": p.hop_count,
                "latency_ms": p.latency_ms,
                "error_rate": p.error_rate,
                "security_strength": p.security_strength,
                "status": p.status.value,
            }
            for p in result.paths
        ],
        "primary_path": result.primary_path,
        "backup_paths": result.backup_paths,
        "redundancy_factor": result.redundancy_factor,
        "success_probability": result.success_probability,
        "combined_security": result.combined_security,
        "timestamp": result.timestamp,
    }

    # 5. تخزين النتيجة في الـ cache (صلاحية: 30 دقيقة)
    # المسارات قد تتغير، لذا صلاحية أقصر من البصمات
    cache_data = {
        "result": result_dict,
        "encryption_time_ms": round(encryption_time_ms, 2),
    }
    set_cache(cache_key, cache_data, expiry_seconds=1800)

    return EncryptMultiPathResponse(
        result=result_dict,
        encryption_time_ms=round(encryption_time_ms, 2),
    )


@app.get("/api/v1/security/metrics/performance", tags=["Security Engine"])
def api_security_metrics_performance() -> dict[str, Any]:
    """
    الحصول على مقاييس الأداء الشاملة

    يتضمن:
    - إجمالي الفحوصات والتهديدات المكتشفة
    - معدل الإيجابيات الخاطئة (False Positive Rate)
    - متوسط أوقات الكشف والاستجابة
    - إحصائيات التشفير
    - وقت التشغيل (Uptime)
    - **جديد**: إحصائيات Redis Cache
    """
    engine = get_security_engine()
    metrics = engine.get_performance_metrics()

    # الحصول على إحصائيات الـ cache
    cache_stats = get_cache_stats()

    return {
        "ok": True,
        "metrics": {
            "total_scans": metrics.total_scans,
            "threats_detected": metrics.threats_detected,
            "false_positives": metrics.false_positives,
            "false_positive_rate": metrics.false_positive_rate,
            "avg_detection_time_ms": metrics.avg_detection_time_ms,
            "avg_response_time_ms": metrics.avg_response_time_ms,
            "total_encryptions": metrics.total_encryptions,
            "avg_encryption_time_ms": metrics.avg_encryption_time_ms,
            "uptime_seconds": metrics.uptime_seconds,
            "timestamp": metrics.timestamp,
        },
        "cache": cache_stats,
    }


@app.get("/api/v1/security/metrics/live", tags=["Security Engine"])
def api_security_metrics_live() -> dict[str, Any]:
    """
    بيانات لوحة القياس الحية (Live Dashboard)

    يوفر:
    - المقاييس الحالية
    - الأحداث الأخيرة (20 حدث)
    - إحصائيات المحركات
    - طابع زمني للتحديث

    مناسب للمراقبة المستمرة وتحديثات الوقت الفعلي
    """
    engine = get_security_engine()
    return {"ok": True, "dashboard": engine.get_live_dashboard_data()}


# ── Strategic Platform: AUTDIE Security ──────────────────────────────────────


class AUTDIERequest(BaseModel):
    kappa: float = Field(default=0.7854, ge=0.0, le=3.1416)
    lam: float = Field(default=1.0, ge=0.0, le=10.0)


@app.post("/api/autdie")
def autdie_compute(req: AUTDIERequest) -> dict[str, Any]:
    """Compute AUTDIE quantum security metrics."""
    import math

    sin_k = math.sin(req.kappa)
    sin_kappa_sq = sin_k * sin_k
    v_ent = 1.0
    s_autdie = math.tanh(sin_kappa_sq * v_ent)
    qber_autdie = 0.25 * math.exp(-sin_kappa_sq * v_ent)
    return {
        "S_AUTDIE": s_autdie,
        "QBER_AUTDIE": qber_autdie,
        "secure": s_autdie >= 0.35,
    }


# ── Strategic Platform: Al-Utaibi Equation v2.0 ─────────────────────────────


class AlUtaibiV2Request(BaseModel):
    r: float = Field(default=1.616e-35)
    rho_dm: float = Field(default=1.8e10, ge=0.0)
    rho_de: float = Field(default=1e-10, ge=0.0)


@app.post("/api/al-utaibi-v2")
def al_utaibi_v2(req: AlUtaibiV2Request) -> dict[str, Any]:
    """Compute Al-Utaibi Unified Cosmic Equation v2.0."""
    h = 6.626e-34
    nu = 5e9
    alpha = 25.3
    beta = 0.9985
    Q = 1.0
    k_dm = 0.26
    k_de = 0.70
    fine_tuning = 0.937
    planck_length = 1.616e-35

    E_basic = h * nu
    otaibi_factor = (1 + alpha * Q) * beta
    E_v1 = E_basic * otaibi_factor

    dark_correction = 1 + (k_dm * req.rho_dm) + (k_de * req.rho_de)
    qm_effect = 0.539 if req.r <= planck_length else 1.0

    E_total = E_v1 * dark_correction * qm_effect * fine_tuning

    return {
        "E_basic": E_basic,
        "otaibi_factor": otaibi_factor,
        "E_v1": E_v1,
        "dark_correction": dark_correction,
        "qm_effect": qm_effect,
        "E_total": E_total,
        "eV": E_total * 6.242e18,
    }


@app.post("/process")
def process(req: ProcessRequest) -> dict:
    allowed, reason = security_shield.check(req.input)
    if not allowed:
        raise HTTPException(status_code=400, detail=reason or "الإدخال مرفوض لأسباب أمنية")
    try:
        decision = engine.process(req.input, req.context)
        return {
            "decision_id": decision.decision_id,
            "intent": decision.intent.name,
            "recommended_action": decision.recommended_action,
            "ethics_score": decision.ethics_score,
            "ethics_violation": decision.ethics_violation.name,
            "confidence": decision.confidence,
            "execution_plan": decision.execution_plan,
        }
    except Exception:
        logger.exception("POST /process failed for input=%r", req.input[:80])
        raise HTTPException(status_code=500, detail="Internal server error")


class LearningErrorRequest(BaseModel):
    kind: str = Field("error", max_length=64)
    message: str = Field(..., max_length=500)
    url: str | None = Field("", max_length=2048)
    stack: str | None = Field("", max_length=4000)
    user_agent: str | None = Field("", max_length=320)
    release: str | None = Field("", max_length=128)
    ts: float | None = None
    context: dict[str, Any] = {}


@app.post("/api/learning/error")
def learning_error(req: LearningErrorRequest) -> dict[str, Any]:
    try:
        ts_val = float(req.ts) if req.ts is not None else time.time()
        ev = ErrorEvent(
            kind=req.kind or "error",
            message=req.message,
            url=req.url or "",
            stack=req.stack or "",
            user_agent=req.user_agent or "",
            release=req.release or "",
            ts=ts_val,
            context=req.context or {},
        )
        stored = learning.record_error(ev)
        return {"ok": True, **stored}
    except Exception as e:
        logger.error("learning_error record failed: %s", e)
        raise HTTPException(status_code=400, detail="Failed to record learning error")


@app.get("/api/learning/summary")
def learning_summary(top: int = Query(8, ge=1, le=100)) -> dict[str, Any]:
    try:
        return learning.summary(top=top)
    except Exception as e:
        logger.error("learning_summary error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to retrieve learning summary")


@app.get("/api/learning/metrics")
def learning_metrics(window_s: int = Query(3600, ge=1, le=86400), top: int = Query(6, ge=1, le=100)) -> dict[str, Any]:
    try:
        return learning.metrics(window_s=window_s, top=top)
    except Exception as e:
        logger.error("learning_metrics error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to retrieve learning metrics")


_LLM_MAX_TEXT_LENGTH = 4000


class LLMAnalyzeRequest(BaseModel):
    results: dict[str, Any]


class LLMAnalyzeResponse(BaseModel):
    provider: str
    text: str
    mode: str


def _local_llm_fallback(results: dict[str, Any]) -> str:
    fidelity = results.get("fidelity")
    energy = results.get("energy")
    parts: list[str] = []
    if fidelity is not None:
        try:
            parts.append(f"Fidelity: {float(fidelity) * 100:.2f}%")
        except Exception:
            parts.append("Fidelity: N/A")
    if energy is not None:
        try:
            parts.append(f"Energy: {float(energy):.6f} Ha")
        except Exception:
            parts.append("Energy: N/A")
    if not parts:
        return "تحليل محلي: البيانات لا تحتوي على مقاييس كافية. تأكد من تشغيل المحاكاة ثم أعد المحاولة."
    return "تحليل محلي: " + " — ".join(parts) + " — النظام يبدو مستقراً."


@app.post("/api/llm/gemini/analyze", response_model=LLMAnalyzeResponse)
async def gemini_analyze(req: LLMAnalyzeRequest) -> LLMAnalyzeResponse:
    key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not key:
        return LLMAnalyzeResponse(provider="gemini", text=_local_llm_fallback(req.results), mode="local_fallback")
    try:
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": "Analyze this quantum simulation result and return a brief technical insight.\n"
                            + str(req.results)[:12000]
                        }
                    ]
                }
            ]
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}"
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
        if not r.is_success:
            return LLMAnalyzeResponse(provider="gemini", text=_local_llm_fallback(req.results), mode="local_fallback")
        data = r.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if not isinstance(text, str) or not text.strip():
            return LLMAnalyzeResponse(provider="gemini", text=_local_llm_fallback(req.results), mode="local_fallback")
        return LLMAnalyzeResponse(provider="gemini", text=text.strip()[:_LLM_MAX_TEXT_LENGTH], mode="provider")
    except Exception:
        return LLMAnalyzeResponse(provider="gemini", text=_local_llm_fallback(req.results), mode="local_fallback")


@app.post("/api/llm/grok/analyze", response_model=LLMAnalyzeResponse)
async def grok_analyze(req: LLMAnalyzeRequest) -> LLMAnalyzeResponse:
    key = (os.environ.get("GROK_API_KEY") or "").strip()
    if not key:
        return LLMAnalyzeResponse(provider="grok", text=_local_llm_fallback(req.results), mode="local_fallback")
    try:
        payload = {
            "model": "grok-1",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a quantum computing expert analyzing simulation results from the QURABIA system.",
                },
                {
                    "role": "user",
                    "content": (
                        "Analyze this quantum telemetry and provide a brief technical insight: " + str(req.results)
                    )[:12000],
                },
            ],
            "stream": False,
            "temperature": 0.7,
        }
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.post(
                "https://api.x.ai/v1/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
            )
        if not r.is_success:
            return LLMAnalyzeResponse(provider="grok", text=_local_llm_fallback(req.results), mode="local_fallback")
        data = r.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not isinstance(text, str) or not text.strip():
            return LLMAnalyzeResponse(provider="grok", text=_local_llm_fallback(req.results), mode="local_fallback")
        return LLMAnalyzeResponse(provider="grok", text=text.strip()[:_LLM_MAX_TEXT_LENGTH], mode="provider")
    except Exception:
        return LLMAnalyzeResponse(provider="grok", text=_local_llm_fallback(req.results), mode="local_fallback")


@app.post("/api/llm/openrouter/analyze", response_model=LLMAnalyzeResponse)
async def openrouter_analyze(req: LLMAnalyzeRequest) -> LLMAnalyzeResponse:
    key = (os.environ.get("OPENROUTER_API_KEY") or "").strip()
    model = (os.environ.get("OPENROUTER_MODEL") or "openai/gpt-4o-mini").strip()
    if not key:
        return LLMAnalyzeResponse(provider="openrouter", text=_local_llm_fallback(req.results), mode="local_fallback")
    try:
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a quantum computing expert analyzing simulation results from the QURABIA system.",
                },
                {
                    "role": "user",
                    "content": (
                        "Analyze this quantum telemetry and provide a brief technical insight: " + str(req.results)
                    )[:12000],
                },
            ],
            "temperature": 0.7,
            "stream": False,
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        }
        referer = (os.environ.get("APP_PUBLIC_URL") or os.environ.get("APP_URL") or "https://qurabia.com").strip()
        if referer:
            headers["HTTP-Referer"] = referer
        headers["X-Title"] = "QURABIA"

        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
        if not r.is_success:
            return LLMAnalyzeResponse(
                provider="openrouter", text=_local_llm_fallback(req.results), mode="local_fallback"
            )
        data = r.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not isinstance(text, str) or not text.strip():
            return LLMAnalyzeResponse(
                provider="openrouter", text=_local_llm_fallback(req.results), mode="local_fallback"
            )
        return LLMAnalyzeResponse(provider="openrouter", text=text.strip()[:_LLM_MAX_TEXT_LENGTH], mode="provider")
    except Exception:
        return LLMAnalyzeResponse(provider="openrouter", text=_local_llm_fallback(req.results), mode="local_fallback")


# ── AI Analytics: تحليل ذكي شامل للنتائج ────────────────────────────────────


class AnalyticsRequest(BaseModel):
    total_simulations: int = Field(0, ge=0)
    avg_energy: float = 0.0
    avg_fidelity: float = 0.0
    best_energy: float = 0.0
    best_fidelity: float = 0.0
    type_distribution: dict[str, int] = {}
    overall_score: int = Field(0, ge=0, le=100)
    insight_count: int = Field(0, ge=0)
    critical_insights: int = Field(0, ge=0)


class AnalyticsResponse(BaseModel):
    provider: str
    analysis: str
    recommendations: list[str]
    score_assessment: str
    mode: str


def _local_analytics_fallback(req: AnalyticsRequest) -> AnalyticsResponse:
    """تحليل محلي عند عدم توفر مفتاح AI."""
    parts: list[str] = []
    recommendations: list[str] = []

    if req.total_simulations == 0:
        return AnalyticsResponse(
            provider="local",
            analysis="لم يتم تسجيل أي محاكاة بعد. قم بتشغيل محاكاة للحصول على تحليل ذكي.",
            recommendations=["ابدأ بمحاكاة نوع PHYSICS لاختبار معادلة العتيبي الموحدة."],
            score_assessment="غير متاح",
            mode="local_fallback",
        )

    parts.append(f"تم تحليل {req.total_simulations} محاكاة بنجاح.")

    if req.avg_energy != 0:
        parts.append(f"متوسط الطاقة: {req.avg_energy:.6f} Ha.")
    if req.avg_fidelity != 0:
        parts.append(f"متوسط الدقة: {req.avg_fidelity:.2f}%.")

    if req.avg_fidelity < 95:
        recommendations.append("الدقة أقل من 95% — يُوصى بتحسين معايرة البوابات الكمومية.")
    if req.critical_insights > 0:
        recommendations.append(f"يوجد {req.critical_insights} تنبيه حرج يحتاج مراجعة فورية.")
    if len(req.type_distribution) < 3:
        recommendations.append("جرب أنواع محاكاة مختلفة لتوسيع نطاق التحليل.")

    if not recommendations:
        recommendations.append("النظام يعمل بشكل مثالي. استمر في التجريب والاستكشاف.")

    score_text = (
        "ممتاز"
        if req.overall_score >= 80
        else "جيد"
        if req.overall_score >= 60
        else "مقبول"
        if req.overall_score >= 40
        else "يحتاج تحسين"
    )

    return AnalyticsResponse(
        provider="local",
        analysis=" ".join(parts),
        recommendations=recommendations,
        score_assessment=score_text,
        mode="local_fallback",
    )


@app.post("/api/analytics/analyze", response_model=AnalyticsResponse)
async def analytics_analyze(req: AnalyticsRequest) -> AnalyticsResponse:
    """تحليل ذكي شامل لنتائج المحاكاة باستخدام AI أو fallback محلي."""
    # محاولة استخدام Grok أولاً
    for provider_name, env_key, api_url, build_payload in [
        (
            "grok",
            "GROK_API_KEY",
            "https://api.x.ai/v1/chat/completions",
            lambda k: {
                "model": "grok-1",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "أنت خبير في الحوسبة الكمومية تعمل في منصة QURABIA. "
                            "حلل النتائج التالية وقدم تحليلاً تقنياً شاملاً بالعربية "
                            "مع توصيات عملية. كن محدداً ودقيقاً."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"حلل هذه البيانات الإحصائية للمحاكاات الكمومية:\n"
                            f"عدد المحاكاات: {req.total_simulations}\n"
                            f"متوسط الطاقة: {req.avg_energy:.6f} Ha\n"
                            f"متوسط الدقة: {req.avg_fidelity:.2f}%\n"
                            f"أفضل طاقة: {req.best_energy:.6f} Ha\n"
                            f"أفضل دقة: {req.best_fidelity:.2f}%\n"
                            f"أنواع المحاكاة: {req.type_distribution}\n"
                            f"التقييم الشامل: {req.overall_score}/100\n"
                            f"عدد التنبيهات الحرجة: {req.critical_insights}"
                        ),
                    },
                ],
                "stream": False,
                "temperature": 0.7,
            },
        ),
        (
            "gemini",
            "GEMINI_API_KEY",
            None,  # URL مختلف لـ Gemini
            None,
        ),
    ]:
        key = (os.environ.get(env_key) or "").strip()
        if not key:
            continue
        try:
            if provider_name == "gemini":
                gemini_payload = {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": (
                                        f"حلل نتائج المحاكاات الكمومية التالية وقدم تحليلاً تقنياً بالعربية:\n"
                                        f"عدد المحاكاات: {req.total_simulations}, "
                                        f"متوسط الطاقة: {req.avg_energy:.6f} Ha, "
                                        f"متوسط الدقة: {req.avg_fidelity:.2f}%, "
                                        f"التقييم: {req.overall_score}/100"
                                    )
                                }
                            ]
                        }
                    ]
                }
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}"
                async with httpx.AsyncClient(timeout=12.0) as client:
                    r = await client.post(url, json=gemini_payload, headers={"Content-Type": "application/json"})
                if not r.is_success:
                    continue
                data = r.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            else:
                payload = build_payload(key)
                async with httpx.AsyncClient(timeout=12.0) as client:
                    r = await client.post(
                        api_url,
                        json=payload,
                        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
                    )
                if not r.is_success:
                    continue
                data = r.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            if isinstance(text, str) and text.strip():
                return AnalyticsResponse(
                    provider=provider_name,
                    analysis=text.strip()[:_LLM_MAX_TEXT_LENGTH],
                    recommendations=[],
                    score_assessment="",
                    mode="provider",
                )
        except Exception:
            continue

    return _local_analytics_fallback(req)


class BlackbodyRequest(BaseModel):
    temperature_K: float = Field(
        ...,
        ge=1,
        le=100_000,
        description="درجة الحرارة بالكلفن (1–100,000 K)",
    )
    nu_min: float = Field(1e9, gt=0, description="أدنى تردد هرتز")
    nu_max: float = Field(1e14, gt=0, description="أقصى تردد هرتز")
    n_points: int = Field(200, ge=10, le=5000, description="عدد نقاط الطيف (10–5000)")
    enable_qed: bool | None = True
    enable_lqg: bool | None = True
    enable_gup: bool | None = True
    sz_y_param: float | None = 1e-4
    cavity_radius_m: float | None = 0.02
    gup_beta0: float | None = 1.0
    lqg_C2: float | None = 1.0

    @model_validator(mode="after")
    def _validate_ranges(self) -> "BlackbodyRequest":
        if self.nu_max <= self.nu_min:
            raise ValueError("nu_max must be > nu_min")
        if not (1 <= self.temperature_K <= 100_000):
            raise ValueError("temperature_K must be in [1, 100000] K")
        return self


class GenesisPopulationRequest(BaseModel):
    size_per_type: int = Field(3, ge=1, le=100)
    seed: int | None = None


class GenesisDNAIn(BaseModel):
    algorithm_type: str
    genes: dict[str, Any]
    generation: int = 0
    fitness: float = 0.0
    age: int = 0
    parent_fitness: float = 0.0
    id: str | None = None


class GenesisMutateRequest(BaseModel):
    dna: GenesisDNAIn
    mutation_rate: float = Field(0.3, ge=0.0, le=1.0)


class GenesisCrossoverRequest(BaseModel):
    parent_a: GenesisDNAIn
    parent_b: GenesisDNAIn


class GenesisEvolveRequest(BaseModel):
    population: list[GenesisDNAIn] = Field(..., min_length=2, max_length=500)
    mutation_rate: float = Field(0.3, ge=0.0, le=1.0)
    elite_fraction: float = Field(0.2, ge=0.0, le=0.5)
    tournament_size: int = Field(3, ge=2, le=20)


@app.post("/api/blackbody/spectrum")
def blackbody_spectrum(req: BlackbodyRequest) -> dict[str, Any]:
    if _blackbody_error is not None:
        raise HTTPException(status_code=503, detail="Blackbody engine unavailable")
    try:
        from blackbody import BlackbodyEngine

        engine = BlackbodyEngine()
        engine.enable_qed = bool(req.enable_qed)
        engine.enable_lqg = bool(req.enable_lqg)
        engine.enable_gup = bool(req.enable_gup)
        engine.sz_y_param = float(req.sz_y_param or 1e-4)
        engine.cavity_radius_m = float(req.cavity_radius_m or 0.02)
        engine.gup_beta0 = float(req.gup_beta0 or 1.0)
        engine.lqg_C2 = float(req.lqg_C2 or 1.0)
        return engine.spectrum(req.temperature_K, req.nu_min, req.nu_max, req.n_points)
    except Exception as e:
        logger.error("blackbody_spectrum error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to compute blackbody spectrum")


@app.post("/api/genesis/population")
def genesis_population(req: GenesisPopulationRequest) -> dict[str, Any]:
    try:
        population = genesis.create_population(size_per_type=req.size_per_type, seed=req.seed)
        return {"size": len(population), "population": [d.to_dict() for d in population]}
    except Exception as e:
        logger.error("genesis_population error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to create genesis population")


@app.post("/api/genesis/mutate")
def genesis_mutate(req: GenesisMutateRequest) -> dict[str, Any]:
    try:
        dna = GenesisAlgorithmDNA(
            algorithm_type=req.dna.algorithm_type,
            genes=req.dna.genes,
            generation=req.dna.generation,
            fitness=req.dna.fitness,
            age=req.dna.age,
            parent_fitness=req.dna.parent_fitness,
            id=req.dna.id or f"dna_{req.dna.algorithm_type}",
        )
        child = dna.mutate(mutation_rate=req.mutation_rate)
        return {"child": child.to_dict()}
    except Exception as e:
        logger.error("genesis_mutate error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to mutate genesis DNA")


@app.post("/api/genesis/crossover")
def genesis_crossover(req: GenesisCrossoverRequest) -> dict[str, Any]:
    try:
        a = GenesisAlgorithmDNA(
            algorithm_type=req.parent_a.algorithm_type,
            genes=req.parent_a.genes,
            generation=req.parent_a.generation,
            fitness=req.parent_a.fitness,
            age=req.parent_a.age,
            parent_fitness=req.parent_a.parent_fitness,
            id=req.parent_a.id or f"dna_{req.parent_a.algorithm_type}_a",
        )
        b = GenesisAlgorithmDNA(
            algorithm_type=req.parent_b.algorithm_type,
            genes=req.parent_b.genes,
            generation=req.parent_b.generation,
            fitness=req.parent_b.fitness,
            age=req.parent_b.age,
            parent_fitness=req.parent_b.parent_fitness,
            id=req.parent_b.id or f"dna_{req.parent_b.algorithm_type}_b",
        )
        child = GenesisAlgorithmDNA.crossover(a, b)
        return {"child": child.to_dict()}
    except Exception as e:
        logger.error("genesis_crossover error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to perform genesis crossover")


@app.post("/api/genesis/evolve")
def genesis_evolve(req: GenesisEvolveRequest) -> dict[str, Any]:
    """طوّر المجتمع جيلاً واحداً: Elitism + Tournament Selection + BLX-α Crossover + Mutation.

    يُعيد المجتمع الجديد مع إحصائيات اللياقة وبيانات قاعة المشاهير المحدّثة.
    """
    try:
        population = [
            GenesisAlgorithmDNA(
                algorithm_type=d.algorithm_type,
                genes=d.genes,
                generation=d.generation,
                fitness=d.fitness,
                age=d.age,
                parent_fitness=d.parent_fitness,
                id=d.id or f"dna_{d.algorithm_type}_{i:04d}",
            )
            for i, d in enumerate(req.population)
        ]
        evolved = genesis.evolve_generation(
            population=population,
            mutation_rate=req.mutation_rate,
            elite_fraction=req.elite_fraction,
            tournament_size=req.tournament_size,
        )
        fitnesses = [d.fitness for d in evolved]
        return {
            "generation": genesis._generation_count,
            "population": [d.to_dict() for d in evolved],
            "best": evolved[0].to_dict() if evolved else None,
            "stats": {
                "best_fitness": max(fitnesses) if fitnesses else 0.0,
                "mean_fitness": float(sum(fitnesses) / len(fitnesses)) if fitnesses else 0.0,
                "worst_fitness": min(fitnesses) if fitnesses else 0.0,
                "population_size": len(evolved),
            },
            "hall_of_fame": [d.to_dict() for d in genesis.hall_of_fame[:3]],
        }
    except Exception as e:
        logger.error("genesis_evolve error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to evolve genesis population")


@app.get("/api/genesis/status")
def genesis_status() -> dict[str, Any]:
    """ارجع حالة محرك Genesis: عدد الأجيال، قاعة المشاهير، أنواع الخوارزميات المدعومة."""
    try:
        return genesis.get_status()
    except Exception as e:
        logger.error("genesis_status error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve genesis status")


# ── Structured Memory API ─────────────────────────────────────────────────────


class MemoryCreateRequest(BaseModel):
    name: str = Field(..., max_length=200)
    description: str = Field(..., max_length=500)
    type: str = Field(..., pattern=r"^(user|feedback|project|reference)$")
    content: str = Field(..., max_length=10000)
    tags: list[str] = []


class MemoryUpdateRequest(BaseModel):
    name: str | None = Field(None, max_length=200)
    description: str | None = Field(None, max_length=500)
    type: str | None = Field(None, pattern=r"^(user|feedback|project|reference)$")
    content: str | None = Field(None, max_length=10000)
    tags: list[str] | None = None


class MemorySearchRequest(BaseModel):
    query: str = Field(..., max_length=500)
    max_results: int = Field(5, ge=1, le=50)


@app.post("/api/memory/create")
def memory_create(req: MemoryCreateRequest) -> dict[str, Any]:
    try:
        entry = MemoryEntry(
            id=f"mem-{int(time.time())}-{os.urandom(4).hex()}",
            name=req.name,
            description=req.description,
            type=MemoryType(req.type),
            content=req.content,
            tags=req.tags[:20],
        )
        result = memory_store.add(entry)
        return {"ok": True, "entry": result.to_dict()}
    except Exception as e:
        logger.error("memory_create error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to create memory entry")


@app.get("/api/memory/list")
def memory_list(memory_type: str | None = None) -> dict[str, Any]:
    try:
        mt = MemoryType(memory_type) if memory_type else None
        entries = memory_store.list_all(memory_type=mt)
        return {
            "total": len(entries),
            "entries": [e.to_dict() for e in entries],
        }
    except Exception as e:
        logger.error("memory_list error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to list memory entries")


@app.get("/api/memory/{entry_id}")
def memory_get(entry_id: str) -> dict[str, Any]:
    entry = memory_store.get(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Memory entry not found")
    result = entry.to_dict()
    freshness = memory_freshness_warning(entry.updated_at)
    if freshness:
        result["freshness_warning"] = freshness
    return result


@app.put("/api/memory/{entry_id}")
def memory_update(entry_id: str, req: MemoryUpdateRequest) -> dict[str, Any]:
    try:
        updates: dict[str, Any] = {}
        if req.name is not None:
            updates["name"] = req.name
        if req.description is not None:
            updates["description"] = req.description
        if req.type is not None:
            updates["type"] = MemoryType(req.type)
        if req.content is not None:
            updates["content"] = req.content
        if req.tags is not None:
            updates["tags"] = req.tags[:20]
        result = memory_store.update(entry_id, **updates)
        if not result:
            raise HTTPException(status_code=404, detail="Memory entry not found")
        return {"ok": True, "entry": result.to_dict()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("memory_update error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to update memory entry")


@app.delete("/api/memory/{entry_id}")
def memory_delete(entry_id: str) -> dict[str, Any]:
    if not memory_store.delete(entry_id):
        raise HTTPException(status_code=404, detail="Memory entry not found")
    return {"ok": True}


@app.post("/api/memory/search")
def memory_search(req: MemorySearchRequest) -> dict[str, Any]:
    try:
        results = memory_store.search(req.query, max_results=req.max_results)
        return {
            "query": req.query,
            "total": len(results),
            "results": [e.to_dict() for e in results],
        }
    except Exception as e:
        logger.error("memory_search error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to search memory entries")


@app.get("/api/memory/manifest")
def memory_manifest() -> dict[str, Any]:
    return {"manifest": memory_store.format_manifest()}


@app.get("/api/memory/stats")
def memory_stats() -> dict[str, Any]:
    entries = memory_store.list_all()
    by_type: dict[str, int] = {}
    for entry in entries:
        key = entry.memory_type.value if hasattr(entry.memory_type, "value") else str(entry.memory_type)
        by_type[key] = by_type.get(key, 0) + 1
    return {"total": len(entries), "by_type": by_type}


# ── Arabic Morphological Analysis API ─────────────────────────────────────────
# مستوحى من pysarf/Rashidbm — تحليل صرفي عربي متقدم
# ──────────────────────────────────────────────────────────────────────────────

import contextlib
import re

from arabic_analysis_core import (
    ARABIC_PARTICLES as _ARABIC_PARTICLES,
)
from arabic_analysis_core import (
    ARABIC_ROOTS as _ARABIC_ROOTS,
)
from arabic_analysis_core import (
    extract_root as _extract_root_backend,
)
from arabic_analysis_core import (
    normalize_arabic as _normalize_arabic,
)


class ArabicAnalysisRequest(BaseModel):
    """طلب تحليل صرفي عربي"""

    text: str = Field(..., min_length=1, max_length=5000, description="النص العربي للتحليل")
    include_quantum_mapping: bool = Field(default=False, description="تضمين التحويل الكمومي")


class ArabicRootResult(BaseModel):
    """نتيجة تحليل كلمة واحدة"""

    word: str
    root: str
    root_letters: list[str]
    pattern: str
    semantic_field: str
    confidence: float
    word_type: str
    is_definite: bool
    derivatives: list[str]


class ArabicAnalysisResponse(BaseModel):
    """استجابة التحليل الصرفي"""

    text: str
    words: list[ArabicRootResult]
    unique_roots: int
    semantic_fields: list[str]
    semantic_coherence: float
    roots_db_size: int
    processing_time_ms: float


# بيانات ودوال التحليل الصرفي مستوردة من arabic_analysis_core
# (ARABIC_ROOTS, normalize_arabic, extract_root, ...)


@app.post("/api/arabic/analyze", response_model=ArabicAnalysisResponse)
async def analyze_arabic_text(req: ArabicAnalysisRequest) -> ArabicAnalysisResponse:
    """تحليل صرفي عربي — مستوحى من pysarf"""
    start_time = time.monotonic()

    raw_words = req.text.split()
    results: list[ArabicRootResult] = []
    unique_roots_set: set = set()
    semantic_fields_set: set = set()

    for word in raw_words:
        cleaned = word.strip()
        if not cleaned or not re.search(r"[\u0600-\u06FF]", cleaned):
            continue

        normalized = _normalize_arabic(cleaned)
        is_definite = normalized.startswith("ال")

        # هل هي أداة؟
        if normalized in _ARABIC_PARTICLES:
            results.append(
                ArabicRootResult(
                    word=cleaned,
                    root="",
                    root_letters=[],
                    pattern="",
                    semantic_field="particle",
                    confidence=1.0,
                    word_type="particle",
                    is_definite=False,
                    derivatives=[],
                )
            )
            continue

        extraction = _extract_root_backend(cleaned)
        root = extraction["root"]
        entry = extraction.get("entry")
        confidence = extraction["confidence"]

        root_letters = list(root)[:3]
        unique_roots_set.add(root)
        field = entry["field"] if entry else "unknown"
        if field != "unknown":
            semantic_fields_set.add(field)

        results.append(
            ArabicRootResult(
                word=cleaned,
                root=root,
                root_letters=root_letters,
                pattern="فعل",
                semantic_field=field,
                confidence=confidence,
                word_type="noun" if is_definite else "unknown",
                is_definite=is_definite,
                derivatives=entry["derivatives"] if entry else [],
            )
        )

    # حساب التماسك الدلالي
    field_counts: dict[str, int] = {}
    for r in results:
        if r.semantic_field not in ("unknown", "particle"):
            field_counts[r.semantic_field] = field_counts.get(r.semantic_field, 0) + 1
    total_analyzed = sum(field_counts.values())
    coherence = (
        max(field_counts.values()) / total_analyzed if total_analyzed > 1 else (1.0 if total_analyzed == 1 else 0.0)
    )

    processing_time = (time.monotonic() - start_time) * 1000

    return ArabicAnalysisResponse(
        text=req.text,
        words=results,
        unique_roots=len(unique_roots_set),
        semantic_fields=list(semantic_fields_set),
        semantic_coherence=coherence,
        roots_db_size=len(_ARABIC_ROOTS),
        processing_time_ms=round(processing_time, 2),
    )


class ArabicBatchRequest(BaseModel):
    """طلب تحليل صرفي دُفعي"""

    texts: list[str] = Field(..., min_length=1, max_length=10, description="قائمة النصوص العربية (1–10)")


@app.post("/api/arabic/batch")
async def analyze_arabic_batch(req: ArabicBatchRequest) -> dict[str, Any]:
    """تحليل صرفي عربي دُفعي — يحلّل عدة نصوص في طلب واحد"""
    if len(req.texts) > 10:
        raise HTTPException(status_code=422, detail="texts must contain at most 10 items")
    results = []
    for text in req.texts:
        single = await analyze_arabic_text(ArabicAnalysisRequest(text=text))
        results.append(single.model_dump())
    return {"results": results}


# ── Quantum Chemistry API ─────────────────────────────────────────────────────


class VQERequest(BaseModel):
    """نموذج طلب تشغيل خوارزمية VQE لجزيء محدد."""

    molecule: str = Field(
        default="H2",
        description="رمز الجزيء: H2 أو LiH أو BeH2 أو H2O",
        pattern=r"^(H2|LiH|BeH2|H2O)$",
    )
    max_steps: int = Field(
        default=120,
        ge=1,
        le=1000,
        description="الحد الأقصى لخطوات التحسين (1–1000)",
    )


@app.get(
    "/api/chemistry/molecules",
    summary="قائمة الجزيئات المدعومة",
    tags=["Quantum Chemistry"],
)
async def list_molecules():
    """يُعيد قائمة الجزيئات الكيميائية المدعومة مع بياناتها المرجعية."""
    molecules = quantum_chemistry_engine.list_molecules()
    details = {name: quantum_chemistry_engine.get_molecule(name) for name in molecules}
    return JSONResponse(content={"molecules": molecules, "details": details})


@app.post(
    "/api/chemistry/vqe",
    summary="تشغيل خوارزمية VQE لتقدير طاقة الجزيء",
    tags=["Quantum Chemistry"],
)
async def run_vqe(req: VQERequest):
    """
    يُشغّل محاكاة Variational Quantum Eigensolver (VQE) للجزيء المحدد
    ويُعيد نتيجة التقارب وتتبع الطاقة عبر خطوات التحسين.
    """
    try:
        result = quantum_chemistry_engine.run_vqe(
            molecule=req.molecule,
            max_steps=req.max_steps,
        )
        return JSONResponse(
            content={
                "molecule": result.molecule,
                "exact_energy_hartree": result.exact_energy_hartree,
                "estimated_energy_hartree": result.estimated_energy_hartree,
                "error_milli_hartree": result.error_milli_hartree,
                "optimization_steps": result.optimization_steps,
                "converged": result.converged,
                "final_gradient_norm": result.final_gradient_norm,
                "convergence_trace": result.convergence_trace,
            }
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("vqe_error", molecule=req.molecule, error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ داخلي أثناء تشغيل VQE") from exc


@app.websocket("/api/ws/simulate")
async def websocket_simulate(websocket: WebSocket):
    """
    WebSocket endpoint للمحاكاة الكمومية الفورية.
    يستقبل: {"type": "SIMULATE", "payload": {"simType": "PHYSICS"|"CHEMISTRY"|..., "params": {...}}}
    يُرسل: {"step": int, "total": int, "progress": float, "partial": {...}}
    وفي النهاية: {"done": true, "result": {...}}
    """
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            if msg.get("type") != "SIMULATE":
                continue
            payload = msg.get("payload", {})
            steps = 10
            for i in range(steps):
                await websocket.send_json(
                    {
                        "step": i + 1,
                        "total": steps,
                        "progress": round((i + 1) / steps * 100, 1),
                        "partial": {"iteration": i, "status": "running"},
                    }
                )
                await asyncio.sleep(0.3)
            await websocket.send_json(
                {
                    "done": True,
                    "result": {
                        "success": True,
                        "simType": payload.get("simType", "PHYSICS"),
                        "energy": -1.1372,
                        "fidelity": 0.9985,
                        "message": "اكتملت المحاكاة الكمومية",
                    },
                }
            )
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        with contextlib.suppress(Exception):
            await websocket.send_json({"error": str(exc)})


# ── Agents API ───────────────────────────────────────────────────────────────
# وكلاء الذكاء الاصطناعي المتخصصون في الإبداع والتطوير والبحث والجودة

from agents_service import (  # noqa: E402 — استيراد مؤجل لتجنب circular imports
    AgentOrchestrator,
    AgentRequest,
    AutonomousOrchestrator,
    AutonomousRequest,
    OrchestratorRequest,
    PlanningAgent,
    PlanRequest,
)

_orchestrator = AgentOrchestrator()
_autonomous_orchestrator = AutonomousOrchestrator()


@app.get(
    "/api/agents/status",
    summary="حالة الوكلاء الذكيين",
    tags=["Agents"],
)
async def agents_status():
    """يُعيد حالة نظام الوكلاء وقائمة الوكلاء المتاحة مع قدراتهم."""
    return JSONResponse(content=AgentOrchestrator.get_status())


@app.post(
    "/api/agents/creativity",
    summary="وكيل الإبداع — توليد أفكار ومقترحات إبداعية",
    tags=["Agents"],
)
async def run_creativity_agent(req: AgentRequest, request: Request):
    """
    يُشغّل وكيل الإبداع لتوليد أفكار متنوعة وجلسات عصف ذهني
    ومبادرات قابلة للتنفيذ بناءً على الطلب المُدخَل.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = _orchestrator.run_single("creativity", req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("creativity_agent_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ داخلي في وكيل الإبداع") from exc


@app.post(
    "/api/agents/development",
    summary="وكيل التطوير — تحسينات هندسية وبرمجية",
    tags=["Agents"],
)
async def run_development_agent(req: AgentRequest, request: Request):
    """
    يُشغّل وكيل التطوير لاقتراح تحسينات الكود، مراجعة البنية المعمارية،
    وتحليل الدَّيْن التقني.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = _orchestrator.run_single("development", req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("development_agent_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ داخلي في وكيل التطوير") from exc


@app.post(
    "/api/agents/research",
    summary="وكيل البحث — تحليل وتوصيات مبنية على الأدلة",
    tags=["Agents"],
)
async def run_research_agent(req: AgentRequest, request: Request):
    """
    يُشغّل وكيل البحث لتحليل الموضوع من أبعاد متعددة، تجميع النتائج،
    وإصدار توصيات أولوية قابلة للتنفيذ.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = _orchestrator.run_single("research", req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("research_agent_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ داخلي في وكيل البحث") from exc


@app.post(
    "/api/agents/quality",
    summary="وكيل الجودة — تدقيق أمني وقياس الأداء",
    tags=["Agents"],
)
async def run_quality_agent(req: AgentRequest, request: Request):
    """
    يُشغّل وكيل الجودة لإجراء تدقيق أمني شامل، قياس الأداء،
    والتحقق من صحة المتطلبات وفق معايير OWASP وISO 25010.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = _orchestrator.run_single("quality", req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("quality_agent_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ داخلي في وكيل الجودة") from exc


@app.post(
    "/api/agents/orchestrate",
    summary="المُنسِّق — تشغيل عدة وكلاء معاً",
    tags=["Agents"],
)
async def run_orchestrator(req: OrchestratorRequest, request: Request):
    """
    يُشغّل جميع الوكلاء المطلوبين بالتسلسل ويُعيد نتائجهم في استجابة
    موحّدة مع ملخص تنفيذي. يُمرّر نتائج كل وكيل كسياق للتالي.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = _orchestrator.run_all(req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("orchestrator_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ داخلي في المُنسِّق") from exc


@app.post(
    "/api/agents/plan",
    summary="وكيل التخطيط — تحليل الأهداف وبناء خطط تنفيذية",
    tags=["Agents"],
)
async def run_planning_agent(req: PlanRequest, request: Request):
    """
    يُشغّل وكيل التخطيط لتحليل هدف استراتيجي وتحويله إلى خطة تنفيذية
    متكاملة مع تعيين الوكيل المناسب لكل خطوة وتقدير زمني.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        agent = PlanningAgent()
        from agents_service import AgentRequest as _AgentRequest

        agent_req = _AgentRequest(
            prompt=req.goal,
            context={**(req.context or {}), "max_steps": req.max_steps},
            language=req.language,
        )
        result = agent.run(agent_req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("planning_agent_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ داخلي في وكيل التخطيط") from exc


@app.post(
    "/api/agents/autonomous",
    summary="المُشغّل الذاتي — حلقة تكرارية تحسينية",
    tags=["Agents"],
)
async def run_autonomous(req: AutonomousRequest, request: Request):
    """
    يُشغّل الوكلاء المحددة في حلقة تكرارية ذاتية حتى الوصول لعتبة الجودة
    أو استنفاد الحد الأقصى للتكرارات. كل تكرار يُوظّف نتائج السابق.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = _autonomous_orchestrator.run_autonomous(req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("autonomous_orchestrator_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ داخلي في المُشغّل الذاتي") from exc


# ── Graceful Shutdown ─────────────────────────────────────────────────────────

_shutting_down = False


def _graceful_shutdown(signum: int, _frame: Any) -> None:
    """Handle SIGTERM/SIGINT for clean shutdown."""
    global _shutting_down
    if _shutting_down:
        return
    _shutting_down = True
    sig_name = signal.Signals(signum).name
    logger.info("shutdown_signal_received", signal=sig_name)

    # Flush any pending learning data
    try:
        if hasattr(learning, "flush"):
            learning.flush()
    except Exception:
        pass

    # Close rate-limit DB if open
    if _rate_db is not None:
        with contextlib.suppress(Exception):
            _rate_db.close()

    logger.info("shutdown_complete")
    sys.exit(0)


for _sig in (signal.SIGTERM, signal.SIGINT):
    signal.signal(_sig, _graceful_shutdown)


# ── Server-Sent Events (SSE) for Real-Time Quantum State ──────────────────


class SSEMessage(BaseModel):
    event: str = "quantum-state"
    data: dict[str, Any] = Field(default_factory=dict)


@app.get(
    "/api/sse/quantum-state",
    summary="بث مباشر لحالة الكم عبر SSE",
    tags=["Real-Time"],
)
async def sse_quantum_state(request: Request):
    async def event_generator():
        last_status = None
        while True:
            if await request.is_disconnected():
                break
            try:
                uptime = time.monotonic() - _start_time
                status = {
                    "uptime_s": round(uptime, 1),
                    "genesis_status": genesis.get_status() if genesis else {},
                    "learning_events": len(learning._events) if hasattr(learning, "_events") else 0,
                    "memory_count": memory_store.count() if hasattr(memory_store, "count") else 0,
                    "timestamp": time.time(),
                }
                if status != last_status:
                    import json

                    yield f"data: {json.dumps(status, ensure_ascii=False)}\n\n"
                    last_status = status.copy()
                await asyncio.sleep(2)
            except Exception:
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get(
    "/api/sse/genesis",
    summary="بث مباشر لتطور المحرك الجيني عبر SSE",
    tags=["Real-Time"],
)
async def sse_genesis_evolution(request: Request):
    async def event_generator():
        last_generation = -1
        while True:
            if await request.is_disconnected():
                break
            try:
                status = genesis.get_status() if genesis else {}
                current_gen = status.get("generations", 0)
                if current_gen != last_generation:
                    import json

                    event_data = {
                        "generation": current_gen,
                        "hall_of_fame_size": len(status.get("hall_of_fame", [])),
                        "algorithm_types": status.get("algorithm_types", []),
                        "timestamp": time.time(),
                    }
                    yield f"event: genesis-update\ndata: {json.dumps(event_data, ensure_ascii=False)}\n\n"
                    last_generation = current_gen
                await asyncio.sleep(3)
            except Exception:
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── Web Vitals Endpoint ───────────────────────────────────────────────────


class VitalsReport(BaseModel):
    metrics: list[dict[str, Any]] = Field(default_factory=list)
    lcp: float | None = None
    fid: float | None = None
    cls: float | None = None
    inp: float | None = None
    ttfb: float | None = None
    fcpl: float | None = None


@app.post(
    "/api/analytics/vitals",
    summary="استقبال مقاييس أداء الويب من الواجهة",
    tags=["Analytics"],
)
async def receive_web_vitals(report: VitalsReport, request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        summary = {
            "lcp": report.lcp,
            "fid": report.fid,
            "cls": report.cls,
            "inp": report.inp,
            "ttfb": report.ttfb,
            "fcpl": report.fcpl,
            "metrics_count": len(report.metrics),
            "received_at": time.time(),
        }
        logger.info("web_vitals_received", **summary)
        return JSONResponse(content={"status": "ok", "summary": summary})
    except Exception as exc:
        logger.exception("vitals_processing_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ في معالجة مقاييس الأداء") from exc


# ── GLM-4.7 Dev Agents API ────────────────────────────────────────────────────
# وكلاء التطوير والتحسين المدعومة بنموذج GLM-4.7-FP8 عبر خادم vLLM
#
# تشغيل الخادم:
#   vllm serve zai-org/GLM-4.7-FP8 \
#     --tensor-parallel-size 4 \
#     --speculative-config.method mtp \
#     --speculative-config.num_speculative_tokens 1 \
#     --tool-call-parser glm47 \
#     --reasoning-parser glm45 \
#     --enable-auto-tool-choice \
#     --served-model-name glm-4.7-fp8

from glm_service import (  # noqa: E402
    GLMAgentType,
    GLMDevOrchestrator,
    GLMDevRequest,
    GLMOrchestratorRequest,
)

_glm_dev_orchestrator = GLMDevOrchestrator()


@app.get(
    "/api/glm/status",
    summary="حالة خادم GLM-4.7 vLLM والوكلاء المتاحة",
    tags=["GLM Agents"],
)
async def glm_status():
    """يُعيد حالة خادم vLLM ومعلومات نموذج GLM-4.7 والوكلاء المتاحة."""
    status = await GLMDevOrchestrator.get_status()
    return JSONResponse(content=status.model_dump())


@app.post(
    "/api/glm/code-review",
    summary="وكيل مراجعة الكود — GLM-4.7",
    tags=["GLM Agents"],
)
async def glm_code_review(req: GLMDevRequest, request: Request):
    """
    يُشغّل وكيل مراجعة الكود المدعوم بـ GLM-4.7.
    يُحلّل الكود ويقترح تحسينات الجودة والقراءة والصيانة.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = await _glm_dev_orchestrator.run_single(GLMAgentType.CODE_REVIEW, req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("glm_code_review_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ في وكيل مراجعة الكود") from exc


@app.post(
    "/api/glm/optimize",
    summary="وكيل التحسين — GLM-4.7",
    tags=["GLM Agents"],
)
async def glm_optimize(req: GLMDevRequest, request: Request):
    """
    يُشغّل وكيل تحسين الأداء المدعوم بـ GLM-4.7.
    يُحلّل تعقيد الخوارزميات، استعلامات قاعدة البيانات، والتخزين المؤقت.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = await _glm_dev_orchestrator.run_single(GLMAgentType.OPTIMIZATION, req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("glm_optimize_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ في وكيل التحسين") from exc


@app.post(
    "/api/glm/security",
    summary="وكيل الأمان — GLM-4.7",
    tags=["GLM Agents"],
)
async def glm_security(req: GLMDevRequest, request: Request):
    """
    يُشغّل وكيل التدقيق الأمني المدعوم بـ GLM-4.7.
    يكتشف ثغرات XSS، SQL Injection، CSRF، والأسرار المكشوفة.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = await _glm_dev_orchestrator.run_single(GLMAgentType.SECURITY, req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("glm_security_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ في وكيل الأمان") from exc


@app.post(
    "/api/glm/docs",
    summary="وكيل التوثيق — GLM-4.7",
    tags=["GLM Agents"],
)
async def glm_docs(req: GLMDevRequest, request: Request):
    """
    يُشغّل وكيل توليد التوثيق المدعوم بـ GLM-4.7.
    يُولّد docstrings، وثائق API، وأمثلة استخدام عملية.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = await _glm_dev_orchestrator.run_single(GLMAgentType.DOCUMENTATION, req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("glm_docs_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ في وكيل التوثيق") from exc


@app.post(
    "/api/glm/orchestrate",
    summary="منسّق وكلاء GLM-4.7 — تشغيل عدة وكلاء معاً",
    tags=["GLM Agents"],
)
async def glm_orchestrate(req: GLMOrchestratorRequest, request: Request):
    """
    يُشغّل عدة وكلاء GLM-4.7 بالتسلسل على نفس الكود ويُعيد نتائج موحّدة.
    يُمكن تحديد الوكلاء المطلوبة: code_review، optimization، security، documentation.
    """
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = await _glm_dev_orchestrator.run_all(req)
        return JSONResponse(content=result.model_dump())
    except Exception as exc:
        logger.exception("glm_orchestrate_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ في منسّق وكلاء GLM") from exc


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS — المصادقة والتسجيل
# ═══════════════════════════════════════════════════════════════════════════════


@app.post("/api/auth/register", summary="إنشاء حساب جديد", tags=["Auth"])
async def auth_register(req: UserCreate, request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = register_user(req.name, req.email, req.password)
        logger.info("user_registered", email=req.email)
        return JSONResponse(content=result.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as exc:
        logger.exception("auth_register_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الحساب") from exc


@app.post("/api/auth/login", summary="تسجيل الدخول", tags=["Auth"])
async def auth_login(req: UserLogin, request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = login_user(req.email, req.password)
        logger.info("user_login", email=req.email)
        return JSONResponse(content=result.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e)) from e
    except Exception as exc:
        logger.exception("auth_login_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ في تسجيل الدخول") from exc


@app.post("/api/auth/google", summary="تسجيل الدخول عبر Google", tags=["Auth"])
async def auth_google(req: GoogleAuthRequest, request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        result = login_with_google(req.credential)
        logger.info("google_login", email=result.user.email)
        return JSONResponse(content=result.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as exc:
        logger.exception("auth_google_error", error=str(exc))
        raise HTTPException(status_code=500, detail="خطأ في تسجيل الدخول عبر Google") from exc


@app.get("/api/auth/me", summary="الملف الشخصي", tags=["Auth"])
async def auth_me(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="رمز المصادقة مفقود")
    token = auth_header[7:]
    user = get_user_profile(token)
    if not user:
        raise HTTPException(status_code=401, detail="رمز المصادقة غير صالح")
    return JSONResponse(content=user.model_dump())


@app.put("/api/auth/plan", summary="تحديث الخطة", tags=["Auth"])
async def auth_update_plan(request: Request, plan: str = Query(...)):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="رمز المصادقة مفقود")
    token = auth_header[7:]
    result = update_user_plan(token, plan)
    if not result:
        raise HTTPException(status_code=401, detail="رمز المصادقة غير صالح")
    return JSONResponse(content=result.model_dump())


# ═══════════════════════════════════════════════════════════════════════════════
# CONTACT ENDPOINT — نموذج الاتصال
# ═══════════════════════════════════════════════════════════════════════════════


class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str = ""
    message: str


_contact_messages: list[dict] = []
_CONTACT_MAX = 500


@app.post("/api/contact", summary="إرسال رسالة اتصال", tags=["Contact"])
async def contact_submit(req: ContactRequest, request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    if not req.name.strip() or not req.email.strip() or not req.message.strip():
        raise HTTPException(status_code=400, detail="الاسم والبريد والرسالة حقول مطلوبة")
    if len(_contact_messages) >= _CONTACT_MAX:
        _contact_messages.pop(0)
    _contact_messages.append(
        {
            "name": req.name,
            "email": req.email,
            "subject": req.subject,
            "message": req.message,
            "ts": time.time(),
        }
    )
    logger.info("contact_message", name=req.name, email=req.email)
    return JSONResponse(content={"status": "ok", "message": "تم استلام رسالتك بنجاح"})


# ═══════════════════════════════════════════════════════════════════════════════
# WEBSOCKET — محاكاة كمومية في الوقت الحقيقي
# ═══════════════════════════════════════════════════════════════════════════════


@app.websocket("/api/ws/simulate")
async def ws_simulate(websocket: WebSocket):
    await websocket.accept()
    logger.info("ws_simulate_connected")
    try:
        while True:
            data = await websocket.receive_json()
            sim_type = data.get("type", "physics")
            qubits = min(data.get("qubits", 4), 16)
            steps = data.get("steps", 10)
            for step in range(steps):
                progress = (step + 1) / steps
                await websocket.send_json(
                    {
                        "step": step + 1,
                        "total_steps": steps,
                        "progress": round(progress, 3),
                        "qubits": qubits,
                        "type": sim_type,
                        "fidelity": round(0.95 + 0.05 * (1 - progress), 6),
                        "state": "processing" if step < steps - 1 else "completed",
                    }
                )
                await asyncio.sleep(0.3)
            await websocket.send_json({"state": "done", "qubits": qubits, "type": sim_type})
    except WebSocketDisconnect:
        logger.info("ws_simulate_disconnected")
    except Exception as exc:
        logger.warning("ws_simulate_error", error=str(exc))
        with contextlib.suppress(Exception):
            await websocket.close(code=1011)


# ═══════════════════════════════════════════════════════════════════════════════
# WEB VITALS — استقبال مقاييس الأداء من الواجهة
# ═══════════════════════════════════════════════════════════════════════════════


@app.post("/api/analytics/vitals", summary="تقرير مقاييس الأداء", tags=["Analytics"])
async def analytics_vitals(request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    try:
        body = await request.json()
        logger.info("web_vitals", **{k: v for k, v in body.items() if k in ("lcp", "cls", "inp", "ttfb", "fcp")})
        return JSONResponse(content={"status": "ok"})
    except Exception as exc:
        logger.warning("vitals_error", error=str(exc))
        raise HTTPException(status_code=400, detail="بيانات غير صالحة") from exc


# ═══════════════════════════════════════════════════════════════════════════════
# PROJECT DNA — كشف هوية المشروع (مستوحى من 3z/sentient_core)
# ═══════════════════════════════════════════════════════════════════════════════


@app.get("/api/dna", summary="كشف هوية المشروع", tags=["DNA"])
async def detect_project_dna():
    dna = dna_detector.detect(".")
    return JSONResponse(
        content={
            "language": dna.language.value,
            "framework": dna.framework,
            "port": dna.port,
            "dependencies": list(dna.dependencies),
            "has_docker": dna.has_docker,
            "has_tests": dna.has_tests,
        }
    )


@app.get("/api/security/stats", summary="إحصائيات الدرع الأمني", tags=["Security"])
async def security_stats():
    return JSONResponse(content=security_shield.stats())


# ═══════════════════════════════════════════════════════════════════════════════
# QUANTUM CYBER SHIELD — الدرع السيبراني الكمومي (بيانات حقيقية)
# ═══════════════════════════════════════════════════════════════════════════════


# ── رؤوس الأمان المطلوبة مع معايير التقييم ──
_SECURITY_HEADERS = {
    "Content-Security-Policy": {
        "required_values": ["default-src", "script-src"],
        "recommendation_ar": "أضف سياسة أمان المحتوى (CSP) لمنع هجمات XSS وحقن الكود",
    },
    "X-Content-Type-Options": {
        "required_values": ["nosniff"],
        "recommendation_ar": "أضف nosniff لمنع المتصفح من تخمين نوع المحتوى",
    },
    "X-Frame-Options": {
        "required_values": ["DENY", "SAMEORIGIN"],
        "recommendation_ar": "أضف DENY أو SAMEORIGIN لمنع هجمات Clickjacking",
    },
    "Strict-Transport-Security": {
        "required_values": ["max-age="],
        "recommendation_ar": "أضف HSTS لإجبار المتصفح على استخدام HTTPS دائماً",
    },
    "Referrer-Policy": {
        "required_values": ["no-referrer", "strict-origin", "same-origin"],
        "recommendation_ar": "أضف سياسة الإحالة لحماية خصوصية المستخدم",
    },
    "Permissions-Policy": {
        "required_values": ["camera=", "microphone=", "geolocation="],
        "recommendation_ar": "أضف سياسة الأذونات لتقييد الوصول للكاميرا والميكروفون",
    },
    "X-XSS-Protection": {
        "required_values": ["1"],
        "recommendation_ar": "أضف حماية XSS للمتصفحات القديمة (1; mode=block)",
    },
    "Cross-Origin-Opener-Policy": {
        "required_values": ["same-origin"],
        "recommendation_ar": "أضف COOP لعزل سياق التصفح ومنع هجمات Spectre",
    },
    "Cross-Origin-Resource-Policy": {
        "required_values": ["same-origin", "same-site"],
        "recommendation_ar": "أضف CORP لمنع تحميل الموارد من أصول أخرى",
    },
    "X-Permitted-Cross-Domain-Policies": {
        "required_values": ["none"],
        "recommendation_ar": "أضف هذا الرأس لمنع سياسات Adobe Flash/PDF عبر النطاقات",
    },
}


def _evaluate_header(header_name: str, header_value: str | None) -> dict:
    """يقيّم رأس أمان واحد ويعيد نتيجة حقيقية."""
    spec = _SECURITY_HEADERS.get(header_name, {})
    recommendation = spec.get("recommendation_ar", "تحقق من ضبط هذا الرأس الأمني")
    required_values = spec.get("required_values", [])

    if header_value is None:
        return {
            "header": header_name,
            "present": False,
            "value": "",
            "status": "missing",
            "recommendation": recommendation,
        }

    value_lower = header_value.lower()
    has_required = any(rv.lower() in value_lower for rv in required_values) if required_values else True

    if has_required:
        status = "secure"
    elif header_value.strip():
        status = "warning"
    else:
        status = "weak"

    return {
        "header": header_name,
        "present": True,
        "value": header_value[:200],
        "status": status,
        "recommendation": recommendation if status != "secure" else "الرأس مضبوط بشكل صحيح ✓",
    }


def _calculate_vulnerability_score(header_results: list[dict], is_https: bool, server_header: str | None) -> int:
    """يحسب درجة الضعف (0-100) من بيانات حقيقية. 0 = آمن، 100 = خطير."""
    score = 0
    total_headers = len(header_results)
    if total_headers == 0:
        return 80

    missing = sum(1 for h in header_results if h["status"] == "missing")
    weak = sum(1 for h in header_results if h["status"] == "weak")
    warning = sum(1 for h in header_results if h["status"] == "warning")

    # كل رأس مفقود يضيف وزناً
    score += int((missing / total_headers) * 50)
    score += int((weak / total_headers) * 20)
    score += int((warning / total_headers) * 10)

    # عدم استخدام HTTPS
    if not is_https:
        score += 20

    # كشف نوع الخادم (information leakage)
    if server_header and any(s in server_header.lower() for s in ["apache", "nginx", "iis", "express"]):
        score += 5

    return min(100, max(0, score))


def _calculate_quantum_resistance(header_results: list[dict], is_https: bool) -> int:
    """يحسب درجة المقاومة الكمومية (0-100).
    ملاحظة: معظم المواقع اليوم تستخدم RSA/ECC غير المقاوم كمومياً.
    النتيجة تعتمد على: HTTPS + HSTS + CSP + قوة الإعداد العامة.
    """
    base = 15  # معظم المواقع لا تستخدم PQC حالياً

    if is_https:
        base += 20  # HTTPS أفضل من HTTP

    secure_count = sum(1 for h in header_results if h["status"] == "secure")
    total = len(header_results) or 1
    base += int((secure_count / total) * 30)

    # HSTS يضيف نقاطاً
    hsts = next((h for h in header_results if h["header"] == "Strict-Transport-Security"), None)
    if hsts and hsts["status"] == "secure":
        base += 10

    # CSP يضيف نقاطاً
    csp = next((h for h in header_results if h["header"] == "Content-Security-Policy"), None)
    if csp and csp["status"] == "secure":
        base += 10

    return min(100, max(0, base))


class CyberScanRequest(BaseModel):
    url: str


@app.post("/api/cyber/scan", summary="فحص أمان كمومي حقيقي لموقع", tags=["Cyber Shield"])
async def cyber_scan(req: CyberScanRequest, request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    allowed, reason = security_shield.check(req.url)
    if not allowed:
        raise HTTPException(status_code=400, detail=reason or "الإدخال مرفوض")

    target_url = req.url.strip()
    if not target_url.startswith(("http://", "https://")):
        target_url = f"https://{target_url}"

    # ── جلب الرؤوس الحقيقية ──
    real_headers: dict[str, str | None] = {}
    server_header: str | None = None
    is_https = target_url.startswith("https://")
    fetch_error: str | None = None
    tls_version: str | None = None
    response_time_ms: float = 0

    try:
        import time as _time
        start = _time.monotonic()
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0),
            follow_redirects=True,
            verify=True,
            max_redirects=5,
        ) as client:
            resp = await client.head(target_url)
            response_time_ms = round((_time.monotonic() - start) * 1000, 1)

            # قراءة جميع رؤوس الاستجابة الحقيقية
            for header_name in _SECURITY_HEADERS:
                real_headers[header_name] = resp.headers.get(header_name)

            server_header = resp.headers.get("Server")
            is_https = str(resp.url).startswith("https://")

            # معلومات TLS إن وُجدت
            if hasattr(resp, "extensions") and resp.extensions:
                tls_info = resp.extensions.get("tls")
                if tls_info:
                    tls_version = str(tls_info.get("protocol_version", ""))

    except httpx.ConnectTimeout:
        fetch_error = "انتهت مهلة الاتصال — الخادم لا يستجيب"
    except httpx.ConnectError:
        fetch_error = "تعذر الاتصال بالخادم — تحقق من الرابط"
    except httpx.TooManyRedirects:
        fetch_error = "عدد عمليات إعادة التوجيه تجاوز الحد المسموح"
    except Exception as exc:
        fetch_error = f"خطأ في الفحص: {type(exc).__name__}"

    # ── تقييم الرؤوس ──
    header_results = []
    if fetch_error:
        # في حال فشل الاتصال، نعيد كل الرؤوس كمفقودة
        for header_name in _SECURITY_HEADERS:
            header_results.append(_evaluate_header(header_name, None))
    else:
        for header_name in _SECURITY_HEADERS:
            header_results.append(_evaluate_header(header_name, real_headers.get(header_name)))

    vuln_score = _calculate_vulnerability_score(header_results, is_https, server_header)
    quantum_resistance = _calculate_quantum_resistance(header_results, is_https)

    # ── حساب حالة الدرع من البيانات الحقيقية ──
    secure_ratio = sum(1 for h in header_results if h["status"] == "secure") / max(1, len(header_results))
    integrity = round(0.5 + secure_ratio * 0.5, 3)
    coherence = round(0.4 + (1.0 - vuln_score / 100) * 0.55, 3)
    fidelity = round(0.5 + quantum_resistance / 200, 3)

    return JSONResponse(
        content={
            "url": target_url,
            "real_scan": fetch_error is None,
            "fetch_error": fetch_error,
            "vulnerability_score": vuln_score,
            "quantum_resistance_score": quantum_resistance,
            "response_time_ms": response_time_ms,
            "is_https": is_https,
            "server": server_header,
            "tls_version": tls_version,
            "headers": header_results,
            "shield_state": {
                "integrity": integrity,
                "entanglement": round(0.6 + secure_ratio * 0.35, 3),
                "superposition": round(0.5 + (quantum_resistance / 200), 3),
                "coherence": coherence,
                "fidelity": fidelity,
            },
        }
    )


# ── تحليل الأمان بالذكاء الاصطناعي ──

class CyberAIAnalyzeRequest(BaseModel):
    scan_result: dict[str, Any]
    provider: str = "auto"


_CYBER_AI_SYSTEM_PROMPT = """أنت خبير أمن سيبراني وتشفير ما بعد الكمومي في منصة QURABIA.
تحلل نتائج فحص أمان المواقع وتقدم توصيات دقيقة ومفصلة بالعربية.

قواعدك:
1. حلل رؤوس HTTP الأمنية الحقيقية واشرح كل ثغرة
2. قيّم مدى مقاومة الموقع للهجمات الكمومية (خوارزمية شور، جروفر)
3. اشرح هجوم "جمع الآن وفك لاحقاً" (Harvest Now, Decrypt Later)
4. قدّم خطة ترقية واقعية إلى تشفير ما بعد الكمومي (NIST FIPS 203/204/205)
5. اذكر الأرقام والمراجع العلمية الحقيقية
6. الرد بالعربية الفصحى مع المصطلحات التقنية بالإنجليزية بين قوسين
7. كن موجزاً ودقيقاً — لا تتجاوز 800 كلمة"""


def _cyber_ai_fallback(scan: dict[str, Any]) -> str:
    """تحليل محلي ذكي عندما لا يتوفر مفتاح ذكاء اصطناعي."""
    url = scan.get("url", "غير محدد")
    vuln = scan.get("vulnerability_score", 50)
    qr = scan.get("quantum_resistance_score", 30)
    is_https = scan.get("is_https", False)
    headers = scan.get("headers", [])

    missing_headers = [h["header"] for h in headers if h.get("status") == "missing"]
    secure_headers = [h["header"] for h in headers if h.get("status") == "secure"]

    parts = [
        f"📋 تقرير تحليل الأمان الكمومي — {url}",
        "",
        f"🔴 درجة الضعف: {vuln}/100 {'(خطير)' if vuln > 60 else '(متوسط)' if vuln > 30 else '(منخفض)'}",
        f"🛡️ المقاومة الكمومية: {qr}%",
        f"🔒 HTTPS: {'مفعّل ✓' if is_https else '❌ غير مفعّل — خطر أمني حرج'}",
        "",
    ]

    if missing_headers:
        parts.append("⚠️ رؤوس أمنية مفقودة:")
        for h in missing_headers:
            rec = next((x.get("recommendation", "") for x in headers if x["header"] == h), "")
            parts.append(f"  • {h}: {rec}")
        parts.append("")

    if secure_headers:
        parts.append(f"✅ رؤوس آمنة: {', '.join(secure_headers)}")
        parts.append("")

    parts.extend([
        "📌 توصيات الترقية الكمومية:",
        "  1. اعتماد ML-KEM-768 (CRYSTALS-Kyber) لتبادل المفاتيح — NIST FIPS 203",
        "  2. اعتماد ML-DSA (CRYSTALS-Dilithium) للتوقيعات الرقمية — NIST FIPS 204",
        "  3. التأكد من استخدام AES-256 (مقاوم نسبياً لخوارزمية جروفر)",
        f"  4. {'تفعيل HTTPS فوراً!' if not is_https else 'تفعيل HSTS مع max-age طويل'}",
        "",
        "⏳ تقدير التهديد الكمومي:",
        "  • كسر RSA-2048 يتطلب ~20 مليون كيوبت صاخب (Gidney & Ekerå, 2021)",
        "  • التقدير: 10-15 سنة حتى يصبح التهديد واقعياً (IBM Roadmap 2033: 100K كيوبت)",
        "  • هجوم 'جمع الآن وفك لاحقاً' ممكن الآن — البيانات الحساسة المشفرة بـ RSA معرضة",
        "",
        "💡 ملاحظة: هذا تحليل محلي. أضف مفتاح GEMINI_API_KEY أو OPENROUTER_API_KEY للحصول على تحليل ذكاء اصطناعي متقدم.",
    ])

    return "\n".join(parts)


@app.post("/api/cyber/ai-analyze", summary="تحليل أمان كمومي بالذكاء الاصطناعي", tags=["Cyber Shield"])
async def cyber_ai_analyze(req: CyberAIAnalyzeRequest, request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")

    scan = req.scan_result
    provider = req.provider.strip().lower()

    prompt_content = (
        "حلل نتيجة فحص الأمان الكمومي التالية وقدّم تقريراً مفصلاً بالعربية:\n\n"
        + str(scan)[:12000]
    )

    # ── محاولة Gemini ──
    if provider in ("auto", "gemini"):
        key = (os.environ.get("GEMINI_API_KEY") or "").strip()
        if key:
            try:
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": _CYBER_AI_SYSTEM_PROMPT + "\n\n" + prompt_content}
                            ]
                        }
                    ]
                }
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}"
                async with httpx.AsyncClient(timeout=20.0) as client:
                    r = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if r.is_success:
                    data = r.json()
                    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if isinstance(text, str) and text.strip():
                        return JSONResponse(content={
                            "provider": "gemini", "text": text.strip()[:_LLM_MAX_TEXT_LENGTH], "mode": "ai"
                        })
            except Exception:
                pass

    # ── محاولة Grok ──
    if provider in ("auto", "grok"):
        key = (os.environ.get("GROK_API_KEY") or "").strip()
        if key:
            try:
                payload = {
                    "model": "grok-1",
                    "messages": [
                        {"role": "system", "content": _CYBER_AI_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt_content},
                    ],
                    "stream": False, "temperature": 0.3,
                }
                async with httpx.AsyncClient(timeout=20.0) as client:
                    r = await client.post(
                        "https://api.x.ai/v1/chat/completions",
                        json=payload,
                        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
                    )
                if r.is_success:
                    data = r.json()
                    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if isinstance(text, str) and text.strip():
                        return JSONResponse(content={
                            "provider": "grok", "text": text.strip()[:_LLM_MAX_TEXT_LENGTH], "mode": "ai"
                        })
            except Exception:
                pass

    # ── محاولة OpenRouter ──
    if provider in ("auto", "openrouter"):
        key = (os.environ.get("OPENROUTER_API_KEY") or "").strip()
        model = (os.environ.get("OPENROUTER_MODEL") or "openai/gpt-4o-mini").strip()
        if key:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": _CYBER_AI_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt_content},
                    ],
                    "temperature": 0.3, "stream": False,
                }
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key}",
                    "X-Title": "QURABIA",
                }
                referer = (os.environ.get("APP_PUBLIC_URL") or "https://qurabia.com").strip()
                if referer:
                    headers["HTTP-Referer"] = referer

                async with httpx.AsyncClient(timeout=20.0) as client:
                    r = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
                if r.is_success:
                    data = r.json()
                    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if isinstance(text, str) and text.strip():
                        return JSONResponse(content={
                            "provider": "openrouter", "text": text.strip()[:_LLM_MAX_TEXT_LENGTH], "mode": "ai"
                        })
            except Exception:
                pass

    # ── Fallback محلي ──
    return JSONResponse(content={
        "provider": "local",
        "text": _cyber_ai_fallback(scan),
        "mode": "local_fallback",
    })


class SiteScanRequest(BaseModel):
    url: str = Field(..., max_length=2048)
    render: bool = False
    max_resources: int = Field(default=16, ge=0, le=40)
    max_bytes_per_resource: int = Field(default=250_000, ge=20_000, le=2_000_000)


class SiteAIAnalyzeRequest(BaseModel):
    report: dict[str, Any]
    provider: str = "auto"
    language: str = "ar"


class _HTMLAuditParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.in_title = False
        self.lang: str | None = None
        self.meta: dict[str, str] = {}
        self.links: list[dict[str, str]] = []
        self.stylesheets: list[dict[str, str]] = []
        self.scripts: list[dict[str, Any]] = []
        self.inline_script_sample: list[str] = []
        self.inline_style_bytes = 0
        self.images_total = 0
        self.images_missing_alt = 0
        self.headings: list[int] = []
        self.anchors_total = 0
        self.anchors_with_target_blank = 0
        self.anchors_missing_rel_noopener = 0
        self.inputs_total = 0
        self.inputs_missing_label = 0
        self.buttons_total = 0
        self.buttons_missing_label = 0
        self.jsonld: list[Any] = []
        self._in_script = False
        self._script_type: str | None = None
        self._script_src: str | None = None
        self._script_buf: list[str] = []
        self._script_buf_bytes = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = {k.lower(): (v or "") for k, v in attrs}
        if tag == "html":
            self.lang = attrs_map.get("lang") or self.lang
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            charset = (attrs_map.get("charset") or "").strip()
            if charset and "charset" not in self.meta:
                self.meta["charset"] = charset
            key = attrs_map.get("name") or attrs_map.get("property") or attrs_map.get("http-equiv")
            val = attrs_map.get("content") or ""
            if key:
                self.meta[key.strip().lower()] = val.strip()
        if tag == "link":
            href = (attrs_map.get("href") or "").strip()
            rel = (attrs_map.get("rel") or "").strip().lower()
            if href:
                self.links.append({"rel": rel, "href": href})
                if "stylesheet" in rel:
                    self.stylesheets.append({"href": href, "media": (attrs_map.get("media") or "").strip()})
        if tag == "script":
            self._in_script = True
            self._script_type = (attrs_map.get("type") or "").strip().lower()
            self._script_src = (attrs_map.get("src") or "").strip()
            self._script_buf = []
            self._script_buf_bytes = 0
            if self._script_src:
                self.scripts.append({
                    "kind": "external",
                    "src": self._script_src,
                    "async": "async" in attrs_map,
                    "defer": "defer" in attrs_map,
                    "type": self._script_type or "",
                })
        if tag == "style":
            self.inline_style_bytes += 1
        if tag == "a":
            self.anchors_total += 1
            target = (attrs_map.get("target") or "").strip().lower()
            rel = (attrs_map.get("rel") or "").strip().lower()
            if target == "_blank":
                self.anchors_with_target_blank += 1
                if "noopener" not in rel:
                    self.anchors_missing_rel_noopener += 1
        if tag == "img":
            self.images_total += 1
            alt = (attrs_map.get("alt") or "").strip()
            if not alt:
                self.images_missing_alt += 1
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            with contextlib.suppress(Exception):
                self.headings.append(int(tag[1]))
        if tag == "input":
            self.inputs_total += 1
            if not (attrs_map.get("aria-label") or attrs_map.get("placeholder") or attrs_map.get("id")):
                self.inputs_missing_label += 1
        if tag == "button":
            self.buttons_total += 1
            if not (attrs_map.get("aria-label") or attrs_map.get("title")):
                self.buttons_missing_label += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        if tag == "script" and self._in_script:
            body = "".join(self._script_buf).strip()
            if self._script_type == "application/ld+json":
                try:
                    parsed = json.loads(body)
                    self.jsonld.append(parsed)
                except Exception:
                    pass
            if body and (self._script_type != "application/ld+json"):
                if len(self.inline_script_sample) < 3:
                    self.inline_script_sample.append(body[:1200])
                self.scripts.append({"kind": "inline", "bytes": self._script_buf_bytes})
            self._in_script = False
            self._script_type = None
            self._script_src = None
            self._script_buf = []
            self._script_buf_bytes = 0

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self._in_script and data and self._script_buf_bytes < 20_000:
            self._script_buf.append(data)
            self._script_buf_bytes += len(data.encode("utf-8", errors="ignore"))


def _resolve_host_ips(host: str) -> list[str]:
    try:
        infos = socket.getaddrinfo(host, None)
    except Exception:
        return []
    ips: list[str] = []
    for family, _, _, _, sockaddr in infos:
        if family in (socket.AF_INET, socket.AF_INET6):
            ip = sockaddr[0]
            if ip not in ips:
                ips.append(ip)
    return ips


def _is_private_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except Exception:
        return False
    return bool(
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    )


def _validate_target_url(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="الرابط فارغ")
    if not raw.startswith(("http://", "https://")):
        raw = f"https://{raw}"
    parsed = urlparse(raw)
    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(status_code=400, detail="مخطط الرابط غير مدعوم")
    if parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="الرابط يحتوي بيانات اعتماد غير مسموحة")
    host = (parsed.hostname or "").strip().lower()
    if not host:
        raise HTTPException(status_code=400, detail="لا يمكن تحديد اسم المضيف")
    if host in {"localhost"}:
        raise HTTPException(status_code=400, detail="المضيف غير مسموح")
    if _is_private_ip(host):
        raise HTTPException(status_code=400, detail="عنوان IP غير مسموح")
    ips = _resolve_host_ips(host)
    if not ips:
        raise HTTPException(status_code=400, detail="فشل حل DNS للمضيف")
    for ip in ips:
        if _is_private_ip(ip):
            raise HTTPException(status_code=400, detail="المضيف يشير إلى نطاق داخلي/خاص")
    return parsed.geturl()


def _score_seo(title: str, meta: dict[str, str], headings: list[int], imgs_missing_alt: int, jsonld_count: int) -> tuple[int, list[dict[str, Any]]]:
    score = 100
    issues: list[dict[str, Any]] = []

    ttl = title.strip()
    if not ttl:
        score -= 20
        issues.append({"id": "missing_title", "severity": "high", "title": "Missing <title>", "fix": "Add a concise, descriptive title (50–60 chars)."})
    elif len(ttl) < 12:
        score -= 5
        issues.append({"id": "short_title", "severity": "low", "title": "Title too short", "fix": "Expand the title to better reflect page intent."})
    elif len(ttl) > 70:
        score -= 6
        issues.append({"id": "long_title", "severity": "low", "title": "Title too long", "fix": "Reduce title length to avoid truncation."})

    desc = (meta.get("description") or "").strip()
    if not desc:
        score -= 14
        issues.append({"id": "missing_meta_description", "severity": "medium", "title": "Missing meta description", "fix": "Add meta description (120–160 chars)."})
    elif len(desc) < 50:
        score -= 5
        issues.append({"id": "short_meta_description", "severity": "low", "title": "Meta description too short", "fix": "Make description more informative."})

    if "canonical" not in meta and "link:canonical" not in meta:
        score -= 6
        issues.append({"id": "missing_canonical", "severity": "low", "title": "Missing canonical URL", "fix": "Add rel=canonical to prevent duplicate content issues."})

    h1_count = sum(1 for h in headings if h == 1)
    if h1_count == 0:
        score -= 8
        issues.append({"id": "missing_h1", "severity": "medium", "title": "Missing H1", "fix": "Add one H1 describing the page topic."})
    elif h1_count > 1:
        score -= 6
        issues.append({"id": "multiple_h1", "severity": "low", "title": "Multiple H1", "fix": "Keep a single H1 and use H2/H3 for sections."})

    if imgs_missing_alt > 0:
        score -= min(12, 2 + imgs_missing_alt)
        issues.append({"id": "images_missing_alt", "severity": "medium", "title": "Images missing alt text", "fix": "Add meaningful alt attributes for accessibility and SEO."})

    if jsonld_count == 0:
        score -= 4
        issues.append({"id": "missing_structured_data", "severity": "low", "title": "No structured data found", "fix": "Add JSON-LD (Organization, WebSite, Article/Product where relevant)."})

    return max(0, min(100, score)), issues


def _scan_js_heuristics(js_text: str) -> dict[str, Any]:
    t = js_text
    return {
        "has_eval": "eval(" in t,
        "has_new_function": "new Function" in t,
        "has_document_write": "document.write" in t,
        "has_innerhtml": ".innerHTML" in t or "innerHTML=" in t,
        "has_location_assign": "location=" in t or "location.href" in t,
        "has_sourcemap_ref": "sourceMappingURL=" in t,
        "is_minified_like": (len(t) > 3000 and (t.count("\n") / max(1, len(t))) < 0.0008),
    }


def _scan_css_heuristics(css_text: str) -> dict[str, Any]:
    return {
        "important_count": css_text.count("!important"),
        "media_queries": css_text.lower().count("@media"),
        "id_selectors": css_text.count("#"),
        "has_sourcemap_ref": "sourceMappingURL=" in css_text,
    }


def _content_classify(title: str, meta: dict[str, str], html_snippet: str) -> dict[str, Any]:
    text = " ".join([title, meta.get("description", ""), meta.get("og:title", ""), meta.get("og:description", ""), html_snippet]).lower()
    labels: list[str] = []
    if any(k in text for k in ["checkout", "cart", "product", "سلة", "شراء", "متجر", "الدفع"]):
        labels.append("ecommerce")
    if any(k in text for k in ["blog", "article", "post", "مدونة", "مقال"]):
        labels.append("blog")
    if any(k in text for k in ["docs", "documentation", "api", "مرجع", "توثيق", "واجهة برمجة"]):
        labels.append("documentation")
    if any(k in text for k in ["login", "sign in", "dashboard", "تسجيل الدخول", "لوحة التحكم"]):
        labels.append("web_app")
    if not labels:
        labels.append("general")
    return {"labels": labels[:3]}


def _detect_technologies(html_text: str, headers: dict[str, str], meta: dict[str, str], scripts: list[dict[str, Any]]) -> list[str]:
    h = html_text.lower()
    server = (headers.get("server") or headers.get("Server") or "").lower()
    powered = (headers.get("x-powered-by") or headers.get("X-Powered-By") or "").lower()
    set_cookie = (headers.get("set-cookie") or headers.get("Set-Cookie") or "").lower()
    tech: list[str] = []

    if "cloudflare" in server or "cf-ray" in (headers.get("cf-ray") or ""):
        tech.append("Cloudflare")
    if "nginx" in server:
        tech.append("Nginx")
    if "apache" in server:
        tech.append("Apache")
    if "caddy" in server:
        tech.append("Caddy")

    if "express" in powered:
        tech.append("Express")
    if "next.js" in powered or "__next_data__" in h or "/_next/" in h:
        tech.append("Next.js")
    if "nuxt" in h or "__nuxt" in h:
        tech.append("Nuxt")
    if "sveltekit" in h:
        tech.append("SvelteKit")
    if "wp-content/" in h or "wordpress" in h or "wp-" in set_cookie:
        tech.append("WordPress")
    if "shopify" in h or "cdn.shopify.com" in h:
        tech.append("Shopify")

    if "react" in h and ("reactroot" in h or "data-reactroot" in h):
        tech.append("React")
    if "angular" in h and "ng-version" in h:
        tech.append("Angular")
    if "vue" in h and ("data-v-" in h or "__vue" in h):
        tech.append("Vue")

    if meta.get("generator"):
        tech.append(f"generator:{meta.get('generator')[:40]}")

    for s in scripts:
        if s.get("kind") != "external":
            continue
        src = str(s.get("src") or "").lower()
        if not src:
            continue
        if "googletagmanager.com/gtm.js" in src:
            tech.append("Google Tag Manager")
        if "google-analytics.com" in src or "gtag/js" in src:
            tech.append("Google Analytics")
        if "cdn.jsdelivr.net" in src:
            tech.append("jsDelivr")
        if "unpkg.com" in src:
            tech.append("unpkg")

    uniq: list[str] = []
    for x in tech:
        if x not in uniq:
            uniq.append(x)
    return uniq[:18]


@app.post("/api/site/scan", summary="تحليل موقع شامل (HTML/CSS/JS/SEO/Performance/Security)", tags=["Site Analysis"])
async def site_scan(req: SiteScanRequest, request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")
    allowed, reason = security_shield.check(req.url)
    if not allowed:
        raise HTTPException(status_code=400, detail=reason or "الإدخال مرفوض")

    target_url = _validate_target_url(req.url)

    rendered = False
    render_error: str | None = None
    html_text: str | None = None
    final_url = target_url
    status_code = 0
    response_time_ms = 0.0
    resp_headers: dict[str, str] = {}
    cookies: list[dict[str, Any]] = []
    html_bytes = 0
    dynamic: dict[str, Any] | None = None

    if req.render:
        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                network_items: list[dict[str, Any]] = []

                def on_response(resp):
                    try:
                        if len(network_items) >= 200:
                            return
                        headers = resp.headers
                        cl = headers.get("content-length") or headers.get("Content-Length") or ""
                        size = int(cl) if cl.isdigit() else 0
                        req_obj = resp.request
                        network_items.append({
                            "url": resp.url,
                            "status": resp.status,
                            "type": getattr(req_obj, "resource_type", "other"),
                            "size": size,
                        })
                    except Exception:
                        return

                page.on("response", on_response)
                start = time.monotonic()
                r = await page.goto(target_url, wait_until="networkidle", timeout=15000)
                response_time_ms = round((time.monotonic() - start) * 1000, 1)
                if r:
                    status_code = int(r.status)
                    final_url = page.url
                    resp_headers = dict(r.headers)
                _validate_target_url(final_url)
                html_text = await page.content()
                html_bytes = len(html_text.encode("utf-8", errors="ignore"))
                rendered = True
                try:
                    dom_nodes = await page.evaluate("document.getElementsByTagName('*').length")
                    dom_links = await page.evaluate("document.links.length")
                    dom_scripts = await page.evaluate("document.scripts.length")
                    dom_images = await page.evaluate("document.images.length")
                except Exception:
                    dom_nodes = None
                    dom_links = None
                    dom_scripts = None
                    dom_images = None

                net_total = sum(int(i.get("size") or 0) for i in network_items)
                by_type: dict[str, int] = {}
                by_status: dict[str, int] = {}
                for it in network_items:
                    t = str(it.get("type") or "other")
                    s = str(it.get("status") or 0)
                    by_type[t] = by_type.get(t, 0) + 1
                    by_status[s] = by_status.get(s, 0) + 1
                dynamic = {
                    "network": {
                        "requests": len(network_items),
                        "total_bytes": net_total,
                        "by_type": by_type,
                        "by_status": by_status,
                        "samples": network_items[:25],
                    },
                    "dom": {
                        "nodes": dom_nodes,
                        "links": dom_links,
                        "scripts": dom_scripts,
                        "images": dom_images,
                    },
                }
                await browser.close()
        except HTTPException:
            raise
        except Exception as exc:
            render_error = type(exc).__name__

    if not html_text:
        try:
            start = time.monotonic()
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(12.0, connect=5.0),
                follow_redirects=True,
                verify=True,
                max_redirects=6,
                headers={"User-Agent": "QURABIA-SiteAnalyzer/1.0"},
            ) as client:
                resp = await client.get(target_url)
                response_time_ms = round((time.monotonic() - start) * 1000, 1)
                status_code = int(resp.status_code)
                for h in list(resp.history) + [resp]:
                    _validate_target_url(str(h.url))
                final_url = str(resp.url)
                resp_headers = dict(resp.headers)
                raw = resp.content[:2_000_000]
                html_bytes = len(raw)
                html_text = raw.decode(resp.encoding or "utf-8", errors="replace")

                set_cookies = resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else []
                for c in set_cookies[:20]:
                    cl = c.lower()
                    cookies.append({
                        "cookie": c[:300],
                        "secure": "secure" in cl,
                        "httponly": "httponly" in cl,
                        "samesite": ("samesite=" in cl),
                    })
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"تعذر جلب الموقع: {type(exc).__name__}") from exc

    parser = _HTMLAuditParser()
    with contextlib.suppress(Exception):
        parser.feed(html_text)

    title = "".join(parser.title_parts).strip()
    meta = dict(parser.meta)
    if any(l.get("rel") == "canonical" for l in parser.links):
        meta["link:canonical"] = next((l.get("href", "") for l in parser.links if l.get("rel") == "canonical"), "")

    is_https = final_url.startswith("https://")
    header_results = []
    for header_name in _SECURITY_HEADERS:
        header_results.append(_evaluate_header(header_name, resp_headers.get(header_name)))
    vuln_score = _calculate_vulnerability_score(header_results, is_https, resp_headers.get("Server"))
    quantum_resistance = _calculate_quantum_resistance(header_results, is_https)

    mixed_content = 0
    if is_https:
        mixed_content = html_text.lower().count("http://")

    seo_score, seo_issues = _score_seo(title, meta, parser.headings, parser.images_missing_alt, len(parser.jsonld))
    content_type = _content_classify(title, meta, html_text[:5000])

    origin = ""
    parsed_final = urlparse(final_url)
    if parsed_final.scheme and parsed_final.netloc:
        origin = f"{parsed_final.scheme}://{parsed_final.netloc}/"

    robots_info: dict[str, Any] = {"url": urljoin(origin, "robots.txt") if origin else "", "status": 0, "found": False}
    sitemap_info: dict[str, Any] = {"url": urljoin(origin, "sitemap.xml") if origin else "", "status": 0, "found": False}
    if origin:
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(6.0, connect=3.0), follow_redirects=True, verify=True, headers={"User-Agent": "QURABIA-SiteAnalyzer/1.0"}) as client:
                rr = await client.get(robots_info["url"])
                for h in list(rr.history) + [rr]:
                    _validate_target_url(str(h.url))
                robots_info["status"] = int(rr.status_code)
                robots_info["found"] = rr.status_code == 200
                ss = await client.get(sitemap_info["url"])
                for h in list(ss.history) + [ss]:
                    _validate_target_url(str(h.url))
                sitemap_info["status"] = int(ss.status_code)
                if ss.status_code == 200:
                    t = ss.text[:2000].lower()
                    sitemap_info["found"] = ("<urlset" in t) or ("<sitemapindex" in t) or ("sitemap" in t)
        except Exception:
            pass

    if not meta.get("viewport"):
        seo_score = max(0, seo_score - 6)
        seo_issues.append({"id": "missing_viewport", "severity": "medium", "title": "Missing viewport meta", "fix": "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">."})
    if not meta.get("charset"):
        seo_score = max(0, seo_score - 4)
        seo_issues.append({"id": "missing_charset", "severity": "low", "title": "Missing charset meta", "fix": "Add <meta charset=\"utf-8\"> early in <head>."})
    if not robots_info.get("found"):
        seo_score = max(0, seo_score - 2)
        seo_issues.append({"id": "missing_robots_txt", "severity": "low", "title": "robots.txt not found", "fix": "Add robots.txt to guide crawlers and include Sitemap: directive."})
    if not sitemap_info.get("found"):
        seo_score = max(0, seo_score - 2)
        seo_issues.append({"id": "missing_sitemap", "severity": "low", "title": "sitemap.xml not found", "fix": "Publish sitemap.xml and reference it from robots.txt."})
    if not meta.get("og:title") or not meta.get("og:description"):
        seo_issues.append({"id": "missing_open_graph", "severity": "low", "title": "OpenGraph tags missing", "fix": "Add og:title and og:description for better sharing previews."})
    if not meta.get("twitter:card"):
        seo_issues.append({"id": "missing_twitter_card", "severity": "low", "title": "Twitter Card meta missing", "fix": "Add twitter:card and related tags for social previews."})

    resource_links: list[dict[str, Any]] = []
    for sheet in parser.stylesheets:
        href = (sheet.get("href") or "").strip()
        if href:
            resource_links.append({"kind": "css", "url": urljoin(final_url, href), "media": (sheet.get("media") or "").strip()})
    for s in parser.scripts:
        if s.get("kind") == "external" and s.get("src"):
            resource_links.append({"kind": "js", "url": urljoin(final_url, str(s["src"]))})
    resource_links = resource_links[: req.max_resources]

    sem = asyncio.Semaphore(6)
    fetched_resources: list[dict[str, Any]] = []
    totals = {"css_bytes": 0, "js_bytes": 0, "other_bytes": 0}
    js_flags = {"has_eval": False, "has_new_function": False, "has_document_write": False, "has_innerhtml": False, "has_location_assign": False, "has_sourcemap_ref": False, "is_minified_like": False}
    css_flags = {"important_count": 0, "media_queries": 0, "id_selectors": 0, "has_sourcemap_ref": False}

    async def fetch_one(item: dict[str, Any], client: httpx.AsyncClient) -> None:
        url = item["url"]
        kind = item["kind"]
        async with sem:
            try:
                r = await client.get(url)
                b = r.content[: req.max_bytes_per_resource]
                size = len(b)
                ct = r.headers.get("content-type", "")[:120]
                rec: dict[str, Any] = {"kind": kind, "url": str(r.url), "status": r.status_code, "bytes": size, "content_type": ct}
                if kind == "js":
                    txt = b.decode(r.encoding or "utf-8", errors="ignore")
                    f = _scan_js_heuristics(txt)
                    for k, v in f.items():
                        js_flags[k] = bool(js_flags[k] or v)
                    totals["js_bytes"] += size
                    rec["flags"] = f
                elif kind == "css":
                    txt = b.decode(r.encoding or "utf-8", errors="ignore")
                    f = _scan_css_heuristics(txt)
                    css_flags["important_count"] += int(f["important_count"])
                    css_flags["media_queries"] += int(f["media_queries"])
                    css_flags["id_selectors"] += int(f["id_selectors"])
                    css_flags["has_sourcemap_ref"] = bool(css_flags["has_sourcemap_ref"] or f.get("has_sourcemap_ref"))
                    totals["css_bytes"] += size
                    rec["flags"] = f
                else:
                    totals["other_bytes"] += size
                fetched_resources.append(rec)
            except Exception:
                fetched_resources.append({"kind": kind, "url": url, "status": 0, "bytes": 0, "error": "fetch_failed"})

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(8.0, connect=4.0),
        follow_redirects=True,
        verify=True,
        headers={"User-Agent": "QURABIA-SiteAnalyzer/1.0"},
    ) as res_client:
        await asyncio.gather(*(fetch_one(i, res_client) for i in resource_links))

    blocking_scripts = sum(1 for s in parser.scripts if s.get("kind") == "external" and s.get("src") and not s.get("async") and not s.get("defer"))
    inline_script_bytes = sum(int(s.get("bytes") or 0) for s in parser.scripts if s.get("kind") == "inline")

    perf = {
        "response_time_ms": response_time_ms,
        "status_code": status_code,
        "html_bytes": html_bytes,
        "resources": {
            "count": len(resource_links),
            "fetched": fetched_resources,
            "totals": {**totals, "total_bytes": totals["css_bytes"] + totals["js_bytes"] + totals["other_bytes"]},
        },
        "render_blocking": {"scripts": blocking_scripts},
        "inline": {"script_bytes": inline_script_bytes},
    }

    security = {
        "is_https": is_https,
        "mixed_content_refs": mixed_content,
        "headers": header_results,
        "cookies": cookies,
        "vulnerability_score": vuln_score,
        "quantum_resistance_score": quantum_resistance,
    }

    frontend = {
        "html": {
            "lang": parser.lang,
            "title": title,
            "meta": {k: v[:500] for k, v in meta.items()},
            "headings": parser.headings[:200],
            "scripts_total": len(parser.scripts),
            "stylesheets_total": len(parser.stylesheets),
            "images_total": parser.images_total,
            "images_missing_alt": parser.images_missing_alt,
            "anchors_total": parser.anchors_total,
            "anchors_missing_rel_noopener": parser.anchors_missing_rel_noopener,
            "inputs_missing_label": parser.inputs_missing_label,
            "buttons_missing_label": parser.buttons_missing_label,
        },
        "js": {"flags": js_flags},
        "css": {"flags": css_flags},
        "structured_data": {"jsonld_count": len(parser.jsonld)},
    }

    tech = _detect_technologies(html_text, resp_headers, meta, parser.scripts)

    recommendations: list[dict[str, Any]] = []
    recommendations.extend(seo_issues)
    if security["mixed_content_refs"] > 0:
        recommendations.append({"id": "mixed_content", "severity": "high", "title": "Mixed content references", "fix": "Use https:// URLs for all resources when the page is HTTPS."})
    if not security["is_https"]:
        recommendations.append({"id": "no_https", "severity": "critical", "title": "HTTPS is not enabled", "fix": "Enable HTTPS and redirect HTTP to HTTPS."})
    if js_flags["has_eval"] or js_flags["has_new_function"]:
        recommendations.append({"id": "js_eval", "severity": "high", "title": "Dangerous JS patterns detected", "fix": "Avoid eval/new Function and sanitize dynamic code paths."})
    if js_flags["has_innerhtml"]:
        recommendations.append({"id": "js_innerhtml", "severity": "medium", "title": "Potential XSS sinks detected", "fix": "Avoid unsafe innerHTML or ensure strict sanitization and Trusted Types."})
    if parser.anchors_missing_rel_noopener:
        recommendations.append({"id": "noopener", "severity": "medium", "title": "target=_blank without rel=noopener", "fix": "Add rel=\"noopener noreferrer\" to external links using target=_blank."})
    if parser.inputs_missing_label or parser.buttons_missing_label:
        recommendations.append({"id": "a11y_labels", "severity": "medium", "title": "Accessibility labeling issues", "fix": "Add aria-label/labels for inputs and buttons."})
    total_bytes = int(perf["html_bytes"] + perf["resources"]["totals"]["total_bytes"])
    if total_bytes > 1_500_000:
        recommendations.append({"id": "heavy_page", "severity": "high", "title": "Heavy page payload", "fix": "Reduce total transferred bytes via compression, code-splitting, and image optimization."})
    if totals["js_bytes"] > 700_000:
        recommendations.append({"id": "heavy_js", "severity": "medium", "title": "High JavaScript weight", "fix": "Split bundles, remove unused code, and lazy-load non-critical modules."})
    if blocking_scripts > 0:
        recommendations.append({"id": "blocking_scripts", "severity": "medium", "title": "Render-blocking scripts detected", "fix": "Use defer/async for non-critical scripts and move critical logic to module with defer."})

    perf_score = 100
    perf_score -= int(min(60, response_time_ms / 25))
    perf_score -= int(min(30, total_bytes / 60000))
    perf_score -= int(min(15, blocking_scripts * 3))
    perf_score -= int(min(15, len(resource_links)))
    perf_score = max(0, min(100, perf_score))

    code_score = 100
    if js_flags["has_eval"]:
        code_score -= 18
    if js_flags["has_new_function"]:
        code_score -= 12
    if js_flags["has_document_write"]:
        code_score -= 10
    if js_flags["has_innerhtml"]:
        code_score -= 8
    if js_flags["has_sourcemap_ref"]:
        code_score -= 4
    if css_flags["important_count"] > 80:
        code_score -= 6
    if css_flags["has_sourcemap_ref"]:
        code_score -= 2
    code_score = max(0, min(100, code_score))

    scores = {
        "seo": seo_score,
        "security": max(0, 100 - vuln_score),
        "performance": perf_score,
        "code_quality": code_score,
        "ux": max(0, 100 - min(20, parser.inputs_missing_label + parser.buttons_missing_label) - min(20, parser.images_missing_alt)),
    }

    return JSONResponse(content={
        "url": target_url,
        "final_url": final_url,
        "rendered": rendered,
        "render_error": render_error,
        "dynamic": dynamic,
        "performance": perf,
        "seo": {"score": seo_score, "robots_txt": robots_info, "sitemap": sitemap_info},
        "tech": {"detected": tech},
        "security": security,
        "frontend": frontend,
        "content": content_type,
        "scores": scores,
        "recommendations": recommendations[:60],
    })


_SITE_AI_SYSTEM_PROMPT_AR = """أنت خبير تدقيق مواقع ويب (SEO/Performance/Security/Frontend Code Quality) في منصة QURABIA.
مهمتك: تحليل تقرير فحص موقع (JSON) وإنتاج توصيات عملية قابلة للتنفيذ.

قواعد:
1) ركّز على HTML/CSS/JS وقياس الأداء وتحسينات SEO وأمن الرؤوس والمحتوى المختلط، ووجود robots.txt و sitemap.xml
2) أعطِ قائمة مرتبة بالأولوية (Critical/High/Medium/Low)
3) قدّم اقتراحات UX ذكية (تحسين تدفق المستخدم، تحسين قابلية القراءة، تقليل التشتت)
4) اذكر أمثلة محددة من التقرير (عناوين/قيم/عدادات/tech detected) ولا تخترع بيانات
5) اكتب بالعربية الفصحى، واستخدم المصطلحات الإنجليزية بين قوسين عند الحاجة
6) لا تتجاوز 900 كلمة"""


_SITE_AI_SYSTEM_PROMPT_EN = """You are a senior web auditing expert (SEO/Performance/Security/Frontend Code Quality) for QURABIA.
Your task: analyze a website scan report (JSON) and produce actionable, prioritized recommendations.

Rules:
1) Cover HTML/CSS/JS, performance, SEO, security headers, mixed content, robots.txt and sitemap.xml
2) Output prioritized findings (Critical/High/Medium/Low)
3) Include smart UX suggestions
4) Reference concrete values from the report (including detected technologies); do not invent data
5) Keep it concise (<= 900 words)"""


def _site_ai_fallback(report: dict[str, Any], lang: str) -> str:
    scores = report.get("scores", {})
    seo = scores.get("seo")
    sec = scores.get("security")
    perf = scores.get("performance")
    final_url = report.get("final_url") or report.get("url")
    recs = report.get("recommendations", [])
    top = recs[:10] if isinstance(recs, list) else []
    if lang == "en":
        lines = [
            f"Website Analysis — {final_url}",
            "",
            f"Scores: SEO={seo} Security={sec} Performance={perf}",
            "",
            "Top findings:",
        ]
        for r in top:
            lines.append(f"- [{r.get('severity','?')}] {r.get('title','')}: {r.get('fix','')}")
        lines.append("")
        lines.append("Next steps: fix critical security/HTTPS issues, then SEO basics (title/description/canonical), then performance (reduce JS/CSS bytes).")
        return "\n".join(lines)
    lines = [
        f"تقرير تحليل الموقع — {final_url}",
        "",
        f"الدرجات: SEO={seo} | Security={sec} | Performance={perf}",
        "",
        "أبرز الملاحظات:",
    ]
    for r in top:
        lines.append(f"- [{r.get('severity','?')}] {r.get('title','')}: {r.get('fix','')}")
    lines.append("")
    lines.append("الخطوة التالية: عالج المخاطر الحرجة أولاً (HTTPS/المحتوى المختلط)، ثم أساسيات SEO، ثم تحسين الأداء بتقليل حجم JS/CSS.")
    return "\n".join(lines)


@app.post("/api/site/ai-insights", summary="تحليل تقرير فحص موقع بالذكاء الاصطناعي", tags=["Site Analysis"])
async def site_ai_insights(req: SiteAIAnalyzeRequest, request: Request):
    if not _check_rate_limit(request):
        raise HTTPException(status_code=429, detail="تجاوزت الحد الأقصى للطلبات")

    provider = (req.provider or "auto").strip().lower()
    lang = (req.language or "ar").strip().lower()
    system_prompt = _SITE_AI_SYSTEM_PROMPT_AR if lang.startswith("ar") else _SITE_AI_SYSTEM_PROMPT_EN
    prompt_content = "Analyze the following website scan report JSON and produce recommendations:\n\n" + str(req.report)[:14000]

    if provider in ("auto", "gemini"):
        key = (os.environ.get("GEMINI_API_KEY") or "").strip()
        if key:
            try:
                payload = {"contents": [{"parts": [{"text": system_prompt + "\n\n" + prompt_content}]}]}
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}"
                async with httpx.AsyncClient(timeout=25.0) as client:
                    r = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if r.is_success:
                    data = r.json()
                    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if isinstance(text, str) and text.strip():
                        return JSONResponse(content={"provider": "gemini", "text": text.strip()[:_LLM_MAX_TEXT_LENGTH], "mode": "ai"})
            except Exception:
                pass

    if provider in ("auto", "grok"):
        key = (os.environ.get("GROK_API_KEY") or "").strip()
        if key:
            try:
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
                if r.is_success:
                    data = r.json()
                    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if isinstance(text, str) and text.strip():
                        return JSONResponse(content={"provider": "grok", "text": text.strip()[:_LLM_MAX_TEXT_LENGTH], "mode": "ai"})
            except Exception:
                pass

    if provider in ("auto", "openrouter"):
        key = (os.environ.get("OPENROUTER_API_KEY") or "").strip()
        model = (os.environ.get("OPENROUTER_MODEL") or "openai/gpt-4o-mini").strip()
        if key:
            try:
                payload = {
                    "model": model,
                    "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt_content}],
                    "temperature": 0.3,
                    "stream": False,
                }
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key}",
                    "X-Title": "QURABIA",
                }
                referer = (os.environ.get("APP_PUBLIC_URL") or "https://qurabia.com").strip()
                if referer:
                    headers["HTTP-Referer"] = referer
                async with httpx.AsyncClient(timeout=25.0) as client:
                    r = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
                if r.is_success:
                    data = r.json()
                    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if isinstance(text, str) and text.strip():
                        return JSONResponse(content={"provider": "openrouter", "text": text.strip()[:_LLM_MAX_TEXT_LENGTH], "mode": "ai"})
            except Exception:
                pass

    return JSONResponse(content={"provider": "local", "text": _site_ai_fallback(req.report, lang), "mode": "local_fallback"})
