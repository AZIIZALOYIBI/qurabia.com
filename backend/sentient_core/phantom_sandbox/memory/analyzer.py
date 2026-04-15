"""phantom_sandbox.memory.analyzer — كاشف تسرب الذاكرة بالانحدار الخطي (OLS)."""

from __future__ import annotations

import asyncio
import time

from phantom_sandbox.core.types import AlertSeverity, MemoryReading, MemoryReport
from phantom_sandbox.telemetry.tracer import PhantomLogger, PhantomTracer

# حدود كشف التسرب
_MIN_GROWTH_MB = 10.0   # حد أدنى للنمو المطلق (MB)
_MIN_SLOPE     = 0.5    # حد أدنى لمعدل النمو (MB/s)


class MemoryAnalyzer:
    """
    كاشف تسرب الذاكرة — يستخدم انحداراً خطياً OLS لتحديد الاتجاه.

    خوارزمية الكشف:
      1. جمع قراءات الذاكرة دورياً من Docker stats
      2. حساب ميل الانحدار (slope MB/s)
      3. حساب النمو المطلق (آخر ثلث − أول ثلث)
      4. التسرب = slope > حد AND نمو > حد
    """

    def __init__(
        self,
        container_name: str,
        base_url:       str,
        tracer:         PhantomTracer | None = None,
    ) -> None:
        self._container = container_name
        self._base_url  = base_url
        self._tracer    = tracer or PhantomTracer()
        self._log       = PhantomLogger("memory")

    async def monitor(
        self,
        duration_s: int = 30,
        interval_s: int = 3,
    ) -> MemoryReport:
        """يُراقب الذاكرة للمدة المُحددة ويُعيد تقرير التحليل."""
        with self._tracer.span("memory_monitor", layer="memory") as span:
            self._log.section("PHASE 3: Memory Leak Detection")
            readings: list[MemoryReading] = []
            start = time.monotonic()

            while time.monotonic() - start < duration_s:
                reading = await self._read_memory()
                if reading:
                    readings.append(reading)
                await asyncio.sleep(interval_s)

            report = self._analyze(readings)
            if report.leak_detected:
                span.set_error(f"leak:{report.severity.name}:{report.growth_mb:.1f}MB")
                self._log.error(
                    f"Memory leak detected! growth={report.growth_mb:.1f}MB "
                    f"slope={report.slope_mb_per_s:.3f}MB/s severity={report.severity.name}"
                )
            else:
                span.set_ok(readings=len(readings))
                self._log.success("No memory leak detected.")

            return report

    # ── التحليل ──

    def _analyze(self, readings: list[MemoryReading]) -> MemoryReport:
        """يُحلّل قراءات الذاكرة ويُعيد تقريراً كاملاً."""
        if len(readings) < 4:
            return MemoryReport(
                leak_detected=False,
                analysis_detail="Insufficient data for analysis",
            )

        x = [r.timestamp_s for r in readings]
        y = [r.used_mb     for r in readings]

        slope = self._compute_slope(x, y)

        # النمو المطلق: آخر ثلث مقابل أول ثلث
        third     = max(1, len(readings) // 3)
        first_avg = sum(r.used_mb for r in readings[:third]) / third
        last_avg  = sum(r.used_mb for r in readings[-third:]) / third
        growth_mb = last_avg - first_avg

        leak = growth_mb > _MIN_GROWTH_MB and slope > _MIN_SLOPE

        severity = self._compute_severity(growth_mb, slope) if leak else AlertSeverity.INFO

        return MemoryReport(
            leak_detected=leak,
            growth_mb=round(growth_mb, 2),
            slope_mb_per_s=round(slope, 4),
            severity=severity,
            readings=readings,
            baseline_mb=round(first_avg, 2),
            peak_mb=round(max(y), 2),
            analysis_detail=(
                f"OLS slope={slope:.4f} MB/s, growth={growth_mb:.1f} MB "
                f"over {len(readings)} samples"
            ),
        )

    def _compute_slope(self, x: list[float], y: list[float]) -> float:
        """
        انحدار خطي OLS — يُعيد الميل (slope).
        slope = Σ(xi - x̄)(yi - ȳ) / Σ(xi - x̄)²
        """
        n = len(x)
        if n < 2:
            return 0.0

        x_mean = sum(x) / n
        y_mean = sum(y) / n

        numerator   = sum((xi - x_mean) * (yi - y_mean) for xi, yi in zip(x, y, strict=False))
        denominator = sum((xi - x_mean) ** 2 for xi in x)

        if denominator == 0.0:
            return 0.0

        return numerator / denominator

    def _compute_severity(self, growth_mb: float, slope: float) -> AlertSeverity:
        if growth_mb > 100.0 or slope > 3.0:
            return AlertSeverity.CRITICAL
        if growth_mb > 50.0 or slope > 1.5:
            return AlertSeverity.HIGH
        if growth_mb > 20.0 or slope > 0.7:
            return AlertSeverity.MEDIUM
        return AlertSeverity.LOW

    # ── قراءة Docker stats ──

    async def _read_memory(self) -> MemoryReading | None:
        """يقرأ إحصاءات الذاكرة من Docker stats."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "stats", "--no-stream", "--format",
                "{{.MemUsage}}", self._container,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
            raw = stdout.decode(errors="replace").strip()
            used_mb = self._parse_mem(raw.split("/")[0].strip())
            if used_mb is not None:
                return MemoryReading(
                    timestamp_s=time.monotonic(),
                    used_mb=used_mb,
                )
        except Exception:
            pass
        return None

    @staticmethod
    def _parse_mem(s: str) -> float | None:
        """يُحوّل '128.5MiB' أو '1.2GiB' إلى MB."""
        import re
        m = re.match(r"([\d.]+)\s*([KMGkmg]i?[Bb]?)", s)
        if not m:
            return None
        val, unit = float(m.group(1)), m.group(2).upper()
        if "K" in unit:
            return val / 1024
        if "G" in unit:
            return val * 1024
        return val
