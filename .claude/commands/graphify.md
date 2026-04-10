---
name: graphify
description: Build, query, and navigate the QURABIA knowledge graph.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /graphify

Use this command to build and interact with the **knowledge graph** of the QURABIA codebase.
The graph maps every file as a node and every import/dependency as an edge, then detects communities
(feature clusters) and god nodes (high-impact hubs).

---

## Subcommands

### Build the graph

```bash
# Entire project
python3 -m graphify .

# Frontend only
python3 -m graphify ./frontend

# Backend only (deep mode — includes tests & private symbols)
python3 -m graphify ./backend --mode deep
```

### Query the graph

```bash
python3 -m graphify query "what connects the quantum engine to the API?"
python3 -m graphify query "who uses statevector?"
python3 -m graphify query "list engines"
python3 -m graphify query "god nodes"
```

### Explain a symbol or file

```bash
python3 -m graphify explain "QuantumAlgorithms"
python3 -m graphify explain "agents_service"
python3 -m graphify explain "UnifiedQuantumPlatform"
```

---

## Output Files

All output lands in `graphify-out/`:

| File | Contents |
|------|----------|
| `graphify-out/GRAPH_REPORT.md` | God nodes, community structure, language stats |
| `graphify-out/wiki/index.md` | Navigable index of all nodes |
| `graphify-out/wiki/nodes/*.md` | One page per file (imports, dependents, symbols) |
| `graphify-out/graph.json` | Raw graph data (nodes + edges) for tooling |

---

## Workflow

1. **Before answering architecture questions**: read `graphify-out/GRAPH_REPORT.md`
   for god nodes and community structure.

2. **Navigate the wiki**: use `graphify-out/wiki/index.md` instead of reading raw source files
   when exploring the codebase structure.

3. **After modifying code files**: run the incremental rebuild to keep the graph current:
   ```bash
   python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
   ```

---

## Common Patterns

| Task | Command |
|------|---------|
| Full project graph | `python3 -m graphify .` |
| Find what imports a module | `python3 -m graphify query "who uses <name>"` |
| Find what a module imports | `python3 -m graphify query "what does <name> import"` |
| Trace a path between two components | `python3 -m graphify query "what connects X to Y"` |
| Understand a component's role | `python3 -m graphify explain "<ComponentName>"` |
| Identify architectural hubs | `python3 -m graphify query "god nodes"` |
| Browse a subsystem | `python3 -m graphify ./frontend` then read `graphify-out/wiki/index.md` |

---

## Notes

- The `graphify/` package is pure Python stdlib — no extra dependencies needed.
- Results are written to `graphify-out/` which is git-ignored by default.
- Run with `--mode deep` to include test files and private symbols in the graph.
- Treat this as a scaffold, not a hard-coded script. Update as the workflow evolves.
