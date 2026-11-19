/* eslint-disable @typescript-eslint/no-shadow */
import type { ExtractUrlParams, EmptyTypes, TypeWithDefaults } from "@hyper-fetch/core";
import type { SocketAdapterInstance } from "adapter";
import type { ListenerDeliveryType } from "delivery";
import type { Listener } from "listener";
import type { Socket, SocketInstance } from "socket";
import type {
  ExtractListenerHasParamsType,
  ExtractListenerTopicType,
  ExtractListenerResponseType,
  ExtractAdapterListenerOptionsType,
  ExtractAdapterExtraType,
  ExtractListenerSocketType,
  ExtractSocketAdapterType,
  ExtractListenerDeliveredType,
  ExtractListenerPayloadType,
  ExtractListenerHasPayloadType,
} from "types";

export type ListenerInstanceProperties = {
  response?: any;
  /** What the server needs to start the subscription, e.g. the input of a tRPC subscription */
  payload?: any;
  topic?: string;
  socket?: SocketInstance;
  hasPayload?: boolean;
  hasParams?: boolean;
  /**
   * Type received by `listen` callbacks. Differs from `response` only when a `delivery` strategy
   * changes the shape (e.g. `batch` delivers `response[]`).
   */
  delivered?: any;
};

/**
 * The **constraint** form of a Listener type. Mindset: "any Listener that matches this partial shape".
 *
 * Use `ListenerInstance` when you are writing a **reusable abstraction** that accepts listeners
 * from the outside - generic helpers (`<T extends ListenerInstance>`), reusable UI components /
 * hooks, `sdk.$configure({...})` callbacks, mocking utilities, return types, etc.
 *
 * Unspecified generic parameters default to `any` **on purpose**: an omitted field means
 * "I do not care about that field, the caller picks anything". This is exactly what you want
 * for a constraint - any concrete `Listener` satisfies it. Partial constraints work too:
 * `ListenerInstance<{ response: { text: string } }>` accepts every listener whose response has a
 * `text` field, regardless of topic, params, etc.
 *
 * For describing a **single topic** inside a socket SDK schema, use {@link ListenerModel} instead.
 * `ListenerModel` uses safe non-`any` defaults (`unknown`, `string`, `false`) so omitted fields
 * stay strict instead of silently collapsing to `any`.
 *
 * @see {@link ListenerModel} - definition counterpart for SDK schema modeling.
 */
export type ListenerInstance<ListenerProperties extends ListenerInstanceProperties = {}> = Listener<
  TypeWithDefaults<ListenerProperties, "response", any>,
  TypeWithDefaults<ListenerProperties, "payload", any>,
  TypeWithDefaults<ListenerProperties, "topic", any>,
  TypeWithDefaults<ListenerProperties, "socket", SocketInstance>,
  TypeWithDefaults<ListenerProperties, "hasPayload", any>,
  TypeWithDefaults<ListenerProperties, "hasParams", any>,
  TypeWithDefaults<ListenerProperties, "delivered", any>
>;

