```markdown
# qurabia.com Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill document outlines the key development patterns, coding conventions, and operational workflows for the `qurabia.com` TypeScript codebase. It covers file organization, import/export styles, security hardening practices, and report management processes to help maintain code quality and compliance.

## Coding Conventions

### File Naming
- **PascalCase** is used for file names.
  - Example: `GeminiService.ts`, `GrokService.ts`

### Import Style
- **Relative imports** are preferred.
  ```typescript
  import { GeminiService } from './GeminiService';
  ```

### Export Style
- **Named exports** are used.
  ```typescript
  // GeminiService.ts
  export function GeminiService() { /* ... */ }
  ```

## Workflows

### Security Hardening and Secrets Scrubbing
**Trigger:** When sensitive information or technology details are found in the codebase or documentation and need to be removed for security/compliance.  
**Command:** `/scrub-secrets`

1. **Identify** files containing secrets, technology identifiers, or sensitive architecture details.
2. **Remove or redact** sensitive content from documentation files (e.g., `REPORT.md`, `README.md`).
3. **Remove hardcoded secrets** from backend code (e.g., `vault_client.py`), and switch to environment variables.
   ```python
   # Before
   SECRET_KEY = "hardcoded-secret"
   
   # After
   import os
   SECRET_KEY = os.getenv("SECRET_KEY")
   ```
4. **Update example environment files** (e.g., `.env.example`) to use generic variable names.
   ```
   # .env.example
   SECRET_KEY=your-secret-key
   ```
5. **Remove or obfuscate technology identifiers** and service names from code, docstrings, and UI.
6. **Disable public documentation endpoints** (e.g., OpenAPI/Swagger) in backend services.
7. **Clean up package metadata** (e.g., `package.json`) to remove revealing information.

**Files Involved:**
- `REPORT.md`
- `README.md`
- `backend/.env.example`
- `backend/vault_client.py`
- `backend/dsa_service.py`
- `backend/kem_service.py`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/index.html`
- `frontend/src/engine/GeminiService.ts`
- `frontend/src/engine/GrokService.ts`

### Report Generation and Removal
**Trigger:** When a new report needs to be published or an existing sensitive report needs to be removed.  
**Command:** `/update-report`

1. **Create or update** `REPORT.md` with relevant content.
2. **Commit** `REPORT.md` to the repository.
3. **Remove** `REPORT.md` if it contains sensitive or outdated information.

**Files Involved:**
- `REPORT.md`

## Testing Patterns

- **Framework:** Unknown (not detected)
- **Test File Pattern:** Files are named with `*.test.*`
  - Example: `GeminiService.test.ts`
- **Location:** Test files are placed alongside source files or in relevant directories.

## Commands

| Command         | Purpose                                                      |
|-----------------|--------------------------------------------------------------|
| /scrub-secrets  | Remove or redact secrets and sensitive information           |
| /update-report  | Add, update, or remove the `REPORT.md` summary file          |
```
