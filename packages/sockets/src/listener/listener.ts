import type { ExtractUrlParams, ParamsType } from "@hyper-fetch/core";
import type { DeliveryStrategyContextType, ListenerDeliveryType, ResolveDeliveredType } from "delivery";
import { assertDelivery, createDeliveryController } from "delivery";
import type { ListenMethodOptionsType, ListenType, ListenerConfigurationType, ListenerOptionsType } from "listener";
import type { SocketInstance } from "socket";
import type {
  ExtractAdapterListenerOptionsType,
  ExtractAdapterListenerQueryParamsType,
  ExtractSocketAdapterType,
} from "types";

import { mapTopicParams } from "../utils/topic.utils";

/**
 * Represents a socket message listener bound to a specific topic. Use it to subscribe to
 * typed messages from WebSocket or Server-Sent Events connections via the socket adapter.
 *
 * `Response` is the raw message type, `Delivered` is what `listen` callbacks receive. They differ only
 * when a `delivery` strategy changes the shape (e.g. `batch` delivers `Response[]`).
 *
 * `Payload` is what the server needs to start the subscription, for example the input of a tRPC or oRPC
 * subscription procedure. Plain topic listeners have none (`undefined`). Listeners of the same topic with
 * different payloads are separate subscriptions - adapters deliver each one only its own messages.
 */
export class Listener<
  Response,
  Payload,
  Topic extends string,
  Socket extends SocketInstance,
  HasPayload extends boolean = false,
  HasParams extends boolean = false,
  Delivered = Response,
