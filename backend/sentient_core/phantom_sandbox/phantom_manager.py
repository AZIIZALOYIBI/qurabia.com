# phantom_sandbox/phantom_manager.py

import contextlib
import time

from .autopsy import PhantomAutopsy
from .behavior_oracle import BehaviorOracle
from .chaos_engine import ChaosEngine
from .container_nursery import ContainerNursery
from .immune_system import DigitalImmuneSystem
from .memory_analyzer import MemoryAnalyzer
from .phantom_probes import PhantomProbes


class PhantomSandboxManager:
    """
    المدير العام للمحاكاة الشبحية
    ينسق كل الطبقات السبع ويتخذ القرارات
    """

    def __init__(self, repo_path: str, branch_name: str):
        self.repo_path = repo_path
        self.branch_name = branch_name
        self.nursery = None
        self.probes = None
        self.chaos = None
        self.memory = None
        self.oracle = None
        self.immune = DigitalImmuneSystem()
        self.full_report: dict = {}

    def run_full_simulation(self) -> dict:
        """
        يشغل المحاكاة الكاملة: من الولادة حتى الحكم
        """
        print("\n" + "="*60)
        print("👻 PHANTOM SANDBOX - Full Simulation Starting")
        print("="*60)

        self.full_report = {
            "simulation_id": f"phantom_{int(time.time())}",
            "branch": self.branch_name,
            "phases": {},
            "verdict": "UNKNOWN",
        }

        try:
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # المرحلة 1: الولادة (Birth)
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            print("\n📍 Phase 1: BIRTH - Spawning phantom container...")
            self.nursery = ContainerNursery(self.repo_path, self.branch_name)
            birth_report = self.nursery.birth()
            self.full_report["phases"]["birth"] = birth_report

            self.immune.analyze_nursery_report(birth_report)

            if birth_report["status"] not in ["alive"]:
                print(f"💀 Phantom DIED at birth. Status: {birth_report['status']}")
                if birth_report["status"] in ["stillborn", "comatose"]:
                    autopsy = PhantomAutopsy(
                        self.nursery.container_name,
                        self.nursery.container_id,
                        f"http://localhost:{self.nursery.app_port}"
                    )
                    autopsy_report = autopsy.perform(
                        f"Application failed to start with status: {birth_report['status']}"
                    )
                    self.full_report["phases"]["autopsy"] = autopsy_report
                    self.full_report["autopsy_prompt"] = autopsy.generate_ai_fix_prompt(
                        task="Application startup",
                        code_context=birth_report.get("build_log", "")
                    )

                self._cleanup()
                self.full_report["verdict"] = self.immune.render_verdict()["verdict"]
                return self.full_report

            base_url = f"http://localhost:{birth_report['port']}"
            dna = birth_report.get("dna", {})
            dna["repo_path"] = self.repo_path

            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # المرحلة 2: المجسات (Probes)
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            print("\n📍 Phase 2: PROBES - Sending phantom probes...")
            self.probes = PhantomProbes(base_url, dna)
            self.probes.discover_endpoints()
            probe_results = self.probes.launch_all_probes()
            self.full_report["phases"]["probes"] = probe_results
            self.immune.analyze_probe_results(probe_results)

            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # المرحلة 3: مراقبة الذاكرة
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            print("\n📍 Phase 3: MEMORY - Monitoring for leaks...")
            self.memory = MemoryAnalyzer(self.nursery.container_name, base_url)
            self.memory.monitor_during_probes(duration_seconds=20, interval=3)
            memory_report = self.memory.get_report()
            self.full_report["phases"]["memory"] = memory_report
            self.immune.analyze_memory_report(memory_report)

            stress_results = self.probes.run_stress_test(endpoint_path="/", duration=8, concurrency=3)
            self.full_report["phases"]["stress"] = stress_results

            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # المرحلة 4: الفوضى الموجهة (Chaos)
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            print("\n📍 Phase 4: CHAOS - Injecting controlled failures...")
            self.chaos = ChaosEngine(self.nursery.container_name, birth_report["port"], base_url)
            self.chaos.design_experiments()
            chaos_results = self.chaos.execute_all()
            self.full_report["phases"]["chaos"] = chaos_results
            self.immune.analyze_chaos_results(chaos_results)

            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # المرحلة 5: الأوراكل السلوكي (Behavior Oracle)
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            print("\n📍 Phase 5: ORACLE - Comparing with baseline...")
            self.oracle = BehaviorOracle(self.repo_path, self.nursery.container_name, base_url)
            if self.oracle.spawn_baseline():
                comparison = self.oracle.compare_behaviors(self.probes.discovered_endpoints)
                self.full_report["phases"]["behavior_comparison"] = comparison
                self.immune.analyze_behavior_comparison(comparison)
            else:
                self.full_report["phases"]["behavior_comparison"] = {
                    "skipped": True,
                    "reason": "Could not spawn baseline"
                }

            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # المرحلة 6: حكم المناعة (Immune Verdict)
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            print("\n📍 Phase 6: IMMUNE SYSTEM - Rendering final verdict...")
            verdict = self.immune.render_verdict()
            self.full_report["verdict"] = verdict["verdict"]
            self.full_report["immune_verdict"] = verdict

            print(f"\n{'='*60}")
            print(f"👻 PHANTOM VERDICT: {verdict['verdict']}")
            print(f"   Alerts: {verdict['total_alerts']} "
                  f"(🔴 {verdict['critical_alerts']} 🟠 {verdict['high_alerts']} 🟡 {verdict['medium_alerts']})")
            print(f"   Recommendation: {verdict['recommendation']}")
            print(f"{'='*60}")

        except Exception as e:
            self.full_report["error"] = str(e)
            self.full_report["verdict"] = "ERROR"
            print(f"💥 Phantom simulation crashed: {e}")

        finally:
            self._cleanup()

        return self.full_report

    def _cleanup(self):
        """تنظيف كل الحاويات والموارد الشبحية"""
        import subprocess
        if self.nursery:
            self.nursery.kill()
        if self.oracle:
            self.oracle.cleanup_baseline()

        with contextlib.suppress(Exception):
            subprocess.run(["docker", "network", "rm", "phantom_net"],
                           capture_output=True, timeout=5)

        print("👻 Phantom cleanup complete. No traces left.")

    def get_autopsy_prompt_if_blocked(self) -> str:
        """يعيد prompt التشريح إذا كان الكود مرفوضاً"""
        if self.full_report.get("autopsy_prompt"):
            return self.full_report["autopsy_prompt"]

        verdict = self.immune.render_verdict()
        if verdict["verdict"] == "BLOCK":
            block_alerts = [a for a in verdict["alerts"] if a["action"] == "BLOCK"]
            prompt = "The phantom sandbox has BLOCKED your code. Here are the critical issues:\n\n"
            for alert in block_alerts:
                prompt += f"\n🔴 {alert['severity']} - {alert['category']}:\n"
                prompt += f"   {alert['message']}\n"
                prompt += f"   Evidence: {alert['evidence']}\n"
                prompt += f"   Suggested fix: {alert['fix']}\n"
            return prompt

        return ""
