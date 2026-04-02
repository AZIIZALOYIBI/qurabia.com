"""
DSA Service — SNQSP Enterprise Integration Layer
================================================
Provides quantum-safe Digital Signature Algorithm (DSA) endpoints.

Supported algorithms:
  - ML_DSA  : Module-Lattice DSA (CRYSTALS-Dilithium / FIPS 204) — mock
  - SLH_DSA : Stateless Hash-Based DSA (SPHINCS+ / FIPS 205) — mock
  - HYBRID  : ML-DSA + classical ECDSA combined (default)

Endpoints (prefix: /api/v2/dsa):
  GET  /health          — liveness probe
  POST /generate        — generate signing keypair
  POST /sign            — sign a message
  POST /verify          — verify a signature

# TODO: Replace mock crypto implementations with liboqs / pqcrypto bindings
        once those libraries are available in the deployment environment.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import os
import secrets
from enum import Enum
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from vault_client import vault

logger = logging.getLogger("qurabia.dsa")

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DSA Service — SNQSP",
    description="Quantum-safe Digital Signature Algorithm (mock/placeholder)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Enums ─────────────────────────────────────────────────────────────────────


class DSAAlgorithm(str, Enum):
    ML_DSA = "ML_DSA"
    SLH_DSA = "SLH_DSA"
    HYBRID = "HYBRID"


# ── Pydantic models ────────────────────────────────────────────────────────────


class GenerateRequest(BaseModel):
    algorithm: DSAAlgorithm = DSAAlgorithm.HYBRID
    security_level: int = Field(
        3, ge=1, le=5, description="Security level (1–5); 3 ≈ 192-bit quantum security"
    )


class GenerateResponse(BaseModel):
    algorithm: DSAAlgorithm
    security_level: int
    public_key: str  # base64-encoded
    private_key: str  # base64-encoded (handle with care)
    vault_path: Optional[str] = None


class SignRequest(BaseModel):
    algorithm: DSAAlgorithm = DSAAlgorithm.HYBRID
    private_key: str = Field(..., description="Base64-encoded private key")
    message: str = Field(..., description="Message to sign (UTF-8 text or base64)")


class SignResponse(BaseModel):
    algorithm: DSAAlgorithm
    signature: str  # base64-encoded
    message_hash: str  # hex-encoded SHA-256 of the message


class VerifyRequest(BaseModel):
    algorithm: DSAAlgorithm = DSAAlgorithm.HYBRID
    public_key: str = Field(..., description="Base64-encoded public key")
    message: str = Field(..., description="Original message")
    signature: str = Field(..., description="Base64-encoded signature to verify")


class VerifyResponse(BaseModel):
    algorithm: DSAAlgorithm
    valid: bool
    message_hash: str


# ── Key-size constants ─────────────────────────────────────────────────────────
# Used to correctly split HYBRID keys/signatures without guessing.
_ML_DSA_PUB_LEN = 48   # bytes (32 sign_seed + 16 random padding)
_ML_DSA_PRIV_LEN = 64  # bytes (32 random + 32 sign_seed)
_ML_DSA_SIG_LEN = 64   # bytes (32 core + 32 random padding)
_SLH_DSA_PUB_LEN = 48
_SLH_DSA_PRIV_LEN = 64
_SLH_DSA_SIG_LEN = 64
_EC_PUB_LEN = 32        # bytes (sha256 of sign_seed)
_EC_PRIV_LEN = 32       # bytes (random)
_EC_SIG_LEN = 32        # bytes (HMAC core)

# ── Mock crypto helpers ─────────────────────────────────────────────────────────
# TODO: Replace these stubs with real liboqs / pqcrypto calls.


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def _mock_ml_dsa_generate(security_level: int) -> tuple[bytes, bytes]:
    """Mock ML-DSA key generation.

    Layout: priv = random(32) || sign_seed(32), pub = sign_seed(32) || random(16).
    sign_seed is unique per keypair (derived from priv_rnd + det_bytes).
    Signing uses priv[32:64] as the HMAC key; verification uses pub[:32].
    Both equal sign_seed, ensuring a consistent sign/verify relationship.
    """
    det_seed = vault.read_secret("dsa/signing_key") or "default-dsa-seed"
    det_bytes = hashlib.sha256(f"ml_dsa:{det_seed}:{security_level}".encode()).digest()
    priv_rnd = secrets.token_bytes(32)
    sign_seed = hashlib.sha256(priv_rnd + det_bytes).digest()
    priv = priv_rnd + sign_seed                                            # 64 bytes
    pub = sign_seed + hashlib.sha256(priv_rnd + b"pub").digest()[:16]     # 48 bytes
    return pub, priv


def _mock_slh_dsa_generate(security_level: int) -> tuple[bytes, bytes]:
    """Mock SLH-DSA key generation — same layout as ML-DSA with a different prefix."""
    det_seed = vault.read_secret("dsa/signing_key") or "default-dsa-seed"
    det_bytes = hashlib.sha256(f"slh_dsa:{det_seed}:{security_level}".encode()).digest()
    priv_rnd = secrets.token_bytes(32)
    sign_seed = hashlib.sha256(priv_rnd + det_bytes).digest()
    priv = priv_rnd + sign_seed
    pub = sign_seed + hashlib.sha256(priv_rnd + b"pub").digest()[:16]
    return pub, priv


def _mock_ecdsa_generate() -> tuple[bytes, bytes]:
    """Mock ECDSA key generation.

    priv = random(32); pub = sha256(priv || b'ecdsa_sign_seed').
    The public key itself serves as the verify key during verification.
    """
    priv = secrets.token_bytes(32)
    pub = hashlib.sha256(priv + b"ecdsa_sign_seed").digest()  # 32 bytes
    return pub, priv


def _mock_ml_dsa_sign(priv_key: bytes, message_bytes: bytes) -> bytes:
    """Mock ML-DSA signature: HMAC-SHA256 using sign_seed (priv[32:64])."""
    sign_seed = priv_key[32:64] if len(priv_key) >= 64 else hashlib.sha256(priv_key).digest()
    core = hmac.new(sign_seed, message_bytes, hashlib.sha256).digest()  # 32 bytes
    return core + secrets.token_bytes(32)                               # 64 bytes total


def _mock_slh_dsa_sign(priv_key: bytes, message_bytes: bytes) -> bytes:
    """Mock SLH-DSA signature — same structure as ML-DSA."""
    sign_seed = priv_key[32:64] if len(priv_key) >= 64 else hashlib.sha256(priv_key).digest()
    core = hmac.new(sign_seed, message_bytes, hashlib.sha256).digest()
    return core + secrets.token_bytes(32)


def _mock_ecdsa_sign(priv_key: bytes, message_bytes: bytes) -> bytes:
    """Mock ECDSA signature: HMAC using the derived sign key."""
    sign_seed = hashlib.sha256(priv_key + b"ecdsa_sign_seed").digest()
    return hmac.new(sign_seed, message_bytes, hashlib.sha256).digest()  # 32 bytes


def _mock_ml_dsa_verify(pub_key: bytes, message_bytes: bytes, signature: bytes) -> bool:
    """Mock ML-DSA verification: compare signature[:32] against HMAC(pub[:32], message)."""
    if len(signature) < 32 or len(pub_key) < 32:
        return False
    verify_key = pub_key[:32]  # == sign_seed embedded during key generation
    expected = hmac.new(verify_key, message_bytes, hashlib.sha256).digest()
    return hmac.compare_digest(signature[:32], expected)


def _mock_slh_dsa_verify(pub_key: bytes, message_bytes: bytes, signature: bytes) -> bool:
    """Mock SLH-DSA verification — mirrors ML-DSA verify."""
    if len(signature) < 32 or len(pub_key) < 32:
        return False
    verify_key = pub_key[:32]
    expected = hmac.new(verify_key, message_bytes, hashlib.sha256).digest()
    return hmac.compare_digest(signature[:32], expected)


def _mock_ecdsa_verify(pub_key: bytes, message_bytes: bytes, signature: bytes) -> bool:
    """Mock ECDSA verification: pub_key IS the verify key (sha256 of priv sign seed)."""
    if len(signature) < 32 or len(pub_key) < 32:
        return False
    verify_key = pub_key[:32]
    expected = hmac.new(verify_key, message_bytes, hashlib.sha256).digest()
    return hmac.compare_digest(signature[:32], expected)


# ── Endpoints ─────────────────────────────────────────────────────────────────


@app.get("/api/v2/dsa/health")
def health() -> dict:
    return {"service": "dsa", "status": "ok", "version": "1.0.0"}


@app.post("/api/v2/dsa/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest) -> GenerateResponse:
    try:
        if req.algorithm == DSAAlgorithm.ML_DSA:
            pub_key, priv_key = _mock_ml_dsa_generate(req.security_level)
        elif req.algorithm == DSAAlgorithm.SLH_DSA:
            pub_key, priv_key = _mock_slh_dsa_generate(req.security_level)
        else:  # HYBRID
            ml_pub, ml_priv = _mock_ml_dsa_generate(req.security_level)
            ec_pub, ec_priv = _mock_ecdsa_generate()
            pub_key = ml_pub + ec_pub
            priv_key = ml_priv + ec_priv

        vault_path = f"dsa/keys/{secrets.token_hex(8)}"
        vault.write_secret(vault_path, _b64(priv_key))

        return GenerateResponse(
            algorithm=req.algorithm,
            security_level=req.security_level,
            public_key=_b64(pub_key),
            private_key=_b64(priv_key),
            vault_path=vault_path,
        )
    except Exception as exc:
        logger.error("DSA generate error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/v2/dsa/sign", response_model=SignResponse)
def sign(req: SignRequest) -> SignResponse:
    try:
        priv_key = base64.b64decode(req.private_key)
        message_bytes = req.message.encode("utf-8")
        msg_hash = hashlib.sha256(message_bytes).hexdigest()

        if req.algorithm == DSAAlgorithm.ML_DSA:
            sig = _mock_ml_dsa_sign(priv_key, message_bytes)
        elif req.algorithm == DSAAlgorithm.SLH_DSA:
            sig = _mock_slh_dsa_sign(priv_key, message_bytes)
        else:  # HYBRID — priv layout: ml_priv(_ML_DSA_PRIV_LEN) || ec_priv(_EC_PRIV_LEN)
            ml_sig = _mock_ml_dsa_sign(priv_key[:_ML_DSA_PRIV_LEN], message_bytes)
            ec_sig = _mock_ecdsa_sign(priv_key[_ML_DSA_PRIV_LEN:], message_bytes)
            sig = ml_sig + ec_sig

        return SignResponse(
            algorithm=req.algorithm,
            signature=_b64(sig),
            message_hash=msg_hash,
        )
    except Exception as exc:
        logger.error("DSA sign error: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/v2/dsa/verify", response_model=VerifyResponse)
def verify(req: VerifyRequest) -> VerifyResponse:
    try:
        pub_key = base64.b64decode(req.public_key)
        message_bytes = req.message.encode("utf-8")
        signature = base64.b64decode(req.signature)
        msg_hash = hashlib.sha256(message_bytes).hexdigest()

        if req.algorithm == DSAAlgorithm.ML_DSA:
            valid = _mock_ml_dsa_verify(pub_key, message_bytes, signature)
        elif req.algorithm == DSAAlgorithm.SLH_DSA:
            valid = _mock_slh_dsa_verify(pub_key, message_bytes, signature)
        else:  # HYBRID — pub layout: ml_pub(_ML_DSA_PUB_LEN) || ec_pub(_EC_PUB_LEN)
            ml_valid = _mock_ml_dsa_verify(pub_key[:_ML_DSA_PUB_LEN], message_bytes, signature[:_ML_DSA_SIG_LEN])
            ec_valid = _mock_ecdsa_verify(pub_key[_ML_DSA_PUB_LEN:], message_bytes, signature[_ML_DSA_SIG_LEN:])
            valid = ml_valid and ec_valid

        return VerifyResponse(
            algorithm=req.algorithm,
            valid=valid,
            message_hash=msg_hash,
        )
    except Exception as exc:
        logger.error("DSA verify error: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc))
