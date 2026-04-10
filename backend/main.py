import asyncio
import json
import logging
import os
import signal
import sqlite3
import sys
import threading
import time
from collections import defaultdict, deque
from typing import Any, Dict, List, Optional

import httpx
import structlog
from arabic_quantum_bridge import router as arabic_quantum_router
from fastapi import FastAPI, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from memory_system import MemoryEntry, MemoryType, StructuredMemoryStore, memory_freshness_warning
from pydantic import BaseModel, Field, model_validator
from quantum_agi_engine import ErrorEvent, GenesisAlgorithmDNA, GenesisEngine, LearningMemory, QuantumAGIEngine
from quantum_chemistry import quantum_chemistry_engine
from starlette.middleware.gzip import GZipMiddleware

# ── Structured logging configuration ──────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer() if os.environ.get("APP_ENV") == "production"
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
    _blackbody_error: Optional[str] = None
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
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.add_middleware(GZipMiddleware, minimum_size=800)

# ── Rate Limiting: حد أقصى 60 طلب/دقيقة لكل IP ──────────────────────────────
_RATE_LIMIT_REQUESTS = _env_int("RATE_LIMIT_REQUESTS", 60)
_RATE_LIMIT_WINDOW = _env_int("RATE_LIMIT_WINDOW_S", 60)
_MAX_BODY_BYTES = _env_int("MAX_BODY_BYTES", 1024 * 256)
_RATE_LIMIT_DB_PATH = os.environ.get("RATE_LIMIT_DB_PATH", "")

# ── In-memory fallback store (used when no DB path is configured) ──────────
_rate_store: dict = defaultdict(deque)
_CLEANUP_INTERVAL = 500
_request_counter = 0
_rate_lock = threading.Lock()

# ── SQLite-backed persistent store (optional) ─────────────────────────────
_rate_db: Optional[sqlite3.Connection] = None
if _RATE_LIMIT_DB_PATH:
    try:
        _rate_db = sqlite3.connect(_RATE_LIMIT_DB_PATH, check_same_thread=False)
        _rate_db.execute("PRAGMA journal_mode=WAL")
        _rate_db.execute(
            "CREATE TABLE IF NOT EXISTS rate_hits "
            "(ip TEXT NOT NULL, ts REAL NOT NULL)"
        )
        _rate_db.execute(
            "CREATE INDEX IF NOT EXISTS idx_rate_ip_ts ON rate_hits (ip, ts)"
        )
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
    context: Dict[str, Any] = {}


@app.get("/health")
def health() -> dict:
    t0 = time.monotonic()

    # ── Database check ────────────────────────────────────────────
    db_ok = True
    db_error: Optional[str] = None
    if _rate_db is not None:
        try:
            _rate_db.execute("SELECT 1")
        except Exception:
            db_ok = False
            db_error = "connection_failed"

    # ── Memory usage ──────────────────────────────────────────────
    mem_mb: Optional[float] = None
    try:
        import resource
        rss_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        # macOS returns bytes, Linux returns KB
        import platform
        if platform.system() == "Darwin":
            mem_mb = round(rss_kb / (1024 * 1024), 1)
        else:
            mem_mb = round(rss_kb / 1024, 1)
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
    }


# ── Strategic Platform: AUTDIE Security ──────────────────────────────────────

class AUTDIERequest(BaseModel):
    kappa: float = Field(default=0.7854, ge=0.0, le=3.1416)
    lam: float = Field(default=1.0, ge=0.0, le=10.0)


@app.post("/api/autdie")
def autdie_compute(req: AUTDIERequest) -> Dict[str, Any]:
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
def al_utaibi_v2(req: AlUtaibiV2Request) -> Dict[str, Any]:
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
    except Exception as e:
        logger.exception("POST /process failed for input=%r", req.input[:80])
        raise HTTPException(status_code=500, detail="Internal server error")


class LearningErrorRequest(BaseModel):
    kind: str = Field("error", max_length=64)
    message: str = Field(..., max_length=500)
    url: Optional[str] = Field("", max_length=2048)
    stack: Optional[str] = Field("", max_length=4000)
    user_agent: Optional[str] = Field("", max_length=320)
    release: Optional[str] = Field("", max_length=128)
    ts: Optional[float] = None
    context: Dict[str, Any] = {}


