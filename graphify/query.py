"""
Query engine: answers natural-language questions about the graph.
"""

from __future__ import annotations

import re
from typing import List, Optional

from .graph import Graph


def query_graph(graph: Graph, question: str) -> str:
    """
    Answer a natural language question about the knowledge graph.

    Supported patterns:
    - "what connects X to Y" / "how does X connect to Y"
    - "who uses X" / "what depends on X"
    - "what does X import" / "what does X depend on"
    - "what is X" / "describe X"
    - "list engines" / "list services" / "list components"
    - "god nodes" / "most connected"
    """
    q = question.lower().strip()

    # --- path connection queries: "what connects X to Y" / "X to Y" ---
    m = re.search(
        r"(?:connects?|connection|path|link|relate)\s+.{0,15}['\"](\w[\w\s./\-]+)['\"]"
        r"\s+(?:to|and|with)\s+['\"](\w[\w\s./\-]+)['\"]",
        q,
    )
    if not m:
        # unquoted: require at least 4-char words to avoid false positives
        m = re.search(
            r"(?:connects?|connection|path|link|relate)\s+.{0,15}(\b\w{4,}[\w./\-]*)"
            r"\s+(?:to|and|with)\s+(\b\w{4,}[\w./\-]*)",
            q,
        )
    if m:
        a, b = m.group(1).strip(), m.group(2).strip()
        return _connection_query(graph, a, b)

    # --- dependents ---
    m = re.search(r"(?:who uses|what uses|depends on|import.{0,5})\s+['\"]?(\w[\w./\-]*)['\"]?", q)
    if m:
        return _dependents_query(graph, m.group(1))

    # --- dependencies ---
    m = re.search(r"(?:what does|what)\s+['\"]?(\w[\w./\-]*)['\"]?\s+(?:import|depend|use)", q)
    if m:
        return _dependencies_query(graph, m.group(1))

    # --- list by kind ---
    m = re.search(r"list\s+(engine|service|component|hook|module|test)s?", q)
    if m:
        return _list_by_kind(graph, m.group(1))

    # --- god nodes ---
    if any(kw in q for kw in ["god node", "most connected", "hub", "central"]):
        return _god_nodes_query(graph)

    # --- describe / explain ---
    m = re.search(r"(?:what is|describe|tell me about|explain)\s+['\"]?(\w[\w./\-]*)['\"]?", q)
    if m:
        return _describe_query(graph, m.group(1))

    # --- fallback: keyword search ---
    words = re.findall(r"\w{3,}", question)
    hits: List[str] = []
    for word in words:
        hits += graph.find_nodes_by_keyword(word)
    hits = list(dict.fromkeys(hits))
    if hits:
        lines = [f"Nodes matching your query: **{question}**", ""]
        for h in hits[:20]:
            info = graph.nodes[h]
            lines.append(f"- `{h}` `{info.kind}` (degree={graph.total_degree(h)})")
        return "\n".join(lines)

    return f"No results found for: **{question}**\n\nTry `/graphify explain \"<SymbolName>\"` or `/graphify query \"list engines\"`."


# ---------------------------------------------------------------------------
# Internal query helpers
# ---------------------------------------------------------------------------


def _connection_query(graph: Graph, term_a: str, term_b: str) -> str:
    nodes_a = graph.find_nodes_by_keyword(term_a)
    nodes_b = graph.find_nodes_by_keyword(term_b)

    if not nodes_a:
        return f"❌ No nodes found matching `{term_a}`."
    if not nodes_b:
        return f"❌ No nodes found matching `{term_b}`."

    lines = [f"## Connections between `{term_a}` and `{term_b}`", ""]

    found_any = False
    for src in nodes_a[:5]:
        for tgt in nodes_b[:5]:
            if src == tgt:
                continue
            path = graph.shortest_path(src, tgt)
            if path:
                found_any = True
                lines.append(f"**Path**: `{'` → `'.join(path)}`")
                lines.append("")

    if not found_any:
        lines.append("No direct path found between these nodes in the graph.")
        lines.append("")
        lines.append(f"**Matching `{term_a}`**: " + ", ".join(f"`{n}`" for n in nodes_a[:5]))
        lines.append(f"**Matching `{term_b}`**: " + ", ".join(f"`{n}`" for n in nodes_b[:5]))

    return "\n".join(lines)


def _dependents_query(graph: Graph, term: str) -> str:
    hits = graph.find_nodes_by_keyword(term)
    if not hits:
        return f"❌ No nodes found matching `{term}`."
    lines = [f"## Who depends on `{term}`", ""]
    for hit in hits[:5]:
        deps = sorted(graph.dependents(hit))
        lines.append(f"### `{hit}`")
        if deps:
            for d in deps:
                lines.append(f"- `{d}`")
        else:
            lines.append("_No dependents found_")
        lines.append("")
    return "\n".join(lines)


def _dependencies_query(graph: Graph, term: str) -> str:
    hits = graph.find_nodes_by_keyword(term)
    if not hits:
        return f"❌ No nodes found matching `{term}`."
    lines = [f"## What does `{term}` import?", ""]
    for hit in hits[:5]:
        deps = sorted(graph.dependencies(hit))
        lines.append(f"### `{hit}`")
        if deps:
            for d in deps:
                lines.append(f"- `{d}`")
        else:
            lines.append("_No imports found_")
        lines.append("")
    return "\n".join(lines)


def _list_by_kind(graph: Graph, kind: str) -> str:
    matches = [(p, i) for p, i in graph.nodes.items() if i.kind == kind]
    if not matches:
        return f"No nodes of kind `{kind}` found."
    lines = [f"## All `{kind}` nodes ({len(matches)} total)", ""]
    for path, info in sorted(matches):
        degree = graph.total_degree(path)
        lines.append(f"- `{path}` ★{degree}")
    return "\n".join(lines)


def _god_nodes_query(graph: Graph) -> str:
    god = graph.god_nodes(top_k=10)
    lines = ["## God Nodes (Top 10 Most Connected)", ""]
    for rank, (path, degree) in enumerate(god, 1):
        info = graph.nodes.get(path)
        kind = info.kind if info else "?"
        lines.append(f"{rank}. `{path}` — degree {degree} `[{kind}]`")
    return "\n".join(lines)


def _describe_query(graph: Graph, term: str) -> str:
    hits = graph.find_nodes_by_keyword(term)
    if not hits:
        return f"❌ No nodes found matching `{term}`. Try `/graphify explain \"{term}\"`."
    lines = []
    for hit in hits[:3]:
        info = graph.nodes[hit]
        lines += [
            f"## `{hit}`",
            "",
            f"- **Kind**: `{info.kind}`",
            f"- **Language**: `{info.language}`",
            f"- **Lines**: {info.line_count:,}",
            f"- **Community**: {info.community}",
            f"- **Degree**: {graph.total_degree(hit)} (in={graph.in_degree(hit)}, out={graph.out_degree(hit)})",
        ]
        if info.description:
            lines += ["", f"> {info.description}"]
        if info.symbols:
            lines += ["", f"**Exports**: " + ", ".join(f"`{s}`" for s in info.symbols[:10])]
        lines.append("")
    return "\n".join(lines)
