---
name: security-hardening-and-secrets-scrubbing
description: Workflow command scaffold for security-hardening-and-secrets-scrubbing in qurabia.com.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /security-hardening-and-secrets-scrubbing

Use this workflow when working on **security-hardening-and-secrets-scrubbing** in `qurabia.com`.

## Goal

Removes sensitive information and secrets from documentation, code, and configuration files to prevent public exposure.

## Common Files

- `REPORT.md`
- `README.md`
- `backend/.env.example`
- `backend/vault_client.py`
- `backend/dsa_service.py`
- `backend/kem_service.py`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify files containing secrets, technology identifiers, or sensitive architecture details.
- Remove or redact sensitive content from documentation files (e.g., REPORT.md, README.md).
- Remove hardcoded secrets from backend code (e.g., vault_client.py), switch to environment variables.
- Update example environment files (e.g., .env.example) to use generic variable names.
- Remove or obfuscate technology identifiers and service names from code, docstrings, and UI.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.