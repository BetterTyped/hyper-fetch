/* eslint-disable @typescript-eslint/no-use-before-define */
import { Time } from "@hyper-fetch/core";

import { EmitterInstance } from "emitter";
import { ListenerCallbackType, ListenerInstance } from "listener";
import {
  WebsocketEvent,
  getSocketAdapterBindings,
  getWebsocketAdapter,
  WebsocketAdapterType,
  SocketData,
  parseMessageEvent,
} from "adapter";

/**
 * -------------------------------------------
 * Websocket
 * -------------------------------------------
 */

export const WebsocketAdapter: WebsocketAdapterType = (socket) => {
  const {
    open,
    listeners,
    connecting,
    reconnectionAttempts,
    removeListener,
    onConnect,
    onReconnect,
    onDisconnect,
    onListen,
    onEmit,
    onOpen,
    onClose,
    onError,
    onEvent,
  } = getSocketAdapterBindings(socket);

  let pingTimer: ReturnType<typeof setTimeout> | undefined;
  let pongTimer: ReturnType<typeof setTimeout> | undefined;
  let adapter = getWebsocketAdapter(socket);

  const connect = () => {
    const enabled = onConnect();
    if (!enabled) return;

    // Clean environment
    adapter?.close();
    adapter = getWebsocketAdapter(socket);

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
      onHeartbeat();
    };

    adapter.onclose = () => {
      onClose();
      clearTimers();
    };

    adapter.onerror = (event) => {
      onError(new Error(event.type));
    };

    adapter.onmessage = (newEvent: MessageEvent<SocketData>) => {
      const { event, response } = parseMessageEvent(newEvent);

      const eventListeners: Map<ListenerCallbackType<any, any>, VoidFunction> = listeners.get(response.topic);

      eventListeners?.forEach((_, action) => {
        action({ data: response.data, extra: event });
      });

      onEvent(response.topic, response.data, event);
      onHeartbeat();
    };
  };

  const disconnect = () => {
    onDisconnect();
    adapter.close();
    clearTimers();
  };

  const reconnect = () => {
    onReconnect(disconnect, connect);
  };

  const clearTimers = () => {
    clearTimeout(pingTimer);
    clearTimeout(pongTimer);
  };

  const sendEventMessage = (payload: WebsocketEvent) => {
    adapter.send(JSON.stringify({ topic: payload.topic, data: payload.data }));
  };

  const onHeartbeat = () => {
    const {
      heartbeat = false,
      pingTimeout = Time.SEC * 5,
      pongTimeout = Time.SEC * 5,
      heartbeatMessage = "heartbeat",
    } = socket.options.adapterOptions || {};

    if (connecting || !heartbeat) return;
    clearTimers();
    pingTimer = setTimeout(() => {
      sendEventMessage({ data: heartbeatMessage, topic: "heartbeat" });
      pongTimer = setTimeout(() => {
        adapter.close();
      }, pongTimeout);
    }, pingTimeout);
  };

  const listen = (listener: ListenerInstance, callback: ListenerCallbackType<WebsocketAdapterType, any>) => {
    return onListen(listener, callback);
  };

  const emit = async (emitter: EmitterInstance) => {
    const instance = await onEmit(emitter);

    if (!instance) return;

    sendEventMessage({ data: instance.data, topic: instance.topic });
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
    listeners,
    reconnectionAttempts,
    connecting,
    listen,
    removeListener,
    emit,
    connect,
    reconnect,
    disconnect,
  };
};
