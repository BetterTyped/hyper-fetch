/* eslint-disable @typescript-eslint/no-use-before-define */
import { ListenerCallbackType, ListenerInstance } from "listener";
import {
  getSocketAdapterBindings,
  getSSEAdapter,
  ServerSentEventsAdapterType,
  SocketData,
  parseMessageEvent,
} from "adapter";

/**
 * -------------------------------------------
 * Websocket
 * -------------------------------------------
 */

export const ServerSentEventsAdapter: ServerSentEventsAdapterType = (socket) => {
  const {
    state,
    listeners,
    removeListener,
    onConnect,
    onReconnect,
    onDisconnect,
    onListen,
    onConnected,
    onError,
    onEvent,
    onDisconnected,
  } = getSocketAdapterBindings(socket);

  let pingTimer: ReturnType<typeof setTimeout> | undefined;
  let pongTimer: ReturnType<typeof setTimeout> | undefined;
  let adapter = getSSEAdapter(socket);
  const autoConnect = socket.options?.autoConnect ?? true;

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
      onConnected();
    };

    adapter.onerror = (event) => {
      onError(new Error(event.type));
    };

    adapter.onmessage = (newEvent: MessageEvent<SocketData>) => {
      const { topic, data, event } = parseMessageEvent(newEvent);

      const eventListeners: Map<ListenerCallbackType<any, any>, VoidFunction> | undefined = listeners.get(topic);

      eventListeners?.forEach((_, action) => {
        action({ data, extra: event });
      });

      onEvent(topic, data, event);
    };
  };

  const disconnect = () => {
    onDisconnect();
    adapter?.close();
    onDisconnected();
    clearTimers();
  };

  const reconnect = () => {
    onReconnect(disconnect, connect);
  };

  const clearTimers = () => {
    clearTimeout(pingTimer);
    clearTimeout(pongTimer);
  };

  const listen = (listener: ListenerInstance, callback: ListenerCallbackType<ServerSentEventsAdapterType, any>) => {
    return onListen(listener, callback);
  };

  const emit = async () => {
    throw new Error("Cannot emit events in SSE mode");
  };

  // Initialize

  if (autoConnect) {
    connect();
  }

  socket.appManager.events.onOnline(() => {
    if (autoConnect && !state.connected) {
      connect();
    }
  });

  return {
    state,
    listeners,
    listen,
    removeListener,
    emit,
    connect,
    reconnect,
    disconnect,
  };
};
