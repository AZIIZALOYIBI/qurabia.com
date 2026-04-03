---
name: backend-service-fix-or-refactor
description: Workflow command scaffold for backend-service-fix-or-refactor in qurabia.com.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /backend-service-fix-or-refactor

Use this workflow when working on **backend-service-fix-or-refactor** in `qurabia.com`.

## Goal

Apply bug fixes or refactorings to backend service modules, often in tandem (e.g., dsa_service.py and kem_service.py), typically for security, code quality, or efficiency improvements.

## Common Files

- `backend/dsa_service.py`
- `backend/kem_service.py`
- `backend/main.py`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify issue in backend service logic (e.g., duplicated code, security flaw).
- Edit affected backend service files (commonly dsa_service.py and kem_service.py).
- Optionally update main.py if integration or startup logic is affected.
- Commit changes with a descriptive message.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.