/**
 * The **definition** form of a Listener type. Mindset: "**this** specific topic".
 *
 * Use `ListenerModel` when you are **defining** a listener inside a socket SDK schema. Unlike
 * {@link ListenerInstance}, every unspecified field stays strict instead of falling back to
 * `any` - because in a definition, an omitted field means "**this topic carries no params**",
 * not "anything goes". The type system will reject mismatches at the call site instead of
 * silently erasing them.
 *
 * The `socket` field is also injected automatically by `createSocketSdk(socket)` at the SDK
 * boundary, so you never need to repeat it inside schema declarations.
 *
 * ### Defaults for omitted fields
 *
 * | Field       | Default          | Why                                                                |
 * | ----------- | ---------------- | ------------------------------------------------------------------ |
 * | `response`  | `unknown`        | Forces narrowing in consumer code; never silently widened.         |
 * | `payload`   | `undefined`      | "The subscription takes no payload." Set it for RPC subscriptions. |
 * | `topic`     | `string`         | Allows literal narrowing without erasure. Pass a string literal.   |
 * | `socket`    | `SocketInstance` | Injected by `createSocketSdk(socket)`; do not set this manually.   |
 * | `hasPayload`| `false`          | "Caller must call `.setPayload()`" when the payload is required.   |
 * | `hasParams` | `false`          | "Caller must call `.setParams()`." Override only when bound.       |
 * | `delivered` | same as `response` | Set only when a `delivery` strategy changes the callback shape.  |
 *
 * @example
 * ```ts
 * // Schema describes shape only - socket is injected by createSocketSdk(socket).
 * type ChatSchema = {
 *   chat: {
 *     messages: {
 *       $listener: ListenerModel<{
 *         response: { text: string; user: string };
 *         topic: "chat/messages";
 *       }>;
 *     };
 *     $roomId: {
 *       $listener: ListenerModel<{
 *         response: { text: string; user: string };
 *         topic: "chat/:roomId";
 *       }>;
 *     };
 *   };
 * };
 * ```
 *
 * @see {@link ListenerInstance} - constraint counterpart for accepting any Listener.
 */
export type ListenerModel<ListenerProperties extends ListenerInstanceProperties = {}> = Listener<
  TypeWithDefaults<ListenerProperties, "response", unknown>,
  TypeWithDefaults<ListenerProperties, "payload", undefined>,
  TypeWithDefaults<ListenerProperties, "topic", string>,
  TypeWithDefaults<ListenerProperties, "socket", SocketInstance>,
  TypeWithDefaults<ListenerProperties, "hasPayload", false>,
  TypeWithDefaults<ListenerProperties, "hasParams", false>,
  TypeWithDefaults<ListenerProperties, "delivered", TypeWithDefaults<ListenerProperties, "response", unknown>>
>;

/**
 * The listener as adapters receive it in `listen()` - the data that describes the subscription.
 * Adapters read it, they never call the listener methods.
 */
export type ListenerOfAdapter<A extends SocketAdapterInstance> = Pick<
  Listener<any, any, any, Socket<A>, any, any, any>,
  "topic" | "params" | "payload" | "options" | "delivery" | "socket" | "listenerOptions"
>;

/** Configuration options for creating a Listener instance. */
export type ListenerOptionsType<
  Topic extends string,
  AdapterType extends SocketAdapterInstance,
  Response = any,
  Delivery extends ListenerDeliveryType<Response, AdapterType> | undefined =
    | ListenerDeliveryType<Response, AdapterType>
    | undefined,
> = {
  /** The topic/channel name to listen on */
  topic: Topic;
  /** Adapter-specific listener options */
  options?: ExtractAdapterListenerOptionsType<AdapterType>;
  /**
   * Controls how incoming messages reach `listen` callbacks. Omit it for immediate delivery of every message.
   *
   * - `{ strategy: "latest", interval }` - sampling: deliver the first message immediately, then at most one
   *   (the newest) per `interval` ms. Intermediate messages are dropped. For state-like data such as prices.
   * - `{ strategy: "batch", interval, maxSize? }` - deliver every message collected during `interval` ms as one
   *   array. Nothing is dropped and callbacks receive `Response[]`. For event-like data such as trades.
   * - a function created with `createDeliveryStrategy()` - full control over buffering and timing.
   *
   * Pending messages are dropped on unsubscribe. See the "Throttling & Batching" guide for details.
   */
  delivery?: Delivery;
};

export type ListenerConfigurationType<
  Params,
  Topic extends string,
  Socket extends SocketInstance,
  Response = any,
  Payload = any,
> = {
  params?: Params;
  payload?: Payload;
} & Partial<ListenerOptionsType<Topic, ExtractSocketAdapterType<Socket>, Response>>;

export type ListenerParamsOptionsType<Listener extends ListenerInstance> =
  ExtractListenerHasParamsType<Listener> extends false
    ? {
        params: ExtractUrlParams<ExtractListenerTopicType<Listener>>;
      }
    : {
        params?: never;
      };

