"""
decision_history.py – نظام تتبع القرارات الأخلاقية
QURABIA

يوفر:
- تسجيل جميع القرارات الأخلاقية مع السياق الكامل
- تخزين thread-safe
- استعلامات مرنة للتحليل
- Privacy-preserving storage
"""

from __future__ import annotations

import json
import os
from collections.abc import Iterable
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

from ethical_governance import EthicsDecision, EthicsScore


@dataclass
class DecisionContext:
    """سياق القرار الأخلاقي الكامل"""

    action_type: str  # نوع الإجراء
    user_id: str | None  # معرف المستخدم (مجهول للخصوصية)
    timestamp: str  # ISO 8601 timestamp
    input_data: dict[str, Any]  # البيانات المدخلة (محذوفة الحساسة)
    environment: str  # development, staging, production


@dataclass
class UserFeedback:
    """تعليقات المستخدم على القرار"""

    is_correct: bool  # هل القرار صحيح؟
    severity: int  # مستوى الخطورة (1-5)
    comment: str | None  # تعليق اختياري
    timestamp: str


@dataclass
class EthicsDecisionRecord:
    """سجل كامل لقرار أخلاقي واحد"""

    id: str  # معرف فريد
    context: DecisionContext
    decision: EthicsDecision
    feedback: UserFeedback | None = None
    learned: bool = False  # هل تم التعلم من هذا القرار؟