@app.post("/api/learning/error")
def learning_error(req: LearningErrorRequest) -> Dict[str, Any]:
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
def learning_summary(top: int = Query(8, ge=1, le=100)) -> Dict[str, Any]:
    try:
        return learning.summary(top=top)
    except Exception as e:
        logger.error("learning_summary error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to retrieve learning summary")


@app.get("/api/learning/metrics")
def learning_metrics(window_s: int = Query(3600, ge=1, le=86400), top: int = Query(6, ge=1, le=100)) -> Dict[str, Any]:
    try:
        return learning.metrics(window_s=window_s, top=top)
    except Exception as e:
        logger.error("learning_metrics error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to retrieve learning metrics")


_LLM_MAX_TEXT_LENGTH = 4000


class LLMAnalyzeRequest(BaseModel):
    results: Dict[str, Any]


class LLMAnalyzeResponse(BaseModel):
    provider: str
    text: str
    mode: str


def _local_llm_fallback(results: Dict[str, Any]) -> str:
    fidelity = results.get("fidelity")
    energy = results.get("energy")
    parts: List[str] = []
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
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
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
                    "content": ("Analyze this quantum telemetry and provide a brief technical insight: " + str(req.results))[:12000],
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
                    "content": ("Analyze this quantum telemetry and provide a brief technical insight: " + str(req.results))[:12000],
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
            return LLMAnalyzeResponse(provider="openrouter", text=_local_llm_fallback(req.results), mode="local_fallback")
        data = r.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not isinstance(text, str) or not text.strip():
            return LLMAnalyzeResponse(provider="openrouter", text=_local_llm_fallback(req.results), mode="local_fallback")
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
    type_distribution: Dict[str, int] = {}
    overall_score: int = Field(0, ge=0, le=100)
    insight_count: int = Field(0, ge=0)
    critical_insights: int = Field(0, ge=0)


class AnalyticsResponse(BaseModel):
    provider: str
    analysis: str
    recommendations: List[str]
    score_assessment: str
    mode: str


def _local_analytics_fallback(req: AnalyticsRequest) -> AnalyticsResponse:
    """تحليل محلي عند عدم توفر مفتاح AI."""
    parts: List[str] = []
    recommendations: List[str] = []

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
        "ممتاز" if req.overall_score >= 80
        else "جيد" if req.overall_score >= 60
        else "مقبول" if req.overall_score >= 40
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
                    {"role": "system", "content": (
                        "أنت خبير في الحوسبة الكمومية تعمل في منصة QURABIA. "
                        "حلل النتائج التالية وقدم تحليلاً تقنياً شاملاً بالعربية "
                        "مع توصيات عملية. كن محدداً ودقيقاً."
                    )},
                    {"role": "user", "content": (
                        f"حلل هذه البيانات الإحصائية للمحاكاات الكمومية:\n"
                        f"عدد المحاكاات: {req.total_simulations}\n"
                        f"متوسط الطاقة: {req.avg_energy:.6f} Ha\n"
                        f"متوسط الدقة: {req.avg_fidelity:.2f}%\n"
                        f"أفضل طاقة: {req.best_energy:.6f} Ha\n"
                        f"أفضل دقة: {req.best_fidelity:.2f}%\n"
                        f"أنواع المحاكاة: {req.type_distribution}\n"
                        f"التقييم الشامل: {req.overall_score}/100\n"
                        f"عدد التنبيهات الحرجة: {req.critical_insights}"
                    )},
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
                    "contents": [{"parts": [{"text": (
                        f"حلل نتائج المحاكاات الكمومية التالية وقدم تحليلاً تقنياً بالعربية:\n"
                        f"عدد المحاكاات: {req.total_simulations}, "
                        f"متوسط الطاقة: {req.avg_energy:.6f} Ha, "
                        f"متوسط الدقة: {req.avg_fidelity:.2f}%, "
                        f"التقييم: {req.overall_score}/100"
                    )}]}]
                }
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}"
                async with httpx.AsyncClient(timeout=12.0) as client:
                    r = await client.post(url, json=gemini_payload, headers={"Content-Type": "application/json"})
                if not r.is_success:
                    continue
                data = r.json()
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
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
    temperature_K: float = Field(..., gt=0)
    nu_min: float = Field(1e9, gt=0)
    nu_max: float = Field(1e14, gt=0)
    n_points: int = Field(200, ge=10, le=5000)
    enable_qed: Optional[bool] = True
    enable_lqg: Optional[bool] = True
    enable_gup: Optional[bool] = True
    sz_y_param: Optional[float] = 1e-4
    cavity_radius_m: Optional[float] = 0.02
    gup_beta0: Optional[float] = 1.0
    lqg_C2: Optional[float] = 1.0

    @model_validator(mode="after")
    def _validate_ranges(self) -> "BlackbodyRequest":
        if self.nu_max <= self.nu_min:
            raise ValueError("nu_max must be > nu_min")
        return self


