"""KEM Service — Key Encapsulation Mechanism endpoints."""
from __future__ import annotations

import base64
import hashlib
import logging
import os
import secrets
from enum import Enum
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from vault_client import vault

logger = logging.getLogger("qurabia.kem")

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="KEM Service",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

_APP_ENV = os.environ.get("APP_ENV", "production")
_PROD_ORIGINS = [
    "https://qurabia.com",
    "https://www.qurabia.com",
]
_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
_ALLOWED_ORIGINS = _PROD_ORIGINS + (_DEV_ORIGINS if _APP_ENV != "production" else [])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Enums ─────────────────────────────────────────────────────────────────────


class KEMAlgorithm(str, Enum):
    ML_KEM = "ML_KEM"
    X25519 = "X25519"
    HYBRID = "HYBRID"


# ── Pydantic models ────────────────────────────────────────────────────────────


class GenerateRequest(BaseModel):
    algorithm: KEMAlgorithm = KEMAlgorithm.HYBRID
    security_level: int = Field(
        3, ge=1, le=5, description="Security level (1–5); 3 ≈ 192-bit quantum security"
    )


class GenerateResponse(BaseModel):
    algorithm: KEMAlgorithm
    security_level: int
    public_key: str  # base64-encoded
    private_key: str  # base64-encoded (handle with care)
    vault_path: Optional[str] = None


class EncapsulateRequest(BaseModel):
    algorithm: KEMAlgorithm = KEMAlgorithm.HYBRID
    public_key: str = Field(..., description="Base64-encoded public key")


class EncapsulateResponse(BaseModel):
    algorithm: KEMAlgorithm
    ciphertext: str  # base64-encoded
    shared_secret: str  # base64-encoded


class DecapsulateRequest(BaseModel):
    algorithm: KEMAlgorithm = KEMAlgorithm.HYBRID
    private_key: str = Field(..., description="Base64-encoded private key")
    ciphertext: str = Field(..., description="Base64-encoded ciphertext")


class DecapsulateResponse(BaseModel):
    algorithm: KEMAlgorithm
    shared_secret: str  # base64-encoded


# ── Key-size constants ─────────────────────────────────────────────────────────
# Used to correctly split HYBRID keys/ciphertexts without guessing.
_ML_KEM_PUB_LEN = 64   # bytes (32 encap_key + 32 random padding)
_ML_KEM_PRIV_LEN = 64  # bytes (32 random + 32 seed)
_ML_KEM_CT_LEN = 64    # bytes (32 ephemeral + 32 sha256(ss))
_X25519_PUB_LEN = 32   # bytes (sha256 of private key)
_X25519_PRIV_LEN = 32  # bytes (random)
_X25519_CT_LEN = 32    # bytes (ephemeral public key)

# ── Crypto helpers ────────────────────────────────────────────────────────


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def _mock_ml_kem_generate(security_level: int) -> tuple[bytes, bytes]:
    """Mock ML-KEM key generation.

    Layout: priv = random(32) || seed(32), pub = sha256(priv)(32) || random(32).
    The first 32 bytes of pub (the encap_key) matches sha256(priv), enabling
    consistent encapsulation and decapsulation.
    """
    _raw_seed = vault.read_secret("kem/master_seed")
    if not _raw_seed:
        logger.critical(
            "KEM master seed not configured in vault — using insecure fallback seed. "
            "Set the KEM_MASTER_SEED environment variable in production."
        )
    seed = _raw_seed or "default-seed"
    seed_bytes = hashlib.sha256(f"{seed}:{security_level}".encode()).digest()
    priv = secrets.token_bytes(32) + seed_bytes
    encap_key = hashlib.sha256(priv).digest()  # deterministic; used in (de)capsulation
    pub = encap_key + secrets.token_bytes(32)
    return pub, priv


def _mock_x25519_generate() -> tuple[bytes, bytes]:
    """Mock X25519 key generation.

    pub = sha256(priv) — a deterministic, one-way mapping of the private key.
    """
    priv = secrets.token_bytes(32)
    pub = hashlib.sha256(priv).digest()
    return pub, priv


def _mock_ml_kem_encapsulate(pub_key: bytes) -> tuple[bytes, bytes]:
    """Mock ML-KEM encapsulation — returns (ciphertext, shared_secret).

    shared_secret = sha256(encap_key || ephemeral), where encap_key = pub_key[:32].
    Decapsulation reconstructs encap_key as sha256(priv_key), which equals pub_key[:32].
    """
    ephemeral = secrets.token_bytes(32)
    encap_key = pub_key[:32]
    shared_secret = hashlib.sha256(encap_key + ephemeral).digest()
    ciphertext = ephemeral + hashlib.sha256(shared_secret).digest()
    return ciphertext, shared_secret


def _mock_x25519_encapsulate(pub_key: bytes) -> tuple[bytes, bytes]:
    """Mock X25519 encapsulation.

    Simulates Diffie-Hellman symmetry by sorting both public keys before hashing,
    so that encapsulate(pub_A) and decapsulate(priv_A, ct) produce the same secret.
    """
    ephemeral_priv = secrets.token_bytes(32)
    ephemeral_pub = hashlib.sha256(ephemeral_priv).digest()
    # Symmetric DH: sort both public keys so the order is the same in decapsulate
    key_a, key_b = (pub_key, ephemeral_pub) if pub_key <= ephemeral_pub else (ephemeral_pub, pub_key)
    shared_secret = hashlib.sha256(key_a + key_b).digest()
    return ephemeral_pub, shared_secret


