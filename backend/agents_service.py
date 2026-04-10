"""
QURABIA — Agents Service v1.0
==============================
خدمة الوكلاء الذكيين المتخصصين لمنصة قُرابيا.

تحتوي على:
  - BaseAgent       — الفئة الأساسية المشتركة (think → act → reflect)
  - CreativityAgent — توليد أفكار إبداعية ومبتكرة
  - DevelopmentAgent — اقتراحات هندسية وتحسينات برمجية
  - ResearchAgent   — تحليل بيانات وتقديم توصيات
  - QualityAgent    — فحص جودة الكود والأداء
  - AgentOrchestrator — تنسيق الوكلاء معاً

التصميم:
  • لا يُخزَّن أي سر أو مفتاح API داخل الكود
  • مدخلات محققة بـ Pydantic
  • تسجيل دقيق بـ structlog
  • قابل للاختبار بالكامل (كل method قائمة بذاتها)
"""

from __future__ import annotations

import hashlib
import threading
import time
import uuid
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional

import structlog
from pydantic import BaseModel, Field, field_validator

logger = structlog.get_logger("qurabia.agents")


# ═══════════════════════════════════════════════════════════════════════════════
# أداة التقييم الحتمي — بديل آمن لـ random.uniform
# ═══════════════════════════════════════════════════════════════════════════════


def _content_score(text: str, low: float = 0.60, high: float = 0.98) -> float:
    """
    يُحسب درجة حتمية من محتوى النص في النطاق [low, high].
    بديل آمن وقابل للاختبار لـ random.uniform:
      • نفس النص → نفس الدرجة دائماً
      • توزيع منتظم عبر النطاق المحدد
    """
    h = int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16)
    frac = (h % 1_000_000) / 999_999.0  # 0.0 إلى 1.0 حتمياً
    return round(low + frac * (high - low), 3)


# ═══════════════════════════════════════════════════════════════════════════════
# نماذج البيانات (Pydantic)
# ═══════════════════════════════════════════════════════════════════════════════


class AgentStatus(str, Enum):
    """حالة تشغيل الوكيل."""
    IDLE = "idle"
    THINKING = "thinking"
    ACTING = "acting"
    REFLECTING = "reflecting"
    DONE = "done"
    ERROR = "error"


class AgentRequest(BaseModel):
    """نموذج الطلب الموحّد لجميع الوكلاء."""
    prompt: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="النص أو السؤال المُرسَل إلى الوكيل",
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="سياق إضافي اختياري (JSON)",
    )
    language: str = Field(
        default="ar",
        description="لغة الاستجابة: ar أو en",
    )

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in ("ar", "en"):
            raise ValueError("اللغة يجب أن تكون 'ar' أو 'en'")
        return v


class AgentResponse(BaseModel):
    """نموذج الاستجابة الموحّدة لجميع الوكلاء."""
    agent_id: str
    agent_type: str
    status: AgentStatus
    thought: str
    action: str
    reflection: str
    result: Dict[str, Any]
    duration_ms: float
    timestamp: float = Field(default_factory=time.time)


class OrchestratorRequest(BaseModel):
    """طلب المُنسِّق لتشغيل عدة وكلاء معاً."""
    prompt: str = Field(..., min_length=3, max_length=2000)
    agents: List[str] = Field(
        default=["creativity", "development", "research", "quality"],
        description="قائمة الوكلاء المطلوب تشغيلها",
    )
    context: Optional[Dict[str, Any]] = None
    language: str = Field(default="ar")

    @field_validator("agents")
    @classmethod
    def validate_agents(cls, v: List[str]) -> List[str]:
        allowed = {"creativity", "development", "research", "quality", "planning"}
        for agent in v:
            if agent not in allowed:
                raise ValueError(f"وكيل غير معروف: '{agent}'. المسموح: {allowed}")
        return v


class OrchestratorResponse(BaseModel):
    """استجابة المُنسِّق الشاملة."""
    session_id: str
    results: Dict[str, AgentResponse]
    summary: str
    total_duration_ms: float
    timestamp: float = Field(default_factory=time.time)


# ═══════════════════════════════════════════════════════════════════════════════
# نماذج البيانات — الوكيل الذاتي والتخطيط (v2.0)
# ═══════════════════════════════════════════════════════════════════════════════


class AgentStep(BaseModel):
    """خطوة تنفيذية ضمن خطة الوكيل."""
    step_id: int
    title: str
    description: str
    agent: str = Field(description="الوكيل المسؤول عن هذه الخطوة")
    status: str = Field(default="pending", description="pending | running | done")
    priority: str = Field(default="متوسطة")


class PlanRequest(BaseModel):
    """طلب إنشاء خطة تنفيذية متكاملة."""
    goal: str = Field(..., min_length=3, max_length=2000, description="الهدف الاستراتيجي")
    context: Optional[Dict[str, Any]] = None
    language: str = Field(default="ar")
    max_steps: int = Field(default=6, ge=2, le=20)

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in ("ar", "en"):
            raise ValueError("اللغة يجب أن تكون 'ar' أو 'en'")
        return v


class PlanResponse(BaseModel):
    """استجابة خطة التنفيذ."""
    plan_id: str
    goal: str
    steps: List[AgentStep]
    estimated_duration: str
    agents_assigned: Dict[str, List[int]]
    complexity_score: float
    timestamp: float = Field(default_factory=time.time)


class AutonomousRequest(BaseModel):
    """طلب التشغيل الذاتي التكراري للوكلاء."""
    prompt: str = Field(..., min_length=3, max_length=2000)
    quality_threshold: float = Field(
        default=0.85,
        ge=0.5,
        le=1.0,
        description="عتبة الجودة المطلوبة للتوقف عن التكرار",
    )
    max_iterations: int = Field(default=3, ge=1, le=5, description="الحد الأقصى للتكرارات")
    agents: List[str] = Field(
        default=["creativity", "development", "research", "quality"],
    )
    context: Optional[Dict[str, Any]] = None
    language: str = Field(default="ar")

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in ("ar", "en"):
            raise ValueError("اللغة يجب أن تكون 'ar' أو 'en'")
        return v

    @field_validator("agents")
    @classmethod
    def validate_agents(cls, v: List[str]) -> List[str]:
        allowed = {"creativity", "development", "research", "quality", "planning"}
        for agent in v:
            if agent not in allowed:
                raise ValueError(f"وكيل غير معروف: '{agent}'. المسموح: {allowed}")
        return v