class GenesisPopulationRequest(BaseModel):
    size_per_type: int = Field(3, ge=1, le=100)
    seed: Optional[int] = None


class GenesisDNAIn(BaseModel):
    algorithm_type: str
    genes: Dict[str, Any]
    generation: int = 0
    fitness: float = 0.0
    age: int = 0
    parent_fitness: float = 0.0
    id: Optional[str] = None


class GenesisMutateRequest(BaseModel):
    dna: GenesisDNAIn
    mutation_rate: float = Field(0.3, ge=0.0, le=1.0)


class GenesisCrossoverRequest(BaseModel):
    parent_a: GenesisDNAIn
    parent_b: GenesisDNAIn


class GenesisEvolveRequest(BaseModel):
    population: List[GenesisDNAIn] = Field(..., min_length=2, max_length=500)
    mutation_rate: float = Field(0.3, ge=0.0, le=1.0)
    elite_fraction: float = Field(0.2, ge=0.0, le=0.5)
    tournament_size: int = Field(3, ge=2, le=20)


@app.post("/api/blackbody/spectrum")
def blackbody_spectrum(req: BlackbodyRequest) -> Dict[str, Any]:
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
def genesis_population(req: GenesisPopulationRequest) -> Dict[str, Any]:
    try:
        population = genesis.create_population(size_per_type=req.size_per_type, seed=req.seed)
        return {"size": len(population), "population": [d.to_dict() for d in population]}
    except Exception as e:
        logger.error("genesis_population error: %s", e)
        raise HTTPException(status_code=400, detail="Failed to create genesis population")


@app.post("/api/genesis/mutate")
def genesis_mutate(req: GenesisMutateRequest) -> Dict[str, Any]:
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
def genesis_crossover(req: GenesisCrossoverRequest) -> Dict[str, Any]:
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
def genesis_evolve(req: GenesisEvolveRequest) -> Dict[str, Any]:
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
def genesis_status() -> Dict[str, Any]:
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
    tags: List[str] = []


class MemoryUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    type: Optional[str] = Field(None, pattern=r"^(user|feedback|project|reference)$")
    content: Optional[str] = Field(None, max_length=10000)
    tags: Optional[List[str]] = None


class MemorySearchRequest(BaseModel):
    query: str = Field(..., max_length=500)
    max_results: int = Field(5, ge=1, le=50)


