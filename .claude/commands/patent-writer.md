# /patent-writer

Use this workflow when **drafting patent documents** for QURABIA inventions.

## Goal

Produce filing-ready patent documents compliant with SAIP, WIPO, and PCT standards — in Arabic and/or English.

## Common Files

- `.claude/skills/patent-writer/SKILL.md` — main skill definition
- `.claude/skills/patent-writer/references/` — claims, templates, drawings, Saudi law

## Suggested Sequence

1. Collect inventor info: name, institution, title, jurisdiction
2. Collect technical disclosure: what it does, problem solved, how it differs, key components
3. Select document type (FPA / PPA / UM / CL / DS / AB)
4. Draft claims (independent → dependent → hierarchy)
5. Draft description (field → background → summary → detailed → examples)
6. Draft abstract (≤150 words)
7. Note drawing requirements
8. Final quality check: support, enablement, definiteness

## Document Types

| Code | Document | Arabic |
|------|----------|--------|
| `FPA` | Full Patent Application | طلب براءة كامل |
| `PPA` | Provisional Application | طلب مبدئي |
| `UM` | Utility Model | نموذج منفعة |
| `CL` | Claims Only | مطالبات فقط |
| `AB` | Abstract Only | ملخص فقط |

## Typical Commit Signals

- Patent draft saved to `docs/patents/`
- Claims and description finalized
- Filing-ready document prepared for SAIP/PCT submission

## Notes

- Run `/patent-search` first to clear prior art before drafting
- Saudi SAIP filings require Arabic primary language
- PCT filings require precise claim hierarchy
- Claims are the legal scope — draft them carefully
