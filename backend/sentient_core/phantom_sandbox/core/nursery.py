"""
phantom_sandbox.core.nursery
═════════════════════════════
الحاضنة الرقمية — إدارة دورة حياة الحاوية الشبحية.

التصميم مُستوحى من مبدأ الإحاطة الكاملة (Full Encapsulation):
الحاضنة هي المسؤول الوحيد عن ولادة الحاوية وإماتتها،
وكل تفاصيل Docker مُخفية خلف واجهة غير متزامنة نظيفة.

المبدأ الهندسي المُطبَّق:
  - Async-first: كل عملية Docker تعمل بشكل غير متزامن
  - Resource safety: مدير السياق يضمن تنظيف الموارد دائماً
  - Immutable DNA: الـ ProjectDNA لا يتغير بعد الاكتشاف
  - Observability: كل حدث مُسجَّل كـ Span قابل للتتبع
"""

from __future__ import annotations

import asyncio
import shutil
import tempfile
import textwrap
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

from phantom_sandbox.config.settings import get_settings
from phantom_sandbox.core.dna_detector import DNADetector
from phantom_sandbox.core.types import (
    BirthReport,
    ContainerStatus,
    Language,
    ProjectDNA,
)
from phantom_sandbox.telemetry.tracer import PhantomLogger, PhantomTracer

# ─────────────────────────────────────────────────────────────
#  مولّد Dockerfile
# ─────────────────────────────────────────────────────────────

