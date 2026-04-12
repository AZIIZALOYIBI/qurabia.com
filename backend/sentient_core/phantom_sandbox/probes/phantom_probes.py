"""
phantom_sandbox.probes.phantom_probes
═══════════════════════════════════════
المجسات الشبحية — نظام اختبار متعدد السلالات.

السلالات الأربع:
  PATIENT    — طلبات قياسية، تُقيس الصحة الأساسية
  SNEAKY     — حقن SQL/XSS/NoSQL، تُقيّم المرونة الأمنية
  AGGRESSIVE — تعدد متوازٍ، تختبر حدود التزامن
  CHAOTIC    — بيانات عشوائية، تُطارد حالات الحافة
"""

from __future__ import annotations

import asyncio
import random
import re
import string
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from phantom_sandbox.config.settings import get_settings
from phantom_sandbox.core.types import (
    AlertSeverity,
    ProbeReport,
    ProbeResult,
    ProbeStrain,
    ProjectDNA,
)
from phantom_sandbox.telemetry.tracer import PhantomLogger, PhantomTracer


# ─────────────────────────────────────────────────────────────
#  Endpoint
# ─────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class Endpoint:
    """نقطة نهاية HTTP — وصف ثابت غير قابل للتعديل."""
    path:   str
    method: str = "GET"
    kind:   str = "api"
    source: str = ""


# ─────────────────────────────────────────────────────────────
#  EndpointDiscoverer
# ─────────────────────────────────────────────────────────────

