"""
Tests for dsa_service.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dsa_service import app
from fastapi.testclient import TestClient

client = TestClient(app)


# ── Health ─────────────────────────────────────────────────────────────────────

class TestDSAHealth:
    def test_health_ok(self):
        resp = client.get("/api/v2/dsa/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["service"] == "dsa"

    def test_health_has_version(self):
        resp = client.get("/api/v2/dsa/health")
        assert "version" in resp.json()


# ── Generate ───────────────────────────────────────────────────────────────────

class TestDSAGenerate:
    def _generate(self, algorithm="HYBRID", security_level=3):
        return client.post("/api/v2/dsa/generate", json={
            "algorithm": algorithm,
            "security_level": security_level,
        })

    def test_generate_hybrid_success(self):
        resp = self._generate("HYBRID")
        assert resp.status_code == 200
        body = resp.json()
        assert body["algorithm"] == "HYBRID"
        assert "public_key" in body
        assert "private_key" in body

    def test_generate_ml_dsa_success(self):
        resp = self._generate("ML_DSA")
        assert resp.status_code == 200
        assert resp.json()["algorithm"] == "ML_DSA"

    def test_generate_slh_dsa_success(self):
        resp = self._generate("SLH_DSA")
        assert resp.status_code == 200
        assert resp.json()["algorithm"] == "SLH_DSA"

    def test_generate_returns_base64_keys(self):
        import base64
        body = self._generate().json()
        base64.b64decode(body["public_key"])
        base64.b64decode(body["private_key"])

    def test_generate_vault_path_returned(self):
        body = self._generate().json()
        assert body.get("vault_path") is not None
        assert body["vault_path"].startswith("dsa/keys/")

    def test_generate_security_level_stored(self):
        for level in (1, 3, 5):
            body = self._generate(security_level=level).json()
            assert body["security_level"] == level

    def test_generate_invalid_algorithm(self):
        resp = client.post("/api/v2/dsa/generate", json={"algorithm": "INVALID"})
        assert resp.status_code == 422

    def test_generate_invalid_security_level(self):
        resp = client.post("/api/v2/dsa/generate", json={
            "algorithm": "HYBRID",
            "security_level": 99,
        })
        assert resp.status_code == 422


# ── Sign ───────────────────────────────────────────────────────────────────────

class TestDSASign:
    def _keypair(self, algorithm="HYBRID"):
        body = client.post("/api/v2/dsa/generate", json={"algorithm": algorithm}).json()
        return body["public_key"], body["private_key"]

    def test_sign_hybrid(self):
        _, priv = self._keypair("HYBRID")
        resp = client.post("/api/v2/dsa/sign", json={
            "algorithm": "HYBRID",
            "private_key": priv,
            "message": "Hello quantum world",
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "signature" in body
        assert "message_hash" in body

    def test_sign_ml_dsa(self):
        _, priv = self._keypair("ML_DSA")
        resp = client.post("/api/v2/dsa/sign", json={
            "algorithm": "ML_DSA",
            "private_key": priv,
            "message": "Test ML-DSA message",
        })
        assert resp.status_code == 200

    def test_sign_slh_dsa(self):
        _, priv = self._keypair("SLH_DSA")
        resp = client.post("/api/v2/dsa/sign", json={
            "algorithm": "SLH_DSA",
            "private_key": priv,
            "message": "Test SLH-DSA message",
        })
        assert resp.status_code == 200

    def test_sign_signature_is_base64(self):
        import base64
        _, priv = self._keypair()
        body = client.post("/api/v2/dsa/sign", json={
            "algorithm": "HYBRID",
            "private_key": priv,
            "message": "check b64",
        }).json()
        base64.b64decode(body["signature"])

    def test_sign_message_hash_is_hex(self):
        _, priv = self._keypair()
        body = client.post("/api/v2/dsa/sign", json={
            "algorithm": "HYBRID",
            "private_key": priv,
            "message": "hash test",
        }).json()
        assert len(body["message_hash"]) == 64
        assert all(c in "0123456789abcdef" for c in body["message_hash"])

    def test_sign_missing_message(self):
        _, priv = self._keypair()
        resp = client.post("/api/v2/dsa/sign", json={
            "algorithm": "HYBRID",
            "private_key": priv,
        })
        assert resp.status_code == 422

    def test_sign_missing_private_key(self):
        resp = client.post("/api/v2/dsa/sign", json={
            "algorithm": "HYBRID",
            "message": "no key",
        })
        assert resp.status_code == 422


# ── Verify ─────────────────────────────────────────────────────────────────────

class TestDSAVerify:
    def _sign_message(self, algorithm="HYBRID", message="test message"):
        gen = client.post("/api/v2/dsa/generate", json={"algorithm": algorithm}).json()
        sig_resp = client.post("/api/v2/dsa/sign", json={
            "algorithm": algorithm,
            "private_key": gen["private_key"],
            "message": message,
        }).json()
        return gen["public_key"], sig_resp["signature"], message

    def test_verify_hybrid_valid(self):
        pub, sig, msg = self._sign_message("HYBRID")
        resp = client.post("/api/v2/dsa/verify", json={
            "algorithm": "HYBRID",
            "public_key": pub,
            "message": msg,
            "signature": sig,
        })
        assert resp.status_code == 200
        assert resp.json()["valid"] is True

    def test_verify_ml_dsa_valid(self):
        pub, sig, msg = self._sign_message("ML_DSA")
        resp = client.post("/api/v2/dsa/verify", json={
            "algorithm": "ML_DSA",
            "public_key": pub,
            "message": msg,
            "signature": sig,
        })
        assert resp.status_code == 200
        assert resp.json()["valid"] is True

    def test_verify_slh_dsa_valid(self):
        pub, sig, msg = self._sign_message("SLH_DSA")
        resp = client.post("/api/v2/dsa/verify", json={
            "algorithm": "SLH_DSA",
            "public_key": pub,
            "message": msg,
            "signature": sig,
        })
        assert resp.status_code == 200
        assert resp.json()["valid"] is True

    def test_verify_returns_message_hash(self):
        pub, sig, msg = self._sign_message()
        body = client.post("/api/v2/dsa/verify", json={
            "algorithm": "HYBRID",
            "public_key": pub,
            "message": msg,
            "signature": sig,
        }).json()
        assert "message_hash" in body
        assert len(body["message_hash"]) == 64

    def test_verify_missing_signature(self):
        pub, _, msg = self._sign_message()
        resp = client.post("/api/v2/dsa/verify", json={
            "algorithm": "HYBRID",
            "public_key": pub,
            "message": msg,
        })
        assert resp.status_code == 422