def _mock_ml_kem_decapsulate(priv_key: bytes, ciphertext: bytes) -> bytes:
    """Mock ML-KEM decapsulation — deterministic given private key and ciphertext."""
    ephemeral = ciphertext[:32]
    encap_key = hashlib.sha256(priv_key).digest()  # mirrors pub_key[:32] from generate
    return hashlib.sha256(encap_key + ephemeral).digest()


def _mock_x25519_decapsulate(priv_key: bytes, ciphertext: bytes) -> bytes:
    """Mock X25519 decapsulation — mirrors the sorted-key DH used in encapsulate."""
    ephemeral_pub = ciphertext[:32]
    own_pub = hashlib.sha256(priv_key).digest()
    key_a, key_b = (own_pub, ephemeral_pub) if own_pub <= ephemeral_pub else (ephemeral_pub, own_pub)
    return hashlib.sha256(key_a + key_b).digest()


# ── Endpoints ─────────────────────────────────────────────────────────────────


@app.get("/api/v2/kem/health")
def health() -> dict:
    return {"service": "kem", "status": "ok", "version": "1.0.0"}


@app.post("/api/v2/kem/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest) -> GenerateResponse:
    try:
        if req.algorithm in (KEMAlgorithm.ML_KEM, KEMAlgorithm.HYBRID):
            ml_pub, ml_priv = _mock_ml_kem_generate(req.security_level)
        if req.algorithm in (KEMAlgorithm.X25519, KEMAlgorithm.HYBRID):
            x_pub, x_priv = _mock_x25519_generate()

        if req.algorithm == KEMAlgorithm.ML_KEM:
            pub_key = ml_pub
            priv_key = ml_priv
        elif req.algorithm == KEMAlgorithm.X25519:
            pub_key = x_pub
            priv_key = x_priv
        else:  # HYBRID
            pub_key = ml_pub + x_pub
            priv_key = ml_priv + x_priv

        vault_path = f"kem/keys/{secrets.token_hex(8)}"
        vault.write_secret(vault_path, _b64(priv_key))

        return GenerateResponse(
            algorithm=req.algorithm,
            security_level=req.security_level,
            public_key=_b64(pub_key),
            private_key=_b64(priv_key),
            vault_path=vault_path,
        )
    except Exception as exc:
        logger.error("KEM generate error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/v2/kem/encapsulate", response_model=EncapsulateResponse)
def encapsulate(req: EncapsulateRequest) -> EncapsulateResponse:
    try:
        pub_key = base64.b64decode(req.public_key)

        if req.algorithm == KEMAlgorithm.ML_KEM:
            ct, ss = _mock_ml_kem_encapsulate(pub_key)
        elif req.algorithm == KEMAlgorithm.X25519:
            ct, ss = _mock_x25519_encapsulate(pub_key)
        else:  # HYBRID — pub layout: ml_pub(_ML_KEM_PUB_LEN) || x_pub(_X25519_PUB_LEN)
            ml_ct, ml_ss = _mock_ml_kem_encapsulate(pub_key[:_ML_KEM_PUB_LEN])
            x_ct, x_ss = _mock_x25519_encapsulate(pub_key[_ML_KEM_PUB_LEN:])
            ct = ml_ct + x_ct
            ss = hashlib.sha256(ml_ss + x_ss).digest()

        return EncapsulateResponse(
            algorithm=req.algorithm,
            ciphertext=_b64(ct),
            shared_secret=_b64(ss),
        )
    except Exception as exc:
        logger.error("KEM encapsulate error: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/v2/kem/decapsulate", response_model=DecapsulateResponse)
def decapsulate(req: DecapsulateRequest) -> DecapsulateResponse:
    try:
        priv_key = base64.b64decode(req.private_key)
        ciphertext = base64.b64decode(req.ciphertext)

        if req.algorithm == KEMAlgorithm.ML_KEM:
            ss = _mock_ml_kem_decapsulate(priv_key, ciphertext)
        elif req.algorithm == KEMAlgorithm.X25519:
            ss = _mock_x25519_decapsulate(priv_key, ciphertext)
        else:  # HYBRID — priv layout: ml_priv(_ML_KEM_PRIV_LEN) || x_priv(_X25519_PRIV_LEN)
            ml_ss = _mock_ml_kem_decapsulate(priv_key[:_ML_KEM_PRIV_LEN], ciphertext[:_ML_KEM_CT_LEN])
            x_ss = _mock_x25519_decapsulate(priv_key[_ML_KEM_PRIV_LEN:], ciphertext[_ML_KEM_CT_LEN:])
            ss = hashlib.sha256(ml_ss + x_ss).digest()

        return DecapsulateResponse(
            algorithm=req.algorithm,
            shared_secret=_b64(ss),
        )
    except Exception as exc:
        logger.error("KEM decapsulate error: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc))
