"""
╔════════════════════════════════════════════════════════════╗
║  AlgorithmDNA + DNAFactory — بناء النماذج من الجينات     ║
╚════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import copy
import random
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List

from sklearn.ensemble import (
    AdaBoostClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier

try:
    import xgboost as xgb
except ImportError:  # pragma: no cover
    xgb = None  # type: ignore[assignment]

try:
    import lightgbm as lgb
except ImportError:  # pragma: no cover
    lgb = None  # type: ignore[assignment]

try:
    import catboost as cb
except ImportError:  # pragma: no cover
    cb = None  # type: ignore[assignment]


@dataclass
class AlgorithmDNA:
    """تمثيل DNA لخوارزمية مع القدرة على بناء النموذج."""

    algorithm_type: str
    genes: Dict[str, Any]
    generation: int = 0
    fitness: float = 0.0
    age: int = 0
    parent_fitness: float = 0.0
    id: str = field(default_factory=lambda: f"dna_{uuid.uuid4().hex[:10]}")
    mo_scores: Dict[str, float] = field(default_factory=dict)

    def build_model(self):
        """بناء النموذج من الجينات."""
        g = self.genes
        t = self.algorithm_type

        if t == "xgboost":
            if xgb is None:
                raise ImportError("xgboost is not installed")
            return xgb.XGBClassifier(
                n_estimators=g.get("n_estimators", 200),
                max_depth=g.get("max_depth", 6),
                learning_rate=g.get("learning_rate", 0.1),
                subsample=g.get("subsample", 0.8),
                colsample_bytree=g.get("colsample_bytree", 0.8),
                min_child_weight=g.get("min_child_weight", 3),
                gamma=g.get("gamma", 0.1),
                reg_alpha=g.get("reg_alpha", 0.1),
                reg_lambda=g.get("reg_lambda", 1.0),
                random_state=42,
                eval_metric="logloss",
                verbosity=0,
                use_label_encoder=False,
            )

        if t == "lightgbm":
            if lgb is None:
                raise ImportError("lightgbm is not installed")
            return lgb.LGBMClassifier(
                n_estimators=g.get("n_estimators", 200),
                max_depth=g.get("max_depth", 6),
                learning_rate=g.get("learning_rate", 0.1),
                num_leaves=g.get("num_leaves", 50),
                subsample=g.get("subsample", 0.8),
                colsample_bytree=g.get("colsample_bytree", 0.8),
                min_child_samples=g.get("min_child_samples", 20),
                reg_alpha=g.get("reg_alpha", 0.1),
                reg_lambda=g.get("reg_lambda", 1.0),
                random_state=42,
                verbose=-1,
            )

        if t == "catboost":
            if cb is None:
                raise ImportError("catboost is not installed")
            return cb.CatBoostClassifier(
                iterations=g.get("iterations", 200),
                depth=g.get("depth", 6),
                learning_rate=g.get("learning_rate", 0.1),
                l2_leaf_reg=g.get("l2_leaf_reg", 3.0),
                random_state=42,
                verbose=0,
            )

        if t == "random_forest":
            return RandomForestClassifier(
                n_estimators=g.get("n_estimators", 200),
                max_depth=g.get("max_depth", 8),
                min_samples_split=g.get("min_samples_split", 5),
                min_samples_leaf=g.get("min_samples_leaf", 2),
                random_state=42,
                n_jobs=-1,
            )

        if t == "extra_trees":
            return ExtraTreesClassifier(
                n_estimators=g.get("n_estimators", 200),
                max_depth=g.get("max_depth", 8),
                min_samples_split=g.get("min_samples_split", 5),
                random_state=42,
                n_jobs=-1,
            )

        if t == "gradient_boosting":
            return GradientBoostingClassifier(
                n_estimators=g.get("n_estimators", 150),
                max_depth=g.get("max_depth", 5),
                learning_rate=g.get("learning_rate", 0.1),
                subsample=g.get("subsample", 0.8),
                random_state=42,
            )

        if t == "logistic":
            return LogisticRegression(
                C=g.get("C", 1.0),
                max_iter=g.get("max_iter", 2000),
                random_state=42,
            )

        if t == "mlp":
            layers = (
                g.get("layer1", 128),
                g.get("layer2", 64),
                g.get("layer3", 32),
            )
            return MLPClassifier(
                hidden_layer_sizes=layers,
                learning_rate_init=g.get("learning_rate", 0.001),
                max_iter=g.get("max_iter", 300),
                alpha=g.get("alpha", 0.001),
                random_state=42,
            )

        if t == "knn":
            return KNeighborsClassifier(
                n_neighbors=g.get("n_neighbors", 7),
                weights=g.get("weights", "distance"),
                n_jobs=-1,
            )

        if t == "adaboost":
            return AdaBoostClassifier(
                n_estimators=g.get("n_estimators", 100),
                learning_rate=g.get("learning_rate", 0.5),
                random_state=42,
            )

        raise ValueError(f"نوع خوارزمية غير معروف: {t}")

    def mutate(self, mutation_rate: float = 0.3) -> AlgorithmDNA:
        """طفرة في الجينات."""
        mutated = copy.deepcopy(self.genes)
        for name, value in mutated.items():
            if random.random() >= mutation_rate:
                continue
            if isinstance(value, bool):
                mutated[name] = not value
            elif isinstance(value, int):
                delta = max(1, int(abs(value) * 0.3))
                mutated[name] = max(1, value + random.randint(-delta, delta))
            elif isinstance(value, float):
                delta = abs(value) * 0.4
                mutated[name] = max(0.000001, value + random.uniform(-delta, delta))
        return AlgorithmDNA(
            algorithm_type=self.algorithm_type,
            genes=mutated,
            generation=self.generation + 1,
            parent_fitness=self.fitness,
        )

    @staticmethod
    def crossover(parent_a: AlgorithmDNA, parent_b: AlgorithmDNA) -> AlgorithmDNA:
        """تزاوج بين أبوين."""
        if parent_a.algorithm_type != parent_b.algorithm_type:
            return parent_a.mutate()
        child_genes: Dict[str, Any] = {}
        for name in parent_a.genes:
            if name in parent_b.genes and random.random() < 0.5:
                child_genes[name] = parent_b.genes[name]
            else:
                child_genes[name] = parent_a.genes[name]
        return AlgorithmDNA(
            algorithm_type=parent_a.algorithm_type,
            genes=child_genes,
            generation=max(parent_a.generation, parent_b.generation) + 1,
            parent_fitness=max(parent_a.fitness, parent_b.fitness),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "algorithm_type": self.algorithm_type,
            "genes": self.genes,
            "fitness": self.fitness,
            "generation": self.generation,
            "age": self.age,
            "parent_fitness": self.parent_fitness,
        }


class DNAFactory:
    """مصنع توليد DNA عشوائي لأنواع متعددة من النماذج."""

    _GENE_TEMPLATES: Dict[str, Any] = {
        "xgboost": lambda: {
            "n_estimators": random.randint(50, 500),
            "max_depth": random.randint(3, 10),
            "learning_rate": random.uniform(0.01, 0.3),
            "subsample": random.uniform(0.6, 1.0),
            "colsample_bytree": random.uniform(0.6, 1.0),
            "min_child_weight": random.randint(1, 10),
            "gamma": random.uniform(0.0, 5.0),
            "reg_alpha": random.uniform(0.001, 5.0),
            "reg_lambda": random.uniform(0.001, 5.0),
        },
        "lightgbm": lambda: {
            "n_estimators": random.randint(50, 500),
            "max_depth": random.randint(3, 12),
            "learning_rate": random.uniform(0.01, 0.3),
            "num_leaves": random.randint(20, 150),
            "subsample": random.uniform(0.6, 1.0),
            "colsample_bytree": random.uniform(0.6, 1.0),
            "min_child_samples": random.randint(5, 50),
            "reg_alpha": random.uniform(0.001, 5.0),
            "reg_lambda": random.uniform(0.001, 5.0),
        },
        "catboost": lambda: {
            "iterations": random.randint(50, 500),
            "depth": random.randint(4, 10),
            "learning_rate": random.uniform(0.01, 0.3),
            "l2_leaf_reg": random.uniform(0.1, 10.0),
        },
        "random_forest": lambda: {
            "n_estimators": random.randint(50, 400),
            "max_depth": random.randint(3, 15),
            "min_samples_split": random.randint(2, 20),
            "min_samples_leaf": random.randint(1, 10),
        },
        "extra_trees": lambda: {
            "n_estimators": random.randint(50, 400),
            "max_depth": random.randint(3, 15),
            "min_samples_split": random.randint(2, 20),
        },
        "gradient_boosting": lambda: {
            "n_estimators": random.randint(50, 300),
            "max_depth": random.randint(3, 8),
            "learning_rate": random.uniform(0.01, 0.3),
            "subsample": random.uniform(0.6, 1.0),
        },
        "logistic": lambda: {
            "C": random.uniform(0.01, 10.0),
            "max_iter": random.randint(500, 3000),
        },
        "mlp": lambda: {
            "layer1": random.randint(32, 256),
            "layer2": random.randint(16, 128),
            "layer3": random.randint(8, 64),
            "learning_rate": random.uniform(0.0001, 0.01),
            "max_iter": random.randint(100, 500),
            "alpha": random.uniform(0.0001, 0.01),
        },
        "knn": lambda: {
            "n_neighbors": random.randint(3, 25),
            "weights": random.choice(["uniform", "distance"]),
        },
        "adaboost": lambda: {
            "n_estimators": random.randint(50, 300),
            "learning_rate": random.uniform(0.01, 1.5),
        },
    }

    _TYPES: List[str] = list(_GENE_TEMPLATES.keys())

    @classmethod
    def create_random(cls, algorithm_type: str) -> AlgorithmDNA:
        factory = cls._GENE_TEMPLATES.get(algorithm_type)
        if not factory:
            raise ValueError(f"Unknown algorithm_type: {algorithm_type}")
        return AlgorithmDNA(algorithm_type=algorithm_type, genes=factory())

    @classmethod
    def create_population(cls, size_per_type: int = 5) -> List[AlgorithmDNA]:
        pop: List[AlgorithmDNA] = []
        for t in cls._TYPES:
            for _ in range(size_per_type):
                pop.append(cls.create_random(t))
        return pop
