"""
Graph builder: walks a directory tree and populates a Graph.
Supports two modes: 'default' and 'deep'.
  - default: top-level symbols only
  - deep:    includes test files, private symbols, and call-graph hints
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Set

from .extractor import _IGNORED_DIRS, _PYTHON_EXTS, _TS_EXTS, extract_file
from .graph import Graph


def build_graph(root: Path, mode: str = "default") -> Graph:
    """
    Walk *root* recursively and build a dependency graph.

    Parameters
    ----------
    root : Path
        Directory to analyse.
    mode : str
        'default' skips test files; 'deep' includes everything.
    """
    root = root.resolve()
    graph = Graph()
    seen_edges: Set[str] = set()

    for file_path in _iter_source_files(root, mode):
        result = extract_file(file_path, root)
        if result is None:
            continue
        node_info, edges = result
        graph.add_node(node_info)

        for edge in edges:
            key = f"{edge.source}->{edge.target}"
            if key not in seen_edges:
                seen_edges.add(key)
                graph.add_edge(edge)

    # Remove edges whose target node is not in the graph
    graph.edges = [e for e in graph.edges if e.target in graph.nodes]
    # Rebuild adjacency from cleaned edges — ensure every node has an entry
    graph._out.clear()
    graph._in.clear()
    for node in graph.nodes:
        graph._out.setdefault(node, set())
        graph._in.setdefault(node, set())
    for edge in graph.edges:
        graph._out[edge.source].add(edge.target)
        graph._in[edge.target].add(edge.source)

    # Run community detection
    graph.detect_communities()

    return graph


def _iter_source_files(root: Path, mode: str):
    """Yield all source files under root, respecting mode."""
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if any(part in _IGNORED_DIRS for part in path.relative_to(root).parts):
            continue
        if mode != "deep" and _is_test_file(path):
            continue
        if path.suffix in _PYTHON_EXTS | _TS_EXTS:
            yield path


def _is_test_file(path: Path) -> bool:
    name = path.stem.lower()
    return name.startswith("test_") or name.endswith("_test") or "spec" in name or "__tests__" in path.parts
