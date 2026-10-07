import type { ExtractUrlParams, ParamsType } from "@hyper-fetch/core";
import type { DeliveryStrategyContextType, ListenerDeliveryType, ResolveDeliveredType } from "delivery";
import { assertDelivery, createDeliveryController } from "delivery";
import type { ListenType, ListenerConfigurationType, ListenerOptionsType } from "listener";
import type { SocketInstance } from "socket";
import type { ExtractAdapterListenerOptionsType, ExtractSocketAdapterType } from "types";

/**
 * Represents a socket message listener bound to a specific topic. Use it to subscribe to
 * typed messages from WebSocket or Server-Sent Events connections via the socket adapter.
 *
 * `Response` is the raw message type, `Delivered` is what `listen` callbacks receive. They differ only
 * when a `delivery` strategy changes the shape (e.g. `batch` delivers `Response[]`).
 */
export class Listener<
  Response,
  Topic extends string,
  Socket extends SocketInstance,
  HasParams extends boolean = false,
  Delivered = Response,
> {
  readonly topic: Topic;
  params?: ParamsType = undefined;
  options?: ExtractAdapterListenerOptionsType<ExtractSocketAdapterType<Socket>> = undefined;
  /**
   * How messages reach `listen` callbacks. Typed with `any` input on purpose - it keeps `Response`
   * covariant so partial `ListenerInstance<{ response: ... }>` constraints keep matching wider listeners.
   */
  delivery?: ListenerDeliveryType<any, ExtractSocketAdapterType<Socket>> = undefined;
  /** Stored with an `any` response for the same covariance reason as `delivery`. */
  readonly listenerOptions: ListenerOptionsType<Topic, ExtractSocketAdapterType<Socket>>;

  constructor(
    readonly socket: Socket,
    listenerOptions: ListenerOptionsType<Topic, ExtractSocketAdapterType<Socket>, Response>,
  ) {
    this.listenerOptions = listenerOptions;
    const { topic, options, delivery, params } = listenerOptions as typeof listenerOptions & { params?: ParamsType };
    this.topic = topic;
    this.options = options;
    this.params = params;
    this.delivery = delivery;
    if (delivery) {
      assertDelivery(delivery);
    }
  }

  /** Set adapter-specific listener options. */
  setOptions(options: ExtractAdapterListenerOptionsType<ExtractSocketAdapterType<Socket>>) {
    return this.clone({ options });
  }

  /** Set the URL path parameters for the topic (e.g., `:channelId`). */
  setParams(params: ExtractUrlParams<Topic>) {
    return this.clone<true>({ params });
  }

  /**
   * Set how messages are delivered to `listen` callbacks - a `latest` / `batch` preset or a custom strategy.
   * Pass `undefined` to restore immediate delivery. Returns a clone; the callback data type follows the strategy.
   */
  setDelivery<NewDelivery extends ListenerDeliveryType<Response, ExtractSocketAdapterType<Socket>> | undefined>(
    delivery: NewDelivery,
  ) {
    return this.clone<HasParams, ResolveDeliveredType<Response, NewDelivery>>({ delivery });
  }

  /** Create a new listener instance with optional configuration overrides. */
  clone<NewHasParams extends true | false = HasParams, NewDelivered = Delivered>(
    options?: ListenerConfigurationType<ExtractUrlParams<Topic>, Topic, Socket, Response>,
  ) {
    const newInstance = new Listener<Response, Topic, Socket, NewHasParams, NewDelivered>(this.socket, {
      ...this.listenerOptions,
      ...options,
      topic: this.paramsMapper(options?.params || this.params),
    });

    return newInstance;
  }

  /** Start listening for messages on the configured topic. Returns a function to unsubscribe. */
  listen: ListenType<Listener<Response, Topic, Socket, HasParams, Delivered>, Socket> = (
    callback: Parameters<ListenType<Listener<Response, Topic, Socket, HasParams, Delivered>, Socket>>[0],
  ) => {
    // With a delivery strategy the adapter receives the controller's `push` instead of the user callback.
    // Each listen() call gets its own controller, so subscriptions never share timers or buffers.
    const controller = this.delivery
      ? createDeliveryController(this.delivery, {
          deliver: callback as DeliveryStrategyContextType<any, any>["deliver"],
        })
      : null;
    const adapterCallback = controller ? controller.push : callback;

    this.socket.adapter.listen(this, adapterCallback);

    const removeListener = () => {
      controller?.dispose();
      this.socket.adapter.removeListener({ topic: this.topic, callback: adapterCallback });
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
