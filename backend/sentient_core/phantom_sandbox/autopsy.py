# phantom_sandbox/autopsy.py

import subprocess
import re
from datetime import datetime


class PhantomAutopsy:
    """
    التشريح الشبحي: عندما يموت التطبيق في الساندبوكس
    يقوم بالتشريح لفهم سبب الوفاة بالضبط
    يولد تقريراً طبياً كاملاً يرسله للذكاء الاصطناعي للتصحيح
    """

    def __init__(self, container_name: str, container_id: str, base_url: str):
        self.container_name = container_name
        self.container_id = container_id
        self.base_url = base_url
        self.autopsy_report: dict = {}

    def perform(self, death_context: str = "") -> dict:
        """
        يجري التشريح الكامل
        death_context: ماذا كان يحدث قبل الوفاة
        """
        print("  🪦 Performing Phantom Autopsy...")

        self.autopsy_report = {
            "time_of_death": datetime.utcnow().isoformat(),
            "death_context": death_context,
            "container_state": self._examine_container_state(),
            "application_logs": self._examine_application_logs(),
            "system_logs": self._examine_system_logs(),
            "resource_usage_at_death": self._examine_resource_usage(),
            "network_state": self._examine_network_state(),
            "process_tree": self._examine_process_tree(),
            "cause_of_death": "",
            "corrective_action": "",
        }

        # تحليل سبب الوفاة
        self._determine_cause_of_death()

        return self.autopsy_report

    def _examine_container_state(self) -> dict:
        """يفحص حالة الحاوية"""
        try:
            result = subprocess.run(
                ["docker", "inspect", self.container_name,
                 "--format", "{{.State.Status}} | ExitCode: {{.State.ExitCode}} | Error: {{.State.Error}} | OOMKilled: {{.State.OOMKilled}}"],
                capture_output=True, text=True, timeout=10
            )
            return {"raw": result.stdout.strip(), "oom_killed": "OOMKilled: true" in result.stdout}
        except Exception:
            return {"raw": "unknown"}

    def _examine_application_logs(self) -> str:
        """يقرأ سجلات التطبيق (آخر 100 سطر)"""
        try:
            result = subprocess.run(
                ["docker", "logs", self.container_name, "--tail", "100"],
                capture_output=True, text=True, timeout=10
            )
            return result.stdout[-3000:] + result.stderr[-3000:]
        except Exception:
            return "Could not retrieve logs"

    def _examine_system_logs(self) -> str:
        """يقرأ سجلات النظام داخل الحاوية"""
        logs = ""
        for log_file in ["/var/log/syslog", "/var/log/messages", "/var/log/kern.log"]:
            try:
                result = subprocess.run(
                    ["docker", "exec", self.container_name, "tail", "-20", log_file],
                    capture_output=True, text=True, timeout=5
                )
                if result.returncode == 0:
                    logs += f"\n--- {log_file} ---\n{result.stdout[-1000:]}"
            except Exception:
                pass
        return logs or "No system logs available"

    def _examine_resource_usage(self) -> dict:
        """يفحص استهلاك الموارد"""
        try:
            result = subprocess.run(
                ["docker", "stats", self.container_name, "--no-stream", "--format",
                 "CPU: {{.CPUPerc}} | Memory: {{.MemUsage}} | Net I/O: {{.NetIO}} | Block I/O: {{.BlockIO}}"],
                capture_output=True, text=True, timeout=10
            )
            return {"raw": result.stdout.strip()}
        except Exception:
            return {"raw": "Could not read stats"}

    def _examine_network_state(self) -> str:
        """يفحص حالة الشبكة"""
        try:
            result = subprocess.run(
                ["docker", "exec", self.container_name, "netstat", "-tlnp"],
                capture_output=True, text=True, timeout=5
            )
            return result.stdout[-1000:] if result.returncode == 0 else "netstat not available"
        except Exception:
            return "Could not examine network"

    def _examine_process_tree(self) -> str:
        """يفحص شجرة العمليات"""
        try:
            result = subprocess.run(
                ["docker", "exec", self.container_name, "ps", "auxf"],
                capture_output=True, text=True, timeout=5
            )
            return result.stdout[-1500:] if result.returncode == 0 else "ps not available"
        except Exception:
            return "Could not examine processes"

    def _determine_cause_of_death(self):
        """
        يحلل كل الأدلة ليحدد سبب الوفاة
        يولد أيضاً إجراءً تصحيحياً للذكاء الاصطناعي
        """
        state = self.autopsy_report["container_state"]
        logs = self.autopsy_report["application_logs"]
        system_logs = self.autopsy_report["system_logs"]

        causes = []
        actions = []

        # ── فحص OOM (Out of Memory) ──
        if state.get("oom_killed"):
            causes.append("OOM_KILL - قتلته النواة لأنه استهلك كل الذاكرة")
            actions.append("قلل استهلاك الذاكرة: استخدم generators بدل lists، أضف حدوداً للـ cache، أغلق الموارد غير المستخدمة")

        # ── فحص الأخطاء في السجلات ──
        if "ImportError" in logs or "ModuleNotFoundError" in logs:
            missing = re.findall(r"No module named '(\w+)'", logs)
            if missing:
                causes.append(f"MISSING_DEPENDENCY - مكتبة مفقودة: {', '.join(missing)}")
                actions.append(f"أضف {', '.join(missing)} إلى ملف المتطلبات (requirements.txt أو package.json)")

        if "Address already in use" in logs or "EADDRINUSE" in logs:
            causes.append("PORT_CONFLICT - المنفذ مستخدم من عملية أخرى")
            actions.append("غير المنفذ أو أضف معالجة لإغلاق العملية السابقة")

        if "Permission denied" in logs:
            causes.append("PERMISSION_ERROR - صلاحيات غير كافية")
            actions.append("تحقق من صلاحيات الملفات والمجلدات. قد تحتاج لتغيير مالك الملف أو إضافة صلاحيات التنفيذ")

        if "Connection refused" in logs or "ECONNREFUSED" in logs:
            causes.append("CONNECTION_FAILURE - فشل الاتصال بخدمة خارجية")
            actions.append("تأكد من تشغيل الخدمة المعتمدة (قاعدة بيانات، Redis، إلخ) أو أضف retry logic")

        if "Stack Overflow" in logs or "RecursionError" in logs:
            causes.append("STACK_OVERFLOW - تجاوز سعة المكدس (عادة بسبب عودية لا نهائية)")
            actions.append("أضف شرط توقف للدالة العودية أو حوّلها إلى حلقة تكرارية")

        if "TimeoutError" in logs or "timed out" in logs.lower():
            causes.append("TIMEOUT - انتهت مهلة العملية")
            actions.append("زد قيمة المهلة أو حسّن سرعة العملية. أضف timeout handling مناسب")

        if "SyntaxError" in logs:
            causes.append("SYNTAX_ERROR - خطأ في بناء الكود")
            actions.append("هناك خطأ في بناء الجملة. تحقق من الأقواس والمسافات البادئة")

        # ── فحص سجلات النظام ──
        if "segfault" in system_logs.lower():
            causes.append("SEGFAULT - خطأ تجزئة (عادة خطأ في الذاكرة بلغة C/Rust)")
            actions.append("تحقق من المؤشرات والمصفوفات في الكود الأصلي. قد يكون هناك وصول خارج الحدود")

        # ── إذا لم نجد سبباً واضحاً ──
        if not causes:
            causes.append("UNKNOWN - لم يتم تحديد سبب واضح. قد يكون خطأ وقت التشغيل")
            actions.append("راجع السجلات بعناية. أضف المزيد من التسجيل (logging) لتشخيص المشكلة")

        self.autopsy_report["cause_of_death"] = " | ".join(causes)
        self.autopsy_report["corrective_action"] = " | ".join(actions)

        print(f"  🪦 Cause of death: {self.autopsy_report['cause_of_death'][:200]}")
        print(f"  💊 Corrective action: {self.autopsy_report['corrective_action'][:200]}")

    def generate_ai_fix_prompt(self, task: str, code_context: str) -> str:
        """
        يولد prompt للذكاء الاصطناعي بناءً على التشريح
        """
        return f"""
URGENT CODE CORRECTION REQUIRED - PHANTOM AUTOPSY REPORT

The code you wrote has DIED in the phantom sandbox. Here is the full autopsy:

=== CAUSE OF DEATH ===
{self.autopsy_report["cause_of_death"]}

=== DEATH CONTEXT ===
{self.autopsy_report["death_context"]}

=== APPLICATION LAST WORDS (Logs) ===
{self.autopsy_report["application_logs"][:3000]}

=== SYSTEM STATE AT DEATH ===
Container State: {self.autopsy_report["container_state"].get("raw", "unknown")}
Resource Usage: {self.autopsy_report["resource_usage_at_death"].get("raw", "unknown")}

=== PRESCRIBED TREATMENT ===
{self.autopsy_report["corrective_action"]}

=== ORIGINAL TASK ===
{task}

=== CODE CONTEXT ===
{code_context[:5000]}

Based on this AUTOPSY, write the corrected code. Focus specifically on fixing the cause of death.
Do NOT rewrite everything - only fix what's broken. Preserve the original logic and intent.
"""
