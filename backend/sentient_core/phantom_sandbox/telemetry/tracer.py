"""phantom_sandbox.telemetry.tracer — تسجيل وتتبع شبحي خفيف الوزن."""

from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from typing import Any, Generator
from uuid import UUID

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    level=logging.INFO,
)

_RESET  = "\033[0m"
_GREEN  = "\033[92m"
_YELLOW = "\033[93m"
_RED    = "\033[91m"
_CYAN   = "\033[96m"
_BOLD   = "\033[1m"
_DIM    = "\033[2m"


class PhantomSpan:
    """وحدة تتبع واحدة — تُسجّل الأحداث والأخطاء."""

    def __init__(self, name: str, layer: str = "") -> None:
        self.name       = name
        self.layer      = layer
        self._start     = time.monotonic()
        self._events:   list[dict]  = []
        self._ok        = True
        self._error_msg = ""

    def add_event(self, event_name: str, **kwargs: Any) -> None:
        self._events.append({"event": event_name, "ts": time.monotonic(), **kwargs})

    def set_error(self, message: str) -> None:
        self._ok        = False
        self._error_msg = message

    def set_ok(self, **kwargs: Any) -> None:
        self._ok = True
        self._events.append({"event": "ok", **kwargs})

    @property
    def duration_ms(self) -> float:
        return round((time.monotonic() - self._start) * 1000, 2)


class PhantomTracer:
    """مُتتبّع خفيف الوزن — يُنشئ Spans ويُسجّل أدواتها."""

    def __init__(self, session_id: UUID | None = None) -> None:
        self._session_id = session_id
        self._logger     = logging.getLogger("phantom.tracer")

    @contextmanager
    def span(self, name: str, layer: str = "") -> Generator[PhantomSpan, None, None]:
        """مدير سياق يُنشئ Span ويُسجّل مدته عند الانتهاء."""
        s = PhantomSpan(name, layer)
        try:
            yield s
        finally:
            status = "OK" if s._ok else f"ERROR({s._error_msg})"
            self._logger.debug(
                "span=%s layer=%s status=%s duration_ms=%.1f",
                name, layer, status, s.duration_ms,
            )


class PhantomLogger:
    """مُسجّل شبحي ملوّن — يُضيف طبقة بصرية فوق logging."""

    def __init__(self, name: str, session_id: UUID | None = None) -> None:
        self._log = logging.getLogger(f"phantom.{name}")

    def section(self, title: str) -> None:
        print(f"\n{_BOLD}{_CYAN}{'─'*60}{_RESET}")
        print(f"{_BOLD}{_CYAN}  {title}{_RESET}")
        print(f"{_BOLD}{_CYAN}{'─'*60}{_RESET}\n")
        self._log.info("[SECTION] %s", title)

    def info(self, message: str) -> None:
        print(f"  {_DIM}ℹ{_RESET}  {message}")
        self._log.info(message)

    def success(self, message: str) -> None:
        print(f"  {_GREEN}✔{_RESET}  {message}")
        self._log.info("[OK] %s", message)

    def warning(self, message: str) -> None:
        print(f"  {_YELLOW}⚠{_RESET}  {message}")
        self._log.warning(message)

    def error(self, message: str) -> None:
        print(f"  {_RED}✘{_RESET}  {message}")
        self._log.error(message)

    def critical(self, message: str) -> None:
        print(f"  {_BOLD}{_RED}‼{_RESET}  {message}")
        self._log.critical(message)

    def metric(self, name: str, value: Any, unit: str = "") -> None:
        label = f"{_BOLD}{name}{_RESET}"
        val   = f"{_GREEN}{value}{unit}{_RESET}"
        print(f"  📊  {label}: {val}")
