/**
 * Real-time Client for SSE and WebSocket Communication
 *
 * Provides a unified interface for real-time communication with the backend
 * using Server-Sent Events (SSE) and WebSocket with automatic reconnection.
 */

// Event types matching backend
export enum EventType {
  SIMULATION_STARTED = "simulation-started",
  SIMULATION_PROGRESS = "simulation-progress",
  SIMULATION_COMPLETE = "simulation-complete",
  SIMULATION_ERROR = "simulation-error",
  ETHICS_DECISION = "ethics-decision",
  ETHICS_ALERT = "ethics-alert",
  SYSTEM_STATUS = "system-status",
  SYSTEM_ERROR = "system-error",
  QUANTUM_COMPUTATION = "quantum-computation",
  QUANTUM_MEASUREMENT = "quantum-measurement",
  USER_NOTIFICATION = "user-notification",
  METRIC_UPDATE = "metric-update",
  CUSTOM = "custom",
}

export interface RealtimeEvent {
  event_type: EventType;
  data: Record<string, any>;
  event_id: string;
  timestamp: number;
  source: string;
  priority: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface EventFilter {
  event_types?: EventType[];
  tags?: string[];
  min_priority?: number;
  sources?: string[];
}

export type EventHandler = (event: RealtimeEvent) => void;
export type ConnectionStateHandler = (state: ConnectionState) => void;
export type ErrorHandler = (error: Error) => void;

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  FAILED = "failed",
}

