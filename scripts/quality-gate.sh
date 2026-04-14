#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Secret scan"
(cd "$repo_root" && python3 scripts/secret_scan.py)

echo "==> Backend tests"
(cd "$repo_root/backend" && python3 -m pip install -r requirements.txt && pytest -q)

echo "==> Frontend tests"
(cd "$repo_root/frontend" && npm install --no-audit --no-fund && npm test)

echo "==> Frontend build"
(cd "$repo_root/frontend" && npm run build)

echo "QUALITY GATE: PASS"

