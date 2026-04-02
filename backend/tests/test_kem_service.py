"""
Tests for kem_service.py
"""
import sys
import os

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from kem_service import app, KEMAlgorithm

client = TestClient(app)


# ── Health ─────────────────────────────────────────────────────────────────────

class TestKEMHealth:
    def test_health_ok(self):
        resp = client.get("/api/v2/kem/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["service"] == "kem"

    def test_health_has_version(self):
        resp = client.get("/api/v2/kem/health")
        assert "version" in resp.json()


# ── Generate ───────────────────────────────────────────────────────────────────

class TestKEMGenerate:
    def _generate(self, algorithm="HYBRID", security_level=3):
        return client.post("/api/v2/kem/generate", json={
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

    def test_generate_ml_kem_success(self):
        resp = self._generate("ML_KEM")
        assert resp.status_code == 200
        assert resp.json()["algorithm"] == "ML_KEM"

    def test_generate_x25519_success(self):
        resp = self._generate("X25519")
        assert resp.status_code == 200
        assert resp.json()["algorithm"] == "X25519"

    def test_generate_returns_base64_keys(self):
        import base64
        body = self._generate().json()
        # Should not raise
        base64.b64decode(body["public_key"])
        base64.b64decode(body["private_key"])

    def test_generate_vault_path_returned(self):
        body = self._generate().json()
        assert body.get("vault_path") is not None
        assert body["vault_path"].startswith("kem/keys/")

    def test_generate_security_level_stored(self):
        for level in (1, 3, 5):
            body = self._generate(security_level=level).json()
            assert body["security_level"] == level

    def test_generate_invalid_algorithm(self):
        resp = client.post("/api/v2/kem/generate", json={"algorithm": "INVALID"})
        assert resp.status_code == 422

    def test_generate_invalid_security_level(self):
        resp = client.post("/api/v2/kem/generate", json={"algorithm": "HYBRID", "security_level": 10})
        assert resp.status_code == 422


# ── Encapsulate ────────────────────────────────────────────────────────────────

class TestKEMEncapsulate:
    def _roundtrip_keys(self, algorithm="HYBRID"):
        body = client.post("/api/v2/kem/generate", json={"algorithm": algorithm}).json()
        return body["public_key"], body["private_key"]

    def test_encapsulate_hybrid(self):
        pub, _ = self._roundtrip_keys("HYBRID")
        resp = client.post("/api/v2/kem/encapsulate", json={
            "algorithm": "HYBRID",
            "public_key": pub,
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "ciphertext" in body
        assert "shared_secret" in body

    def test_encapsulate_ml_kem(self):
        pub, _ = self._roundtrip_keys("ML_KEM")
        resp = client.post("/api/v2/kem/encapsulate", json={
            "algorithm": "ML_KEM",
            "public_key": pub,
        })
        assert resp.status_code == 200

    def test_encapsulate_x25519(self):
        pub, _ = self._roundtrip_keys("X25519")
        resp = client.post("/api/v2/kem/encapsulate", json={
            "algorithm": "X25519",
            "public_key": pub,
        })
        assert resp.status_code == 200

    def test_encapsulate_shared_secret_is_base64(self):
        import base64
        pub, _ = self._roundtrip_keys()
        body = client.post("/api/v2/kem/encapsulate", json={
            "algorithm": "HYBRID",
            "public_key": pub,
        }).json()
        base64.b64decode(body["shared_secret"])

    def test_encapsulate_missing_public_key(self):
        resp = client.post("/api/v2/kem/encapsulate", json={"algorithm": "HYBRID"})
        assert resp.status_code == 422


# ── Decapsulate ────────────────────────────────────────────────────────────────

class TestKEMDecapsulate:
    def test_decapsulate_returns_shared_secret(self):
        gen = client.post("/api/v2/kem/generate", json={"algorithm": "HYBRID"}).json()
        enc = client.post("/api/v2/kem/encapsulate", json={
            "algorithm": "HYBRID",
            "public_key": gen["public_key"],
        }).json()
        resp = client.post("/api/v2/kem/decapsulate", json={
            "algorithm": "HYBRID",
            "private_key": gen["private_key"],
            "ciphertext": enc["ciphertext"],
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "shared_secret" in body

    def test_decapsulate_ml_kem(self):
        gen = client.post("/api/v2/kem/generate", json={"algorithm": "ML_KEM"}).json()
        enc = client.post("/api/v2/kem/encapsulate", json={
            "algorithm": "ML_KEM",
            "public_key": gen["public_key"],
        }).json()
        resp = client.post("/api/v2/kem/decapsulate", json={
            "algorithm": "ML_KEM",
            "private_key": gen["private_key"],
            "ciphertext": enc["ciphertext"],
        })
        assert resp.status_code == 200

    def test_decapsulate_missing_fields(self):
        resp = client.post("/api/v2/kem/decapsulate", json={"algorithm": "HYBRID"})
        assert resp.status_code == 422
