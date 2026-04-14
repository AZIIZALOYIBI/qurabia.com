"""phantom_sandbox.autopsy.forensics — التشريح الجنائي للحاوية الميتة."""

from __future__ import annotations

import asyncio
import re

from phantom_sandbox.core.types import AutopsyReport
from phantom_sandbox.telemetry.tracer import PhantomLogger, PhantomTracer

# ──────────────────────────────────────────────────────────
#  أنماط تصنيف أسباب الوفاة
# ──────────────────────────────────────────────────────────

_CAUSE_PATTERNS: list[tuple[str, re.Pattern, str]] = [
    # (سبب, نمط البحث, تصحيح مقترح)
    (
        "OOM_KILL",
        re.compile(r"(OOMKilled=true|oom.kill|out.of.memory|killed)", re.IGNORECASE),
        "زد حد الذاكرة --memory أو قلّل استهلاك التطبيق للذاكرة",
    ),
    (
        "MISSING_DEPENDENCY",
        re.compile(r"(ImportError|ModuleNotFoundError|Cannot find module|require\(\).*?not found)", re.IGNORECASE),
        "تأكد من تثبيت جميع الاعتماديات في Dockerfile (requirements.txt / package.json)",
    ),
    (
        "PORT_CONFLICT",
        re.compile(r"(address already in use|EADDRINUSE|port.*already)", re.IGNORECASE),
        "تحقق من أن التطبيق يستمع على المنفذ الصحيح وأنه لا يعارض منفذاً آخر",
    ),
    (
        "PERMISSION_ERROR",
        re.compile(r"(PermissionError|Permission denied|EACCES|cannot open.*permission)", re.IGNORECASE),
        "تحقق من صلاحيات الملفات والمستخدم داخل الحاوية",
    ),
    (
        "SYNTAX_ERROR",
        re.compile(r"(SyntaxError|IndentationError|ParseError|SyntaxException)", re.IGNORECASE),
        "أصلح الأخطاء النحوية في الكود قبل إعادة البناء",
    ),
    (
        "CONFIG_ERROR",
        re.compile(r"(KeyError|EnvVar.*not set|missing.*config|MISSING_ENV|getenv.*None)", re.IGNORECASE),
        "تأكد من ضبط جميع متغيرات البيئة المطلوبة",
    ),
    (
        "CONNECTION_ERROR",
        re.compile(r"(ConnectionRefused|ECONNREFUSED|connect.*database.*failed|cannot connect)", re.IGNORECASE),
        "تحقق من إعدادات قاعدة البيانات والخدمات الخارجية",
    ),
    (
        "BUILD_FAILURE",
        re.compile(r"(build failed|compilation error|ERROR.*build|cmake.*error)", re.IGNORECASE),
        "راجع أخطاء البناء في سجل Docker build",
    ),
]

_FALLBACK_CORRECTION = "راجع سجلات الحاوية الكاملة وابحث عن أول رسالة خطأ"


