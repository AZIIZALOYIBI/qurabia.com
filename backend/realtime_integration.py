"""
Real-time API Integration for main.py

This module provides the real-time endpoints and startup/shutdown handlers
for integration into the FastAPI application.
"""

from typing import Any, Dict, Optional

import structlog
from fastapi import FastAPI, Query, Request, WebSocket
from pydantic import BaseModel

from .realtime import (
    EventType,
    get_event_bus,
    get_sse_manager,
    get_websocket_handler,
    publish_event,
)

logger = structlog.get_logger()


class PublishEventRequest(BaseModel):
    """Request model for publishing events"""
    event_type: str
    data: Dict[str, Any]
    source: Optional[str] = "api"
    priority: Optional[int] = 0
    tags: Optional[list[str]] = None
    metadata: Optional[Dict[str, Any]] = None


def setup_realtime_endpoints(app: FastAPI) -> None:
    """
    Setup real-time endpoints on the FastAPI application

    Args:
        app: FastAPI application instance
    """

    @app.on_event("startup")
    async def startup_realtime():
        """Initialize real-time infrastructure on startup"""
        try:
            sse_manager = get_sse_manager()
            await sse_manager.start()

            ws_handler = get_websocket_handler()
            await ws_handler.start()

            logger.info("realtime_infrastructure_started")
        except Exception as e:
            logger.error(
                "realtime_startup_error",
                error=str(e),
                exc_info=True,
            )

    @app.on_event("shutdown")
    async def shutdown_realtime():
        """Cleanup real-time infrastructure on shutdown"""
        try:
            sse_manager = get_sse_manager()
            await sse_manager.stop()

            ws_handler = get_websocket_handler()
            await ws_handler.stop()

            logger.info("realtime_infrastructure_stopped")
        except Exception as e:
            logger.error(
                "realtime_shutdown_error",
                error=str(e),
                exc_info=True,
            )

    @app.get("/api/stream", tags=["Real-time"])
    async def stream_events(
        request: Request,
        event_types: Optional[str] = Query(None, description="Comma-separated event types"),
        tags: Optional[str] = Query(None, description="Comma-separated tags"),
        min_priority: Optional[int] = Query(None, description="Minimum event priority"),
        sources: Optional[str] = Query(None, description="Comma-separated sources"),
        replay_history: bool = Query(False, description="Replay recent events"),
        history_limit: int = Query(10, description="Number of historical events to replay"),
    ):
        """
        Server-Sent Events (SSE) endpoint for real-time event streaming

        Streams events to the client with optional filtering:
        - event_types: Filter by event types (e.g., "simulation-progress,simulation-complete")
        - tags: Filter by tags
        - min_priority: Filter by minimum priority level
        - sources: Filter by event sources
        - replay_history: If true, replay recent events before streaming
        - history_limit: Number of historical events to replay

        Example:
            GET /api/stream?event_types=simulation-progress,simulation-complete&replay_history=true

        Response format (SSE):
            data: {"type": "connected", "connection_id": "...", "timestamp": 1234567890}

            data: {"type": "event", "event": {...}}

            data: {"type": "heartbeat", "timestamp": 1234567890}
        """
        # Build event filter
        event_filter = {}

        if event_types:
            try:
                event_filter["event_types"] = [
                    EventType(t.strip()) for t in event_types.split(",")
                ]
            except ValueError as e:
                logger.warning("invalid_event_types", event_types=event_types, error=str(e))

        if tags:
            event_filter["tags"] = [t.strip() for t in tags.split(",")]

        if min_priority is not None:
            event_filter["min_priority"] = min_priority

        if sources:
            event_filter["sources"] = [s.strip() for s in sources.split(",")]

        # Create SSE stream
        sse_manager = get_sse_manager()
        return await sse_manager.create_event_stream(
            request=request,
            event_filter=event_filter if event_filter else None,
            replay_history=replay_history,
            history_limit=history_limit,
        )

    @app.websocket("/ws")
    async def websocket_endpoint(
        websocket: WebSocket,
        user_id: Optional[str] = Query(None),
    ):
        """
        WebSocket endpoint for bidirectional real-time communication

        Query parameters:
        - user_id: Optional user identifier

        Message format (client -> server):
            {"type": "ping"}  # Ping server
            {"type": "join_room", "room": "simulation-123"}  # Join a room
            {"type": "leave_room", "room": "simulation-123"}  # Leave a room
            {"type": "broadcast", "room": "simulation-123", "data": {...}}  # Broadcast to room
            {"type": "send", "target": "connection-id", "data": {...}}  # Send to specific connection
            {"type": "publish_event", "event_type": "custom", "data": {...}}  # Publish to event bus

        Message format (server -> client):
            {"type": "connected", "connection_id": "...", "timestamp": 1234567890}
            {"type": "pong", "timestamp": 1234567890}
            {"type": "event", "event": {...}}
            {"type": "broadcast", "room": "...", "data": {...}, "timestamp": 1234567890}
            {"type": "message", "data": {...}, "timestamp": 1234567890}
        """
        ws_handler = get_websocket_handler()
        await ws_handler.handle_connection(
            websocket=websocket,
            user_id=user_id,
        )

    @app.post("/api/realtime/publish", tags=["Real-time"])
    async def publish_realtime_event(req: PublishEventRequest):
        """
        Publish an event to the real-time event bus

        This endpoint allows publishing custom events that will be broadcast
        to all connected SSE and WebSocket clients matching the event filter.

        Example:
            POST /api/realtime/publish
            {
                "event_type": "simulation-progress",
                "data": {
                    "simulation_id": "sim-123",
                    "progress": 45,
                    "status": "running"
                },
                "source": "simulation-engine",
                "priority": 5,
                "tags": ["simulation", "quantum"]
            }
        """
        try:
            event = await publish_event(
                event_type=EventType(req.event_type),
                data=req.data,
                source=req.source or "api",
                priority=req.priority or 0,
                tags=req.tags,
                metadata=req.metadata,
            )

            return {
                "status": "published",
                "event_id": event.event_id,
                "timestamp": event.timestamp,
            }
        except ValueError as e:
            return {"status": "error", "message": f"Invalid event type: {str(e)}"}
        except Exception as e:
            logger.error(
                "publish_event_error",
                error=str(e),
                exc_info=True,
            )
            return {"status": "error", "message": "Failed to publish event"}

    @app.get("/api/realtime/stats", tags=["Real-time"])
    async def get_realtime_stats():
        """
        Get statistics about the real-time infrastructure

        Returns information about:
        - Event bus statistics
        - SSE connections
        - WebSocket connections
        - Event history
        """
        event_bus = get_event_bus()
        sse_manager = get_sse_manager()
        ws_handler = get_websocket_handler()

        return {
            "event_bus": await event_bus.get_stats(),
            "sse": sse_manager.get_stats(),
            "websocket": ws_handler.get_stats(),
        }

    @app.get("/api/realtime/history", tags=["Real-time"])
    async def get_event_history(
        event_types: Optional[str] = Query(None, description="Comma-separated event types"),
        tags: Optional[str] = Query(None, description="Comma-separated tags"),
        limit: int = Query(50, description="Maximum number of events to return"),
    ):
        """
        Retrieve recent event history

        Query parameters:
        - event_types: Filter by event types
        - tags: Filter by tags
        - limit: Maximum number of events (default: 50)
        """
        # Build event filter
        event_filter = {}

        if event_types:
            try:
                event_filter["event_types"] = [
                    EventType(t.strip()) for t in event_types.split(",")
                ]
            except ValueError as e:
                logger.warning("invalid_event_types", event_types=event_types, error=str(e))

        if tags:
            event_filter["tags"] = [t.strip() for t in tags.split(",")]

        event_bus = get_event_bus()
        events = await event_bus.get_history(
            event_filter=event_filter if event_filter else None,
            limit=limit,
        )

        return {
            "events": [e.to_dict() for e in events],
            "count": len(events),
        }

    logger.info("realtime_endpoints_registered")
