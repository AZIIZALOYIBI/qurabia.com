"""
tests.test_phantom_sandbox
═══════════════════════════
مجموعة اختبارات شاملة للمحاكاة الشبحية.
المنهجية: Arrange → Act → Assert مع Property-Based Testing بـ Hypothesis.
"""

from __future__ import annotations

import random
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from phantom_sandbox.autopsy.forensics import PhantomAutopsy
from phantom_sandbox.config.settings import PhantomSettings
from phantom_sandbox.core.types import (
    AlertAction,
    AlertSeverity,
    AutopsyReport,
    BirthReport,
    ChaosExperiment,
    ChaosReport,
    ContainerStatus,
    MemoryReading,
    MemoryReport,
    OracleReport,
    PhantomReport,
    ProbeReport,
    ProbeResult,
    ProbeStrain,
    ProjectDNA,
    StressReport,
    Verdict,
)
from phantom_sandbox.immune.system import DigitalImmuneSystem
from phantom_sandbox.memory.analyzer import MemoryAnalyzer


# ─────────────────────────────────────────────────────────────
#  اختبارات نظام المناعة
# ─────────────────────────────────────────────────────────────

class TestDigitalImmuneSystem:

    def test_clean_verdict_on_healthy_birth(self):
        immune = DigitalImmuneSystem()
        report = BirthReport(status=ContainerStatus.ALIVE, host_port=8000)
        immune.ingest_birth(report)
        verdict = immune.render_verdict()
        assert verdict.verdict == Verdict.CLEAN

    def test_block_on_stillborn(self):
        immune = DigitalImmuneSystem()
        report = BirthReport(status=ContainerStatus.STILLBORN, build_log="SyntaxError: invalid syntax")
        immune.ingest_birth(report)
        verdict = immune.render_verdict()
        assert verdict.verdict == Verdict.BLOCK
        assert verdict.critical_count >= 1

    def test_block_on_security_exposure(self):
        immune = DigitalImmuneSystem()
        immune.ingest_birth(BirthReport(status=ContainerStatus.ALIVE, host_port=8000))
        probe_report = ProbeReport(
            total_probes=5,
            successful=4,
            security_alerts=1,
            anomaly_details=[{
                "endpoint": "/.env",
                "type":     "SECURITY_EXPOSURE",
                "severity": "CRITICAL",
                "detail":   "/.env returned HTTP 200",
            }]
        )
        immune.ingest_probes(probe_report)
        verdict = immune.render_verdict()
        assert verdict.verdict == Verdict.BLOCK

    def test_warn_on_memory_leak_medium(self):
        immune = DigitalImmuneSystem()
        immune.ingest_birth(BirthReport(status=ContainerStatus.ALIVE, host_port=8000))
        mem_report = MemoryReport(
            leak_detected=True,
            growth_mb=25.0,
            slope_mb_per_s=0.8,
            severity=AlertSeverity.MEDIUM,
        )
        immune.ingest_memory(mem_report)
        immune.ingest_probes(ProbeReport(total_probes=5, successful=5))
        verdict = immune.render_verdict()
        assert verdict.verdict == Verdict.WARN

    def test_block_on_memory_leak_critical(self):
        immune = DigitalImmuneSystem()
        immune.ingest_birth(BirthReport(status=ContainerStatus.ALIVE, host_port=8000))
        mem_report = MemoryReport(
            leak_detected=True,
            growth_mb=150.0,
            slope_mb_per_s=3.5,
            severity=AlertSeverity.CRITICAL,
        )
        immune.ingest_memory(mem_report)
        immune.ingest_probes(ProbeReport(total_probes=5, successful=5))
        verdict = immune.render_verdict()
        assert verdict.verdict == Verdict.BLOCK

    def test_alerts_sorted_by_severity(self):
        immune = DigitalImmuneSystem()
        immune.ingest_birth(BirthReport(status=ContainerStatus.ALIVE, host_port=8000))
        immune.ingest_probes(ProbeReport(
            total_probes=10, successful=3, failed=7,
            security_alerts=1,
            anomaly_details=[{
                "endpoint": "/.env",
                "type": "SECURITY_EXPOSURE",
                "severity": "CRITICAL",
                "detail": "exposed",
            }]
        ))
        verdict = immune.render_verdict()
        for i in range(len(verdict.alerts) - 1):
            assert verdict.alerts[i].severity >= verdict.alerts[i + 1].severity

    def test_deterministic_block_rule(self):
        immune = DigitalImmuneSystem()
        immune.ingest_birth(BirthReport(status=ContainerStatus.STILLBORN))
        immune.ingest_probes(ProbeReport(total_probes=5, successful=5))
        immune.ingest_memory(MemoryReport(leak_detected=False))
        verdict = immune.render_verdict()
        assert verdict.verdict == Verdict.BLOCK


