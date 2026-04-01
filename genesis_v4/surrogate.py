"""
╔════════════════════════════════════════════════════════════╗
║  Surrogate Model — توقع اللياقة بدون تدريب               ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import random
from typing import TYPE_CHECKING, List, Tuple

import numpy as np

try:
    import lightgbm as lgb
except ImportError:  # pragma: no cover
    lgb = None  # type: ignore[assignment]

if TYPE_CHECKING:
    from genesis_v4.algorithm_dna import AlgorithmDNA


class SurrogateModel:
    """
    نموذج بديل (Surrogate) — يتوقع أداء خوارزمية من جيناتها بدون
    تدريبها فعلاً.  يتعلم من التقييمات السابقة ← يوجّه البحث للمناطق
    الواعدة (مثل Bayesian Optimization).
    """

    _TYPE_ENCODING = {
        "xgboost": 0, "lightgbm": 1, "catboost": 2,
        "random_forest": 3, "extra_trees": 4,
        "gradient_boosting": 5, "logistic": 6,
        "mlp": 7, "knn": 8, "adaboost": 9,
    }

    _ALL_GENES = [
        "n_estimators", "iterations", "max_depth", "depth",
        "learning_rate", "subsample", "colsample_bytree",
        "min_child_weight", "gamma", "reg_alpha", "reg_lambda",
        "num_leaves", "min_child_samples", "l2_leaf_reg",
        "min_samples_split", "min_samples_leaf", "C", "max_iter",
        "layer1", "layer2", "layer3", "alpha", "n_neighbors",
    ]

    def __init__(self, min_observations: int = 15) -> None:
        self.observations: List[Tuple[np.ndarray, float]] = []
        self.model = None
        self.is_fitted = False
        self.min_observations = min_observations

    def record(self, dna_list: list) -> None:
        for dna in dna_list:
            vec = self._dna_to_vector(dna)
            self.observations.append((vec, dna.fitness))

    def _dna_to_vector(self, dna: "AlgorithmDNA") -> np.ndarray:
        vector = [float(self._TYPE_ENCODING.get(dna.algorithm_type, -1))]
        for gene in self._ALL_GENES:
            val = dna.genes.get(gene, 0)
            if isinstance(val, str):
                val = hash(val) % 100
            vector.append(float(val))
        return np.array(vector)

    def fit(self) -> bool:
        if len(self.observations) < self.min_observations:
            return False
        if lgb is None:
            return False

        X = np.array([o[0] for o in self.observations])
        y = np.array([o[1] for o in self.observations])

        self.model = lgb.LGBMRegressor(
            n_estimators=100, max_depth=5, learning_rate=0.1,
            random_state=42, verbose=-1,
        )
        self.model.fit(X, y)
        self.is_fitted = True
        return True

    def predict_fitness(self, dna: "AlgorithmDNA") -> float:
        if not self.is_fitted:
            return 0.5
        vector = self._dna_to_vector(dna).reshape(1, -1)
        return float(self.model.predict(vector)[0])

    def acquisition_score(
        self, dna: "AlgorithmDNA", exploration_weight: float = 0.1,
    ) -> float:
        """UCB (Upper Confidence Bound)."""
        if not self.is_fitted:
            return random.random()

        predicted = self.predict_fitness(dna)
        vector = self._dna_to_vector(dna)
        distances = [float(np.linalg.norm(vector - o[0])) for o in self.observations]
        uncertainty = float(np.mean(sorted(distances)[:5]))
        mean_dist = float(np.mean(distances)) + 1e-8
        uncertainty /= mean_dist
        return predicted + exploration_weight * uncertainty
