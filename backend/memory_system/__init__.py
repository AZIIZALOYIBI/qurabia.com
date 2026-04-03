"""
Structured Memory System - نظام الذاكرة المهيكلة
مُقتبس من نظام memdir في Claude Code.

يوفر ذاكرة مهيكلة مع أنواع (user/feedback/project/reference)،
ترويسة frontmatter، تحذيرات حداثة، وبحث بالصلة.
"""

from __future__ import annotations

import json
import os
import re
import time
import hashlib
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional


class MemoryType(str, Enum):
    """أنواع الذاكرة المدعومة."""
    USER = "user"
    FEEDBACK = "feedback"
    PROJECT = "project"
    REFERENCE = "reference"


@dataclass
class MemoryEntry:
    """عنصر ذاكرة واحد مع ترويسة frontmatter."""
    id: str
    name: str
    description: str
    type: MemoryType
    content: str
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    tags: List[str] = field(default_factory=list)

    def signature(self) -> str:
        """بصمة فريدة للذاكرة."""
        base = f"{self.type.value}|{self.name}|{self.description}"
        return hashlib.sha256(base.encode()).hexdigest()[:16]

    def to_frontmatter(self) -> str:
        """تحويل إلى تنسيق frontmatter Markdown."""
        lines = [
            "---",
            f"name: {self.name}",
            f"description: {self.description}",
            f"type: {self.type.value}",
        ]
        if self.tags:
            lines.append(f"tags: {', '.join(self.tags)}")
        lines.append("---")
        lines.append("")
        lines.append(self.content)
        return "\n".join(lines)

    def to_dict(self) -> Dict[str, Any]:
        """تحويل إلى قاموس."""
        d = asdict(self)
        d["type"] = self.type.value
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MemoryEntry":
        """إنشاء من قاموس."""
        data = dict(data)
        if isinstance(data.get("type"), str):
            data["type"] = MemoryType(data["type"])
        return cls(**data)


# ─── حداثة الذاكرة ──────────────────────────────────────────

MS_PER_DAY = 86_400


def memory_age_days(updated_at: float) -> int:
    """عدد الأيام منذ آخر تعديل."""
    return max(0, int((time.time() - updated_at) / MS_PER_DAY))


def memory_age_text(updated_at: float) -> str:
    """نص عمر الذاكرة."""
    days = memory_age_days(updated_at)
    if days == 0:
        return "اليوم"
    if days == 1:
        return "أمس"
    return f"منذ {days} يوم"


def memory_freshness_warning(updated_at: float) -> str:
    """تحذير حداثة الذاكرة."""
    days = memory_age_days(updated_at)
    if days <= 1:
        return ""
    return (
        f"⚠️ هذه الذاكرة عمرها {days} يوم. "
        "الذكريات هي ملاحظات لحظية وليست حالة حية — "
        "الادعاءات حول سلوك الكود قد تكون قديمة. "
        "تحقق من الكود الحالي قبل التأكيد كحقيقة."
    )


# ─── تحليل Frontmatter ──────────────────────────────────────

_FM_PATTERN = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)


def parse_frontmatter(content: str) -> tuple[Dict[str, str], str]:
    """تحليل ترويسة frontmatter من محتوى Markdown."""
    match = _FM_PATTERN.match(content)
    if not match:
        return {}, content

    fm_text, body = match.group(1), match.group(2)
    frontmatter: Dict[str, str] = {}

    for line in fm_text.split("\n"):
        colon_idx = line.find(":")
        if colon_idx > 0:
            key = line[:colon_idx].strip()
            value = line[colon_idx + 1:].strip()
            frontmatter[key] = value

    return frontmatter, body


# ─── ما لا يجب حفظه ─────────────────────────────────────────

WHAT_NOT_TO_SAVE = [
    "أنماط الكود أو البنية (يمكن استنتاجها بقراءة الكود)",
    "تاريخ Git أو التغييرات الأخيرة",
    "حلول تصحيح الأخطاء (الإصلاح في الكود)",
    "تفاصيل المهام المؤقتة",
    "أي أسرار أو بيانات حساسة",
]


# ─── مخزن الذاكرة ────────────────────────────────────────────