@app.post("/api/memory/create")
def memory_create(req: MemoryCreateRequest) -> Dict[str, Any]:
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
def memory_list(memory_type: Optional[str] = None) -> Dict[str, Any]:
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
def memory_get(entry_id: str) -> Dict[str, Any]:
    entry = memory_store.get(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Memory entry not found")
    result = entry.to_dict()
    freshness = memory_freshness_warning(entry.updated_at)
    if freshness:
        result["freshness_warning"] = freshness
    return result


@app.put("/api/memory/{entry_id}")
def memory_update(entry_id: str, req: MemoryUpdateRequest) -> Dict[str, Any]:
    try:
        updates: Dict[str, Any] = {}
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
def memory_delete(entry_id: str) -> Dict[str, Any]:
    if not memory_store.delete(entry_id):
        raise HTTPException(status_code=404, detail="Memory entry not found")
    return {"ok": True}


@app.post("/api/memory/search")
def memory_search(req: MemorySearchRequest) -> Dict[str, Any]:
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
def memory_manifest() -> Dict[str, Any]:
    return {"manifest": memory_store.format_manifest()}


# ── Arabic Morphological Analysis API ─────────────────────────────────────────
# مستوحى من pysarf/Rashidbm — تحليل صرفي عربي متقدم
# ──────────────────────────────────────────────────────────────────────────────

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
    root_letters: List[str]
    pattern: str
    semantic_field: str
    confidence: float
    word_type: str
    is_definite: bool
    derivatives: List[str]


class ArabicAnalysisResponse(BaseModel):
    """استجابة التحليل الصرفي"""
    text: str
    words: List[ArabicRootResult]
    unique_roots: int
    semantic_fields: List[str]
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
    results: List[ArabicRootResult] = []
    unique_roots_set: set = set()
    semantic_fields_set: set = set()

    for word in raw_words:
        cleaned = word.strip()
        if not cleaned or not re.search(r'[\u0600-\u06FF]', cleaned):
            continue

        normalized = _normalize_arabic(cleaned)
        is_definite = normalized.startswith('ال')

        # هل هي أداة؟
        if normalized in _ARABIC_PARTICLES:
            results.append(ArabicRootResult(
                word=cleaned, root='', root_letters=[], pattern='',
                semantic_field='particle', confidence=1.0,
                word_type='particle', is_definite=False, derivatives=[]
            ))
            continue

        extraction = _extract_root_backend(cleaned)
        root = extraction['root']
        entry = extraction.get('entry')
        confidence = extraction['confidence']

        root_letters = list(root)[:3]
        unique_roots_set.add(root)
        field = entry['field'] if entry else 'unknown'
        if field != 'unknown':
            semantic_fields_set.add(field)

        results.append(ArabicRootResult(
            word=cleaned,
            root=root,
            root_letters=root_letters,
            pattern='فعل',
            semantic_field=field,
            confidence=confidence,
            word_type='noun' if is_definite else 'unknown',
            is_definite=is_definite,
            derivatives=entry['derivatives'] if entry else [],
        ))

    # حساب التماسك الدلالي
    field_counts: Dict[str, int] = {}
    for r in results:
        if r.semantic_field not in ('unknown', 'particle'):
            field_counts[r.semantic_field] = field_counts.get(r.semantic_field, 0) + 1
    total_analyzed = sum(field_counts.values())
    coherence = max(field_counts.values()) / total_analyzed if total_analyzed > 1 else (1.0 if total_analyzed == 1 else 0.0)

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
        return JSONResponse(content={
            "molecule": result.molecule,
            "exact_energy_hartree": result.exact_energy_hartree,
            "estimated_energy_hartree": result.estimated_energy_hartree,
            "error_milli_hartree": result.error_milli_hartree,
            "optimization_steps": result.optimization_steps,
            "converged": result.converged,
            "final_gradient_norm": result.final_gradient_norm,
            "convergence_trace": result.convergence_trace,
        })
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
                await websocket.send_json({
                    "step": i + 1,
                    "total": steps,
                    "progress": round((i + 1) / steps * 100, 1),
                    "partial": {"iteration": i, "status": "running"}
                })
                await asyncio.sleep(0.3)
            await websocket.send_json({
                "done": True,
                "result": {
                    "success": True,
                    "simType": payload.get("simType", "PHYSICS"),
                    "energy": -1.1372,
                    "fidelity": 0.9985,
                    "message": "اكتملت المحاكاة الكمومية"
                }
            })
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"error": str(exc)})
        except Exception:
            pass


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
        try:
            _rate_db.close()
        except Exception:
            pass

    logger.info("shutdown_complete")
    sys.exit(0)


for _sig in (signal.SIGTERM, signal.SIGINT):
    signal.signal(_sig, _graceful_shutdown)
