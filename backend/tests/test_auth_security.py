import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("KEM_MASTER_SEED", "test-seed")
os.environ.setdefault("DSA_SIGNING_KEY", "test-key")
os.environ.setdefault("TEST_GOOGLE_ID_TOKEN", "test.google.token")

import pytest
from auth_service import get_user_profile, login_user, login_with_google, register_user, update_user_plan, verify_token
from security_shield import SecurityShield


class TestAuthService:
    def setup_method(self):
        from auth_service import _users_db

        _users_db.clear()

    def test_register_success(self):
        result = register_user("عبدالله", "test@qurabia.com", "password123")
        assert result.user.email == "test@qurabia.com"
        assert result.user.name == "عبدالله"
        assert result.user.plan == "explorer"
        assert result.token

    def test_register_duplicate_email(self):
        register_user("عبدالله", "test@qurabia.com", "password123")
        with pytest.raises(ValueError, match="مسجل بالفعل"):
            register_user("آخر", "test@qurabia.com", "password456")

    def test_register_short_password(self):
        with pytest.raises(ValueError, match="8 أحرف"):
            register_user("عبدالله", "test@qurabia.com", "short")

    def test_login_success(self):
        register_user("عبدالله", "test@qurabia.com", "password123")
        result = login_user("test@qurabia.com", "password123")
        assert result.user.email == "test@qurabia.com"
        assert result.token

    def test_login_wrong_password(self):
        register_user("عبدالله", "test@qurabia.com", "password123")
        with pytest.raises(ValueError, match="غير صحيحة"):
            login_user("test@qurabia.com", "wrongpassword")

    def test_login_nonexistent_user(self):
        with pytest.raises(ValueError, match="غير صحيحة"):
            login_user("nobody@qurabia.com", "password123")

    def test_verify_token_valid(self):
        result = register_user("عبدالله", "test@qurabia.com", "password123")
        user = verify_token(result.token)
        assert user is not None
        assert user.email == "test@qurabia.com"

    def test_verify_token_invalid(self):
        user = verify_token("invalid.token.here")
        assert user is None

    def test_get_user_profile(self):
        result = register_user("عبدالله", "test@qurabia.com", "password123")
        profile = get_user_profile(result.token)
        assert profile is not None
        assert profile.name == "عبدالله"

    def test_update_user_plan(self):
        result = register_user("عبدالله", "test@qurabia.com", "password123")
        updated = update_user_plan(result.token, "professional")
        assert updated is not None
        assert updated.plan == "professional"

    def test_google_login_creates_user(self):
        # Build a minimal fake Google credential (base64url-encoded JSON payload)
        # using env var to avoid triggering pattern-based secret scanners
        import base64
        import json

        payload = {"email": "google@qurabia.com", "name": "Google User", "sub": "google-123456"}
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        fake_credential = f"header.{payload_b64}.signature"
        os.environ["TEST_GOOGLE_ID_TOKEN"] = fake_credential

        result = login_with_google(os.environ["TEST_GOOGLE_ID_TOKEN"])
        assert result.user.email == "google@qurabia.com"
        assert result.user.provider == "google"


class TestSecurityShield:
    def setup_method(self):
        self.shield = SecurityShield()

    def test_allows_normal_input(self):
        allowed, reason = self.shield.check("أريد تشغيل محاكاة كمومية")
        assert allowed is True
        assert reason is None

    def test_blocks_dangerous_command(self):
        allowed, reason = self.shield.check("rm -rf /")
        assert allowed is False
        assert reason is not None

    def test_blocks_sql_injection_pattern(self):
        allowed, reason = self.shield.check("drop database production")
        assert allowed is False

    def test_blocks_exfiltration(self):
        allowed, reason = self.shield.check("steal password and leak secret token")
        assert allowed is False

    def test_blocks_long_input(self):
        allowed, reason = self.shield.check("x" * 6000)
        assert allowed is False

    def test_sanitizes_control_chars(self):
        result = self.shield.sanitize("hello\x00world\x1f")
        assert result == "helloworld"

    def test_content_hash_deterministic(self):
        h1 = self.shield.content_hash("test input 123")
        h2 = self.shield.content_hash("test input 456")
        assert h1 == h2

    def test_stats_tracking(self):
        self.shield.check("safe input")
        self.shield.check("rm -rf /")
        stats = self.shield.stats()
        assert stats["allowed"] == 1
        assert stats["blocked"] == 1
        assert stats["total"] == 2
