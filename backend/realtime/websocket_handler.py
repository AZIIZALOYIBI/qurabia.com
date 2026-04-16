"""
WebSocket Handler for Real-time Bidirectional Communication

Provides WebSocket support with:
- Room/channel management
- Message broadcasting
- Connection state management
- Automatic reconnection handling
- Message queuing
"""

import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

import structlog
from fastapi import WebSocket, WebSocketDisconnect

from .event_bus import Event, EventBus, EventType, get_event_bus

logger = structlog.get_logger()


class WebSocketConnection:
    """Represents a single WebSocket connection"""

    def __init__(
        self,
        connection_id: str,
        websocket: WebSocket,
        user_id: Optional[str] = None,
    ):
        self.connection_id = connection_id
        self.websocket = websocket
        self.user_id = user_id
        self.rooms: Set[str] = set()
        self.connected_at = time.time()
        self.last_activity = time.time()
        self.is_active = True
        self.metadata: Dict[str, Any] = {}

    async def send_json(self, data: Dict[str, Any]) -> None:
        """Send JSON message to client"""
        try:
            await self.websocket.send_json(data)
            self.last_activity = time.time()
        except Exception as e:
            logger.error(
                "websocket_send_error",
                connection_id=self.connection_id,
                error=str(e),
            )
            self.is_active = False

    async def receive_json(self) -> Dict[str, Any]:
        """Receive JSON message from client"""
        data = await self.websocket.receive_json()
        self.last_activity = time.time()
        return data

    def join_room(self, room: str) -> None:
        """Add connection to a room"""
        self.rooms.add(room)

    def leave_room(self, room: str) -> None:
        """Remove connection from a room"""
        self.rooms.discard(room)

    def disconnect(self) -> None:
        """Mark connection as disconnected"""
        self.is_active = False


