"""
╔════════════════════════════════════════════════════════════╗
║  Multi-Objective Fitness — لياقة متعددة الأهداف          ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any, Dict, Optional

from sklearn.metrics import roc_auc_score

if TYPE_CHECKING:
    import numpy as np
    from genesis_v4.algorithm_dna import AlgorithmDNA


class MultiObjectiveFitness:
    """
    لياقة متعددة الأهداف:
    • AUC-ROC (الأداء)
    • سرعة التنبؤ
    • بساطة النموذج
    """

    def __init__(
        self,
        auc_weight: float = 0.7,
        speed_weight: float = 0.15,
        simplicity_weight: float = 0.15,
    ) -> None:
        self.w_auc = auc_weight
        self.w_speed = speed_weight
        self.w_simple = simplicity_weight

    def compute(
        self,
        dna: "AlgorithmDNA",
        X_val: "np.ndarray",
        y_val: "np.ndarray",
        model: Optional[Any] = None,
    ) -> Dict[str, float]:
        if model is None:
            model = dna.build_model()

        # ═══ AUC ═══
        try:
            y_prob = model.predict_proba(X_val)[:, 1]
            auc = roc_auc_score(y_val, y_prob)
        except Exception:
            auc = 0.5

        # ═══ السرعة ═══
        try:
            start = time.time()
            for _ in range(3):
                model.predict_proba(X_val[:100])
            pred_time = (time.time() - start) / 3
            speed_score = max(0.0, 1.0 - pred_time / 0.5)
        except Exception:
            speed_score = 0.5

        # ═══ البساطة ═══
        complexity = self._estimate_complexity(dna)
        simplicity_score = max(0.0, 1.0 - complexity / 1000.0)

        combined = (
            self.w_auc * auc
            + self.w_speed * speed_score
            + self.w_simple * simplicity_score
        )

        return {
            "combined": combined,
            "auc": auc,
            "speed": speed_score,
            "simplicity": simplicity_score,
        }

    @staticmethod
    def _estimate_complexity(dna: "AlgorithmDNA") -> float:
        g = dna.genes
        complexity_map: Dict[str, float] = {
            "xgboost": g.get("n_estimators", 200) * g.get("max_depth", 6),
            "lightgbm": g.get("n_estimators", 200) * g.get("num_leaves", 50),
            "catboost": g.get("iterations", 200) * g.get("depth", 6),
            "random_forest": g.get("n_estimators", 200) * g.get("max_depth", 8),
            "extra_trees": g.get("n_estimators", 200) * g.get("max_depth", 8),
            "gradient_boosting": g.get("n_estimators", 150) * g.get("max_depth", 5),
            "logistic": 10,
            "mlp": g.get("layer1", 128) * g.get("layer2", 64),
            "knn": g.get("n_neighbors", 7),
            "adaboost": g.get("n_estimators", 100),
        }
        return float(complexity_map.get(dna.algorithm_type, 100))
