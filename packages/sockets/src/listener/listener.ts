import { Socket } from "socket";
import { ListenerOptionsType } from "listener";
import { ListenerCallbackType, WebsocketClientType } from "client";
import { ExtractListenerOptionsType } from "types/extract.types";

export class Listener<ResponseType, ClientType extends WebsocketClientType> {
  readonly name: string;
  options?: ExtractListenerOptionsType<ClientType>;

  constructor(
    readonly socket: Socket<ClientType>,
    readonly listenerOptions?: ListenerOptionsType<ExtractListenerOptionsType<ClientType>>,
  ) {
    const { name, options } = listenerOptions;
    this.name = name;
    this.options = options;
  }

  setOptions(options: ExtractListenerOptionsType<ClientType>) {
    return this.clone({ options });
  }

  clone(
    config?: Partial<ListenerOptionsType<ExtractListenerOptionsType<ClientType>>>,
  ): Listener<ResponseType, ClientType> {
    return new Listener<ResponseType, ClientType>(this.socket, {
      ...this.listenerOptions,
      ...config,
      name: this.name,
    });
  }

  listen(callback: (data: ListenerCallbackType<ResponseType>) => void) {
    const instance = this.clone();

    this.socket.client.listen(instance, callback);

    const removeListener = () => {
      this.socket.client.removeListener(instance.name, callback);
    };

    return [removeListener, callback] as const;
  }
}
