import { ExtractRouteParams, ParamsType } from "@hyper-fetch/core";

import { Socket } from "socket";
import { ListenerOptionsType } from "listener";
import { ExtractSocketExtraType, ListenerCallbackType, SocketAdapterType, ExtractListenerOptionsType } from "adapter";
import { ConnectMethodType } from "types";

export class Listener<Response, Name extends string, AdapterType extends SocketAdapterType> {
  readonly name: Name;
  params?: ParamsType;
  options?: ExtractListenerOptionsType<AdapterType>;
  connections: ConnectMethodType<AdapterType, Response>[] = [];

  constructor(readonly socket: Socket<AdapterType>, readonly listenerOptions?: ListenerOptionsType<Name, AdapterType>) {
    const { name, options } = listenerOptions;
    this.name = name;
    this.options = options;
  }

  setOptions(options: ExtractListenerOptionsType<AdapterType>) {
    return this.clone({ options });
  }

  setParams(params: ExtractRouteParams<Name>) {
    return this.clone({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): Name => {
    let endpoint = this.listenerOptions.name as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return endpoint as Name;
  };

  /**
   * Attach global logic to the received events
   * @param callback
   */
  connect(callback: ConnectMethodType<AdapterType, Response>) {
    this.connections.push(callback);
  }

  clone(options?: Partial<ListenerOptionsType<Name, AdapterType>>): Listener<Response, Name, AdapterType> {
    return new Listener<Response, Name, AdapterType>(this.socket, {
      ...this.listenerOptions,
      ...options,
      name: this.paramsMapper(options?.params || this.params),
    });
  }

  listen({ callback }: { callback: ListenerCallbackType<AdapterType, Response> }) {
    const instance = this.clone();

    const action = (response: { data: Response; extra: ExtractSocketExtraType<AdapterType> }) => {
      this.connections.forEach((connection) => connection(response));
      return callback(response);
    };

    this.socket.adapter.listen(instance, action);

    const removeListener = () => {
      this.socket.adapter.removeListener(instance.name, action);
    };

    return removeListener;
  }
}
