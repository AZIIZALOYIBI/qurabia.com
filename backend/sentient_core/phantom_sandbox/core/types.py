"""
phantom_sandbox.core.types
══════════════════════════
أنواع البيانات الأساسية للمحاكاة الشبحية.
جميع الأنواع غير قابلة للتعديل حيثما أمكن (frozen dataclasses / enums).
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import IntEnum, StrEnum
from uuid import UUID, uuid4

# ─────────────────────────────────────────────────────────────
#  Enums  (ثوابت مُرمَّزة)
# ─────────────────────────────────────────────────────────────

class Language(StrEnum):
    PYTHON  = "python"
    NODE    = "node"
    GO      = "go"
    RUST    = "rust"
    RUBY    = "ruby"
    JAVA    = "java"
    DOCKER  = "docker"
    UNKNOWN = "unknown"


class Framework(StrEnum):
    FASTAPI = "fastapi"
    FLASK   = "flask"
    DJANGO  = "django"
    EXPRESS = "express"
    NEXTJS  = "nextjs"
    RAILS   = "rails"
    SPRING  = "spring"
    UNKNOWN = "unknown"


class ContainerStatus(StrEnum):
    ALIVE      = "alive"
    STILLBORN  = "stillborn"   # فشل البناء
    COMATOSE   = "comatose"    # بدأ لكن لا يستجيب
    TERMINATED = "terminated"  # أُنهي بشكل صريح


class Verdict(StrEnum):
    CLEAN = "clean"
    WARN  = "warn"
    BLOCK = "block"


class ProbeStrain(StrEnum):
    PATIENT    = "patient"
    SNEAKY     = "sneaky"
    AGGRESSIVE = "aggressive"
    CHAOTIC    = "chaotic"


class AlertSeverity(IntEnum):
    """خطورة قابلة للمقارنة — CRITICAL > HIGH > MEDIUM > LOW > INFO."""
    INFO     = 0
    LOW      = 1
    MEDIUM   = 2
    HIGH     = 3
    CRITICAL = 4


class AlertAction(StrEnum):
    NOTE  = "note"
    WARN  = "warn"
    BLOCK = "block"


# ─────────────────────────────────────────────────────────────
#  ProjectDNA  (الحمض النووي للمشروع — ثابت غير قابل للتعديل)
# ─────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class ProjectDNA:
    """وصف ثابت للمشروع — يُكتشف مرة واحدة ولا يتغير."""

    language:          Language          = Language.UNKNOWN
    framework:         Framework | None  = None
    entry_point:       str               = ""
    install_cmd:       str               = "pip install -r requirements.txt"
    build_cmd:         str | None        = None
    run_cmd:           str               = ""
    health_endpoint:   str               = "/health"
    port:              int               = 8000
    needs_db:          bool              = False
    needs_redis:       bool              = False
    dockerfile_exists: bool              = False

    def is_web_app(self) -> bool:
        """يكشف إذا كان التطبيق خادم ويب."""
        keywords = [
            "uvicorn", "gunicorn", "flask", "hypercorn", "waitress",
            "node", "next", "express", "rails", "spring", "sinatra",
        ]
        return any(kw in self.run_cmd.lower() for kw in keywords)


# placeholder للتوافقية مع الكود القديم
@dataclass
class ContainerSpec:
    name:   str = ""
    image:  str = ""
    port:   int = 8000
    memory: str = "512m"
    cpus:   str = "1.0"


# ─────────────────────────────────────────────────────────────
#  BirthReport  (تقرير الولادة)
# ─────────────────────────────────────────────────────────────

@dataclass
class BirthReport:
    status:         ContainerStatus        = ContainerStatus.STILLBORN
    dna:            ProjectDNA | None      = None
    host_port:      int | None             = None
    container_id:   str | None             = None
    build_time_s:   float                  = 0.0
    startup_time_s: float                  = 0.0
    build_log:      str                    = ""
    startup_log:    str                    = ""
    errors:         list[str]              = field(default_factory=list)

    @property
    def is_alive(self) -> bool:
        return self.status == ContainerStatus.ALIVE

    @property
    def base_url(self) -> str | None:
        if self.host_port:
            return f"http://localhost:{self.host_port}"
        return None


# ─────────────────────────────────────────────────────────────
#  ProbeResult / ProbeReport
# ─────────────────────────────────────────────────────────────

@dataclass
class ProbeResult:
    probe_name:       str              = ""
    strain:           ProbeStrain      = ProbeStrain.PATIENT
    target_url:       str              = ""
    method:           str              = "GET"
    status_code:      int | None       = None
    response_time_ms: float            = 0.0
    response_body:    str              = ""
    is_healthy:       bool             = True
    anomaly_detected: bool             = False
    anomaly_detail:   str              = ""


@dataclass
class ProbeReport:
    results:           list[ProbeResult] = field(default_factory=list)
    total_probes:      int               = 0
    successful:        int               = 0
    failed:            int               = 0
    anomalies:         int               = 0
    security_alerts:   int               = 0
    performance_issues: int              = 0
    anomaly_details:   list[dict]        = field(default_factory=list)

    @property
    def health_ratio(self) -> float:
        if self.total_probes == 0:
            return 1.0
        return self.successful / self.total_probes


# ─────────────────────────────────────────────────────────────
#  MemoryReading / MemoryReport
# ─────────────────────────────────────────────────────────────

@dataclass
class MemoryReading:
    timestamp_s: float = 0.0
    used_mb:     float = 0.0
    pct:         float = 0.0
    pids:        int   = 0


@dataclass
class MemoryReport:
    leak_detected:   bool              = False
    growth_mb:       float             = 0.0
    slope_mb_per_s:  float             = 0.0
    severity:        AlertSeverity     = AlertSeverity.INFO
    analysis_detail: str               = ""
    readings:        list[MemoryReading] = field(default_factory=list)
    baseline_mb:     float             = 0.0
    peak_mb:         float             = 0.0


# ─────────────────────────────────────────────────────────────
#  StressReport
# ─────────────────────────────────────────────────────────────

@dataclass
class StressReport:
    endpoint:         str        = "/"
    duration_s:       int        = 0
    concurrency:      int        = 0
    total_requests:   int        = 0
    successful:       int        = 0
    failed:           int        = 0
    crash_detected:   bool       = False
    avg_response_ms:  float      = 0.0
    max_response_ms:  float      = 0.0
    p95_response_ms:  float      = 0.0
    p99_response_ms:  float      = 0.0
    error_samples:    list[str]  = field(default_factory=list)

    @property
    def error_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.failed / self.total_requests


# ─────────────────────────────────────────────────────────────
#  ChaosExperiment / ChaosReport
# ─────────────────────────────────────────────────────────────

@dataclass
class ChaosExperiment:
    name:              str   = ""
    description:       str   = ""
    severity:          str   = "low"
    category:          str   = "generic"
    executed:          bool  = False
    result:            str   = ""   # "resilient" | "degraded" | "crashed"
    recovery_time_ms:  float = 0.0
    detail:            str   = ""
    baseline_ms:       float = 0.0
    chaos_ms:          float = 0.0

    @property
    def degradation_ratio(self) -> float:
        if self.baseline_ms == 0.0:
            return 0.0
        return self.chaos_ms / self.baseline_ms


@dataclass
class ChaosReport:
    total:               int                  = 0
    resilient:           int                  = 0
    degraded:            int                  = 0
    crashed:             int                  = 0
    experiments:         list[ChaosExperiment] = field(default_factory=list)
    critical_weaknesses: list[dict]            = field(default_factory=list)


# ─────────────────────────────────────────────────────────────
#  OracleReport
# ─────────────────────────────────────────────────────────────

@dataclass
class OracleReport:
    total_comparisons: int        = 0
    identical:         int        = 0
    divergent:         int        = 0
    divergences:       list[dict] = field(default_factory=list)
    skipped:           bool       = False
    skip_reason:       str        = ""


# ─────────────────────────────────────────────────────────────
#  ImmuneAlert / ImmuneVerdict
# ─────────────────────────────────────────────────────────────

@dataclass
class ImmuneAlert:
    severity:       AlertSeverity = AlertSeverity.INFO
    category:       str           = ""
    message:        str           = ""
    evidence:       str           = ""
    action:         AlertAction   = AlertAction.NOTE
    fix_suggestion: str           = ""


@dataclass
class ImmuneVerdict:
    verdict:        Verdict          = Verdict.CLEAN
    alerts:         list[ImmuneAlert] = field(default_factory=list)
    critical_count: int               = 0
    high_count:     int               = 0
    medium_count:   int               = 0
    recommendation: str               = ""


# ─────────────────────────────────────────────────────────────
#  AutopsyReport
# ─────────────────────────────────────────────────────────────

@dataclass
class AutopsyReport:
    container_state:  dict       = field(default_factory=dict)
    application_logs: str        = ""
    system_logs:      str        = ""
    death_causes:     list[str]  = field(default_factory=list)
    ai_corrections:   list[str]  = field(default_factory=list)
    surgical_prompt:  str        = ""


# ─────────────────────────────────────────────────────────────
#  PhantomReport  (التقرير الشامل)
# ─────────────────────────────────────────────────────────────

@dataclass
class PhantomReport:
    simulation_id: UUID             = field(default_factory=uuid4)
    branch:        str              = ""
    birth:         BirthReport      = field(default_factory=BirthReport)
    probes:        ProbeReport | None    = None
    memory:        MemoryReport | None   = None
    stress:        StressReport | None   = None
    chaos:         ChaosReport | None    = None
    oracle:        OracleReport | None   = None
    verdict:       ImmuneVerdict | None  = None
    autopsy:       AutopsyReport | None  = None
    error:         str              = ""
    started_at:    float            = field(default_factory=time.time)
    completed_at:  float            = 0.0

    @property
    def final_verdict(self) -> Verdict:
        return self.verdict.verdict if self.verdict else Verdict.CLEAN

    @property
    def duration_s(self) -> float:
        end = self.completed_at or time.time()
        return end - self.started_at
