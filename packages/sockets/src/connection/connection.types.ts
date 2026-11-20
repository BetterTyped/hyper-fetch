import type { SocketAdapterInstance } from "adapter";
import type { getAdapterBindings } from "adapter/adapter.bindings";
import type { SocketConnectionType } from "socket";

/** Why a connection or a connection attempt ended. Every field is optional - a transport reports what it knows. */
export type ConnectionLossType = {
  /** Close code of the transport, e.g. a WebSocket close code */
  code?: number;
  /** Close reason sent with the code */
  reason?: string;
  /** Error that ended the connection - a transport error, the connection timeout or a heartbeat timeout */
  error?: Error;
};

/**
 * Decides the delay in ms before the next connection attempt, or stops reconnecting with `null`.
 * `attempt` counts from 0 for the first retry of an outage, `elapsed` is the time in ms since the outage began.
 */
export type ReconnectDelayType = (data: {
  attempt: number;
  elapsed: number;
  reason: ConnectionLossType;
}) => number | null;

/** Decides whether a lost connection is retried. Closes started by the client never reach it. */
export type ShouldReconnectType = (loss: ConnectionLossType) => boolean;

/** Handle of one connection attempt, given to the adapter's `open` */
export type ConnectionAttemptType<Adapter extends SocketAdapterInstance> = {
  /** Connection details after the `onConnect` interceptors */
  connection: SocketConnectionType<Adapter>;
  /**
   * The connection can carry messages - call it on open, or after the handshake of protocols that have one.
   * Calling it again after `interrupted()` reports that the transport recovered on its own.
   */
  ready: () => void;
  /** The transport is gone. The engine closes it and decides about the next attempt. */
  lost: (loss?: ConnectionLossType) => void;
  /**
   * The connection dropped and the transport reconnects by itself (e.g. `EventSource`). The socket is reported as
   * disconnected and connecting - `ready()` brings it back, otherwise the connection timeout ends the attempt.
   */
  interrupted: () => void;
  /** `false` once the attempt was replaced, timed out or closed - its transport must not change the socket anymore */
  isCurrent: () => boolean;
};

/** A transport opened by the adapter */
export type ConnectionTransportType = {
  /** Closes the transport. The engine calls it once, after it detached the transport, and waits for the promise. */
  close: () => void | Promise<unknown>;
};

export type ReconnectingConnectionOptionsType<Adapter extends SocketAdapterInstance> = {
  /** Bindings of the adapter's connector */
  bindings: ReturnType<typeof getAdapterBindings<Adapter>>;
  /**
   * Opens the transport of an attempt. Return `null` when it can't be created - after reporting it with
   * `onConnectFailed` - and no retry follows.
   */
  open: (attempt: ConnectionAttemptType<Adapter>) => ConnectionTransportType | null;
  /** Connect when the engine is created. @default true */
  autoConnect?: boolean;
  /** The protocol's default for retried closes, e.g. its fatal close codes. The socket's `shouldReconnect` wins. */
  shouldReconnect?: ShouldReconnectType;
};

export type ReconnectingConnectionType = {
  /** Connects now - skipping a pending reconnection delay. Resolves with `true` once the connection is ready. */
  connect: () => Promise<boolean>;
  /** Replaces the connection with a new one, also after `disconnect()`. Counts as a reconnection attempt. */
  reconnect: () => Promise<void>;
  /** Closes the connection on purpose. It stays closed until `connect()` or `reconnect()` is called. */
  disconnect: () => Promise<boolean>;
  /** Removes the app manager listeners and the timers. The connection itself is closed with `disconnect()`. */
  dispose: () => void;
};
