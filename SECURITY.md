# Security Policy — QURABIA

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in QURABIA, especially in:

- **KEM/DSA cryptographic services** (`kem_service.py`, `dsa_service.py`)
- **AUTDIE quantum security framework** (`autdie_framework.py`)
- **Rate limiting or CORS bypass** (`main.py`)
- **Secret exposure** (`vault_client.py`, environment variables)

Please email the repository owner directly. **Do NOT open a public GitHub issue for security vulnerabilities.**

### What to include in your report

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment
4. Suggested fix (optional)

### Response timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix deployment**: Depends on severity (critical: ASAP, high: within 1 week)

## Cryptographic Algorithms

QURABIA implements post-quantum cryptography:

- **ML-KEM** (NIST FIPS 203) — Key Encapsulation Mechanism
- **ML-DSA** (NIST FIPS 204) — Digital Signature Algorithm
- **SLH-DSA** (NIST FIPS 205) — Stateless Hash-Based Digital Signature
- **BB84** Quantum Key Distribution (simulation)

> ⚠️ **Important**: These are **educational simulations**, not production cryptographic implementations. Do not use them for real-world security applications.

## Security Measures

### Backend
- Rate limiting (configurable per-IP, default: 60 req/min)
- Input validation via Pydantic models
- CORS allowlist (production origins only)
- GZip middleware with minimum size threshold
- Environment variable validation at startup
- Structured logging (no secrets in logs)

### Frontend
- Content Security Policy (CSP) via meta tag
- No inline scripts (script-src restrictions)
- Strict connect-src allowlist
- No external image sources

### Infrastructure
- Secrets managed via Render.com environment variables
- No hardcoded secrets in source code
- Secret scanning via `scripts/secret_scan.py` in CI
- Pre-commit hooks for file hygiene

## Responsible Disclosure

We follow responsible disclosure practices. We ask that you:

1. Allow us reasonable time to fix the vulnerability before public disclosure
2. Make a good faith effort to avoid privacy violations, data destruction, or service disruption
3. Do not access or modify data belonging to other users
