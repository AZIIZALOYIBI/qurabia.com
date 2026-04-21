$ErrorActionPreference = "Stop"

function Step($name, [ScriptBlock]$block) {
  Write-Host ""
  Write-Host "==> $name"
  & $block
}

$repoRoot = Split-Path -Parent $PSScriptRoot

Step "Secret scan" {
  Push-Location $repoRoot
  try {
    python scripts/secret_scan.py
  } finally {
    Pop-Location
  }
}

Step "Backend tests" {
  Push-Location (Join-Path $repoRoot "backend")
  try {
    python -m pip install -r requirements.txt
    pytest -q
  } finally {
    Pop-Location
  }
}

Step "Frontend tests" {
  Push-Location (Join-Path $repoRoot "frontend")
  try {
    npm install --no-audit --no-fund
    npm test
  } finally {
    Pop-Location
  }
}

Step "Frontend build" {
  Push-Location (Join-Path $repoRoot "frontend")
  try {
    npm run build
  } finally {
    Pop-Location
  }
}

Write-Host ""
Write-Host "QUALITY GATE: PASS"