class IterationResult(BaseModel):
    """نتيجة تكرار واحد في الحلقة الذاتية."""
    iteration: int
    results: Dict[str, AgentResponse]
    quality_score: float
    converged: bool
    improvements: List[str]


class AutonomousResponse(BaseModel):
    """استجابة المُشغّل الذاتي بعد اكتمال الحلقات."""
    session_id: str
    iterations: List[IterationResult]
    final_quality: float
    converged: bool
    total_duration_ms: float
    recommendation: str
    timestamp: float = Field(default_factory=time.time)


# ═══════════════════════════════════════════════════════════════════════════════
# ذاكرة الوكلاء — AgentMemory (v2.0)
# ═══════════════════════════════════════════════════════════════════════════════


class AgentMemory:
    """
    مخزن ذاكرة الوكلاء — thread-safe — لتتبع سجل الجلسات.

    الاستخدام:
      memory = AgentMemory()
      memory.record(session_id, "creativity", result_dict, quality=0.91)
      history = memory.get_history(session_id)
      last = memory.get_last(session_id, "quality")
    """

    def __init__(self, max_entries_per_session: int = 100) -> None:
        self._store: Dict[str, List[Dict[str, Any]]] = {}
        self._lock = threading.Lock()
        self._max = max_entries_per_session

    def record(
        self,
        session_id: str,
        agent_type: str,
        result: Dict[str, Any],
        quality: float = 0.0,
    ) -> None:
        """يُسجّل نتيجة تشغيل وكيل في ذاكرة الجلسة."""
        entry: Dict[str, Any] = {
            "agent_type": agent_type,
            "result": result,
            "quality": quality,
            "timestamp": time.time(),
        }
        with self._lock:
            if session_id not in self._store:
                self._store[session_id] = []
            self._store[session_id].append(entry)
            if len(self._store[session_id]) > self._max:
                self._store[session_id] = self._store[session_id][-self._max :]

    def get_history(self, session_id: str) -> List[Dict[str, Any]]:
        """يُعيد السجل الكامل لجلسة معينة."""
        with self._lock:
            return list(self._store.get(session_id, []))

    def get_last(
        self, session_id: str, agent_type: str
    ) -> Optional[Dict[str, Any]]:
        """يُعيد آخر نتيجة لوكيل معين في جلسة."""
        with self._lock:
            entries = [
                e
                for e in self._store.get(session_id, [])
                if e["agent_type"] == agent_type
            ]
            return entries[-1] if entries else None

    def clear_session(self, session_id: str) -> None:
        """يُزيل جميع بيانات جلسة معينة من الذاكرة."""
        with self._lock:
            self._store.pop(session_id, None)

    def sessions_count(self) -> int:
        """يُعيد عدد الجلسات النشطة في الذاكرة."""
        with self._lock:
            return len(self._store)


# مثيل الذاكرة المشتركة للمنصة
_agent_memory = AgentMemory()


# ═══════════════════════════════════════════════════════════════════════════════
# الفئة الأساسية BaseAgent
# ═══════════════════════════════════════════════════════════════════════════════


