/* eslint-disable @typescript-eslint/no-use-before-define */
import { DateInterval } from "@hyper-fetch/core";

import { ListenerInstance } from "listener";
import { ListenerCallbackType, adapterBindingsSocket, getSSEAdapter, SSEAdapterType } from "adapter";

/**
 * -------------------------------------------
 * Websocket
 * -------------------------------------------
 */

export const sseAdapter: SSEAdapterType = (socket) => {
  const {
    listeners,
    removeListener,
    connecting,
    onConnect,
    onReconnect,
    onDisconnect,
    onListen,
    onOpen,
    onError,
    onEvent,
  } = adapterBindingsSocket(socket);

  let pingTimer: ReturnType<typeof setTimeout> | undefined;
  let pongTimer: ReturnType<typeof setTimeout> | undefined;
  let adapter = getSSEAdapter(socket);

  const connect = () => {
    const enabled = onConnect();
    if (!enabled) return;

    const { reconnectTimeout = DateInterval.second * 2 } = socket.options.adapterOptions || {};

    // Clean environment
    adapter?.close();
    adapter = getSSEAdapter(socket);

    // Reconnection timeout
    const timeout = setTimeout(() => {
      reconnect();
    }, reconnectTimeout);

    /**
     *  Mount listeners
     */

    adapter.onopen = (event) => {
      clearTimeout(timeout);
      onOpen(event);
    };

    adapter.onerror = (event) => {
      onError(event);
    };

    adapter.onmessage = (event) => {
      onEvent(event, undefined);
    };
  };

  const disconnect = () => {
    onDisconnect();
    adapter.close();
    clearTimers();
  };

  const reconnect = () => {
    const enabled = onReconnect();
    if (enabled) {
      connect();
    }
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

  return {
    listeners,
    listen,
    removeListener,
    emit,
    connecting,
    connect,
    reconnect,
    disconnect,
  };
};
