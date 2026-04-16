"""
ethics_analyzer.py – محلل القرارات الأخلاقية
QURABIA

يوفر:
- تحليل patterns في القرارات
- كشف التحيزات
- إحصائيات متقدمة
- تقارير مفصلة
- Trend analysis
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import numpy as np

from .decision_history import DecisionHistory, EthicsDecisionRecord


@dataclass
class PatternAnalysis:
    """نتائج تحليل الأنماط"""

    most_common_violations: dict[str, int]
    approval_trend: list[float]  # trend خلال الوقت
    score_correlations: dict[str, float]
    bias_indicators: dict[str, float]
    recommendations: list[str]


@dataclass
class TemporalAnalysis:
    """تحليل زمني للقرارات"""

    hourly_approval_rate: dict[int, float]
    daily_approval_rate: dict[str, float]
    weekly_trend: list[float]


@dataclass
class BiasAnalysis:
    """تحليل التحيزات المحتملة"""

    action_type_bias: dict[str, float]  # تحيز حسب نوع الإجراء
    consistency_score: float  # درجة الاتساق في القرارات
    variance_by_dimension: dict[str, float]  # تباين الدرجات لكل بُعد
    outliers: list[str]  # قرارات شاذة


class EthicsAnalyzer:
    """
    محلل متقدم للقرارات الأخلاقية

    Features:
    - Pattern detection
    - Bias analysis
    - Temporal trends
    - Statistical insights
    - Actionable recommendations
    """

    def __init__(self, history: DecisionHistory) -> None:
        self.history = history

    def analyze_patterns(
        self, min_records: int = 10
    ) -> PatternAnalysis | None:
        """
        تحليل شامل للأنماط في القرارات

        Args:
            min_records: الحد الأدنى من السجلات المطلوب للتحليل

        Returns:
            PatternAnalysis أو None إذا لم تكن هناك بيانات كافية
        """
        records = self.history.get_recent(1000)
        if len(records) < min_records:
            return None

        # تحليل الانتهاكات الشائعة
        violations = self._analyze_violations(records)

        # تحليل الاتجاه
        trend = self._calculate_approval_trend(records)

        # تحليل الارتباطات
        correlations = self._calculate_score_correlations(records)

        # كشف التحيزات
        bias = self._detect_biases(records)

        # توصيات
        recommendations = self._generate_recommendations(
            violations, trend, bias
        )

        return PatternAnalysis(
            most_common_violations=violations,
            approval_trend=trend,
            score_correlations=correlations,
            bias_indicators=bias,
            recommendations=recommendations,
        )

    def analyze_temporal(self) -> TemporalAnalysis:
        """تحليل زمني للقرارات"""
        records = self.history.get_recent(500)

        hourly = self._analyze_by_hour(records)
        daily = self._analyze_by_day(records)
        weekly = self._calculate_weekly_trend(records)

        return TemporalAnalysis(
            hourly_approval_rate=hourly,
            daily_approval_rate=daily,
            weekly_trend=weekly,
        )

    def analyze_bias(self) -> BiasAnalysis:
        """تحليل شامل للتحيزات المحتملة"""
        records = self.history.get_recent(500)

        action_bias = self._analyze_action_type_bias(records)
        consistency = self._calculate_consistency(records)
        variance = self._calculate_variance_by_dimension(records)
        outliers = self._find_outliers(records)

        return BiasAnalysis(
            action_type_bias=action_bias,
            consistency_score=consistency,
            variance_by_dimension=variance,
            outliers=outliers,
        )

    def explain_decision(self, decision_id: str) -> dict[str, Any]:
        """
        شرح مفصل لقرار معين (Explainable AI)

        Returns:
            تفسير مفصل يتضمن:
            - الدرجات والأوزان
            - المقارنة مع المتوسط
            - العوامل المؤثرة
            - توصيات للتحسين
        """
        record = self.history.get_by_id(decision_id)
        if not record:
            return {"error": "Decision not found"}

        # حساب المتوسطات للمقارنة
        stats = self.history.get_statistics()
        avg_scores = stats.get("avg_scores", {})

        score_dict = record.decision.score.as_dict()
        explanation = {
            "decision_id": decision_id,
            "approved": record.decision.approved,
            "timestamp": record.context.timestamp,
            "action_type": record.context.action_type,
            "scores": score_dict,
            "average_score": record.decision.average_score,
            "comparison_to_average": {},
            "key_factors": [],
            "recommendations": [],
        }

        # مقارنة مع المتوسط
        for key, value in score_dict.items():
            avg = avg_scores.get(key, 0.85)
            diff = value - avg
            explanation["comparison_to_average"][key] = {
                "current": value,
                "average": avg,
                "difference": diff,
                "status": "above" if diff > 0 else "below" if diff < 0 else "equal",
            }

        # تحليل العوامل الرئيسية
        key_factors = []
        if not record.decision.approved:
            for violation in record.decision.violations:
                key_factors.append(
                    {
                        "type": "violation",
                        "dimension": violation.value,
                        "severity": "high",
                    }
                )

        # أدنى درجة
        min_score = min(score_dict.items(), key=lambda x: x[1])
        if min_score[1] < 0.85:
            key_factors.append(
                {
                    "type": "low_score",
                    "dimension": min_score[0],
                    "value": min_score[1],
                    "severity": "medium" if min_score[1] > 0.7 else "high",
                }
            )

        explanation["key_factors"] = key_factors

        # توصيات
        recommendations = []
        for key, value in score_dict.items():
            if value < 0.85:
                recommendations.append(
                    f"تحسين {self._translate_dimension(key)}: رفع الدرجة من {value:.2f} إلى 0.85+"
                )

        explanation["recommendations"] = recommendations

        return explanation

    def get_learning_priority(self) -> list[str]:
        """
        تحديد أولوية التعلم من القرارات

        Returns:
            قائمة معرفات القرارات مرتبة حسب الأولوية
        """
        unlearned = self.history.get_unlearned()

        # حساب الأولوية لكل قرار
        priorities = []
        for record in unlearned:
            priority_score = 0.0

            # القرارات الخاطئة لها أولوية أعلى
            if record.feedback and not record.feedback.is_correct:
                priority_score += 10.0

            # الخطورة العالية لها أولوية أعلى
            if record.feedback:
                priority_score += record.feedback.severity * 2.0

            # القرارات المرفوضة لها أولوية أعلى
            if not record.decision.approved:
                priority_score += 5.0

            # الدرجات المنخفضة لها أولوية
            priority_score += (1.0 - record.decision.average_score) * 3.0

            priorities.append((record.id, priority_score))

        # ترتيب حسب الأولوية
        priorities.sort(key=lambda x: x[1], reverse=True)
        return [p[0] for p in priorities]

    # ============================================================
    # Helper Methods
    # ============================================================

    def _analyze_violations(
        self, records: list[EthicsDecisionRecord]
    ) -> dict[str, int]:
        """تحليل الانتهاكات الشائعة"""
        violations: dict[str, int] = defaultdict(int)
        for record in records:
            if not record.decision.approved:
                for v in record.decision.violations:
                    violations[v.value] += 1
        return dict(violations)

    def _calculate_approval_trend(
        self, records: list[EthicsDecisionRecord]
    ) -> list[float]:
        """حساب اتجاه الموافقات خلال الوقت"""
        if len(records) < 10:
            return []

        # تقسيم إلى 10 شرائح زمنية
        chunk_size = len(records) // 10
        trend = []
        for i in range(10):
            start = i * chunk_size
            end = start + chunk_size if i < 9 else len(records)
            chunk = records[start:end]
            approved = sum(1 for r in chunk if r.decision.approved)
            trend.append(approved / len(chunk) if chunk else 0.0)

        return trend

    def _calculate_score_correlations(
        self, records: list[EthicsDecisionRecord]
    ) -> dict[str, float]:
        """حساب الارتباطات بين الدرجات المختلفة"""
        if len(records) < 10:
            return {}

        dimensions = ["nonMaleficence", "beneficence", "autonomy", "justice"]
        scores_matrix = []

        for record in records:
            score_dict = record.decision.score.as_dict()
            scores_matrix.append([score_dict[d] for d in dimensions])

        # حساب correlation matrix
        scores_array = np.array(scores_matrix)
        correlations = {}

        for i, dim1 in enumerate(dimensions):
            for j, dim2 in enumerate(dimensions):
                if i < j:  # فقط النصف العلوي من المصفوفة
                    corr = np.corrcoef(
                        scores_array[:, i], scores_array[:, j]
                    )[0, 1]
                    correlations[f"{dim1}_vs_{dim2}"] = float(corr)

        return correlations

    def _detect_biases(
        self, records: list[EthicsDecisionRecord]
    ) -> dict[str, float]:
        """كشف التحيزات المحتملة"""
        bias_indicators = {}

        # تحيز الوقت
        hourly_rates = self._analyze_by_hour(records)
        if hourly_rates:
            bias_indicators["temporal_variance"] = float(
                np.std(list(hourly_rates.values()))
            )

        # تحيز نوع الإجراء
        action_rates = self._analyze_action_type_bias(records)
        if action_rates:
            bias_indicators["action_type_variance"] = float(
                np.std(list(action_rates.values()))
            )

        return bias_indicators

    def _analyze_by_hour(
        self, records: list[EthicsDecisionRecord]
    ) -> dict[int, float]:
        """تحليل معدل الموافقة حسب الساعة"""
        hourly_data: dict[int, list[bool]] = defaultdict(list)

        for record in records:
            try:
                dt = datetime.fromisoformat(record.context.timestamp)
                hour = dt.hour
                hourly_data[hour].append(record.decision.approved)
            except Exception:
                continue

        hourly_rates = {}
        for hour, approvals in hourly_data.items():
            hourly_rates[hour] = sum(approvals) / len(approvals)

        return hourly_rates

    def _analyze_by_day(
        self, records: list[EthicsDecisionRecord]
    ) -> dict[str, float]:
        """تحليل معدل الموافقة حسب اليوم"""
        daily_data: dict[str, list[bool]] = defaultdict(list)

        for record in records:
            try:
                dt = datetime.fromisoformat(record.context.timestamp)
                day = dt.strftime("%Y-%m-%d")
                daily_data[day].append(record.decision.approved)
            except Exception:
                continue

        daily_rates = {}
        for day, approvals in daily_data.items():
            daily_rates[day] = sum(approvals) / len(approvals)

        return daily_rates

    def _calculate_weekly_trend(
        self, records: list[EthicsDecisionRecord]
    ) -> list[float]:
        """حساب الاتجاه الأسبوعي"""
        if len(records) < 7:
            return []

        # تجميع حسب الأسبوع
        weekly_data: dict[int, list[bool]] = defaultdict(list)

        for record in records:
            try:
                dt = datetime.fromisoformat(record.context.timestamp)
                week = dt.isocalendar()[1]
                weekly_data[week].append(record.decision.approved)
            except Exception:
                continue

        # حساب المعدل لكل أسبوع
        weeks = sorted(weekly_data.keys())
        trend = []
        for week in weeks:
            approvals = weekly_data[week]
            trend.append(sum(approvals) / len(approvals))

        return trend

    def _analyze_action_type_bias(
        self, records: list[EthicsDecisionRecord]
    ) -> dict[str, float]:
        """تحليل التحيز حسب نوع الإجراء"""
        action_data: dict[str, list[bool]] = defaultdict(list)

        for record in records:
            action_type = record.context.action_type
            action_data[action_type].append(record.decision.approved)

        action_rates = {}
        for action_type, approvals in action_data.items():
            if len(approvals) >= 3:  # حد أدنى من العينات
                action_rates[action_type] = sum(approvals) / len(approvals)

        return action_rates

    def _calculate_consistency(
        self, records: list[EthicsDecisionRecord]
    ) -> float:
        """حساب درجة الاتساق في القرارات المتشابهة"""
        if len(records) < 10:
            return 1.0

        # تجميع حسب نوع الإجراء
        action_groups: dict[str, list[float]] = defaultdict(list)

        for record in records:
            action_type = record.context.action_type
            action_groups[action_type].append(record.decision.average_score)

        # حساب التباين لكل مجموعة
        variances = []
        for scores in action_groups.values():
            if len(scores) >= 3:
                variances.append(np.var(scores))

        if not variances:
            return 1.0

        # الاتساق = 1 - متوسط التباين
        avg_variance = float(np.mean(variances))
        consistency = max(0.0, 1.0 - avg_variance)
        return consistency

    def _calculate_variance_by_dimension(
        self, records: list[EthicsDecisionRecord]
    ) -> dict[str, float]:
        """حساب التباين لكل بُعد أخلاقي"""
        dimensions = ["nonMaleficence", "beneficence", "autonomy", "justice"]
        dimension_scores: dict[str, list[float]] = {d: [] for d in dimensions}

        for record in records:
            score_dict = record.decision.score.as_dict()
            for dim in dimensions:
                dimension_scores[dim].append(score_dict[dim])

        variances = {}
        for dim, scores in dimension_scores.items():
            variances[dim] = float(np.var(scores))

        return variances

    def _find_outliers(
        self, records: list[EthicsDecisionRecord]
    ) -> list[str]:
        """إيجاد القرارات الشاذة"""
        if len(records) < 10:
            return []

        scores = [r.decision.average_score for r in records]
        mean = np.mean(scores)
        std = np.std(scores)

        # القرارات التي تبعد أكثر من 2 std
        outliers = []
        for record in records:
            score = record.decision.average_score
            if abs(score - mean) > 2 * std:
                outliers.append(record.id)

        return outliers

    def _generate_recommendations(
        self,
        violations: dict[str, int],
        trend: list[float],
        bias: dict[str, float],
    ) -> list[str]:
        """توليد توصيات قابلة للتنفيذ"""
        recommendations = []

        # توصيات بناءً على الانتهاكات
        if violations:
            most_common = max(violations.items(), key=lambda x: x[1])
            recommendations.append(
                f"التركيز على تحسين: {self._translate_violation(most_common[0])} "
                f"({most_common[1]} انتهاك)"
            )

        # توصيات بناءً على الاتجاه
        if len(trend) >= 3:
            recent_trend = trend[-3:]
            if all(recent_trend[i] < recent_trend[i - 1] for i in range(1, 3)):
                recommendations.append(
                    "تحذير: معدل الموافقة في تناقص مستمر - مراجعة السياسات"
                )

        # توصيات بناءً على التحيز
        if bias.get("temporal_variance", 0) > 0.1:
            recommendations.append(
                "تباين عالٍ في القرارات حسب الوقت - توحيد المعايير"
            )

        if bias.get("action_type_variance", 0) > 0.15:
            recommendations.append(
                "تباين عالٍ حسب نوع الإجراء - مراجعة معايير التقييم"
            )

        return recommendations

    def _translate_dimension(self, dimension: str) -> str:
        """ترجمة اسم البُعد الأخلاقي"""
        translations = {
            "nonMaleficence": "عدم الإضرار",
            "beneficence": "الإحسان",
            "autonomy": "الاستقلالية",
            "justice": "العدالة",
        }
        return translations.get(dimension, dimension)

    def _translate_violation(self, violation: str) -> str:
        """ترجمة نوع الانتهاك"""
        translations = {
            "harm_risk": "خطر الإضرار",
            "low_benefit": "فائدة منخفضة",
            "autonomy_override": "انتهاك الاستقلالية",
            "fairness_bias": "تحيز في العدالة",
        }
        return translations.get(violation, violation)
