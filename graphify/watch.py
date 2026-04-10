"""
Watch mode: incremental rebuild triggered from CLAUDE.md rules.

Usage (from CLAUDE.md):
    python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
"""

from __future__ import annotations

import json
from pathlib import Path

from .builder import build_graph
from .reporter import generate_report
from .wiki import generate_wiki


def _rebuild_code(project_root: Path, out_dir: Path | None = None) -> None:
    """
    Lightweight incremental rebuild.
    Called after modifying code files in a Claude Code session.
    """
    root = project_root.resolve()
    if out_dir is None:
        out_dir = root / "graphify-out"

    print(f"[graphify] Rebuilding graph for {root} …")
    graph = build_graph(root, mode="default")
    generate_report(graph, out_dir, str(root))
    generate_wiki(graph, out_dir)
    _write_graph_json(graph, out_dir)
    stats = graph.stats()
    print(
        f"[graphify] Done — {stats['nodes']} nodes, {stats['edges']} edges, "
        f"output → {out_dir}"
    )


def _write_graph_json(graph, out_dir: Path) -> None:
    """Persist raw graph data as JSON for downstream tooling."""
    data = {
        "nodes": [
            {
                "id": p,
                "label": info.label,
                "kind": info.kind,
                "language": info.language,
                "community": info.community,
                "degree": graph.total_degree(p),
                "symbols": info.symbols[:10],
                "line_count": info.line_count,
                "description": info.description,
            }
            for p, info in graph.nodes.items()
        ],
        "edges": [
            {"source": e.source, "target": e.target, "kind": e.kind}
            for e in graph.edges
        ],
    }
    (out_dir / "graph.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
