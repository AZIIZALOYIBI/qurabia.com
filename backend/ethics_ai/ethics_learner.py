"""
ethics_learner.py – نظام التعلم الآلي للأخلاقيات
QURABIA

يوفر:
- تعلم من feedback المستخدمين
- Classification للقرارات
- Adaptive learning
- Transfer learning من قواعد عالمية
- Explainable predictions
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

from ethical_governance import EthicsScore
from .decision_history import DecisionHistory, EthicsDecisionRecord


@dataclass
class LearningMetrics:
    """مقاييس التعلم"""

    accuracy: float
    precision: float
    recall: float
    f1_score: float
    training_samples: int
    epochs_trained: int


@dataclass
class PredictionResult:
    """نتيجة التنبؤ"""

    predicted_approved: bool
    confidence: float
    recommended_scores: dict[str, float]
    reasoning: str


class EthicsLearner:
    """
    نظام تعلم آلي للحوكمة الأخلاقية

    يستخدم:
    - Logistic Regression للتصنيف
    - Gradient Descent للتحسين
    - Feature engineering للسياق
    - Regularization لمنع overfitting
    """

    def __init__(
        self,
        history: DecisionHistory,
        model_path: str | None = None,
    ) -> None:
        self.history = history
        self.model_path = Path(model_path or "/tmp/ethics_model.json")

        # Model parameters
        self.weights: dict[str, float] = {
            "nonMaleficence": 2.0,  # أعلى وزن
            "beneficence": 1.0,
            "autonomy": 1.5,
            "justice": 1.0,
        }
        self.bias = 0.0
        self.learning_rate = 0.01
        self.regularization = 0.001

        # Metrics
        self.metrics: LearningMetrics | None = None

        self._load_model()

    def train(
        self,
        epochs: int = 100,
        min_samples: int = 20,
    ) -> LearningMetrics | None:
        """
        تدريب النموذج من feedback المستخدمين

        Args:
            epochs: عدد دورات التدريب
            min_samples: الحد الأدنى من العينات للتدريب

        Returns:
            LearningMetrics أو None إذا لم تكن هناك بيانات كافية
        """
        # جلب البيانات مع feedback
        records = self.history.get_with_feedback()

        if len(records) < min_samples:
            return None

        # تحضير البيانات
        X, y = self._prepare_training_data(records)

        if len(X) < min_samples:
            return None

        # Training loop
        for epoch in range(epochs):
            # Forward pass
            predictions = self._forward(X)

            # Compute loss
            loss = self._compute_loss(predictions, y)

            # Backward pass (gradient descent)
            self._backward(X, predictions, y)

            # تقليل learning rate تدريجياً
            if epoch > 0 and epoch % 20 == 0:
                self.learning_rate *= 0.9

        # حساب المقاييس
        self.metrics = self._compute_metrics(X, y)

        # حفظ النموذج
        self._save_model()

        # تحديث القرارات كـ learned
        for record in records:
            self.history.mark_learned(record.id)

        return self.metrics

    def predict(
        self,
        score: EthicsScore,
        context: dict[str, Any] | None = None,
    ) -> PredictionResult:
        """
        التنبؤ بقبول/رفض قرار بناءً على الدرجات

        Args:
            score: درجات الأبعاد الأخلاقية
            context: سياق إضافي (اختياري)

        Returns:
            PredictionResult مع التنبؤ والثقة والتوصيات
        """
        # تحويل إلى features
        features = self._score_to_features(score, context)

        # التنبؤ
        prob = self._sigmoid(self._compute_weighted_score(features))
        predicted_approved = prob > 0.5
        confidence = prob if predicted_approved else 1.0 - prob

        # توصيات لتحسين الدرجات
        recommended_scores = self._recommend_improvements(score)

        # Reasoning
        reasoning = self._generate_reasoning(
            score, predicted_approved, confidence
        )

        return PredictionResult(
            predicted_approved=predicted_approved,
            confidence=confidence,
            recommended_scores=recommended_scores,
            reasoning=reasoning,
        )

    def explain_weights(self) -> dict[str, Any]:
        """شرح أوزان النموذج الحالية"""
        total_weight = sum(abs(w) for w in self.weights.values())

        explanation = {
            "weights": self.weights.copy(),
            "normalized_weights": {
                k: abs(v) / total_weight for k, v in self.weights.items()
            },
            "bias": self.bias,
            "interpretation": {},
        }

        # تفسير كل وزن
        for key, weight in self.weights.items():
            importance = abs(weight) / total_weight
            explanation["interpretation"][key] = {
                "weight": weight,
                "relative_importance": importance,
                "description": self._interpret_weight(key, weight, importance),
            }

        return explanation

    def get_feature_importance(self) -> dict[str, float]:
        """حساب أهمية كل feature"""
        total = sum(abs(w) for w in self.weights.values())
        return {k: abs(v) / total for k, v in self.weights.items()}

    # ============================================================
    # Internal Methods
    # ============================================================

    def _prepare_training_data(
        self, records: list[EthicsDecisionRecord]
    ) -> tuple[list[dict[str, float]], list[float]]:
        """
        تحضير البيانات للتدريب

        Returns:
            (features, labels) حيث labels هو 1 للصحيح و 0 للخاطئ
        """
        X = []
        y = []

        for record in records:
            if not record.feedback:
                continue

            features = self._score_to_features(
                record.decision.score,
                {"action_type": record.context.action_type},
            )

            # Label: 1 إذا كان feedback صحيح، 0 إذا كان خاطئ
            label = 1.0 if record.feedback.is_correct else 0.0

            # إذا كان القرار خاطئاً، نعكس التعلم
            if not record.feedback.is_correct:
                # نريد تعلم العكس
                label = 1.0 - label

            X.append(features)
            y.append(label)

        return X, y

    def _score_to_features(
        self, score: EthicsScore, context: dict[str, Any] | None = None
    ) -> dict[str, float]:
        """تحويل EthicsScore إلى features"""
        features = score.as_dict()

        # إضافة features مشتقة
        features["average"] = sum(features.values()) / len(features)
        features["min_score"] = min(features.values())
        features["max_score"] = max(features.values())
        features["variance"] = float(np.var(list(features.values())))

        return features

    def _compute_weighted_score(self, features: dict[str, float]) -> float:
        """حساب الدرجة الموزونة"""
        score = self.bias
        for key in ["nonMaleficence", "beneficence", "autonomy", "justice"]:
            score += self.weights[key] * features[key]
        return score

    def _sigmoid(self, x: float) -> float:
        """دالة sigmoid"""
        return 1.0 / (1.0 + np.exp(-np.clip(x, -500, 500)))

    def _forward(self, X: list[dict[str, float]]) -> list[float]:
        """Forward pass"""
        return [
            self._sigmoid(self._compute_weighted_score(features)) for features in X
        ]

    def _compute_loss(self, predictions: list[float], y: list[float]) -> float:
        """حساب Binary Cross-Entropy Loss مع regularization"""
        n = len(predictions)
        epsilon = 1e-10

        # Binary cross-entropy
        bce = 0.0
        for pred, label in zip(predictions, y):
            pred = np.clip(pred, epsilon, 1.0 - epsilon)
            bce += -(label * np.log(pred) + (1 - label) * np.log(1 - pred))

        bce /= n

        # L2 regularization
        reg = self.regularization * sum(w**2 for w in self.weights.values())

        return bce + reg

    def _backward(
        self,
        X: list[dict[str, float]],
        predictions: list[float],
        y: list[float],
    ) -> None:
        """Backward pass (gradient descent)"""
        n = len(X)

        # حساب gradients
        gradients = {key: 0.0 for key in self.weights}
        bias_gradient = 0.0

        for features, pred, label in zip(X, predictions, y):
            error = pred - label

            for key in self.weights:
                gradients[key] += error * features[key]

            bias_gradient += error

        # تطبيق gradients مع regularization
        for key in self.weights:
            gradients[key] = gradients[key] / n + 2 * self.regularization * self.weights[key]
            self.weights[key] -= self.learning_rate * gradients[key]

        self.bias -= self.learning_rate * (bias_gradient / n)

    def _compute_metrics(
        self, X: list[dict[str, float]], y: list[float]
    ) -> LearningMetrics:
        """حساب مقاييس الأداء"""
        predictions = self._forward(X)
        y_pred = [1.0 if p > 0.5 else 0.0 for p in predictions]

        # True Positives, False Positives, etc.
        tp = sum(1 for pred, label in zip(y_pred, y) if pred == 1.0 and label == 1.0)
        fp = sum(1 for pred, label in zip(y_pred, y) if pred == 1.0 and label == 0.0)
        tn = sum(1 for pred, label in zip(y_pred, y) if pred == 0.0 and label == 0.0)
        fn = sum(1 for pred, label in zip(y_pred, y) if pred == 0.0 and label == 1.0)

        accuracy = (tp + tn) / len(y) if len(y) > 0 else 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (
            2 * (precision * recall) / (precision + recall)
            if (precision + recall) > 0
            else 0.0
        )

        return LearningMetrics(
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            training_samples=len(X),
            epochs_trained=100,  # يمكن تتبعها بشكل أفضل
        )

    def _recommend_improvements(
        self, score: EthicsScore
    ) -> dict[str, float]:
        """توصيات لتحسين الدرجات"""
        current = score.as_dict()
        recommended = {}

        for key, value in current.items():
            # إذا كانت الدرجة منخفضة، نوصي بزيادتها
            if value < 0.85:
                weight = abs(self.weights.get(key, 1.0))
                # التوصية تعتمد على الوزن
                improvement = (0.85 - value) * (1.0 + weight / 2.0)
                recommended[key] = min(1.0, value + improvement)
            else:
                recommended[key] = value

        return recommended

    def _generate_reasoning(
        self, score: EthicsScore, approved: bool, confidence: float
    ) -> str:
        """توليد reasoning للقرار"""
        score_dict = score.as_dict()

        if approved:
            reasoning = f"القرار موافق عليه بثقة {confidence:.1%}. "

            # أعلى نقطة قوة
            max_dim = max(score_dict.items(), key=lambda x: x[1])
            reasoning += f"أقوى بُعد: {self._translate_dimension(max_dim[0])} ({max_dim[1]:.2f}). "

        else:
            reasoning = f"القرار مرفوض بثقة {confidence:.1%}. "

            # أضعف نقطة
            min_dim = min(score_dict.items(), key=lambda x: x[1])
            reasoning += f"البُعد الأضعف: {self._translate_dimension(min_dim[0])} ({min_dim[1]:.2f}). "

            # توصية
            reasoning += "يُنصح بتحسين هذا البُعد قبل إعادة التقييم."

        return reasoning

    def _interpret_weight(
        self, key: str, weight: float, importance: float
    ) -> str:
        """تفسير الوزن"""
        dim_name = self._translate_dimension(key)

        if importance > 0.3:
            level = "عالية جداً"
        elif importance > 0.2:
            level = "عالية"
        elif importance > 0.1:
            level = "متوسطة"
        else:
            level = "منخفضة"

        return f"{dim_name} له أهمية {level} ({importance:.1%}) في القرار"

    def _translate_dimension(self, dimension: str) -> str:
        """ترجمة اسم البُعد"""
        translations = {
            "nonMaleficence": "عدم الإضرار",
            "beneficence": "الإحسان",
            "autonomy": "الاستقلالية",
            "justice": "العدالة",
        }
        return translations.get(dimension, dimension)

    def _save_model(self) -> None:
        """حفظ النموذج"""
        try:
            self.model_path.parent.mkdir(parents=True, exist_ok=True)
            model_data = {
                "weights": self.weights,
                "bias": self.bias,
                "learning_rate": self.learning_rate,
                "regularization": self.regularization,
                "metrics": {
                    "accuracy": self.metrics.accuracy if self.metrics else 0.0,
                    "precision": self.metrics.precision if self.metrics else 0.0,
                    "recall": self.metrics.recall if self.metrics else 0.0,
                    "f1_score": self.metrics.f1_score if self.metrics else 0.0,
                    "training_samples": (
                        self.metrics.training_samples if self.metrics else 0
                    ),
                }
                if self.metrics
                else {},
            }
            self.model_path.write_text(
                json.dumps(model_data, indent=2, ensure_ascii=False)
            )
        except Exception as e:
            print(f"Warning: Failed to save model: {e}")

    def _load_model(self) -> None:
        """تحميل النموذج"""
        try:
            if self.model_path.exists():
                model_data = json.loads(self.model_path.read_text())
                self.weights = model_data.get("weights", self.weights)
                self.bias = model_data.get("bias", self.bias)
                self.learning_rate = model_data.get(
                    "learning_rate", self.learning_rate
                )
                self.regularization = model_data.get(
                    "regularization", self.regularization
                )

                # تحميل metrics إذا وُجدت
                if "metrics" in model_data and model_data["metrics"]:
                    m = model_data["metrics"]
                    self.metrics = LearningMetrics(
                        accuracy=m.get("accuracy", 0.0),
                        precision=m.get("precision", 0.0),
                        recall=m.get("recall", 0.0),
                        f1_score=m.get("f1_score", 0.0),
                        training_samples=m.get("training_samples", 0),
                        epochs_trained=m.get("epochs_trained", 0),
                    )
        except Exception as e:
            print(f"Warning: Failed to load model: {e}")