/**
 * `true` when the subscription needs a payload that was not set with `setPayload()` yet.
 * Erased listeners (`any` payload) never require it, so they stay assignable to every listener constraint.
 */
/** `true` when a payload of this type is required and was not set yet. An `any` payload never requires it. */
export type PayloadIsRequired<Payload, HasPayload> = HasPayload extends false
  ? 0 extends 1 & Payload
    ? false
    : [Payload] extends [EmptyTypes | void]
      ? false
      : undefined extends Payload
        ? false
        : true
  : false;

/**
 * `true` when the subscription needs a payload that was not set with `setPayload()` yet.
 * Erased listeners (`any` payload) never require it, so they stay assignable to every listener constraint.
 */
export type ListenerRequiresPayload<L> = PayloadIsRequired<ExtractListenerPayloadType<L>, ExtractListenerHasPayloadType<L>>;

/** What `onEnd` receives - `error` is `null` when the server finished the subscription without an error */
export type ListenerEndType = { topic: string; error: Error | null };

/** Start and end callbacks of one subscription started with `listen()` */
export type ListenerLifecycleOptionsType = {
  /**
   * The subscription started. With adapters whose server confirms subscriptions (tRPC, oRPC) it runs when the
   * server accepted it, and again when a reconnect restarted it. With other adapters it runs right after `listen()`.
   */
  onStart?: (data: { topic: string }) => void;
  /**
   * The server ended the subscription - it finished, or failed with `error`. Messages still pending in a `delivery`
   * strategy are delivered first, then the listener unsubscribes. Restarting it takes a new `listen()`.
   * Unsubscribing yourself does not call it.
   */
  onEnd?: (data: ListenerEndType) => void;
};

/** Second argument of `listen()` - a payload passed here is used for this subscription only */
export type ListenMethodOptionsType<Payload> = { payload?: Payload } & ListenerLifecycleOptionsType;

/**
 * Type of `listener.listen`. Built from the generics of the listener, not from the listener type itself - a
 * self-reference would stop TypeScript from measuring the variance of `Listener`.
 */
export type ListenType<Payload, HasPayload, Socket extends SocketInstance, Delivered> =
  PayloadIsRequired<Payload, HasPayload> extends true
    ? (
        callback: ListenerCallbackType<ExtractSocketAdapterType<Socket>, Delivered>,
        options: { payload: Payload } & ListenerLifecycleOptionsType,
      ) => () => void
    : (
        callback: ListenerCallbackType<ExtractSocketAdapterType<Socket>, Delivered>,
        options?: ListenMethodOptionsType<Payload>,
      ) => () => void;

export type ListenerCallbackType<AdapterType extends SocketAdapterInstance, D> = (response: {
  data: D;
  extra: ExtractAdapterExtraType<AdapterType>;
}) => void;

export type ExtendListener<
  T extends ListenerInstance,
  Properties extends {
    response?: any;
    payload?: any;
    topic?: string;
    socket?: SocketInstance;
    hasPayload?: true | false;
    hasParams?: true | false;
    delivered?: any;
  },
> = Listener<
  TypeWithDefaults<Properties, "response", ExtractListenerResponseType<T>>,
  TypeWithDefaults<Properties, "payload", ExtractListenerPayloadType<T>>,
  Properties["topic"] extends string ? Properties["topic"] : ExtractListenerTopicType<T>,
  Properties["socket"] extends SocketInstance ? Properties["socket"] : ExtractListenerSocketType<T>,
  Properties["hasPayload"] extends true ? true : ExtractListenerHasPayloadType<T>,
  Properties["hasParams"] extends true ? true : ExtractListenerHasParamsType<T>,
  TypeWithDefaults<
    Properties,
    "delivered",
    "response" extends keyof Properties ? Properties["response"] : ExtractListenerDeliveredType<T>
  >
>;