class DecisionHistory:
    """
    نظام تتبع القرارات الأخلاقية مع ضمان الخصوصية

    Features:
    - Thread-safe storage
    - Privacy-preserving (no PII)
    - Efficient querying
    - JSON export/import
    - Automatic cleanup
    """

    def __init__(self, storage_path: str | None = None) -> None:
        self._lock = Lock()
        self._records: list[EthicsDecisionRecord] = []
        self._storage_path = Path(storage_path or "/tmp/ethics_decisions.json")
        self._max_records = 10000  # حد أقصى للسجلات
        self._load()

    def add_decision(
        self,
        decision: EthicsDecision,
        context: DecisionContext,
    ) -> str:
        """
        إضافة قرار جديد إلى السجل

        Returns:
            معرف القرار الفريد
        """
        with self._lock:
            decision_id = self._generate_id()
            record = EthicsDecisionRecord(
                id=decision_id,
                context=context,
                decision=decision,
            )
            self._records.append(record)

            # تنظيف تلقائي إذا تجاوز الحد
            if len(self._records) > self._max_records:
                self._records = self._records[-self._max_records :]

            self._save()
            return decision_id

    def add_feedback(
        self,
        decision_id: str,
        is_correct: bool,
        severity: int = 3,
        comment: str | None = None,
    ) -> bool:
        """
        إضافة feedback المستخدم على قرار معين

        Returns:
            True إذا تم إضافة التعليق بنجاح
        """
        with self._lock:
            for record in self._records:
                if record.id == decision_id:
                    record.feedback = UserFeedback(
                        is_correct=is_correct,
                        severity=max(1, min(5, severity)),
                        comment=comment,
                        timestamp=datetime.now(timezone.utc).isoformat(),
                    )
                    self._save()
                    return True
            return False

    def mark_learned(self, decision_id: str) -> bool:
        """تحديد أنه تم التعلم من هذا القرار"""
        with self._lock:
            for record in self._records:
                if record.id == decision_id:
                    record.learned = True
                    self._save()
                    return True
            return False

    def get_by_id(self, decision_id: str) -> EthicsDecisionRecord | None:
        """استرجاع قرار بمعرفه"""
        with self._lock:
            for record in self._records:
                if record.id == decision_id:
                    return record
            return None

    def get_recent(self, limit: int = 50) -> list[EthicsDecisionRecord]:
        """استرجاع آخر N قرار"""
        with self._lock:
            return self._records[-limit:]

    def get_unlearned(self) -> list[EthicsDecisionRecord]:
        """استرجاع القرارات التي لم يتم التعلم منها بعد"""
        with self._lock:
            return [r for r in self._records if r.feedback and not r.learned]

    def get_with_feedback(self) -> list[EthicsDecisionRecord]:
        """استرجاع جميع القرارات التي لديها feedback"""
        with self._lock:
            return [r for r in self._records if r.feedback is not None]

    def get_violations(self) -> list[EthicsDecisionRecord]:
        """استرجاع القرارات التي تم رفضها"""
        with self._lock:
            return [r for r in self._records if not r.decision.approved]

    def get_statistics(self) -> dict[str, Any]:
        """إحصائيات شاملة عن القرارات"""
        with self._lock:
            total = len(self._records)
            if total == 0:
                return {
                    "total": 0,
                    "approved": 0,
                    "rejected": 0,
                    "approval_rate": 0.0,
                    "with_feedback": 0,
                    "learned": 0,
                    "unlearned_feedback": 0,
                }

            approved = sum(1 for r in self._records if r.decision.approved)
            with_feedback = sum(1 for r in self._records if r.feedback)
            learned = sum(1 for r in self._records if r.learned)
            unlearned_feedback = sum(
                1 for r in self._records if r.feedback and not r.learned
            )

            # حساب متوسط الدرجات
            avg_scores = {
                "nonMaleficence": 0.0,
                "beneficence": 0.0,
                "autonomy": 0.0,
                "justice": 0.0,
            }
            for record in self._records:
                score_dict = record.decision.score.as_dict()
                for key in avg_scores:
                    avg_scores[key] += score_dict[key]

            for key in avg_scores:
                avg_scores[key] /= total

            return {
                "total": total,
                "approved": approved,
                "rejected": total - approved,
                "approval_rate": approved / total,
                "with_feedback": with_feedback,
                "learned": learned,
                "unlearned_feedback": unlearned_feedback,
                "avg_scores": avg_scores,
                "most_common_violations": self._get_common_violations(),
            }

    def _get_common_violations(self) -> dict[str, int]:
        """أكثر الانتهاكات شيوعاً"""
        violations: dict[str, int] = {}
        for record in self._records:
            if not record.decision.approved:
                for v in record.decision.violations:
                    violations[v.value] = violations.get(v.value, 0) + 1
        return dict(sorted(violations.items(), key=lambda x: x[1], reverse=True))

    def export_to_json(self, path: str | None = None) -> str:
        """تصدير جميع السجلات إلى JSON"""
        with self._lock:
            export_path = Path(path or "/tmp/ethics_export.json")
            data = [self._record_to_dict(r) for r in self._records]
            export_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
            return str(export_path)

    def clear_old_records(self, days: int = 30) -> int:
        """حذف السجلات الأقدم من N يوم"""
        with self._lock:
            from datetime import timedelta

            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            original_count = len(self._records)

            self._records = [
                r
                for r in self._records
                if datetime.fromisoformat(r.context.timestamp) > cutoff
            ]

            deleted = original_count - len(self._records)
            if deleted > 0:
                self._save()
            return deleted

    def _generate_id(self) -> str:
        """توليد معرف فريد للقرار"""
        import uuid

        return f"eth_{uuid.uuid4().hex[:16]}"

    def _record_to_dict(self, record: EthicsDecisionRecord) -> dict[str, Any]:
        """تحويل السجل إلى dict للتخزين"""
        return {
            "id": record.id,
            "context": asdict(record.context),
            "decision": {
                "approved": record.decision.approved,
                "score": record.decision.score.as_dict(),
                "average_score": record.decision.average_score,
                "violations": [v.value for v in record.decision.violations],
                "notes": record.decision.notes,
            },
            "feedback": asdict(record.feedback) if record.feedback else None,
            "learned": record.learned,
        }

    def _dict_to_record(self, data: dict[str, Any]) -> EthicsDecisionRecord:
        """تحويل dict إلى EthicsDecisionRecord"""
        from ethical_governance import EthicsViolationType

        return EthicsDecisionRecord(
            id=data["id"],
            context=DecisionContext(**data["context"]),
            decision=EthicsDecision(
                approved=data["decision"]["approved"],
                score=EthicsScore(**data["decision"]["score"]),
                average_score=data["decision"]["average_score"],
                violations=[
                    EthicsViolationType(v) for v in data["decision"]["violations"]
                ],
                notes=data["decision"]["notes"],
            ),
            feedback=UserFeedback(**data["feedback"]) if data.get("feedback") else None,
            learned=data.get("learned", False),
        )

    def _save(self) -> None:
        """حفظ السجلات إلى الملف"""
        try:
            self._storage_path.parent.mkdir(parents=True, exist_ok=True)
            data = [self._record_to_dict(r) for r in self._records]
            self._storage_path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False)
            )
        except Exception as e:
            print(f"Warning: Failed to save ethics history: {e}")

    def _load(self) -> None:
        """تحميل السجلات من الملف"""
        try:
            if self._storage_path.exists():
                data = json.loads(self._storage_path.read_text())
                self._records = [self._dict_to_record(d) for d in data]
        except Exception as e:
            print(f"Warning: Failed to load ethics history: {e}")
            self._records = []


# Singleton instance
_history_instance: DecisionHistory | None = None


def get_history() -> DecisionHistory:
    """الحصول على instance مشترك من DecisionHistory"""
    global _history_instance
    if _history_instance is None:
        storage_path = os.getenv("ETHICS_HISTORY_PATH", "/tmp/ethics_decisions.json")
        _history_instance = DecisionHistory(storage_path)
    return _history_instance
