"""
Tests for security features: persistent rate limiting, startup env validation,
and CSP / middleware headers.
"""
import os
import sqlite3
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient

# Must set APP_ENV before importing main so _validate_env() doesn't abort
os.environ.setdefault("APP_ENV", "development")

from main import (
    _RATE_LIMIT_REQUESTS,
    _validate_env,
    app,
)

client = TestClient(app)


# ── Rate limiting (in-memory) ─────────────────────────────────────────────────

class TestInMemoryRateLimit:
    """Verify the original in-memory rate limiter still works."""

    def test_health_returns_ok(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_rate_limit_returns_429(self):
        """Hammering the endpoint beyond the limit should yield 429."""
        # Use a dedicated path and a fresh IP via header override
        for i in range(_RATE_LIMIT_REQUESTS):
            r = client.get("/health", headers={"X-Forwarded-For": "192.0.2.99"})
            assert r.status_code == 200, f"Request {i} unexpectedly blocked"
        # Next request should be blocked
        r = client.get("/health", headers={"X-Forwarded-For": "192.0.2.99"})
        assert r.status_code == 429
        assert "Retry-After" in r.headers

    def test_security_headers_set(self):
        r = client.get("/health")
        assert r.headers.get("X-Content-Type-Options") == "nosniff"
        assert r.headers.get("X-Frame-Options") == "DENY"
        assert r.headers.get("Referrer-Policy") == "no-referrer"

    def test_hsts_header_in_production(self, monkeypatch):
        """HSTS header should be set when APP_ENV is production."""
        import main as m
        monkeypatch.setattr(m, "_APP_ENV", "production")
        r = client.get("/health", headers={"X-Forwarded-For": "192.0.2.100"})
        assert r.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains; preload"

    def test_hsts_header_absent_in_development(self):
        """HSTS header should NOT be set in development mode."""
        r = client.get("/health")
        assert r.headers.get("Strict-Transport-Security") is None


# ── Rate limiting (persistent / SQLite) ───────────────────────────────────────

class TestPersistentRateLimit:
    """Test the SQLite-backed rate limiter independently of middleware wiring."""

    def setup_method(self):
        import main as m
        self._orig_db = m._rate_db
        self._orig_requests = m._RATE_LIMIT_REQUESTS
        self._orig_window = m._RATE_LIMIT_WINDOW

        self.tmpfile = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmpfile.close()

        self.db = sqlite3.connect(self.tmpfile.name, check_same_thread=False)
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS rate_hits "
            "(ip TEXT NOT NULL, ts REAL NOT NULL)"
        )
        self.db.execute(
            "CREATE INDEX IF NOT EXISTS idx_rate_ip_ts ON rate_hits (ip, ts)"
        )
        self.db.commit()

        m._rate_db = self.db
        m._RATE_LIMIT_REQUESTS = 3
        m._RATE_LIMIT_WINDOW = 5

    def teardown_method(self):
        import main as m
        m._rate_db = self._orig_db
        m._RATE_LIMIT_REQUESTS = self._orig_requests
        m._RATE_LIMIT_WINDOW = self._orig_window
        self.db.close()
        os.unlink(self.tmpfile.name)

    def _make_request(self, ip: str = "10.0.0.1"):
        """Create a mock request with the given forwarded IP."""
        from starlette.requests import Request
        scope = {
            "type": "http",
            "method": "GET",
            "path": "/health",
            "headers": [(b"x-forwarded-for", ip.encode())],
        }
        return Request(scope)

    def test_allows_within_limit(self):
        import main as m
        for _ in range(3):
            assert m._check_rate_limit_persistent(self._make_request()) is True

    def test_blocks_over_limit(self):
        import main as m
        for _ in range(3):
            m._check_rate_limit_persistent(self._make_request())
        assert m._check_rate_limit_persistent(self._make_request()) is False

    def test_different_ips_independent(self):
        import main as m
        for _ in range(3):
            m._check_rate_limit_persistent(self._make_request("10.0.0.1"))
        assert m._check_rate_limit_persistent(self._make_request("10.0.0.1")) is False
        assert m._check_rate_limit_persistent(self._make_request("10.0.0.2")) is True

    def test_data_persists_in_db(self):
        import main as m
        m._check_rate_limit_persistent(self._make_request())
        row = self.db.execute("SELECT COUNT(*) FROM rate_hits").fetchone()
        assert row[0] == 1


# ── Startup env validation ────────────────────────────────────────────────────

class TestEnvValidation:
    """Verify _validate_env behaviour in prod vs dev modes."""

    def test_dev_mode_warns_but_does_not_exit(self, monkeypatch):
        """In development mode, missing secrets produce warnings, not failures."""
        monkeypatch.setenv("APP_ENV", "development")
        monkeypatch.delenv("KEM_MASTER_SEED", raising=False)
        monkeypatch.delenv("DSA_SIGNING_KEY", raising=False)
        # Should not raise
        _validate_env()

    def test_prod_mode_exits_on_missing_secrets(self, monkeypatch):
        """In production mode, missing KEM/DSA secrets cause a hard exit."""
        monkeypatch.setenv("APP_ENV", "production")
        monkeypatch.delenv("KEM_MASTER_SEED", raising=False)
        monkeypatch.delenv("DSA_SIGNING_KEY", raising=False)
        with pytest.raises(SystemExit):
            _validate_env()

    def test_prod_mode_ok_when_secrets_set(self, monkeypatch):
        monkeypatch.setenv("APP_ENV", "production")
        monkeypatch.setenv("KEM_MASTER_SEED", "test-seed-value")
        monkeypatch.setenv("DSA_SIGNING_KEY", "test-key-value")
        # Should not raise
        _validate_env()


# ── Content-Length enforcement ────────────────────────────────────────────────

class TestContentLengthEnforcement:
    def test_oversized_body_rejected(self):
        r = client.post(
            "/process",
            json={"input": "x"},
            headers={"Content-Length": "999999999"},
        )
        assert r.status_code == 413
