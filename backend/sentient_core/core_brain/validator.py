# core_brain/validator.py

import subprocess
from pathlib import Path


class Validator:
    """
    المحقق: يجري فحوصات محلية على الكود قبل إرساله للساندبوكس الشبحي.
    يشمل: linting (flake8/eslint)، unit tests (pytest/jest)، وفحص الاستيراد.
    """

    # حد زمني لكل أمر (ثانية)
    TIMEOUT = 120
    MAX_FILES_TO_CHECK = 50

    def __init__(self):
        self.errors: list = []

    def run_local_checks(self, repo_path: str) -> tuple[bool, str]:
        """
        يشغل جميع الفحوصات المحلية على المستودع
        يعيد (True, "") إذا نجح كل شيء، أو (False, error_report) عند الفشل
        """
        self.errors = []
        repo = Path(repo_path)
        language = self._detect_language(repo)

        print(f"  🔍 Running local checks for {language} project...")

        if language == "python":
            self._check_python_syntax(repo_path)
            self._check_python_lint(repo_path)
            self._run_pytest(repo_path)

        elif language == "node":
            self._check_node_lint(repo_path)
            self._run_jest(repo_path)

        elif language == "go":
            self._check_go_build(repo_path)
            self._run_go_tests(repo_path)

        else:
            # لغة غير مدعومة: فقط فحص الصياغة العامة
            print(f"    ℹ️ No specific checks for language: {language}")

        if self.errors:
            error_report = "\n".join(self.errors)
            print(f"  ❌ {len(self.errors)} check(s) failed")
            return False, error_report

        print("  ✅ All local checks passed")
        return True, ""

    # ─────────────────────────────────────────────
    # فحوصات Python
    # ─────────────────────────────────────────────

    def _check_python_syntax(self, repo_path: str):
        """يفحص الصياغة لكل ملفات Python"""
        py_files = list(Path(repo_path).rglob("*.py"))
        # استثناء المجلدات الافتراضية
        py_files = [
            f for f in py_files
            if not any(part in f.parts for part in [
                "venv", ".venv", "__pycache__", ".git", "node_modules"
            ])
        ]

        for py_file in py_files[:self.MAX_FILES_TO_CHECK]:
            result = subprocess.run(
                ["python3", "-m", "py_compile", str(py_file)],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode != 0:
                self.errors.append(
                    f"[SyntaxError] {py_file.relative_to(repo_path)}: {result.stderr.strip()[:300]}"
                )

    def _check_python_lint(self, repo_path: str):
        """يشغل flake8 للـ linting"""
        if not self._command_exists("flake8"):
            return

        result = subprocess.run(
            ["flake8", ".", "--max-line-length=120",
             "--exclude=venv,.venv,__pycache__,.git",
             "--count", "--statistics"],
            cwd=repo_path,
            capture_output=True, text=True,
            timeout=self.TIMEOUT
        )
        if result.returncode != 0:
            # فقط نسجل أخطاء حقيقية (E) وليس تحذيرات (W)
            lines = result.stdout.strip().splitlines()
            errors = [l for l in lines if ": E" in l]
            if errors:
                self.errors.append(
                    f"[Lint] flake8 found {len(errors)} error(s):\n"
                    + "\n".join(errors[:10])
                )

    def _run_pytest(self, repo_path: str):
        """يشغل pytest إذا وُجدت اختبارات"""
        test_files = list(Path(repo_path).rglob("test_*.py")) + list(Path(repo_path).rglob("*_test.py"))

        if not test_files:
            print("    ℹ️ No pytest tests found, skipping")
            return

        if not self._command_exists("pytest"):
            return

        result = subprocess.run(
            ["pytest", "--tb=short", "-q", "--no-header"],
            cwd=repo_path,
            capture_output=True, text=True,
            timeout=self.TIMEOUT
        )
        if result.returncode != 0:
            self.errors.append(
                f"[Tests] pytest failed:\n{result.stdout[-1500:]}\n{result.stderr[-500:]}"
            )

    # ─────────────────────────────────────────────
    # فحوصات Node.js
    # ─────────────────────────────────────────────

    def _check_node_lint(self, repo_path: str):
        """يشغل eslint إذا كان مكوّناً"""
        eslint_cfg = (
            (Path(repo_path) / ".eslintrc.js").exists()
            or (Path(repo_path) / ".eslintrc.json").exists()
            or (Path(repo_path) / ".eslintrc.yml").exists()
        )
        if not eslint_cfg or not self._command_exists("npx"):
            return

        result = subprocess.run(
            ["npx", "eslint", ".", "--ext", ".js,.ts,.jsx,.tsx",
             "--format", "compact", "--max-warnings", "0"],
            cwd=repo_path,
            capture_output=True, text=True,
            timeout=self.TIMEOUT
        )
        if result.returncode != 0:
            self.errors.append(
                f"[Lint] eslint errors:\n{result.stdout[:1500]}"
            )

    def _run_jest(self, repo_path: str):
        """يشغل jest إذا كان متاحاً"""
        pkg = Path(repo_path) / "package.json"
        if not pkg.exists():
            return

        import json
        try:
            data = json.loads(pkg.read_text())
        except (json.JSONDecodeError, OSError):
            return

        scripts = data.get("scripts", {})
        if "test" not in scripts or not self._command_exists("npm"):
            return

        result = subprocess.run(
            ["npm", "test", "--", "--watchAll=false"],
            cwd=repo_path,
            capture_output=True, text=True,
            timeout=self.TIMEOUT
        )
        if result.returncode != 0:
            self.errors.append(
                f"[Tests] jest failed:\n{result.stdout[-1500:]}"
            )

    # ─────────────────────────────────────────────
    # فحوصات Go
    # ─────────────────────────────────────────────

    def _check_go_build(self, repo_path: str):
        """يبني مشروع Go"""
        if not self._command_exists("go"):
            return

        result = subprocess.run(
            ["go", "build", "./..."],
            cwd=repo_path,
            capture_output=True, text=True,
            timeout=self.TIMEOUT
        )
        if result.returncode != 0:
            self.errors.append(
                f"[Build] go build failed:\n{result.stderr[:1500]}"
            )

    def _run_go_tests(self, repo_path: str):
        """يشغل اختبارات Go"""
        if not self._command_exists("go"):
            return

        result = subprocess.run(
            ["go", "test", "./...", "-timeout", "60s"],
            cwd=repo_path,
            capture_output=True, text=True,
            timeout=self.TIMEOUT
        )
        if result.returncode != 0:
            self.errors.append(
                f"[Tests] go test failed:\n{result.stdout[-1500:]}\n{result.stderr[-500:]}"
            )

    # ─────────────────────────────────────────────
    # أدوات مساعدة
    # ─────────────────────────────────────────────

    @staticmethod
    def _detect_language(repo: Path) -> str:
        if (repo / "requirements.txt").exists() or (repo / "pyproject.toml").exists():
            return "python"
        if (repo / "package.json").exists():
            return "node"
        if (repo / "go.mod").exists():
            return "go"
        if (repo / "Cargo.toml").exists():
            return "rust"
        if (repo / "Gemfile").exists():
            return "ruby"
        if (repo / "pom.xml").exists() or (repo / "build.gradle").exists():
            return "java"
        # كشف بالامتدادات
        if list(repo.glob("*.py")):
            return "python"
        if list(repo.glob("*.js")) or list(repo.glob("*.ts")):
            return "node"
        return "unknown"

    @staticmethod
    def _command_exists(cmd: str) -> bool:
        """يتحقق من وجود الأمر في PATH"""
        import shutil
        return shutil.which(cmd) is not None
