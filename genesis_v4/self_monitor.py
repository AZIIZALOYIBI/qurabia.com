"""
╔════════════════════════════════════════════════════════════╗
║  SelfMonitor — المراقبة الذاتية مع PSI + Concept Drift   ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.metrics import roc_auc_score


class SelfMonitor:
    """المراقبة الذاتية v2 — PSI + Concept Drift."""

    PSI_GREEN = 0.1
    PSI_YELLOW = 0.2

    def __init__(self, threshold_drop: float = 0.02) -> None:
        self.threshold = threshold_drop
        self.performance_log: List[Dict[str, Any]] = []
        self.drift_log: List[Dict[str, Any]] = []
        self.alerts: List[str] = []
        self.baseline_auc: Optional[float] = None
        self.baseline_distributions: Optional[Dict[int, Dict[str, Any]]] = None
        self.feature_names: Optional[list] = None

    def set_baseline(
        self,
        auc: float,
        X_baseline: Optional[np.ndarray] = None,
        feature_names: Optional[list] = None,
    ) -> None:
        self.baseline_auc = auc
        self.feature_names = feature_names
        if X_baseline is not None:
            self.baseline_distributions = self._compute_distributions(X_baseline)
        self.performance_log.append(
            {"timestamp": datetime.now().isoformat(), "auc": auc, "status": "baseline"},
        )

    @staticmethod
    def _compute_distributions(
        X: np.ndarray, n_bins: int = 10,
    ) -> Dict[int, Dict[str, Any]]:
        dists: Dict[int, Dict[str, Any]] = {}
        for col in range(X.shape[1]):
            vals = X[:, col]
            bins = np.percentile(vals, np.linspace(0, 100, n_bins + 1))
            bins = np.unique(bins)
            if len(bins) < 3:
                bins = np.array([vals.min() - 1, vals.mean(), vals.max() + 1])
            hist, _ = np.histogram(vals, bins=bins)
            total = max(hist.sum(), 1)
            hist = hist / total
            hist = np.clip(hist, 0.0001, None)
            dists[col] = {"bins": bins, "hist": hist}
        return dists

    @staticmethod
    def compute_psi(expected: np.ndarray, actual: np.ndarray) -> float:
        expected = np.clip(expected, 0.0001, None)
        actual = np.clip(actual, 0.0001, None)
        return float(np.sum((actual - expected) * np.log(actual / expected)))

    def check_data_drift(self, X_new: np.ndarray) -> Dict[int, float]:
        if self.baseline_distributions is None:
            return {}
        psi_results: Dict[int, float] = {}
        for col, base_dist in self.baseline_distributions.items():
            if col >= X_new.shape[1]:
                continue
            bins = base_dist["bins"]
            expected = base_dist["hist"]
            new_hist, _ = np.histogram(X_new[:, col], bins=bins)
            new_hist = new_hist.astype(float)
            new_hist[0] += np.sum(X_new[:, col] < bins[0])
            new_hist[-1] += np.sum(X_new[:, col] > bins[-1])
            total = max(new_hist.sum(), 1)
            new_hist = new_hist / total
            new_hist = np.clip(new_hist, 0.0001, None)
            psi_results[col] = self.compute_psi(expected, new_hist)
        return psi_results

    def check_performance(self, model: Any, X_new: np.ndarray, y_new: np.ndarray) -> bool:
        y_prob = model.predict_proba(X_new)[:, 1]
        auc = roc_auc_score(y_new, y_prob)
        drop = (self.baseline_auc or auc) - auc
        status = "degraded" if drop > self.threshold else "healthy"
        self.performance_log.append(
            {
                "timestamp": datetime.now().isoformat(),
                "auc": auc,
                "drop": drop,
                "status": status,
            },
        )
        icon = "✅" if status == "healthy" else "⚠️"
        print(f"   {icon} AUC:{auc:.4f} | Δ:{drop * 100:+.2f}%")
        return status == "degraded"

    def full_health_check(
        self, model: Any, X_new: np.ndarray, y_new: np.ndarray,
    ) -> Dict[str, Any]:
        print(f"\n{'═' * 60}")
        print("🏥 فحص صحة شامل")
        print(f"{'═' * 60}")
        needs = self.check_performance(model, X_new, y_new)
        psi = self.check_data_drift(X_new)
        total_psi = float(np.mean(list(psi.values()))) if psi else 0.0
        drifted = {k: v for k, v in psi.items() if v > self.PSI_GREEN}
        if drifted:
            print(f"   🟡 {len(drifted)} خصائص منحرفة")
        return {"needs_retrain": needs, "total_psi": total_psi}
