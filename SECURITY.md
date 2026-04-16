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

## Sensitive Configuration Management

### Required Environment Variables (Production)

The following environment variables **MUST** be set in production (`APP_ENV=production`):

#### Cryptographic Keys (Required)
- `KEM_MASTER_SEED` — Master seed for Key Encapsulation Mechanism
- `DSA_SIGNING_KEY` — Private key for Digital Signature Algorithm
- `JWT_SECRET` — Secret key for JWT token signing (optional, falls back to derived key)

#### API Keys (Optional)
- `GEMINI_API_KEY` — Google Gemini API access
- `GROK_API_KEY` — xAI Grok API access
- `OPENROUTER_API_KEY` — OpenRouter API access
- `VAULT_TOKEN` — HashiCorp Vault access token

#### Frontend Configuration
- `VITE_API_BASE_URL` — Backend API endpoint URL
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `VITE_SITE_ACCESS_CODE` — Optional site-wide access code

### Configuration Best Practices

1. **Never commit secrets** to version control
   - All `.env` files are git-ignored (except `.env.example`)
   - Use `python scripts/secret_scan.py` before commits

2. **Use environment variables** for all sensitive data
   - Development: Copy `.env.example` to `.env` and fill in values
   - Production: Configure in Render.com dashboard (marked as `sync: false`)

3. **Rotate secrets regularly**
   - Generate new keys using cryptographically secure methods
   - Update both production environment and local `.env`

4. **Validate configuration at startup**
   - Backend validates required variables in production mode
   - Startup fails gracefully with clear error messages

5. **Docker Compose security**
   - All sensitive variables use `${VAR:-default}` syntax
   - Development defaults are clearly marked as insecure
   - Read values from host environment or `.env` file

## Responsible Disclosure

We follow responsible disclosure practices. We ask that you:

1. Allow us reasonable time to fix the vulnerability before public disclosure
2. Make a good faith effort to avoid privacy violations, data destruction, or service disruption
3. Do not access or modify data belonging to other users
