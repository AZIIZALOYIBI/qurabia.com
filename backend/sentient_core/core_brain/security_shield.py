# core_brain/security_shield.py

import re


class SecurityShield:
    """
    الدرع الأمني: يفحص المهمة قبل أي تنفيذ
    يمنع المهام الخبيثة أو الخطيرة من الوصول للنظام
    """

    # ── أنماط محظورة ──
    DANGEROUS_PATTERNS: list[str] = [
        # محاولات حذف أو تدمير
        r'\brm\s+-rf\b',
        r'\bformat\s+[cC]:\b',
        r'\bdd\s+if=/dev/zero\s+of=/',
        r'\bshutdown\b',
        r'\breboot\b',

        # حقن أوامر
        r';\s*(rm|del|format|mkfs)',
        r'\$\(.*rm.*\)',
        r'`.*rm.*`',

        # وصول لبيانات حساسة
        r'\b(?:steal|leak|exfiltrate)\b.*\b(?:password|secret|token|key)\b',
        r'\bcat\s+/etc/(?:passwd|shadow)\b',

        # تعطيل الأمان
        r'\bdisable\b.*\b(?:firewall|antivirus|security)\b',
        r'\bbypass\b.*\b(?:auth|authentication|2fa|mfa)\b',

        # محاولات هروب الساندبوكس
        r'\bdocker\s+escape\b',
        r'--privileged\s+--pid=host',

        # طلبات مشبوهة واضحة
        r'\b(?:hack|crack|exploit|rootkit|malware|ransomware|keylogger)\b',
    ]

    # ── كلمات مفتاحية تستوجب مراجعة يدوية ──
    SUSPICIOUS_KEYWORDS: list[str] = [
        "delete all",
        "drop database",
        "truncate table",
        "wipe",
        "destroy",
        "overwrite production",
    ]

    def __init__(self):
        self.compiled_patterns = [
            re.compile(p, re.IGNORECASE) for p in self.DANGEROUS_PATTERNS
        ]
        self.last_rejection_reason = ""

    def is_safe(self, task: str) -> bool:
        """
        يتحقق من أمان المهمة
        يعيد True إذا كانت المهمة آمنة، False إذا كانت خطيرة
        """
        task_lower = task.lower()

        # ── فحص الأنماط الخطيرة ──
        for pattern in self.compiled_patterns:
            match = pattern.search(task)
            if match:
                self.last_rejection_reason = (
                    f"Dangerous pattern detected: '{match.group()}' in task"
                )
                print(f"🛡️ Security Shield: BLOCKED - {self.last_rejection_reason}")
                return False

        # ── فحص الكلمات المشبوهة ──
        for keyword in self.SUSPICIOUS_KEYWORDS:
            if keyword in task_lower:
                self.last_rejection_reason = (
                    f"Suspicious keyword detected: '{keyword}'"
                )
                print(f"🛡️ Security Shield: BLOCKED - {self.last_rejection_reason}")
                return False

        # ── فحص طول المهمة (ضد هجمات prompt injection الطويلة) ──
        if len(task) > 5000:
            self.last_rejection_reason = "Task exceeds maximum allowed length (5000 chars)"
            print(f"🛡️ Security Shield: BLOCKED - {self.last_rejection_reason}")
            return False

        print("🛡️ Security Shield: PASSED - Task is safe to execute")
        return True

    def sanitize_task(self, task: str) -> str:
        """ينظف المهمة من أي محاولات حقن"""
        # إزالة أحرف التحكم
        task = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', task)
        # تحديد الطول
        return task[:5000].strip()
