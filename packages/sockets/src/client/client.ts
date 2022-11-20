import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import { SocketInstance } from "socket";

export class WebSocketClient<SocketType extends SocketInstance> {
  websocket: WebSocket;
  listeners: Map<string, Set<(data: any) => void>>;
  open = false;
  connecting = false;

  constructor(readonly socket: SocketType) {}

  connect() {
    if (this.socket.appManager.isNodeJs) return;

    this.connecting = true;
    this.websocket = new WebSocket(this.socket.url);

    this.websocket.onopen = () => {
      this.open = true;
      this.connecting = false;
    };

    this.websocket.onclose = () => {
      this.open = false;
      this.connecting = false;
    };

    this.websocket.onerror = () => {
      this.open = false;
      this.connecting = false;
    };

    this.websocket.onmessage = (event) => {
      const listener = this.listeners.get(event.type);

      if (listener) {
        listener.forEach((callback) => {
          callback(event.data);
        });
      }
    };
  }

  disconnect() {
    this.websocket.close();
  }

  listen(listener: ListenerInstance, callback: (data: any) => void) {
    const listenerGroup =
      this.listeners.get(listener.name) || this.listeners.set(listener.name, new Set()).get(listener.name);

    listenerGroup.add(callback);
    return () => listenerGroup.delete(callback);
  }

  removeListener(name: string, callback: (data: any) => void) {
    return () => {
      const listenerGroup = this.listeners.get(name);
      if (listenerGroup && listenerGroup.has(callback)) {
        listenerGroup.delete(callback);
        return true;
      }
      return false;
    };
  }

  emit(emitter: EmitterInstance) {
    const payload = JSON.stringify({
      data: emitter.data,
      args: emitter.args,
      queryParams: emitter.queryParams,
    });

    this.websocket.send(payload);
  }
}
