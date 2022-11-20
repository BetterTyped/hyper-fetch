import { Socket } from "socket";
import { ListenerOptionsType } from "listener";

export class Listener<ResponseType, GlobalErrorType, AdditionalListenerOptions> {
  readonly event: string;
  options?: AdditionalListenerOptions;

  constructor(
    readonly socket: Socket<GlobalErrorType, AdditionalListenerOptions, unknown, unknown>,
    readonly listenerOptions?: ListenerOptionsType<AdditionalListenerOptions>,
  ) {
    const { event, options } = {
      ...this.socket.listenerConfig?.(listenerOptions),
      ...listenerOptions,
    };

    this.event = event;
    this.options = options;
  }

  setOptions(options: AdditionalListenerOptions) {
    this.options = options;
  }

  clone(): Listener<ResponseType, GlobalErrorType, AdditionalListenerOptions> {
    return new Listener<ResponseType, GlobalErrorType, AdditionalListenerOptions>(this.socket, {
      ...this.listenerOptions,
      options: { ...(this.listenerOptions.options || this.options) },
    });
  }

  listen(listener: () => void) {
    const instance = this.clone();

    this.socket.client.listen(instance, listener);

    const removeListener = () => {
      this.socket.client.removeListener(instance, listener);
    };

    return [removeListener, listener];
  }
}
