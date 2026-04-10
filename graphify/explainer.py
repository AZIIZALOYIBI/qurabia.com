"""
Explainer: gives a detailed breakdown of any symbol or file in the graph.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import List

from .graph import Graph


def explain(graph: Graph, term: str) -> str:
    """
    Return a detailed markdown explanation of a node/symbol.
    Works on file paths AND exported symbol names.
    """
    hits = graph.find_nodes_by_keyword(term)
    if not hits:
        return (
            f"❌ No nodes or symbols found matching `{term}`.\n\n"
            "Try `/graphify query \"list engines\"` to browse available nodes."
        )

    lines: List[str] = []
    for hit in hits[:5]:
        info = graph.nodes[hit]
        deps = sorted(graph.dependencies(hit))
        dependents = sorted(graph.dependents(hit))

        lines += [
            f"# `{hit}`",
            "",
            f"| Property | Value |",
            f"|----------|-------|",
            f"| Kind | `{info.kind}` |",
            f"| Language | `{info.language}` |",
            f"| Lines | {info.line_count:,} |",
            f"| Community | {info.community} |",
            f"| In-degree (used by) | {graph.in_degree(hit)} |",
            f"| Out-degree (imports) | {graph.out_degree(hit)} |",
            "",
        ]

        if info.description:
            lines += [f"> {info.description}", ""]

        if info.symbols:
            lines += [
                "## Exported Symbols",
                "",
                " ".join(f"`{s}`" for s in info.symbols),
                "",
            ]

        if deps:
            lines += ["## Imports / Dependencies", ""]
            for d in deps[:30]:
                d_info = graph.nodes.get(d)
                d_kind = f" `[{d_info.kind}]`" if d_info else ""
                lines.append(f"- `{d}`{d_kind}")
            if len(deps) > 30:
                lines.append(f"_…and {len(deps) - 30} more_")
            lines.append("")

        if dependents:
            lines += ["## Used By", ""]
            for d in dependents[:30]:
                d_info = graph.nodes.get(d)
                d_kind = f" `[{d_info.kind}]`" if d_info else ""
                lines.append(f"- `{d}`{d_kind}")
            if len(dependents) > 30:
                lines.append(f"_…and {len(dependents) - 30} more_")
            lines.append("")

        # Architectural role assessment
        role = _assess_role(graph, hit, info, deps, dependents)
        lines += ["## Architectural Role", "", role, ""]

        lines += ["---", ""]

    return "\n".join(lines)


def _assess_role(graph: Graph, path: str, info, deps: list, dependents: list) -> str:
    degree = graph.total_degree(path)
    god_threshold = 8

    notes = []
    if graph.in_degree(path) >= god_threshold:
        notes.append("🔴 **God node** — many files depend on this. Changes here have high blast radius.")
    elif graph.in_degree(path) >= 3:
        notes.append("🟡 **Shared dependency** — used by several modules.")
    else:
        notes.append("🟢 **Leaf / focused module** — limited blast radius.")

    if info.kind == "component":
        notes.append("⚛️ React component — renders UI.")
    elif info.kind == "service":
        notes.append("🔧 Service — provides shared business logic or API access.")
    elif info.kind == "engine":
        notes.append("⚙️ Engine — core algorithmic or quantum processing logic.")
    elif info.kind == "hook":
        notes.append("🪝 React hook — encapsulates stateful logic.")

    if not deps:
        notes.append("📦 No internal imports — self-contained or uses only external packages.")

    return "\n".join(notes)
