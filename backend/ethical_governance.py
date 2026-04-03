"""
ethical_governance.py – وحدة الحوكمة الأخلاقية المستقلة
QURABIA

وحدة مستقلة قابلة لإعادة الاستخدام لتقييم القرارات وفق
الدستور الأخلاقي الرباعي:
- Non-Maleficence (عدم الإيذاء)
- Beneficence (الإحسان)
- Autonomy (الاستقلالية)
- Justice (العدالة)
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Iterable, List


# ====================================================================
# ثوابت الدستور الأخلاقي
# ====================================================================

ETHICAL_CONSTITUTION: Dict[str, float] = {
    "nonMaleficence": 0.95,
    "beneficence": 0.80,
    "autonomy": 0.90,
    "justice": 0.85,
}


class EthicsViolationType(str, Enum):
    HARM_RISK = "harm_risk"
    LOW_BENEFIT = "low_benefit"
    AUTONOMY_OVERRIDE = "autonomy_override"
    FAIRNESS_BIAS = "fairness_bias"


@dataclass
class EthicsScore:
    nonMaleficence: float
    beneficence: float
    autonomy: float
    justice: float

    def as_dict(self) -> Dict[str, float]:
        return {
            "nonMaleficence": self.nonMaleficence,
            "beneficence": self.beneficence,
            "autonomy": self.autonomy,
            "justice": self.justice,
        }


@dataclass
class EthicsDecision:
    approved: bool
    score: EthicsScore
    average_score: float
    violations: List[EthicsViolationType]
    notes: str


class EthicalGovernanceSystem:
    """محرك الحوكمة الأخلاقية للنظام الكمي."""

    def __init__(self, constitution: Dict[str, float] | None = None) -> None:
        self.constitution = dict(constitution or ETHICAL_CONSTITUTION)

    def evaluate(self, score: EthicsScore) -> EthicsDecision:
        payload = score.as_dict()
        violations: List[EthicsViolationType] = []

        if payload["nonMaleficence"] < self.constitution["nonMaleficence"]:
            violations.append(EthicsViolationType.HARM_RISK)
        if payload["beneficence"] < self.constitution["beneficence"]:
            violations.append(EthicsViolationType.LOW_BENEFIT)
        if payload["autonomy"] < self.constitution["autonomy"]:
            violations.append(EthicsViolationType.AUTONOMY_OVERRIDE)
        if payload["justice"] < self.constitution["justice"]:
            violations.append(EthicsViolationType.FAIRNESS_BIAS)

        avg = sum(payload.values()) / 4.0
        approved = len(violations) == 0

        notes = (
            "Ethical policy satisfied."
            if approved
            else f"Policy violations detected: {[v.value for v in violations]}"
        )

        return EthicsDecision(
            approved=approved,
            score=score,
            average_score=avg,
            violations=violations,
            notes=notes,
        )

    def enforce_minimum(self, values: Dict[str, float]) -> Dict[str, float]:
        """Clamp scores to [0, 1] and return normalized dict."""
        normalized: Dict[str, float] = {}
        for k in self.constitution.keys():
            v = values.get(k, 0.0)
            normalized[k] = max(0.0, min(1.0, float(v)))
        return normalized

    def merge_signals(self, signals: Iterable[Dict[str, float]]) -> EthicsScore:
        """Average multiple ethics signals into one final score."""
        merged = {k: 0.0 for k in self.constitution.keys()}
        count = 0

        for signal in signals:
            norm = self.enforce_minimum(signal)
            for key, value in norm.items():
                merged[key] += value
            count += 1

        if count == 0:
            return EthicsScore(1.0, 1.0, 1.0, 1.0)

        for key in merged:
            merged[key] /= count

        return EthicsScore(
            nonMaleficence=merged["nonMaleficence"],
            beneficence=merged["beneficence"],
            autonomy=merged["autonomy"],
            justice=merged["justice"],
        )


# Singleton helper
ethics_governor = EthicalGovernanceSystem()
