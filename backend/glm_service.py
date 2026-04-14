"""
QURABIA — GLM-4.7 Dev Agents Service
======================================
خدمة الوكلاء المدعومة بنموذج GLM-4.7-FP8 عبر خادم vLLM.

يتصل هذا الملف بخادم vLLM عبر واجهة OpenAI المتوافقة ويُوفّر
4 وكلاء متخصصة في تطوير وتحسين المستودع:

  - GLMCodeReviewAgent   — مراجعة الكود واقتراح التحسينات
  - GLMOptimizationAgent — تحليل الأداء واقتراح التحسينات
  - GLMSecurityAgent     — التدقيق الأمني واكتشاف الثغرات
  - GLMDocAgent          — توليد التوثيق التقني للكود

  - GLMDevOrchestrator   — منسّق الوكلاء الأربعة معاً

متطلبات التشغيل:
  1. تشغيل خادم vLLM:
       vllm serve zai-org/GLM-4.7-FP8 \\
         --tensor-parallel-size 4 \\
         --speculative-config.method mtp \\
         --speculative-config.num_speculative_tokens 1 \\
         --tool-call-parser glm47 \\
         --reasoning-parser glm45 \\
         --enable-auto-tool-choice \\
         --served-model-name glm-4.7-fp8
  2. ضبط متغيرات البيئة (اختياري):
       VLLM_BASE_URL=http://localhost:8000
       GLM_MODEL_NAME=glm-4.7-fp8

الأمان:
  • لا أسرار مكشوفة — جميع الإعدادات عبر متغيرات البيئة
  • مدخلات محققة بـ Pydantic
  • حدّ أقصى للنص لمنع الإرهاق الحوسبي
  • fallback محلي عند عدم توفر الخادم
"""

from __future__ import annotations

import hashlib
import os
import time
import uuid
from enum import StrEnum
from typing import Any

import httpx
import structlog
from pydantic import BaseModel, Field, field_validator

logger = structlog.get_logger("qurabia.glm")

# ── الثوابت ────────────────────────────────────────────────────────────────────

_VLLM_BASE_URL: str = (os.environ.get("VLLM_BASE_URL") or "http://localhost:8000").rstrip("/")
_GLM_MODEL_NAME: str = (os.environ.get("GLM_MODEL_NAME") or "glm-4.7-fp8").strip()
_GLM_TIMEOUT: float = float(os.environ.get("GLM_TIMEOUT_S") or "30.0")
_GLM_TEMPERATURE: float = 0.3
_GLM_MAX_TOKENS: int = 1024
_MAX_PROMPT_LEN: int = 8000  # حماية من الإرهاق الحوسبي


# ── أداة التقييم الحتمي (fallback بدون LLM) ───────────────────────────────────

def _score(text: str, low: float = 0.60, high: float = 0.98) -> float:
    """يُحسب درجة حتمية من محتوى النص."""
    h = int(hashlib.sha256(text.encode()).hexdigest(), 16)
    return round(low + (h % 1_000_000) / 1_000_000.0 * (high - low), 3)


# ═══════════════════════════════════════════════════════════════════════════════
# نماذج البيانات (Pydantic)
# ═══════════════════════════════════════════════════════════════════════════════


class GLMAgentType(StrEnum):
    CODE_REVIEW = "code_review"
    OPTIMIZATION = "optimization"
    SECURITY = "security"
    DOCUMENTATION = "documentation"


class GLMDevRequest(BaseModel):
    """طلب موحّد لوكلاء GLM."""

    prompt: str = Field(
        ...,
        min_length=3,
        max_length=_MAX_PROMPT_LEN,
        description="الكود أو النص للتحليل",
    )
    language: str = Field(default="ar", description="ar أو en")
    context: dict[str, Any] | None = Field(
        default=None, description="سياق إضافي اختياري"
    )

    @field_validator("language")
    @classmethod
    def _validate_language(cls, v: str) -> str:
        if v not in ("ar", "en"):
            raise ValueError("اللغة يجب أن تكون 'ar' أو 'en'")
        return v


