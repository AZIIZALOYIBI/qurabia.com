"""
Vault Client — Mock / Placeholder
----------------------------------
Production usage: replace the MockVaultClient with a real hvac-based client
pointed at your HashiCorp Vault instance and set the VAULT_ADDR / VAULT_TOKEN
environment variables.

# TODO: replace MockVaultClient with real hvac integration before production deployment
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger("qurabia.vault")

# ── Environment-driven configuration ──────────────────────────────────────────
_VAULT_ADDR = os.environ.get("VAULT_ADDR", "")
_VAULT_TOKEN = os.environ.get("VAULT_TOKEN", "")

# In-memory secret store used by the mock client
_MOCK_SECRETS: Dict[str, Any] = {
    "kem/master_seed": "mock-kem-master-seed-replace-in-prod",
    "dsa/signing_key": "mock-dsa-signing-key-replace-in-prod",
}


class MockVaultClient:
    """Safe mock Vault client — stores secrets in memory for local/test use.

    # TODO: Replace with hvac.Client for production environments.
    """

    def read_secret(self, path: str) -> Optional[str]:
        value = _MOCK_SECRETS.get(path)
        if value is None:
            logger.warning("MockVaultClient: secret not found at path '%s'", path)
        return value

    def write_secret(self, path: str, value: Any) -> None:
        _MOCK_SECRETS[path] = value
        logger.debug("MockVaultClient: wrote secret at path '%s'", path)


def get_vault_client() -> MockVaultClient:
    """Return a vault client instance.

    When VAULT_ADDR and VAULT_TOKEN are set this function can be extended to
    return a real hvac-based client.  Until then it falls back to the safe
    mock implementation.
    """
    if _VAULT_ADDR and _VAULT_TOKEN:
        # TODO: initialise hvac.Client(url=_VAULT_ADDR, token=_VAULT_TOKEN)
        logger.info("VaultClient: VAULT_ADDR is set but real client not wired — using mock")
    return MockVaultClient()


# Module-level singleton
vault = get_vault_client()