class EndpointDiscoverer:
    """
    يُجري تحليلاً ستاتيكياً للكود المصدري لاستخراج نقاط النهاية.
    لا يخمن ولا يفترض — يقرأ الحقيقة مباشرةً من الكود.
    """

    _COMMON: list[Endpoint] = [
        Endpoint("/",             "GET",  "page"),
        Endpoint("/health",       "GET",  "health"),
        Endpoint("/healthz",      "GET",  "health"),
        Endpoint("/ready",        "GET",  "health"),
        Endpoint("/api",          "GET",  "api"),
        Endpoint("/api/v1",       "GET",  "api"),
        Endpoint("/docs",         "GET",  "docs"),
        Endpoint("/openapi.json", "GET",  "docs"),
        Endpoint("/swagger",      "GET",  "docs"),
        Endpoint("/graphql",      "POST", "graphql"),
        # نقاط حساسة
        Endpoint("/.env",         "GET",  "security"),
        Endpoint("/.git/config",  "GET",  "security"),
        Endpoint("/admin",        "GET",  "security"),
        Endpoint("/debug",        "GET",  "security"),
        Endpoint("/config",       "GET",  "security"),
        Endpoint("/secrets",      "GET",  "security"),
    ]

    def __init__(self, repo_path: Path, dna: ProjectDNA) -> None:
        self._repo = repo_path
        self._dna  = dna

    def discover(self) -> list[Endpoint]:
        """يُعيد قائمة موحّدة من نقاط النهاية المكتشفة."""
        from phantom_sandbox.core.types import Framework, Language

        discovered: list[Endpoint] = []

        if self._dna.language == Language.PYTHON:
            if self._dna.framework == Framework.FASTAPI:
                discovered.extend(self._scan_fastapi())
            elif self._dna.framework == Framework.FLASK:
                discovered.extend(self._scan_flask())
            elif self._dna.framework == Framework.DJANGO:
                discovered.extend(self._scan_django())
        elif self._dna.language == Language.NODE:
            if self._dna.framework == Framework.EXPRESS:
                discovered.extend(self._scan_express())
            elif self._dna.framework == Framework.NEXTJS:
                discovered.extend(self._scan_nextjs())

        existing = {ep.path for ep in discovered}
        for ep in self._COMMON:
            if ep.path not in existing:
                discovered.append(ep)
                existing.add(ep.path)

        return discovered[:get_settings().probe_max_endpoints]

    def _scan_fastapi(self) -> list[Endpoint]:
        pattern = re.compile(
            r'@(?:app|router)\.(get|post|put|delete|patch|head|options)'
            r'\s*\(\s*["\']([^"\']+)["\']',
            re.IGNORECASE,
        )
        return self._scan_python_files(pattern)

    def _scan_flask(self) -> list[Endpoint]:
        endpoints: list[Endpoint] = []
        pattern = re.compile(
            r'@\w+\.route\s*\(\s*["\']([^"\']+)["\']'
            r'(?:.*?methods\s*=\s*\[([^\]]+)\])?',
            re.DOTALL,
        )
        for py_file in self._repo.rglob("*.py"):
            try:
                content = py_file.read_text(errors="ignore")
                for m in pattern.finditer(content):
                    path    = m.group(1)
                    methods = re.findall(r'["\'](\w+)["\']', m.group(2) or "")
                    for meth in (methods or ["GET"]):
                        endpoints.append(Endpoint(
                            path=path, method=meth.upper(), kind="api",
                            source=str(py_file.relative_to(self._repo)),
                        ))
            except OSError:
                pass
        return endpoints

    def _scan_django(self) -> list[Endpoint]:
        endpoints: list[Endpoint] = []
        for urls_file in self._repo.rglob("urls.py"):
            try:
                content = urls_file.read_text(errors="ignore")
                for m in re.finditer(r'path\s*\(\s*["\']([^"\']+)["\']', content):
                    path = m.group(1)
                    if not path.startswith("/"):
                        path = "/" + path
                    endpoints.append(Endpoint(
                        path=path, method="GET", kind="api",
                        source=str(urls_file.relative_to(self._repo)),
                    ))
            except OSError:
                pass
        return endpoints

    def _scan_express(self) -> list[Endpoint]:
        pattern = re.compile(
            r'\.(get|post|put|delete|patch|all)\s*\(\s*["\']([^"\']+)["\']',
        )
        endpoints: list[Endpoint] = []
        for js_file in (list(self._repo.rglob("*.js")) + list(self._repo.rglob("*.ts"))):
            try:
                content = js_file.read_text(errors="ignore")
                for m in pattern.finditer(content):
                    endpoints.append(Endpoint(
                        path=m.group(2), method=m.group(1).upper(), kind="api",
                        source=str(js_file.relative_to(self._repo)),
                    ))
            except OSError:
                pass
        return endpoints

    def _scan_nextjs(self) -> list[Endpoint]:
        endpoints: list[Endpoint] = []
        for page_file in self._repo.rglob("page.tsx"):
            rel   = page_file.relative_to(self._repo)
            parts = rel.parts
            if "app" in parts:
                idx        = list(parts).index("app")
                path_parts = [
                    p for p in parts[idx + 1: -1]
                    if not p.startswith("(") and not p.startswith("[")
                ]
                path = "/" + "/".join(path_parts) if path_parts else "/"
                endpoints.append(Endpoint(path=path, method="GET", kind="page"))
        return endpoints

    def _scan_python_files(self, pattern: re.Pattern) -> list[Endpoint]:
        endpoints: list[Endpoint] = []
        for py_file in self._repo.rglob("*.py"):
            try:
                content = py_file.read_text(errors="ignore")
                for m in pattern.finditer(content):
                    method = m.group(1).upper()
                    path   = m.group(2)
                    endpoints.append(Endpoint(
                        path=path, method=method, kind="api",
                        source=str(py_file.relative_to(self._repo)),
                    ))
            except OSError:
                pass
        return endpoints


# ─────────────────────────────────────────────────────────────
#  PayloadFactory
# ─────────────────────────────────────────────────────────────

class PayloadFactory:
    """مصنع الحمولات — يُنتج بيانات اختبار لكل سلالة."""

    _SNEAKY_PAYLOADS: list[str] = [
        '{"id": "1 OR 1=1 --"}',
        '{"name": "<script>alert(document.cookie)</script>"}',
        '{"data": "' + "A" * 8192 + '"}',
        '{"__proto__": {"isAdmin": true, "role": "superuser"}}',
        '{"$where": "function(){return sleep(5000)}"}',
        '{"email": "test@test.com\\r\\nBCC: attacker@evil.com"}',
        '{"path": "../../../../etc/passwd"}',
        '{"url": "file:///etc/shadow"}',
    ]

    @classmethod
    def build(cls, strain: ProbeStrain, method: str) -> dict[str, Any]:
        if strain == ProbeStrain.PATIENT:
            return {
                "headers": {
                    "Content-Type": "application/json",
                    "Accept":       "application/json",
                    "User-Agent":   "PhantomProbe/3.0 (AUTDIE-Framework)",
                },
                "content": b"" if method == "GET" else b"{}",
            }
        elif strain == ProbeStrain.SNEAKY:
            payload = random.choice(cls._SNEAKY_PAYLOADS)
            return {
                "headers": {
                    "Content-Type":    "application/json",
                    "X-Forwarded-For": "127.0.0.1",
                },
                "content": payload.encode(),
            }
        elif strain == ProbeStrain.AGGRESSIVE:
            return {
                "headers": {
                    "Content-Type":    "application/json",
                    "X-Forwarded-For": "10.0.0.1",
                    "X-Real-IP":       "192.168.1.1",
                    "Connection":      "keep-alive",
                },
                "content": b'{"stress": true}',
            }
        elif strain == ProbeStrain.CHAOTIC:
            chaos = "".join(
                random.choices(string.printable, k=random.randint(50, 1000))
            )
            return {
                "headers": {"Content-Type": "text/plain"},
                "content": chaos.encode(errors="replace"),
            }
        return {"headers": {}, "content": b""}


