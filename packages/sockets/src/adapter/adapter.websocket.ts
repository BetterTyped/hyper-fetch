/* eslint-disable @typescript-eslint/no-use-before-define */
import { Time, parseResponse } from "@hyper-fetch/core";

import { EmitterAcknowledgeType, EmitterInstance } from "emitter";
import { ListenerCallbackType, ListenerInstance } from "listener";
import {
  WSMessageType,
  getSocketAdapterBindings,
  getWebsocketAdapter,
  WebsocketAdapterType,
  SocketData,
} from "adapter";

/**
 * -------------------------------------------
 * Websocket
 * -------------------------------------------
 */

export const websocketAdapter: WebsocketAdapterType = (socket) => {
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

    adapter.onmessage = (event: MessageEvent<SocketData>) => {
      const extra = parseResponse(event);
      extra.data = parseResponse(extra.data);

      const eventListeners: Map<ListenerCallbackType<any, any>, VoidFunction> = listeners.get(extra.data.endpoint) ||
      new Map();

      eventListeners.forEach((_, action) => {
        action({ data: extra.data.data, extra });
      });

      onEvent(extra.data.endpoint, extra.data.data, extra);
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

  const sendEventMessage = (payload: WSMessageType) => {
    adapter.send(JSON.stringify({ id: payload.id, endpoint: payload.endpoint, data: payload.data }));
  };

  const onHeartbeat = () => {
    const options = socket.options.adapterOptions || {};
    const {
      heartbeat = false,
      pingTimeout = Time.SEC * 5,
      pongTimeout = Time.SEC * 5,
      heartbeatMessage = "heartbeat",
    } = options;
    if (connecting || !heartbeat) return;
    clearTimers();
    pingTimer = setTimeout(() => {
      const id = "heartbeat";
      sendEventMessage({ id, data: heartbeatMessage, endpoint: "heartbeat" });
      pongTimer = setTimeout(() => {
        adapter.close();
      }, pongTimeout);
    }, pingTimeout);
  };

  const listen = (listener: ListenerInstance, callback: ListenerCallbackType<WebsocketAdapterType, any>) => {
    return onListen(listener, callback);
  };

  const emit = async (
    eventMessageId: string,
    emitter: EmitterInstance,
    ack?: EmitterAcknowledgeType<any, WebsocketAdapterType>,
  ) => {
    const enabled = onEmit(emitter);

    if (!enabled) return;
    if (ack || emitter.connections.size) {
      let timeout;
      const unmount = onListen(emitter, (response) => {
        if (response.extra.data.id === eventMessageId) {
          ack({ ...response, error: null });
          clearTimeout(timeout);
          unmount();
        }
      });
      timeout = setTimeout(() => {
        unmount();
        ack({ error: new Error("Server did not acknowledge the event"), data: null, extra: null });
      }, emitter.timeout);
    }

    const emitterInstance = await socket.__modifySend(emitter);
    sendEventMessage({ id: eventMessageId, data: emitterInstance.data, endpoint: emitterInstance.endpoint });
    socket.events.emitEmitterEvent(emitterInstance);
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
