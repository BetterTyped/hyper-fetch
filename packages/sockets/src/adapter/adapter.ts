import { DateInterval, LoggerType, parseResponse } from "@hyper-fetch/core";

import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import { SocketInstance } from "socket";
import { getAdapter, WSAdapterOptionsType, ListenerCallbackType, WSMessageType } from "adapter";

export class SocketAdapter<SocketType extends SocketInstance> {
  adapter: WebSocket | EventSource | undefined;
  listeners: Map<string, Set<ListenerCallbackType>> = new Map();
  open = false;
  connecting = false;
  forceClosed = false;
  reconnectionAttempts = 0;
  pingTimer: ReturnType<typeof setTimeout> | undefined;
  pongTimer: ReturnType<typeof setTimeout> | undefined;

  init: () => WebSocket | EventSource;
  logger: LoggerType;

  constructor(readonly socket: SocketType) {
    this.init = () => getAdapter(socket);
    this.logger = this.socket.loggerManager.init("Socket Adapter");

    this.socket.appManager.events.onOnline(() => {
      if (this.socket.autoConnect && !this.open) {
        this.logger.info("Auto re-connecting");
        this.connect();
      }
    });

    if (this.socket.autoConnect) {
      this.logger.info("Auto connecting");
      this.connect();
    }
  }

  connect = () => {
    if (!this.socket.appManager.isOnline || this.connecting)
      return this.logger.warning("Cannot initialize adapter.", {
        connecting: this.connecting,
        online: this.socket.appManager.isOnline,
      });
    const { reconnectTimeout = DateInterval.second * 2 } = this.socket.options.adapterOptions || {};

    this.socket.events.emitConnecting();

    // Clean environment
    this.forceClosed = false;
    this.adapter?.close();

    // Start connection
    this.connecting = true;

    // Initialize new adapter instance
    this.adapter = this.init();

    if (!this.adapter) return this.logger.warning("Cannot initialize adapter.");

    // Reconnection timeout
    const timeout = setTimeout(() => {
      this.reconnect();
    }, reconnectTimeout);

    /**
     *  Mount listeners
     */

    this.adapter.onopen = (event) => {
      this.logger.info("Connection open", { event });
      clearTimeout(timeout);
      this.socket.__onOpenCallbacks.forEach((callback) => {
        callback(event, this.socket);
      });
      this.open = true;
      this.connecting = false;
      this.reconnectionAttempts = 0;
      this.socket.events.emitOpen();
      this.heartbeat();
    };

    if (this.adapter && "onclose" in this.adapter) {
      this.adapter.onclose = (event) => {
        this.logger.info("Connection closed", { event });
        this.socket.__onCloseCallbacks.forEach((callback) => {
          callback(event, this.socket);
        });
        this.open = false;
        this.connecting = false;
        this.socket.events.emitClose();
        this.clearTimers();
      };
    }

    this.adapter.onerror = (event) => {
      this.logger.info("Error message", { event });
      this.socket.__onErrorCallbacks.forEach((callback) => {
        callback(event, this.socket);
      });
      this.socket.events.emitError(event);
    };

    this.adapter.onmessage = (event) => {
      this.logger.info("New event message", { event });

      const response = this.socket.__modifyResponse(event);
      const data = parseResponse(response.data);
      const listeners = this.listeners.get(data.name) || [];
      listeners.forEach((callback) => {
        callback(data, event);
      });
      this.socket.events.emitListenerEvent(data.name, data, event);
      this.heartbeat();
    };
  };

  disconnect = () => {
    this.logger.debug("Disconnecting", { reconnectionAttempts: this.reconnectionAttempts });
    this.open = false;
    this.connecting = false;
    this.forceClosed = true;
    this.adapter.close();
    this.clearTimers();
    const isSSE = !(this.adapter && "onclose" in this.adapter);
    if (isSSE) {
      this.socket.__onCloseCallbacks.forEach((callback) => {
        callback({}, this.socket);
      });
      this.socket.events.emitClose();
    }
  };