# ─────────────────────────────────────────────────────────────
#  اختبارات كاشف تسرب الذاكرة
# ─────────────────────────────────────────────────────────────

class TestMemoryAnalyzer:

    def _make_analyzer(self) -> MemoryAnalyzer:
        return MemoryAnalyzer(container_name="test", base_url="http://localhost:8000")

    def _readings(self, values: list[float]) -> list[MemoryReading]:
        return [
            MemoryReading(timestamp_s=float(i * 3), used_mb=v)
            for i, v in enumerate(values)
        ]

    def test_detects_clear_leak(self):
        analyzer = self._make_analyzer()
        values   = [50.0 + i * 5.0 for i in range(17)]
        readings = self._readings(values)
        report   = analyzer._analyze(readings)
        assert report.leak_detected is True
        assert report.growth_mb > 10.0
        assert report.slope_mb_per_s > 0.5

    def test_no_false_positive_on_stable(self):
        analyzer = self._make_analyzer()
        random.seed(42)
        values   = [100.0 + random.uniform(-3, 3) for _ in range(15)]
        readings = self._readings(values)
        report   = analyzer._analyze(readings)
        assert report.leak_detected is False

    def test_no_false_positive_after_gc(self):
        analyzer = self._make_analyzer()
        values   = [100.0, 115.0, 130.0, 145.0, 120.0, 100.0, 95.0, 98.0, 102.0, 100.0]
        readings = self._readings(values)
        report   = analyzer._analyze(readings)
        assert report.growth_mb < 10.0

    def test_ols_slope_computation(self):
        analyzer = self._make_analyzer()
        x     = [float(i) for i in range(10)]
        y     = [2.0 * xi for xi in x]
        slope = analyzer._compute_slope(x, y)
        assert abs(slope - 2.0) < 1e-9

    def test_insufficient_readings(self):
        analyzer = self._make_analyzer()
        readings = self._readings([100.0, 110.0])
        report   = analyzer._analyze(readings)
        assert report.leak_detected is False
        assert "Insufficient" in report.analysis_detail

    def test_severity_scaling(self):
        analyzer = self._make_analyzer()
        small    = [50.0 + i * 0.7 for i in range(20)]
        r1       = analyzer._analyze(self._readings(small))
        large    = [50.0 + i * 8.0 for i in range(20)]
        r2       = analyzer._analyze(self._readings(large))
        if r1.leak_detected and r2.leak_detected:
            assert r2.severity >= r1.severity


# ─────────────────────────────────────────────────────────────
#  اختبارات أنواع البيانات
# ─────────────────────────────────────────────────────────────

