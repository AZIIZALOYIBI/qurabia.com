---
name: report-generation-and-removal
description: Workflow command scaffold for report-generation-and-removal in qurabia.com.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /report-generation-and-removal

Use this workflow when working on **report-generation-and-removal** in `qurabia.com`.

## Goal

Adds or removes comprehensive report files (e.g., REPORT.md) summarizing repository state or suggestions.

## Common Files

- `REPORT.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update REPORT.md with relevant content.
- Commit REPORT.md to the repository.
- (If needed) Remove REPORT.md if it contains sensitive or outdated information.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.