  reconnect = () => {
    this.disconnect();
    if (this.reconnectionAttempts < this.socket.reconnect) {
      this.reconnectionAttempts += 1;
      this.logger.debug("Reconnecting", { reconnectionAttempts: this.reconnectionAttempts });
      this.connect();
      this.socket.__onReconnectCallbacks.forEach((callback) => {
        callback(this.socket);
      });
      this.socket.events.emitReconnecting(this.reconnectionAttempts);
      return true;
    }
    this.logger.debug("Stopped reconnecting", { reconnectionAttempts: this.reconnectionAttempts });
    this.socket.__onReconnectStopCallbacks.forEach((callback) => {
      callback(this.socket);
    });
    this.socket.events.emitReconnectingStop(this.reconnectionAttempts);
    return false;
  };

  clearTimers = () => {
    clearTimeout(this.pingTimer);
    clearTimeout(this.pongTimer);
  };

  sendEventMessage = (payload: WSMessageType) => {
    if (this.adapter && "send" in this.adapter) {
      this.adapter.send(JSON.stringify({ id: payload.id, name: payload.name, data: payload.data }));
    }
  };

  heartbeat = () => {
    const options = (this.socket.options.adapterOptions || {}) as WSAdapterOptionsType;
    const {
      heartbeat = false,
      pingTimeout = DateInterval.second * 5,
      pongTimeout = DateInterval.second * 5,
      heartbeatMessage = "heartbeat",
    } = options;
    if (this.connecting || !heartbeat) return;
    if (this.adapter && "send" in this.adapter) {
      this.clearTimers();
      this.pingTimer = setTimeout(() => {
        if (this.adapter && "send" in this.adapter) {
          this.logger.debug("[Heartbeat]: Start");
          const id = "heartbeat";
          this.sendEventMessage({ id, data: heartbeatMessage, name: "heartbeat" });
          this.pongTimer = setTimeout(() => {
            this.logger.debug("[Heartbeat]: No response, closing connection");
            this.adapter.close();
          }, pongTimeout);
        }
      }, pingTimeout);
    }
  };

  removeListener = (event: string, callback: ListenerCallbackType) => {
    const listenerGroup = this.listeners.get(event);
    if (listenerGroup && listenerGroup.has(callback)) {
      this.logger.debug("Removed event listener", { event });
      this.socket.events.emitListenerRemoveEvent(event);
      listenerGroup.delete(callback);
      return true;
    }
    return false;
  };

  listen = (listener: Pick<ListenerInstance, "name">, callback: ListenerCallbackType) => {
    const listenerGroup =
      this.listeners.get(listener.name) || this.listeners.set(listener.name, new Set()).get(listener.name);

    listenerGroup.add(callback);
    return () => this.removeListener(listener.name, callback);
  };

  emit = async (
    eventMessageId: string,
    emitter: EmitterInstance,
    ack?: (error: Error | null, response: MessageEvent<any>) => void,
  ) => {
    if (!this.connecting || !this.open) {
      this.logger.error("Cannot emit event when connection is not open");
    }
    if (this.adapter && "send" in this.adapter) {
      if (ack) {
        let timeout;
        const unmount = this.listen({ name: emitter.name }, (response) => {
          if (response.id === eventMessageId) {
            ack(null, response);
            clearTimeout(timeout);
          }
        });
        timeout = setTimeout(() => {
          unmount();
          ack(new Error("Server did not acknowledge the event"), null);
        }, emitter.timeout);
      }

      const emitterInstance = await this.socket.__modifySend(emitter);
      this.sendEventMessage({ id: eventMessageId, data: emitterInstance.data, name: emitterInstance.name });
      this.socket.events.emitEmitterEvent(emitterInstance);
    } else {
      throw new Error("Cannot emit events in SSE mode");
    }
  };
}

// const socketAdapter = () => {
//   const {} = adapterBindingsSocket();
// };
