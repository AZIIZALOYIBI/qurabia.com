"""
Server-Sent Events (SSE) Manager

Provides real-time event streaming to clients using SSE.
Features:
- Connection management
- Event filtering per client
- Heartbeat mechanism
- Automatic cleanup
- Graceful shutdown
"""

import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

import structlog
from fastapi import Request
from starlette.responses import StreamingResponse

from .event_bus import Event, EventBus, EventType, get_event_bus

logger = structlog.get_logger()


class SSEConnection:
    """Represents a single SSE connection"""

    def __init__(
        self,
        connection_id: str,
        request: Request,
        event_filter: Optional[Dict[str, Any]] = None,
    ):
        self.connection_id = connection_id
        self.request = request
        self.event_filter = event_filter
        self.queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue(maxsize=100)
        self.connected_at = time.time()
        self.last_heartbeat = time.time()
        self.is_active = True

    async def send_event(self, event: Dict[str, Any]) -> None:
        """Add event to send queue"""
        try:
            await asyncio.wait_for(self.queue.put(event), timeout=5.0)
        except asyncio.TimeoutError:
            logger.warning(
                "sse_queue_full",
                connection_id=self.connection_id,
            )

    async def send_heartbeat(self) -> None:
        """Send heartbeat to keep connection alive"""
        self.last_heartbeat = time.time()
        await self.send_event({
            "type": "heartbeat",
            "timestamp": self.last_heartbeat,
        })

    def disconnect(self) -> None:
        """Mark connection as disconnected"""
        self.is_active = False


