from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
from typing import Any, Dict, List, Optional

from quantum_agi_engine import QuantumAGIEngine

app = FastAPI(title="QURABIA Backend API")
engine = QuantumAGIEngine()

try:
    from blackbody import BlackbodyEngine
    _blackbody = BlackbodyEngine()
    _blackbody_error: Optional[str] = None
except Exception:
    _blackbody = None
    _blackbody_error = "import_failed"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://qurabia.com",
        "https://www.qurabia.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
