# /patent-search

Use this workflow when working on **patent research** for any QURABIA invention or technology.

## Goal

Conduct professional prior art search, patentability assessment, FTO analysis, or patent landscape mapping using certified USPTO/EPO/WIPO examiner methodology.

## Common Files

- `.claude/skills/patent-search/SKILL.md` — main skill definition
- `.claude/skills/patent-search/references/` — databases, operators, classification, law

## Suggested Sequence

1. Identify task type: NS / IS / FTO / VR / LS / CF / PF / CA / PA
2. Define jurisdiction (SAIP Saudi / GCC / PCT / USPTO / EPO / WIPO)
3. Deconstruct the invention: core concept → problem → solution → key features
4. Run tiered search (keyword → classification → citation → database)
5. Output structured report with findings and recommendations

## Task Types

| Code | Task | Arabic |
|------|------|--------|
| `NS` | Novelty Search | بحث الجدة |
| `FTO` | Freedom-to-Operate | حرية العمل |
| `LS` | Landscape Analysis | خريطة المجال |
| `PA` | Patentability Assessment | قابلية التسجيل |
| `CA` | Claim Analysis | تحليل المطالبات |

## Typical Commit Signals

- Results of patent search added to `docs/patents/`
- Prior art analysis documented
- FTO report generated

## Notes

- Always use this skill BEFORE drafting a patent application
- Reference SAIP (هيئة الملكية الفكرية) for Saudi filings
- Outputs in bilingual Arabic/English format
