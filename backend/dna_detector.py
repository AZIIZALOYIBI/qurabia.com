import os
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class ProjectLanguage(Enum):
    PYTHON = "python"
    NODEJS = "nodejs"
    GO = "go"
    RUST = "rust"
    RUBY = "ruby"
    JAVA = "java"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class ProjectDNA:
    language: ProjectLanguage
    framework: str = ""
    port: int = 10000
    dependencies: tuple[str, ...] = ()
    has_docker: bool = False
    has_tests: bool = False


class DNADetector:
    LANGUAGE_DETECTORS = {
        ProjectLanguage.PYTHON: ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile"],
        ProjectLanguage.NODEJS: ["package.json", "pnpm-lock.yaml", "yarn.lock"],
        ProjectLanguage.GO: ["go.mod", "go.sum"],
        ProjectLanguage.RUST: ["Cargo.toml"],
        ProjectLanguage.RUBY: ["Gemfile"],
        ProjectLanguage.JAVA: ["pom.xml", "build.gradle"],
    }

    FRAMEWORK_PATTERNS: dict[ProjectLanguage, list[tuple[str, str]]] = {
        ProjectLanguage.PYTHON: [
            (r"fastapi", "FastAPI"),
            (r"flask", "Flask"),
            (r"django", "Django"),
        ],
        ProjectLanguage.NODEJS: [
            (r"next", "Next.js"),
            (r"express", "Express"),
            (r"nuxt", "Nuxt"),
        ],
    }

    PORT_PATTERNS = [
        re.compile(r"EXPOSE\s+(\d+)", re.MULTILINE),
        re.compile(r"port\s*[=:]\s*(\d+)", re.IGNORECASE),
    ]

    DB_PATTERNS = [
        re.compile(r"postgres|sqlite|mysql|mongodb|redis", re.IGNORECASE),
    ]

    def detect(self, project_path: str = ".") -> ProjectDNA:
        language = self._detect_language(project_path)
        framework = self._detect_framework(project_path, language)
        port = self._detect_port(project_path)
        deps = self._detect_dependencies(project_path)
        has_docker = os.path.isfile(os.path.join(project_path, "Dockerfile"))
        has_tests = self._detect_tests(project_path, language)

        return ProjectDNA(
            language=language,
            framework=framework,
            port=port,
            dependencies=deps,
            has_docker=has_docker,
            has_tests=has_tests,
        )

    def _detect_language(self, path: str) -> ProjectLanguage:
        for lang, files in self.LANGUAGE_DETECTORS.items():
            for f in files:
                if os.path.isfile(os.path.join(path, f)):
                    return lang
        return ProjectLanguage.UNKNOWN

    def _detect_framework(self, path: str, language: ProjectLanguage) -> str:
        patterns = self.FRAMEWORK_PATTERNS.get(language, [])
        for pattern_file, name in patterns:
            for check_file in self.LANGUAGE_DETECTORS.get(language, []):
                fpath = os.path.join(path, check_file)
                if os.path.isfile(fpath):
                    try:
                        content = open(fpath, encoding="utf-8", errors="ignore").read().lower()
                        if re.search(pattern_file, content):
                            return name
                    except Exception:
                        pass
        return ""

    def _detect_port(self, path: str) -> int:
        dockerfile = os.path.join(path, "Dockerfile")
        if os.path.isfile(dockerfile):
            try:
                content = open(dockerfile, encoding="utf-8", errors="ignore").read()
                for pat in self.PORT_PATTERNS:
                    m = pat.search(content)
                    if m:
                        return int(m.group(1))
            except Exception:
                pass
        return 10000

    def _detect_dependencies(self, path: str) -> tuple[str, ...]:
        deps: list[str] = []
        for f in os.listdir(path):
            fpath = os.path.join(path, f)
            if os.path.isfile(fpath):
                try:
                    content = open(fpath, encoding="utf-8", errors="ignore").read().lower()
                    for pat in self.DB_PATTERNS:
                        if pat.search(content):
                            deps.append("database")
                            break
                except Exception:
                    pass
        return tuple(deps)

    def _detect_tests(self, path: str, language: ProjectLanguage) -> bool:
        test_dirs = {
            ProjectLanguage.PYTHON: ["tests", "test"],
            ProjectLanguage.NODEJS: ["__tests__", "test", "tests"],
            ProjectLanguage.GO: ["*_test.go"],
            ProjectLanguage.RUST: ["tests"],
        }
        for d in test_dirs.get(language, []):
            if os.path.isdir(os.path.join(path, d)):
                return True
        return False


dna_detector = DNADetector()
