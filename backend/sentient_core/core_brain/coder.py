# core_brain/coder.py

import os
import json
from pathlib import Path
from typing import Optional

try:
    from openai import OpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    _OPENAI_AVAILABLE = False


class Coder:
    """
    المبرمج: ينفذ المخطط المعماري ويكتب الكود الفعلي.
    يستخدم LLM لتوليد الكود، ويتعامل مع الأخطاء والتصحيحات.
    """

    CODE_SYSTEM_PROMPT = """You are an expert software engineer.
Write clean, production-quality code based on the given blueprint and task.
Follow best practices: proper error handling, type hints where applicable, clear naming.
Respond with the complete file content only, no explanations, no markdown fences."""

    FIX_SYSTEM_PROMPT = """You are an expert software debugger.
You are given code that has errors and an error report.
Fix ONLY what is broken. Preserve all existing logic and structure.
Respond with the corrected file content only, no explanations, no markdown fences."""

    # حد أقصى لطول رسالة commit (معيار git)
    MAX_COMMIT_MESSAGE_LENGTH = 72

    def __init__(self):
        self.client: Optional[object] = None
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        if _OPENAI_AVAILABLE:
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.client = OpenAI(api_key=api_key)

    # ─────────────────────────────────────────────
    # التنفيذ
    # ─────────────────────────────────────────────

    def implement_blueprint(
        self, blueprint: dict, branch_name: str, repo_path: str
    ):
        """
        ينفذ المخطط المعماري: يكتب الملفات المطلوبة ويعدّل الموجودة
        """
        print(f"  💻 Implementing blueprint on branch '{branch_name}'...")
        self._ensure_branch(branch_name, repo_path)

        # ── إنشاء الملفات الجديدة ──
        for file_spec in blueprint.get("files_to_create", []):
            self._create_file(file_spec, blueprint, repo_path)

        # ── تعديل الملفات الموجودة ──
        for file_spec in blueprint.get("files_to_modify", []):
            self._modify_file(file_spec, blueprint, repo_path)

        # ── تثبيت التغييرات ──
        self._git_commit(
            repo_path,
            f"✨ feat: {blueprint.get('summary', 'Implement task')[:self.MAX_COMMIT_MESSAGE_LENGTH]}"
        )

    def fix_errors(
        self, error_report: str, branch_name: str, repo_path: str
    ):
        """يصحح أخطاء التحقق (Validator errors)"""
        print(f"  🔧 Fixing validation errors...")
        affected = self._find_affected_files(error_report, repo_path)

        for file_path in affected:
            self._fix_file(file_path, error_report, repo_path)

        self._git_commit(
            repo_path,
            "🔧 fix: auto-correct validation errors"
        )

    def fix_based_on_phantom_autopsy(
        self, autopsy_prompt: str, branch_name: str, repo_path: str
    ):
        """يصحح الكود بناءً على تقرير التشريح الشبحي"""
        print(f"  🪦 Applying phantom autopsy fixes...")
        affected = self._find_affected_files(autopsy_prompt, repo_path)

        for file_path in affected:
            self._fix_file(file_path, autopsy_prompt, repo_path)

        self._git_commit(
            repo_path,
            "🪦 fix: phantom autopsy correction applied"
        )

    # ─────────────────────────────────────────────
    # دوال داخلية
    # ─────────────────────────────────────────────

    def _create_file(self, file_spec: dict, blueprint: dict, repo_path: str):
        """يكتب ملفاً جديداً بناءً على المواصفات"""
        rel_path = file_spec.get("path", "output.py")
        description = file_spec.get("description", "")
        full_path = Path(repo_path) / rel_path

        # إنشاء المجلدات اللازمة
        full_path.parent.mkdir(parents=True, exist_ok=True)

        if self.client:
            content = self._generate_code_with_llm(
                prompt=(
                    f"Create a file at '{rel_path}' that: {description}\n\n"
                    f"Task context: {blueprint.get('implementation_notes', '')}\n"
                    f"Test strategy: {blueprint.get('test_strategy', '')}"
                )
            )
        else:
            content = self._generate_stub(rel_path, description)

        full_path.write_text(content, encoding="utf-8")
        print(f"    ✅ Created: {rel_path}")

    def _modify_file(self, file_spec: dict, blueprint: dict, repo_path: str):
        """يعدّل ملفاً موجوداً"""
        rel_path = file_spec.get("path", "")
        changes = file_spec.get("changes", "")
        full_path = Path(repo_path) / rel_path

        if not full_path.exists():
            # إذا لم يوجد الملف، أنشئه
            self._create_file(
                {"path": rel_path, "description": changes},
                blueprint,
                repo_path,
            )
            return

        existing = full_path.read_text(encoding="utf-8", errors="ignore")

        if self.client:
            content = self._generate_code_with_llm(
                prompt=(
                    f"Modify the file '{rel_path}'.\n"
                    f"Required changes: {changes}\n\n"
                    f"Current file content:\n{existing[:4000]}"
                )
            )
        else:
            content = existing  # لا تغيير بدون LLM

        full_path.write_text(content, encoding="utf-8")
        print(f"    ✏️  Modified: {rel_path}")

    def _fix_file(self, file_path: str, error_report: str, repo_path: str):
        """يصحح ملفاً بناءً على تقرير الخطأ"""
        full_path = Path(repo_path) / file_path
        if not full_path.exists():
            return

        existing = full_path.read_text(encoding="utf-8", errors="ignore")

        if not self.client:
            print(f"    ⚠️ No LLM available to fix {file_path}")
            return

        prompt = (
            f"Fix the following file based on the error report.\n\n"
            f"File: {file_path}\n"
            f"Error Report:\n{error_report[:2000]}\n\n"
            f"Current content:\n{existing[:4000]}"
        )
        fixed = self._generate_code_with_llm(prompt, system=self.FIX_SYSTEM_PROMPT)
        full_path.write_text(fixed, encoding="utf-8")
        print(f"    🔧 Fixed: {file_path}")

    def _generate_code_with_llm(
        self, prompt: str, system: Optional[str] = None
    ) -> str:
        """يولد كوداً باستخدام LLM"""
        system_msg = system or self.CODE_SYSTEM_PROMPT
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=4096,
            )
            raw = response.choices[0].message.content.strip()
            # نزيل markdown code fences إن وجدت
            if raw.startswith("```"):
                lines = raw.split("\n")
                raw = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
            return raw
        except Exception as exc:
            print(f"    ⚠️ LLM code generation failed: {exc}")
            return f"# Auto-generated stub\n# Error: {exc}\npass\n"

    @staticmethod
    def _generate_stub(file_path: str, description: str) -> str:
        """يولد ملفاً stub بسيطاً عند عدم توفر LLM"""
        ext = Path(file_path).suffix
        if ext == ".py":
            return (
                f'"""Auto-generated stub.\n{description}\n"""\n\n'
                f"# TODO: Implement this module\n\ndef main():\n    pass\n"
            )
        if ext in (".js", ".ts"):
            return f"// Auto-generated stub\n// {description}\n\n// TODO: implement\n"
        return f"# Auto-generated stub\n# {description}\n"

    @staticmethod
    def _find_affected_files(error_text: str, repo_path: str) -> list:
        """يستخرج أسماء الملفات المتأثرة من تقرير الخطأ"""
        import re
        patterns = [
            r'File "([^"]+\.py)"',
            r'in file ([^\s,]+\.py)',
            r'([A-Za-z0-9_/.-]+\.py):\d+',
        ]
        found = []
        for pattern in patterns:
            for match in re.findall(pattern, error_text):
                rel = os.path.relpath(match, repo_path) if os.path.isabs(match) else match
                if rel not in found and not rel.startswith(".."):
                    found.append(rel)

        # إذا لم نجد ملفات محددة، نعيد الملفات الرئيسية في الجذر
        if not found:
            for name in ["app.py", "main.py", "server.py", "index.py"]:
                p = Path(repo_path) / name
                if p.exists():
                    found.append(name)
                    break

        return found[:5]  # حد أقصى 5 ملفات

    @staticmethod
    def _ensure_branch(branch_name: str, repo_path: str):
        """يتأكد من وجود الفرع ويتحول إليه"""
        import subprocess
        result = subprocess.run(
            ["git", "checkout", "-b", branch_name],
            cwd=repo_path,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            # الفرع موجود، ننتقل إليه فقط
            subprocess.run(
                ["git", "checkout", branch_name],
                cwd=repo_path,
                capture_output=True,
            )

    @staticmethod
    def _git_commit(repo_path: str, message: str):
        """يثبت التغييرات في git"""
        import subprocess
        subprocess.run(["git", "add", "."], cwd=repo_path, capture_output=True)
        subprocess.run(
            ["git", "commit", "-m", message, "--allow-empty"],
            cwd=repo_path,
            capture_output=True,
        )
