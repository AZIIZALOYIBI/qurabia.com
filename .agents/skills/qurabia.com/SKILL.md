```markdown
# qurabia.com Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development patterns and conventions used in the qurabia.com codebase, which is primarily written in TypeScript with backend components in Python. You'll learn how to maintain code quality, apply fixes, and refactor both backend and frontend modules following established workflows. The repository emphasizes type safety, modular code structure, and conventional commit practices.

---

## Coding Conventions

### File Naming

- **PascalCase** is used for file names, especially for components and classes.
  - Example: `DashboardV5.tsx`, `BlackbodyTab.tsx`, `SimulationFactory.ts`

### Import Style

- **Relative imports** are preferred.
  - Example:
    ```typescript
    import { SimulationFactory } from '../engine/SimulationFactory';
    ```

### Export Style

- **Named exports** are used instead of default exports.
  - Example:
    ```typescript
    // In SimulationFactory.ts
    export function SimulationFactory() { ... }

    // In another file
    import { SimulationFactory } from './SimulationFactory';
    ```

### Commit Messages

- **Conventional commits** with prefixes (e.g., `fix:`) are used.
  - Example: `fix: improve error handling in TaskOrchestrator (closes #42)`

---

## Workflows

### Backend Service Fix or Refactor

**Trigger:** When you need to fix bugs, improve security, or refactor backend service logic.  
**Command:** `/fix-backend-service`

1. **Identify** the issue in backend service logic (e.g., duplicated code, security flaw).
2. **Edit** the affected backend service files, typically:
    - `backend/dsa_service.py`
    - `backend/kem_service.py`
3. **Optionally update** `backend/main.py` if integration or startup logic is affected.
4. **Commit** your changes with a descriptive, conventional message.

**Example:**
```python
# backend/dsa_service.py
def secure_function(...):
    # Improved security checks here
    pass
```
```bash
git commit -m "fix: refactor dsa_service.py for improved security"
```

---

### Frontend Type Safety and Code Quality Improvement

**Trigger:** When you want to improve type safety, error handling, or code quality in frontend TypeScript modules.  
**Command:** `/improve-frontend-types`

1. **Identify** type or code quality issues (e.g., use of `any`, improper error handling) in frontend files.
2. **Edit** relevant files to:
    - Replace `any` with specific types.
    - Refactor state management or error handling.
    - Improve code structure.
3. **Update** related test files if necessary.
4. **Commit** your changes with a detailed, conventional message.

**Example:**
```typescript
// Before
function process(data: any) { ... }

// After
function process(data: SimulationInput) { ... }
```
```bash
git commit -m "fix: replace any with SimulationInput in SimulationFactory"
```

---

## Testing Patterns

- **Test files** follow the pattern `*.test.*` and are typically colocated with source files.
- **Testing framework** is not explicitly detected, but tests are written in TypeScript.
- Example test file: `frontend/src/__tests__/SimulationFactory.test.ts`

```typescript
import { SimulationFactory } from '../engine/SimulationFactory';

test('should create simulation with valid input', () => {
  // Test implementation
});
```

---

## Commands

| Command                 | Purpose                                                        |
|-------------------------|----------------------------------------------------------------|
| /fix-backend-service    | Apply bug fixes or refactorings to backend service modules     |
| /improve-frontend-types | Improve type safety and code quality in frontend TypeScript    |
```