class DockerfileFactory:
    """
    مولّد Dockerfile شبحي — يُنشئ ملف بناء مُحسَّن لكل لغة.
    يُطبّق نمط Template Method: الهيكل العام ثابت والتفاصيل مُجرَّدة.
    """

    PHANTOM_AGENT = textwrap.dedent("""\
        # ═══ PHANTOM MONITORING AGENT ═══
        import os, time, json, threading
        try:
            import psutil
            _PSUTIL = True
        except ImportError:
            _PSUTIL = False

        def _phantom_pulse():
            while True:
                try:
                    payload = {"ts": time.time()}
                    if _PSUTIL:
                        m = psutil.virtual_memory()
                        payload.update({
                            "mem_pct": m.percent,
                            "mem_mb": round(m.used / 1024 / 1024, 2),
                            "cpu_pct": psutil.cpu_percent(interval=None),
                            "pids": len(psutil.pids()),
                        })
                    with open("/tmp/phantom_pulse.json", "w") as _f:
                        json.dump(payload, _f)
                except Exception:
                    pass
                time.sleep(3)

        threading.Thread(target=_phantom_pulse, daemon=True, name="PhantomPulse").start()
        # ═══════════════════════════════════
    """)

    @classmethod
    def generate(cls, dna: ProjectDNA, repo_path: Path) -> str:
        """يولّد محتوى Dockerfile كنص."""
        if dna.language == Language.PYTHON:
            return cls._python_dockerfile(dna, repo_path)
        elif dna.language == Language.NODE:
            return cls._node_dockerfile(dna)
        elif dna.language == Language.GO:
            return cls._go_dockerfile(dna)
        elif dna.language == Language.RUST:
            return cls._rust_dockerfile(dna)
        elif dna.language == Language.RUBY:
            return cls._ruby_dockerfile(dna)
        elif dna.language == Language.JAVA:
            return cls._java_dockerfile(dna)
        else:
            return cls._generic_dockerfile(dna)

    @classmethod
    def _python_dockerfile(cls, dna: ProjectDNA, repo_path: Path) -> str:
        healthcheck = (
            f"HEALTHCHECK --interval=5s --timeout=3s --retries=3 "
            f"CMD python -c \"import urllib.request; "
            f"urllib.request.urlopen('http://localhost:{dna.port}{dna.health_endpoint}')\" "
            f"|| exit 1"
        )
        lines = [
            "FROM python:3.12-slim",
            "ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1",
            "WORKDIR /app",
            "RUN pip install psutil --quiet",
            *(["COPY requirements.txt ."] if (repo_path / "requirements.txt").exists() else []),
            *(["COPY pyproject.toml ."] if (repo_path / "pyproject.toml").exists() else []),
            f"RUN {dna.install_cmd} --quiet 2>&1 | tail -5 || true",
            "COPY . .",
            *([ f"RUN {dna.build_cmd} || true"] if dna.build_cmd else []),
            f"EXPOSE {dna.port}",
            healthcheck,
            f'CMD {dna.run_cmd}',
        ]
        return "\n".join(lines)

    @classmethod
    def _node_dockerfile(cls, dna: ProjectDNA) -> str:
        healthcheck = (
            f"HEALTHCHECK --interval=5s --timeout=3s --retries=3 "
            f"CMD node -e \"require('http').get('http://localhost:{dna.port}"
            f"{dna.health_endpoint}', r=>process.exit(r.statusCode<500?0:1))"
            f".on('error',()=>process.exit(1))\" || exit 1"
        )
        lines = [
            "FROM node:20-slim",
            "WORKDIR /app",
            "COPY package*.json ./",
            f"RUN {dna.install_cmd} --silent 2>/dev/null || {dna.install_cmd}",
            "COPY . .",
            *([ f"RUN {dna.build_cmd}" ] if dna.build_cmd else []),
            f"EXPOSE {dna.port}",
            healthcheck,
            f"CMD {dna.run_cmd}",
        ]
        return "\n".join(lines)

    @classmethod
    def _go_dockerfile(cls, dna: ProjectDNA) -> str:
        return "\n".join([
            "FROM golang:1.22-alpine AS builder",
            "WORKDIR /app",
            "COPY go.* ./",
            "RUN go mod download",
            "COPY . .",
            f"RUN {dna.build_cmd}",
            "FROM gcr.io/distroless/static-debian12",
            "WORKDIR /app",
            "COPY --from=builder /app/_phantom_app .",
            f"EXPOSE {dna.port}",
            'CMD ["./_phantom_app"]',
        ])

    @classmethod
    def _rust_dockerfile(cls, dna: ProjectDNA) -> str:
        binary = dna.run_cmd.split("/")[-1]
        return "\n".join([
            "FROM rust:1.77-slim AS builder",
            "WORKDIR /app",
            "COPY Cargo.* ./",
            "RUN mkdir src && echo 'fn main(){}' > src/main.rs && cargo build --release && rm -rf src",
            "COPY . .",
            "RUN touch src/main.rs && cargo build --release",
            "FROM gcr.io/distroless/cc-debian12",
            "WORKDIR /app",
            f"COPY --from=builder /app/target/release/{binary} .",
            f"EXPOSE {dna.port}",
            f'CMD ["./{binary}"]',
        ])

    @classmethod
    def _ruby_dockerfile(cls, dna: ProjectDNA) -> str:
        return "\n".join([
            "FROM ruby:3.3-slim",
            "WORKDIR /app",
            "COPY Gemfile* ./",
            f"RUN {dna.install_cmd}",
            "COPY . .",
            *([ f"RUN {dna.build_cmd}" ] if dna.build_cmd else []),
            f"EXPOSE {dna.port}",
            f"CMD {dna.run_cmd}",
        ])

    @classmethod
    def _java_dockerfile(cls, dna: ProjectDNA) -> str:
        build_cmd = dna.build_cmd or "mvn package -DskipTests"
        builder   = "maven:3.9-eclipse-temurin-21" if "mvn" in build_cmd else "gradle:8-eclipse-temurin-21"
        return "\n".join([
            f"FROM {builder} AS builder",
            "WORKDIR /app",
            "COPY . .",
            f"RUN {build_cmd}",
            "FROM eclipse-temurin:21-jre-slim",
            "WORKDIR /app",
            "COPY --from=builder /app/target/*.jar app.jar",
            f"EXPOSE {dna.port}",
            'CMD ["java", "-jar", "app.jar"]',
        ])

    @classmethod
    def _generic_dockerfile(cls, dna: ProjectDNA) -> str:
        return "\n".join([
            "FROM alpine:latest",
            "WORKDIR /app",
            "COPY . .",
            f"EXPOSE {dna.port}",
            'CMD ["sh"]',
        ])

    @classmethod
    def inject_python_agent(cls, repo_path: Path, entry_file: str) -> None:
        """يحقن عامل المراقبة في ملف الدخول Python."""
        agent_path = repo_path / "_phantom_agent.py"
        agent_path.write_text(cls.PHANTOM_AGENT, encoding="utf-8")

        entry_path = repo_path / entry_file
        if not entry_path.exists():
            return

        content = entry_path.read_text(errors="ignore")
        if "_phantom_agent" not in content:
            entry_path.write_text(
                "import _phantom_agent  # noqa: F401\n" + content,
                encoding="utf-8",
            )


# ─────────────────────────────────────────────────────────────
#  الحاضنة الرقمية
# ─────────────────────────────────────────────────────────────

