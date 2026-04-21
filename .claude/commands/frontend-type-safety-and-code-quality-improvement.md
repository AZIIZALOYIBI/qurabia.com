---
name: frontend-type-safety-and-code-quality-improvement
description: Workflow command scaffold for frontend-type-safety-and-code-quality-improvement in qurabia.com.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /frontend-type-safety-and-code-quality-improvement

Use this workflow when working on **frontend-type-safety-and-code-quality-improvement** in `qurabia.com`.

## Goal

Perform type safety improvements and code quality fixes in frontend TypeScript/React code, often replacing 'any' types, improving error handling, and refactoring state management.

## Common Files

- `frontend/src/components/DashboardV5.tsx`
- `frontend/src/components/BlackbodyTab.tsx`
- `frontend/src/engine/SimulationFactory.ts`
- `frontend/src/engine/TaskOrchestrator.ts`
- `frontend/src/engine/GeminiService.ts`
- `frontend/src/engine/GrokService.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify type or code quality issues in frontend files (e.g., use of 'any', improper error handling).
- Edit relevant frontend files to replace 'any' with specific types and improve code structure.
- Update related test files if necessary.
- Commit changes with a detailed message.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.