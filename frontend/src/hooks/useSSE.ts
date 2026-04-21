import { useCallback, useEffect, useRef, useState } from 'react';

interface SSEState<T> {
  data: T | null;
  isConnected: boolean;
  error: string | null;
  lastEvent: string | null;
  reconnectCount: number;
}

interface UseSSEOptions<T = unknown> {
  url: string;
  eventName?: string;
  withCredentials?: boolean;
  reconnectInterval?: number;
  maxReconnects?: number;
  onMessage?: (data: T, event: MessageEvent) => void;
  onError?: (error: Event) => void;
}

const DEFAULT_RECONNECT_INTERVAL = 3000;
const DEFAULT_MAX_RECONNECTS = 5;

export function useSSE<T = unknown>(options: UseSSEOptions<T>) {
  const {
    url,
    eventName,
    withCredentials = false,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    maxReconnects = DEFAULT_MAX_RECONNECTS,
    onMessage,
    onError,
  } = options;

  const [state, setState] = useState<SSEState<T>>({
    data: null,
    isConnected: false,
    error: null,
    lastEvent: null,
    reconnectCount: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  onMessageRef.current = onMessage;
  onErrorRef.current = onError;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(url, { withCredentials });
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
        reconnectCount: reconnectCountRef.current,
      }));
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as T;
        setState((prev) => ({
          ...prev,
          data: parsed,
          lastEvent: event.type,
        }));
        onMessageRef.current?.(parsed, event);
      } catch {
        setState((prev) => ({
          ...prev,
          data: event.data as T,
          lastEvent: event.type,
        }));
      }
    };

    if (eventName) {
      es.addEventListener(eventName, handleMessage);
    } else {
      es.onmessage = handleMessage;
    }

    es.onerror = (e) => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: 'Connection lost',
      }));
      onErrorRef.current?.(e);

      es.close();
      eventSourceRef.current = null;

      if (reconnectCountRef.current < maxReconnects) {
        reconnectCountRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    };
  }, [url, eventName, withCredentials, reconnectInterval, maxReconnects]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState((prev) => ({ ...prev, isConnected: false }));
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectCountRef.current = 0;
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    ...state,
    disconnect,
    reconnect,
  };
}

export type { SSEState, UseSSEOptions };