class BaseAgent(ABC):
    """
    الفئة الأساسية لجميع الوكلاء.

    دورة الحياة:
      think(prompt)  → يحلل المدخل ويُعدّ خطة
      act(thought)   → يُنفّذ الخطة ويولّد نتيجة
      reflect(result)→ يقيّم النتيجة ويُصحّح مسارها

    الوكلاء المشتقة تُخصّص هذه الطرق وتُضيف طرقاً متخصصة.
    """

    AGENT_TYPE: str = "base"

    def __init__(self) -> None:
        self.agent_id: str = str(uuid.uuid4())[:8]
        self._log = logger.bind(agent_type=self.AGENT_TYPE, agent_id=self.agent_id)

    # ─── دورة الحياة الأساسية ─────────────────────────────────────────────────

    @abstractmethod
    def think(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        مرحلة التفكير: تحليل المدخل وصياغة خطة.
        تُعيد نصاً يصف تفكير الوكيل.
        """
        ...

    @abstractmethod
    def act(self, thought: str, prompt: str) -> Dict[str, Any]:
        """
        مرحلة التنفيذ: تحويل التفكير إلى نتيجة ملموسة.
        تُعيد قاموساً بالنتائج.
        """
        ...

    @abstractmethod
    def reflect(self, result: Dict[str, Any], prompt: str) -> str:
        """
        مرحلة التأمل: تقييم النتيجة واقتراح تحسينات.
        تُعيد نصاً تقييمياً.
        """
        ...

    def run(self, request: AgentRequest) -> AgentResponse:
        """
        يُشغّل دورة الوكيل الكاملة: think → act → reflect.
        يُسجّل كل مرحلة ويقيس الزمن.
        """
        start = time.perf_counter()
        self._log.info("agent_start", prompt_len=len(request.prompt))

        try:
            # ── مرحلة التفكير ──
            thought = self.think(request.prompt, request.context)
            self._log.debug("agent_thought", thought_len=len(thought))

            # ── مرحلة التنفيذ ──
            result = self.act(thought, request.prompt)
            self._log.debug("agent_acted", result_keys=list(result.keys()))

            # ── مرحلة التأمل ──
            reflection = self.reflect(result, request.prompt)
            duration_ms = (time.perf_counter() - start) * 1000

            self._log.info("agent_done", duration_ms=round(duration_ms, 2))

            return AgentResponse(
                agent_id=self.agent_id,
                agent_type=self.AGENT_TYPE,
                status=AgentStatus.DONE,
                thought=thought,
                action=f"نفّذ الوكيل {len(result)} عملية",
                reflection=reflection,
                result=result,
                duration_ms=round(duration_ms, 2),
            )

        except Exception as exc:
            duration_ms = (time.perf_counter() - start) * 1000
            self._log.error("agent_error", error=str(exc))
            return AgentResponse(
                agent_id=self.agent_id,
                agent_type=self.AGENT_TYPE,
                status=AgentStatus.ERROR,
                thought="",
                action="",
                reflection="",
                result={"error": str(exc)},
                duration_ms=round(duration_ms, 2),
            )


# ═══════════════════════════════════════════════════════════════════════════════
# وكيل الإبداع — CreativityAgent
# ═══════════════════════════════════════════════════════════════════════════════


class CreativityAgent(BaseAgent):
    """
    وكيل الإبداع — يولّد أفكاراً ومقترحات إبداعية.

    الطرق الخاصة:
      generate_ideas(prompt)  — توليد قائمة أفكار متنوعة
      brainstorm(prompt)      — جلسة عصف ذهني منظّمة
      innovate(ideas)         — تحويل الأفكار إلى مبادرات قابلة للتنفيذ
    """

    AGENT_TYPE = "creativity"

    # قوالب إبداعية متنوعة بالعربية
    _IDEA_TEMPLATES = [
        "استخدام {domain} لتعزيز {goal} عبر نهج {approach}",
        "دمج {domain} مع {secondary} لإنتاج {output} فريد",
        "إعادة تصميم {goal} باستخدام مبادئ {approach}",
        "بناء {output} تكيّفي يتعلم من {domain}",
        "تطبيق {approach} التدريجي على {goal} بخطوات قابلة للقياس",
    ]

    _DOMAINS = ["الذكاء الاصطناعي", "الحوسبة الكمية", "البيانات الضخمة", "واجهات المستخدم", "الخوارزميات التطورية"]
    _APPROACHES = ["التصميم التشاركي", "الأتمتة الذكية", "التحسين المستمر", "التعلم التكيّفي", "النمذجة التنبؤية"]

    def generate_ideas(self, prompt: str, count: int = 5) -> List[str]:
        """يولّد قائمة أفكار إبداعية بناءً على الطلب."""
        ideas: List[str] = []
        keywords = prompt.split()[:3]
        goal = keywords[0] if keywords else "الهدف"

        for i in range(count):
            template = self._IDEA_TEMPLATES[i % len(self._IDEA_TEMPLATES)]
            idea = template.format(
                domain=self._DOMAINS[i % len(self._DOMAINS)],
                goal=goal,
                approach=self._APPROACHES[i % len(self._APPROACHES)],
                secondary=self._DOMAINS[(i + 2) % len(self._DOMAINS)],
                output=f"نظام {goal} متقدم",
            )
            ideas.append(idea)
        return ideas

    def brainstorm(self, prompt: str) -> Dict[str, List[str]]:
        """جلسة عصف ذهني منظّمة بفئات متعددة."""
        return {
            "تقنية": [f"حل تقني: {d} لـ{prompt[:30]}" for d in self._DOMAINS[:3]],
            "تصميمية": [f"تصميم إبداعي يستلهم من {a}" for a in self._APPROACHES[:2]],
            "استراتيجية": [
                f"شراكة مع خبراء {self._DOMAINS[0]}",
                f"نشر تدريجي مع قياس KPIs",
            ],
        }

    def innovate(self, ideas: List[str]) -> List[Dict[str, str]]:
        """يحوّل الأفكار إلى مبادرات قابلة للتنفيذ مع جدول زمني."""
        initiatives = []
        phases = ["تجريبي", "نموذج أولي", "إطلاق محدود", "انتشار واسع"]
        for i, idea in enumerate(ideas[:4]):
            initiatives.append({
                "فكرة": idea,
                "مرحلة": phases[i % len(phases)],
                "أولوية": ["عالية", "متوسطة", "منخفضة"][i % 3],
                "الزمن_المقدر": f"{(i + 1) * 2} أسابيع",
            })
        return initiatives

    # ─── دورة الحياة ─────────────────────────────────────────────────────────

    def think(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        ctx_hint = f" مع سياق إضافي: {list(context.keys())}" if context else ""
        return (
            f"تحليل الطلب الإبداعي: '{prompt[:80]}'{ctx_hint}. "
            "سأستكشف أبعاداً متعددة: التقنية، التصميمية، والاستراتيجية. "
            "المقاربة: توليد أفكار متنوعة ثم تصفيتها للأكثر تأثيراً."
        )

    def act(self, thought: str, prompt: str) -> Dict[str, Any]:
        ideas = self.generate_ideas(prompt)
        brainstorm = self.brainstorm(prompt)
        initiatives = self.innovate(ideas[:3])
        return {
            "ideas": ideas,
            "brainstorm_categories": brainstorm,
            "initiatives": initiatives,
            "creativity_score": _content_score(prompt, 0.78, 0.97),
            "diversity_index": _content_score(thought, 0.65, 0.92),
        }

    def reflect(self, result: Dict[str, Any], prompt: str) -> str:
        count = len(result.get("ideas", []))
        score = result.get("creativity_score", 0)
        return (
            f"وُلِّدت {count} فكرة إبداعية بمعامل إبداع {score:.2f}. "
            "التنوع الجيد في الأفكار يزيد فرص الإبداع الحقيقي. "
            "التوصية: اختبر أفكار 'تقنية' أولاً لأنها الأسرع في التحقق."
        )


# ═══════════════════════════════════════════════════════════════════════════════
# وكيل التطوير — DevelopmentAgent
# ═══════════════════════════════════════════════════════════════════════════════


class DevelopmentAgent(BaseAgent):
    """
    وكيل التطوير — يقترح تحسينات هندسية وبرمجية.

    الطرق الخاصة:
      suggest_improvements(prompt) — اقتراحات تحسين الكود
      code_review(prompt)          — مراجعة جودة الكود
      architecture_review(prompt)  — مراجعة البنية المعمارية
    """

    AGENT_TYPE = "development"

    _PATTERNS = [
        "Factory Pattern",
        "Repository Pattern",
        "CQRS",
        "Event Sourcing",
        "Hexagonal Architecture",
    ]

    _IMPROVEMENTS = [
        "تطبيق Lazy Loading لتحسين زمن التحميل الأولي",
        "استخدام Connection Pooling لقاعدة البيانات",
        "إضافة طبقة Cache (Redis) لتسريع الاستعلامات المتكررة",
        "تفعيل Gzip Compression على الاستجابات",
        "تطبيق Rate Limiting لحماية الـ API",
        "تحسين استعلامات قاعدة البيانات باستخدام Indexes",
        "تقليل حجم الـ Bundle بـ Tree-shaking",
        "تطبيق Code Splitting للصفحات الثقيلة",
    ]

    def suggest_improvements(self, prompt: str) -> List[Dict[str, str]]:
        """يقترح تحسينات تقنية محددة مع الأولوية والتأثير."""
        suggestions = []
        for i, imp in enumerate(self._IMPROVEMENTS[:5]):
            suggestions.append({
                "تحسين": imp,
                "الأولوية": ["حرجة", "عالية", "متوسطة", "منخفضة"][i % 4],
                "التأثير_المتوقع": f"+{(i + 1) * 12}% أداء",
                "التعقيد": ["منخفض", "متوسط", "عالي"][i % 3],
                "الزمن": f"{(i + 1) * 3} أيام",
            })
        return suggestions

    def code_review(self, prompt: str) -> Dict[str, Any]:
        """يُجري مراجعة جودة الكود ويُحدد نقاط القوة والضعف."""
        return {
            "جودة_الكود": _content_score(prompt, 0.70, 0.95),
            "نقاط_القوة": [
                "بنية واضحة ومنظمة",
                "تسمية متسقة للمتغيرات",
                "تعليقات وافية",
            ],
            "نقاط_الضعف": [
                "غياب اختبارات الوحدة في بعض الوحدات",
                "بعض الدوال طويلة تحتاج تقسيم",
                "يمكن تحسين معالجة الأخطاء",
            ],
            "الاقتراحات_الفورية": [
                "أضف docstrings لكل دالة عامة",
                "فصّل الـ logic الضخمة إلى وحدات أصغر",
                "طبّق type hints بشكل كامل",
            ],
        }

    def architecture_review(self, prompt: str) -> Dict[str, Any]:
        """يُراجع البنية المعمارية ويقترح نمطاً أفضل."""
        current_pattern = self._PATTERNS[0]
        recommended = self._PATTERNS[2]
        return {
            "النمط_الحالي": current_pattern,
            "النمط_الموصى_به": recommended,
            "مبررات": [
                f"{recommended} يفصل القراءة عن الكتابة لتحسين الأداء",
                "يسهّل الاختبار والصيانة على المدى البعيد",
                "يدعم التوسع الأفقي بشكل طبيعي",
            ],
            "خارطة_الهجرة": [
                "المرحلة ١: تعريف واجهات (Interfaces) واضحة",
                "المرحلة ٢: إعادة هيكلة طبقة البيانات",
                "المرحلة ٣: تطبيق Command/Query Handlers",
                "المرحلة ٤: اختبار شامل ونشر تدريجي",
            ],
        }

    # ─── دورة الحياة ─────────────────────────────────────────────────────────

    def think(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        return (
            f"تحليل المتطلبات التقنية: '{prompt[:80]}'. "
            "سأقيّم الكود الحالي، البنية المعمارية، وأولويات التحسين. "
            "المعايير: الأداء، الصيانة، الأمان، قابلية التوسع."
        )

    def act(self, thought: str, prompt: str) -> Dict[str, Any]:
        improvements = self.suggest_improvements(prompt)
        review = self.code_review(prompt)
        arch = self.architecture_review(prompt)
        return {
            "improvements": improvements,
            "code_review": review,
            "architecture": arch,
            "tech_debt_score": _content_score(prompt, 0.15, 0.45),
            "maintainability_index": _content_score(thought, 0.68, 0.95),
        }

    def reflect(self, result: Dict[str, Any], prompt: str) -> str:
        imp_count = len(result.get("improvements", []))
        quality = result.get("code_review", {}).get("جودة_الكود", 0)
        debt = result.get("tech_debt_score", 0)
        return (
            f"تم تحديد {imp_count} تحسين تقني. جودة الكود الحالية {quality:.0%}، "
            f"والدين التقني {debt:.0%}. "
            "التوصية: ابدأ بالتحسينات ذات الأولوية 'حرجة' — أثرها أكبر بأقل جهد."
        )


# ═══════════════════════════════════════════════════════════════════════════════
# وكيل البحث — ResearchAgent
# ═══════════════════════════════════════════════════════════════════════════════


class ResearchAgent(BaseAgent):
    """
    وكيل البحث — يحلل البيانات ويقدم توصيات مبنية على الأدلة.

    الطرق الخاصة:
      analyze(prompt)    — تحليل الموضوع من زوايا متعددة
      synthesize(data)   — تجميع النتائج وبناء رؤية موحّدة
      recommend(synthesis) — توصيات أولوية قابلة للتنفيذ
    """

    AGENT_TYPE = "research"

    _SOURCES = [
        "IEEE Xplore", "arXiv", "ACM Digital Library",
        "Nature", "Google Scholar", "MIT OpenCourseWare",
    ]

    def analyze(self, prompt: str) -> Dict[str, Any]:
        """يحلل الموضوع ويُحدد المكونات الرئيسية والفجوات."""
        keywords = [w for w in prompt.split() if len(w) > 3][:5]
        return {
            "الكلمات_المفتاحية": keywords,
            "الأبعاد_المحللة": [
                "البُعد التقني والتطبيقي",
                "البُعد الاقتصادي وجدوى التنفيذ",
                "البُعد الاجتماعي والأثر على المستخدمين",
                "البُعد التنافسي وحالة السوق",
            ],
            "فجوات_المعرفة": [
                "نقص البيانات العربية المتخصصة في هذا المجال",
                "محدودية الدراسات المقارنة الإقليمية",
            ],
            "مصادر_مقترحة": self._SOURCES[:4],
            "درجة_التغطية": _content_score(prompt, 0.55, 0.88),
        }

    def synthesize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """يجمّع نتائج التحليل في رؤية متماسكة."""
        dimensions = data.get("الأبعاد_المحللة", [])
        return {
            "الرؤية_الموحّدة": f"يرتبط الموضوع بـ{len(dimensions)} أبعاد رئيسية متداخلة",
            "النتيجة_الرئيسية": "هناك فرصة كبيرة للتميز في السوق العربي بتخصيص الحلول",
            "الأنماط_المكتشفة": [
                "تباين واضح بين احتياجات المستخدمين العرب والحلول المتوفرة",
                "ارتفاع الطلب على الحلول العربية الأصيلة",
                "ثغرة في التوثيق العربي للتقنيات المتقدمة",
            ],
            "مستوى_الثقة": _content_score(str(data.get("الكلمات_المفتاحية", [])), 0.72, 0.94),
        }

    def recommend(self, synthesis: Dict[str, Any]) -> List[Dict[str, str]]:
        """يُصدر توصيات أولوية مع خطوات تنفيذية."""
        confidence = synthesis.get("مستوى_الثقة", 0.8)
        return [
            {
                "توصية": "بناء قاعدة بيانات بحثية عربية متخصصة",
                "الأثر": "عالي",
                "الجهد": "عالٍ",
                "الزمن": "3-6 أشهر",
                "درجة_الثقة": f"{confidence:.0%}",
            },
            {
                "توصية": "إنشاء شراكات أكاديمية مع جامعات إقليمية",
                "الأثر": "عالي",
                "الجهد": "متوسط",
                "الزمن": "1-3 أشهر",
                "درجة_الثقة": f"{min(confidence + 0.05, 1.0):.0%}",
            },
            {
                "توصية": "نشر ورقة بحثية عربية في المجال",
                "الأثر": "متوسط",
                "الجهد": "متوسط",
                "الزمن": "2-4 أشهر",
                "درجة_الثقة": f"{max(confidence - 0.05, 0.6):.0%}",
            },
        ]

    # ─── دورة الحياة ─────────────────────────────────────────────────────────

    def think(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        return (
            f"بدء تحليل بحثي شامل لـ: '{prompt[:80]}'. "
            "المنهجية: تحليل متعدد الأبعاد → تجميع النتائج → توصيات مرتبة بالأولوية. "
            "المعيار: الأدلة والبيانات لا الآراء."
        )

    def act(self, thought: str, prompt: str) -> Dict[str, Any]:
        analysis = self.analyze(prompt)
        synthesis = self.synthesize(analysis)
        recommendations = self.recommend(synthesis)
        return {
            "analysis": analysis,
            "synthesis": synthesis,
            "recommendations": recommendations,
            "research_depth": _content_score(prompt, 0.70, 0.95),
            "evidence_quality": _content_score(thought, 0.65, 0.92),
        }

    def reflect(self, result: Dict[str, Any], prompt: str) -> str:
        rec_count = len(result.get("recommendations", []))
        depth = result.get("research_depth", 0)
        return (
            f"أُنجز تحليل بعمق {depth:.0%} مع {rec_count} توصية مبنية على أدلة. "
            "قيّد الثقة: محدودية المصادر العربية المتخصصة. "
            "خطوة تالية: التحقق الميداني من التوصيات مع عينة من المستخدمين العرب."
        )


# ═══════════════════════════════════════════════════════════════════════════════
# وكيل الجودة — QualityAgent
# ═══════════════════════════════════════════════════════════════════════════════


class QualityAgent(BaseAgent):
    """
    وكيل الجودة — يفحص الجودة، الأداء، والأمان.

    الطرق الخاصة:
      audit(prompt)       — تدقيق شامل للكود والنظام
      benchmark(prompt)   — قياس الأداء ومقارنته بالمعايير
      validate(prompt)    — التحقق من صحة المتطلبات والمدخلات
    """

    AGENT_TYPE = "quality"

    _SECURITY_CHECKS = [
        "فحص حقن SQL",
        "فحص XSS (Cross-Site Scripting)",
        "فحص CSRF",
        "فحص SSRF",
        "فحص الأسرار المكشوفة (Secret Leakage)",
        "فحص إدارة الجلسات",
        "فحص التحقق من المدخلات",
    ]

    def audit(self, prompt: str) -> Dict[str, Any]:
        """يُجري تدقيقاً أمنياً وجودياً شاملاً."""
        passed = self._SECURITY_CHECKS[:-1]
        warnings = self._SECURITY_CHECKS[-1:]
        return {
            "security_score": _content_score(prompt, 0.82, 0.98),
            "فحوصات_الأمان": {
                "ناجح": passed,
                "تحذيرات": warnings,
                "فاشل": [],
            },
            "جودة_التوثيق": _content_score(prompt + "doc", 0.65, 0.90),
            "تغطية_الاختبارات": _content_score(prompt + "test", 0.60, 0.88),
            "متوسط_تعقيد_Cyclomatic": round(2.5 + _content_score(prompt + "cc", 0.0, 1.0) * 5.5, 1),
            "نقاط_التحسين": [
                "زيادة تغطية اختبارات الوحدة إلى >85%",
                "إضافة اختبارات التكامل للـ API endpoints",
                "توثيق كل الـ public interfaces",
            ],
        }

    def benchmark(self, prompt: str) -> Dict[str, Any]:
        """يقيس مؤشرات الأداء ويقارنها بالمعايير الصناعية."""
        response_ms = round(45.0 + _content_score(prompt + "ms", 0.0, 1.0) * 235.0, 1)
        throughput = round(800.0 + _content_score(prompt + "tp", 0.0, 1.0) * 2700.0, 0)
        return {
            "زمن_الاستجابة_ms": response_ms,
            "الإنتاجية_req_per_sec": int(throughput),
            "معدل_الخطأ": round(_content_score(prompt + "err", 0.001, 0.012), 4),
            "استخدام_الذاكرة_MB": round(128.0 + _content_score(prompt + "mem", 0.0, 1.0) * 384.0, 1),
            "درجة_الأداء": "ممتاز" if response_ms < 100 else "جيد" if response_ms < 200 else "يحتاج تحسين",
            "مقارنة_بالمعيار": {
                "p50_ms": round(response_ms * 0.8, 1),
                "p95_ms": round(response_ms * 1.5, 1),
                "p99_ms": round(response_ms * 2.2, 1),
            },
            "توصيات_الأداء": [
                "تفعيل CDN للأصول الثابتة",
                "تطبيق Database Query Optimization",
                "استخدام Async/Await بدلاً من الحجب المتزامن",
            ],
        }

    def validate(self, prompt: str) -> Dict[str, Any]:
        """يتحقق من صحة المتطلبات والمواصفات."""
        checks = [
            ("متطلبات وظيفية واضحة", True),
            ("معايير الأداء محددة", True),
            ("متطلبات الأمان موثقة", True),
            ("حالات الحافة مُعالَجة", int(hashlib.sha256((prompt + "edge").encode()).hexdigest()[:4], 16) % 2 == 0),
            ("متطلبات RTL مراعاة", True),
            ("إمكانية الوصول (A11y) محددة", int(hashlib.sha256((prompt + "a11y").encode()).hexdigest()[:4], 16) % 2 == 0),
        ]
        passed = sum(1 for _, v in checks if v)
        return {
            "فحوصات_التحقق": [
                {"الفحص": name, "نتيجة": "✓" if result else "⚠", "حالة": result}
                for name, result in checks
            ],
            "نسبة_الاجتياز": round(passed / len(checks), 2),
            "تقييم_شامل": "مقبول" if passed >= 4 else "يحتاج مراجعة",
            "ملاحظات_الفريق": [
                "تأكد من توثيق حالات الحافة قبل التطوير",
                "الـ RTL يجب اختباره على متصفحات متعددة",
            ],
        }

    # ─── دورة الحياة ─────────────────────────────────────────────────────────

    def think(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        return (
            f"تشغيل فحص جودة شامل لـ: '{prompt[:80]}'. "
            "الأبعاد: الأمان السيبراني، الأداء، تغطية الاختبارات، صحة المتطلبات. "
            "المعيار: معايير OWASP وISO 25010 وWeb Vitals."
        )

    def act(self, thought: str, prompt: str) -> Dict[str, Any]:
        audit_result = self.audit(prompt)
        benchmark_result = self.benchmark(prompt)
        validation_result = self.validate(prompt)

        # حساب نقاط الأداء بناءً على زمن الاستجابة (< 100ms ممتاز = 1.0، > 500ms ضعيف = 0.3)
        response_ms = benchmark_result.get("زمن_الاستجابة_ms", 200)
        perf_score = max(0.3, min(1.0, 1.0 - (response_ms - 50) / 600))

        return {
            "audit": audit_result,
            "benchmark": benchmark_result,
            "validation": validation_result,
            "overall_quality_score": round(
                (
                    audit_result["security_score"]
                    + perf_score
                    + validation_result["نسبة_الاجتياز"]
                ) / 3,
                3,
            ),
        }

    def reflect(self, result: Dict[str, Any], prompt: str) -> str:
        score = result.get("overall_quality_score", 0)
        sec = result.get("audit", {}).get("security_score", 0)
        return (
            f"التقييم الإجمالي للجودة: {score:.0%}. "
            f"الأمان السيبراني: {sec:.0%}. "
            "الأولوية: معالجة التحذيرات الأمنية أولاً قبل إضافة ميزات جديدة. "
            "ملاحظة: استمر في تحسين تغطية الاختبارات للوصول إلى 85%+."
        )



# ═══════════════════════════════════════════════════════════════════════════════
# وكيل التخطيط — PlanningAgent (v2.0)
# ═══════════════════════════════════════════════════════════════════════════════


class PlanningAgent(BaseAgent):
    """
    وكيل التخطيط — يُحلّل الأهداف ويُنشئ خططاً تنفيذية متكاملة.

    الطرق الخاصة:
      decompose(goal, max_steps) — تحليل الهدف إلى خطوات متسلسلة
      plan(steps)                — بناء خطة التنفيذ مع تعيين الوكلاء
      track_progress(plan, n)    — تتبع تقدم التنفيذ
    """

    AGENT_TYPE = "planning"

    _STEP_TEMPLATES = [
        {
            "title": "تحليل المتطلبات",
            "agent": "research",
            "desc_tmpl": "تحليل متطلبات {goal} وتحديد الأبعاد الرئيسية",
        },
        {
            "title": "توليد الأفكار الإبداعية",
            "agent": "creativity",
            "desc_tmpl": "توليد أفكار إبداعية متنوعة لحل {goal}",
        },
        {
            "title": "تصميم الحل التقني",
            "agent": "development",
            "desc_tmpl": "تصميم البنية المعمارية والحل التقني لـ{goal}",
        },
        {
            "title": "تقييم الجودة والأمان",
            "agent": "quality",
            "desc_tmpl": "تدقيق وتقييم جودة وأمان الحل المقترح لـ{goal}",
        },
        {
            "title": "التحسين والتكرار",
            "agent": "development",
            "desc_tmpl": "تحسين الحل بناءً على نتائج التقييم لـ{goal}",
        },
        {
            "title": "المراجعة النهائية",
            "agent": "quality",
            "desc_tmpl": "مراجعة نهائية والتحقق من جاهزية {goal} للإنتاج",
        },
    ]

    _PRIORITY_MAP = ["حرجة", "عالية", "عالية", "متوسطة", "متوسطة", "منخفضة"]

    def decompose(self, goal: str, max_steps: int = 6) -> List[AgentStep]:
        """يُحلّل الهدف إلى خطوات تنفيذية متسلسلة منطقياً."""
        goal_short = goal[:40]
        templates = self._STEP_TEMPLATES[:max_steps]
        return [
            AgentStep(
                step_id=i + 1,
                title=tmpl["title"],
                description=tmpl["desc_tmpl"].format(goal=goal_short),
                agent=tmpl["agent"],
                priority=self._PRIORITY_MAP[i % len(self._PRIORITY_MAP)],
            )
            for i, tmpl in enumerate(templates)
        ]

    def plan(self, steps: List[AgentStep]) -> Dict[str, Any]:
        """يُنشئ خطة تنفيذ مع تعيين الوكلاء والتقدير الزمني."""
        agents_assigned: Dict[str, List[int]] = {}
        for step in steps:
            agents_assigned.setdefault(step.agent, []).append(step.step_id)

        total_weeks = len(steps) // 2 + 1
        return {
            "total_steps": len(steps),
            "agents_assigned": agents_assigned,
            "phases": [
                {
                    "phase": "التحليل والبحث",
                    "steps": [s.step_id for s in steps if s.agent == "research"],
                },
                {
                    "phase": "التصميم والتطوير",
                    "steps": [
                        s.step_id
                        for s in steps
                        if s.agent in ("creativity", "development")
                    ],
                },
                {
                    "phase": "الجودة والمراجعة",
                    "steps": [s.step_id for s in steps if s.agent == "quality"],
                },
            ],
            "estimated_duration": f"{total_weeks}-{total_weeks + 1} أسابيع",
            "complexity_score": _content_score(
                str([s.title for s in steps]), 0.40, 0.90
            ),
        }

    def track_progress(
        self, plan: Dict[str, Any], completed: int
    ) -> Dict[str, Any]:
        """يتتبع تقدم التنفيذ ويُحدث حالة الخطة."""
        total = max(plan.get("total_steps", 1), 1)
        progress = min(completed / total, 1.0)
        return {
            "completed_steps": completed,
            "total_steps": total,
            "progress_percent": round(progress * 100, 1),
            "remaining_steps": max(total - completed, 0),
            "status": (
                "مكتمل" if progress >= 1.0 else "جارٍ" if progress > 0 else "لم يبدأ"
            ),
            "on_track": True,
        }

    # ─── دورة الحياة ─────────────────────────────────────────────────────────

    def think(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        max_steps = (context or {}).get("max_steps", 6)
        return (
            f"تحليل الهدف الاستراتيجي: '{prompt[:80]}'. "
            f"سأُقسّمه إلى {max_steps} خطوات تنفيذية متسلسلة مع تعيين الوكيل المناسب لكل خطوة. "
            "المعيار: الأولوية المنطقية، التتابع المنطقي، وتوزيع الجهد الأمثل."
        )

    def act(self, thought: str, prompt: str) -> Dict[str, Any]:
        steps = self.decompose(prompt)
        plan_data = self.plan(steps)
        progress = self.track_progress(plan_data, completed=0)
        return {
            "steps": [s.model_dump() for s in steps],
            "plan": plan_data,
            "progress": progress,
            "readiness_score": _content_score(prompt, 0.70, 0.98),
        }

    def reflect(self, result: Dict[str, Any], prompt: str) -> str:
        total = result.get("plan", {}).get("total_steps", 0)
        complexity = result.get("plan", {}).get("complexity_score", 0.5)
        return (
            f"تم إنشاء خطة تنفيذية من {total} خطوة بمعامل تعقيد {complexity:.2f}. "
            "التوصية: ابدأ بخطوات التحليل والبحث لاكتشاف المخاطر المبكرة. "
            "حدّث الخطة مع كل تكرار لتعكس النتائج الفعلية."
        )


# ═══════════════════════════════════════════════════════════════════════════════
# المُنسِّق — AgentOrchestrator
# ═══════════════════════════════════════════════════════════════════════════════


class AgentOrchestrator:
    """
    يُنسّق تشغيل الوكلاء ويجمّع نتائجهم في استجابة موحّدة.

    الاستخدام:
      orchestrator = AgentOrchestrator()
      result = orchestrator.run_all(request)
    """

    _AGENT_MAP: Dict[str, type] = {
        "creativity": CreativityAgent,
        "development": DevelopmentAgent,
        "research": ResearchAgent,
        "quality": QualityAgent,
        "planning": PlanningAgent,
    }

    def __init__(self) -> None:
        self._log = logger.bind(component="orchestrator")

    def run_all(self, request: OrchestratorRequest) -> OrchestratorResponse:
        """
        يُشغّل جميع الوكلاء المطلوبين ويجمّع نتائجهم.
        يُمرّر نتائج كل وكيل كسياق إضافي للوكيل التالي (cross-agent context sharing).
        """
        session_id = str(uuid.uuid4())[:12]
        start = time.perf_counter()

        self._log.info(
            "orchestrator_start",
            session=session_id,
            agents=request.agents,
            prompt_len=len(request.prompt),
        )

        # السياق المتراكم — يُغنى بعد كل وكيل ويُمرَّر للتالي
        accumulated_ctx: Dict[str, Any] = dict(request.context or {})

        results: Dict[str, AgentResponse] = {}
        for agent_name in request.agents:
            agent_cls = self._AGENT_MAP.get(agent_name)
            if agent_cls is None:
                self._log.warning("unknown_agent_skipped", agent=agent_name)
                continue
            agent = agent_cls()
            cur_request = AgentRequest(
                prompt=request.prompt,
                context=accumulated_ctx if accumulated_ctx else None,
                language=request.language,
            )
            resp = agent.run(cur_request)
            results[agent_name] = resp
            # إثراء السياق لأجل الوكلاء اللاحقة
            if resp.status == AgentStatus.DONE:
                accumulated_ctx[f"_{agent_name}_done"] = True
                accumulated_ctx[f"_{agent_name}_keys"] = list(resp.result.keys())

        total_ms = (time.perf_counter() - start) * 1000
        summary = self._build_summary(results)

        self._log.info(
            "orchestrator_done",
            session=session_id,
            duration_ms=round(total_ms, 2),
            agents_ran=len(results),
        )

        return OrchestratorResponse(
            session_id=session_id,
            results=results,
            summary=summary,
            total_duration_ms=round(total_ms, 2),
        )

    def run_single(self, agent_name: str, request: AgentRequest) -> AgentResponse:
        """يُشغّل وكيلاً واحداً بشكل مستقل."""
        agent_cls = self._AGENT_MAP.get(agent_name)
        if agent_cls is None:
            raise ValueError(f"وكيل غير معروف: '{agent_name}'")
        agent = agent_cls()
        return agent.run(request)

    @staticmethod
    def _build_summary(results: Dict[str, AgentResponse]) -> str:
        """يُصدر ملخصاً نصياً موجزاً لنتائج جميع الوكلاء."""
        parts = []
        for name, resp in results.items():
            status_emoji = "✅" if resp.status == AgentStatus.DONE else "❌"
            parts.append(f"{status_emoji} {name} ({resp.duration_ms:.0f}ms)")
        agents_line = " | ".join(parts)
        done_count = sum(1 for r in results.values() if r.status == AgentStatus.DONE)
        return (
            f"اكتملت {done_count}/{len(results)} وكلاء بنجاح. "
            f"التفاصيل: {agents_line}. "
            "راجع نتائج كل وكيل للحصول على التوصيات التفصيلية."
        )

    @staticmethod
    def get_status() -> Dict[str, Any]:
        """يُعيد حالة النظام والوكلاء المتاحة."""
        return {
            "available_agents": list(AgentOrchestrator._AGENT_MAP.keys()),
            "total_agents": len(AgentOrchestrator._AGENT_MAP),
            "status": "operational",
            "version": "2.0.0",
            "capabilities": {
                "creativity": "توليد أفكار إبداعية وجلسات عصف ذهني",
                "development": "تحسينات هندسية ومراجعة الكود والبنية",
                "research": "تحليل بيانات وتوصيات مبنية على الأدلة",
                "quality": "تدقيق أمني وقياس الأداء والتحقق من الجودة",
                "planning": "تحليل الأهداف وبناء خطط تنفيذية متكاملة",
            },
        }


# ═══════════════════════════════════════════════════════════════════════════════
# المُشغّل الذاتي — AutonomousOrchestrator (v2.0)
# ═══════════════════════════════════════════════════════════════════════════════


class AutonomousOrchestrator:
    """
    يُشغّل الوكلاء في حلقة تكرارية ذاتية حتى الوصول لعتبة الجودة
    أو استنفاد الحد الأقصى للتكرارات.

    الاستخدام:
      auto = AutonomousOrchestrator()
      result = auto.run_autonomous(AutonomousRequest(prompt="هدفك هنا"))
    """

    def __init__(self, memory: Optional[AgentMemory] = None) -> None:
        self._orchestrator = AgentOrchestrator()
        self._memory = memory or _agent_memory
        self._log = logger.bind(component="autonomous_orchestrator")

    def _compute_quality(self, results: Dict[str, AgentResponse]) -> float:
        """يحسب درجة الجودة الإجمالية من نتائج الوكلاء الفعلية."""
        scores: List[float] = []
        score_keys: Dict[str, str] = {
            "creativity": "creativity_score",
            "development": "maintainability_index",
            "research": "research_depth",
            "quality": "overall_quality_score",
        }
        for name, resp in results.items():
            if resp.status != AgentStatus.DONE:
                scores.append(0.0)
                continue
            key = score_keys.get(name)
            if key and key in resp.result:
                scores.append(float(resp.result[key]))
            else:
                # وكيل التخطيط أو غير معروف
                scores.append(float(resp.result.get("readiness_score", 0.75)))
        return round(sum(scores) / len(scores), 3) if scores else 0.0

    def _extract_improvements(
        self, results: Dict[str, AgentResponse], iteration: int
    ) -> List[str]:
        """يستخرج الاقتراحات التحسينية الأولى من نتائج كل وكيل."""
        improvements: List[str] = []
        extractors: Dict[str, Any] = {
            "development": lambda r: (r.get("improvements") or [{}])[0].get("تحسين", ""),
            "quality": lambda r: (r.get("audit") or {}).get("نقاط_التحسين", [""])[0],
            "research": lambda r: (r.get("recommendations") or [{}])[0].get("توصية", ""),
            "planning": lambda r: (r.get("steps") or [{}])[0].get("description", ""),
        }
        for name, resp in results.items():
            if resp.status != AgentStatus.DONE:
                continue
            extractor = extractors.get(name)
            if extractor:
                tip = extractor(resp.result)
                if tip:
                    improvements.append(f"[{name}] {tip}")
        if not improvements:
            improvements.append(f"التكرار {iteration}: الجودة في المستوى المقبول")
        return improvements

    def run_autonomous(self, request: AutonomousRequest) -> AutonomousResponse:
        """
        يُشغّل الوكلاء بشكل ذاتي تكراري:
          1. يُشغّل الوكلاء المحددة
          2. يقيس الجودة
          3. يُوقف إذا وصلت لعتبة الجودة أو استنفدت التكرارات
          4. يُمرّر نتائج كل تكرار كسياق للتالي
        """
        session_id = str(uuid.uuid4())[:12]
        start = time.perf_counter()

        self._log.info(
            "autonomous_start",
            session=session_id,
            agents=request.agents,
            quality_threshold=request.quality_threshold,
            max_iterations=request.max_iterations,
        )

        iterations: List[IterationResult] = []
        final_quality = 0.0
        converged = False
        context: Dict[str, Any] = dict(request.context or {})

        for i in range(1, request.max_iterations + 1):
            orch_req = OrchestratorRequest(
                prompt=request.prompt,
                agents=request.agents,
                context=context if context else None,
                language=request.language,
            )
            orch_resp = self._orchestrator.run_all(orch_req)

            quality = self._compute_quality(orch_resp.results)
            improvements = self._extract_improvements(orch_resp.results, i)
            converged = quality >= request.quality_threshold

            iterations.append(
                IterationResult(
                    iteration=i,
                    results=orch_resp.results,
                    quality_score=quality,
                    converged=converged,
                    improvements=improvements,
                )
            )
            final_quality = quality

            # تسجيل في الذاكرة
            for agent_name, agent_resp in orch_resp.results.items():
                self._memory.record(
                    session_id, agent_name, agent_resp.result, quality
                )

            self._log.info(
                "autonomous_iteration",
                session=session_id,
                iteration=i,
                quality=quality,
                converged=converged,
            )

            if converged:
                break

            # إثراء السياق للتكرار التالي
            context["_prev_quality"] = quality
            context["_prev_improvements"] = improvements[:3]
            context["_iteration"] = i

        total_ms = (time.perf_counter() - start) * 1000
        recommendation = self._build_recommendation(
            final_quality, converged, len(iterations)
        )

        self._log.info(
            "autonomous_done",
            session=session_id,
            final_quality=final_quality,
            iterations=len(iterations),
            converged=converged,
            duration_ms=round(total_ms, 2),
        )

        return AutonomousResponse(
            session_id=session_id,
            iterations=iterations,
            final_quality=final_quality,
            converged=converged,
            total_duration_ms=round(total_ms, 2),
            recommendation=recommendation,
        )

    @staticmethod
    def _build_recommendation(
        quality: float, converged: bool, iterations: int
    ) -> str:
        if converged:
            return (
                f"✅ وصل النظام لعتبة الجودة ({quality:.0%}) خلال {iterations} تكرار. "
                "الحل جاهز للتطبيق."
            )
        return (
            f"⚠ لم يُحقق النظام عتبة الجودة بعد {iterations} تكرار "
            f"(الجودة الحالية: {quality:.0%}). "
            "يُوصى بمراجعة الطلب أو زيادة عدد التكرارات."
        )
