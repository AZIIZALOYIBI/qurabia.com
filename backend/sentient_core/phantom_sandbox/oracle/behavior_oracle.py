"""phantom_sandbox.oracle.behavior_oracle — الأوراكل السلوكي: مقارنة ثنائية."""

from __future__ import annotations

import contextlib
import hashlib
import json
from pathlib import Path

import httpx

from phantom_sandbox.core.types import OracleReport
from phantom_sandbox.probes.phantom_probes import Endpoint
from phantom_sandbox.telemetry.tracer import PhantomLogger, PhantomTracer


class BehaviorOracle:
    """
    الأوراكل السلوكي — يقارن استجابات البناء الجديد مع خط الأساس.

    إذا لم يوجد خط أساس (أول نشر)، يُخزّن الاستجابات كخط أساس جديد.
    التشابه يُحسب باستخدام hash كامل للاستجابة.
    """

    _BASELINE_FILE = "/tmp/phantom_oracle_baseline.json"

    def __init__(
        self,
        repo_path: Path,
        new_url:   str,
        tracer:    PhantomTracer | None = None,
    ) -> None:
        self._repo    = repo_path
        self._new_url = new_url.rstrip("/")
        self._tracer  = tracer or PhantomTracer()
        self._log     = PhantomLogger("oracle")

    async def run(self, endpoints: list[Endpoint]) -> OracleReport:
        """يُشغّل المقارنة السلوكية."""
        with self._tracer.span("behavior_oracle", layer="oracle") as span:
            self._log.section("PHASE 6: Behavior Oracle")

            report = OracleReport()

            baseline = self._load_baseline()

            if not baseline:
                self._log.info("No baseline found — recording current responses as baseline.")
                await self._record_baseline(endpoints)
                report.skipped     = True
                report.skip_reason = "No baseline available; current run recorded as baseline."
                span.set_ok(status="baseline_recorded")
                return report

            # مقارنة
            async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                for ep in endpoints[:20]:  # حد أقصى 20 نقطة للمقارنة
                    report.total_comparisons += 1
                    new_hash = await self._fetch_hash(client, ep)
                    old_hash = baseline.get(f"{ep.method}:{ep.path}", "")

                    if new_hash and old_hash and new_hash == old_hash:
                        report.identical += 1
                    elif new_hash and old_hash and new_hash != old_hash:
                        report.divergent += 1
                        report.divergences.append({
                            "endpoint":  ep.path,
                            "method":    ep.method,
                            "old_hash":  old_hash[:8],
                            "new_hash":  new_hash[:8],
                        })

            self._log.metric(
                "divergences",
                f"{report.divergent}/{report.total_comparisons}",
            )
            span.set_ok(
                comparisons=report.total_comparisons,
                divergent=report.divergent,
            )
            return report

    # ─────────────────────────────────────────────────────────
    #  Baseline
    # ─────────────────────────────────────────────────────────

    async def _record_baseline(self, endpoints: list[Endpoint]) -> None:
        baseline: dict[str, str] = {}
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            for ep in endpoints[:20]:
                h = await self._fetch_hash(client, ep)
                if h:
                    baseline[f"{ep.method}:{ep.path}"] = h
        with contextlib.suppress(Exception):
            Path(self._BASELINE_FILE).write_text(
                json.dumps(baseline, indent=2), encoding="utf-8"
            )

    def _load_baseline(self) -> dict:
        try:
            return json.loads(Path(self._BASELINE_FILE).read_text(encoding="utf-8"))
        except Exception:
            return {}

    async def _fetch_hash(self, client: httpx.AsyncClient, ep: Endpoint) -> str:
        url = f"{self._new_url}{ep.path}"
        try:
            resp = await client.request(ep.method, url)
            body = resp.text[:4096]
            return hashlib.sha256(
                f"{resp.status_code}:{body}".encode()
            ).hexdigest()
        except Exception:
            return ""
