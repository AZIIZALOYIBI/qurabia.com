# core_brain/memory.py

import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Optional

GENOME_DIR = "ai_genome"
GENOME_FILE = os.path.join(GENOME_DIR, "experiences.json")


class GeneticMemory:
    """
    الذاكرة الجينية: تخزن تجارب النظام وأخطاءه السابقة
    تمنع تكرار نفس الأخطاء وتُطوّر النظام مع كل مهمة
    """

    TASK_PREVIEW_LENGTH = 200
    ERROR_PREVIEW_LENGTH = 300

    def __init__(self):
        self.genome: List[dict] = []
        self._ensure_genome_dir()
        self._load_genome()

    # ─────────────────────────────────────────────
    # واجهة عامة
    # ─────────────────────────────────────────────

    def encode_experience(
        self,
        task: str,
        error_report: str,
        final_fix: str,
    ) -> dict:
        """
        يشفّر تجربة جديدة في الذاكرة الجينية
        task: وصف المهمة
        error_report: تقرير الخطأ الذي واجهه النظام
        final_fix: ما الذي أصلح المشكلة في النهاية
        """
        experience = {
            "id": self._generate_id(task, error_report),
            "timestamp": datetime.utcnow().isoformat(),
            "task_hash": hashlib.md5(task.encode()).hexdigest(),
            "task_preview": task[:self.TASK_PREVIEW_LENGTH],
            "error_signature": self._extract_error_signature(error_report),
            "error_preview": error_report[:self.ERROR_PREVIEW_LENGTH],
            "fix": final_fix[:self.ERROR_PREVIEW_LENGTH],
            "recalled_count": 0,
        }

        # تجنب التكرار
        if not self._is_duplicate(experience["id"]):
            self.genome.append(experience)
            self._save_genome()
            print(f"🧬 Genetic Memory: Encoded new experience ({experience['id'][:8]}...)")

        return experience

    def remember_past_mistakes(self, task: str) -> List[dict]:
        """
        يستدعي التجارب السابقة ذات الصلة بالمهمة الحالية
        يعيد قائمة بالتجارب الأكثر صلة
        """
        if not self.genome:
            return []

        task_hash = hashlib.md5(task.encode()).hexdigest()
        relevant: List[dict] = []

        for exp in self.genome:
            # تطابق المهام المتشابهة
            if exp["task_hash"] == task_hash:
                relevant.append(exp)
            # بحث بسيط بالكلمات المفتاحية
            elif self._tasks_are_related(task, exp["task_preview"]):
                relevant.append(exp)

        # تحديث عداد الاستدعاء
        for exp in relevant:
            exp["recalled_count"] += 1
        if relevant:
            self._save_genome()

        # أحدث 5 تجارب ذات صلة
        return sorted(relevant, key=lambda e: e["timestamp"], reverse=True)[:5]

    def get_error_hints(self, error_text: str) -> Optional[str]:
        """
        يبحث في الذاكرة عن أخطاء مشابهة ويعيد تلميحاً للحل
        """
        sig = self._extract_error_signature(error_text)
        for exp in self.genome:
            if exp["error_signature"] == sig and exp["fix"]:
                return (
                    f"💡 Genetic Hint (from past experience): {exp['fix']}"
                )
        return None

    def get_stats(self) -> dict:
        """يعيد إحصاءات الذاكرة الجينية"""
        return {
            "total_experiences": len(self.genome),
            "most_recalled": max(
                (e["recalled_count"] for e in self.genome), default=0
            ),
            "unique_errors": len(
                {e["error_signature"] for e in self.genome}
            ),
        }

    # ─────────────────────────────────────────────
    # دوال داخلية
    # ─────────────────────────────────────────────

    def _ensure_genome_dir(self):
        Path(GENOME_DIR).mkdir(parents=True, exist_ok=True)

    def _load_genome(self):
        if os.path.exists(GENOME_FILE):
            try:
                with open(GENOME_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.genome = data if isinstance(data, list) else []
                print(f"🧬 Genetic Memory: Loaded {len(self.genome)} experiences")
            except (json.JSONDecodeError, OSError):
                self.genome = []
        else:
            self.genome = []

    def _save_genome(self):
        try:
            with open(GENOME_FILE, "w", encoding="utf-8") as f:
                json.dump(self.genome, f, ensure_ascii=False, indent=2)
        except OSError as exc:
            print(f"⚠️ Could not save genetic memory: {exc}")

    def _generate_id(self, task: str, error: str) -> str:
        combined = f"{task[:100]}{error[:100]}{datetime.utcnow().date()}"
        return hashlib.sha256(combined.encode()).hexdigest()

    def _is_duplicate(self, exp_id: str) -> bool:
        return any(e["id"] == exp_id for e in self.genome)

    @staticmethod
    def _extract_error_signature(error_report: str) -> str:
        """
        يستخرج بصمة مميزة للخطأ (أول سطر مهم)
        يتجاهل أرقام الأسطر والمسارات الديناميكية
        """
        import re
        lines = error_report.splitlines()
        for line in lines:
            line = line.strip()
            if not line:
                continue
            # تجاهل السطور التي تبدأ بمسارات
            if re.match(r'^\s*File "', line):
                continue
            # تطبيع أرقام الأسطر
            line = re.sub(r'line \d+', 'line N', line)
            # تطبيع أسماء الملفات الديناميكية
            line = re.sub(r'[/\\][\w./\\-]+\.py', '<file>.py', line)
            if len(line) > 10:
                return line[:150]
        return error_report[:150]

    @staticmethod
    def _tasks_are_related(task_a: str, task_b: str) -> bool:
        """مطابقة بسيطة بناءً على الكلمات المفتاحية المشتركة"""
        words_a = set(task_a.lower().split())
        words_b = set(task_b.lower().split())
        # تجاهل كلمات الوقف الشائعة
        stopwords = {"a", "an", "the", "in", "on", "at", "to", "for",
                     "with", "and", "or", "of", "is", "are", "was",
                     "add", "fix", "create", "update", "make"}
        words_a -= stopwords
        words_b -= stopwords
        if not words_a or not words_b:
            return False
        overlap = words_a & words_b
        return len(overlap) / min(len(words_a), len(words_b)) >= 0.4
