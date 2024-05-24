import { ExtractRouteParams, ParamsType, TypeWithDefaults } from "@hyper-fetch/core";

import { Socket } from "socket";
import { ListenType, ListenerOptionsType } from "listener";
import { SocketAdapterType, SocketAdapterInstance } from "adapter";
import { ExtractSocketExtraType, ExtractListenerOptionsType, ConnectMethodType } from "types";

export class Listener<
  Properties extends {
    response: any;
    endpoint: any;
    adapter: SocketAdapterInstance;
    hasParams?: boolean;
  } = {
    response: undefined;
    endpoint: string;
    adapter: SocketAdapterType;
    hasParams: false;
  },
> {
  readonly endpoint: TypeWithDefaults<Properties, "endpoint", string>;
  params?: ParamsType;
  options?: ExtractListenerOptionsType<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>;
  connections: Set<
    ConnectMethodType<
      TypeWithDefaults<Properties, "adapter", SocketAdapterType>,
      TypeWithDefaults<Properties, "response", undefined>
    >
  > = new Set();

  constructor(
    readonly socket: Socket<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>,
    readonly listenerOptions?: ListenerOptionsType<
      TypeWithDefaults<Properties, "endpoint", string>,
      TypeWithDefaults<Properties, "adapter", SocketAdapterType>
    >,
  ) {
    const { endpoint, options } = listenerOptions;
    this.endpoint = endpoint;
    this.options = options;
  }

  setOptions(options: ExtractListenerOptionsType<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>) {
    return this.clone({ options });
  }

  setParams(params: ExtractRouteParams<TypeWithDefaults<Properties, "endpoint", string>>) {
    return this.clone<true>({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): TypeWithDefaults<Properties, "endpoint", string> => {
    let endpoint = this.listenerOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return endpoint as TypeWithDefaults<Properties, "endpoint", string>;
  };

  /**
   * Attach global logic to the received events
   * @param callback
   */
  onData(
    callback: ConnectMethodType<
      TypeWithDefaults<Properties, "adapter", SocketAdapterType>,
      TypeWithDefaults<Properties, "response", undefined>
    >,
  ) {
    this.connections.add(callback);
    return this;
  }

  clone<Params extends true | false = TypeWithDefaults<Properties, "hasParams", false>>(
    options?: Partial<
      ListenerOptionsType<
        TypeWithDefaults<Properties, "endpoint", string>,
        TypeWithDefaults<Properties, "adapter", SocketAdapterType>
      >
    >,
  ) {
    const newInstance = new Listener<{
      response: TypeWithDefaults<Properties, "response", undefined>;
      endpoint: TypeWithDefaults<Properties, "endpoint", string>;
      adapter: TypeWithDefaults<Properties, "adapter", SocketAdapterType>;
      hasParams: Params;
    }>(this.socket, {
      ...this.listenerOptions,
      ...options,
      endpoint: this.paramsMapper(options?.params || this.params),
    });

    newInstance.connections = this.connections;
    return newInstance;
  }

  listen: ListenType<this, TypeWithDefaults<Properties, "adapter", SocketAdapterType>> = ({ callback, ...options }) => {
    const instance = this.clone(options);

    const action = (response: {
      data: TypeWithDefaults<Properties, "response", undefined>;
      extra: ExtractSocketExtraType<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>;
    }) => {
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
