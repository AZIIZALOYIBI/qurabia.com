"""phantom_sandbox.core.dna_detector — كاشف الحمض النووي للمشروع."""

from __future__ import annotations

import contextlib
import json
import re
from pathlib import Path

from phantom_sandbox.core.types import Framework, Language, ProjectDNA

_DB_PACKAGES = {
    "sqlalchemy", "psycopg2", "psycopg", "pymysql", "asyncpg",
    "tortoise", "peewee", "motor", "pymongo", "aiomysql",
    "databases", "alembic", "django.db",
}

_REDIS_PACKAGES = {"redis", "aioredis", "fakeredis", "celery"}

_PYTHON_ENTRY_CANDIDATES = [
    "main.py", "app.py", "server.py", "application.py", "run.py",
    "manage.py", "wsgi.py", "asgi.py",
]


class DNADetector:
    """
    يكتشف لغة المشروع وإطاره بالتحليل الستاتيكي.
    Dockerfile يأخذ الأولوية على كل شيء آخر.
    """

    def __init__(self, repo_path: Path | str) -> None:
        self._repo = Path(repo_path).resolve()

    def detect(self) -> ProjectDNA:
        """يُحلّل المستودع ويُعيد ProjectDNA ثابتاً."""
        repo = self._repo

        # الأولوية الأولى: Dockerfile موجود
        if (repo / "Dockerfile").exists():
            return self._from_dockerfile()

        # Python
        has_req = (repo / "requirements.txt").exists()
        has_pyproject = (repo / "pyproject.toml").exists()
        has_setup = (repo / "setup.py").exists()
        if has_req or has_pyproject or has_setup:
            return self._detect_python()

        # Node.js
        if (repo / "package.json").exists():
            return self._detect_node()

        # Go
        if (repo / "go.mod").exists():
            return ProjectDNA(
                language=Language.GO,
                install_cmd="go mod download",
                build_cmd="go build -o _phantom_app .",
                run_cmd="./_phantom_app",
                port=8080,
            )

        # Rust
        if (repo / "Cargo.toml").exists():
            cargo = (repo / "Cargo.toml").read_text(errors="ignore")
            name_m = re.search(r'^name\s*=\s*"([^"]+)"', cargo, re.MULTILINE)
            binary = name_m.group(1) if name_m else "app"
            return ProjectDNA(
                language=Language.RUST,
                install_cmd="",
                build_cmd="cargo build --release",
                run_cmd=f"./target/release/{binary}",
                port=8080,
            )

        # Ruby
        if (repo / "Gemfile").exists():
            return self._detect_ruby()

        # Java
        if (repo / "pom.xml").exists() or (repo / "build.gradle").exists():
            return self._detect_java()

        return ProjectDNA(language=Language.UNKNOWN)

    # ── كاشفات متخصصة ──

    def _from_dockerfile(self) -> ProjectDNA:
        content = (self._repo / "Dockerfile").read_text(errors="ignore")
        port = 8000
        expose_m = re.search(r"^EXPOSE\s+(\d+)", content, re.MULTILINE)
        if expose_m:
            port = int(expose_m.group(1))
        return ProjectDNA(
            language=Language.DOCKER,
            run_cmd="",
            port=port,
            dockerfile_exists=True,
        )

    def _detect_python(self) -> ProjectDNA:
        repo = self._repo
        req_text = ""
        if (repo / "requirements.txt").exists():
            req_text = (repo / "requirements.txt").read_text(errors="ignore").lower()

        pyproject_text = ""
        if (repo / "pyproject.toml").exists():
            pyproject_text = (repo / "pyproject.toml").read_text(errors="ignore").lower()

        combined = req_text + " " + pyproject_text

        # اكتشاف الإطار
        framework = Framework.UNKNOWN
        port      = 8000
        run_cmd   = "python main.py"

        if "fastapi" in combined or "fastapi" in self._scan_source_py():
            framework = Framework.FASTAPI
            run_cmd   = "uvicorn app:app --host 0.0.0.0 --port 8000"
            entry = self._find_entry(["main.py", "app.py", "server.py"])
        elif "flask" in combined:
            framework = Framework.FLASK
            run_cmd   = "flask run --host 0.0.0.0 --port 8000"
            entry = self._find_entry(["app.py", "main.py", "run.py"])
        elif "django" in combined or (repo / "manage.py").exists():
            framework = Framework.DJANGO
            run_cmd   = "python manage.py runserver 0.0.0.0:8000"
            entry     = "manage.py"
        else:
            entry = self._find_entry(_PYTHON_ENTRY_CANDIDATES) or "main.py"

        needs_db    = any(pkg in combined for pkg in _DB_PACKAGES)
        needs_redis = any(pkg in combined for pkg in _REDIS_PACKAGES)

        install_cmd = "pip install -r requirements.txt" if (repo / "requirements.txt").exists() else "pip install ."

        return ProjectDNA(
            language=Language.PYTHON,
            framework=framework,
            entry_point=entry or "",
            install_cmd=install_cmd,
            run_cmd=run_cmd,
            health_endpoint="/health",
            port=port,
            needs_db=needs_db,
            needs_redis=needs_redis,
        )

    def _detect_node(self) -> ProjectDNA:
        repo = self._repo
        try:
            pkg = json.loads((repo / "package.json").read_text(errors="ignore"))
        except Exception:
            pkg = {}

        deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        dep_names = {k.lower() for k in deps}

        framework = Framework.UNKNOWN
        port      = 3000
        run_cmd   = "node server.js"

        if "next" in dep_names or "next.js" in dep_names:
            framework = Framework.NEXTJS
            run_cmd   = "node_modules/.bin/next start -p 3000"
        elif "express" in dep_names:
            framework = Framework.EXPRESS
            main_file = pkg.get("main", "index.js")
            run_cmd   = f"node {main_file}"

        scripts   = pkg.get("scripts", {})
        start_cmd = scripts.get("start", "")
        if start_cmd:
            run_cmd = "npm start"

        return ProjectDNA(
            language=Language.NODE,
            framework=framework,
            install_cmd="npm ci --production",
            build_cmd=("npm run build" if "build" in scripts else None),
            run_cmd=run_cmd,
            port=port,
        )

    def _detect_ruby(self) -> ProjectDNA:
        gemfile = (self._repo / "Gemfile").read_text(errors="ignore").lower()
        framework = Framework.RAILS if "rails" in gemfile else Framework.UNKNOWN
        return ProjectDNA(
            language=Language.RUBY,
            framework=framework,
            install_cmd="bundle install",
            run_cmd="bundle exec rails server -b 0.0.0.0" if framework == Framework.RAILS else "ruby app.rb",
            port=3000,
        )

    def _detect_java(self) -> ProjectDNA:
        has_maven  = (self._repo / "pom.xml").exists()
        build_cmd  = "mvn package -DskipTests" if has_maven else "./gradlew build"
        return ProjectDNA(
            language=Language.JAVA,
            install_cmd="",
            build_cmd=build_cmd,
            run_cmd="java -jar target/*.jar",
            port=8080,
        )

    def _find_entry(self, candidates: list[str]) -> str | None:
        for name in candidates:
            if (self._repo / name).exists():
                return name
        return None

    def _scan_source_py(self) -> str:
        """يمسح ملفات Python للبحث عن أسماء أطر العمل."""
        snippets: list[str] = []
        for py in list(self._repo.glob("*.py"))[:10]:
            with contextlib.suppress(OSError):
                snippets.append(py.read_text(errors="ignore")[:500].lower())
        return " ".join(snippets)
