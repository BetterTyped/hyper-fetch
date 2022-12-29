import { Socket } from "socket";
import { ListenerOptionsType } from "listener";
import { ListenerCallbackType, AdapterType } from "adapter";
import { ExtractListenerOptionsType } from "types/extract.types";

export class Listener<Response, Adapter extends AdapterType> {
  readonly name: string;
  options?: ExtractListenerOptionsType<Adapter>;

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

  clone(config?: Partial<ListenerOptionsType<ExtractListenerOptionsType<Adapter>>>): Listener<Response, Adapter> {
    return new Listener<Response, Adapter>(this.socket, {
      ...this.listenerOptions,
      ...config,
      name: this.name,
    });
  }

  listen(callback: (data: ListenerCallbackType<Response>) => void) {
    const instance = this.clone();

    this.socket.adapter.listen(instance, callback);

    const removeListener = () => {
      this.socket.adapter.removeListener(instance.name, callback);
    };

    return [removeListener, callback] as const;
  }
}
