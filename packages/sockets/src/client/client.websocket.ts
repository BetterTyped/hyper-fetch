import { DateInterval } from "@hyper-fetch/core";

import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import { SocketInstance } from "socket";

export class WebSocketClient<SocketType extends SocketInstance> {
  websocket: WebSocket;
  listeners: Map<string, Set<(event: any) => void>> = new Map();
  open = false;
  connecting = false;
  forceClosed = false;
  reconnectionAttempts = 0;
  connectionTimeout = DateInterval.second;

  constructor(readonly socket: SocketType) {
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
    this.websocket?.close();

    // Start connection
    this.connecting = true;
    const queryParams = this.socket.queryParamsStringify(this.socket.queryParams).substring(1);
    const authParams = this.socket.queryParamsStringify(this.socket.auth).substring(1);
    const connector = queryParams && authParams ? "&" : "";
    const fullUrl = `${this.socket.url}?${authParams}${connector}${queryParams}`;
    this.websocket = new WebSocket(fullUrl);

    // Reconnection timeout
    const timeout = setTimeout(() => {
      this.reconnect();
    }, this.connectionTimeout);

    // Mount event listeners
    this.websocket.onopen = (event) => {
      clearTimeout(timeout);
      this.socket.__onOpenCallbacks.forEach((callback) => {
        callback(event, this.websocket);
      });
      this.open = true;
      this.connecting = false;
      this.reconnectionAttempts = 0;
      this.socket.events.emitOpen();
    };

    this.websocket.onclose = (event) => {
      this.socket.__onCloseCallbacks.forEach((callback) => {
        callback(event, this.websocket);
      });
      this.open = false;
      this.connecting = false;
      this.socket.events.emitClose();
    };

    this.websocket.onerror = (event) => {
      this.socket.__onErrorCallbacks.forEach((callback) => {
        callback(event, this.websocket);
      });
      this.socket.events.emitError(event);
    };

    this.websocket.onmessage = (event) => {
      this.socket.__onMessageCallbacks.forEach((callback) => {
        callback(event, this.websocket);
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
    this.websocket?.close();
  }

  reconnect() {
    this.disconnect();
    if (this.socket.reconnect < this.reconnectionAttempts) {
      this.reconnectionAttempts += 1;
      this.connect();
      this.socket.__onReconnectCallbacks.forEach((callback) => {
        callback(this.websocket);
      });
      this.socket.events.emitReconnecting(this.reconnectionAttempts);
      return true;
    }
    this.socket.__onReconnectStopCallbacks.forEach((callback) => {
      callback(this.websocket);
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
        listenerGroup.delete(callback);
        return true;
      }
      return false;
    };
  }

  emit(emitter: EmitterInstance) {
    const payload = JSON.stringify({
      type: emitter.name,
      data: emitter.data,
    });

    this.websocket.send(payload);
    this.socket.events.emitEmitterEvent(emitter);
  }
}
