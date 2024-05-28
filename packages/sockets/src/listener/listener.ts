import { ExtractRouteParams, ParamsType, TypeWithDefaults } from "@hyper-fetch/core";

import { Socket } from "socket";
import { ListenType, ListenerOptionsType } from "listener";
import { SocketAdapterType, SocketAdapterInstance } from "adapter";
import { ExtractAdapterExtraType, ExtractAdapterListenerOptionsType } from "types";

export class Listener<
  Properties extends {
    response: any;
    topic: any;
    adapter: SocketAdapterInstance;
    hasParams?: boolean;
  } = {
    response: undefined;
    topic: string;
    adapter: SocketAdapterType;
    hasParams: false;
  },
> {
  readonly topic: TypeWithDefaults<Properties, "topic", string>;
  params?: ParamsType;
  options?: ExtractAdapterListenerOptionsType<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>;

  constructor(
    readonly socket: Socket<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>,
    readonly listenerOptions?: ListenerOptionsType<
      TypeWithDefaults<Properties, "topic", string>,
      TypeWithDefaults<Properties, "adapter", SocketAdapterType>
    >,
  ) {
    const { topic, options } = listenerOptions;
    this.topic = topic;
    this.options = options;
  }

  setOptions(options: ExtractAdapterListenerOptionsType<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>) {
    return this.clone({ options });
  }

  setParams(params: ExtractRouteParams<TypeWithDefaults<Properties, "topic", string>>) {
    return this.clone<true>({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): TypeWithDefaults<Properties, "topic", string> => {
    let topic = this.listenerOptions.topic as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        topic = topic.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return topic as TypeWithDefaults<Properties, "topic", string>;
  };

  clone<Params extends true | false = TypeWithDefaults<Properties, "hasParams", false>>(
    options?: Partial<
      ListenerOptionsType<
        TypeWithDefaults<Properties, "topic", string>,
        TypeWithDefaults<Properties, "adapter", SocketAdapterType>
      >
    >,
  ) {
    const newInstance = new Listener<{
      response: TypeWithDefaults<Properties, "response", undefined>;
      topic: TypeWithDefaults<Properties, "topic", string>;
      adapter: TypeWithDefaults<Properties, "adapter", SocketAdapterType>;
      hasParams: Params;
    }>(this.socket, {
      ...this.listenerOptions,
      ...options,
      topic: this.paramsMapper(options?.params || this.params),
    });

    return newInstance;
  }

  listen: ListenType<this, TypeWithDefaults<Properties, "adapter", SocketAdapterType>> = ({ callback, ...options }) => {
    const instance = this.clone(options);

    const action = (response: {
      data: TypeWithDefaults<Properties, "response", undefined>;
      extra: ExtractAdapterExtraType<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>;
    }) => {
      // TODO: Implement this
      // this.connections.forEach((connection) => connection(response, () => this.connections.delete(connection)));
      return callback(response as any);
    };

    this.socket.adapter.listen(instance, action);

    const removeListener = () => {
      this.socket.adapter.removeListener(instance.topic, action);
    };

    return removeListener;
  };
}