> {
  readonly topic: Topic;
  params?: ParamsType = undefined;
  /** Subscription payload set with `setPayload()` or passed to `listen()` */
  payload?: Payload = undefined;
  options?: ExtractAdapterListenerOptionsType<ExtractSocketAdapterType<Socket>> = undefined;
  /** What the listener asks for (filters, limits...), for adapters that support it. Always data, never a callback. */
  queryParams?: ExtractAdapterListenerQueryParamsType<ExtractSocketAdapterType<Socket>> = undefined;
  /**
   * How messages reach `listen` callbacks. Typed with `any` input on purpose - it keeps `Response`
   * covariant so partial `ListenerInstance<{ response: ... }>` constraints keep matching wider listeners.
   */
  delivery?: ListenerDeliveryType<any, ExtractSocketAdapterType<Socket>> = undefined;
  /** Stored with an `any` response for the same covariance reason as `delivery`. */
  readonly listenerOptions: ListenerOptionsType<Topic, ExtractSocketAdapterType<Socket>>;
  /** Topic as it was declared (e.g. `chat/:roomId`) - clones keep it, so params can be set again */
  private topicTemplate: string;

  constructor(
    readonly socket: Socket,
    listenerOptions: ListenerOptionsType<Topic, ExtractSocketAdapterType<Socket>, Response>,
  ) {
    const { topic, options, delivery, params, payload, queryParams } = listenerOptions as typeof listenerOptions & {
      params?: ParamsType;
      payload?: Payload;
    };
    this.topic = topic;
    this.topicTemplate = topic;
    this.options = options;
    // A callback is resolved by the adapter right away, so the listener only ever stores data
    const resolver = socket.adapter.unstable_listenerQueryParamsResolver;
    const resolvedQueryParams =
      typeof queryParams === "function" && resolver
        ? resolver(queryParams as (...args: any[]) => unknown)
        : queryParams;
    this.queryParams = resolvedQueryParams as typeof this.queryParams;
    this.listenerOptions = { ...listenerOptions, queryParams: this.queryParams };
    this.params = params;
    this.payload = payload;
    this.delivery = delivery;
    if (delivery) {
      assertDelivery(delivery);
    }
  }

  /** Set adapter-specific listener options. */
  setOptions(options: ExtractAdapterListenerOptionsType<ExtractSocketAdapterType<Socket>>) {
    return this.clone({ options });
  }

  /**
   * Set what the listener asks for, such as filters or limits. Only for adapters that support listener query params
   * (Firebase); a callback is turned into data by the adapter right away. Returns a clone.
   */
  setQueryParams(queryParams: ExtractAdapterListenerQueryParamsType<ExtractSocketAdapterType<Socket>>) {
    return this.clone({ queryParams });
  }

  /** Set the URL path parameters for the topic (e.g., `:channelId`). */
  setParams(params: ExtractUrlParams<Topic>) {
    return this.clone<HasPayload, true>({ params });
  }

  /**
   * Set the payload the server needs to start the subscription, e.g. the input of a tRPC subscription.
   * Listeners of the same topic with different payloads receive only their own messages.
   */
  setPayload<NewPayload extends Payload>(payload: NewPayload) {
    return this.clone<true, HasParams>({ payload });
  }

  /**
   * Set how messages are delivered to `listen` callbacks - a `latest` / `batch` preset or a custom strategy.
   * Pass `undefined` to restore immediate delivery. Returns a clone; the callback data type follows the strategy.
   */
  setDelivery<NewDelivery extends ListenerDeliveryType<Response, ExtractSocketAdapterType<Socket>> | undefined>(
    delivery: NewDelivery,
  ) {
    return this.clone<HasPayload, HasParams, ResolveDeliveredType<Response, NewDelivery>>({ delivery });
  }

  /** Create a new listener instance with optional configuration overrides. */
  clone<
    NewHasPayload extends true | false = HasPayload,
    NewHasParams extends true | false = HasParams,
    NewDelivered = Delivered,
  >(options?: ListenerConfigurationType<ExtractUrlParams<Topic>, Topic, Socket, Response, Payload>) {
    const params = options?.params || this.params;
    const newInstance = new Listener<Response, Payload, Topic, Socket, NewHasPayload, NewHasParams, NewDelivered>(
      this.socket,
      {
        ...this.listenerOptions,
        ...options,
        params,
        payload: options && "payload" in options ? options.payload : this.payload,
        topic: this.paramsMapper(params),
      } as ListenerOptionsType<Topic, ExtractSocketAdapterType<Socket>, Response>,
    );
    newInstance.topicTemplate = this.topicTemplate;

    return newInstance;
  }

  /**
   * Start listening for messages on the configured topic. Returns a function to unsubscribe.
   * A listener whose payload is required and not set yet takes it as the second argument.
   */
  listen: ListenType<Payload, HasPayload, Socket, Delivered> = (
    callback: Parameters<ListenType<Payload, HasPayload, Socket, Delivered>>[0],
    listenOptions?: ListenMethodOptionsType<Payload>,
  ) => {
    // `listen(callback, { payload })` subscribes with that payload, the instance itself stays unchanged
    if (listenOptions && "payload" in listenOptions) {
      const { payload, ...lifecycleOptions } = listenOptions;
      return this.clone<true, HasParams>({ payload }).listen(callback, lifecycleOptions);
    }

    const { adapter } = this.socket;
    const { topic } = this;

    // With a delivery strategy the adapter receives the controller's `push` instead of the user callback.
    // Each listen() call gets its own controller, so subscriptions never share timers or buffers.
    const controller = this.delivery
      ? createDeliveryController(this.delivery, {
          deliver: callback as DeliveryStrategyContextType<any, any>["deliver"],
        })
      : null;
    // Every listen() call is its own subscription. The callback is registered as it is, so it can be removed with
    // `adapter.removeListener`. A callback already listening to the topic (e.g. with another payload) gets a wrapper,
    // so both registrations exist and each is stopped only by its own unsubscribe.
    const isRegistered = !controller && !!adapter.listeners.get(topic)?.has(callback);
    const adapterCallback: typeof callback =
      controller?.push ?? (isRegistered ? (response: Parameters<typeof callback>[0]) => callback(response) : callback);

    const removeListener = () => {
      controller?.dispose();
      adapter.removeListener({ topic, callback: adapterCallback });
    };

    // Set before the adapter registers the callback, so a subscription confirmed right away still reaches it
    adapter.setListenerLifecycle({
      topic,
      callback: adapterCallback,
      lifecycle: {
        onStart: () => listenOptions?.onStart?.({ topic }),
        onEnd: ({ error }) => {
          // The last messages of a finished stream still arrive before the end
          controller?.flush?.();
          removeListener();
          listenOptions?.onEnd?.({ topic, error });
        },
      },
    });

    adapter.listen(this, adapterCallback);

    if (!adapter.confirmsSubscriptions) {
      listenOptions?.onStart?.({ topic });
    }

    return removeListener;
  };

  private paramsMapper = (params: ParamsType | null | undefined): Topic => {
    return mapTopicParams(this.topicTemplate, params) as Topic;
  };
}
