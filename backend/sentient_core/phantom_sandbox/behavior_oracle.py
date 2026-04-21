# phantom_sandbox/behavior_oracle.py

import re
import subprocess
import time
from pathlib import Path


class BehaviorOracle:
    """
    الأوراكل السلوكي: يقارن سلوك الكود القديم مع الجديد
    يكتشف التغيرات غير المقصودة في السلوك (Regression)
    """

    def __init__(self, repo_path: str, container_name: str, base_url: str):
        self.repo_path = repo_path
        self.container_name = container_name
        self.new_url = base_url
        self.baseline_url = None
        self.baseline_container = None
        self.divergences: list = []

    def spawn_baseline(self, main_branch: str = "main") -> bool:
        """
        يبني نسخة خط الأساس (النسخة الحالية من الفرع الرئيسي)
        ويشغلها على منفذ مختلف
        """
        print("  🔮 Spawning baseline (current main) for comparison...")

        # نحفظ التغييرات الحالية
        subprocess.run(["git", "stash"], cwd=self.repo_path, capture_output=True)

        # ننتقل للفرع الرئيسي
        subprocess.run(["git", "checkout", main_branch], cwd=self.repo_path, capture_output=True)

        baseline_name = f"baseline_{int(time.time())}"

        # نحاول بناء Dockerfile إذا وُجد
        dockerfile = Path(self.repo_path) / "Dockerfile"
        if not dockerfile.exists():
            subprocess.run(["git", "stash", "pop"], cwd=self.repo_path, capture_output=True)
            subprocess.run(["git", "checkout", "-"], cwd=self.repo_path, capture_output=True)
            print("  ⚠️ No Dockerfile found for baseline comparison")
            return False

        # بناء
        build_result = subprocess.run(
            ["docker", "build", "-t", baseline_name, self.repo_path],
            capture_output=True, text=True, timeout=300
        )

        if build_result.returncode != 0:
            subprocess.run(["git", "stash", "pop"], cwd=self.repo_path, capture_output=True)
            subprocess.run(["git", "checkout", "-"], cwd=self.repo_path, capture_output=True)
            print("  ⚠️ Baseline build failed")
            return False

        # تشغيل على منفذ مختلف
        run_result = subprocess.run(
            ["docker", "run", "-d", "--name", f"{baseline_name}_container",
             "-p", "0:8000",
             "--network", "phantom_net",
             baseline_name],
            capture_output=True, text=True, timeout=30
        )

        # العودة للفرع الأصلي
        subprocess.run(["git", "stash", "pop"], cwd=self.repo_path, capture_output=True)
        subprocess.run(["git", "checkout", "-"], cwd=self.repo_path, capture_output=True)

        if run_result.returncode != 0:
            print("  ⚠️ Baseline run failed")
            return False

        # نجد المنفذ الحقيقي
        port_result = subprocess.run(
            ["docker", "port", f"{baseline_name}_container", "8000"],
            capture_output=True, text=True
        )

        if port_result.stdout:
            host_port = port_result.stdout.strip().split(":")[-1]
            self.baseline_url = f"http://localhost:{host_port}"
            self.baseline_container = f"{baseline_name}_container"

            time.sleep(5)
            print(f"  🔮 Baseline alive at {self.baseline_url}")
            return True

        return False

    def compare_behaviors(self, endpoints: list) -> dict:
        """يقارن سلوك النسختين لنفس الطلبات"""
        if not self.baseline_url:
            return {"error": "No baseline available for comparison"}

        print(f"  🔮 Comparing behaviors across {len(endpoints)} endpoints...")

        comparison_report = {
            "total_comparisons": 0,
            "identical": 0,
            "divergent": 0,
            "divergences": [],
        }

        for endpoint in endpoints:
            path = endpoint.get("path", "/")
            method = endpoint.get("method", "GET")

            new_response = self._send_test_request(self.new_url, path, method)
            old_response = self._send_test_request(self.baseline_url, path, method)

            comparison_report["total_comparisons"] += 1

            if self._responses_match(old_response, new_response):
                comparison_report["identical"] += 1
            else:
                comparison_report["divergent"] += 1
                divergence = {
                    "endpoint": path,
                    "method": method,
                    "old_status": old_response.get("status_code"),
                    "new_status": new_response.get("status_code"),
                    "old_response_time_ms": old_response.get("response_time_ms"),
                    "new_response_time_ms": new_response.get("response_time_ms"),
                    "old_body_preview": old_response.get("body", "")[:200],
                    "new_body_preview": new_response.get("body", "")[:200],
                    "type": self._classify_divergence(old_response, new_response),
                }
                comparison_report["divergences"].append(divergence)
                self.divergences.append(divergence)

        print(f"  🔮 Comparison: {comparison_report['identical']}/{comparison_report['total_comparisons']} identical, "
              f"{comparison_report['divergent']} divergent")

        return comparison_report

    def _send_test_request(self, base_url: str, path: str, method: str) -> dict:
        """يرسل طلب اختبار ويعيد استجابة مفصلة"""
        url = f"{base_url}{path}"
        try:
            result = subprocess.run(
                ["curl", "-s", "-i", "-X", method,
                 "-H", "Content-Type: application/json",
                 "--max-time", "10", url],
                capture_output=True, text=True, timeout=15
            )
            output = result.stdout

            # استخراج كود الحالة
            status_match = re.search(r'HTTP/\S+\s+(\d+)', output)
            status_code = int(status_match.group(1)) if status_match else None

            # استخراج الجسم
            body = output.split("\r\n\r\n", 1)[-1] if "\r\n\r\n" in output else output

            # وقت الاستجابة
            time_result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{time_total}",
                 "--max-time", "10", url],
                capture_output=True, text=True, timeout=15
            )
            resp_time = float(time_result.stdout.strip()) * 1000 if time_result.stdout.strip() else 0

            return {
                "status_code": status_code,
                "body": body[:500],
                "response_time_ms": round(resp_time, 2),
            }
        except Exception:
            return {"status_code": None, "body": "", "response_time_ms": 0}

    def _responses_match(self, old: dict, new: dict) -> bool:
        """يتحقق من تطابق الاستجابات"""
        if old.get("status_code") != new.get("status_code"):
            return False

        old_time = old.get("response_time_ms", 0)
        new_time = new.get("response_time_ms", 0)
        return not (old_time > 0 and new_time > old_time * 5)

    def _classify_divergence(self, old: dict, new: dict) -> str:
        """يصنف نوع الاختلاف"""
        old_status = old.get("status_code")
        new_status = new.get("status_code")

        if old_status and new_status:
            if old_status < 400 and new_status >= 500:
                return "REGRESSION_CRASH"
            elif old_status < 400 and 400 <= new_status < 500:
                return "REGRESSION_BEHAVIOR"
            elif old_status >= 500 and new_status < 400:
                return "IMPROVEMENT"

        old_time = old.get("response_time_ms", 0)
        new_time = new.get("response_time_ms", 0)
        if new_time > old_time * 3:
            return "PERFORMANCE_REGRESSION"

        return "UNKNOWN_DIVERGENCE"

    def cleanup_baseline(self):
        """يزيل حاوية خط الأساس"""
        if self.baseline_container:
            try:
                subprocess.run(["docker", "kill", self.baseline_container],
                               capture_output=True, timeout=10)
                subprocess.run(["docker", "rm", "-f", self.baseline_container],
                               capture_output=True, timeout=10)
            except Exception:
                pass