class ContainerNursery:
    """
    الحاضنة الرقمية — مسؤولة حصراً عن:
      1. بناء صورة Docker للتطبيق
      2. تشغيل الحاوية بقيود موارد صارمة
      3. انتظار النبض الأول (health check)
      4. إماتة الحاوية وتنظيف كل الأثر

    يُستخدم كمدير سياق غير متزامن لضمان التنظيف:

        async with ContainerNursery(repo, branch) as nursery:
            report = nursery.birth_report
        # ← التنظيف يحدث تلقائياً هنا
    """

    def __init__(
        self,
        repo_path:   str | Path,
        branch_name: str,
        tracer:      PhantomTracer | None = None,
    ) -> None:
        self._settings      = get_settings()
        self._repo          = Path(repo_path).resolve()
        self._branch        = branch_name
        self._tracer        = tracer or PhantomTracer()
        self._log           = PhantomLogger("nursery")
        self._tag           = f"phantom-{branch_name}-{uuid4().hex[:8]}"
        self._container_id: str | None  = None
        self._host_port:    int | None  = None
        self._temp_dir:     Path | None = None
        self.birth_report:  BirthReport = BirthReport()

    # ── مدير السياق ──

    async def __aenter__(self) -> ContainerNursery:
        self.birth_report = await self._birth()
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.kill()

    @asynccontextmanager
    @staticmethod
    async def managed(
        repo_path:   str | Path,
        branch_name: str,
        tracer:      PhantomTracer | None = None,
    ) -> AsyncIterator[ContainerNursery]:
        """مدير سياق بديل — استخدام مباشر بدون __aenter__."""
        nursery = ContainerNursery(repo_path, branch_name, tracer)
        try:
            nursery.birth_report = await nursery._birth()
            yield nursery
        finally:
            await nursery.kill()

    # ── الواجهة العامة ──

    @property
    def container_name(self) -> str:
        return self._tag

    @property
    def base_url(self) -> str | None:
        if self._host_port:
            return f"http://localhost:{self._host_port}"
        return None

    @property
    def is_alive(self) -> bool:
        return self.birth_report.status == ContainerStatus.ALIVE

    # ── دورة الحياة ──

    async def _birth(self) -> BirthReport:
        """ينفّذ دورة الولادة الكاملة."""
        with self._tracer.span("container_birth", layer="nursery") as span:
            report = BirthReport()

            # اكتشاف الـ DNA
            dna = DNADetector(self._repo).detect()
            report.dna = dna

            # إعداد مجلد البناء المؤقت
            self._temp_dir = await asyncio.to_thread(
                lambda: Path(tempfile.mkdtemp(prefix="phantom_"))
            )
            await asyncio.to_thread(
                shutil.copytree,
                self._repo,
                self._temp_dir / "src",
                dirs_exist_ok=True,
                ignore=shutil.ignore_patterns(
                    ".git", "__pycache__", "node_modules", ".venv"
                ),
            )
            build_ctx = self._temp_dir / "src"

            # توليد Dockerfile
            if dna.language != Language.DOCKER:
                dockerfile_content = DockerfileFactory.generate(dna, self._repo)
                dockerfile_path    = build_ctx / "Phantom.Dockerfile"
                dockerfile_path.write_text(dockerfile_content, encoding="utf-8")
                if dna.language == Language.PYTHON and dna.entry_point:
                    DockerfileFactory.inject_python_agent(build_ctx, dna.entry_point)
            else:
                dockerfile_path = build_ctx / "Dockerfile"

            span.add_event("dockerfile_ready", language=dna.language.value)

            # ── المرحلة 1: البناء ──
            self._log.section("PHASE 1: Building Phantom Container")
            build_start = time.monotonic()
            build_ok, build_log = await self._docker_build(build_ctx, dockerfile_path)
            report.build_time_s = round(time.monotonic() - build_start, 2)
            report.build_log    = build_log

            self._log.metric("build_time", report.build_time_s, "s")

            if not build_ok:
                report.status = ContainerStatus.STILLBORN
                report.errors.append("Docker build failed")
                self._log.error("Container STILLBORN — build failed")
                span.set_error("build_failed")
                return report

            # ── المرحلة 2: التشغيل ──
            self._log.section("PHASE 2: Starting Phantom Heartbeat")
            run_start = time.monotonic()
            run_ok, startup_log = await self._docker_run(dna)
            report.startup_time_s = round(time.monotonic() - run_start, 2)
            report.startup_log    = startup_log

            if not run_ok:
                report.status = ContainerStatus.COMATOSE
                report.errors.append("Docker run failed")
                self._log.error("Container COMATOSE — run failed")
                span.set_error("run_failed")
                return report

            # ── المرحلة 3: انتظار النبض ──
            self._log.info("Waiting for application heartbeat...")
            alive, port = await self._wait_for_heartbeat(
                dna.port,
                timeout=self._settings.container_startup_timeout_s,
            )

            if alive and port:
                self._host_port     = port
                report.host_port    = port
                report.status       = ContainerStatus.ALIVE
                report.container_id = self._container_id
                self._log.success(f"Phantom ALIVE on port {port}")
                span.set_ok(port=port, status="alive")
            else:
                report.status = ContainerStatus.COMATOSE
                report.errors.append("Application started but not responding")
                startup_log = await self._read_logs()
                report.startup_log = startup_log
                self._log.error("Container COMATOSE — no heartbeat")
                span.set_error("no_heartbeat")

            return report

    async def _docker_build(self, context: Path, dockerfile: Path) -> tuple[bool, str]:
        cmd = [
            "docker", "build",
            "-f", str(dockerfile),
            "-t", self._tag,
            "--no-cache",
            "--label", "phantom=true",
            "--label", f"branch={self._branch}",
            str(context),
        ]
        return await self._run_cmd(cmd, timeout=self._settings.container_build_timeout_s)

    async def _docker_run(self, dna: ProjectDNA) -> tuple[bool, str]:
        s = self._settings
        await self._ensure_network()

        cmd = [
            "docker", "run", "-d",
            "--name", self._tag,
            "-p", f"0:{dna.port}",
            "--memory", s.container_memory_limit,
            "--cpus",   s.container_cpu_limit,
            "--pids-limit", str(s.container_pid_limit),
            "--tmpfs",  "/tmp:size=100m,exec",
            "--tmpfs",  "/run:size=50m",
            "--label",  "phantom=true",
            "--label",  f"branch={self._branch}",
            "--network", s.phantom_network_name,
            "--read-only",
            self._tag,
        ]

        ok, log = await self._run_cmd(cmd, timeout=30)
        if ok and log.strip():
            self._container_id = log.strip()[:12]
        return ok, log

    async def _ensure_network(self) -> bool:
        net = self._settings.phantom_network_name
        ok, _ = await self._run_cmd(
            ["docker", "network", "create", "--driver", "bridge", net],
            timeout=10,
        )
        if not ok:
            ok2, _ = await self._run_cmd(
                ["docker", "network", "inspect", net], timeout=10
            )
            return ok2
        return True

    async def _wait_for_heartbeat(
        self,
        internal_port: int,
        timeout: int = 60,
    ) -> tuple[bool, int | None]:
        _, port_output = await self._run_cmd(
            ["docker", "port", self._tag, str(internal_port)],
            timeout=10,
        )
        host_port_str = port_output.strip().split(":")[-1].strip()
        if not host_port_str.isdigit():
            return False, None

        host_port = int(host_port_str)
        deadline  = time.monotonic() + timeout

        while time.monotonic() < deadline:
            ok, out = await self._run_cmd(
                [
                    "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                    "--max-time", "3",
                    f"http://localhost:{host_port}/",
                ],
                timeout=8,
            )
            code = out.strip()
            if code and code != "000":
                try:
                    if int(code) < 600:
                        self._log.success(f"Heartbeat detected! HTTP {code}")
                        return True, host_port
                except ValueError:
                    pass
            await asyncio.sleep(2)

        return False, None

    async def _read_logs(self, lines: int = 80) -> str:
        _, out = await self._run_cmd(
            ["docker", "logs", "--tail", str(lines), self._tag],
            timeout=10,
        )
        return out[-4000:]

    async def read_pulse(self) -> dict:
        """يقرأ نبضات عامل المراقبة الشبحي."""
        import json
        _, out = await self._run_cmd(
            ["docker", "exec", self._tag, "cat", "/tmp/phantom_pulse.json"],
            timeout=5,
        )
        try:
            return json.loads(out)
        except Exception:
            return {}

    async def kill(self) -> None:
        """يُنهي الحاوية ويمحو كل أثر لها."""
        self._log.info("Terminating phantom container...")
        for cmd in [
            ["docker", "kill",  self._tag],
            ["docker", "rm",    "-f", self._tag],
            ["docker", "rmi",   "-f", self._tag],
        ]:
            await self._run_cmd(cmd, timeout=10)

        if self._temp_dir and self._temp_dir.exists():
            await asyncio.to_thread(shutil.rmtree, self._temp_dir, ignore_errors=True)

        self.birth_report.status = ContainerStatus.TERMINATED
        self._log.success("Phantom terminated — no traces left.")

    # ── أداة مساعدة ──

    @staticmethod
    async def _run_cmd(cmd: list[str], timeout: int = 30) -> tuple[bool, str]:
        """يُشغّل أمر غير متزامن ويُعيد (نجح, المخرجات)."""
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            output = stdout.decode(errors="replace")
            return proc.returncode == 0, output
        except TimeoutError:
            return False, f"[timeout after {timeout}s]"
        except FileNotFoundError as exc:
            return False, f"[command not found: {exc}]"
        except Exception as exc:
            return False, f"[error: {exc}]"
