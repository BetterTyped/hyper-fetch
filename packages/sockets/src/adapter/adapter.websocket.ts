/* eslint-disable @typescript-eslint/no-use-before-define */
import { DateInterval, parseResponse } from "@hyper-fetch/core";

import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import {
  ListenerCallbackType,
  WSMessageType,
  adapterBindingsSocket,
  getWebsocketAdapter,
  WebsocketAdapterType,
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
  } = adapterBindingsSocket(socket);

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
      onError(event);
    };

    adapter.onmessage = (event) => {
      const response = parseResponse(event);
      onEvent(response.data.name, response.data, response, undefined);
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
    adapter.send(JSON.stringify({ id: payload.id, name: payload.name, data: payload.data }));
  };

  const onHeartbeat = () => {
    const options = socket.options.adapterOptions || {};
    const {
      heartbeat = false,
      pingTimeout = DateInterval.second * 5,
      pongTimeout = DateInterval.second * 5,
      heartbeatMessage = "heartbeat",
    } = options;
    if (connecting || !heartbeat) return;
    clearTimers();
    pingTimer = setTimeout(() => {
      const id = "heartbeat";
      sendEventMessage({ id, data: heartbeatMessage, name: "heartbeat" });
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
    ack?: (error: Error | null, response: Parameters<ListenerCallbackType<WebsocketAdapterType, any>>[0]) => void,
  ) => {
    const enabled = onEmit(emitter);

    if (!enabled) return;

    if (ack) {
      let timeout;
      const unmount = onListen({ name: emitter.name }, (response) => {
        if (response.data.id === eventMessageId) {
          ack(null, response);
          clearTimeout(timeout);
        }
      });
      timeout = setTimeout(() => {
        unmount();
        ack(new Error("Server did not acknowledge the event"), null);
      }, emitter.timeout);
    }

    const emitterInstance = await socket.__modifySend(emitter);
    sendEventMessage({ id: eventMessageId, data: emitterInstance.data, name: emitterInstance.name });
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
