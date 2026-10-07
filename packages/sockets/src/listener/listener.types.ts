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
} from "types";

export type ListenerInstanceProperties = {
  response?: any;
  topic?: string;
  socket?: SocketInstance;
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
  TypeWithDefaults<ListenerProperties, "topic", any>,
  TypeWithDefaults<ListenerProperties, "socket", SocketInstance>,
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
 * | `topic`     | `string`         | Allows literal narrowing without erasure. Pass a string literal.   |
 * | `socket`    | `SocketInstance` | Injected by `createSocketSdk(socket)`; do not set this manually.   |
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
  TypeWithDefaults<ListenerProperties, "topic", string>,
  TypeWithDefaults<ListenerProperties, "socket", SocketInstance>,
  TypeWithDefaults<ListenerProperties, "hasParams", false>,
  TypeWithDefaults<ListenerProperties, "delivered", TypeWithDefaults<ListenerProperties, "response", unknown>>
>;

export type ListenerOfAdapter<A extends SocketAdapterInstance> = Listener<any, any, Socket<A>, any, any>;

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

export type ListenerConfigurationType<Params, Topic extends string, Socket extends SocketInstance, Response = any> = {
  params?: Params;
} & Partial<ListenerOptionsType<Topic, ExtractSocketAdapterType<Socket>, Response>>;

export type ListenerParamsOptionsType<Listener extends ListenerInstance> =
  ExtractListenerHasParamsType<Listener> extends false
    ? {
        params: ExtractUrlParams<ExtractListenerTopicType<Listener>>;
      }
    : {
        params?: never;
      };

export type ListenType<Listener extends ListenerInstance, Socket extends SocketInstance> =
  ExtractUrlParams<ExtractListenerTopicType<Listener>> extends EmptyTypes
    ? (
        callback: ListenerCallbackType<ExtractSocketAdapterType<Socket>, ExtractListenerDeliveredType<Listener>>,
      ) => () => void
    : ExtractListenerHasParamsType<Listener> extends true
      ? (
          callback: ListenerCallbackType<ExtractSocketAdapterType<Socket>, ExtractListenerDeliveredType<Listener>>,
        ) => () => void
      : (
          callback: ListenerCallbackType<ExtractSocketAdapterType<Socket>, ExtractListenerDeliveredType<Listener>>,
        ) => () => void;

export type ListenerCallbackType<AdapterType extends SocketAdapterInstance, D> = (response: {
  data: D;
  extra: ExtractAdapterExtraType<AdapterType>;
}) => void;

export type ExtendListener<
  T extends ListenerInstance,
  Properties extends {
    response?: any;
    topic?: string;
    socket?: SocketInstance;
    hasParams?: true | false;
    delivered?: any;
  },
> = Listener<
  TypeWithDefaults<Properties, "response", ExtractListenerResponseType<T>>,
  Properties["topic"] extends string ? Properties["topic"] : ExtractListenerTopicType<T>,
  Properties["socket"] extends SocketInstance ? Properties["socket"] : ExtractListenerSocketType<T>,
  Properties["hasParams"] extends true ? true : ExtractListenerHasParamsType<T>,
  TypeWithDefaults<
    Properties,
    "delivered",
    "response" extends keyof Properties ? Properties["response"] : ExtractListenerDeliveredType<T>
  >
>;