interface SSEClientConfig {
  baseUrl?: string;
  filter?: EventFilter;
  replayHistory?: boolean;
  historyLimit?: number;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketClientConfig {
  baseUrl?: string;
  userId?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

/**
 * Server-Sent Events (SSE) Client
 *
 * Provides one-way real-time updates from server to client
 * with automatic reconnection and error handling.
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private config: Required<SSEClientConfig>;
  private eventHandlers: Set<EventHandler> = new Set();
  private stateHandlers: Set<ConnectionStateHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;

  constructor(config: SSEClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "",
      filter: config.filter || {},
      replayHistory: config.replayHistory ?? false,
      historyLimit: config.historyLimit ?? 10,
      autoReconnect: config.autoReconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
    };
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
      return;
    }

    this.setState(ConnectionState.CONNECTING);

    try {
      const url = this.buildUrl();
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.setState(ConnectionState.CONNECTED);
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          this.handleError(new Error(`Failed to parse message: ${error}`));
        }
      };

      this.eventSource.onerror = (error) => {
        this.handleError(new Error("SSE connection error"));
        this.eventSource?.close();
        this.eventSource = null;

        if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.setState(ConnectionState.FAILED);
        }
      };
    } catch (error) {
      this.handleError(error as Error);
      this.setState(ConnectionState.FAILED);
    }
  }

  /**
   * Disconnect from SSE endpoint
   */
  disconnect(): void {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setState(ConnectionState.DISCONNECTED);
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to events
   */
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(handler: ConnectionStateHandler): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  /**
   * Subscribe to errors
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  private buildUrl(): string {
    const params = new URLSearchParams();

    if (this.config.filter.event_types?.length) {
      params.append("event_types", this.config.filter.event_types.join(","));
    }

    if (this.config.filter.tags?.length) {
      params.append("tags", this.config.filter.tags.join(","));
    }

    if (this.config.filter.min_priority !== undefined) {
      params.append("min_priority", this.config.filter.min_priority.toString());
    }

    if (this.config.filter.sources?.length) {
      params.append("sources", this.config.filter.sources.join(","));
    }

    if (this.config.replayHistory) {
      params.append("replay_history", "true");
      params.append("history_limit", this.config.historyLimit.toString());
    }

    const baseUrl = this.config.baseUrl || window.location.origin;
    const queryString = params.toString();
    return `${baseUrl}/api/stream${queryString ? `?${queryString}` : ""}`;
  }

  private handleMessage(message: any): void {
    if (message.type === "event" && message.event) {
      const event: RealtimeEvent = message.event;
      this.eventHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }
  }

  private handleError(error: Error): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (e) {
        console.error("Error in error handler:", e);
      }
    });
  }

  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.stateHandlers.forEach((handler) => {
        try {
          handler(state);
        } catch (error) {
          console.error("Error in state handler:", error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.setState(ConnectionState.RECONNECTING);

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }
}

/**
 * WebSocket Client
 *
 * Provides bidirectional real-time communication with the server
 * with automatic reconnection and room support.
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketClientConfig>;
  private eventHandlers: Set<EventHandler> = new Set();
  private stateHandlers: Set<ConnectionStateHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private connectionId: string | null = null;

  constructor(config: WebSocketClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "",
      userId: config.userId || "",
      autoReconnect: config.autoReconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      pingInterval: config.pingInterval ?? 30000,
    };
  }

  /**
   * Connect to WebSocket endpoint
   */
  connect(): void {
    if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
      return;
    }

    this.setState(ConnectionState.CONNECTING);

    try {
      const url = this.buildUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setState(ConnectionState.CONNECTED);
        this.reconnectAttempts = 0;
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          this.handleError(new Error(`Failed to parse message: ${error}`));
        }
      };

      this.ws.onerror = (error) => {
        this.handleError(new Error("WebSocket error"));
      };

      this.ws.onclose = () => {
        this.stopPingInterval();
        this.ws = null;

        if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.setState(ConnectionState.FAILED);
        }
      };
    } catch (error) {
      this.handleError(error as Error);
      this.setState(ConnectionState.FAILED);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState(ConnectionState.DISCONNECTED);
    this.reconnectAttempts = 0;
  }

  /**
   * Send a message to the server
   */
  send(type: string, data: any = {}): void {
    if (this.state !== ConnectionState.CONNECTED || !this.ws) {
      throw new Error("WebSocket is not connected");
    }

    this.ws.send(JSON.stringify({ type, ...data }));
  }

  /**
   * Join a room
   */
  joinRoom(room: string): void {
    this.send("join_room", { room });
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.send("leave_room", { room });
  }

  /**
   * Broadcast message to a room
   */
  broadcastToRoom(room: string, data: any): void {
    this.send("broadcast", { room, data });
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(targetId: string, data: any): void {
    this.send("send", { target: targetId, data });
  }

  /**
   * Publish event to event bus
   */
  publishEvent(eventType: EventType, data: any): void {
    this.send("publish_event", { event_type: eventType, data });
  }

  /**
   * Subscribe to events
   */
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Subscribe to specific message types
   */
  onMessage(type: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
    return () => this.messageHandlers.get(type)?.delete(handler);
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(handler: ConnectionStateHandler): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  /**
   * Subscribe to errors
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get connection ID
   */
  getConnectionId(): string | null {
    return this.connectionId;
  }

  private buildUrl(): string {
    const baseUrl = this.config.baseUrl || window.location.origin;
    const protocol = baseUrl.startsWith("https") ? "wss" : "ws";
    const host = baseUrl.replace(/^https?:\/\//, "");

    let url = `${protocol}://${host}/ws`;

    if (this.config.userId) {
      url += `?user_id=${encodeURIComponent(this.config.userId)}`;
    }

    return url;
  }

  private handleMessage(message: any): void {
    const { type, data } = message;

    // Handle connection confirmation
    if (type === "connected") {
      this.connectionId = message.connection_id;
    }

    // Handle events
    if (type === "event" && message.event) {
      const event: RealtimeEvent = message.event;
      this.eventHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }

    // Handle specific message types
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type)!.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in ${type} handler:`, error);
        }
      });
    }
  }

  private handleError(error: Error): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (e) {
        console.error("Error in error handler:", e);
      }
    });
  }

  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.stateHandlers.forEach((handler) => {
        try {
          handler(state);
        } catch (error) {
          console.error("Error in state handler:", error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.setState(ConnectionState.RECONNECTING);

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = window.setInterval(() => {
      if (this.state === ConnectionState.CONNECTED) {
        try {
          this.send("ping");
        } catch (error) {
          console.error("Failed to send ping:", error);
        }
      }
    }, this.config.pingInterval);
  }

  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