class PhantomAutopsy:
    """
    التشريح الجنائي — يُحدّد سبب وفاة الحاوية ويقترح العلاج.

    المنهجية:
      1. جمع حالة الحاوية وسجلاتها
      2. مطابقة الأنماط لتحديد الأسباب
      3. توليد قائمة تصحيحات مُرتّبة بالأولوية
    """

    def __init__(
        self,
        container_name: str,
        tracer:         PhantomTracer | None = None,
    ) -> None:
        self._container = container_name
        self._tracer    = tracer or PhantomTracer()
        self._log       = PhantomLogger("autopsy")

    async def perform(self, death_context: str = "") -> AutopsyReport:
        """يُجري التشريح الكامل ويُعيد التقرير."""
        with self._tracer.span("phantom_autopsy", layer="autopsy") as span:
            self._log.section("LAYER 7b: Phantom Autopsy")
            self._log.info(f"Death context: {death_context}")

            report = AutopsyReport()

            # جمع الأدلة
            report.container_state  = await self._get_container_state()
            report.application_logs = await self._get_logs()
            report.system_logs      = await self._get_system_logs()

            # تحديد الأسباب
            causes, corrections = self._determine_cause(report)
            report.death_causes   = causes
            report.ai_corrections = corrections

            # توليد Prompt جراحي
            report.surgical_prompt = self._build_surgical_prompt(
                death_context, causes, corrections, report.application_logs
            )

            if causes:
                self._log.error(f"Death causes: {', '.join(causes)}")
            else:
                self._log.warning("Death cause unknown — check logs manually")

            span.set_ok(causes=len(causes), corrections=len(corrections))
            return report

    # ─────────────────────────────────────────────────────────
    #  تحديد السبب  (مُكشوف للاختبار)
    # ─────────────────────────────────────────────────────────

    def _determine_cause(
        self, report: AutopsyReport
    ) -> tuple[list[str], list[str]]:
        """
        يُحدّد أسباب الوفاة ويُعيد (أسباب, تصحيحات).
        مُكشوف (non-private) لتسهيل الاختبار.
        """
        causes:      list[str] = []
        corrections: list[str] = []

        state = report.container_state
        logs  = (report.application_logs + "\n" + report.system_logs).strip()

        # ── OOM check أولاً من state ──
        if state.get("oom_killed") is True:
            causes.append("OOM_KILL")
            corrections.append("زد حد الذاكرة --memory أو قلّل استهلاك التطبيق للذاكرة")

        # ── مطابقة الأنماط على السجلات ──
        for cause_name, pattern, fix in _CAUSE_PATTERNS:
            if cause_name == "OOM_KILL":
                continue  # تمت معالجته أعلاه
            if pattern.search(logs):
                causes.append(cause_name)
                corrections.append(fix)

        # ── مطابقة إضافية على raw state ──
        raw_state = str(state.get("raw", ""))
        for cause_name, pattern, fix in _CAUSE_PATTERNS:
            if cause_name not in causes and pattern.search(raw_state):
                causes.append(cause_name)
                corrections.append(fix)

        # ── تصحيح افتراضي إذا لم يُكتشف شيء ──
        if not corrections:
            corrections.append(_FALLBACK_CORRECTION)

        return causes, corrections

    # ─────────────────────────────────────────────────────────
    #  جمع الأدلة
    # ─────────────────────────────────────────────────────────

    async def _get_container_state(self) -> dict:
        """يقرأ حالة الحاوية من Docker inspect."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "inspect", "--format",
                "{{.State.Status}} | ExitCode={{.State.ExitCode}} | "
                "OOMKilled={{.State.OOMKilled}} | Error={{.State.Error}}",
                self._container,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
            raw = stdout.decode(errors="replace").strip()

            oom_killed = "OOMKilled=true" in raw or "OOMKilled=True" in raw
            exit_code_m = __import__("re").search(r"ExitCode=(\d+)", raw)
            exit_code   = int(exit_code_m.group(1)) if exit_code_m else -1

            return {
                "raw":        raw,
                "oom_killed": oom_killed,
                "exit_code":  exit_code,
            }
        except Exception as exc:
            return {"error": str(exc), "oom_killed": False}

    async def _get_logs(self, lines: int = 150) -> str:
        """يقرأ سجلات التطبيق."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "logs", "--tail", str(lines), self._container,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
            return stdout.decode(errors="replace")[-6000:]
        except Exception:
            return ""

    async def _get_system_logs(self) -> str:
        """يقرأ سجلات النظام للحاوية (dmesg إن أمكن)."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "exec", self._container,
                "dmesg", "--level=err,warn",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
            return stdout.decode(errors="replace")[-2000:]
        except Exception:
            return ""

    # ─────────────────────────────────────────────────────────
    #  Prompt جراحي
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def _build_surgical_prompt(
        context:     str,
        causes:      list[str],
        corrections: list[str],
        logs:        str,
    ) -> str:
        causes_str      = "\n".join(f"  - {c}" for c in causes) or "  - UNKNOWN"
        corrections_str = "\n".join(f"  {i+1}. {c}" for i, c in enumerate(corrections))
        log_snippet     = logs[-1500:] if logs else "(no logs)"

        return f"""
╔══════════════════════════════════════════════════════════════╗
║              🔬 PHANTOM AUTOPSY — SURGICAL PROMPT            ║
╚══════════════════════════════════════════════════════════════╝

DEATH CONTEXT:
{context}

IDENTIFIED CAUSES:
{causes_str}

RECOMMENDED CORRECTIONS:
{corrections_str}

LATEST LOG SNIPPET:
```
{log_snippet}
```

INSTRUCTION FOR AI AGENT:
أنت مساعد مطوّر ذكي. بناءً على تحليل وفاة الحاوية أعلاه،
قم بتعديل الكود لإصلاح المشاكل المُحددة. ركّز على:
1. الأسباب المُكتشفة أعلاه بالترتيب
2. السجلات للعثور على التفاصيل الدقيقة
3. اختبار التعديلات قبل إعادة المحاكاة
""".strip()
