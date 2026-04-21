"""
Compat shim to expose the phantom_sandbox package from sentient_core as a top-level import.

Pytest (and any runtime code) expect `import phantom_sandbox.*` to resolve, but the actual
implementation lives under `backend/sentient_core/phantom_sandbox`. By extending sys.path
to include the sentient_core directory and pointing __path__ at the real package, we make
the modules importable without duplicating code.
"""

from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
_SENTIENT_CORE = _ROOT / "sentient_core"
_PHANTOM_IMPL = _SENTIENT_CORE / "phantom_sandbox"

# Ensure Python can locate the real package directory.
if str(_SENTIENT_CORE) not in sys.path:
    sys.path.insert(0, str(_SENTIENT_CORE))

# Delegate module discovery to the actual implementation path.
__path__ = [str(_PHANTOM_IMPL)]

# Optional convenience re-export so `import phantom_sandbox` returns the real package attrs.
try:  # pragma: no cover - defensive guard
    from sentient_core.phantom_sandbox import *  # noqa: F401,F403
except Exception:
    # Fallback silently if the implementation is unavailable; import errors will surface
    # when specific submodules are accessed.
    pass
