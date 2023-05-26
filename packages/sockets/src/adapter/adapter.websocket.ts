/* eslint-disable @typescript-eslint/no-use-before-define */
import { DateInterval } from "@hyper-fetch/core";

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
    listeners,
    removeListener,
    connecting,
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

    const { reconnectTimeout = DateInterval.second * 2 } = socket.options.adapterOptions || {};

    // Clean environment
    adapter?.close();
    adapter = getWebsocketAdapter(socket);

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
      onHeartbeat();
    };

    if (adapter && "onclose" in adapter) {
      adapter.onclose = (event) => {
        onClose(event);
        clearTimers();
      };
    }

    adapter.onerror = (event) => {
      onError(event);
    };

    adapter.onmessage = (event) => {
      onEvent(event, undefined);
      onHeartbeat();
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

  const sendEventMessage = (payload: WSMessageType) => {
    if (adapter && "send" in adapter) {
      adapter.send(JSON.stringify({ id: payload.id, name: payload.name, data: payload.data }));
    }
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
    ack?: (error: Error | null, response: MessageEvent<any>) => void,
  ) => {
    const enabled = onEmit(emitter);

    if (!enabled) return;

    if (ack) {
      let timeout;
      const unmount = onListen({ name: emitter.name }, ({ data }) => {
        if (data.id === eventMessageId) {
          ack(null, data);
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
