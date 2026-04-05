```markdown
# qurabia.com Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns, coding conventions, and workflows used in the `qurabia.com` Python codebase. It covers file naming, import/export styles, commit patterns, and testing practices, providing clear examples and command suggestions for efficient collaboration.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.py`, `dataLoader.py`

### Import Style
- Use **relative imports** within the codebase.
  - Example:
    ```python
    from .utils import parseData
    from ..models import UserModel
    ```

### Export Style
- Use **named exports** (explicitly define what is exported).
  - Example:
    ```python
    def processData(data):
        # ...implementation...
        return result

    __all__ = ['processData']
    ```

### Commit Patterns
- Use **conventional commits** with the `fix` prefix for bug fixes.
  - Example commit message:
    ```
    fix: resolve issue with user authentication flow
    ```

## Workflows

### Bug Fixing
**Trigger:** When a bug is identified and needs to be resolved  
**Command:** `/fix-bug`

1. Identify and reproduce the bug.
2. Create a new branch for the fix.
3. Implement the fix following coding conventions.
4. Write or update tests to cover the fix.
5. Commit changes using the `fix:` prefix.
6. Submit a pull request for review.

### Adding a New Module
**Trigger:** When a new feature or module is required  
**Command:** `/add-module`

1. Create a new file using camelCase naming.
2. Implement the module using relative imports and named exports.
3. Write corresponding tests in a `*.test.*` file.
4. Commit changes with a descriptive message.
5. Open a pull request for integration.

## Testing Patterns

- Test files follow the pattern: `*.test.*` (e.g., `userProfile.test.py`)
- The testing framework is **unknown**, but tests are kept alongside or near the modules they cover.
- Example test file:
  ```python
  from .userProfile import getUserProfile

  def test_getUserProfile_valid():
      # ...test implementation...
      assert getUserProfile(1) == expected_profile
  ```

## Commands
| Command      | Purpose                                   |
|--------------|-------------------------------------------|
| /fix-bug     | Start the bug fixing workflow             |
| /add-module  | Start the new module creation workflow    |
```
