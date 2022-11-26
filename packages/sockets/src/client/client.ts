import { DateInterval } from "@hyper-fetch/core";

import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import { SocketInstance } from "socket";
import { getClient } from "./client.utils";

export class SocketClient<SocketType extends SocketInstance> {
  client: WebSocket | EventSource | undefined;
  listeners: Map<string, Set<(event: any) => void>> = new Map();
  open = false;
  connecting = false;
  forceClosed = false;
  reconnectionAttempts = 0;
  connectionTimeout = DateInterval.second;
  init: () => WebSocket | EventSource;

  constructor(readonly socket: SocketType) {
    this.init = () => getClient(socket);

    this.socket.appManager.events.onOffline(() => {
      this.disconnect();
    });
    this.socket.appManager.events.onOnline(() => {
      this.connect();
    });

    if (this.socket.autoConnect) {
      this.connect();
    }
  }

  connect() {
    if (this.socket.appManager.isNodeJs) return;

    this.socket.events.emitConnecting();

    // Clean environment
    this.forceClosed = false;
    this.client?.close();

    // Start connection
    this.connecting = true;

    // Initialize new client instance
    this.client = this.init();

    // Reconnection timeout
    const timeout = setTimeout(() => {
      this.reconnect();
    }, this.connectionTimeout);

    // Mount event listeners
    this.client.onopen = (event) => {
      clearTimeout(timeout);
      this.socket.__onOpenCallbacks.forEach((callback) => {
        callback(event, this.client);
      });
      this.open = true;
      this.connecting = false;
      this.reconnectionAttempts = 0;
      this.socket.events.emitOpen();
    };

    if (this.client && "onclose" in this.client) {
      this.client.onclose = (event) => {
        this.socket.__onCloseCallbacks.forEach((callback) => {
          callback(event, this.client);
        });
        this.open = false;
        this.connecting = false;
        this.socket.events.emitClose();
      };
    }

    this.client.onerror = (event) => {
      this.socket.__onErrorCallbacks.forEach((callback) => {
        callback(event, this.client);
      });
      this.socket.events.emitError(event);
    };

    this.client.onmessage = (event) => {
      this.socket.__onMessageCallbacks.forEach((callback) => {
        callback(event, this.client);
      });

      const data = JSON.parse(event.data);
      const listener = this.listeners.get(data?.type);
      if (listener) {
        listener.forEach((callback) => {
          callback(event);
        });
      }
      this.socket.events.emitListenerEvent(data.type, event);
    };
  }

  disconnect() {
    this.open = false;
    this.connecting = false;
    this.forceClosed = true;
    this.client?.close();
    const isSSe = !(this.client && "onclose" in this.client);
    if (isSSe) {
      this.socket.events.emitClose();
    }
  }

  reconnect() {
    this.disconnect();
    if (this.socket.reconnect < this.reconnectionAttempts) {
      this.reconnectionAttempts += 1;
      this.connect();
      this.socket.__onReconnectCallbacks.forEach((callback) => {
        callback(this.client);
      });
      this.socket.events.emitReconnecting(this.reconnectionAttempts);
      return true;
    }
    this.socket.__onReconnectStopCallbacks.forEach((callback) => {
      callback(this.client);
    });
    this.socket.events.emitReconnectingStop(this.reconnectionAttempts);
    return false;
  }

  listen(listener: ListenerInstance, callback: (data: any) => void) {
    const listenerGroup =
      this.listeners.get(listener.name) || this.listeners.set(listener.name, new Set()).get(listener.name);

    listenerGroup.add(callback);
    return () => this.removeListener(listener.name, callback);
  }

  removeListener(event: string, callback: (data: any) => void) {
    return () => {
      const listenerGroup = this.listeners.get(event);
      if (listenerGroup && listenerGroup.has(callback)) {
        this.socket.events.emitListenerRemoveEvent(event);
        listenerGroup.delete(callback);
        return true;
      }
      return false;
    };
  }

  emit(emitter: EmitterInstance) {
    if (this.client && "send" in this.client) {
      const payload = JSON.stringify({
        type: emitter.name,
        data: emitter.data,
      });

      this.client.send(payload);
      this.socket.events.emitEmitterEvent(emitter);
    }
  }
}
