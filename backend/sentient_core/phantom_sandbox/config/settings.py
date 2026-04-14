"""phantom_sandbox.config.settings — إعدادات المحاكاة الشبحية."""

from __future__ import annotations

import re

from pydantic import BaseModel, field_validator


class PhantomSettings(BaseModel):
    """إعدادات المحاكاة الشبحية — تُحمَّل مرة واحدة وتُعاد استخدامها."""

    # ── قيود الحاوية ──
    container_memory_limit:      str   = "512m"
    container_cpu_limit:         str   = "1.0"
    container_pid_limit:         int   = 100
    container_startup_timeout_s: int   = 60
    container_build_timeout_s:   int   = 300

    # ── الشبكة ──
    phantom_network_name: str = "phantom_net"

    # ── المجسات ──
    probe_max_endpoints: int   = 50
    probe_timeout_s:     int   = 10

    # ── اختبار الإجهاد ──
    stress_crash_threshold: float = 0.3
    stress_duration_s:      int   = 15
    stress_concurrency:     int   = 5

    # ── نظام المناعة ──
    immune_response_warn_ms: int = 2000

    # ── التقارير ──
    report_output_dir: str = "/tmp/phantom_reports"

    @field_validator("container_memory_limit")
    @classmethod
    def validate_memory_limit(cls, v: str) -> str:
        if not re.match(r"^\d+[kmgKMG]i?$", v):
            raise ValueError(
                f"Invalid memory limit {v!r}. Expected format: <number><unit> e.g. '512m', '1g'"
            )
        return v


_settings: PhantomSettings | None = None


def get_settings() -> PhantomSettings:
    """يُعيد نسخة مشتركة من الإعدادات (singleton)."""
    global _settings
    if _settings is None:
        _settings = PhantomSettings()
    return _settings
