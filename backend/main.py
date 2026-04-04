from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
import threading
import time
from typing import Any, Dict, List, Optional
import logging
import os
from collections import defaultdict, deque
from starlette.middleware.gzip import GZipMiddleware

from quantum_agi_engine import ErrorEvent, GenesisAlgorithmDNA, GenesisEngine, LearningMemory, QuantumAGIEngine
from memory_system import MemoryEntry, MemoryType, StructuredMemoryStore, memory_freshness_warning

logger = logging.getLogger("qurabia.api")

app = FastAPI(title="QURABIA Backend API", docs_url=None, redoc_url=None, openapi_url=None)
engine = QuantumAGIEngine()
genesis = GenesisEngine()


def _env_int(name: str, default: int) -> int:
    """Parse an integer environment variable, falling back to *default* on invalid input."""
    try:
        return int(os.environ.get(name, str(default)))
    except ValueError:
        logger.warning("Invalid value for env var %s; using default %d", name, default)
        return default


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
_rate_store: dict = defaultdict(deque)
# نظّف المدخلات القديمة بعد كل هذا العدد من الطلبات لمنع تراكم الذاكرة
_CLEANUP_INTERVAL = 500
_request_counter = 0
_rate_lock = threading.Lock()


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
    return resp


class ProcessRequest(BaseModel):
    input: str
    context: Dict[str, Any] = {}


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "blackbody": {"available": _blackbody is not None, "error": _blackbody_error},
        "learning": {"total_events": learning.summary(top=1).get("total_events", 0)},
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


@app.post("/api/blackbody/spectrum")
def blackbody_spectrum(req: BlackbodyRequest) -> Dict[str, Any]:
    if _blackbody is None:
        raise HTTPException(status_code=503, detail="Blackbody engine unavailable")
    try:
        _blackbody.enable_qed = bool(req.enable_qed)
        _blackbody.enable_lqg = bool(req.enable_lqg)
        _blackbody.enable_gup = bool(req.enable_gup)
        _blackbody.sz_y_param = float(req.sz_y_param or 1e-4)
        _blackbody.cavity_radius_m = float(req.cavity_radius_m or 0.02)
        _blackbody.gup_beta0 = float(req.gup_beta0 or 1.0)
        _blackbody.lqg_C2 = float(req.lqg_C2 or 1.0)
        return _blackbody.spectrum(req.temperature_K, req.nu_min, req.nu_max, req.n_points)
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
