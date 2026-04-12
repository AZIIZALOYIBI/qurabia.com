# core_brain/main.py

import os
import sys
import time

# إضافة مسار الساندبوكس
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'phantom_sandbox'))

from .architect import Architect
from .coder import Coder
from .validator import Validator
from .security_shield import SecurityShield
from .memory import GeneticMemory
from ..phantom_sandbox.phantom_manager import PhantomSandboxManager


class SentientCore:
    """
    النواة الواعية الكاملة - النسخة 2.0
    الآن مع المحاكاة الشبحية
    """

    def __init__(self):
        self.architect = Architect()
        self.coder = Coder()
        self.validator = Validator()
        self.shield = SecurityShield()
        self.genome = GeneticMemory()
        self.max_fix_attempts = 3
        self.max_phantom_attempts = 2

    def execute_task(self, task: str, branch_name: str, repo_path: str = "."):
        """تنفيذ مهمة كاملة مع كل طبقات الوعي"""

        print(f"\n🧠 Sentient Core v2.0 - Task: {task}")
        print("=" * 50)

        # ── الدرع الأمني ──
        if not self.shield.is_safe(task):
            print("🛡️ Task blocked by Security Shield!")
            return False

        # ── استدعاء الذاكرة الجينية ──
        past_experiences = self.genome.remember_past_mistakes(task)
        if past_experiences:
            print(f"🧬 Genetic memory recalled {len(past_experiences)} past experiences")

        # ── التخطيط المعماري ──
        print("\n📐 Phase 1: Architectural Design...")
        blueprint = self.architect.design_solution(task, self._get_project_context(repo_path))

        # ── كتابة الكود ──
        print("\n💻 Phase 2: Code Generation...")
        self.coder.implement_blueprint(blueprint, branch_name, repo_path)

        # ── التحقق المحلي (Unit Tests + Linting) ──
        print("\n🔍 Phase 3: Local Validation...")
        is_valid = False
        attempt = 0

        while not is_valid and attempt < self.max_fix_attempts:
            is_valid, error_report = self.validator.run_local_checks(repo_path)

            if not is_valid:
                print(f"  ⚠️ Validation attempt {attempt + 1} failed. Self-correcting...")
                self.coder.fix_errors(error_report, branch_name, repo_path)

                # حفظ التجربة في الذاكرة الجينية
                self.genome.encode_experience(
                    task=task,
                    error_report=error_report,
                    final_fix=f"Auto-corrected on attempt {attempt + 1}"
                )
                attempt += 1

        if not is_valid:
            print("❌ Code failed local validation after maximum attempts")
            return False

        print("✅ Local validation passed!")

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 🌟 المرحلة الجديدة: المحاكاة الشبحية
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        print("\n👻 Phase 4: PHANTOM SANDBOX SIMULATION...")

        phantom_attempt = 0
        phantom_passed = False
        report = {}

        while not phantom_passed and phantom_attempt < self.max_phantom_attempts:
            phantom_attempt += 1
            print(f"\n  🌀 Phantom simulation attempt {phantom_attempt}/{self.max_phantom_attempts}")

            sandbox = PhantomSandboxManager(repo_path, branch_name)
            report = sandbox.run_full_simulation()

            if report.get("verdict") == "CLEAN":
                phantom_passed = True
                print("  👻 Phantom simulation PASSED! Code is ready for the real world.")

            elif report.get("verdict") == "WARN":
                phantom_passed = True  # نسمح بالمرور مع تحذيرات
                print("  ⚠️ Phantom simulation passed with warnings.")

            elif report.get("verdict") == "BLOCK":
                print("  🚫 Phantom simulation BLOCKED the code!")

                # نحصل على prompt التشريح لإرساله للذكاء الاصطناعي
                autopsy_prompt = sandbox.get_autopsy_prompt_if_blocked()

                if autopsy_prompt:
                    print("  🪦 Sending autopsy report to AI for correction...")

                    # نرسل تقرير التشريح للـ Coder ليصحح
                    self.coder.fix_based_on_phantom_autopsy(
                        autopsy_prompt, branch_name, repo_path
                    )

                    # نحفظ التجربة في الذاكرة الجينية
                    self.genome.encode_experience(
                        task=task,
                        error_report=f"Phantom BLOCK: {report.get('immune_verdict', {}).get('recommendation', '')}",
                        final_fix=f"Applied phantom autopsy fix, attempt {phantom_attempt}"
                    )
                else:
                    break
            else:
                print(f"  ❓ Phantom returned unexpected verdict: {report.get('verdict')}")
                break

        if not phantom_passed:
            print("❌ Code failed phantom simulation. PR will NOT be created.")
            self._save_genome()
            return False

        # ── إنشاء PR ──
        print("\n📤 Phase 5: Creating Pull Request...")
        self._create_pr(branch_name, task, report)

        # ── حفظ الذاكرة الجينية ──
        self._save_genome()

        print("\n🎉 Task completed successfully!")
        return True

    def _get_project_context(self, repo_path: str) -> str:
        """يجمع سياق المشروع"""
        from pathlib import Path
        context_parts = []
        repo = Path(repo_path)

        for f in list(repo.glob("*.py"))[:5] + list(repo.glob("*.js"))[:5] + list(repo.glob("*.ts"))[:5]:
            try:
                content = f.read_text(errors='ignore')[:500]
                context_parts.append(f"File: {f.name}\n{content}")
            except Exception:
                pass

        return "\n".join(context_parts[:3000])

    def _save_genome(self):
        """يحفظ الذاكرة الجينية في المستودع"""
        import subprocess
        subprocess.run(["git", "add", "ai_genome/"], capture_output=True)
        subprocess.run(
            ["git", "commit", "-m", "🧬 Genetic Memory Update: Evolving...", "--allow-empty"],
            capture_output=True
        )
        subprocess.run(["git", "push", "origin", "main"], capture_output=True)

    def _create_pr(self, branch_name: str, task: str, phantom_report: dict):
        """ينشئ Pull Request مع تقرير الساندبوكس"""
        try:
            from github import Github
        except ImportError:
            print("  ⚠️ PyGithub not installed. Skipping PR creation.")
            return

        g = Github(os.getenv('GITHUB_TOKEN'))
        repo = g.get_repo(os.getenv('GITHUB_REPOSITORY'))

        # بناء جسم PR مع تقرير الساندبوكس
        body = f"## 🧠 Auto-Generated by Sentient Core\n\n### Task\n{task}\n"

        if phantom_report:
            verdict = phantom_report.get("verdict", "UNKNOWN")
            immune = phantom_report.get("immune_verdict", {})

            body += f"\n### 👻 Phantom Sandbox Report\n"
            body += f"- **Verdict:** `{verdict}`\n"
            body += f"- **Total Alerts:** {immune.get('total_alerts', 0)}\n"
            body += f"- **Critical:** {immune.get('critical_alerts', 0)} | "
            body += f"**High:** {immune.get('high_alerts', 0)} | "
            body += f"**Medium:** {immune.get('medium_alerts', 0)}\n"

            phases = phantom_report.get("phases", {})

            if "birth" in phases:
                body += f"\n**Birth:** {phases['birth'].get('status', 'unknown')} "
                body += f"(build: {phases['birth'].get('build_time', 0)}s, "
                body += f"startup: {phases['birth'].get('startup_time', 0)}s)\n"

            if "probes" in phases:
                body += f"**Probes:** {phases['probes'].get('successful', 0)}/{phases['probes'].get('total_probes', 0)} OK\n"

            if "memory" in phases:
                leak = phases['memory'].get('leak_detected', False)
                body += f"**Memory:** {'🩸 Leak detected!' if leak else '✅ Stable'}\n"

            if "chaos" in phases:
                body += f"**Chaos:** {phases['chaos'].get('resilient', 0)} resilient, "
                body += f"{phases['chaos'].get('crashed', 0)} crashed\n"

            if immune.get("alerts"):
                body += "\n### 🚨 Alerts\n"
                for alert in immune["alerts"][:5]:  # أهم 5 تنبيهات
                    emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🔵"}.get(alert["severity"], "⚪")
                    body += f"- {emoji} **{alert['category']}**: {alert['message']}\n"

        try:
            pr = repo.create_pull(
                title=f"🧠 {task[:60]}",
                body=body,
                head=branch_name,
                base="main"
            )
            print(f"  📤 PR created: #{pr.number}")
        except Exception as e:
            print(f"  ⚠️ PR creation failed: {e}")


# ── نقطة الدخول ──
if __name__ == "__main__":
    task = os.getenv('TASK_DESCRIPTION', 'No task specified')
    branch_name = os.getenv('BRANCH_NAME', f"sentient-{int(time.time())}")
    repo_path = os.getenv('GITHUB_WORKSPACE', '.')

    core = SentientCore()
    success = core.execute_task(task, branch_name, repo_path)

    if not success:
        sys.exit(1)
