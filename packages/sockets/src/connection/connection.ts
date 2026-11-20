/* eslint-disable @typescript-eslint/no-use-before-define */
import type { SocketAdapterInstance } from "adapter";

import type {
  ConnectionLossType,
  ConnectionTransportType,
  ReconnectingConnectionOptionsType,
  ReconnectingConnectionType,
} from "./connection.types";
import { getReconnectDelay } from "./connection.utils";

type AttemptStateType = {
  /** Generation of the attempt - events of any other generation are ignored */
  id: number;
  transport: ConnectionTransportType | null;
  ready: boolean;
  /** Resolves the `connect()` promise of the attempt, once */
  settle: ((connected: boolean) => void) | null;
};

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

/**
 * The connection lifecycle shared by the socket adapters. The adapter opens transports, the engine owns everything
 * around them: one attempt at a time, the connection timeout, reconnecting with backoff and jitter, the attempt
 * counter, the network and focus signals of the app manager, and closing on purpose.
 *
 * - An attempt succeeds when the adapter calls `ready()`. The connection timeout covers the whole way there.
 * - A lost connection is retried after `reconnectDelay` (full jitter between `reconnectTime` and `maxReconnectTime`
 *   by default), unless `shouldReconnect` says otherwise. The client's own closes are never retried.
 * - The attempt counter resets only after the connection stayed ready for `minUptime`, so `reconnect` also bounds
 *   connections that drop right after opening.
 * - Offline drops the transport and pauses, without counting attempts. Online connects at once.
 * - Focus skips a pending reconnection delay.
 * - The socket should be connected from the first `connect()` until `disconnect()` - `autoConnect` only decides
 *   the first connection, recovery never depends on it.
 *
 * Events of a replaced, timed out or closed transport are ignored, so they never change the socket.
 */
