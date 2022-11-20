import { DateInterval } from "@hyper-fetch/core";

import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import { SocketInstance } from "socket";

export class WebSocketClient<SocketType extends SocketInstance> {
  websocket: WebSocket;
  listeners: Map<string, Set<(event: any) => void>>;
  open = false;
  connecting = false;
  forceClosed = false;
  reconnectionAttempts = 0;
  connectionTimeout = DateInterval.second;

  constructor(readonly socket: SocketType) {
    this.socket.appManager.events.onOffline(() => {
      this.open = false;
    });
  }

  connect() {
    if (this.socket.appManager.isNodeJs) return;

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
    };

    this.websocket.onclose = (event) => {
      this.socket.__onCloseCallbacks.forEach((callback) => {
        callback(event, this.websocket);
      });
      this.open = false;
      this.connecting = false;
    };

    this.websocket.onerror = (event) => {
      this.socket.__onErrorCallbacks.forEach((callback) => {
        callback(event, this.websocket);
      });
    };

    this.websocket.onmessage = (event) => {
      this.socket.__onMessageCallbacks.forEach((callback) => {
        callback(event, this.websocket);
      });

      const listener = this.listeners.get(event.type);

      if (listener) {
        listener.forEach((callback) => {
          callback(event.data);
        });
      }
    };
  }

  disconnect() {
    this.forceClosed = true;
    this.websocket?.close();
  }

  reconnect() {
    this.websocket?.close();
    if (this.socket.reconnect < this.reconnectionAttempts) {
      this.reconnectionAttempts += 1;
      this.connect();
      this.socket.__onReconnectCallbacks.forEach((callback) => {
        callback(this.websocket);
      });
    } else {
      this.socket.__onReconnectStopCallbacks.forEach((callback) => {
        callback(this.websocket);
      });
    }
  }

  listen(listener: ListenerInstance, callback: (data: any) => void) {
    const listenerGroup =
      this.listeners.get(listener.event) || this.listeners.set(listener.event, new Set()).get(listener.event);

    listenerGroup.add(callback);
    return () => listenerGroup.delete(callback);
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
      type: emitter.event,
      data: emitter.data,
    });

    this.websocket.send(payload);
  }
}
