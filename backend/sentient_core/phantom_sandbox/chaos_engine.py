# phantom_sandbox/chaos_engine.py

import subprocess
import time
from dataclasses import dataclass


@dataclass
class ChaosExperiment:
    """تجربة فوضى واحدة"""
    name: str
    description: str
    severity: str          # "low", "medium", "high", "critical"
    category: str          # "network", "resource", "dependency", "data"
    executed: bool = False
    result: str = ""       # "resilient", "degraded", "crashed"
    recovery_time_ms: float = 0
    detail: str = ""


class ChaosEngine:
    """
    محرك الفوضى: يحقن أعطالاً مقصودة في الحاوية الشبحية
    ليرى كيف يتصرف التطبيق تحت الضغط
    الهدف: اكتشاف نقاط الضعف قبل أن يكتشفها المستخدمون
    """

    def __init__(self, container_name: str, app_port: int, base_url: str):
        self.container_name = container_name
        self.app_port = app_port
        self.base_url = base_url
        self.experiments: list = []
        self.results_summary = {
            "total_experiments": 0,
            "resilient": 0,
            "degraded": 0,
            "crashed": 0,
            "critical_weaknesses": [],
        }

    def design_experiments(self) -> list:
        """يصمم تجارب الفوضى بناءً على نوع التطبيق"""
        experiments = [
            # ── تجارب الشبكة ──
            ChaosExperiment(
                name="network_latency_injection",
                description="حقن تأخير شبكي 500ms",
                severity="low",
                category="network"
            ),
            ChaosExperiment(
                name="network_packet_loss",
                description="محاكاة فقدان 20% من الحزم",
                severity="medium",
                category="network"
            ),
            ChaosExperiment(
                name="dns_failure",
                description="تعطيل حل أسماء DNS",
                severity="high",
                category="network"
            ),

            # ── تجارب الموارد ──
            ChaosExperiment(
                name="memory_pressure",
                description="ضغط على الذاكرة (90% استخدام)",
                severity="high",
                category="resource"
            ),
            ChaosExperiment(
                name="cpu_spike",
                description="ارتفاع مفاجئ في المعالج",
                severity="medium",
                category="resource"
            ),
            ChaosExperiment(
                name="disk_full",
                description="امتلاء القرص",
                severity="critical",
                category="resource"
            ),

            # ── تجارب الاعتماديات ──
            ChaosExperiment(
                name="dependency_timeout",
                description="مهلة في الاعتماديات الخارجية",
                severity="medium",
                category="dependency"
            ),

            # ── تجارب البيانات ──
            ChaosExperiment(
                name="malformed_input",
                description="إدخال بيانات مشوهة",
                severity="low",
                category="data"
            ),
        ]

        self.experiments = experiments
        return experiments

    def execute_all(self) -> dict:
        """ينفذ كل تجارب الفوضى بالتتابع"""
        if not self.experiments:
            self.design_experiments()

        print(f"  🌪️ Starting Chaos Engineering: {len(self.experiments)} experiments")

        for exp in self.experiments:
            print(f"    🔬 {exp.name} ({exp.severity})...")
            self._execute_experiment(exp)

            # إذا كان التطبيق قد تحطم، نعيد تشغيله قبل التجربة التالية
            if exp.result == "crashed":
                self._wait_for_recovery()

        self._summarize_results()
        return self.results_summary

    def _execute_experiment(self, exp: ChaosExperiment):
        """ينفذ تجربة فوضى واحدة"""

        # 1. قياس الأداء قبل الفوضى (Baseline)
        baseline_time = self._measure_response_time()

        # 2. حقن الفوضى
        chaos_applied = self._inject_chaos(exp)

        if not chaos_applied:
            exp.executed = False
            exp.result = "skipped"
            exp.detail = "Could not apply chaos injection"
            return

        # 3. الانتظار قليلاً لتأثير الفوضى
        time.sleep(3)

        # 4. قياس الأداء أثناء الفوضى
        chaos_time = self._measure_response_time()

        # 5. التحقق من أن التطبيق لا يزال حياً
        is_alive = self._check_alive()

        # 6. إزالة الفوضى
        self._remove_chaos(exp)

        # 7. قياس وقت التعافي
        recovery_start = time.time()
        self._wait_for_recovery(max_wait=15)
        recovery_time = (time.time() - recovery_start) * 1000

        # 8. تحليل النتائج
        exp.executed = True

        if not is_alive:
            exp.result = "crashed"
            exp.detail = f"Application crashed under {exp.name}. Baseline: {baseline_time}ms"
        elif chaos_time > baseline_time * 3:
            exp.result = "degraded"
            exp.detail = f"Performance degraded {chaos_time/baseline_time:.1f}x. Baseline: {baseline_time}ms → Chaos: {chaos_time}ms"
        else:
            exp.result = "resilient"
            exp.detail = f"Resilient! Baseline: {baseline_time}ms → Chaos: {chaos_time}ms"

        exp.recovery_time_ms = round(recovery_time, 2)

        print(f"      → {exp.result.upper()}: {exp.detail}")

    def _inject_chaos(self, exp: ChaosExperiment) -> bool:
        """يحقن نوع الفوضى المناسب"""

        try:
            if exp.name == "network_latency_injection":
                subprocess.run(
                    ["docker", "exec", self.container_name, "sh", "-c",
                     "tc qdisc add dev eth0 root netem delay 500ms 2>/dev/null || true"],
                    capture_output=True, timeout=10
                )
                return True

            elif exp.name == "network_packet_loss":
                subprocess.run(
                    ["docker", "exec", self.container_name, "sh", "-c",
                     "tc qdisc add dev eth0 root netem loss 20% 2>/dev/null || true"],
                    capture_output=True, timeout=10
                )
                return True

            elif exp.name == "memory_pressure":
                subprocess.run(
                    ["docker", "exec", "-d", self.container_name, "sh", "-c",
                     "python3 -c 'import array,time; a=array.array(\"b\",[0]*(200*1024*1024)); time.sleep(30)' 2>/dev/null || true"],
                    capture_output=True, timeout=10
                )
                return True

            elif exp.name == "cpu_spike":
                subprocess.run(
                    ["docker", "exec", "-d", self.container_name, "sh", "-c",
                     "yes > /dev/null &"],
                    capture_output=True, timeout=10
                )
                return True

            elif exp.name == "disk_full":
                subprocess.run(
                    ["docker", "exec", "-d", self.container_name, "sh", "-c",
                     "dd if=/dev/zero of=/tmp/fill.disk bs=1M count=100 2>/dev/null &"],
                    capture_output=True, timeout=10
                )
                return True

            elif exp.name == "dns_failure":
                subprocess.run(
                    ["docker", "exec", self.container_name, "sh", "-c",
                     "echo nameserver 0.0.0.0 > /etc/resolv.conf 2>/dev/null || true"],
                    capture_output=True, timeout=10
                )
                return True

            elif exp.name == "malformed_input":
                # يتم عبر المجسات لا عبر الحاوية مباشرة
                return True

            elif exp.name == "dependency_timeout":
                subprocess.run(
                    ["docker", "exec", self.container_name, "sh", "-c",
                     "tc qdisc add dev eth0 root netem delay 5000ms 2>/dev/null || true"],
                    capture_output=True, timeout=10
                )
                return True

        except Exception as e:
            print(f"      Chaos injection failed: {e}")
            return False

        return False

    def _remove_chaos(self, exp: ChaosExperiment):
        """يزيل الفوضى ويعيد الوضع الطبيعي"""
        try:
            subprocess.run(
                ["docker", "exec", self.container_name, "sh", "-c",
                 "tc qdisc del dev eth0 root 2>/dev/null || true"],
                capture_output=True, timeout=10
            )
            subprocess.run(
                ["docker", "exec", self.container_name, "sh", "-c",
                 "pkill -f yes 2>/dev/null; pkill -f tail 2>/dev/null; rm -f /tmp/fill.disk 2>/dev/null || true"],
                capture_output=True, timeout=10
            )
        except Exception:
            pass

    def _measure_response_time(self) -> float:
        """يقيس وقت استجابة التطبيق"""
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{time_total}",
                 "--max-time", "10", f"{self.base_url}/"],
                capture_output=True, text=True, timeout=15
            )
            return float(result.stdout.strip()) * 1000
        except Exception:
            return 99999  # قيمة عالية تعني فشل

    def _check_alive(self) -> bool:
        """يتحقق من أن التطبيق لا يزال يستجيب"""
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                 "--max-time", "5", f"{self.base_url}/"],
                capture_output=True, text=True, timeout=10
            )
            code = result.stdout.strip()
            return bool(code) and code != "000" and int(code) < 500
        except Exception:
            return False

    def _wait_for_recovery(self, max_wait: int = 30) -> bool:
        """ينتظر تعافي التطبيق بعد إزالة الفوضى"""
        start = time.time()
        while time.time() - start < max_wait:
            if self._check_alive():
                return True
            time.sleep(2)
        return False

    def _summarize_results(self):
        """يلخص نتائج كل التجارب"""
        for exp in self.experiments:
            if not exp.executed:
                continue
            self.results_summary["total_experiments"] += 1
            if exp.result == "resilient":
                self.results_summary["resilient"] += 1
            elif exp.result == "degraded":
                self.results_summary["degraded"] += 1
            elif exp.result == "crashed":
                self.results_summary["crashed"] += 1
                if exp.severity in ["high", "critical"]:
                    self.results_summary["critical_weaknesses"].append({
                        "experiment": exp.name,
                        "detail": exp.detail,
                        "severity": exp.severity
                    })
