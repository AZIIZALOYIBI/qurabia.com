"""
Reporter: generates graphify-out/GRAPH_REPORT.md
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List

from .graph import Graph


def generate_report(graph: Graph, out_dir: Path, target_root: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    report_path = out_dir / "GRAPH_REPORT.md"

    stats = graph.stats()
    god_nodes = graph.god_nodes(top_k=15)
    communities = _group_communities(graph)

    lines: List[str] = [
        f"# Knowledge Graph Report — `{target_root}`",
        "",
        "## Overview",
        "",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Total nodes | {stats['nodes']} |",
        f"| Total edges | {stats['edges']} |",
        f"| Languages | {stats['languages']} |",
        f"| Communities | {len(communities)} |",
        "",
        "---",
        "",
        "## God Nodes (Most Connected)",
        "",
        "> These are the most highly connected files. They represent key architectural hubs.",
        "",
        "| Rank | Node | In | Out | Total | Kind |",
        "|------|------|----|-----|-------|------|",
    ]

    for rank, (node_path, degree) in enumerate(god_nodes, 1):
        info = graph.nodes.get(node_path)
        if info is None:
            continue
        lines.append(
            f"| {rank} | `{node_path}` | {graph.in_degree(node_path)} "
            f"| {graph.out_degree(node_path)} | {degree} | {info.kind} |"
        )

    lines += [
        "",
        "---",
        "",
        "## Community Structure",
        "",
        "> Clusters of files that share strong mutual dependencies.",
        "",
    ]

    for cid, members in sorted(communities.items(), key=lambda x: -len(x[1])):
        community_label = _community_label(members, graph)
        lines.append(f"### Community {cid}: {community_label} ({len(members)} nodes)")
        lines.append("")
        for m in sorted(members)[:20]:
            info = graph.nodes.get(m)
            kind_tag = f" `[{info.kind}]`" if info else ""
            lines.append(f"- `{m}`{kind_tag}")
        if len(members) > 20:
            lines.append(f"- _…and {len(members) - 20} more_")
        lines.append("")

    lines += [
        "---",
        "",
        "## Language Distribution",
        "",
        "| Language | Files | Lines |",
        "|----------|-------|-------|",
    ]
    lang_stats: Dict[str, Dict[str, int]] = {}
    for info in graph.nodes.values():
        ls = lang_stats.setdefault(info.language, {"files": 0, "lines": 0})
        ls["files"] += 1
        ls["lines"] += info.line_count
    for lang, data in sorted(lang_stats.items()):
        lines.append(f"| {lang} | {data['files']} | {data['lines']:,} |")

    lines += [
        "",
        "---",
        "",
        "## How to Read This Report",
        "",
        "- **God Nodes** are files imported by many others — changes here have high blast radius.",
        "- **Communities** are groups of files that cluster together; each community often maps to a feature or layer.",
        "- Use `python3 -m graphify query \"<question>\"` to trace connections between components.",
        "- Use `python3 -m graphify explain \"<SymbolOrFile>\"` to get a detailed breakdown of any node.",
        "",
    ]

    report_path.write_text("\n".join(lines), encoding="utf-8")


def _group_communities(graph: Graph) -> Dict[int, List[str]]:
    groups: Dict[int, List[str]] = {}
    for path, info in graph.nodes.items():
        groups.setdefault(info.community, []).append(path)
    return groups


def _community_label(members: List[str], graph: Graph) -> str:
    """Infer a short human label for a community from its dominant path segments."""
    from collections import Counter

    parts: List[str] = []
    for m in members:
        segs = Path(m).parts
        if len(segs) >= 2:
            parts.append(segs[1])  # second segment, e.g. 'components', 'tests', 'core'
        elif segs:
            parts.append(segs[0])

    if not parts:
        return "misc"
    most_common, _ = Counter(parts).most_common(1)[0]
    return most_common
