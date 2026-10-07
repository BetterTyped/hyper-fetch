import type {
  BatchDeliveryType,
  DeliveryControllerType,
  DeliveryPresetType,
  DeliveryStrategyContextType,
  DeliveryStrategyType,
  LatestDeliveryType,
  ListenerDeliveryType,
} from "delivery";
import { createBatchDeliveryStrategy, createLatestDeliveryStrategy } from "delivery";

/**
 * Typed identity helper for authoring custom delivery strategies.
 *
 * `Input` is the listener's response type, `Output` is what `listen` callbacks will receive. TypeScript cannot
 * infer `Output` from how you call `deliver`, so declare it here - the same way `createListener<Response>()`
 * declares the wire type.
 *
 * @example
 * ```ts
 * const summarize = createDeliveryStrategy<Tick, { count: number; last: Tick }>(({ deliver }) => {
 *   let count = 0;
 *   let last: Tick | undefined;
 *   let timer: ReturnType<typeof setTimeout> | undefined;
 *   return {
 *     push: ({ data, extra }) => {
 *       count += 1;
 *       last = data;
 *       timer ??= setTimeout(() => {
 *         timer = undefined;
 *         deliver({ data: { count, last: last! }, extra });
 *         count = 0;
 *       }, 1000);
 *     },
 *     dispose: () => clearTimeout(timer),
 *   };
 * });
 *
 * const onTick = socket.createListener<Tick>()({ topic: "ticks", delivery: summarize });
 * onTick.listen(({ data }) => data.count); // data: { count: number; last: Tick }
 * ```
 */
export const createDeliveryStrategy = <Input, Output = Input, Extra = any>(
  strategy: DeliveryStrategyType<Input, Output, Extra>,
): DeliveryStrategyType<Input, Output, Extra> => strategy;

/** Narrows a `delivery` value to a custom strategy function. */
export const isDeliveryStrategy = (delivery: ListenerDeliveryType): delivery is DeliveryStrategyType<any, any, any> =>
  typeof delivery === "function";

/**
 * Validates a `delivery` value. Throws for unknown presets so misconfiguration fails at listener creation,
 * not on the first message.
 */
export const assertDelivery = (delivery: ListenerDeliveryType): void => {
  if (isDeliveryStrategy(delivery)) {
    return;
  }
  if (delivery.strategy !== "latest" && delivery.strategy !== "batch") {
    throw new Error(
      `Unknown delivery strategy: ${String((delivery as { strategy: unknown }).strategy)}. Use "latest", "batch" or a custom strategy created with createDeliveryStrategy().`,
    );
  }
};

/**
 * Instantiates a delivery controller for one `listen()` subscription.
 */
export const createDeliveryController = <Input, Output, Extra>(
  delivery: DeliveryPresetType | DeliveryStrategyType<Input, any, Extra>,
  context: DeliveryStrategyContextType<Output, Extra>,
): DeliveryControllerType<Input, Extra> => {
  if (isDeliveryStrategy(delivery)) {
    return delivery(context);
  }
  const { strategy, ...options } = delivery as DeliveryPresetType;
  const factory =
    strategy === "latest"
      ? createLatestDeliveryStrategy<Input, Extra>(options as Omit<LatestDeliveryType, "strategy">)
      : createBatchDeliveryStrategy<Input, Extra>(options as Omit<BatchDeliveryType, "strategy">);
  return (factory as DeliveryStrategyType<Input, any, Extra>)(context);
};

/**
 * Stable key describing a `delivery` value - presets by value, custom strategies by identity.
 * Useful for memoization (e.g. React dependency arrays).
 */
export const getDeliveryKey = (delivery?: ListenerDeliveryType): string | DeliveryStrategyType<any> => {
  if (!delivery) {
    return "";
  }
  if (isDeliveryStrategy(delivery)) {
    return delivery;
  }
  return JSON.stringify(delivery);
};
