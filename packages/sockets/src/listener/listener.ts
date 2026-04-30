import type { ExtractUrlParams, ParamsType } from "@hyper-fetch/core";
import type { ListenType, ListenerConfigurationType, ListenerOptionsType } from "listener";
import type { SocketInstance } from "socket";
import type { ExtractAdapterListenerOptionsType, ExtractSocketAdapterType } from "types";

/**
 * Represents a socket message listener bound to a specific topic. Use it to subscribe to
 * typed messages from WebSocket or Server-Sent Events connections via the socket adapter.
 */
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

  /** Set adapter-specific listener options. */
  setOptions(options: ExtractAdapterListenerOptionsType<ExtractSocketAdapterType<Socket>>) {
    return this.clone({ options });
  }

  /** Set the URL path parameters for the topic (e.g., `:channelId`). */
  setParams(params: ExtractUrlParams<Topic>) {
    return this.clone<true>({ params });
  }

  /** Create a new listener instance with optional configuration overrides. */
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

  /** Start listening for messages on the configured topic. Returns a function to unsubscribe. */
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
        topic = topic.replaceAll(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return topic as Topic;
  };
}
