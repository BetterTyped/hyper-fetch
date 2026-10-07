import type { SocketAdapterInstance } from "adapter";
import type { ExtractAdapterExtraType } from "types";

/**
 * A single message flowing through a delivery strategy.
 *
 * `data` is the payload, `extra` is adapter-specific metadata (for the WebSocket adapter it is the raw `MessageEvent`).
 */
export type DeliveryMessageType<Data, Extra = any> = {
  data: Data;
  extra: Extra;
};

/**
 * The object a delivery strategy returns for a single `listen()` subscription.
 *
 * Think of it as a tiny pipe: `push` is the input (every raw message lands here), `deliver` from the
 * {@link DeliveryStrategyContextType} is the output, and `dispose` is the cleanup.
 */
export type DeliveryControllerType<Input, Extra = any> = {
  /**
   * Receives every raw message of the subscription. The strategy decides if and when to call `deliver`.
   */
  push: (message: DeliveryMessageType<Input, Extra>) => void;
  /**
   * Called when the subscription ends (`unlisten()` / component unmount). Clear timers and drop pending
   * state here. Nothing may be delivered after `dispose` was called. Must be safe to call more than once.
   */
  dispose: () => void;
};

/**
 * Context handed to a delivery strategy when a subscription starts.
 */
export type DeliveryStrategyContextType<Output, Extra = any> = {
  /**
   * Hands a (possibly aggregated) message to the user's `listen` callback.
   */
  deliver: (message: DeliveryMessageType<Output, Extra>) => void;
};

/**
 * A custom delivery strategy. It is a factory invoked once per `listen()` call, so every subscription
 * owns its own timers and buffers.
 *
 * `Input` is the raw message type (the listener's response type), `Output` is what `listen` callbacks
 * receive. Use {@link createDeliveryStrategy} to author one with full type inference.
 *
 * @example
 * ```ts
 * // Deliver after 50ms of silence (debounce)
 * const settle = createDeliveryStrategy<Tick>(({ deliver }) => {
 *   let timer: ReturnType<typeof setTimeout> | undefined;
 *   let last: DeliveryMessageType<Tick> | undefined;
 *   return {
 *     push: (message) => {
 *       last = message;
 *       clearTimeout(timer);
 *       timer = setTimeout(() => {
 *         if (last) deliver(last);
 *         last = undefined;
 *       }, 50);
 *     },
 *     dispose: () => {
 *       clearTimeout(timer);
 *       last = undefined;
 *     },
 *   };
 * });
 * ```
 */
export type DeliveryStrategyType<Input, Output = Input, Extra = any> = (
  context: DeliveryStrategyContextType<Output, Extra>,
) => DeliveryControllerType<Input, Extra>;

/**
 * Sampling delivery. The first message of an idle period is delivered immediately (when `leading` is `true`),
 * then at most one message per `interval` is delivered - always the most recent one. Intermediate messages
 * are dropped. Best for state-like data (prices, positions, cursors) where only the newest value matters.
 */
export type LatestDeliveryType = {
  strategy: "latest";
  /** Minimum time in milliseconds between two deliveries. */
  interval: number;
  /**
   * Deliver the first message of an idle period immediately instead of waiting for the interval to pass.
   * @default true
   */
  leading?: boolean;
};

/**
 * Batching delivery. The first message opens a window of `interval` milliseconds; when it closes, every
 * message collected in it is delivered at once as an array, in arrival order. Nothing is dropped.
 * Best for event-like data (trades, chat messages, logs) where every message must be processed.
 */
export type BatchDeliveryType = {
  strategy: "batch";
  /** Window length in milliseconds, measured from the first message of a batch. */
  interval: number;
  /** Deliver early as soon as this many messages were collected. Defaults to no limit. */
  maxSize?: number;
};

/** Built-in, serializable delivery presets. */
export type DeliveryPresetType = LatestDeliveryType | BatchDeliveryType;

/**
 * Everything accepted by the listener `delivery` option: a built-in preset or a custom strategy.
 */
export type ListenerDeliveryType<Response = any, Adapter extends SocketAdapterInstance = SocketAdapterInstance> =
  | DeliveryPresetType
  | DeliveryStrategyType<Response, any, ExtractAdapterExtraType<Adapter>>;

/**
 * Resolves what `listen` callbacks receive for a given `delivery` configuration.
 *
 * - no delivery → `Response`
 * - `{ strategy: "latest" }` → `Response`
 * - `{ strategy: "batch" }` → `Response[]`
 * - custom strategy → its `Output` type
 */
export type ResolveDeliveredType<Response, Delivery> = [Delivery] extends [undefined]
  ? Response
  : Delivery extends DeliveryStrategyType<any, infer Output, any>
    ? Output
    : Delivery extends { strategy: "batch" }
      ? Response[]
      : Response;