export const createReconnectingConnection = <Adapter extends SocketAdapterInstance>({
  bindings,
  open,
  autoConnect = true,
  shouldReconnect: protocolShouldReconnect,
}: ReconnectingConnectionOptionsType<Adapter>): ReconnectingConnectionType => {
  const {
    socket,
    adapter,
    onConnect,
    onConnectFailed,
    onConnected,
    onDisconnect,
    onDisconnected,
    onReconnect,
    onReconnectFailed,
    onError,
  } = bindings;

  let generation = 0;
  let current: AttemptStateType | null = null;
  // Concurrent `connect()` calls join the attempt in progress
  let pendingConnection: Promise<boolean> | null = null;
  // Set from the first `connect()` until `disconnect()` - the socket should be connected
  let wanted = false;
  // When the current outage began - `elapsed` of the retry policy
  let outageStart: number | null = null;

  let connectionTimer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let uptimeTimer: ReturnType<typeof setTimeout> | undefined;

  const clearRetry = () => {
    clearTimeout(retryTimer);
    retryTimer = undefined;
  };

  const isActive = () => adapter.connected || adapter.connecting;

  /** Detaches the current transport - it can't reach the socket anymore - and closes it */
  const detach = (): Promise<unknown> => {
    const attempt = current;
    current = null;
    clearTimeout(connectionTimer);
    clearTimeout(uptimeTimer);
    if (!attempt) {
      return Promise.resolve();
    }
    attempt.settle?.(false);
    if (!attempt.transport) {
      return Promise.resolve();
    }
    try {
      // A closing transport may fail in some runtimes - it is detached already, so the failure changes nothing
      return Promise.resolve(attempt.transport.close()).catch(() => null);
    } catch {
      return Promise.resolve();
    }
  };

  const shouldReconnect = (loss: ConnectionLossType) => {
    const decide = socket.shouldReconnect ?? protocolShouldReconnect;
    if (!decide) {
      return true;
    }
    try {
      return decide(loss);
    } catch (error) {
      onError({ error: toError(error) });
      return false;
    }
  };

  /** Plans the next attempt of an outage. Offline, the online event takes over. */
  const scheduleRetry = (loss: ConnectionLossType) => {
    clearRetry();
    if (!wanted || !socket.appManager.isOnline) {
      return;
    }

    outageStart ??= Date.now();
    const attempt = adapter.reconnectionAttempts;
    let delay: number | null;
    try {
      delay = socket.reconnectDelay
        ? socket.reconnectDelay({ attempt, elapsed: Date.now() - outageStart, reason: loss })
        : getReconnectDelay({ attempt, min: socket.reconnectTime, max: socket.maxReconnectTime });
    } catch (error) {
      onError({ error: toError(error) });
      delay = null;
    }

    if (delay === null) {
      onReconnectFailed();
      return;
    }

    // A broken policy or random source must never stop reconnecting - NaN and Infinity fall back to the minimum
    const safeDelay = Number.isFinite(delay) ? Math.max(0, delay) : socket.reconnectTime;
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      reconnect({ manual: false });
    }, safeDelay);
  };

  const handleLoss = (id: number, loss: ConnectionLossType) => {
    if (current?.id !== id) {
      return;
    }
    const wasActive = isActive();
    detach();
    if (wasActive) {
      onDisconnected();
    }

    if (!shouldReconnect(loss)) {
      wanted = false;
      adapter.setForceClosed(true);
      return;
    }
    scheduleRetry(loss);
  };

  const armConnectionTimeout = (id: number) => {
    clearTimeout(connectionTimer);
    connectionTimer = setTimeout(() => {
      const error = new Error(`Connection timeout - no connection within ${socket.connectionTimeout}ms`);
      const isCurrent = current?.id === id;
      // Like a transport loss: the socket is reported as disconnected first, then the error that explains why
      handleLoss(id, { error });
      if (isCurrent) {
        onError({ error });
      }
    }, socket.connectionTimeout);
  };

  const handleReady = (id: number) => {
    const attempt = current;
    if (attempt?.id !== id || attempt.ready) {
      return;
    }
    attempt.ready = true;
    clearTimeout(connectionTimer);
    onConnected({ resetAttempts: false });

    // Only a connection that stays up resets the counter - one that drops right away keeps backing off
    clearTimeout(uptimeTimer);
    uptimeTimer = setTimeout(() => {
      adapter.setReconnectionAttempts(0);
      outageStart = null;
    }, socket.minUptime);

    attempt.settle?.(true);
  };

  const handleInterrupted = (id: number) => {
    const attempt = current;
    if (attempt?.id !== id || !attempt.ready) {
      return;
    }
    attempt.ready = false;
    clearTimeout(uptimeTimer);
    onDisconnected();
    adapter.setConnecting(true);
    socket.events.emitConnecting({ connecting: true });
    armConnectionTimeout(id);
  };

  const openAttempt = async (): Promise<boolean> => {
    const connection = await onConnect();
    if (!connection) {
      return adapter.connected;
    }

    clearRetry();
    detach();

    generation += 1;
    const id = generation;
    let resolveAttempt: (connected: boolean) => void = () => null;
    const result = new Promise<boolean>((resolve) => {
      resolveAttempt = resolve;
    });
    const attempt: AttemptStateType = {
      id,
      transport: null,
      ready: false,
      settle: (connected) => {
        attempt.settle = null;
        resolveAttempt(connected);
      },
    };
    current = attempt;

    let transport: ConnectionTransportType | null;
    try {
      transport = open({
        connection,
        ready: () => handleReady(id),
        lost: (loss = {}) => handleLoss(id, loss),
        interrupted: () => handleInterrupted(id),
        isCurrent: () => current?.id === id,
      });
    } catch (error) {
      onConnectFailed({ error: toError(error) });
      transport = null;
    }

    if (!transport) {
      // The adapter reported why - there is nothing to retry with
      if (current?.id === id) {
        current = null;
        if (adapter.connecting) {
          adapter.setConnecting(false);
        }
      }
      attempt.settle?.(false);
      return result;
    }

    attempt.transport = transport;
    if (current?.id !== id) {
      // `open` reported the loss synchronously - the transport is detached already
      try {
        await transport.close();
      } catch {
        // Detached already
      }
      return result;
    }

    if (!attempt.ready) {
      armConnectionTimeout(id);
    }
    return result;
  };

  const connect = (): Promise<boolean> => {
    wanted = true;
    // Another attempt is already on its way - resolve together with it
    if (adapter.connecting && pendingConnection) {
      return pendingConnection;
    }
    // A call by hand does not wait for the reconnection delay
    clearRetry();

    const connection = openAttempt();
    pendingConnection = connection;
    const release = () => {
      if (pendingConnection === connection) {
        pendingConnection = null;
      }
    };
    connection.then(release, release);
    return connection;
  };

  /**
   * Closes the transport and resets the connection state. The closed transport is detached first - whatever it
   * reports later does not reach the socket, so closing on purpose is never treated as a lost connection.
   */
  const closeConnection = ({ manual }: { manual: boolean }): Promise<boolean> => {
    clearRetry();
    const wasActive = isActive();
    const closing = detach();
    onDisconnect();
    if (!manual) {
      // Closing the previous transport is a part of reconnecting - only `disconnect()` keeps the socket closed
      adapter.setForceClosed(false);
    }
    if (wasActive) {
      onDisconnected();
    }
    return closing.then(() => true);
  };

  const disconnect = () => {
    wanted = false;
    outageStart = null;
    return closeConnection({ manual: true });
  };

  /** One attempt of the outage, or a fresh start by hand that is never refused by the attempt limit */
  const reconnect = async ({ manual }: { manual: boolean }) => {
    // Reconnecting is a request to be connected, also after a manual disconnect
    wanted = true;
    clearRetry();
    adapter.setForceClosed(false);
    if (manual) {
      outageStart = null;
    }

    await onReconnect({
      manual,
      disconnect: () => closeConnection({ manual: false }),
      connect: async () => {
        // `disconnect()` called while the previous transport was closing wins over the reconnection
        if (adapter.forceClosed) {
          adapter.setReconnectionAttempts(0);
          return false;
        }
        return connect();
      },
    });
  };

  const unmountOffline = socket.appManager.events.onOffline(() => {
    clearRetry();
    if (!current) {
      return;
    }
    // A connection on a network that is gone can hang for minutes before the transport notices
    const wasActive = isActive();
    detach();
    if (wasActive) {
      onDisconnected();
    }
  });

  const unmountOnline = socket.appManager.events.onOnline(() => {
    if (wanted && !adapter.forceClosed && !isActive()) {
      connect();
    }
  });

  const unmountFocus = socket.appManager.events.onFocus(() => {
    // Back in front of the user - don't make them wait for the rest of the delay
    if (retryTimer && wanted && !isActive()) {
      clearRetry();
      reconnect({ manual: false });
    }
  });

  if (autoConnect) {
    connect();
  }

  return {
    connect,
    reconnect: () => reconnect({ manual: true }),
    disconnect,
    dispose: () => {
      unmountOffline();
      unmountOnline();
      unmountFocus();
      clearRetry();
      clearTimeout(connectionTimer);
      clearTimeout(uptimeTimer);
    },
  };
};
