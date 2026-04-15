# phantom_sandbox/phantom_probes.py

import re
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class ProbeResult:
    """نتيجة مجس واحد"""
    probe_name: str
    probe_type: str      # "http", "graphql", "websocket", "stress", "fuzz"
    target_url: str
    status_code: int | None = None
    response_time_ms: float = 0.0
    response_body: str = ""
    is_healthy: bool = True
    anomaly_detected: bool = False
    anomaly_detail: str = ""
    timestamp: float = field(default_factory=time.time)


class PhantomProbes:
    """
    المجسات الشبحية: كائنات اختبار ذكية تكتشف نقاط النهاية
    تلقائياً وترسل طلبات مصممة بعناية لكل نوع
    """

    STRAIN_PATIENT = "patient"        # صبور: يرسل طلبات عادية بهدوء
    STRAIN_SNEAKY = "sneaky"          # متسلل: يرسل بيانات مشوهة بصمت
    STRAIN_AGGRESSIVE = "aggressive"  # عدواني: يضرب بسرعة وعنف
    STRAIN_CHAOTIC = "chaotic"        # فوضوي: يرسل بيانات عشوائية

    def __init__(self, base_url: str, project_dna: dict):
        self.base_url = base_url
        self.dna = project_dna
        self.discovered_endpoints: list[dict] = []
        self.probe_results: list[ProbeResult] = []
        self.anomalies: list[dict] = []

    def discover_endpoints(self) -> list[dict]:
        """
        الاكتشاف: يقرأ الكود المصدري ويجد كل نقاط النهاية
        """
        endpoints = []
        repo = Path(self.dna.get("repo_path", "."))

        # ── قراءة ملفات التوجيه (Routes) ──
        if self.dna.get("language") == "python":
            if self.dna.get("framework") == "fastapi":
                endpoints.extend(self._discover_fastapi_routes(repo))
            elif self.dna.get("framework") == "flask":
                endpoints.extend(self._discover_flask_routes(repo))
            elif self.dna.get("framework") == "django":
                endpoints.extend(self._discover_django_routes(repo))

        elif self.dna.get("language") == "node":
            if self.dna.get("framework") == "express":
                endpoints.extend(self._discover_express_routes(repo))
            elif self.dna.get("framework") == "nextjs":
                endpoints.extend(self._discover_nextjs_routes(repo))

        # ── نقاط نهاية شائعة نختبرها دائماً ──
        common_endpoints = [
            {"path": "/", "method": "GET", "type": "root"},
            {"path": "/health", "method": "GET", "type": "health"},
            {"path": "/healthz", "method": "GET", "type": "health"},
            {"path": "/api", "method": "GET", "type": "api_root"},
            {"path": "/api/v1", "method": "GET", "type": "api_versioned"},
            {"path": "/docs", "method": "GET", "type": "docs"},
            {"path": "/swagger", "method": "GET", "type": "docs"},
            {"path": "/openapi.json", "method": "GET", "type": "schema"},
            {"path": "/graphql", "method": "POST", "type": "graphql"},
            {"path": "/.env", "method": "GET", "type": "security"},   # فخ أمني!
            {"path": "/admin", "method": "GET", "type": "security"},
            {"path": "/debug", "method": "GET", "type": "security"},
            {"path": "/.git", "method": "GET", "type": "security"},
        ]

        existing_paths = {e["path"] for e in endpoints}
        for ep in common_endpoints:
            if ep["path"] not in existing_paths:
                endpoints.append(ep)
                existing_paths.add(ep["path"])

        self.discovered_endpoints = endpoints
        print(f"  🔍 Discovered {len(endpoints)} endpoints to probe")
        return endpoints

    def _discover_fastapi_routes(self, repo: Path) -> list[dict]:
        """يستخرج مسارات FastAPI من الكود المصدري"""
        endpoints = []
        for py_file in repo.rglob("*.py"):
            try:
                content = py_file.read_text(errors='ignore')
                patterns = [
                    r'@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)["\']',
                ]
                for pattern in patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    for method, path in matches:
                        endpoints.append({
                            "path": path,
                            "method": method.upper(),
                            "type": "api",
                            "source": str(py_file.relative_to(repo))
                        })
            except Exception:
                pass
        return endpoints

    def _discover_flask_routes(self, repo: Path) -> list[dict]:
        """يستخرج مسارات Flask من الكود المصدري"""
        endpoints = []
        for py_file in repo.rglob("*.py"):
            try:
                content = py_file.read_text(errors='ignore')
                matches = re.findall(
                    r'@app\.route\s*\(\s*["\']([^"\']+)["\'].*?(?:methods\s*=\s*\[([^\]]+)\])?',
                    content, re.DOTALL
                )
                for path, methods in matches:
                    method_list = re.findall(r'["\'](\w+)["\']', methods) if methods else ["GET"]
                    for method in method_list:
                        endpoints.append({
                            "path": path,
                            "method": method.upper(),
                            "type": "api",
                            "source": str(py_file.relative_to(repo))
                        })
            except Exception:
                pass
        return endpoints

    def _discover_django_routes(self, repo: Path) -> list[dict]:
        """يستخرج مسارات Django من ملفات urls.py"""
        endpoints = []
        for urls_file in repo.rglob("urls.py"):
            try:
                content = urls_file.read_text(errors='ignore')
                matches = re.findall(r'path\s*\(\s*["\']([^"\']+)["\']', content)
                for path in matches:
                    endpoints.append({
                        "path": f"/{path}" if not path.startswith("/") else path,
                        "method": "GET",
                        "type": "api",
                        "source": str(urls_file.relative_to(repo))
                    })
            except Exception:
                pass
        return endpoints

    def _discover_express_routes(self, repo: Path) -> list[dict]:
        """يستخرج مسارات Express من الكود المصدري"""
        endpoints = []
        for js_file in list(repo.rglob("*.js")) + list(repo.rglob("*.ts")):
            try:
                content = js_file.read_text(errors='ignore')
                matches = re.findall(
                    r'\.(get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)["\']',
                    content
                )
                for method, path in matches:
                    endpoints.append({
                        "path": path,
                        "method": method.upper(),
                        "type": "api",
                        "source": str(js_file.relative_to(repo))
                    })
            except Exception:
                pass
        return endpoints

    def _discover_nextjs_routes(self, repo: Path) -> list[dict]:
        """يستخرج مسارات Next.js من بنية المجلدات"""
        endpoints = []
        for route_file in repo.rglob("page.tsx"):
            rel = route_file.relative_to(repo)
            parts = str(rel).split("/")
            if "app" in parts:
                idx = parts.index("app")
                path_parts = parts[idx+1:-1]
                path = "/" + "/".join(
                    p for p in path_parts
                    if not p.startswith("(") and not p.startswith("[")
                )
                endpoints.append({
                    "path": path,
                    "method": "GET",
                    "type": "page",
                    "source": str(rel)
                })
        return endpoints

    def launch_all_probes(self) -> dict:
        """إطلاق كل المجسات نحو التطبيق"""
        if not self.discovered_endpoints:
            self.discover_endpoints()

        results = {
            "total_probes": 0,
            "successful": 0,
            "failed": 0,
            "anomalies": 0,
            "security_alerts": 0,
            "performance_issues": 0,
            "details": []
        }

        for endpoint in self.discovered_endpoints:
            # ── المجس الصبور ──
            result = self._launch_probe(endpoint, self.STRAIN_PATIENT)
            self.probe_results.append(result)
            results["total_probes"] += 1

            if result.is_healthy and not result.anomaly_detected:
                results["successful"] += 1
            elif result.anomaly_detected:
                results["anomalies"] += 1
                self.anomalies.append({
                    "endpoint": endpoint["path"],
                    "type": result.anomaly_detail,
                    "strain": result.probe_type
                })
            else:
                results["failed"] += 1

            # ── فحوصات أمنية خاصة ──
            if endpoint.get("type") == "security":
                if result.status_code and result.status_code < 400:
                    results["security_alerts"] += 1
                    self.anomalies.append({
                        "endpoint": endpoint["path"],
                        "type": "SECURITY_EXPOSURE",
                        "detail": f"Sensitive endpoint returned {result.status_code}",
                        "severity": "CRITICAL"
                    })

            # ── فحص الأداء ──
            if result.response_time_ms > 2000:
                results["performance_issues"] += 1
                self.anomalies.append({
                    "endpoint": endpoint["path"],
                    "type": "PERFORMANCE_DEGRADATION",
                    "detail": f"Response time: {result.response_time_ms}ms",
                    "severity": "WARNING"
                })

            # ── المجس المتسلل (فقط لنقاط API) ──
            if endpoint.get("type") == "api" and endpoint["method"] in ["POST", "PUT", "PATCH"]:
                sneaky_result = self._launch_probe(endpoint, self.STRAIN_SNEAKY)
                self.probe_results.append(sneaky_result)
                results["total_probes"] += 1

                if sneaky_result.anomaly_detected:
                    results["anomalies"] += 1
                    self.anomalies.append({
                        "endpoint": endpoint["path"],
                        "type": "FUZZING_VULNERABILITY",
                        "detail": sneaky_result.anomaly_detail,
                        "severity": "HIGH"
                    })

        print(f"  🎯 Probe Results: {results['successful']}/{results['total_probes']} healthy, "
              f"{results['anomalies']} anomalies, {results['security_alerts']} security alerts")

        return results

    def _launch_probe(self, endpoint: dict, strain: str) -> ProbeResult:
        """يطلق مجساً واحداً بناءً على السلالة"""

        url = f"{self.base_url}{endpoint['path']}"
        method = endpoint.get("method", "GET")
        probe_name = f"{strain}_{method}_{endpoint['path']}"

        result = ProbeResult(
            probe_name=probe_name,
            probe_type=strain,
            target_url=url
        )

        curl_cmd = self._build_curl_command(url, method, strain)

        try:
            start = time.time()
            proc = subprocess.run(
                curl_cmd,
                capture_output=True,
                text=True,
                timeout=10
            )
            result.response_time_ms = round((time.time() - start) * 1000, 2)

            output = proc.stdout + proc.stderr
            status_match = re.search(r'HTTP/\S+\s+(\d+)', output)
            if status_match:
                result.status_code = int(status_match.group(1))

            result.response_body = output[:2000]

            if result.status_code:
                if 200 <= result.status_code < 300:
                    result.is_healthy = True
                elif result.status_code in [401, 403]:
                    result.is_healthy = True  # محمي = صحي
                elif result.status_code >= 500:
                    result.is_healthy = False
                    result.anomaly_detected = True
                    result.anomaly_detail = f"Server error: {result.status_code}"
            else:
                result.is_healthy = False
                result.anomaly_detected = True
                result.anomaly_detail = "No response received"

        except subprocess.TimeoutExpired:
            result.is_healthy = False
            result.anomaly_detected = True
            result.anomaly_detail = "Request timeout (10s)"
            result.response_time_ms = 10000

        except Exception as e:
            result.is_healthy = False
            result.anomaly_detected = True
            result.anomaly_detail = f"Probe error: {str(e)}"

        return result

    def _build_curl_command(self, url: str, method: str, strain: str) -> list:
        """يبني أمر curl حسب السلالة"""

        base = ["curl", "-s", "-i", "-X", method]

        if strain == self.STRAIN_PATIENT:
            base.extend([
                "-H", "Content-Type: application/json",
                "-H", "Accept: application/json",
                "--max-time", "10",
                url
            ])

        elif strain == self.STRAIN_SNEAKY:
            import random
            payloads = [
                '{"id": "1 OR 1=1"}',
                '{"name": "<script>alert(1)</script>"}',
                '{"data": "' + "A" * 1000 + '"}',
                '{"__proto__": {"admin": true}}',
                '{"$where": "sleep(5000)"}',
            ]
            payload = random.choice(payloads)
            base.extend([
                "-H", "Content-Type: application/json",
                "-d", payload,
                "--max-time", "10",
                url
            ])

        elif strain == self.STRAIN_AGGRESSIVE:
            base.extend([
                "-H", "Content-Type: application/json",
                "-H", "X-Forwarded-For: 127.0.0.1",
                "--max-time", "5",
                url
            ])

        elif strain == self.STRAIN_CHAOTIC:
            import random
            import string
            random_data = ''.join(random.choices(
                string.ascii_letters + string.digits,
                k=500
            ))
            base.extend([
                "-H", "Content-Type: text/plain",
                "-d", random_data,
                "--max-time", "10",
                url
            ])

        return base

    def run_stress_test(self, endpoint_path: str = "/", duration: int = 10, concurrency: int = 5) -> dict:
        """
        اختبار الإجهاد: يضرب نقطة نهاية واحدة بطلبات متوازية
        """
        url = f"{self.base_url}{endpoint_path}"

        stress_report = {
            "endpoint": endpoint_path,
            "duration_seconds": duration,
            "concurrency": concurrency,
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_response_time_ms": 0,
            "max_response_time_ms": 0,
            "errors_under_stress": [],
            "crash_detected": False,
        }

        response_times = []

        print(f"  💪 Stress testing {url} for {duration}s with {concurrency} concurrent requests...")

        start_time = time.time()
        while time.time() - start_time < duration:
            processes = []
            for _ in range(concurrency):
                proc = subprocess.Popen(
                    ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}:%{time_total}",
                     "--max-time", "5", url],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                processes.append(proc)

            for proc in processes:
                try:
                    out, _ = proc.communicate(timeout=10)
                    output = out.decode().strip()
                    stress_report["total_requests"] += 1

                    if ":" in output:
                        status, time_str = output.split(":", 1)
                        try:
                            resp_time = float(time_str) * 1000
                            response_times.append(resp_time)

                            if status.startswith("2") or status.startswith("3"):
                                stress_report["successful_requests"] += 1
                            elif status.startswith("5"):
                                stress_report["failed_requests"] += 1
                                stress_report["errors_under_stress"].append(f"HTTP {status}")
                        except Exception:
                            pass
                    else:
                        stress_report["failed_requests"] += 1

                except Exception:
                    stress_report["failed_requests"] += 1
                    stress_report["crash_detected"] = True

            time.sleep(0.5)

        if response_times:
            stress_report["avg_response_time_ms"] = round(sum(response_times) / len(response_times), 2)
            stress_report["max_response_time_ms"] = round(max(response_times), 2)

        if stress_report["total_requests"] > 0:
            failure_rate = stress_report["failed_requests"] / stress_report["total_requests"] * 100
            if failure_rate > 50:
                stress_report["crash_detected"] = True

        print(f"  💪 Stress test complete: {stress_report['successful_requests']}/{stress_report['total_requests']} OK, "
              f"avg {stress_report['avg_response_time_ms']}ms, "
              f"crash={'YES' if stress_report['crash_detected'] else 'NO'}")

        return stress_report
