import { ExtractRouteParams, ParamsType } from "@hyper-fetch/core";

import { Socket } from "socket";
import { ListenType, ListenerOptionsType } from "listener";
import { ExtractSocketExtraType, SocketAdapterType, ExtractListenerOptionsType } from "adapter";
import { ConnectMethodType } from "types";

export class Listener<
  Response,
  Endpoint extends string,
  AdapterType extends SocketAdapterType,
  HasParams extends boolean = false,
> {
  readonly endpoint: Endpoint;
  params?: ParamsType;
  options?: ExtractListenerOptionsType<AdapterType>;
  connections: Set<ConnectMethodType<AdapterType, Response>> = new Set();

  constructor(
    readonly socket: Socket<AdapterType>,
    readonly listenerOptions?: ListenerOptionsType<Endpoint, AdapterType>,
  ) {
    const { endpoint, options } = listenerOptions;
    this.endpoint = endpoint;
    this.options = options;
  }

  setOptions(options: ExtractListenerOptionsType<AdapterType>) {
    return this.clone({ options });
  }

  setParams(params: ExtractRouteParams<Endpoint>) {
    return this.clone<true>({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): Endpoint => {
    let endpoint = this.listenerOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return endpoint as Endpoint;
  };

  /**
   * Attach global logic to the received events
   * @param callback
   */
  onData(callback: ConnectMethodType<AdapterType, Response>) {
    this.connections.add(callback);
    return this;
  }

  clone<Params extends boolean = HasParams>(options?: Partial<ListenerOptionsType<Endpoint, AdapterType>>) {
    const newInstance = new Listener<Response, Endpoint, AdapterType, Params>(this.socket, {
      ...this.listenerOptions,
      ...options,
      endpoint: this.paramsMapper(options?.params || this.params),
    });

    newInstance.connections = this.connections;
    return newInstance;
  }

  listen: ListenType<this> = ({ callback, ...options }) => {
    const instance = this.clone(options);

    const action = (response: { data: Response; extra: ExtractSocketExtraType<AdapterType> }) => {
      this.connections.forEach((connection) => connection(response, () => this.connections.delete(connection)));
      return callback(response as any);
    };

    this.socket.adapter.listen(instance, action);

    const removeListener = () => {
      this.socket.adapter.removeListener(instance.endpoint, action);
    };

    return removeListener;
  };
}