class SSEManager:
    """
    Manages Server-Sent Events connections and streaming

    Features:
    - Multiple concurrent connections
    - Per-client event filtering
    - Automatic heartbeat
    - Connection cleanup
    - Event history replay
    """

    def __init__(
        self,
        event_bus: Optional[EventBus] = None,
        heartbeat_interval: float = 30.0,
        connection_timeout: float = 300.0,
    ):
        self.event_bus = event_bus or get_event_bus()
        self.heartbeat_interval = heartbeat_interval
        self.connection_timeout = connection_timeout
        self.connections: Dict[str, SSEConnection] = {}
        self._cleanup_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None

        logger.info(
            "sse_manager_initialized",
            heartbeat_interval=heartbeat_interval,
            connection_timeout=connection_timeout,
        )

    async def start(self) -> None:
        """Start background tasks"""
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        if not self._heartbeat_task:
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

        logger.info("sse_manager_started")

    async def stop(self) -> None:
        """Stop background tasks and close all connections"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass

        # Disconnect all clients
        for conn in list(self.connections.values()):
            conn.disconnect()

        self.connections.clear()

        logger.info("sse_manager_stopped")

    async def create_event_stream(
        self,
        request: Request,
        event_filter: Optional[Dict[str, Any]] = None,
        replay_history: bool = False,
        history_limit: int = 10,
    ) -> StreamingResponse:
        """
        Create a new SSE stream for a client

        Args:
            request: FastAPI request object
            event_filter: Optional filter for events
            replay_history: Whether to replay recent events
            history_limit: Number of historical events to replay

        Returns:
            StreamingResponse for SSE
        """
        connection_id = str(uuid4())
        connection = SSEConnection(connection_id, request, event_filter)
        self.connections[connection_id] = connection

        logger.info(
            "sse_connection_created",
            connection_id=connection_id,
            client_ip=request.client.host if request.client else "unknown",
            event_filter=event_filter,
        )

        # Subscribe to event bus
        async def event_handler(event: Event) -> None:
            if connection.is_active and event.matches_filter(event_filter):
                await connection.send_event({
                    "type": "event",
                    "event": event.to_dict(),
                })

        await self.event_bus.subscribe(connection_id, event_handler, event_filter)

        # Replay history if requested
        if replay_history:
            history = await self.event_bus.get_history(
                event_filter=event_filter,
                limit=history_limit,
            )
            for event in reversed(history):  # Send oldest first
                await connection.send_event({
                    "type": "history",
                    "event": event.to_dict(),
                })

        # Create streaming generator
        async def event_generator():
            try:
                # Send initial connection message
                yield self._format_sse({
                    "type": "connected",
                    "connection_id": connection_id,
                    "timestamp": time.time(),
                })

                # Stream events
                while connection.is_active:
                    try:
                        # Wait for event with timeout
                        event = await asyncio.wait_for(
                            connection.queue.get(),
                            timeout=self.heartbeat_interval,
                        )
                        yield self._format_sse(event)
                    except asyncio.TimeoutError:
                        # Send heartbeat on timeout
                        await connection.send_heartbeat()

            except asyncio.CancelledError:
                logger.info("sse_stream_cancelled", connection_id=connection_id)
            except Exception as e:
                logger.error(
                    "sse_stream_error",
                    connection_id=connection_id,
                    error=str(e),
                    exc_info=True,
                )
            finally:
                # Cleanup
                await self._disconnect_client(connection_id)

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            },
        )

    def _format_sse(self, data: Dict[str, Any]) -> str:
        """Format data as SSE message"""
        json_data = json.dumps(data, ensure_ascii=False)
        return f"data: {json_data}\n\n"

    async def _disconnect_client(self, connection_id: str) -> None:
        """Disconnect and cleanup a client"""
        if connection_id in self.connections:
            connection = self.connections[connection_id]
            connection.disconnect()
            del self.connections[connection_id]

            # Unsubscribe from event bus
            await self.event_bus.unsubscribe(connection_id)

            logger.info(
                "sse_connection_closed",
                connection_id=connection_id,
                duration=time.time() - connection.connected_at,
            )

    async def _cleanup_loop(self) -> None:
        """Background task to cleanup stale connections"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute

                current_time = time.time()
                stale_connections = []

                for conn_id, conn in self.connections.items():
                    # Check if connection is stale
                    if current_time - conn.last_heartbeat > self.connection_timeout:
                        stale_connections.append(conn_id)

                # Cleanup stale connections
                for conn_id in stale_connections:
                    logger.info(
                        "sse_connection_timeout",
                        connection_id=conn_id,
                    )
                    await self._disconnect_client(conn_id)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "sse_cleanup_error",
                    error=str(e),
                    exc_info=True,
                )

    async def _heartbeat_loop(self) -> None:
        """Background task to send heartbeats"""
        while True:
            try:
                await asyncio.sleep(self.heartbeat_interval)

                # Send heartbeat to all active connections
                for conn in list(self.connections.values()):
                    if conn.is_active:
                        try:
                            await conn.send_heartbeat()
                        except Exception as e:
                            logger.warning(
                                "sse_heartbeat_failed",
                                connection_id=conn.connection_id,
                                error=str(e),
                            )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "sse_heartbeat_error",
                    error=str(e),
                    exc_info=True,
                )

    async def broadcast(self, event: Dict[str, Any]) -> None:
        """Broadcast an event to all connected clients"""
        for conn in list(self.connections.values()):
            if conn.is_active:
                await conn.send_event(event)

    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len([c for c in self.connections.values() if c.is_active])

    def get_stats(self) -> Dict[str, Any]:
        """Get SSE manager statistics"""
        active_connections = [c for c in self.connections.values() if c.is_active]
        return {
            "total_connections": len(self.connections),
            "active_connections": len(active_connections),
            "avg_connection_duration": (
                sum(time.time() - c.connected_at for c in active_connections) / len(active_connections)
                if active_connections
                else 0
            ),
        }


# Global SSE manager instance
_sse_manager: Optional[SSEManager] = None


def get_sse_manager() -> SSEManager:
    """Get or create the global SSE manager instance"""
    global _sse_manager
    if _sse_manager is None:
        _sse_manager = SSEManager()
    return _sse_manager
