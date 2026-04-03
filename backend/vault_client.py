"""Vault Client — secrets management."""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger("qurabia.vault")

# ── Environment-driven configuration ──────────────────────────────────────────
_VAULT_ADDR = os.environ.get("VAULT_ADDR", "")
_VAULT_TOKEN = os.environ.get("VAULT_TOKEN", "")

# In-memory secret store — seeds loaded from environment variables
_MOCK_SECRETS: Dict[str, Any] = {
    "kem/master_seed": os.environ.get("KEM_MASTER_SEED", ""),
    "dsa/signing_key": os.environ.get("DSA_SIGNING_KEY", ""),
}


class MockVaultClient:
    """In-memory vault client for local/test use."""

    def read_secret(self, path: str) -> Optional[str]:
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
