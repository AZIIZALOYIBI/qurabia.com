import hashlib
import re

_DANGEROUS_PATTERNS = [
    re.compile(p, re.IGNORECASE | re.DOTALL)
    for p in [
        r"rm\s+-rf\s+/",
        r"format\s+[A-Z]:",
        r"dd\s+if=",
        r";\s*rm\s+",
        r"\$\(\s*rm\s+",
        r"`rm\s+",
        r"steal.*password",
        r"leak.*secret",
        r"exfiltrat.*token",
        r"disable\s+firewall",
        r"bypass\s+auth",
        r"docker\s+escape",
        r"--privileged",
        r"drop\s+database",
        r"truncate\s+table",
        r"wipe\s+disk",
        r"destroy\s+all",
    ]
]

_SUSPICIOUS_KEYWORDS = [
    "drop database",
    "truncate table",
    "wipe disk",
    "destroy all",
    "delete everything",
    "format drive",
    "root exploit",
]

_MAX_INPUT_LENGTH = 5000
_CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x1f\x7f]")


class SecurityShield:
    def __init__(self, max_input_length: int = _MAX_INPUT_LENGTH):
        self.max_input_length = max_input_length
        self._blocked_count = 0
        self._allowed_count = 0

    def sanitize(self, text: str) -> str:
        return _CONTROL_CHAR_PATTERN.sub("", text)

    def check(self, text: str) -> tuple[bool, str | None]:
        if len(text) > self.max_input_length:
            return False, f"الإدخال يتجاوز الحد المسموح ({self.max_input_length} حرف)"

        sanitized = self.sanitize(text)

        for pattern in _DANGEROUS_PATTERNS:
            match = pattern.search(sanitized)
            if match:
                self._blocked_count += 1
                return False, "تم رفض الإدخال: يحتوي نمطاً خطيراً"

        lower = sanitized.lower()
        for keyword in _SUSPICIOUS_KEYWORDS:
            if keyword in lower:
                self._blocked_count += 1
                return False, f"تم رفض الإدخال: يحتوي كلمة مريبة ({keyword})"

        self._allowed_count += 1
        return True, None

    def content_hash(self, text: str) -> str:
        normalized = re.sub(r"\d+", "N", re.sub(r"/\S+/", "/PATH/", text.strip()))
        return hashlib.sha256(normalized.encode()).hexdigest()[:16]

    def stats(self) -> dict:
        return {
            "blocked": self._blocked_count,
            "allowed": self._allowed_count,
            "total": self._blocked_count + self._allowed_count,
        }


security_shield = SecurityShield()
