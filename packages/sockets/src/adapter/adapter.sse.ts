/* eslint-disable @typescript-eslint/no-use-before-define */
import { parseResponse } from "@hyper-fetch/core";

import { ListenerCallbackType, ListenerInstance } from "listener";
import { getSocketAdapterBindings, getSSEAdapter, SSEAdapterType, SocketData, parseMessageEvent } from "adapter";

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

    adapter.onmessage = (newEvent: MessageEvent<SocketData>) => {
      const { response, event } = parseMessageEvent(newEvent);

      const eventListeners: Map<ListenerCallbackType<any, any>, VoidFunction> = listeners.get(response.topic) ||
      new Map();

      eventListeners.forEach((_, action) => {
        action({ data: response, extra: event });
      });

      onEvent(response.topic, response, event);
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
