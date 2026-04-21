"""Core graph data structure for the knowledge graph."""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, FrozenSet, List, Optional, Set, Tuple


@dataclass
class NodeInfo:
    """Metadata about a node in the knowledge graph."""

    path: str
    label: str
    kind: str  # 'module' | 'class' | 'function' | 'component' | 'service'
    language: str  # 'python' | 'typescript' | 'javascript' | 'other'
    symbols: List[str] = field(default_factory=list)  # exported names
    description: str = ""
    line_count: int = 0
    community: int = -1


@dataclass
class EdgeInfo:
    """Metadata about a directed edge (dependency)."""

    source: str
    target: str
    kind: str  # 'import' | 'extends' | 'implements' | 'calls'
    symbol: str = ""  # specific symbol imported/used


class Graph:
    """Directed dependency graph with community detection."""

    def __init__(self) -> None:
        self.nodes: Dict[str, NodeInfo] = {}
        self.edges: List[EdgeInfo] = []
        # adjacency: out-edges per node
        self._out: Dict[str, Set[str]] = defaultdict(set)
        # reverse adjacency: in-edges per node
        self._in: Dict[str, Set[str]] = defaultdict(set)

    # ------------------------------------------------------------------
    # Mutation
    # ------------------------------------------------------------------

    def add_node(self, info: NodeInfo) -> None:
        self.nodes[info.path] = info
        if info.path not in self._out:
            self._out[info.path] = set()
        if info.path not in self._in:
            self._in[info.path] = set()

    def add_edge(self, edge: EdgeInfo) -> None:
        self.edges.append(edge)
        self._out[edge.source].add(edge.target)
        self._in[edge.target].add(edge.source)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def out_degree(self, node: str) -> int:
        return len(self._out.get(node, set()))

    def in_degree(self, node: str) -> int:
        return len(self._in.get(node, set()))

    def total_degree(self, node: str) -> int:
        return self.out_degree(node) + self.in_degree(node)

    def neighbors(self, node: str) -> Set[str]:
        return self._out.get(node, set()) | self._in.get(node, set())

    def dependents(self, node: str) -> Set[str]:
        """Nodes that import/depend on this node."""
        return self._in.get(node, set())

    def dependencies(self, node: str) -> Set[str]:
        """Nodes that this node imports from."""
        return self._out.get(node, set())

    def god_nodes(self, top_k: int = 10) -> List[Tuple[str, int]]:
        """Return top-k most connected nodes (god nodes)."""
        scored = [(n, self.total_degree(n)) for n in self.nodes]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def shortest_path(self, source: str, target: str) -> Optional[List[str]]:
        """BFS shortest path between two nodes (undirected)."""
        if source not in self.nodes or target not in self.nodes:
            return None
        if source == target:
            return [source]

        visited: Set[str] = {source}
        queue: deque[List[str]] = deque([[source]])

        while queue:
            path = queue.popleft()
            current = path[-1]
            for neighbor in self.neighbors(current):
                if neighbor not in self.nodes:
                    continue
                if neighbor == target:
                    return path + [neighbor]
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])
        return None

    def find_nodes_by_keyword(self, keyword: str) -> List[str]:
        """Find nodes whose path, label, or symbols contain keyword."""
        kw = keyword.lower()
        results = []
        for path, info in self.nodes.items():
            if (
                kw in path.lower()
                or kw in info.label.lower()
                or any(kw in s.lower() for s in info.symbols)
                or kw in info.description.lower()
            ):
                results.append(path)
        return results

    # ------------------------------------------------------------------
    # Community detection (greedy label propagation)
    # ------------------------------------------------------------------

    def detect_communities(self) -> Dict[int, List[str]]:
        """
        Simple label-propagation community detection.
        Returns mapping of community_id -> list of node paths.
        """
        # Assign each node its own community initially
        labels: Dict[str, str] = {n: n for n in self.nodes}
        node_list = list(self.nodes.keys())

        for _ in range(10):  # iterate up to 10 rounds
            changed = False
            import random

            random.shuffle(node_list)
            for node in node_list:
                nbrs = list(self.neighbors(node) & self.nodes.keys())
                if not nbrs:
                    continue
                # Pick the most frequent label among neighbors
                counts: Dict[str, int] = defaultdict(int)
                for nbr in nbrs:
                    counts[labels[nbr]] += 1
                best_label = max(counts, key=lambda k: counts[k])
                if labels[node] != best_label:
                    labels[node] = best_label
                    changed = True
            if not changed:
                break

        # Normalize community IDs to integers
        label_to_id: Dict[str, int] = {}
        communities: Dict[int, List[str]] = defaultdict(list)
        for node, label in labels.items():
            if label not in label_to_id:
                label_to_id[label] = len(label_to_id)
            cid = label_to_id[label]
            communities[cid].append(node)
            self.nodes[node].community = cid

        return dict(communities)

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    def stats(self) -> Dict[str, int]:
        return {
            "nodes": len(self.nodes),
            "edges": len(self.edges),
            "languages": len({n.language for n in self.nodes.values()}),
        }
