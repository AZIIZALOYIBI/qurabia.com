/**
 * React Hooks for Real-time Communication
 *
 * Provides easy-to-use React hooks for SSE and WebSocket integration
 * with automatic cleanup and TypeScript support.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  SSEClient,
  WebSocketClient,
  EventType,
  RealtimeEvent,
  EventFilter,
  ConnectionState,
  EventHandler,
  ConnectionStateHandler,
  ErrorHandler,
} from "../services/realtime-client";

interface UseSSEOptions {
  baseUrl?: string;
  filter?: EventFilter;
  replayHistory?: boolean;
  historyLimit?: number;
  autoConnect?: boolean;
  onEvent?: EventHandler;
  onStateChange?: ConnectionStateHandler;
  onError?: ErrorHandler;
}

interface UseSSEResult {
  events: RealtimeEvent[];
  lastEvent: RealtimeEvent | null;
  state: ConnectionState;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  clearEvents: () => void;
}

/**
 * Hook for Server-Sent Events (SSE)
 *
 * @example
 * ```tsx
 * const { events, state, connect, disconnect } = useSSE({
 *   filter: {
 *     event_types: [EventType.SIMULATION_PROGRESS],
 *   },
 *   autoConnect: true,
 *   onEvent: (event) => {
 *     console.log('New event:', event);
 *   },
 * });
 * ```
 */
