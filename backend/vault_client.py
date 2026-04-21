"""Vault Client — secrets management.

Provides a secret store for cryptographic services. Seeds are loaded from
environment variables KEM_MASTER_SEED and DSA_SIGNING_KEY. When these are not
set the store falls back to empty strings and a warning is logged.
"""
from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger("qurabia.vault")

# ── Environment-driven configuration ──────────────────────────────────────────
_VAULT_ADDR = os.environ.get("VAULT_ADDR", "")
_VAULT_TOKEN = os.environ.get("VAULT_TOKEN", "")

# In-memory secret store — seeds loaded from environment variables
_KEM_SEED = os.environ.get("KEM_MASTER_SEED", "")
_DSA_KEY = os.environ.get("DSA_SIGNING_KEY", "")

if not _KEM_SEED:
    logger.warning("KEM_MASTER_SEED not set — using empty fallback")
if not _DSA_KEY:
    logger.warning("DSA_SIGNING_KEY not set — using empty fallback")

_MOCK_SECRETS: dict[str, Any] = {
    "kem/master_seed": _KEM_SEED,
    "dsa/signing_key": _DSA_KEY,
}


class MockVaultClient:
    """In-memory vault client for local/test use."""

    def read_secret(self, path: str) -> str | None:
        value = _MOCK_SECRETS.get(path)
        if value is None:
            logger.warning("VaultClient: secret not found at path '%s'", path)
        return value

    def write_secret(self, path: str, value: Any) -> None:
        _MOCK_SECRETS[path] = value
        logger.debug("VaultClient: wrote secret at path '%s'", path)


def get_vault_client() -> MockVaultClient:
    """Return a vault client instance."""
    return MockVaultClient()


# Module-level singleton
vault = get_vault_client()
