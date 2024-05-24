/* eslint-disable @typescript-eslint/no-use-before-define */
import { parseResponse } from "@hyper-fetch/core";

import { ListenerCallbackType, ListenerInstance } from "listener";
import { getSocketAdapterBindings, getSSEAdapter, SSEAdapterType, SocketData } from "adapter";

/**
 * -------------------------------------------
 * Websocket
 * -------------------------------------------
 */

export const sseAdapter: SSEAdapterType = (socket) => {
  const {
    open,
    reconnectionAttempts,
    listeners,
    connecting,
    removeListener,
    onConnect,
    onReconnect,
    onDisconnect,
    onListen,
    onOpen,
    onError,
    onEvent,
    onClose,
  } = getSocketAdapterBindings(socket);

  let pingTimer: ReturnType<typeof setTimeout> | undefined;
  let pongTimer: ReturnType<typeof setTimeout> | undefined;
  let adapter = getSSEAdapter(socket);

  const connect = () => {
    const enabled = onConnect();
    if (!enabled) return;

    // Clean environment
    adapter?.close();
    adapter = getSSEAdapter(socket);

    // Make sure we picked good environment
    if (!adapter) return;

    // Reconnection timeout
    const timeout = setTimeout(() => {
      reconnect();
    }, socket.reconnectTime);

    /**
     *  Mount listeners
     */

    adapter.onopen = () => {
      clearTimeout(timeout);
      onOpen();
    };

    adapter.onerror = (event) => {
      onError(new Error(event.type));
    };

    adapter.onmessage = (event: MessageEvent<SocketData>) => {
      const extra: MessageEvent<SocketData> = parseResponse(event);
      const response: MessageEvent<SocketData>["data"] = parseResponse(event.data);
      const data: MessageEvent<SocketData>["data"]["data"] = parseResponse(response.data);

      const eventListeners: Map<ListenerCallbackType<any, any>, VoidFunction> = listeners.get(response.endpoint) ||
      new Map();

      eventListeners.forEach((_, action) => {
        action({ data, extra: response });
      });

      onEvent(response.endpoint, data, extra);
    };
  };

  const disconnect = () => {
    onDisconnect();
    adapter.close();
    onClose();
    clearTimers();
  };

  const reconnect = () => {
    onReconnect(disconnect, connect);
  };

  const clearTimers = () => {
    clearTimeout(pingTimer);
    clearTimeout(pongTimer);
  };

  const listen = (listener: ListenerInstance, callback: ListenerCallbackType<SSEAdapterType, any>) => {
    return onListen(listener, callback);
  };

  const emit = async () => {
    throw new Error("Cannot emit events in SSE mode");
  };

  // Initialize

  if (socket.autoConnect) {
    connect();
  }

  socket.appManager.events.onOnline(() => {
    if (socket.autoConnect && !open) {
      connect();
    }
  });

  return {
    open,
    reconnectionAttempts,
    listeners,
    connecting,
    listen,
    removeListener,
    emit,
    connect,
    reconnect,
    disconnect,
  };
};
