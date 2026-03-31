from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
from typing import Any, Dict, List, Optional
import logging
import os
import time
from collections import defaultdict

from quantum_agi_engine import GenesisAlgorithmDNA, GenesisEngine, QuantumAGIEngine

logger = logging.getLogger("qurabia.api")

app = FastAPI(title="QURABIA Backend API")
engine = QuantumAGIEngine()
genesis = GenesisEngine()

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
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate Limiting: حد أقصى 60 طلب/دقيقة لكل IP ──────────────────────────────
_RATE_LIMIT_REQUESTS = 60
_RATE_LIMIT_WINDOW = 60  # ثانية
_rate_store: dict = defaultdict(list)


def _check_rate_limit(request: Request) -> bool:
    """يُعيد True إذا كان الطلب مسموحاً به، وFalse إذا تجاوز الحد."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    window_start = now - _RATE_LIMIT_WINDOW
    _rate_store[client_ip] = [t for t in _rate_store[client_ip] if t > window_start]
    if len(_rate_store[client_ip]) >= _RATE_LIMIT_REQUESTS:
        return False
    _rate_store[client_ip].append(now)
    return True


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if not _check_rate_limit(request):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."},
            headers={"Retry-After": str(_RATE_LIMIT_WINDOW)},
        )
    return await call_next(request)


class ProcessRequest(BaseModel):
    input: str
    context: Dict[str, Any] = {}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "blackbody": {"available": _blackbody is not None, "error": _blackbody_error}}


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/genesis/population")
def genesis_population(req: GenesisPopulationRequest) -> Dict[str, Any]:
    try:
        population = genesis.create_population(size_per_type=req.size_per_type, seed=req.seed)
        return {"size": len(population), "population": [d.to_dict() for d in population]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
        raise HTTPException(status_code=400, detail=str(e))


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
        raise HTTPException(status_code=400, detail=str(e))
