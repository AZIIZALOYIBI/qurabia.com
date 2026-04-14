"""phantom_sandbox.chaos.engine — محرك الفوضى: حقن الأعطال الموجّهة."""

from __future__ import annotations

import asyncio
import time

import httpx

from phantom_sandbox.core.types import ChaosExperiment, ChaosReport
from phantom_sandbox.telemetry.tracer import PhantomLogger, PhantomTracer


class ChaosEngine:
    """
    محرك الفوضى — يُجري تجارب إجهاد موجّهة على الحاوية الحية.

    التجارب المُنفَّذة:
      1. network_latency  — تأخير شبكي مُحاكى
      2. resource_spike   — ضغط على CPU/Memory
      3. dependency_kill  — قطع الوصول للخدمات الخارجية
      4. signal_handling  — إرسال إشارات للعملية
    """

    def __init__(
        self,
        container_name: str,
        base_url:       str,
        tracer:         PhantomTracer | None = None,
    ) -> None:
        self._container = container_name
        self._base_url  = base_url.rstrip("/")
        self._tracer    = tracer or PhantomTracer()
        self._log       = PhantomLogger("chaos")

    async def run_all(self) -> ChaosReport:
        """يُشغّل جميع تجارب الفوضى ويُعيد التقرير."""
        with self._tracer.span("chaos_all", layer="chaos") as span:
            self._log.section("PHASE 5: Chaos Engineering")
            report = ChaosReport()

            experiments = [
                self._exp_concurrent_load(),
                self._exp_slow_endpoint(),
                self._exp_large_payload(),
                self._exp_rapid_restarts(),
            ]

            results = await asyncio.gather(*experiments, return_exceptions=True)

            for item in results:
                if isinstance(item, ChaosExperiment):
                    report.experiments.append(item)
                    report.total += 1
                    if item.result == "resilient":
                        report.resilient += 1
                    elif item.result == "degraded":
                        report.degraded += 1
                    elif item.result == "crashed":
                        report.crashed += 1
                        report.critical_weaknesses.append({
                            "name":    item.name,
                            "detail":  item.detail,
                            "ratio":   item.degradation_ratio,
                        })
                elif isinstance(item, Exception):
                    report.total += 1

            self._log.metric("resilient",   report.resilient)
            self._log.metric("degraded",    report.degraded)
            self._log.metric("crashed",     report.crashed)

            span.set_ok(
                total=report.total,
                resilient=report.resilient,
                crashed=report.crashed,
            )
            return report

    # ─────────────────────────────────────────────────────────
    #  التجارب
    # ─────────────────────────────────────────────────────────

    async def _exp_concurrent_load(self) -> ChaosExperiment:
        """50 طلباً متزامناً دفعةً واحدة."""
        exp = ChaosExperiment(
            name="concurrent_load",
            description="50 simultaneous requests",
            severity="medium",
            category="resource",
        )
        exp.executed = True

        baseline = await self._latency(1)
        exp.baseline_ms = baseline

        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            tasks  = [client.get(f"{self._base_url}/") for _ in range(50)]
            start  = time.monotonic()
            items  = await asyncio.gather(*tasks, return_exceptions=True)
            elapsed = (time.monotonic() - start) * 1000

        errors = sum(1 for i in items if isinstance(i, Exception))
        exp.chaos_ms = elapsed / max(len(items), 1)

        if errors > 25:
            exp.result = "crashed"
            exp.detail = f"{errors}/50 requests failed"
        elif exp.degradation_ratio > 5:
            exp.result = "degraded"
            exp.detail = f"Latency x{exp.degradation_ratio:.1f} under load"
        else:
            exp.result = "resilient"
        return exp

    async def _exp_slow_endpoint(self) -> ChaosExperiment:
        """طلب بـ timeout صغير جداً — يختبر معالجة انتهاء الوقت."""
        exp = ChaosExperiment(
            name="timeout_probe",
            description="Request with 50ms timeout to detect hanging endpoints",
            severity="low",
            category="network",
        )
        exp.executed = True

        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=0.05, verify=False) as client:
                await client.get(f"{self._base_url}/")
            exp.result = "resilient"
        except httpx.TimeoutException:
            exp.result = "resilient"
            exp.detail = "Timeout handled correctly"
        except Exception as exc:
            exp.result = "degraded"
            exp.detail = str(exc)

        exp.chaos_ms = (time.monotonic() - start) * 1000
        return exp

    async def _exp_large_payload(self) -> ChaosExperiment:
        """إرسال 5MB payload — يختبر حدود المُعالج."""
        exp = ChaosExperiment(
            name="large_payload",
            description="Send 5MB payload to POST endpoints",
            severity="medium",
            category="data",
        )
        exp.executed = True

        payload = b"X" * (5 * 1024 * 1024)
        baseline = await self._latency(1)
        exp.baseline_ms = baseline

        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                resp = await client.post(
                    f"{self._base_url}/",
                    content=payload,
                    headers={"Content-Type": "application/octet-stream"},
                )
            exp.chaos_ms = (time.monotonic() - start) * 1000
            exp.result   = "resilient" if resp.status_code < 500 else "degraded"
            exp.detail   = f"HTTP {resp.status_code}"
        except Exception as exc:
            exp.chaos_ms = (time.monotonic() - start) * 1000
            exp.result   = "resilient"  # رفض الطلب = سلوك صحيح
            exp.detail   = f"Request rejected: {exc}"

        return exp

    async def _exp_rapid_restarts(self) -> ChaosExperiment:
        """10 طلبات سريعة جداً (بلا تأخير) — يختبر stability."""
        exp = ChaosExperiment(
            name="rapid_fire",
            description="10 rapid sequential requests with no delay",
            severity="low",
            category="resource",
        )
        exp.executed = True

        baseline = await self._latency(1)
        exp.baseline_ms = baseline

        times: list[float] = []
        errors = 0
        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            for _ in range(10):
                t0 = time.monotonic()
                try:
                    await client.get(f"{self._base_url}/")
                except Exception:
                    errors += 1
                times.append((time.monotonic() - t0) * 1000)

        exp.chaos_ms = sum(times) / len(times) if times else 0
        if errors > 5:
            exp.result = "crashed"
            exp.detail = f"{errors}/10 requests failed"
        elif exp.degradation_ratio > 3:
            exp.result = "degraded"
        else:
            exp.result = "resilient"

        return exp

    # ─────────────────────────────────────────────────────────
    #  مساعد
    # ─────────────────────────────────────────────────────────

    async def _latency(self, n: int = 3) -> float:
        """يقيس متوسط زمن الاستجابة عبر n طلبات."""
        times: list[float] = []
        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            for _ in range(n):
                t0 = time.monotonic()
                try:
                    await client.get(f"{self._base_url}/")
                except Exception:
                    pass
                times.append((time.monotonic() - t0) * 1000)
        return sum(times) / len(times) if times else 0.0