export function useSSE(options: UseSSEOptions = {}): UseSSEResult {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [state, setState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<SSEClient | null>(null);
  const optionsRef = useRef(options);

  // Update options ref
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize client
  useEffect(() => {
    const client = new SSEClient({
      baseUrl: options.baseUrl,
      filter: options.filter,
      replayHistory: options.replayHistory,
      historyLimit: options.historyLimit,
    });

    // Subscribe to events
    const unsubscribeEvent = client.onEvent((event) => {
      setLastEvent(event);
      setEvents((prev) => [...prev, event]);
      optionsRef.current.onEvent?.(event);
    });

    // Subscribe to state changes
    const unsubscribeState = client.onStateChange((newState) => {
      setState(newState);
      optionsRef.current.onStateChange?.(newState);
    });

    // Subscribe to errors
    const unsubscribeError = client.onError((err) => {
      setError(err);
      optionsRef.current.onError?.(err);
    });

    clientRef.current = client;

    // Auto-connect if requested
    if (options.autoConnect) {
      client.connect();
    }

    // Cleanup
    return () => {
      unsubscribeEvent();
      unsubscribeState();
      unsubscribeError();
      client.disconnect();
      clientRef.current = null;
    };
  }, []); // Only run once

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  return {
    events,
    lastEvent,
    state,
    error,
    connect,
    disconnect,
    clearEvents,
  };
}

interface UseWebSocketOptions {
  baseUrl?: string;
  userId?: string;
  autoConnect?: boolean;
  onEvent?: EventHandler;
  onStateChange?: ConnectionStateHandler;
  onError?: ErrorHandler;
}

interface UseWebSocketResult {
  events: RealtimeEvent[];
  lastEvent: RealtimeEvent | null;
  state: ConnectionState;
  error: Error | null;
  connectionId: string | null;
  connect: () => void;
  disconnect: () => void;
  send: (type: string, data?: any) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  broadcastToRoom: (room: string, data: any) => void;
  publishEvent: (eventType: EventType, data: any) => void;
  clearEvents: () => void;
}

/**
 * Hook for WebSocket communication
 *
 * @example
 * ```tsx
 * const { state, joinRoom, publishEvent } = useWebSocket({
 *   userId: 'user-123',
 *   autoConnect: true,
 *   onEvent: (event) => {
 *     console.log('New event:', event);
 *   },
 * });
 *
 * // Join a room
 * useEffect(() => {
 *   if (state === ConnectionState.CONNECTED) {
 *     joinRoom('simulation-123');
 *   }
 * }, [state, joinRoom]);
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketResult {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [state, setState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<Error | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const clientRef = useRef<WebSocketClient | null>(null);
  const optionsRef = useRef(options);

  // Update options ref
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize client
  useEffect(() => {
    const client = new WebSocketClient({
      baseUrl: options.baseUrl,
      userId: options.userId,
    });

    // Subscribe to events
    const unsubscribeEvent = client.onEvent((event) => {
      setLastEvent(event);
      setEvents((prev) => [...prev, event]);
      optionsRef.current.onEvent?.(event);
    });

    // Subscribe to state changes
    const unsubscribeState = client.onStateChange((newState) => {
      setState(newState);
      setConnectionId(client.getConnectionId());
      optionsRef.current.onStateChange?.(newState);
    });

    // Subscribe to errors
    const unsubscribeError = client.onError((err) => {
      setError(err);
      optionsRef.current.onError?.(err);
    });

    clientRef.current = client;

    // Auto-connect if requested
    if (options.autoConnect) {
      client.connect();
    }

    // Cleanup
    return () => {
      unsubscribeEvent();
      unsubscribeState();
      unsubscribeError();
      client.disconnect();
      clientRef.current = null;
    };
  }, []); // Only run once

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  const send = useCallback((type: string, data: any = {}) => {
    try {
      clientRef.current?.send(type, data);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const joinRoom = useCallback((room: string) => {
    try {
      clientRef.current?.joinRoom(room);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const leaveRoom = useCallback((room: string) => {
    try {
      clientRef.current?.leaveRoom(room);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const broadcastToRoom = useCallback((room: string, data: any) => {
    try {
      clientRef.current?.broadcastToRoom(room, data);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const publishEvent = useCallback((eventType: EventType, data: any) => {
    try {
      clientRef.current?.publishEvent(eventType, data);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  return {
    events,
    lastEvent,
    state,
    error,
    connectionId,
    connect,
    disconnect,
    send,
    joinRoom,
    leaveRoom,
    broadcastToRoom,
    publishEvent,
    clearEvents,
  };
}

/**
 * Hook for subscribing to specific event types
 *
 * @example
 * ```tsx
 * useEventSubscription({
 *   eventTypes: [EventType.SIMULATION_PROGRESS],
 *   onEvent: (event) => {
 *     setProgress(event.data.progress);
 *   },
 * });
 * ```
 */
export function useEventSubscription(options: {
  eventTypes: EventType[];
  onEvent: EventHandler;
  autoConnect?: boolean;
}): {
  state: ConnectionState;
  connect: () => void;
  disconnect: () => void;
} {
  const { state, connect, disconnect } = useSSE({
    filter: {
      event_types: options.eventTypes,
    },
    autoConnect: options.autoConnect ?? true,
    onEvent: options.onEvent,
  });

  return { state, connect, disconnect };
}

/**
 * Hook for real-time metrics/statistics updates
 *
 * @example
 * ```tsx
 * const metrics = useRealtimeMetrics<SimulationMetrics>({
 *   eventType: EventType.METRIC_UPDATE,
 *   tag: 'simulation',
 * });
 * ```
 */
export function useRealtimeMetrics<T = any>(options: {
  eventType: EventType;
  tag?: string;
  autoConnect?: boolean;
}): T | null {
  const [metrics, setMetrics] = useState<T | null>(null);

  const filter: EventFilter = {
    event_types: [options.eventType],
  };

  if (options.tag) {
    filter.tags = [options.tag];
  }

  useSSE({
    filter,
    autoConnect: options.autoConnect ?? true,
    onEvent: (event) => {
      setMetrics(event.data as T);
    },
  });

  return metrics;
}

/**
 * Hook for room-based communication
 *
 * @example
 * ```tsx
 * const { messages, sendMessage } = useRoom('simulation-123', {
 *   autoJoin: true,
 * });
 * ```
 */
export function useRoom(
  roomId: string,
  options: {
    autoJoin?: boolean;
    onMessage?: (data: any) => void;
  } = {}
): {
  messages: any[];
  sendMessage: (data: any) => void;
  state: ConnectionState;
} {
  const [messages, setMessages] = useState<any[]>([]);

  const { state, joinRoom, leaveRoom, broadcastToRoom } = useWebSocket({
    autoConnect: true,
  });

  // Join/leave room based on state
  useEffect(() => {
    if (state === ConnectionState.CONNECTED && options.autoJoin) {
      joinRoom(roomId);
    }

    return () => {
      if (state === ConnectionState.CONNECTED) {
        leaveRoom(roomId);
      }
    };
  }, [state, roomId, options.autoJoin, joinRoom, leaveRoom]);

  const sendMessage = useCallback(
    (data: any) => {
      broadcastToRoom(roomId, data);
    },
    [roomId, broadcastToRoom]
  );

  return {
    messages,
    sendMessage,
    state,
  };
}
