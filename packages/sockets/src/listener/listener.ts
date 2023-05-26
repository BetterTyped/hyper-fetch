import { Socket } from "socket";
import { ListenerOptionsType } from "listener";
import {
  ExtractSocketExtraType,
  ListenerCallbackType,
  SocketAdapterType,
  ExtractListenerOptionsType,
  ExtractSocketFormatType,
} from "adapter";
import { ConnectMethodType } from "types";

export class Listener<Response, AdapterType extends SocketAdapterType> {
  readonly name: string;
  options?: ExtractListenerOptionsType<AdapterType>;
  connections: ConnectMethodType<AdapterType, Response>[] = [];

  constructor(readonly socket: Socket<AdapterType>, readonly listenerOptions?: ListenerOptionsType<AdapterType>) {
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

  clone(config?: Partial<ListenerOptionsType<AdapterType>>): Listener<Response, AdapterType> {
    return new Listener<Response, AdapterType>(this.socket, {
      ...this.listenerOptions,
      ...config,
      name: this.name,
    });
  }

  listen(callback: ListenerCallbackType<AdapterType, Response>) {
    const instance = this.clone();

    const action = (response: {
      data: Response;
      event: ExtractSocketFormatType<AdapterType>;
      extra: ExtractSocketExtraType<AdapterType>;
    }) => {
      this.connections.forEach((connection) => connection(response));
      return callback(response);
    };

    this.socket.adapter.listen(instance, action);

    const removeListener = () => {
      this.socket.adapter.removeListener(instance.name, action);
    };

    return [removeListener, action] as const;
  }
}