class TestCoreTypes:

    def test_birth_report_is_alive(self):
        report = BirthReport(status=ContainerStatus.ALIVE, host_port=8000)
        assert report.is_alive is True
        assert report.base_url == "http://localhost:8000"

    def test_birth_report_not_alive(self):
        report = BirthReport(status=ContainerStatus.STILLBORN)
        assert report.is_alive is False
        assert report.base_url is None

    def test_chaos_experiment_degradation_ratio(self):
        exp = ChaosExperiment(baseline_ms=100.0, chaos_ms=350.0)
        assert abs(exp.degradation_ratio - 3.5) < 1e-9

    def test_chaos_experiment_zero_baseline(self):
        exp = ChaosExperiment(baseline_ms=0.0, chaos_ms=100.0)
        assert exp.degradation_ratio == 0.0

    def test_probe_report_health_ratio(self):
        report = ProbeReport(total_probes=10, successful=8)
        assert abs(report.health_ratio - 0.8) < 1e-9

    def test_probe_report_empty(self):
        report = ProbeReport()
        assert report.health_ratio == 1.0

    def test_phantom_report_final_verdict(self):
        from phantom_sandbox.core.types import ImmuneVerdict
        report  = PhantomReport()
        verdict = ImmuneVerdict(verdict=Verdict.WARN)
        report.verdict = verdict
        assert report.final_verdict == Verdict.WARN

    def test_alert_severity_ordering(self):
        assert AlertSeverity.CRITICAL > AlertSeverity.HIGH
        assert AlertSeverity.HIGH     > AlertSeverity.MEDIUM
        assert AlertSeverity.MEDIUM   > AlertSeverity.LOW
        assert AlertSeverity.LOW      > AlertSeverity.INFO

    def test_project_dna_is_web_app(self):
        from phantom_sandbox.core.types import Language
        dna = ProjectDNA(language=Language.PYTHON, run_cmd="uvicorn app:app")
        assert dna.is_web_app() is True

    def test_project_dna_frozen(self):
        from phantom_sandbox.core.types import Language
        dna = ProjectDNA(language=Language.PYTHON)
        with pytest.raises((AttributeError, TypeError)):
            dna.port = 9999  # type: ignore


# ─────────────────────────────────────────────────────────────
#  اختبارات الإعدادات
# ─────────────────────────────────────────────────────────────

class TestSettings:

    def test_valid_memory_limit(self):
        s = PhantomSettings(container_memory_limit="256m")
        assert s.container_memory_limit == "256m"

    def test_invalid_memory_limit(self):
        with pytest.raises(Exception):
            PhantomSettings(container_memory_limit="invalid")

    def test_default_values(self):
        s = PhantomSettings()
        assert s.probe_timeout_s    == 10
        assert s.stress_concurrency == 5
        assert s.phantom_network_name == "phantom_net"


# ─────────────────────────────────────────────────────────────
#  اختبارات كاشف الحمض النووي
# ─────────────────────────────────────────────────────────────

class TestDNADetector:

    def test_detect_python_fastapi(self, tmp_path: Path):
        (tmp_path / "requirements.txt").write_text("fastapi\nuvicorn\n")
        (tmp_path / "app.py").write_text("from fastapi import FastAPI\napp = FastAPI()\n")
        from phantom_sandbox.core.dna_detector import DNADetector
        from phantom_sandbox.core.types import Framework, Language
        dna = DNADetector(tmp_path).detect()
        assert dna.language  == Language.PYTHON
        assert dna.framework == Framework.FASTAPI
        assert dna.port == 8000

    def test_detect_node_express(self, tmp_path: Path):
        import json
        pkg = {"dependencies": {"express": "^4.0"}}
        (tmp_path / "package.json").write_text(json.dumps(pkg))
        (tmp_path / "server.js").write_text("const express = require('express');\n")
        from phantom_sandbox.core.dna_detector import DNADetector
        from phantom_sandbox.core.types import Framework, Language
        dna = DNADetector(tmp_path).detect()
        assert dna.language  == Language.NODE
        assert dna.framework == Framework.EXPRESS

    def test_detect_unknown_project(self, tmp_path: Path):
        from phantom_sandbox.core.dna_detector import DNADetector
        from phantom_sandbox.core.types import Language
        dna = DNADetector(tmp_path).detect()
        assert dna.language == Language.UNKNOWN

    def test_detect_docker_priority(self, tmp_path: Path):
        (tmp_path / "Dockerfile").write_text("FROM python:3.12\nEXPOSE 8000\n")
        (tmp_path / "requirements.txt").write_text("flask\n")
        from phantom_sandbox.core.dna_detector import DNADetector
        from phantom_sandbox.core.types import Language
        dna = DNADetector(tmp_path).detect()
        assert dna.language == Language.DOCKER
        assert dna.dockerfile_exists is True

    def test_detect_db_dependency(self, tmp_path: Path):
        (tmp_path / "requirements.txt").write_text("fastapi\nsqlalchemy\npsycopg2\n")
        (tmp_path / "app.py").write_text(
            "from fastapi import FastAPI; from sqlalchemy import create_engine\n"
        )
        from phantom_sandbox.core.dna_detector import DNADetector
        dna = DNADetector(tmp_path).detect()
        assert dna.needs_db is True