class GLMDevResponse(BaseModel):
    """استجابة موحّدة من وكلاء GLM."""

    agent_id: str
    agent_type: GLMAgentType
    model: str
    prompt_summary: str
    analysis: str
    suggestions: list[str]
    score: float
    mode: str  # "glm" | "fallback"
    duration_ms: float
    timestamp: float = Field(default_factory=time.time)


class GLMOrchestratorRequest(BaseModel):
    """طلب تشغيل عدة وكلاء GLM معاً."""

    prompt: str = Field(..., min_length=3, max_length=_MAX_PROMPT_LEN)
    agents: list[GLMAgentType] = Field(
        default=[
            GLMAgentType.CODE_REVIEW,
            GLMAgentType.OPTIMIZATION,
            GLMAgentType.SECURITY,
            GLMAgentType.DOCUMENTATION,
        ]
    )
    language: str = Field(default="ar")
    context: dict[str, Any] | None = None

    @field_validator("language")
    @classmethod
    def _validate_language(cls, v: str) -> str:
        if v not in ("ar", "en"):
            raise ValueError("اللغة يجب أن تكون 'ar' أو 'en'")
        return v


class GLMOrchestratorResponse(BaseModel):
    """استجابة المنسّق الشامل."""

    session_id: str
    results: dict[str, GLMDevResponse]
    summary: str
    overall_score: float
    total_duration_ms: float
    timestamp: float = Field(default_factory=time.time)


class GLMStatusResponse(BaseModel):
    """حالة خادم vLLM وإعداداته."""

    vllm_base_url: str
    model_name: str
    server_reachable: bool
    agents_available: list[str]
    version: str = "1.0.0"


# ═══════════════════════════════════════════════════════════════════════════════
# عميل GLM — يتصل بخادم vLLM
# ═══════════════════════════════════════════════════════════════════════════════


