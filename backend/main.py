from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict

from quantum_agi_engine import QuantumAGIEngine

app = FastAPI(title="Quantum AGI Engine API")
engine = QuantumAGIEngine()


class ProcessRequest(BaseModel):
    input: str
    context: Dict[str, Any] = {}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


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
