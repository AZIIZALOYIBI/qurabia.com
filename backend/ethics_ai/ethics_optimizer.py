"""
ethics_optimizer.py – محسِّن الدستور الأخلاقي
QURABIA

يوفر:
- تحسين ديناميكي لعتبات الدستور الأخلاقي
- التكيف مع feedback المستخدمين
- Constraint optimization
- Safe updates (no drastic changes)
- Audit trail للتغييرات
"""

from __future__ import annotations

import json
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

from ethical_governance import ETHICAL_CONSTITUTION
from .decision_history import DecisionHistory


@dataclass
class OptimizationResult:
    """نتيجة التحسين"""

    old_constitution: dict[str, float]
    new_constitution: dict[str, float]
    changes: dict[str, float]
    improvement_score: float
    rationale: str


@dataclass
class ConstitutionHistory:
    """سجل تاريخ تغييرات الدستور"""

    timestamp: str
    constitution: dict[str, float]
    reason: str
    feedback_count: int


class EthicsOptimizer:
    """
    محسِّن ديناميكي للدستور الأخلاقي

    Features:
    - Safe optimization (bounded changes)
    - Feedback-driven adaptation
    - Multi-objective optimization
    - Constraint preservation
    - Audit trail
    """

    def __init__(
        self,
        history: DecisionHistory,
        config_path: str | None = None,
    ) -> None:
        self.history = history
        self.config_path = Path(config_path or "/tmp/constitution_history.json")

        # Optimization constraints
        self.min_threshold = 0.70  # الحد الأدنى المطلق
        self.max_threshold = 0.98  # الحد الأقصى
        self.max_change_per_update = 0.05  # أقصى تغيير في مرة واحدة
        self.min_feedback_count = 30  # الحد الأدنى من feedback للتحسين

        # History
        self.constitution_history: list[ConstitutionHistory] = []

        self._load_history()

    def optimize(
        self, min_samples: int | None = None
    ) -> OptimizationResult | None:
        """
        تحسين الدستور الأخلاقي بناءً على feedback المستخدمين

        Args:
            min_samples: الحد الأدنى من العينات (يستخدم self.min_feedback_count افتراضياً)

        Returns:
            OptimizationResult أو None إذا لم تكن هناك بيانات كافية
        """
        min_samples = min_samples or self.min_feedback_count
        feedback_records = self.history.get_with_feedback()

        if len(feedback_records) < min_samples:
            return None

        # الدستور الحالي
        current_constitution = self._get_current_constitution()

        # تحليل الأخطاء
        error_analysis = self._analyze_errors(feedback_records)

        # حساب الدستور الجديد
        new_constitution = self._compute_optimal_thresholds(
            current_constitution, error_analysis
        )

        # التحقق من الـ constraints
        new_constitution = self._apply_constraints(
            current_constitution, new_constitution
        )

        # حساب درجة التحسين
        improvement = self._estimate_improvement(
            feedback_records, current_constitution, new_constitution
        )

        # توليد rationale
        rationale = self._generate_rationale(
            error_analysis, current_constitution, new_constitution
        )

        # حساب التغييرات
        changes = {
            k: new_constitution[k] - current_constitution[k]
            for k in current_constitution
        }

        result = OptimizationResult(
            old_constitution=current_constitution.copy(),
            new_constitution=new_constitution,
            changes=changes,
            improvement_score=improvement,
            rationale=rationale,
        )

        # حفظ في التاريخ
        self._save_to_history(new_constitution, rationale, len(feedback_records))

        return result

    def apply_constitution(
        self, constitution: dict[str, float]
    ) -> dict[str, float]:
        """
        تطبيق دستور جديد مع التحقق من الأمان

        Returns:
            الدستور المُطبَّق (بعد التحقق من constraints)
        """
        current = self._get_current_constitution()
        safe_constitution = self._apply_constraints(current, constitution)

        self._save_to_history(
            safe_constitution,
            "Manual update via apply_constitution",
            0,
        )

        return safe_constitution

    def get_constitution_history(
        self, limit: int = 10
    ) -> list[ConstitutionHistory]:
        """استرجاع تاريخ التغييرات"""
        return self.constitution_history[-limit:]

    def get_statistics(self) -> dict[str, Any]:
        """إحصائيات التحسين"""
        if not self.constitution_history:
            return {"total_updates": 0}

        current = self.constitution_history[-1].constitution
        initial = self.constitution_history[0].constitution

        total_change = {
            k: current[k] - initial[k] for k in current
        }

        return {
            "total_updates": len(self.constitution_history),
            "current_constitution": current,
            "initial_constitution": initial,
            "total_change": total_change,
            "last_update": self.constitution_history[-1].timestamp,
            "avg_change_per_update": {
                k: v / len(self.constitution_history)
                for k, v in total_change.items()
            },
        }

    def rollback(self, steps: int = 1) -> dict[str, float] | None:
        """
        التراجع عن آخر N تحديث

        Returns:
            الدستور بعد التراجع أو None إذا لم يكن ممكناً
        """
        if len(self.constitution_history) <= steps:
            return None

        # حذف آخر N تحديث
        for _ in range(steps):
            self.constitution_history.pop()

        self._save_history()

        # إرجاع الدستور الحالي
        return self.constitution_history[-1].constitution

    # ============================================================
    # Internal Methods
    # ============================================================

    def _get_current_constitution(self) -> dict[str, float]:
        """الحصول على الدستور الحالي"""
        if self.constitution_history:
            return self.constitution_history[-1].constitution.copy()
        return ETHICAL_CONSTITUTION.copy()

    def _analyze_errors(self, records: Sequence[Any]) -> dict[str, Any]:
        """
        تحليل الأخطاء في القرارات

        Returns:
            إحصائيات عن الأخطاء لكل بُعد
        """
        dimensions = ["nonMaleficence", "beneficence", "autonomy", "justice"]
        error_stats = {
            dim: {
                "false_positives": [],  # تم قبوله ولكن خاطئ
                "false_negatives": [],  # تم رفضه ولكن صحيح
                "correct_rejections": [],
                "correct_acceptances": [],
            }
            for dim in dimensions
        }

        for record in records:
            if not record.feedback:
                continue

            is_correct = record.feedback.is_correct
            was_approved = record.decision.approved
            scores = record.decision.score.as_dict()

            for dim in dimensions:
                score = scores[dim]

                if was_approved and not is_correct:
                    # False Positive: تم قبوله ولكن خاطئ
                    error_stats[dim]["false_positives"].append(score)
                elif not was_approved and not is_correct:
                    # False Negative: تم رفضه ولكن خاطئ
                    error_stats[dim]["false_negatives"].append(score)
                elif not was_approved and is_correct:
                    # Correct Rejection
                    error_stats[dim]["correct_rejections"].append(score)
                else:  # was_approved and is_correct
                    # Correct Acceptance
                    error_stats[dim]["correct_acceptances"].append(score)

        # حساب الإحصائيات
        analysis = {}
        for dim, stats in error_stats.items():
            fp = stats["false_positives"]
            fn = stats["false_negatives"]

            analysis[dim] = {
                "false_positive_count": len(fp),
                "false_negative_count": len(fn),
                "false_positive_avg": float(np.mean(fp)) if fp else 0.0,
                "false_negative_avg": float(np.mean(fn)) if fn else 0.0,
                "error_rate": (len(fp) + len(fn))
                / len(records)
                if records
                else 0.0,
            }

        return analysis

    def _compute_optimal_thresholds(
        self,
        current: dict[str, float],
        error_analysis: dict[str, Any],
    ) -> dict[str, float]:
        """
        حساب العتبات المثلى

        Strategy:
        - إذا كان هناك false positives كثيرة، ارفع العتبة
        - إذا كان هناك false negatives كثيرة، اخفض العتبة
        - التوازن بين الاثنين
        """
        new_thresholds = current.copy()

        for dim, analysis in error_analysis.items():
            fp_count = analysis["false_positive_count"]
            fn_count = analysis["false_negative_count"]
            fp_avg = analysis["false_positive_avg"]
            fn_avg = analysis["false_negative_avg"]

            current_threshold = current[dim]

            # حساب التعديل المطلوب
            adjustment = 0.0

            if fp_count > fn_count * 2:
                # كثير من false positives - ارفع العتبة
                # نريد رفضها المرة القادمة
                if fp_avg > 0:
                    target = fp_avg + 0.05
                    adjustment = min(
                        target - current_threshold, self.max_change_per_update
                    )
            elif fn_count > fp_count * 2:
                # كثير من false negatives - اخفض العتبة
                # نريد قبولها المرة القادمة
                if fn_avg > 0:
                    target = fn_avg - 0.05
                    adjustment = max(
                        target - current_threshold, -self.max_change_per_update
                    )
            else:
                # متوازن - تعديل بسيط بناءً على error rate
                error_rate = analysis["error_rate"]
                if error_rate > 0.2:  # أكثر من 20% أخطاء
                    # تعديل بسيط باتجاه تقليل الأخطاء
                    if fp_count > fn_count:
                        adjustment = 0.01  # رفع قليلاً
                    elif fn_count > fp_count:
                        adjustment = -0.01  # خفض قليلاً

            new_thresholds[dim] = current_threshold + adjustment

        return new_thresholds

    def _apply_constraints(
        self,
        current: dict[str, float],
        proposed: dict[str, float],
    ) -> dict[str, float]:
        """
        تطبيق constraints الأمان

        - حدود مطلقة
        - حد أقصى للتغيير في مرة واحدة
        - الحفاظ على الترتيب النسبي للأهمية
        """
        safe = {}

        for key, new_value in proposed.items():
            old_value = current[key]

            # حد التغيير
            change = new_value - old_value
            if abs(change) > self.max_change_per_update:
                change = (
                    self.max_change_per_update
                    if change > 0
                    else -self.max_change_per_update
                )
                new_value = old_value + change

            # الحدود المطلقة
            new_value = max(self.min_threshold, min(self.max_threshold, new_value))

            safe[key] = round(new_value, 2)

        # التأكد أن nonMaleficence يبقى الأعلى
        if safe["nonMaleficence"] < max(
            safe["beneficence"], safe["autonomy"], safe["justice"]
        ):
            safe["nonMaleficence"] = min(
                max(
                    safe["beneficence"],
                    safe["autonomy"],
                    safe["justice"],
                )
                + 0.05,
                self.max_threshold,
            )

        return safe

    def _estimate_improvement(
        self,
        records: Sequence[Any],
        old_constitution: dict[str, float],
        new_constitution: dict[str, float],
    ) -> float:
        """
        تقدير درجة التحسين المتوقعة

        Returns:
            درجة بين 0 و 1 (أعلى = أفضل)
        """
        correct_with_new = 0
        correct_with_old = 0

        for record in records:
            if not record.feedback:
                continue

            should_be_approved = record.feedback.is_correct == record.decision.approved

            # محاكاة القرار مع الدستور القديم
            would_approve_old = self._would_approve(
                record.decision.score, old_constitution
            )
            if would_approve_old == should_be_approved:
                correct_with_old += 1

            # محاكاة القرار مع الدستور الجديد
            would_approve_new = self._would_approve(
                record.decision.score, new_constitution
            )
            if would_approve_new == should_be_approved:
                correct_with_new += 1

        if len(records) == 0:
            return 0.0

        old_accuracy = correct_with_old / len(records)
        new_accuracy = correct_with_new / len(records)

        improvement = new_accuracy - old_accuracy
        return improvement

    def _would_approve(
        self, score: Any, constitution: dict[str, float]
    ) -> bool:
        """محاكاة قرار الموافقة/الرفض"""
        score_dict = score.as_dict()
        for key, threshold in constitution.items():
            if score_dict[key] < threshold:
                return False
        return True

    def _generate_rationale(
        self,
        error_analysis: dict[str, Any],
        old_const: dict[str, float],
        new_const: dict[str, float],
    ) -> str:
        """توليد تفسير للتغييرات"""
        changes = []

        for dim in old_const:
            old_val = old_const[dim]
            new_val = new_const[dim]
            diff = new_val - old_val

            if abs(diff) > 0.01:
                direction = "رفع" if diff > 0 else "خفض"
                analysis = error_analysis[dim]

                reason = f"{direction} عتبة {self._translate_dimension(dim)} "
                reason += f"من {old_val:.2f} إلى {new_val:.2f} "

                if analysis["false_positive_count"] > analysis["false_negative_count"]:
                    reason += f"(لتقليل false positives: {analysis['false_positive_count']})"
                elif (
                    analysis["false_negative_count"] > analysis["false_positive_count"]
                ):
                    reason += f"(لتقليل false negatives: {analysis['false_negative_count']})"
                else:
                    reason += f"(لتحسين الدقة العامة)"

                changes.append(reason)

        if not changes:
            return "لا توجد تغييرات كبيرة - الدستور الحالي مثالي"

        return "; ".join(changes)

    def _translate_dimension(self, dimension: str) -> str:
        """ترجمة اسم البُعد"""
        translations = {
            "nonMaleficence": "عدم الإضرار",
            "beneficence": "الإحسان",
            "autonomy": "الاستقلالية",
            "justice": "العدالة",
        }
        return translations.get(dimension, dimension)

    def _save_to_history(
        self, constitution: dict[str, float], reason: str, feedback_count: int
    ) -> None:
        """حفظ في التاريخ"""
        entry = ConstitutionHistory(
            timestamp=datetime.now(timezone.utc).isoformat(),
            constitution=constitution.copy(),
            reason=reason,
            feedback_count=feedback_count,
        )
        self.constitution_history.append(entry)
        self._save_history()

    def _save_history(self) -> None:
        """حفظ التاريخ إلى ملف"""
        try:
            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            data = [
                {
                    "timestamp": h.timestamp,
                    "constitution": h.constitution,
                    "reason": h.reason,
                    "feedback_count": h.feedback_count,
                }
                for h in self.constitution_history
            ]
            self.config_path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False)
            )
        except Exception as e:
            print(f"Warning: Failed to save constitution history: {e}")

    def _load_history(self) -> None:
        """تحميل التاريخ من ملف"""
        try:
            if self.config_path.exists():
                data = json.loads(self.config_path.read_text())
                self.constitution_history = [
                    ConstitutionHistory(**entry) for entry in data
                ]
        except Exception as e:
            print(f"Warning: Failed to load constitution history: {e}")
            self.constitution_history = []

        # إضافة الدستور الافتراضي إذا كان التاريخ فارغاً
        if not self.constitution_history:
            self._save_to_history(
                ETHICAL_CONSTITUTION.copy(),
                "Initial constitution (default)",
                0,
            )
