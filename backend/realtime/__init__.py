"""
Real-time Communication Infrastructure

This package provides real-time capabilities using Server-Sent Events (SSE)
and WebSocket for bidirectional communication.
"""

from .event_bus import Event, EventBus, EventType, get_event_bus, publish_event
from .sse_manager import SSEManager, get_sse_manager
from .websocket_handler import WebSocketHandler, get_websocket_handler

__all__ = [
    "Event",
    "EventBus",
    "EventType",
    "SSEManager",
    "WebSocketHandler",
    "get_event_bus",
    "get_sse_manager",
    "get_websocket_handler",
    "publish_event",
]