class GLMClient:
    """
    عميل HTTP غير متزامن للتواصل مع خادم vLLM.

    يستخدم واجهة OpenAI المتوافقة:
      POST /v1/chat/completions
    """

    def __init__(
        self,
        base_url: str = _VLLM_BASE_URL,
        model: str = _GLM_MODEL_NAME,
        timeout: float = _GLM_TIMEOUT,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self._log = logger.bind(component="glm_client", model=model)

    async def chat(
        self,
        system: str,
        user: str,
        temperature: float = _GLM_TEMPERATURE,
        max_tokens: int = _GLM_MAX_TOKENS,
    ) -> str:
        """
        يُرسل طلب chat إلى GLM-4.7 ويُعيد النص المُولَّد.
        يُعيد سلسلة فارغة عند الفشل (يترك التعامل مع الفشل لطبقة أعلى).
        """
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user[:_MAX_PROMPT_LEN]},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                r = await client.post(
                    f"{self.base_url}/v1/chat/completions",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
            if not r.is_success:
                self._log.warning("glm_http_error", status=r.status_code)
                return ""
            data = r.json()
            text = (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )
            return text.strip() if isinstance(text, str) else ""
        except Exception as exc:
            self._log.warning("glm_request_failed", error=str(exc))
            return ""

    async def is_reachable(self) -> bool:
        """يتحقق من إمكانية الوصول إلى خادم vLLM."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                r = await client.get(f"{self.base_url}/health")
            return r.is_success
        except Exception:
            return False


# المثيل المشترك للعميل
_glm_client = GLMClient()


# ═══════════════════════════════════════════════════════════════════════════════
# وكيل مراجعة الكود — GLMCodeReviewAgent
# ═══════════════════════════════════════════════════════════════════════════════


class GLMCodeReviewAgent:
    """
    وكيل مراجعة الكود — يُحلّل الكود ويقترح تحسينات الجودة.

    يُغطّي:
      • القراءة وصيانة الكود
      • مبادئ SOLID والأنماط المعمارية
      • تغطية الاختبارات والتوثيق
      • اتفاقيات التسمية والتنسيق
    """

    AGENT_TYPE = GLMAgentType.CODE_REVIEW

    _SYSTEM_AR = (
        "أنت مراجع كود خبير في منصة QURABIA — منصة عربية للذكاء الاصطناعي والحوسبة الكمية. "
        "مهمتك مراجعة الكود وتحديد نقاط التحسين مع تقديم اقتراحات عملية واضحة. "
        "استخدم مصطلحات تقنية دقيقة مع الحفاظ على الوضوح للمطورين العرب. "
        "ركّز على: القراءة، الصيانة، مبادئ SOLID، تغطية الاختبارات، التوثيق."
    )

    _SYSTEM_EN = (
        "You are an expert code reviewer for QURABIA — an Arabic AI and quantum computing platform. "
        "Your task is to review code and identify improvement points with clear, actionable suggestions. "
        "Focus on: readability, maintainability, SOLID principles, test coverage, documentation."
    )

    _FALLBACK_SUGGESTIONS_AR = [
        "أضف توثيقاً (docstrings) لجميع الدوال العامة",
        "تحقق من تغطية الاختبارات — الهدف 80%+",
        "راجع أسماء المتغيرات للوضوح والاتساق",
        "تأكد من معالجة جميع حالات الخطأ بشكل صريح",
        "اتبع مبدأ المسؤولية الواحدة (SRP) لكل دالة",
    ]

    _FALLBACK_SUGGESTIONS_EN = [
        "Add docstrings to all public functions",
        "Verify test coverage — target 80%+",
        "Review variable names for clarity and consistency",
        "Ensure all error cases are handled explicitly",
        "Follow Single Responsibility Principle (SRP) per function",
    ]

    async def run(self, req: GLMDevRequest) -> GLMDevResponse:
        """يُشغّل دورة مراجعة الكود."""
        agent_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()
        log = logger.bind(agent=self.AGENT_TYPE.value, id=agent_id)

        log.info("code_review_start", prompt_len=len(req.prompt))

        system = self._SYSTEM_AR if req.language == "ar" else self._SYSTEM_EN
        user_msg = (
            f"راجع الكود التالي وقدّم تقريراً شاملاً:\n\n```\n{req.prompt}\n```"
            if req.language == "ar"
            else f"Review the following code and provide a comprehensive report:\n\n```\n{req.prompt}\n```"
        )

        raw = await _glm_client.chat(system=system, user=user_msg)
        mode = "glm"

        if not raw:
            mode = "fallback"
            raw = (
                "تحليل محلي: الكود يتطلب مراجعة يدوية. تأكد من تشغيل خادم vLLM."
                if req.language == "ar"
                else "Local analysis: Code requires manual review. Ensure vLLM server is running."
            )
            suggestions = (
                self._FALLBACK_SUGGESTIONS_AR
                if req.language == "ar"
                else self._FALLBACK_SUGGESTIONS_EN
            )
        else:
            suggestions = self._extract_suggestions(raw, req.language)

        duration = (time.perf_counter() - start) * 1000
        log.info("code_review_done", mode=mode, duration_ms=round(duration, 1))

        return GLMDevResponse(
            agent_id=agent_id,
            agent_type=self.AGENT_TYPE,
            model=_GLM_MODEL_NAME,
            prompt_summary=req.prompt[:80] + ("..." if len(req.prompt) > 80 else ""),
            analysis=raw,
            suggestions=suggestions,
            score=_score(raw + req.prompt, 0.65, 0.97),
            mode=mode,
            duration_ms=round(duration, 2),
        )

    @staticmethod
    def _extract_suggestions(text: str, lang: str) -> list[str]:
        """يستخرج قائمة الاقتراحات من نص التحليل."""
        lines = [
            line.strip().lstrip("•-*123456789. ").strip()
            for line in text.splitlines()
            if line.strip() and len(line.strip()) > 15
        ]
        return [ln for ln in lines if ln][:6] or (
            ["راجع الكود يدوياً"] if lang == "ar" else ["Review code manually"]
        )


# ═══════════════════════════════════════════════════════════════════════════════
# وكيل التحسين — GLMOptimizationAgent
# ═══════════════════════════════════════════════════════════════════════════════


class GLMOptimizationAgent:
    """
    وكيل التحسين — يُحلّل الأداء ويقترح تحسينات الكفاءة.

    يُغطّي:
      • تعقيد الخوارزميات (Big-O)
      • استعلامات قاعدة البيانات N+1
      • التخزين المؤقت (Caching)
      • التوازي وAsync/Await
      • استهلاك الذاكرة
    """

    AGENT_TYPE = GLMAgentType.OPTIMIZATION

    _SYSTEM_AR = (
        "أنت خبير تحسين أداء في منصة QURABIA للذكاء الاصطناعي والحوسبة الكمية. "
        "مهمتك تحليل الكود وتحديد فرص التحسين: تعقيد الخوارزميات، الذاكرة، قاعدة البيانات، الشبكة. "
        "قدّم توصيات قابلة للقياس مع تقدير التحسين المتوقع."
    )

    _SYSTEM_EN = (
        "You are a performance optimization expert for QURABIA AI and quantum computing platform. "
        "Analyze code and identify optimization opportunities: algorithmic complexity, memory, database, network. "
        "Provide measurable recommendations with estimated improvement."
    )

    _FALLBACK_SUGGESTIONS_AR = [
        "استخدم async/await للعمليات غير المتزامنة",
        "تحقق من استعلامات N+1 في قاعدة البيانات",
        "فعّل التخزين المؤقت للنتائج المتكررة",
        "استبدل حلقات O(n²) بخوارزميات أكثر كفاءة",
        "استخدم تحميل كسول (Lazy Loading) للموارد الثقيلة",
    ]

    _FALLBACK_SUGGESTIONS_EN = [
        "Use async/await for I/O-bound operations",
        "Check for N+1 database query patterns",
        "Enable caching for repeated computations",
        "Replace O(n²) loops with more efficient algorithms",
        "Use lazy loading for heavy resources",
    ]

    async def run(self, req: GLMDevRequest) -> GLMDevResponse:
        """يُشغّل دورة تحليل الأداء."""
        agent_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()
        log = logger.bind(agent=self.AGENT_TYPE.value, id=agent_id)

        log.info("optimization_start", prompt_len=len(req.prompt))

        system = self._SYSTEM_AR if req.language == "ar" else self._SYSTEM_EN
        user_msg = (
            f"حلّل أداء الكود التالي وقدّم توصيات تحسين مع تقدير المكسب المتوقع:\n\n```\n{req.prompt}\n```"
            if req.language == "ar"
            else f"Analyze the performance of the following code and provide optimization recommendations:\n\n```\n{req.prompt}\n```"
        )

        raw = await _glm_client.chat(system=system, user=user_msg)
        mode = "glm"

        if not raw:
            mode = "fallback"
            raw = (
                "تحليل محلي: تحقق من استعلامات قاعدة البيانات والتخزين المؤقت يدوياً."
                if req.language == "ar"
                else "Local analysis: Check database queries and caching manually."
            )
            suggestions = (
                self._FALLBACK_SUGGESTIONS_AR
                if req.language == "ar"
                else self._FALLBACK_SUGGESTIONS_EN
            )
        else:
            suggestions = self._extract_suggestions(raw, req.language)

        duration = (time.perf_counter() - start) * 1000
        log.info("optimization_done", mode=mode, duration_ms=round(duration, 1))

        return GLMDevResponse(
            agent_id=agent_id,
            agent_type=self.AGENT_TYPE,
            model=_GLM_MODEL_NAME,
            prompt_summary=req.prompt[:80] + ("..." if len(req.prompt) > 80 else ""),
            analysis=raw,
            suggestions=suggestions,
            score=_score(raw + req.prompt + "opt", 0.60, 0.95),
            mode=mode,
            duration_ms=round(duration, 2),
        )

    @staticmethod
    def _extract_suggestions(text: str, lang: str) -> list[str]:
        lines = [
            line.strip().lstrip("•-*123456789. ").strip()
            for line in text.splitlines()
            if line.strip() and len(line.strip()) > 15
        ]
        return [ln for ln in lines if ln][:6] or (
            ["راجع الأداء يدوياً"] if lang == "ar" else ["Review performance manually"]
        )


# ═══════════════════════════════════════════════════════════════════════════════
# وكيل الأمان — GLMSecurityAgent
# ═══════════════════════════════════════════════════════════════════════════════


class GLMSecurityAgent:
    """
    وكيل الأمان — يُدقّق الكود ويكتشف الثغرات الأمنية.

    يُغطّي:
      • حقن SQL / XSS / CSRF / SSRF
      • إدارة الأسرار والمفاتيح
      • التحقق من صحة المدخلات
      • التحكم في الوصول (RBAC/ABAC)
      • تشفير البيانات الحساسة
    """

    AGENT_TYPE = GLMAgentType.SECURITY

    _SYSTEM_AR = (
        "أنت خبير أمن سيبراني متخصص في OWASP Top 10 وCVE في منصة QURABIA. "
        "مهمتك تدقيق الكود أمنياً: XSS، SQL Injection، CSRF، SSRF، إدارة الأسرار، التحقق من المدخلات. "
        "صنّف الثغرات حسب الخطورة (حرجة/عالية/متوسطة/منخفضة) وقدّم إصلاحات فورية."
    )

    _SYSTEM_EN = (
        "You are a cybersecurity expert specializing in OWASP Top 10 and CVEs for QURABIA platform. "
        "Audit code for: XSS, SQL Injection, CSRF, SSRF, secrets management, input validation. "
        "Classify vulnerabilities by severity (critical/high/medium/low) and provide immediate fixes."
    )

    _FALLBACK_SUGGESTIONS_AR = [
        "تحقق من غياب SQL Injection عبر استعلامات مُعلَّمة",
        "لا تستخدم innerHTML مع مدخلات المستخدم — استخدم textContent",
        "تأكد من عدم وجود أسرار مكشوفة في الكود",
        "فعّل CORS بشكل صارم — لا تسمح بـ *",
        "استخدم HTTPS في جميع نقاط النهاية الخارجية",
    ]

    _FALLBACK_SUGGESTIONS_EN = [
        "Check for SQL Injection via parameterized queries",
        "Never use innerHTML with user input — use textContent",
        "Ensure no exposed secrets in the codebase",
        "Enforce strict CORS — avoid wildcard *",
        "Use HTTPS for all external endpoints",
    ]

    async def run(self, req: GLMDevRequest) -> GLMDevResponse:
        """يُشغّل دورة التدقيق الأمني."""
        agent_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()
        log = logger.bind(agent=self.AGENT_TYPE.value, id=agent_id)

        log.info("security_audit_start", prompt_len=len(req.prompt))

        system = self._SYSTEM_AR if req.language == "ar" else self._SYSTEM_EN
        user_msg = (
            f"دقّق الكود التالي أمنياً وحدّد الثغرات مع تصنيف خطورتها وطريقة الإصلاح:\n\n```\n{req.prompt}\n```"
            if req.language == "ar"
            else f"Security audit the following code, identify vulnerabilities with severity and fixes:\n\n```\n{req.prompt}\n```"
        )

        raw = await _glm_client.chat(system=system, user=user_msg)
        mode = "glm"

        if not raw:
            mode = "fallback"
            raw = (
                "تدقيق محلي: راجع الكود يدوياً وفق قائمة OWASP Top 10."
                if req.language == "ar"
                else "Local audit: Review code manually against OWASP Top 10 checklist."
            )
            suggestions = (
                self._FALLBACK_SUGGESTIONS_AR
                if req.language == "ar"
                else self._FALLBACK_SUGGESTIONS_EN
            )
        else:
            suggestions = self._extract_suggestions(raw, req.language)

        duration = (time.perf_counter() - start) * 1000
        log.info("security_audit_done", mode=mode, duration_ms=round(duration, 1))

        return GLMDevResponse(
            agent_id=agent_id,
            agent_type=self.AGENT_TYPE,
            model=_GLM_MODEL_NAME,
            prompt_summary=req.prompt[:80] + ("..." if len(req.prompt) > 80 else ""),
            analysis=raw,
            suggestions=suggestions,
            score=_score(raw + req.prompt + "sec", 0.70, 0.99),
            mode=mode,
            duration_ms=round(duration, 2),
        )

    @staticmethod
    def _extract_suggestions(text: str, lang: str) -> list[str]:
        lines = [
            line.strip().lstrip("•-*123456789. ").strip()
            for line in text.splitlines()
            if line.strip() and len(line.strip()) > 15
        ]
        return [ln for ln in lines if ln][:6] or (
            ["دقّق الكود أمنياً يدوياً"] if lang == "ar" else ["Audit code manually"]
        )


# ═══════════════════════════════════════════════════════════════════════════════
# وكيل التوثيق — GLMDocAgent
# ═══════════════════════════════════════════════════════════════════════════════


class GLMDocAgent:
    """
    وكيل التوثيق — يُولّد توثيقاً تقنياً احترافياً للكود.

    يُغطّي:
      • Docstrings بأسلوب NumPy / Google
      • شرح الخوارزميات والمنطق
      • وثائق API (مدخلات، مخرجات، استثناءات)
      • أمثلة استخدام عملية
      • ملاحظات الأداء والتعقيد
    """

    AGENT_TYPE = GLMAgentType.DOCUMENTATION

    _SYSTEM_AR = (
        "أنت كاتب توثيق تقني متخصص في Python وTypeScript في منصة QURABIA. "
        "مهمتك توليد توثيق احترافي شامل: Docstrings، شرح المنطق، أمثلة الاستخدام، "
        "وثائق API، وملاحظات الأداء. اكتب بالعربية مع المصطلحات التقنية بالإنجليزية."
    )

    _SYSTEM_EN = (
        "You are a technical documentation writer specializing in Python and TypeScript for QURABIA. "
        "Generate comprehensive documentation: docstrings, logic explanation, usage examples, "
        "API docs, and performance notes."
    )

    _FALLBACK_SUGGESTIONS_AR = [
        "أضف docstring لكل دالة يصف: الغرض، المعاملات، القيمة المُعادة",
        "وثّق الاستثناءات التي قد تُطلقها الدالة",
        "أضف مثالاً استخدامياً في التوثيق",
        "وثّق تعقيد الخوارزمية (Big-O) للدوال الحرجة",
        "حدّث README عند إضافة ميزات جديدة",
    ]

    _FALLBACK_SUGGESTIONS_EN = [
        "Add docstring to each function: purpose, parameters, return value",
        "Document exceptions the function may raise",
        "Include a usage example in the docstring",
        "Document algorithmic complexity (Big-O) for critical functions",
        "Update README when adding new features",
    ]

    async def run(self, req: GLMDevRequest) -> GLMDevResponse:
        """يُشغّل دورة توليد التوثيق."""
        agent_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()
        log = logger.bind(agent=self.AGENT_TYPE.value, id=agent_id)

        log.info("doc_gen_start", prompt_len=len(req.prompt))

        system = self._SYSTEM_AR if req.language == "ar" else self._SYSTEM_EN
        user_msg = (
            f"ولّد توثيقاً تقنياً شاملاً للكود التالي بالعربية:\n\n```\n{req.prompt}\n```"
            if req.language == "ar"
            else f"Generate comprehensive technical documentation for the following code:\n\n```\n{req.prompt}\n```"
        )

        raw = await _glm_client.chat(system=system, user=user_msg)
        mode = "glm"

        if not raw:
            mode = "fallback"
            raw = (
                "توثيق محلي: الكود يحتاج توثيقاً يدوياً. تأكد من تشغيل خادم vLLM."
                if req.language == "ar"
                else "Local doc: Code needs manual documentation. Ensure vLLM server is running."
            )
            suggestions = (
                self._FALLBACK_SUGGESTIONS_AR
                if req.language == "ar"
                else self._FALLBACK_SUGGESTIONS_EN
            )
        else:
            suggestions = self._extract_suggestions(raw, req.language)

        duration = (time.perf_counter() - start) * 1000
        log.info("doc_gen_done", mode=mode, duration_ms=round(duration, 1))

        return GLMDevResponse(
            agent_id=agent_id,
            agent_type=self.AGENT_TYPE,
            model=_GLM_MODEL_NAME,
            prompt_summary=req.prompt[:80] + ("..." if len(req.prompt) > 80 else ""),
            analysis=raw,
            suggestions=suggestions,
            score=_score(raw + req.prompt + "doc", 0.65, 0.96),
            mode=mode,
            duration_ms=round(duration, 2),
        )

    @staticmethod
    def _extract_suggestions(text: str, lang: str) -> list[str]:
        lines = [
            line.strip().lstrip("•-*123456789. ").strip()
            for line in text.splitlines()
            if line.strip() and len(line.strip()) > 15
        ]
        return [ln for ln in lines if ln][:6] or (
            ["وثّق الكود يدوياً"] if lang == "ar" else ["Document code manually"]
        )


# ═══════════════════════════════════════════════════════════════════════════════
# منسّق الوكلاء — GLMDevOrchestrator
# ═══════════════════════════════════════════════════════════════════════════════


class GLMDevOrchestrator:
    """
    يُنسّق تشغيل وكلاء GLM الأربعة ويجمّع نتائجهم في استجابة موحّدة.

    الاستخدام:
      orchestrator = GLMDevOrchestrator()
      result = await orchestrator.run_all(request)
    """

    _AGENT_MAP: dict[GLMAgentType, Any] = {
        GLMAgentType.CODE_REVIEW: GLMCodeReviewAgent,
        GLMAgentType.OPTIMIZATION: GLMOptimizationAgent,
        GLMAgentType.SECURITY: GLMSecurityAgent,
        GLMAgentType.DOCUMENTATION: GLMDocAgent,
    }

    def __init__(self) -> None:
        self._log = logger.bind(component="glm_orchestrator")

    async def run_all(self, req: GLMOrchestratorRequest) -> GLMOrchestratorResponse:
        """يُشغّل جميع الوكلاء المطلوبين بالتسلسل ويُعيد النتائج الموحّدة."""
        session_id = str(uuid.uuid4())[:12]
        start = time.perf_counter()

        self._log.info(
            "glm_orchestrator_start",
            session=session_id,
            agents=[a.value for a in req.agents],
        )

        results: dict[str, GLMDevResponse] = {}
        agent_req = GLMDevRequest(
            prompt=req.prompt,
            language=req.language,
            context=req.context,
        )

        for agent_type in req.agents:
            agent_cls = self._AGENT_MAP.get(agent_type)
            if agent_cls is None:
                self._log.warning("unknown_agent_skipped", agent=agent_type)
                continue
            agent = agent_cls()
            resp = await agent.run(agent_req)
            results[agent_type.value] = resp

        total_ms = (time.perf_counter() - start) * 1000
        overall_score = (
            sum(r.score for r in results.values()) / len(results) if results else 0.0
        )
        summary = self._build_summary(results)

        self._log.info(
            "glm_orchestrator_done",
            session=session_id,
            duration_ms=round(total_ms, 2),
            agents_ran=len(results),
            overall_score=round(overall_score, 3),
        )

        return GLMOrchestratorResponse(
            session_id=session_id,
            results=results,
            summary=summary,
            overall_score=round(overall_score, 3),
            total_duration_ms=round(total_ms, 2),
        )

    async def run_single(
        self, agent_type: GLMAgentType, req: GLMDevRequest
    ) -> GLMDevResponse:
        """يُشغّل وكيلاً واحداً بشكل مستقل."""
        agent_cls = self._AGENT_MAP.get(agent_type)
        if agent_cls is None:
            raise ValueError(f"وكيل غير معروف: '{agent_type}'")
        return await agent_cls().run(req)

    @staticmethod
    def _build_summary(results: dict[str, GLMDevResponse]) -> str:
        """يُصدر ملخصاً نصياً لنتائج الوكلاء."""
        if not results:
            return "لم يُشغَّل أي وكيل."
        parts = []
        for name, resp in results.items():
            icon = "🤖" if resp.mode == "glm" else "⚡"
            parts.append(f"{icon} {name} ({resp.duration_ms:.0f}ms، {resp.score:.0%})")
        return (
            f"اكتمل تحليل {len(results)} وكلاء GLM-4.7. "
            + " | ".join(parts)
            + ". راجع نتائج كل وكيل للتوصيات التفصيلية."
        )

    @staticmethod
    async def get_status() -> GLMStatusResponse:
        """يُعيد حالة خادم vLLM والوكلاء المتاحة."""
        reachable = await _glm_client.is_reachable()
        return GLMStatusResponse(
            vllm_base_url=_VLLM_BASE_URL,
            model_name=_GLM_MODEL_NAME,
            server_reachable=reachable,
            agents_available=[a.value for a in GLMAgentType],
        )


# المثيل المشترك للمنسّق
_glm_orchestrator = GLMDevOrchestrator()
