# phantom_sandbox/container_nursery.py

import contextlib
import json
import os
import subprocess
import time
from pathlib import Path


class ContainerNursery:
    """
    الحاضنة الرقمية: تبني عالماً موازياً كاملاً للتطبيق
    تراقب نبضه، تنفسه، واستجابته قبل أن يرى العالم الحقيقي
    """

    def __init__(self, repo_path: str, branch_name: str):
        self.repo_path = repo_path
        self.branch_name = branch_name
        self.container_id = None
        self.container_name = f"phantom_{branch_name}_{int(time.time())}"
        self.app_port = None
        self.health_status = "unborn"
        self.birth_log = []
        self.resource_limits = {
            "memory": "512m",
            "cpus": "1.0",
            "pids": 100,
        }

    def detect_project_dna(self) -> dict:
        """
        يقرأ الحمض النووي للمشروع ليعرف كيف يبني الحاوية
        """
        dna = {
            "language": None,
            "framework": None,
            "entry_point": None,
            "install_cmd": None,
            "build_cmd": None,
            "run_cmd": None,
            "health_endpoint": "/health",
            "port": 8000,
            "needs_db": False,
            "needs_redis": False,
            "env_vars": {},
            "dockerfile_exists": False,
        }

        repo = Path(self.repo_path)

        if (repo / "Dockerfile").exists():
            dna["dockerfile_exists"] = True
            dna["language"] = "docker"
        elif (repo / "package.json").exists():
            dna["language"] = "node"
            pkg = json.loads((repo / "package.json").read_text())
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

            if "next" in deps:
                dna["framework"] = "nextjs"
                dna["build_cmd"] = "npm run build"
                dna["run_cmd"] = "npm start"
                dna["port"] = 3000
            elif "express" in deps:
                dna["framework"] = "express"
                dna["run_cmd"] = "node server.js" if (repo / "server.js").exists() else "node index.js"
                dna["port"] = 3000
            elif "fastify" in deps:
                dna["framework"] = "fastify"
                dna["run_cmd"] = "npm start"
                dna["port"] = 3000
            else:
                dna["run_cmd"] = "node index.js"

            dna["install_cmd"] = "npm install"

        elif (repo / "requirements.txt").exists() or (repo / "pyproject.toml").exists():
            dna["language"] = "python"
            dna["install_cmd"] = "pip install -r requirements.txt" if (repo / "requirements.txt").exists() else "pip install ."

            main_files = list(repo.glob("main.py")) + list(repo.glob("app.py"))
            all_py = ""
            for f in main_files[:3]:
                all_py += f.read_text(errors='ignore')[:2000]

            if "fastapi" in all_py:
                dna["framework"] = "fastapi"
                dna["run_cmd"] = "uvicorn app:app --host 0.0.0.0 --port 8000"
                dna["port"] = 8000
            elif "flask" in all_py:
                dna["framework"] = "flask"
                dna["run_cmd"] = "flask run --host 0.0.0.0 --port 5000"
                dna["port"] = 5000
            elif "django" in all_py or (repo / "manage.py").exists():
                dna["framework"] = "django"
                dna["run_cmd"] = "python manage.py runserver 0.0.0.0:8000"
                dna["port"] = 8000
            else:
                dna["run_cmd"] = "python main.py"

        elif (repo / "go.mod").exists():
            dna["language"] = "go"
            dna["build_cmd"] = "go build -o app ."
            dna["run_cmd"] = "./app"
            dna["port"] = 8080

        elif (repo / "Cargo.toml").exists():
            dna["language"] = "rust"
            dna["build_cmd"] = "cargo build --release"
            dna["run_cmd"] = "./target/release/app"
            dna["port"] = 8080

        elif (repo / "Gemfile").exists():
            dna["language"] = "ruby"
            dna["install_cmd"] = "bundle install"
            if (repo / "config" / "routes.rb").exists():
                dna["framework"] = "rails"
                dna["run_cmd"] = "bundle exec rails server -b 0.0.0.0 -p 3000"
                dna["port"] = 3000
            else:
                dna["framework"] = "sinatra"
                dna["run_cmd"] = "ruby app.rb -o 0.0.0.0 -p 4567"
                dna["port"] = 4567

        elif (repo / "pom.xml").exists() or (repo / "build.gradle").exists():
            dna["language"] = "java"
            if (repo / "pom.xml").exists():
                dna["build_cmd"] = "mvn package -DskipTests"
                dna["run_cmd"] = "java -jar target/*.jar"
            else:
                dna["build_cmd"] = "./gradlew build -x test"
                dna["run_cmd"] = "java -jar build/libs/*.jar"
            dna["port"] = 8080

        # ── كشف الحاجات الإضافية ──
        all_text = ""
        for f in list(repo.rglob("*.py"))[:10] + list(repo.rglob("*.js"))[:10]:
            with contextlib.suppress(Exception):
                all_text += f.read_text(errors='ignore')[:1000]

        if any(kw in all_text for kw in ["redis", "Redis", "REDIS"]):
            dna["needs_redis"] = True
        if any(kw in all_text for kw in ["postgres", "postgresql", "sqlite", "mysql", "mongodb"]):
            dna["needs_db"] = True

        self.log(f"🧬 Project DNA detected: {dna['language']} / {dna['framework']}")
        return dna

    def spawn_dockerfile(self, dna: dict) -> str:
        """يولد Dockerfile شبحياً بناءً على الحمض النووي للمشروع"""
        lines = []

        if dna["language"] == "python":
            lines.extend([
                "FROM python:3.11-slim",
                "WORKDIR /app",
                "COPY requirements.txt . 2>/dev/null || true",
                f"RUN {dna['install_cmd']} || true",
                "COPY . .",
            ])
            if dna["build_cmd"]:
                lines.append(f"RUN {dna['build_cmd']} || true")
            lines.append(f"EXPOSE {dna['port']}")
            lines.append(
                f"HEALTHCHECK --interval=5s --timeout=3s CMD curl -f http://localhost:{dna['port']}{dna['health_endpoint']} || exit 1"
            )
            run_parts = dna["run_cmd"].split()
            lines.append(f'CMD {run_parts[0]} {" ".join(run_parts[1:])}')

        elif dna["language"] == "node":
            lines.extend([
                "FROM node:20-slim",
                "WORKDIR /app",
                "COPY package*.json ./",
                f"RUN {dna['install_cmd']}",
                "COPY . .",
            ])
            if dna["build_cmd"]:
                lines.append(f"RUN {dna['build_cmd']}")
            lines.append(f"EXPOSE {dna['port']}")
            lines.append(f'CMD {dna["run_cmd"]}')

        elif dna["language"] == "go":
            lines.extend([
                "FROM golang:1.22-alpine AS builder",
                "WORKDIR /app",
                "COPY go.* ./",
                "RUN go mod download",
                "COPY . .",
                f"RUN {dna['build_cmd']}",
                "FROM alpine:latest",
                "WORKDIR /app",
                "COPY --from=builder /app/app .",
                f"EXPOSE {dna['port']}",
                f'CMD ["{dna["run_cmd"]}"]',
            ])

        elif dna["language"] == "docker":
            return "EXISTING"

        else:
            lines.extend([
                "FROM alpine:latest",
                "WORKDIR /app",
                "COPY . .",
                f"EXPOSE {dna['port']}",
            ])

        dockerfile_content = "\n".join(lines)
        dockerfile_path = os.path.join(self.repo_path, "Phantom.Dockerfile")
        with open(dockerfile_path, 'w') as f:
            f.write(dockerfile_content)

        self.log(f"📜 Phantom Dockerfile spawned at {dockerfile_path}")
        return dockerfile_path

    def birth(self) -> dict:
        """
        الولادة: يبني الحاوية ويشغلها
        يعيد تقريراً كاملاً عن حالة المولود
        """
        dna = self.detect_project_dna()
        dockerfile_path = self.spawn_dockerfile(dna)
        self.app_port = dna["port"]

        birth_report = {
            "status": "unknown",
            "container_id": None,
            "port": None,
            "build_time": 0,
            "startup_time": 0,
            "build_log": "",
            "startup_log": "",
            "errors": [],
            "dna": dna,
        }

        # ── المرحلة 1: البناء ──
        self.log("🏗️ Phase 1: Building phantom container...")
        build_start = time.time()

        if dockerfile_path == "EXISTING":
            dockerfile_path = os.path.join(self.repo_path, "Dockerfile")

        build_cmd = [
            "docker", "build",
            "-f", dockerfile_path,
            "-t", self.container_name,
            "--no-cache",
            self.repo_path
        ]

        try:
            result = subprocess.run(
                build_cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            birth_report["build_time"] = round(time.time() - build_start, 2)
            birth_report["build_log"] = result.stdout[-2000:] + result.stderr[-2000:]

            if result.returncode != 0:
                birth_report["status"] = "stillborn"
                birth_report["errors"].append(f"Build failed: {result.stderr[-500:]}")
                self.log("💀 Container stillborn - build failed")
                return birth_report

        except subprocess.TimeoutExpired:
            birth_report["status"] = "stillborn"
            birth_report["errors"].append("Build timeout (5min exceeded)")
            return birth_report

        # ── المرحلة 2: التشغيل ──
        self.log("🫀 Phase 2: Starting phantom heartbeat...")
        run_start = time.time()

        run_cmd = [
            "docker", "run",
            "-d",
            "--name", self.container_name,
            "-p", f"0:{dna['port']}",
            "--memory", self.resource_limits["memory"],
            "--cpus", self.resource_limits["cpus"],
            "--pids-limit", str(self.resource_limits["pids"]),
            "--read-only",
            "--tmpfs", "/tmp:size=100m",
            "--tmpfs", "/run:size=50m",
            "--network", "phantom_net",
            self.container_name
        ]

        try:
            result = subprocess.run(run_cmd, capture_output=True, text=True, timeout=30)
            birth_report["startup_time"] = round(time.time() - run_start, 2)

            if result.returncode != 0:
                birth_report["status"] = "crippled"
                birth_report["errors"].append(f"Run failed: {result.stderr}")
                return birth_report

            self.container_id = result.stdout.strip()[:12]
            birth_report["container_id"] = self.container_id

            # ── انتظار نبض التطبيق ──
            self.log("⏳ Waiting for application heartbeat...")
            is_alive, port = self._wait_for_heartbeat(dna["port"], timeout=30)

            if is_alive:
                self.app_port = port
                birth_report["status"] = "alive"
                birth_report["port"] = port
                self.health_status = "alive"
                self.log(f"✅ Phantom is ALIVE on port {port}!")
            else:
                birth_report["status"] = "comatose"
                birth_report["errors"].append("Application started but not responding")
                birth_report["startup_log"] = self._read_container_logs()

        except subprocess.TimeoutExpired:
            birth_report["status"] = "comatose"
            birth_report["errors"].append("Startup timeout")

        return birth_report

    def _wait_for_heartbeat(self, internal_port: int, timeout: int = 30) -> tuple:
        """ينتظر حتى يستجيب التطبيق على منفذه"""
        try:
            result = subprocess.run(
                ["docker", "port", self.container_name, str(internal_port)],
                capture_output=True, text=True
            )
            if result.stdout:
                host_port = result.stdout.strip().split(":")[-1]
            else:
                return False, None
        except Exception:
            return False, None

        start = time.time()
        while time.time() - start < timeout:
            try:
                result = subprocess.run(
                    ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                     f"http://localhost:{host_port}/"],
                    capture_output=True, text=True, timeout=5
                )
                if result.stdout and result.stdout.strip() != "000":
                    self.log(f"💓 Heartbeat detected! HTTP {result.stdout.strip()}")
                    return True, int(host_port)
            except Exception:
                pass
            time.sleep(2)

        return False, None

    def _read_container_logs(self) -> str:
        """يقرأ سجلات الحاوية"""
        try:
            result = subprocess.run(
                ["docker", "logs", self.container_name, "--tail", "50"],
                capture_output=True, text=True
            )
            return result.stdout[-2000:] + result.stderr[-2000:]
        except Exception:
            return "Could not read logs"

    def read_phantom_pulse(self) -> dict:
        """يقرأ نبضات عامل المراقبة الشبحي"""
        try:
            result = subprocess.run(
                ["docker", "exec", self.container_name, "cat", "/tmp/phantom_pulse.json"],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                return json.loads(result.stdout)
        except Exception:
            pass
        return {}

    def kill(self):
        """يقتل الحاوية الشبحية ويمحو كل أثر"""
        if self.container_id or self.container_name:
            self.log("🗡️ Terminating phantom...")
            try:
                subprocess.run(["docker", "kill", self.container_name],
                               capture_output=True, timeout=10)
                subprocess.run(["docker", "rm", "-f", self.container_name],
                               capture_output=True, timeout=10)
                subprocess.run(["docker", "rmi", "-f", self.container_name],
                               capture_output=True, timeout=10)
            except Exception:
                pass

            # تنظيف الملفات الشبحية
            phantom_files = [
                os.path.join(self.repo_path, "Phantom.Dockerfile"),
                os.path.join(self.repo_path, "_phantom_agent.py"),
            ]
            for f in phantom_files:
                if os.path.exists(f):
                    os.remove(f)

            self.health_status = "dead"
            self.log("👻 Phantom terminated and erased.")

    def log(self, message: str):
        self.birth_log.append(message)
        print(f"  [Nursery] {message}")
