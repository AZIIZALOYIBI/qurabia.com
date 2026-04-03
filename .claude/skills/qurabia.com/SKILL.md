```markdown
# qurabia.com Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides a comprehensive guide to the development patterns and conventions used in the `qurabia.com` TypeScript codebase. It covers file naming, import/export styles, commit message patterns, and testing conventions. While no formal frameworks or automated workflows are detected, this guide will help you write, organize, and test code in a manner consistent with the repository's standards.

## Coding Conventions

### File Naming
- **Convention:** PascalCase is used for file names.
- **Example:**  
  ```
  UserProfile.ts
  AuthService.ts
  ```

### Import Style
- **Convention:** Use relative imports for referencing modules within the codebase.
- **Example:**
  ```typescript
  import { UserProfile } from './UserProfile';
  import { AuthService } from '../services/AuthService';
  ```

### Export Style
- **Convention:** Named exports are preferred.
- **Example:**
  ```typescript
  // In UserProfile.ts
  export function UserProfile() { ... }

  // In AuthService.ts
  export const AuthService = { ... };
  ```

### Commit Message Patterns
- **Style:** Freeform, no strict prefixes.
- **Average Length:** 91 characters.
- **Example:**
  ```
  Add support for multi-factor authentication in login flow
  ```

## Workflows

### Adding a New Module
**Trigger:** When you need to introduce a new feature or module.
**Command:** `/add-module`

1. Create a new file using PascalCase (e.g., `FeatureName.ts`).
2. Implement your feature using TypeScript.
3. Use named exports for all public functions or objects.
4. Import dependencies using relative paths.
5. Write corresponding tests in a file named `FeatureName.test.ts`.
6. Commit your changes with a descriptive, freeform message.

### Writing Tests
**Trigger:** When you implement or update a module.
**Command:** `/write-test`

1. Create a test file alongside your module, following the pattern `ModuleName.test.ts`.
2. Use the project's preferred (unknown) testing framework.
3. Write tests to cover the module's functionality.
4. Run the tests to ensure correctness.

### Refactoring Code
**Trigger:** When improving or reorganizing existing code.
**Command:** `/refactor`

1. Update file names to PascalCase if needed.
2. Ensure all imports are relative.
3. Convert any default exports to named exports.
4. Update or add tests as necessary.
5. Commit changes with a clear, descriptive message.

## Testing Patterns

- **Test File Pattern:** Test files are named with the pattern `*.test.*` (e.g., `UserProfile.test.ts`).
- **Framework:** The specific testing framework is not detected; follow existing patterns in the codebase.
- **Example:**
  ```typescript
  // UserProfile.test.ts
  import { UserProfile } from './UserProfile';

  describe('UserProfile', () => {
    it('should render correctly', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command        | Purpose                                            |
|----------------|----------------------------------------------------|
| /add-module    | Scaffold and implement a new module or feature     |
| /write-test    | Create and implement tests for a module            |
| /refactor      | Refactor code to align with repository conventions |
```
