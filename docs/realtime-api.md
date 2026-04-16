# Real-time API Documentation

## Overview

The QURABIA platform provides real-time communication capabilities using two complementary technologies:

- **Server-Sent Events (SSE)**: One-way streaming from server to client, ideal for receiving updates
- **WebSocket**: Bidirectional communication, ideal for interactive features and room-based messaging

Both technologies include:
- Automatic reconnection
- Event filtering
- Connection state management
- Error handling
- Low latency design

---

## Event Types

The platform supports the following event types:

| Event Type | Description |
|------------|-------------|
| `simulation-started` | Quantum simulation has started |
| `simulation-progress` | Progress update during simulation |
| `simulation-complete` | Simulation completed successfully |
| `simulation-error` | Error occurred during simulation |
| `ethics-decision` | Ethics framework made a decision |
| `ethics-alert` | Important ethics alert |
| `system-status` | System status update |
| `system-error` | System error notification |
| `quantum-computation` | Quantum computation result |
| `quantum-measurement` | Quantum measurement performed |
| `user-notification` | User notification |
| `metric-update` | Metrics/statistics update |
| `custom` | Custom event type |

---

## Server-Sent Events (SSE)

### Endpoint

```
GET /api/stream
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `event_types` | string | Comma-separated event types (e.g., `simulation-progress,simulation-complete`) |
| `tags` | string | Comma-separated tags for filtering |
| `min_priority` | integer | Minimum priority level (0-10) |
| `sources` | string | Comma-separated source identifiers |
| `replay_history` | boolean | Replay recent events before streaming (default: `false`) |
| `history_limit` | integer | Number of historical events to replay (default: `10`) |

### Response Format

SSE messages use the following format:

```
data: {"type": "connected", "connection_id": "uuid", "timestamp": 1234567890}

data: {"type": "event", "event": {...}}