# ─────────────────────────────────────────────────────────────
#  PhantomProbes
# ─────────────────────────────────────────────────────────────

class PhantomProbes:
    """
    محرك المجسات الشبحية.
    ينفّذ المجسات بشكل متزامن (asyncio) لتقليل وقت الاختبار.
    """

    def __init__(
        self,
        base_url:  str,
        dna:       ProjectDNA,
        repo_path: Path | None = None,
        tracer:    PhantomTracer | None = None,
    ) -> None:
        self._base_url  = base_url.rstrip("/")
        self._dna       = dna
        self._repo_path = repo_path
        self._settings  = get_settings()
        self._tracer    = tracer or PhantomTracer()
        self._log       = PhantomLogger("probes")
        self._semaphore = asyncio.Semaphore(8)
        self._client:   httpx.AsyncClient | None = None

    async def run(self) -> ProbeReport:
        """يُشغّل دورة المجسات الكاملة."""
        with self._tracer.span("probes_full_cycle", layer="probes") as span:
            self._log.section("PHASE 2: Phantom Probes — Multi-Strain Testing")

            endpoints = self._discover_endpoints()
            self._log.info(f"Discovered {len(endpoints)} endpoints")

            report = ProbeReport()

            async with httpx.AsyncClient(
                timeout=httpx.Timeout(self._settings.probe_timeout_s),
                follow_redirects=True,
                verify=False,
            ) as client:
                self._client = client

                # المجسات الصبورة
                tasks   = [self._probe_endpoint(ep, ProbeStrain.PATIENT) for ep in endpoints]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                for ep, res in zip(endpoints, results):
                    if isinstance(res, Exception):
                        res = self._make_error_result(ep, str(res))
                    report.results.append(res)
                    report.total_probes += 1
                    self._classify_result(res, ep, report)

                # مجسات التسلل على نقاط الكتابة
                write_eps      = [ep for ep in endpoints if ep.method in ("POST", "PUT", "PATCH")]
                sneaky_tasks   = [self._probe_endpoint(ep, ProbeStrain.SNEAKY) for ep in write_eps]
                sneaky_results = await asyncio.gather(*sneaky_tasks, return_exceptions=True)

                for ep, res in zip(write_eps, sneaky_results):
                    if isinstance(res, Exception):
                        res = self._make_error_result(ep, str(res))
                    report.results.append(res)
                    report.total_probes += 1
                    self._classify_result(res, ep, report)

            span.set_ok(
                total=report.total_probes,
                healthy=report.successful,
                anomalies=report.anomalies,
                security=report.security_alerts,
            )
            self._log.metric("probe_health_ratio", round(report.health_ratio * 100, 1), "%")
            return report

    async def run_stress(
        self,
        path:        str = "/",
        duration_s:  int = 15,
        concurrency: int = 5,
    ):
        """اختبار الإجهاد — يُشغّل طلبات متوازية بشكل مستمر."""
        from phantom_sandbox.core.types import StressReport

        self._log.section("PHASE 4: Stress Test")
        url    = f"{self._base_url}{path}"
        report = StressReport(endpoint=path, duration_s=duration_s, concurrency=concurrency)

        response_times: list[float] = []
        deadline = time.monotonic() + duration_s

        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            while time.monotonic() < deadline:
                tasks = [self._single_stress_request(client, url) for _ in range(concurrency)]
                batch = await asyncio.gather(*tasks, return_exceptions=True)

                for item in batch:
                    report.total_requests += 1
                    if isinstance(item, Exception):
                        report.failed += 1
                        report.crash_detected = True
                    else:
                        code, rt_ms = item
                        response_times.append(rt_ms)
                        if 200 <= code < 400:
                            report.successful += 1
                        elif code >= 500:
                            report.failed += 1
                            if len(report.error_samples) < 10:
                                report.error_samples.append(f"HTTP {code}")

                await asyncio.sleep(0.2)

        if response_times:
            rt_sorted = sorted(response_times)
            n         = len(rt_sorted)
            report.avg_response_ms = round(sum(response_times) / n, 2)
            report.max_response_ms = round(rt_sorted[-1], 2)
            report.p95_response_ms = round(rt_sorted[min(int(n * 0.95), n - 1)], 2)
            report.p99_response_ms = round(rt_sorted[min(int(n * 0.99), n - 1)], 2)

        if report.error_rate > self._settings.stress_crash_threshold:
            report.crash_detected = True

        self._log.metric("avg_response", report.avg_response_ms, "ms")
        self._log.metric("p95_response", report.p95_response_ms, "ms")
        self._log.metric("error_rate",   round(report.error_rate * 100, 1), "%")
        return report

    # ── داخلي ──

    async def _probe_endpoint(self, ep: Endpoint, strain: ProbeStrain) -> ProbeResult:
        async with self._semaphore:
            url     = f"{self._base_url}{ep.path}"
            payload = PayloadFactory.build(strain, ep.method)

            result = ProbeResult(
                probe_name=f"{strain.value}_{ep.method}_{ep.path}",
                strain=strain,
                target_url=url,
                method=ep.method,
            )

            start = time.monotonic()
            try:
                response = await self._client.request(
                    method=ep.method,
                    url=url,
                    headers=payload["headers"],
                    content=payload["content"],
                    timeout=self._settings.probe_timeout_s,
                )
                result.response_time_ms = round((time.monotonic() - start) * 1000, 2)
                result.status_code      = response.status_code
                result.response_body    = response.text[:2000]
                result.is_healthy       = self._evaluate_health(response.status_code)

                if response.status_code >= 500:
                    result.anomaly_detected = True
                    result.anomaly_detail   = f"Server error {response.status_code}"
                elif strain == ProbeStrain.SNEAKY and response.status_code < 400:
                    result.anomaly_detected = True
                    result.anomaly_detail   = "Injection payload accepted without rejection"

            except httpx.TimeoutException:
                result.response_time_ms = self._settings.probe_timeout_s * 1000
                result.is_healthy       = False
                result.anomaly_detected = True
                result.anomaly_detail   = f"Timeout after {self._settings.probe_timeout_s}s"
            except Exception as exc:
                result.is_healthy       = False
                result.anomaly_detected = True
                result.anomaly_detail   = str(exc)

            return result

    async def _single_stress_request(
        self, client: httpx.AsyncClient, url: str
    ) -> tuple[int, float]:
        start = time.monotonic()
        try:
            resp = await client.get(url)
            return resp.status_code, (time.monotonic() - start) * 1000
        except Exception:
            return 0, (time.monotonic() - start) * 1000

    def _discover_endpoints(self) -> list[Endpoint]:
        if self._repo_path:
            return EndpointDiscoverer(self._repo_path, self._dna).discover()
        return list(EndpointDiscoverer._COMMON)

    def _classify_result(
        self, result: ProbeResult, ep: Endpoint, report: ProbeReport
    ) -> None:
        if result.is_healthy and not result.anomaly_detected:
            report.successful += 1
        elif result.anomaly_detected:
            report.anomalies += 1
            report.anomaly_details.append({
                "endpoint": ep.path,
                "method":   ep.method,
                "strain":   result.strain.value,
                "detail":   result.anomaly_detail,
                "status":   result.status_code,
            })
        else:
            report.failed += 1

        if ep.kind == "security" and result.status_code and result.status_code < 400:
            report.security_alerts += 1
            report.anomaly_details.append({
                "endpoint": ep.path,
                "type":     "SECURITY_EXPOSURE",
                "severity": "CRITICAL",
                "detail":   f"Sensitive endpoint returned HTTP {result.status_code}",
            })

        if result.response_time_ms > self._settings.immune_response_warn_ms:
            report.performance_issues += 1

    def _evaluate_health(self, status_code: int) -> bool:
        return status_code < 500 and status_code != 0

    def _make_error_result(self, ep: Endpoint, error: str) -> ProbeResult:
        return ProbeResult(
            probe_name=f"error_{ep.method}_{ep.path}",
            target_url=f"{self._base_url}{ep.path}",
            method=ep.method,
            is_healthy=False,
            anomaly_detected=True,
            anomaly_detail=error,
        )
