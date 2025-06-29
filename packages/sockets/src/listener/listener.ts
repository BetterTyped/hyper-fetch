import { ExtractUrlParams, ParamsType } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { ListenType, ListenerConfigurationType, ListenerOptionsType } from "listener";
import { ExtractAdapterListenerOptionsType, ExtractSocketAdapterType } from "types";

export class Listener<
  Response,
  Topic extends string,
  Socket extends SocketInstance,
  HasParams extends boolean = false,
> {
  readonly topic: Topic;
  params?: ParamsType;
  options?: ExtractAdapterListenerOptionsType<ExtractSocketAdapterType<Socket>>;

  constructor(
    readonly socket: Socket,
    readonly listenerOptions: ListenerOptionsType<Topic, ExtractSocketAdapterType<Socket>>,
  ) {
    const { topic, options } = listenerOptions;
    this.topic = topic;
    this.options = options;
  }

  setOptions(options: ExtractAdapterListenerOptionsType<ExtractSocketAdapterType<Socket>>) {
    return this.clone({ options });
  }

  setParams(params: ExtractUrlParams<Topic>) {
    return this.clone<true>({ params });
  }

  clone<NewHasParams extends true | false = HasParams>(
    options?: ListenerConfigurationType<ExtractUrlParams<Topic>, Topic, Socket>,
  ) {
    const newInstance = new Listener<Response, Topic, Socket, NewHasParams>(this.socket, {
      ...this.listenerOptions,
      ...options,
      topic: this.paramsMapper(options?.params || this.params),
    });

    return newInstance;
  }

  listen: ListenType<Listener<Response, Topic, Socket, HasParams>, Socket> = (
    callback: Parameters<ListenType<Listener<Response, Topic, Socket, HasParams>, Socket>>[0],
  ) => {
    this.socket.adapter.listen(this, callback);

    const removeListener = () => {
      this.socket.adapter.removeListener({ topic: this.topic, callback });
    };

    return removeListener;
  };

  private paramsMapper = (params: ParamsType | null | undefined): Topic => {
    let topic = this.listenerOptions.topic as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        topic = topic.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return topic as Topic;
  };
}