data: {"type": "heartbeat", "timestamp": 1234567890}
```

### Event Structure

```json
{
  "event_type": "simulation-progress",
  "data": {
    "simulation_id": "sim-123",
    "progress": 45,
    "status": "running"
  },
  "event_id": "evt-uuid",
  "timestamp": 1234567890.123,
  "source": "quantum-engine",
  "priority": 5,
  "tags": ["simulation", "quantum"],
  "metadata": {}
}
```

### Example: JavaScript/Browser

```javascript
const eventSource = new EventSource('/api/stream?event_types=simulation-progress&replay_history=true');

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'event') {
    console.log('New event:', message.event);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

### Example: Python

```python
import requests

url = 'http://localhost:10000/api/stream?event_types=simulation-progress'

with requests.get(url, stream=True) as response:
    for line in response.iter_lines():
        if line.startswith(b'data: '):
            data = json.loads(line[6:])
            print(f"Received: {data}")
```

### Example: curl

```bash
curl -N http://localhost:10000/api/stream?event_types=simulation-progress,simulation-complete
```

---

## WebSocket

### Endpoint

```
WS /ws
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | string | Optional user identifier |

### Message Types (Client → Server)

#### 1. Ping

```json
{"type": "ping"}
```

#### 2. Join Room

```json
{
  "type": "join_room",
  "room": "simulation-123"
}
```

#### 3. Leave Room

```json
{
  "type": "leave_room",
  "room": "simulation-123"
}
```

#### 4. Broadcast to Room

```json
{
  "type": "broadcast",
  "room": "simulation-123",
  "data": {
    "message": "Hello, room!"
  }
}
```

#### 5. Send to Connection

```json
{
  "type": "send",
  "target": "connection-id",
  "data": {
    "message": "Hello, specific user!"
  }
}
```

#### 6. Publish Event

```json
{
  "type": "publish_event",
  "event_type": "custom",
  "data": {
    "custom_field": "value"
  }
}
```

### Message Types (Server → Client)

#### 1. Connected

```json
{
  "type": "connected",
  "connection_id": "uuid",
  "timestamp": 1234567890
}
```

#### 2. Pong

```json
{
  "type": "pong",
  "timestamp": 1234567890
}
```

#### 3. Event

```json
{
  "type": "event",
  "event": {
    "event_type": "simulation-progress",
    "data": {...},
    "event_id": "uuid",
    "timestamp": 1234567890
  }
}
```

#### 4. Room Joined

```json
{
  "type": "room_joined",
  "room": "simulation-123",
  "timestamp": 1234567890
}
```

#### 5. Room Left

```json
{
  "type": "room_left",
  "room": "simulation-123",
  "timestamp": 1234567890
}
```

#### 6. Broadcast

```json
{
  "type": "broadcast",
  "room": "simulation-123",
  "data": {...},
  "timestamp": 1234567890
}
```

#### 7. Message

```json
{
  "type": "message",
  "data": {...},
  "timestamp": 1234567890
}
```

### Example: JavaScript/Browser

```javascript
const ws = new WebSocket('ws://localhost:10000/ws?user_id=user-123');

ws.onopen = () => {
  console.log('Connected');

  // Join a room
  ws.send(JSON.stringify({
    type: 'join_room',
    room: 'simulation-123'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);

  if (message.type === 'event') {
    console.log('Event:', message.event);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Example: Python

```python
import asyncio
import websockets
import json

async def connect():
    uri = "ws://localhost:10000/ws?user_id=user-123"

    async with websockets.connect(uri) as websocket:
        # Join room
        await websocket.send(json.dumps({
            "type": "join_room",
            "room": "simulation-123"
        }))

        # Receive messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

asyncio.run(connect())
```

---

## Publishing Events

### Endpoint

```
POST /api/realtime/publish
```

### Request Body

```json
{
  "event_type": "simulation-progress",
  "data": {
    "simulation_id": "sim-123",
    "progress": 45,
    "status": "running"
  },
  "source": "simulation-engine",
  "priority": 5,
  "tags": ["simulation", "quantum"],
  "metadata": {}
}
```

### Response

```json
{
  "status": "published",
  "event_id": "evt-uuid",
  "timestamp": 1234567890.123
}
```

### Example: curl

```bash
curl -X POST http://localhost:10000/api/realtime/publish \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "simulation-progress",
    "data": {
      "simulation_id": "sim-123",
      "progress": 45
    },
    "priority": 5
  }'
```

---

## Event History

### Endpoint

```
GET /api/realtime/history
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `event_types` | string | Comma-separated event types |
| `tags` | string | Comma-separated tags |
| `limit` | integer | Maximum number of events (default: 50) |

### Response

```json
{
  "events": [
    {
      "event_type": "simulation-progress",
      "data": {...},
      "event_id": "uuid",
      "timestamp": 1234567890
    }
  ],
  "count": 10
}
```

### Example

```bash
curl http://localhost:10000/api/realtime/history?event_types=simulation-progress&limit=20
```

---

## Statistics

### Endpoint

```
GET /api/realtime/stats
```

### Response

```json
{
  "event_bus": {
    "total_events": 1234,
    "subscriber_count": 5,
    "history_size": 1000,
    "persistence_enabled": true
  },
  "sse": {
    "total_connections": 10,
    "active_connections": 8,
    "avg_connection_duration": 123.45
  },
  "websocket": {
    "total_connections": 5,
    "active_connections": 4,
    "total_rooms": 3,
    "avg_connection_duration": 234.56
  }
}
```

---

## React Integration

### Installation

The real-time client is included in the frontend. Import from:

```typescript
import { useSSE, useWebSocket, EventType } from '@/hooks/useRealtime';
```

### useSSE Hook

```tsx
import { useSSE, EventType } from '@/hooks/useRealtime';

function MyComponent() {
  const { events, lastEvent, state, connect, disconnect } = useSSE({
    filter: {
      event_types: [EventType.SIMULATION_PROGRESS],
    },
    autoConnect: true,
    onEvent: (event) => {
      console.log('New event:', event);
    },
  });

  return (
    <div>
      <p>State: {state}</p>
      <p>Events: {events.length}</p>
      {lastEvent && (
        <div>
          Last event: {lastEvent.event_type}
        </div>
      )}
    </div>
  );
}
```

### useWebSocket Hook

```tsx
import { useWebSocket, EventType, ConnectionState } from '@/hooks/useRealtime';

function ChatRoom({ roomId }: { roomId: string }) {
  const {
    state,
    joinRoom,
    leaveRoom,
    broadcastToRoom,
    publishEvent,
  } = useWebSocket({
    userId: 'user-123',
    autoConnect: true,
  });

  useEffect(() => {
    if (state === ConnectionState.CONNECTED) {
      joinRoom(roomId);
    }

    return () => {
      if (state === ConnectionState.CONNECTED) {
        leaveRoom(roomId);
      }
    };
  }, [state, roomId]);

  const sendMessage = (message: string) => {
    broadcastToRoom(roomId, { message });
  };

  return (
    <div>
      <p>Connection: {state}</p>
      <button onClick={() => sendMessage('Hello!')}>
        Send Message
      </button>
    </div>
  );
}
```

### useEventSubscription Hook

Simple event subscription:

```tsx
import { useEventSubscription, EventType } from '@/hooks/useRealtime';

function ProgressTracker() {
  const [progress, setProgress] = useState(0);

  useEventSubscription({
    eventTypes: [EventType.SIMULATION_PROGRESS],
    onEvent: (event) => {
      setProgress(event.data.progress);
    },
  });

  return <ProgressBar value={progress} />;
}
```

### useRealtimeMetrics Hook

Real-time metrics:

```tsx
import { useRealtimeMetrics, EventType } from '@/hooks/useRealtime';

interface SystemMetrics {
  cpu: number;
  memory: number;
  active_simulations: number;
}

function MetricsDashboard() {
  const metrics = useRealtimeMetrics<SystemMetrics>({
    eventType: EventType.METRIC_UPDATE,
    tag: 'system',
  });

  if (!metrics) return <div>Loading...</div>;

  return (
    <div>
      <p>CPU: {metrics.cpu}%</p>
      <p>Memory: {metrics.memory}%</p>
      <p>Active Simulations: {metrics.active_simulations}</p>
    </div>
  );
}
```

---

## Backend Integration

### Publishing Events from Backend

```python
from realtime import publish_event, EventType

# Inside your endpoint or service
async def run_simulation(sim_id: str):
    # Start simulation
    await publish_event(
        event_type=EventType.SIMULATION_STARTED,
        data={"simulation_id": sim_id},
        source="quantum-engine",
        priority=5,
        tags=["simulation", "quantum"]
    )

    # Progress updates
    for progress in range(0, 101, 10):
        await publish_event(
            event_type=EventType.SIMULATION_PROGRESS,
            data={
                "simulation_id": sim_id,
                "progress": progress
            },
            source="quantum-engine",
            tags=["simulation"]
        )
        await asyncio.sleep(1)

    # Complete
    await publish_event(
        event_type=EventType.SIMULATION_COMPLETE,
        data={
            "simulation_id": sim_id,
            "result": {...}
        },
        source="quantum-engine",
        priority=7,
        tags=["simulation", "complete"]
    )
```

### Custom Event Handlers

```python
from realtime import get_event_bus, Event

async def my_event_handler(event: Event):
    print(f"Received event: {event.event_type}")
    # Process event...

# Subscribe to events
event_bus = get_event_bus()
await event_bus.subscribe(
    subscriber_id="my-handler",
    handler=my_event_handler,
    event_filter={
        "event_types": [EventType.SIMULATION_COMPLETE],
        "min_priority": 5
    }
)
```

---

## Performance Considerations

### Connection Limits

- **SSE**: Typically 6 concurrent connections per domain in browsers
- **WebSocket**: No browser limit, but consider server resources
- **Recommendation**: Use SSE for read-only updates, WebSocket for interactive features

### Message Size

- Keep message payloads small (<1KB when possible)
- Use compression for large data
- Consider pagination for large datasets

### Reconnection Strategy

Both SSE and WebSocket clients implement exponential backoff:

1. First reconnect: 3s delay
2. Second reconnect: 4.5s delay
3. Third reconnect: 6.75s delay
4. Maximum delay: 30s

### Heartbeat

- **SSE**: Automatic heartbeat every 30s
- **WebSocket**: Client sends ping every 30s
- **Timeout**: Connections timeout after 5 minutes of inactivity

---

## Security Considerations

### Authentication

For production, add authentication:

```python
# In backend
from fastapi import Header, HTTPException

@app.get("/api/stream")
async def stream_events(
    request: Request,
    authorization: str = Header(None)
):
    # Verify token
    if not verify_token(authorization):
        raise HTTPException(status_code=401)

    # Create SSE stream...
```

```typescript
// In frontend
const sse = new SSEClient({
  baseUrl: 'https://api.qurabia.com',
  // Add auth headers via EventSource polyfill or proxy
});
```

### Rate Limiting

- Implement rate limiting on publish endpoints
- Limit number of connections per IP
- Monitor event bus for abuse

### Input Validation

- Validate all event data before publishing
- Sanitize user-generated content
- Use Pydantic models for validation

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Connection refused | Backend not running | Start backend server |
| 401 Unauthorized | Missing/invalid auth | Provide valid token |
| 429 Too Many Requests | Rate limit exceeded | Slow down requests |
| Connection timeout | Network issues | Check network, retry |

### Error Events

The system publishes error events:

```json
{
  "event_type": "system-error",
  "data": {
    "error": "Connection lost",
    "code": "ERR_CONNECTION",
    "severity": "high"
  }
}
```

---

## Testing

### Testing SSE

```bash
# Test basic connection
curl -N http://localhost:10000/api/stream

# Test with filters
curl -N "http://localhost:10000/api/stream?event_types=simulation-progress&replay_history=true"

# Publish test event
curl -X POST http://localhost:10000/api/realtime/publish \
  -H "Content-Type: application/json" \
  -d '{"event_type": "custom", "data": {"test": true}}'
```

### Testing WebSocket

```javascript
// Browser console
const ws = new WebSocket('ws://localhost:10000/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({type: 'ping'}));
```

### Load Testing

```python
# test_realtime_load.py
import asyncio
import httpx

async def test_sse_load():
    async with httpx.AsyncClient() as client:
        tasks = []
        for i in range(100):
            tasks.append(
                client.get('http://localhost:10000/api/stream', timeout=60)
            )
        await asyncio.gather(*tasks)

asyncio.run(test_sse_load())
```

---

## Troubleshooting

### SSE Not Receiving Events

1. Check connection: `curl -N http://localhost:10000/api/stream`
2. Verify events are being published
3. Check event filters
4. Look for CORS issues in browser console

### WebSocket Connection Drops

1. Check heartbeat/ping messages
2. Verify network stability
3. Check server logs for errors
4. Ensure proper reconnection logic

### High Latency

1. Check network conditions
2. Reduce message payload size
3. Optimize event filtering
4. Consider using WebSocket for critical updates

---

## Examples

### Complete Simulation Monitor

```tsx
import { useSSE, EventType } from '@/hooks/useRealtime';

function SimulationMonitor({ simulationId }: { simulationId: string }) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);

  useSSE({
    filter: {
      event_types: [
        EventType.SIMULATION_STARTED,
        EventType.SIMULATION_PROGRESS,
        EventType.SIMULATION_COMPLETE,
        EventType.SIMULATION_ERROR,
      ],
      tags: [simulationId],
    },
    autoConnect: true,
    onEvent: (event) => {
      switch (event.event_type) {
        case EventType.SIMULATION_STARTED:
          setStatus('running');
          setProgress(0);
          break;
        case EventType.SIMULATION_PROGRESS:
          setProgress(event.data.progress);
          break;
        case EventType.SIMULATION_COMPLETE:
          setStatus('complete');
          setProgress(100);
          break;
        case EventType.SIMULATION_ERROR:
          setStatus('error');
          break;
      }
    },
  });

  return (
    <div>
      <h3>Simulation {simulationId}</h3>
      <p>Status: {status}</p>
      <ProgressBar value={progress} />
    </div>
  );
}
```

### Real-time Notification System

```tsx
import { useSSE, EventType } from '@/hooks/useRealtime';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useSSE({
    filter: {
      event_types: [
        EventType.USER_NOTIFICATION,
        EventType.ETHICS_ALERT,
        EventType.SYSTEM_ERROR,
      ],
    },
    autoConnect: true,
    onEvent: (event) => {
      setNotifications(prev => [
        ...prev,
        {
          id: event.event_id,
          type: event.event_type,
          message: event.data.message,
          timestamp: event.timestamp,
        }
      ]);
    },
  });

  return (
    <div>
      {notifications.map(notif => (
        <Notification key={notif.id} {...notif} />
      ))}
    </div>
  );
}
```

---

## Migration from Polling

If you're currently using polling, here's how to migrate:

### Before (Polling)

```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch('/api/simulation/status');
    const data = await response.json();
    setStatus(data);
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

### After (Real-time)

```typescript
useEventSubscription({
  eventTypes: [EventType.SIMULATION_PROGRESS],
  onEvent: (event) => {
    setStatus(event.data);
  },
});
```

Benefits:
- Instant updates (no polling delay)
- Reduced server load
- Lower bandwidth usage
- Better scalability

---

## Support

For questions or issues:
- Check logs: `structlog` output in backend
- Review browser console for frontend errors
- Check network tab for connection issues
- Verify environment variables are set correctly

---

## Changelog

### Version 1.0.0 (2026-04-16)

- Initial release
- SSE support with filtering and history replay
- WebSocket support with rooms and broadcasting
- React hooks for easy integration
- Event bus with pub/sub pattern
- Automatic reconnection
- Comprehensive documentation