class StructuredMemoryStore:
    """مخزن ذاكرة مهيكل مع بحث بالصلة وتحذيرات حداثة."""

    def __init__(self, storage_path: Optional[str] = None, max_entries: int = 200) -> None:
        self._storage_path = storage_path
        self._max_entries = max_entries
        self._entries: Dict[str, MemoryEntry] = {}
        if storage_path:
            self._load_from_file()

    def _load_from_file(self) -> None:
        """تحميل من ملف JSON."""
        if not self._storage_path or not os.path.exists(self._storage_path):
            return
        try:
            with open(self._storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for item in data:
                entry = MemoryEntry.from_dict(item)
                self._entries[entry.id] = entry
        except Exception:
            pass

    def _save_to_file(self) -> None:
        """حفظ إلى ملف JSON."""
        if not self._storage_path:
            return
        folder = os.path.dirname(os.path.abspath(self._storage_path))
        if folder:
            os.makedirs(folder, exist_ok=True)
        entries = sorted(self._entries.values(), key=lambda e: e.updated_at, reverse=True)
        entries = entries[:self._max_entries]
        data = [e.to_dict() for e in entries]
        with open(self._storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def add(self, entry: MemoryEntry) -> MemoryEntry:
        """إضافة ذاكرة جديدة."""
        self._entries[entry.id] = entry
        self._trim()
        self._save_to_file()
        return entry

    def get(self, entry_id: str) -> Optional[MemoryEntry]:
        """الحصول على ذاكرة بالمعرف."""
        return self._entries.get(entry_id)

    def update(self, entry_id: str, **kwargs: Any) -> Optional[MemoryEntry]:
        """تحديث ذاكرة."""
        entry = self._entries.get(entry_id)
        if not entry:
            return None
        for key, value in kwargs.items():
            if hasattr(entry, key) and key not in ("id", "created_at"):
                setattr(entry, key, value)
        entry.updated_at = time.time()
        self._save_to_file()
        return entry

    def delete(self, entry_id: str) -> bool:
        """حذف ذاكرة."""
        if entry_id not in self._entries:
            return False
        del self._entries[entry_id]
        self._save_to_file()
        return True

    def clear(self) -> None:
        """مسح جميع الذكريات."""
        self._entries.clear()
        self._save_to_file()

    def list_all(self, memory_type: Optional[MemoryType] = None) -> List[MemoryEntry]:
        """قائمة جميع الذكريات (مرتبة حسب الأحدث)."""
        entries = list(self._entries.values())
        if memory_type:
            entries = [e for e in entries if e.type == memory_type]
        return sorted(entries, key=lambda e: e.updated_at, reverse=True)

    def search(self, query: str, max_results: int = 5) -> List[MemoryEntry]:
        """بحث بالصلة في الذكريات."""
        if not query.strip():
            return self.list_all()[:max_results]

        query_lower = query.lower()
        words = query_lower.split()

        scored: List[tuple[float, MemoryEntry]] = []
        for entry in self._entries.values():
            search_text = f"{entry.name} {entry.description} {entry.content} {' '.join(entry.tags)}".lower()
            score = 0.0
            for word in words:
                if word in search_text:
                    score += 10
                if word in entry.name.lower():
                    score += 5
                if any(word in t.lower() for t in entry.tags):
                    score += 3
            if score > 0:
                scored.append((score, entry))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [entry for _, entry in scored[:max_results]]

    def format_manifest(self) -> str:
        """تنسيق قائمة الذكريات كنص manifest."""
        lines = []
        for entry in self.list_all():
            from datetime import datetime, timezone
            dt = datetime.fromtimestamp(entry.updated_at, tz=timezone.utc).isoformat()
            freshness = memory_freshness_warning(entry.updated_at)
            line = f"- [{entry.type.value}] {entry.name} ({dt}): {entry.description}"
            if freshness:
                line += f" {freshness}"
            lines.append(line)
        return "\n".join(lines)

    def _trim(self) -> None:
        """تقليم الذكريات الزائدة."""
        if len(self._entries) <= self._max_entries:
            return
        sorted_entries = sorted(self._entries.values(), key=lambda e: e.updated_at, reverse=True)
        self._entries = {e.id: e for e in sorted_entries[:self._max_entries]}
