"""
Language-specific extractors for Python and TypeScript/JavaScript.
Each extractor reads a file and returns (NodeInfo, [EdgeInfo]).
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import List, Tuple

from .graph import EdgeInfo, NodeInfo

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TS_IMPORT_RE = re.compile(
    r"""(?:import|export)\s+(?:type\s+)?(?:\{[^}]*\}|[\w*]+(?:\s+as\s+\w+)?)\s+from\s+['"]([^'"]+)['"]""",
    re.MULTILINE,
)
_TS_IMPORT_SIDE_EFFECT_RE = re.compile(r"""import\s+['"]([^'"]+)['"]""")
_TS_EXPORT_RE = re.compile(
    r"""export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+(\w+)"""
)
_TS_CLASS_RE = re.compile(r"""(?:export\s+)?class\s+(\w+)""")
_TS_FUNC_RE = re.compile(r"""(?:export\s+)?(?:function|const)\s+(\w+)\s*[=(<(]""")

_PY_CLASS_RE = re.compile(r"""^class\s+(\w+)""", re.MULTILINE)
_PY_FUNC_RE = re.compile(r"""^(?:async\s+)?def\s+(\w+)""", re.MULTILINE)

_IGNORED_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    ".pytest_cache",
    "dist",
    "build",
    ".vite",
    "coverage",
    "graphify-out",
}

_PYTHON_EXTS = {".py"}
_TS_EXTS = {".ts", ".tsx", ".js", ".jsx"}


def _relative_label(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return path.name


def _count_lines(path: Path) -> int:
    try:
        return sum(1 for _ in path.open(encoding="utf-8", errors="replace"))
    except OSError:
        return 0


# ---------------------------------------------------------------------------
# Python extractor
# ---------------------------------------------------------------------------


def extract_python(file_path: Path, root: Path) -> Tuple[NodeInfo, List[EdgeInfo]]:
    label = _relative_label(file_path, root)
    src = file_path.read_text(encoding="utf-8", errors="replace")

    symbols: List[str] = []
    description = ""

    try:
        tree = ast.parse(src, filename=str(file_path))
        # Module docstring
        if (
            tree.body
            and isinstance(tree.body[0], ast.Expr)
            and isinstance(tree.body[0].value, ast.Constant)
        ):
            description = str(tree.body[0].value.value).splitlines()[0][:120]

        # Top-level exports
        for node in ast.walk(tree):
            if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
                if not node.name.startswith("_"):
                    symbols.append(node.name)
    except SyntaxError:
        pass

    # Fallback regex symbols
    if not symbols:
        symbols = [
            m for m in _PY_CLASS_RE.findall(src) + _PY_FUNC_RE.findall(src) if not m.startswith("_")
        ]

    kind = _infer_py_kind(label, symbols)

    node_info = NodeInfo(
        path=label,
        label=file_path.stem,
        kind=kind,
        language="python",
        symbols=list(dict.fromkeys(symbols))[:30],
        description=description,
        line_count=_count_lines(file_path),
    )

    edges = _extract_python_imports(src, label, root, file_path)
    return node_info, edges


def _infer_py_kind(label: str, symbols: List[str]) -> str:
    if "service" in label.lower():
        return "service"
    if "test" in label.lower():
        return "test"
    if "main" in label.lower():
        return "module"
    return "module"


def _extract_python_imports(
    src: str, source_label: str, root: Path, file_path: Path
) -> List[EdgeInfo]:
    edges: List[EdgeInfo] = []
    try:
        tree = ast.parse(src)
    except SyntaxError:
        return edges

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                target = _resolve_python_module(alias.name, root, file_path)
                if target:
                    edges.append(EdgeInfo(source=source_label, target=target, kind="import", symbol=alias.name))
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                target = _resolve_python_module(node.module, root, file_path)
                if target:
                    symbols = [alias.name for alias in node.names]
                    edges.append(
                        EdgeInfo(
                            source=source_label,
                            target=target,
                            kind="import",
                            symbol=", ".join(symbols),
                        )
                    )
    return edges


def _resolve_python_module(module: str, root: Path, from_file: Path) -> str | None:
    """Try to resolve a Python module name to a relative file path."""
    # Relative: try as path from root
    parts = module.split(".")
    candidate = root / Path(*parts)
    for ext in (".py", "/__init__.py"):
        p = Path(str(candidate) + ext)
        if p.exists():
            try:
                return str(p.relative_to(root))
            except ValueError:
                pass
    # Try relative to file's directory
    candidate2 = from_file.parent / Path(*parts)
    for ext in (".py", "/__init__.py"):
        p = Path(str(candidate2) + ext)
        if p.exists():
            try:
                return str(p.relative_to(root))
            except ValueError:
                pass
    return None


# ---------------------------------------------------------------------------
# TypeScript / JavaScript extractor
# ---------------------------------------------------------------------------


def extract_typescript(file_path: Path, root: Path) -> Tuple[NodeInfo, List[EdgeInfo]]:
    label = _relative_label(file_path, root)
    src = file_path.read_text(encoding="utf-8", errors="replace")

    raw_symbols = _TS_EXPORT_RE.findall(src)
    if not raw_symbols:
        raw_symbols = _TS_CLASS_RE.findall(src) + _TS_FUNC_RE.findall(src)
    symbols = list(dict.fromkeys(raw_symbols))[:30]

    # Description from first JSDoc or block comment
    description = ""
    m = re.search(r"/\*\*?\s*(.*?)\s*(?:\*/|\n)", src)
    if m:
        description = m.group(1).strip()[:120]

    kind = _infer_ts_kind(label, src)

    node_info = NodeInfo(
        path=label,
        label=file_path.stem,
        kind=kind,
        language="typescript" if file_path.suffix in (".ts", ".tsx") else "javascript",
        symbols=symbols,
        description=description,
        line_count=_count_lines(file_path),
    )

    edges = _extract_ts_imports(src, label, root, file_path)
    return node_info, edges


def _infer_ts_kind(label: str, src: str) -> str:
    if "component" in label.lower() or "Page" in label or ".tsx" in label:
        return "component"
    if "service" in label.lower():
        return "service"
    if "engine" in label.lower() or "Engine" in src:
        return "engine"
    if "test" in label.lower() or "spec" in label.lower():
        return "test"
    if "hook" in label.lower() or label.startswith("use"):
        return "hook"
    return "module"


def _extract_ts_imports(
    src: str, source_label: str, root: Path, file_path: Path
) -> List[EdgeInfo]:
    edges: List[EdgeInfo] = []

    all_imports = _TS_IMPORT_RE.findall(src) + _TS_IMPORT_SIDE_EFFECT_RE.findall(src)

    for raw_path in all_imports:
        # Skip external packages (no leading . or /)
        if not raw_path.startswith(".") and not raw_path.startswith("/"):
            continue
        target = _resolve_ts_import(raw_path, root, file_path)
        if target:
            edges.append(EdgeInfo(source=source_label, target=target, kind="import", symbol=raw_path))

    return edges


def _resolve_ts_import(raw: str, root: Path, from_file: Path) -> str | None:
    """Resolve a relative TypeScript import to a file path."""
    base = (from_file.parent / raw).resolve()
    for ext in ("", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"):
        p = Path(str(base) + ext)
        if p.exists() and p.is_file():
            try:
                return str(p.relative_to(root))
            except ValueError:
                pass
    return None


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------


def should_skip(path: Path) -> bool:
    return any(part in _IGNORED_DIRS for part in path.parts)


def extract_file(file_path: Path, root: Path) -> Tuple[NodeInfo, List[EdgeInfo]] | None:
    if should_skip(file_path):
        return None
    if file_path.suffix in _PYTHON_EXTS:
        return extract_python(file_path, root)
    if file_path.suffix in _TS_EXTS:
        return extract_typescript(file_path, root)
    return None
