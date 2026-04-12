"""
phantom_sandbox.manager
════════════════════════
المنسّق العام للمحاكاة الشبحية — المدير التنفيذي للسبع طبقات.
"""

from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path
from uuid import uuid4

from phantom_sandbox.autopsy.forensics import PhantomAutopsy
from phantom_sandbox.chaos.engine import ChaosEngine
from phantom_sandbox.config.settings import get_settings
from phantom_sandbox.core.nursery import ContainerNursery
from phantom_sandbox.core.types import (
    AutopsyReport,
    ContainerStatus,
    PhantomReport,
    Verdict,
)
from phantom_sandbox.immune.system import DigitalImmuneSystem
from phantom_sandbox.memory.analyzer import MemoryAnalyzer
from phantom_sandbox.oracle.behavior_oracle import BehaviorOracle
from phantom_sandbox.probes.phantom_probes import EndpointDiscoverer, PhantomProbes
from phantom_sandbox.telemetry.tracer import PhantomLogger, PhantomTracer


class PhantomSandboxManager:
    """
    المنسّق العام للمحاكاة الشبحية.

    دورة التنفيذ:
      ┌─ Layer 1: ContainerNursery  ← ولادة العالم الموازي
      ├─ Layer 2: PhantomProbes     ← مجسات رباعية السلالة
      ├─ Layer 3: MemoryAnalyzer    ← كاشف التسرب بالانحدار الخطي
      ├─ Layer 4: StressTest        ← اختبار الإجهاد المتزامن
      ├─ Layer 5: ChaosEngine       ← حقن الأعطال الموجّهة
      ├─ Layer 6: BehaviorOracle    ← مقارنة سلوكية ثنائية
      └─ Layer 7: ImmuneSystem      ← الحكم النهائي الحتمي
    """

    def __init__(
        self,
        repo_path:   str | Path,
        branch_name: str,
    ) -> None:
        self._repo     = Path(repo_path).resolve()
        self._branch   = branch_name
        self._settings = get_settings()
        self._session  = uuid4()
        self._log      = PhantomLogger("system", session_id=self._session)
        self._tracer   = PhantomTracer(session_id=self._session)

    # ─────────────────────────────────────────────────────────
    #  الواجهة العامة
    # ─────────────────────────────────────────────────────────

    async def run(self) -> PhantomReport:
        """يُشغّل المحاكاة الشبحية الكاملة."""
        report = PhantomReport(
            simulation_id=self._session,
            branch=self._branch,
        )

        self._print_banner()

        with self._tracer.span("phantom_full_simulation", layer="system"):
            try:
                report = await self._execute_pipeline(report)
            except Exception as exc:
                self._log.critical(f"Simulation pipeline crashed: {exc}")
                report.error = str(exc)
            finally:
                report.completed_at = time.time()
                await self._save_report(report)

        return report

    # ─────────────────────────────────────────────────────────
    #  خط أنابيب التنفيذ
    # ─────────────────────────────────────────────────────────

    async def _execute_pipeline(self, report: PhantomReport) -> PhantomReport:
        """يُنفّذ تسلسل الطبقات بالترتيب الهندسي الصحيح."""

        async with ContainerNursery.managed(
            repo_path=self._repo,
            branch_name=self._branch,
            tracer=self._tracer,
        ) as nursery:

            birth = nursery.birth_report
            report.birth = birth

            immune = DigitalImmuneSystem()
            immune.ingest_birth(birth)

            # ── حالة الوفاة المبكرة ──
            if not nursery.is_alive:
                report.verdict = immune.render_verdict()
                if birth.status in (ContainerStatus.STILLBORN, ContainerStatus.COMATOSE):
                    report.autopsy = await self._perform_autopsy(
                        nursery.container_name,
                        f"Container failed with status: {birth.status.value}",
                    )
                return report

            base_url = nursery.base_url
            dna      = birth.dna

            # ── Layer 2: المجسات ──
            probes_engine = PhantomProbes(
                base_url=base_url,
                dna=dna,
                repo_path=self._repo,
                tracer=self._tracer,
            )
            report.probes = await probes_engine.run()
            immune.ingest_probes(report.probes)

            endpoints = EndpointDiscoverer(self._repo, dna).discover() if dna else []

            # ── Layer 3: مراقبة الذاكرة ──
            mem_analyzer = MemoryAnalyzer(
                container_name=nursery.container_name,
                base_url=base_url,
                tracer=self._tracer,
            )
            report.memory = await mem_analyzer.monitor()
            immune.ingest_memory(report.memory)

            # ── Layer 4: اختبار الإجهاد ──
            report.stress = await probes_engine.run_stress(
                path="/",
                duration_s=self._settings.stress_duration_s,
                concurrency=self._settings.stress_concurrency,
            )
            immune.ingest_stress(report.stress)

            # ── Layer 5: محرك الفوضى ──
            chaos = ChaosEngine(
                container_name=nursery.container_name,
                base_url=base_url,
                tracer=self._tracer,
            )
            report.chaos = await chaos.run_all()
            immune.ingest_chaos(report.chaos)

            # ── Layer 6: الأوراكل السلوكي ──
            oracle = BehaviorOracle(
                repo_path=self._repo,
                new_url=base_url,
                tracer=self._tracer,
            )
            report.oracle = await oracle.run(endpoints)
            immune.ingest_oracle(report.oracle)

            # ── Layer 7: الحكم النهائي ──
            report.verdict = immune.render_verdict()

            if report.verdict.verdict == Verdict.BLOCK:
                report.autopsy = await self._perform_autopsy(
                    nursery.container_name,
                    f"Immune system BLOCK: {report.verdict.recommendation}",
                )

        return report

    async def _perform_autopsy(
        self,
        container_name: str,
        death_context:  str,
    ) -> AutopsyReport:
        autopsy = PhantomAutopsy(container_name, tracer=self._tracer)
        return await autopsy.perform(death_context)

    # ─────────────────────────────────────────────────────────
    #  تخزين التقارير
    # ─────────────────────────────────────────────────────────

    async def _save_report(self, report: PhantomReport) -> None:
        output_dir = Path(self._settings.report_output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        report_path = output_dir / f"phantom_{self._session}.json"

        def _to_dict(obj):
            if hasattr(obj, "__dict__"):
                return {k: _to_dict(v) for k, v in obj.__dict__.items()
                        if not k.startswith("_")}
            elif hasattr(obj, "value"):
                return obj.value
            elif isinstance(obj, list):
                return [_to_dict(i) for i in obj]
            elif isinstance(obj, dict):
                return {k: _to_dict(v) for k, v in obj.items()}
            return obj

        try:
            data = _to_dict(report)
            data["verdict_summary"] = report.final_verdict.value if report.verdict else "UNKNOWN"
            data["duration_s"]      = round(report.duration_s, 2)
            report_path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2, default=str),
                encoding="utf-8",
            )
            self._log.success(f"Report saved: {report_path}")
        except Exception as exc:
            self._log.warning(f"Could not save report: {exc}")

    # ─────────────────────────────────────────────────────────
    #  الإخراج المرئي
    # ─────────────────────────────────────────────────────────

    def _print_banner(self) -> None:
        print(f"""
╔══════════════════════════════════════════════════════════╗
║           👻  PHANTOM SANDBOX v3.0-AUTDIE  👻            ║
║                                                          ║
║  Branch:  {self._branch:<43}  ║
║  Session: {str(self._session)[:36]:<43}  ║
║                                                          ║
║  Layers: [Birth][Probes][Memory][Stress][Chaos]          ║
║          [Oracle][Immune][Autopsy]                       ║
╚══════════════════════════════════════════════════════════╝
""")
