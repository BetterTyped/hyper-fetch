import { Socket } from "socket";
import { ListenerOptionsType } from "listener";
import { ListenerCallbackType, SocketAdapterType } from "adapter";
import { ExtractListenerOptionsType } from "types/extract.types";
import { ConnectMethodType } from "types/connect.types";

export class Listener<Response, Adapter extends SocketAdapterType> {
  readonly name: string;
  options?: ExtractListenerOptionsType<Adapter>;
  connections: ConnectMethodType<Response>[] = [];

  constructor(
    readonly socket: Socket<Adapter>,
    readonly listenerOptions?: ListenerOptionsType<ExtractListenerOptionsType<Adapter>>,
  ) {
    const { name, options } = listenerOptions;
    this.name = name;
    this.options = options;
  }

  setOptions(options: ExtractListenerOptionsType<Adapter>) {
    return this.clone({ options });
  }

  /**
   * Attach global logic to the received events
   * @param callback
   */
  connect(callback: ConnectMethodType<Response>) {
    this.connections.push(callback);
  }

  clone(config?: Partial<ListenerOptionsType<ExtractListenerOptionsType<Adapter>>>): Listener<Response, Adapter> {
    return new Listener<Response, Adapter>(this.socket, {
      ...this.listenerOptions,
      ...config,
      name: this.name,
    });
  }

  listen(callback: ListenerCallbackType<Response>) {
    const instance = this.clone();

    this.socket.adapter.listen(instance, (...args) => {
      this.connections.forEach((connection) => connection(...args));
      return callback(...args);
    });

    const removeListener = () => {
      this.socket.adapter.removeListener(instance.name, callback);
    };

    return [removeListener, callback] as const;
  }
}
