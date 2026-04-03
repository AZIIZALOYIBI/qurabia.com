```markdown
# qurabia.com Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides a comprehensive guide to the development patterns and workflows used in the qurabia.com TypeScript codebase. It covers coding conventions, file organization, commit practices, and step-by-step instructions for common workflows such as updating the design system and redesigning the landing page. This guide is intended to help contributors maintain consistency and efficiency when working on the project.

## Coding Conventions

### File Naming
- Use **PascalCase** for file names.
  - Example: `LandingPage.tsx`, `DesignSystem.css`

### Import Style
- Use **relative imports** for modules within the project.
  ```typescript
  import Button from './Button';
  import { Theme } from '../styles/Theme';
  ```

### Export Style
- Use **default exports** for modules.
  ```typescript
  // Button.tsx
  const Button = () => { /* ... */ };
  export default Button;
  ```

### Commit Patterns
- Commit messages are **freeform** but often use prefixes like `redesign`.
- Average commit message length: ~72 characters.
  - Example: `redesign: update color palette and spacing in DesignSystem.css`

## Workflows

### Design System Update
**Trigger:** When you want to change the visual design language or improve the design system across the frontend.  
**Command:** `/update-design-system`

1. Edit `frontend/src/styles/DesignSystem.css` to update color tokens, themes, spacing, motion, or other design variables.
2. Optionally, update custom properties, gradients, or animation keyframes as needed.
3. Commit your changes with a message referencing design system improvements.
   - Example commit: `redesign: update primary color and spacing scale in DesignSystem.css`

**Example:**
```css
/* frontend/src/styles/DesignSystem.css */
:root {
  --color-primary: #4f46e5;
  --spacing-md: 1.5rem;
  /* ...other tokens */
}
```

### Landing Page Redesign
**Trigger:** When you want to modernize the landing page or address design/accessibility feedback.  
**Command:** `/redesign-landing`

1. Edit `frontend/public/landing.html` to implement new layout, themes, or accessibility improvements.
2. Add or remove features such as animations, meta tags, or ARIA attributes as needed.
3. Commit your changes with a message referencing landing page redesign or review fixes.
   - Example commit: `redesign: improve accessibility and update hero section on landing page`

**Example:**
```html
<!-- frontend/public/landing.html -->
<section aria-label="Hero">
  <h1>Welcome to Qurabia</h1>
  <p>Modern, accessible, and beautiful web experiences.</p>
</section>
```

## Testing Patterns

- **Testing Framework:** Unknown (not detected)
- **Test File Pattern:** Files are named with `*.test.*`
  - Example: `Button.test.tsx`
- Place test files alongside the components they test or in a dedicated `__tests__` directory.

**Example:**
```typescript
// Button.test.tsx
import Button from './Button';

test('renders Button component', () => {
  // ...test implementation
});
```

## Commands

| Command                | Purpose                                                      |
|------------------------|--------------------------------------------------------------|
| /update-design-system  | Update or modernize the design system (colors, tokens, etc.) |
| /redesign-landing      | Redesign or update the landing page                          |
```