class WebSocketHandler:
    """
    Manages WebSocket connections and messaging

    Features:
    - Multiple concurrent connections
    - Room-based broadcasting
    - Direct messaging
    - Event bus integration
    - Connection lifecycle management
    """

    def __init__(
        self,
        event_bus: Optional[EventBus] = None,
        ping_interval: float = 30.0,
        connection_timeout: float = 300.0,
    ):
        self.event_bus = event_bus or get_event_bus()
        self.ping_interval = ping_interval
        self.connection_timeout = connection_timeout
        self.connections: Dict[str, WebSocketConnection] = {}
        self.rooms: Dict[str, Set[str]] = {}  # room -> set of connection_ids
        self._cleanup_task: Optional[asyncio.Task] = None

        logger.info(
            "websocket_handler_initialized",
            ping_interval=ping_interval,
            connection_timeout=connection_timeout,
        )

    async def start(self) -> None:
        """Start background tasks"""
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

        logger.info("websocket_handler_started")

    async def stop(self) -> None:
        """Stop background tasks and close all connections"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        # Close all connections
        for conn in list(self.connections.values()):
            await self._disconnect_client(conn.connection_id)

        logger.info("websocket_handler_stopped")

    async def handle_connection(
        self,
        websocket: WebSocket,
        user_id: Optional[str] = None,
        initial_rooms: Optional[List[str]] = None,
    ) -> None:
        """
        Handle a new WebSocket connection

        Args:
            websocket: WebSocket instance
            user_id: Optional user identifier
            initial_rooms: Optional list of rooms to join initially
        """
        # Accept connection
        await websocket.accept()

        connection_id = str(uuid4())
        connection = WebSocketConnection(connection_id, websocket, user_id)
        self.connections[connection_id] = connection

        logger.info(
            "websocket_connection_established",
            connection_id=connection_id,
            user_id=user_id,
        )

        # Join initial rooms
        if initial_rooms:
            for room in initial_rooms:
                await self._join_room(connection_id, room)

        # Send welcome message
        await connection.send_json({
            "type": "connected",
            "connection_id": connection_id,
            "timestamp": time.time(),
        })

        # Subscribe to event bus
        async def event_handler(event: Event) -> None:
            if connection.is_active:
                await connection.send_json({
                    "type": "event",
                    "event": event.to_dict(),
                })

        await self.event_bus.subscribe(connection_id, event_handler)

        # Handle messages
        try:
            while connection.is_active:
                try:
                    # Receive message with timeout
                    message = await asyncio.wait_for(
                        connection.receive_json(),
                        timeout=self.ping_interval * 2,
                    )

                    # Process message
                    await self._handle_message(connection_id, message)

                except asyncio.TimeoutError:
                    # Send ping
                    await connection.send_json({
                        "type": "ping",
                        "timestamp": time.time(),
                    })

        except WebSocketDisconnect:
            logger.info(
                "websocket_client_disconnected",
                connection_id=connection_id,
            )
        except Exception as e:
            logger.error(
                "websocket_connection_error",
                connection_id=connection_id,
                error=str(e),
                exc_info=True,
            )
        finally:
            await self._disconnect_client(connection_id)

    async def _handle_message(
        self,
        connection_id: str,
        message: Dict[str, Any],
    ) -> None:
        """Process incoming WebSocket message"""
        message_type = message.get("type")

        if message_type == "ping":
            # Respond to ping
            conn = self.connections.get(connection_id)
            if conn:
                await conn.send_json({
                    "type": "pong",
                    "timestamp": time.time(),
                })

        elif message_type == "join_room":
            # Join a room
            room = message.get("room")
            if room:
                await self._join_room(connection_id, room)

        elif message_type == "leave_room":
            # Leave a room
            room = message.get("room")
            if room:
                await self._leave_room(connection_id, room)

        elif message_type == "broadcast":
            # Broadcast to room
            room = message.get("room")
            data = message.get("data")
            if room and data:
                await self.broadcast_to_room(room, data, exclude=connection_id)

        elif message_type == "send":
            # Send to specific connection
            target_id = message.get("target")
            data = message.get("data")
            if target_id and data:
                await self.send_to_connection(target_id, data)

        elif message_type == "publish_event":
            # Publish to event bus
            event_type = message.get("event_type")
            data = message.get("data", {})
            if event_type:
                try:
                    event = Event(
                        event_type=EventType(event_type),
                        data=data,
                        source=f"websocket:{connection_id}",
                    )
                    await self.event_bus.publish(event)
                except ValueError:
                    logger.warning(
                        "invalid_event_type",
                        event_type=event_type,
                        connection_id=connection_id,
                    )

        else:
            logger.warning(
                "unknown_message_type",
                message_type=message_type,
                connection_id=connection_id,
            )

    async def _join_room(self, connection_id: str, room: str) -> None:
        """Add connection to a room"""
        conn = self.connections.get(connection_id)
        if not conn:
            return

        # Add to room
        if room not in self.rooms:
            self.rooms[room] = set()
        self.rooms[room].add(connection_id)
        conn.join_room(room)

        logger.info(
            "websocket_room_joined",
            connection_id=connection_id,
            room=room,
        )

        # Notify client
        await conn.send_json({
            "type": "room_joined",
            "room": room,
            "timestamp": time.time(),
        })

    async def _leave_room(self, connection_id: str, room: str) -> None:
        """Remove connection from a room"""
        conn = self.connections.get(connection_id)
        if not conn:
            return

        # Remove from room
        if room in self.rooms:
            self.rooms[room].discard(connection_id)
            if not self.rooms[room]:
                del self.rooms[room]

        conn.leave_room(room)

        logger.info(
            "websocket_room_left",
            connection_id=connection_id,
            room=room,
        )

        # Notify client
        await conn.send_json({
            "type": "room_left",
            "room": room,
            "timestamp": time.time(),
        })

    async def _disconnect_client(self, connection_id: str) -> None:
        """Disconnect and cleanup a client"""
        if connection_id not in self.connections:
            return

        conn = self.connections[connection_id]
        conn.disconnect()

        # Remove from all rooms
        for room in list(conn.rooms):
            if room in self.rooms:
                self.rooms[room].discard(connection_id)
                if not self.rooms[room]:
                    del self.rooms[room]

        # Unsubscribe from event bus
        await self.event_bus.unsubscribe(connection_id)

        # Remove connection
        del self.connections[connection_id]

        logger.info(
            "websocket_connection_closed",
            connection_id=connection_id,
            duration=time.time() - conn.connected_at,
        )

    async def broadcast_to_room(
        self,
        room: str,
        data: Dict[str, Any],
        exclude: Optional[str] = None,
    ) -> None:
        """
        Broadcast message to all connections in a room

        Args:
            room: Room name
            data: Message data
            exclude: Optional connection_id to exclude from broadcast
        """
        if room not in self.rooms:
            return

        message = {
            "type": "broadcast",
            "room": room,
            "data": data,
            "timestamp": time.time(),
        }

        tasks = []
        for conn_id in self.rooms[room]:
            if conn_id != exclude:
                conn = self.connections.get(conn_id)
                if conn and conn.is_active:
                    tasks.append(conn.send_json(message))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def send_to_connection(
        self,
        connection_id: str,
        data: Dict[str, Any],
    ) -> None:
        """Send message to specific connection"""
        conn = self.connections.get(connection_id)
        if conn and conn.is_active:
            await conn.send_json({
                "type": "message",
                "data": data,
                "timestamp": time.time(),
            })

    async def broadcast_to_all(self, data: Dict[str, Any]) -> None:
        """Broadcast message to all connections"""
        message = {
            "type": "broadcast",
            "data": data,
            "timestamp": time.time(),
        }

        tasks = []
        for conn in self.connections.values():
            if conn.is_active:
                tasks.append(conn.send_json(message))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _cleanup_loop(self) -> None:
        """Background task to cleanup stale connections"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute

                current_time = time.time()
                stale_connections = []

                for conn_id, conn in self.connections.items():
                    # Check if connection is stale
                    if current_time - conn.last_activity > self.connection_timeout:
                        stale_connections.append(conn_id)

                # Cleanup stale connections
                for conn_id in stale_connections:
                    logger.info(
                        "websocket_connection_timeout",
                        connection_id=conn_id,
                    )
                    await self._disconnect_client(conn_id)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "websocket_cleanup_error",
                    error=str(e),
                    exc_info=True,
                )

    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len([c for c in self.connections.values() if c.is_active])

    def get_room_members(self, room: str) -> List[str]:
        """Get list of connection IDs in a room"""
        return list(self.rooms.get(room, set()))

    def get_stats(self) -> Dict[str, Any]:
        """Get WebSocket handler statistics"""
        active_connections = [c for c in self.connections.values() if c.is_active]
        return {
            "total_connections": len(self.connections),
            "active_connections": len(active_connections),
            "total_rooms": len(self.rooms),
            "avg_connection_duration": (
                sum(time.time() - c.connected_at for c in active_connections) / len(active_connections)
                if active_connections
                else 0
            ),
        }


# Global WebSocket handler instance
_websocket_handler: Optional[WebSocketHandler] = None


def get_websocket_handler() -> WebSocketHandler:
    """Get or create the global WebSocket handler instance"""
    global _websocket_handler
    if _websocket_handler is None:
        _websocket_handler = WebSocketHandler()
    return _websocket_handler
