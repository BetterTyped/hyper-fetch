import { Socket } from "socket";
import { ListenerOptionsType } from "listener";
import { WebsocketClientType } from "client";
import { ExtractListenerOptionsType } from "types/extract.types";

export class Listener<ResponseType, ClientType extends Record<keyof WebsocketClientType | string, any>> {
  readonly name: string;
  options?: ExtractListenerOptionsType<ClientType>;

  constructor(
    readonly socket: Socket<ClientType>,
    readonly listenerOptions?: ListenerOptionsType<ExtractListenerOptionsType<ClientType>>,
  ) {
    const { name, options } = listenerOptions;
    this.name = name;
    this.options = options || this.socket.client.listenerOptions;
  }

  setOptions(options: ExtractListenerOptionsType<ClientType>) {
    this.options = options;
  }

  clone(): Listener<ResponseType, ClientType> {
    return new Listener<ResponseType, ClientType>(this.socket, {
      ...this.listenerOptions,
      options: { ...((this.listenerOptions.options || this.options) as any) },
    });
  }

  listen(listener: (data: ResponseType) => void) {
    const instance = this.clone();

    this.socket.client.listen(instance, listener);

    const removeListener = () => {
      this.socket.client.removeListener(instance, listener);
    };

    return [removeListener, listener] as const;
  }
}