# ─────────────────────────────────────────────────────────────
#  اختبارات التشريح
# ─────────────────────────────────────────────────────────────

class TestPhantomAutopsy:

    def test_classify_oom_from_container_state(self):
        autopsy = PhantomAutopsy("test_container")
        report  = AutopsyReport(
            container_state={"raw": "exited | ExitCode=137 | OOMKilled=true", "oom_killed": True},
            application_logs="normal logs here",
            system_logs="",
        )
        causes, _ = autopsy._determine_cause(report)
        assert any("OOM" in c for c in causes)

    def test_classify_import_error(self):
        autopsy = PhantomAutopsy("test_container")
        report  = AutopsyReport(
            container_state={"raw": "exited | ExitCode=1 | OOMKilled=false", "oom_killed": False},
            application_logs="Traceback (most recent call last):\n  ImportError: No module named 'fastapi'\n",
            system_logs="",
        )
        causes, corrections = autopsy._determine_cause(report)
        assert any("MISSING_DEPENDENCY" in c or "Import" in c for c in causes)
        assert len(corrections) > 0

    def test_unknown_cause_fallback(self):
        autopsy = PhantomAutopsy("test_container")
        report  = AutopsyReport(
            container_state={"oom_killed": False},
            application_logs="",
            system_logs="",
        )
        _, corrections = autopsy._determine_cause(report)
        assert len(corrections) >= 1


# ─────────────────────────────────────────────────────────────
#  Property-Based Tests (Hypothesis)
# ─────────────────────────────────────────────────────────────

try:
    from hypothesis import given, settings as hyp_settings
    from hypothesis import strategies as st
    HAS_HYPOTHESIS = True
except ImportError:
    HAS_HYPOTHESIS = False


if HAS_HYPOTHESIS:

    class TestMemoryAnalyzerProperties:

        @given(
            values=st.lists(
                st.floats(min_value=10.0, max_value=1000.0, allow_nan=False, allow_infinity=False),
                min_size=6, max_size=30,
            )
        )
        @hyp_settings(max_examples=200)
        def test_slope_sign_consistency(self, values: list[float]):
            analyzer = MemoryAnalyzer("test", "http://localhost")
            x        = [float(i) for i in range(len(values))]
            slope    = analyzer._compute_slope(x, values)
            if values[-1] > values[0] + 20:
                assert slope > 0

        @given(
            n=st.integers(min_value=2, max_value=5),
            base=st.floats(min_value=10.0, max_value=500.0, allow_nan=False),
        )
        def test_perfect_linear_slope(self, n: int, base: float):
            analyzer = MemoryAnalyzer("test", "http://localhost")
            x        = [float(i) for i in range(10)]
            y        = [base + n * xi for xi in x]
            slope    = analyzer._compute_slope(x, y)
            assert abs(slope - n) < 1e-6
