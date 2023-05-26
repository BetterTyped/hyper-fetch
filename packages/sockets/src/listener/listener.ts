import { Socket } from "socket";
import { ListenerOptionsType } from "listener";
import { ListenerCallbackType, SocketAdapterType } from "adapter";
import { ExtractListenerOptionsType } from "types/extract.types";
import { ConnectMethodType } from "types/connect.types";

export class Listener<Response, AdapterType extends SocketAdapterType> {
  readonly name: string;
  options?: ExtractListenerOptionsType<AdapterType>;
  connections: ConnectMethodType<AdapterType, Response>[] = [];

  constructor(
    readonly socket: Socket<AdapterType>,
    readonly listenerOptions?: ListenerOptionsType<ExtractListenerOptionsType<AdapterType>>,
  ) {
    const { name, options } = listenerOptions;
    this.name = name;
    this.options = options;
  }

  setOptions(options: ExtractListenerOptionsType<AdapterType>) {
    return this.clone({ options });
  }

  /**
   * Attach global logic to the received events
   * @param callback
   */
  connect(callback: ConnectMethodType<AdapterType, Response>) {
    this.connections.push(callback);
  }

  clone(
    config?: Partial<ListenerOptionsType<ExtractListenerOptionsType<AdapterType>>>,
  ): Listener<Response, AdapterType> {
    return new Listener<Response, AdapterType>(this.socket, {
      ...this.listenerOptions,
      ...config,
      name: this.name,
    });
  }

  listen(callback: ListenerCallbackType<AdapterType, Response>) {
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
