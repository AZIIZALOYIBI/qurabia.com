"""
Internal Event Bus for Real-time Communication

Implements a Pub/Sub pattern for internal event distribution across the platform.
Supports event persistence, filtering, and multi-subscriber broadcasting.
"""

import asyncio
import time
from collections import defaultdict, deque
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Callable, Coroutine, Deque, Dict, List, Optional, Set
from uuid import uuid4

import structlog

logger = structlog.get_logger()


class EventType(str, Enum):
    """Supported real-time event types"""
    SIMULATION_STARTED = "simulation-started"
    SIMULATION_PROGRESS = "simulation-progress"
    SIMULATION_COMPLETE = "simulation-complete"
    SIMULATION_ERROR = "simulation-error"

    ETHICS_DECISION = "ethics-decision"
    ETHICS_ALERT = "ethics-alert"

    SYSTEM_STATUS = "system-status"
    SYSTEM_ERROR = "system-error"

    QUANTUM_COMPUTATION = "quantum-computation"
    QUANTUM_MEASUREMENT = "quantum-measurement"

    USER_NOTIFICATION = "user-notification"
    METRIC_UPDATE = "metric-update"

    CUSTOM = "custom"


@dataclass
class Event:
    """Real-time event data structure"""
    event_type: EventType
    data: Dict[str, Any]
    event_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: float = field(default_factory=time.time)
    source: str = "platform"
    priority: int = 0  # Higher = more important
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary for serialization"""
        return {
            "event_type": self.event_type.value,
            "data": self.data,
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "source": self.source,
            "priority": self.priority,
            "tags": self.tags,
            "metadata": self.metadata,
        }

    def matches_filter(self, event_filter: Optional[Dict[str, Any]]) -> bool:
        """Check if event matches the provided filter criteria"""
        if not event_filter:
            return True

        # Filter by event type
        if "event_types" in event_filter:
            if self.event_type not in event_filter["event_types"]:
                return False

        # Filter by tags
        if "tags" in event_filter:
            if not any(tag in self.tags for tag in event_filter["tags"]):
                return False

        # Filter by priority
        if "min_priority" in event_filter:
            if self.priority < event_filter["min_priority"]:
                return False

        # Filter by source
        if "sources" in event_filter:
            if self.source not in event_filter["sources"]:
                return False

        return True


EventHandler = Callable[[Event], Coroutine[Any, Any, None]]


class EventBus:
    """
    Internal event bus implementing Pub/Sub pattern

    Features:
    - Multi-subscriber support
    - Event filtering per subscriber
    - Event persistence (configurable)
    - Priority-based delivery
    - Async event handling
    """

    def __init__(
        self,
        max_history: int = 1000,
        enable_persistence: bool = True,
    ):
        self._subscribers: Dict[str, Dict[str, Any]] = {}
        self._event_history: Deque[Event] = deque(maxlen=max_history)
        self._enable_persistence = enable_persistence
        self._event_count = 0
        self._lock = asyncio.Lock()

        logger.info(
            "event_bus_initialized",
            max_history=max_history,
            persistence=enable_persistence,
        )

    async def subscribe(
        self,
        subscriber_id: str,
        handler: EventHandler,
        event_filter: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Subscribe to events with optional filtering

        Args:
            subscriber_id: Unique identifier for the subscriber
            handler: Async callback function to handle events
            event_filter: Optional filter criteria
                - event_types: List[EventType]
                - tags: List[str]
                - min_priority: int
                - sources: List[str]
        """
        async with self._lock:
            self._subscribers[subscriber_id] = {
                "handler": handler,
                "filter": event_filter,
                "subscribed_at": time.time(),
            }

        logger.info(
            "subscriber_registered",
            subscriber_id=subscriber_id,
            filter=event_filter,
        )

    async def unsubscribe(self, subscriber_id: str) -> None:
        """Remove a subscriber"""
        async with self._lock:
            if subscriber_id in self._subscribers:
                del self._subscribers[subscriber_id]
                logger.info("subscriber_unregistered", subscriber_id=subscriber_id)

    async def publish(self, event: Event) -> None:
        """
        Publish an event to all matching subscribers

        Args:
            event: Event to publish
        """
        # Store in history if persistence is enabled
        if self._enable_persistence:
            async with self._lock:
                self._event_history.append(event)
                self._event_count += 1

        logger.debug(
            "event_published",
            event_type=event.event_type.value,
            event_id=event.event_id,
            source=event.source,
        )

        # Get snapshot of subscribers
        async with self._lock:
            subscribers = list(self._subscribers.items())

        # Deliver to matching subscribers
        tasks = []
        for subscriber_id, sub_info in subscribers:
            handler = sub_info["handler"]
            event_filter = sub_info.get("filter")

            # Check if event matches subscriber's filter
            if event.matches_filter(event_filter):
                tasks.append(self._deliver_event(subscriber_id, handler, event))

        # Execute all deliveries concurrently
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _deliver_event(
        self,
        subscriber_id: str,
        handler: EventHandler,
        event: Event,
    ) -> None:
        """Deliver event to a single subscriber with error handling"""
        try:
            await handler(event)
        except Exception as e:
            logger.error(
                "event_delivery_failed",
                subscriber_id=subscriber_id,
                event_id=event.event_id,
                error=str(e),
                exc_info=True,
            )

    async def get_history(
        self,
        event_filter: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
    ) -> List[Event]:
        """
        Retrieve event history with optional filtering

        Args:
            event_filter: Optional filter criteria
            limit: Maximum number of events to return

        Returns:
            List of matching events (newest first)
        """
        async with self._lock:
            events = list(self._event_history)

        # Reverse to get newest first
        events.reverse()

        # Apply filter
        if event_filter:
            events = [e for e in events if e.matches_filter(event_filter)]

        # Apply limit
        if limit:
            events = events[:limit]

        return events

    async def get_stats(self) -> Dict[str, Any]:
        """Get event bus statistics"""
        async with self._lock:
            subscriber_count = len(self._subscribers)
            history_size = len(self._event_history)

        return {
            "total_events": self._event_count,
            "subscriber_count": subscriber_count,
            "history_size": history_size,
            "persistence_enabled": self._enable_persistence,
        }

    async def clear_history(self) -> None:
        """Clear event history"""
        async with self._lock:
            self._event_history.clear()

        logger.info("event_history_cleared")

    def get_subscriber_count(self) -> int:
        """Get current number of subscribers (non-async)"""
        return len(self._subscribers)


# Global event bus instance
_event_bus: Optional[EventBus] = None


def get_event_bus() -> EventBus:
    """Get or create the global event bus instance"""
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus(max_history=1000, enable_persistence=True)
    return _event_bus


async def publish_event(
    event_type: EventType,
    data: Dict[str, Any],
    source: str = "platform",
    priority: int = 0,
    tags: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Event:
    """
    Convenience function to publish an event

    Args:
        event_type: Type of event
        data: Event payload data
        source: Event source identifier
        priority: Event priority (0-10, higher = more important)
        tags: Optional list of tags for filtering
        metadata: Optional metadata

    Returns:
        The published Event object
    """
    event = Event(
        event_type=event_type,
        data=data,
        source=source,
        priority=priority,
        tags=tags or [],
        metadata=metadata or {},
    )

    bus = get_event_bus()
    await bus.publish(event)

    return event
