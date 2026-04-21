"""
CLI entry point for graphify.

Usage:
    python3 -m graphify [PATH] [--mode default|deep]
    python3 -m graphify query "QUESTION"
    python3 -m graphify explain "SYMBOL_OR_FILE"
    python3 -m graphify [PATH] query "QUESTION"
    python3 -m graphify [PATH] --mode deep

Examples:
    python3 -m graphify .
    python3 -m graphify ./frontend
    python3 -m graphify ./backend --mode deep
    python3 -m graphify query "what connects the quantum engine to the API?"
    python3 -m graphify explain "QuantumAlgorithms"
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .builder import build_graph
from .explainer import explain
from .query import query_graph
from .reporter import generate_report
from .watch import _rebuild_code, _write_graph_json
from .wiki import generate_wiki


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="graphify",
        description="Knowledge graph builder and query engine for QURABIA codebase.",
    )
    parser.add_argument(
        "path_or_subcommand",
        nargs="?",
        default=".",
        help='Path to analyse, OR subcommand: "query" | "explain"',
    )
    parser.add_argument(
        "extra",
        nargs="*",
        help="Extra arguments: question text for query/explain, or flags",
    )
    parser.add_argument(
        "--mode",
        choices=["default", "deep"],
        default="default",
        help="Analysis depth (default: skip tests; deep: include everything)",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Output directory (default: <project_root>/graphify-out)",
    )
    parser.add_argument(
        "--json",
        dest="json_only",
        action="store_true",
        help="Print raw graph JSON to stdout instead of markdown files",
    )

    args = parser.parse_args(argv)

    subcommand = args.path_or_subcommand.lower()

    # -----------------------------------------------------------------------
    # Subcommands that operate on a pre-built graph
    # -----------------------------------------------------------------------
    if subcommand in ("query", "explain"):
        question = " ".join(args.extra).strip()
        if not question:
            print(f"❌ Usage: python3 -m graphify {subcommand} \"<text>\"", file=sys.stderr)
            return 1

        # Try to load existing graph from graphify-out/
        project_root = _find_project_root()
        out_dir = Path(args.out) if args.out else project_root / "graphify-out"
        graph_json = out_dir / "graph.json"

        if not graph_json.exists():
            print("⚠️  No graph found. Building now …", file=sys.stderr)
            graph = build_graph(project_root, mode="default")
            generate_report(graph, out_dir, str(project_root))
            generate_wiki(graph, out_dir)
            _write_graph_json(graph, out_dir)
        else:
            graph = _load_graph_from_json(graph_json)

        if subcommand == "query":
            print(query_graph(graph, question))
        else:
            print(explain(graph, question))
        return 0

    # -----------------------------------------------------------------------
    # Build subcommand (default when a path is given)
    # -----------------------------------------------------------------------
    target = Path(args.path_or_subcommand).resolve()
    if not target.exists():
        print(f"❌ Path not found: {target}", file=sys.stderr)
        return 1

    project_root = _find_project_root()
    out_dir = Path(args.out) if args.out else project_root / "graphify-out"

    # Handle "python3 -m graphify ./frontend query 'question'"
    if args.extra and args.extra[0].lower() in ("query", "explain"):
        sub = args.extra[0].lower()
        q = " ".join(args.extra[1:]).strip()
        if not q:
            print(f"❌ Usage: python3 -m graphify {target} {sub} \"<text>\"", file=sys.stderr)
            return 1
        graph = build_graph(target, mode=args.mode)
        if sub == "query":
            print(query_graph(graph, q))
        else:
            print(explain(graph, q))
        return 0

    print(f"[graphify] Building graph for: {target}  (mode={args.mode})")
    graph = build_graph(target, mode=args.mode)

    stats = graph.stats()
    print(f"[graphify] Found {stats['nodes']} nodes, {stats['edges']} edges across {stats['languages']} language(s)")

    if args.json_only:
        data = {
            "nodes": [
                {"id": p, "label": i.label, "kind": i.kind, "language": i.language, "community": i.community}
                for p, i in graph.nodes.items()
            ],
            "edges": [{"source": e.source, "target": e.target, "kind": e.kind} for e in graph.edges],
        }
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return 0

    generate_report(graph, out_dir, str(target))
    generate_wiki(graph, out_dir)
    _write_graph_json(graph, out_dir)

    print(f"[graphify] ✅ Output written to: {out_dir}/")
    print(f"           📄 GRAPH_REPORT.md — summary + god nodes + communities")
    print(f"           📚 wiki/index.md   — navigable node wiki")
    print(f"           🗄️  graph.json      — raw graph data")
    return 0


def _find_project_root() -> Path:
    """Walk up from CWD looking for a known project marker."""
    markers = {"CLAUDE.md", "Makefile", "pyproject.toml", "package.json", ".git"}
    cwd = Path.cwd()
    for parent in [cwd, *cwd.parents]:
        if any((parent / m).exists() for m in markers):
            return parent
    return cwd


def _load_graph_from_json(json_path: Path):
    """Reconstruct a lightweight Graph from graph.json for query/explain."""
    from .graph import Graph, NodeInfo

    data = json.loads(json_path.read_text(encoding="utf-8"))
    graph = Graph()

    for n in data.get("nodes", []):
        info = NodeInfo(
            path=n["id"],
            label=n.get("label", n["id"]),
            kind=n.get("kind", "module"),
            language=n.get("language", "other"),
            symbols=n.get("symbols", []),
            description=n.get("description", ""),
            line_count=n.get("line_count", 0),
            community=n.get("community", -1),
        )
        graph.add_node(info)

    from .graph import EdgeInfo

    for e in data.get("edges", []):
        graph.add_edge(EdgeInfo(source=e["source"], target=e["target"], kind=e.get("kind", "import")))

    return graph


if __name__ == "__main__":
    sys.exit(main())
