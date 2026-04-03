---
name: design-system-update
description: Workflow command scaffold for design-system-update in qurabia.com.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /design-system-update

Use this workflow when working on **design-system-update** in `qurabia.com`.

## Goal

Update or modernize the design system, including color palettes, themes, tokens, and CSS variables for consistent UI styling.

## Common Files

- `frontend/src/styles/DesignSystem.css`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit frontend/src/styles/DesignSystem.css to update color tokens, themes, spacing, motion, or other design variables.
- Optionally, update custom properties, gradients, or animation keyframes.
- Commit changes with a message referencing design system improvements.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.