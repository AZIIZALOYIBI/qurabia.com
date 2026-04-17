# core_brain/architect.py

import json
import os

from .llm_client import LLMClient


class Architect:
    """
    المهندس المعماري: يحوّل المهمة النصية إلى مخطط هندسي قابل للتنفيذ.
    يستخدم نموذج اللغة الكبير (LLM) لفهم المتطلبات وتصميم الحل.
    """

    SYSTEM_PROMPT = """You are an expert software architect.
Given a task description and project context, produce a structured JSON blueprint.

The blueprint MUST follow this exact schema:
{
  "summary": "one-line summary of the solution",
  "files_to_create": [
    {"path": "relative/path/file.py", "description": "what this file does"}
  ],
  "files_to_modify": [
    {"path": "relative/path/file.py", "changes": "description of changes"}
  ],
  "files_to_delete": [],
  "dependencies_to_add": [],
  "implementation_notes": "important notes for the coder",
  "test_strategy": "how to test this solution"
}

Be precise and practical. Only include what is strictly needed for the task.
Respond ONLY with valid JSON, no extra text."""

    def __init__(self):
        self.llm = LLMClient()

    def design_solution(self, task: str, project_context: str) -> dict:
        """
        يصمم حلاً معمارياً للمهمة المعطاة
        يعيد مخططاً JSON يصف الملفات والتغييرات المطلوبة
        """
        if self.llm.is_available():
            return self._design_with_llm(task, project_context)
        return self._design_fallback(task, project_context)

    def _design_with_llm(self, task: str, project_context: str) -> dict:
        """يصمم الحل باستخدام نموذج اللغة الكبير"""
        user_message = (
            f"Task: {task}\n\n"
            f"Project Context (existing files):\n{project_context[:3000]}\n\n"
            "Design the architectural solution as JSON blueprint."
        )
        try:
            raw = self.llm.complete(
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.2,
                max_tokens=2000,
            )
            # نزيل أي markdown code blocks إن وجدت
            import re as _re
            code_block = _re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
            if code_block:
                raw = code_block.group(1).strip()
            elif raw.startswith("```"):
                lines = raw.splitlines()
                raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:]).strip()

            blueprint = json.loads(raw)
            print(f"  📐 Blueprint designed: {len(blueprint.get('files_to_create', []))} files to create, "
                  f"{len(blueprint.get('files_to_modify', []))} to modify")
            return blueprint

        except json.JSONDecodeError as exc:
            print(f"  ⚠️ Blueprint JSON parse error: {exc}. Using fallback.")
            return self._design_fallback(task, project_context)
        except Exception as exc:
            print(f"  ⚠️ LLM Architect error: {exc}. Using fallback.")
            return self._design_fallback(task, project_context)

    @staticmethod
    def _design_fallback(task: str, project_context: str) -> dict:
        """
        مخطط احتياطي عندما لا يكون LLM متاحاً
        يبني مخططاً بسيطاً بناءً على الكلمات المفتاحية في المهمة
        """
        files_to_create = []
        files_to_modify = []
        notes = f"Task: {task}"

        task_lower = task.lower()

        # كشف نوع التغيير المطلوب
        if any(k in task_lower for k in ["api", "endpoint", "route"]):
            files_to_create.append({
                "path": "api/routes.py",
                "description": "New API routes for the task"
            })
        if any(k in task_lower for k in ["model", "schema", "database", "db"]):
            files_to_create.append({
                "path": "models/model.py",
                "description": "Data model for the task"
            })
        if any(k in task_lower for k in ["test", "spec"]):
            files_to_create.append({
                "path": "tests/test_feature.py",
                "description": "Tests for the new feature"
            })
        if any(k in task_lower for k in ["fix", "bug", "error", "issue"]):
            notes += " | This is a bug fix - review existing files carefully."

        # إذا لم نكتشف شيئاً محدداً
        if not files_to_create and not files_to_modify:
            files_to_create.append({
                "path": "feature/implementation.py",
                "description": f"Implementation for: {task[:80]}"
            })

        return {
            "summary": f"Solution for: {task[:100]}",
            "files_to_create": files_to_create,
            "files_to_modify": files_to_modify,
            "files_to_delete": [],
            "dependencies_to_add": [],
            "implementation_notes": notes,
            "test_strategy": "Run existing tests and add new ones for the feature",
        }
