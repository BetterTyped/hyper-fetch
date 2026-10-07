import type { BatchDeliveryType, DeliveryStrategyType } from "delivery";

/**
 * Creates the built-in `batch` strategy.
 *
 * Timeline for `interval: 100` with messages A, B, C at 0/20/40ms and D at 300ms:
 * ```
 * t=0    push(A)  buffer=[A], open 100ms window
 * t=20   push(B)  buffer=[A, B]
 * t=40   push(C)  buffer=[A, B, C]
 * t=100  window closes → deliver([A, B, C])
 * t=300  push(D)  buffer=[D], open window
 * t=400  window closes → deliver([D])
 * ```
 *
 * The delivered `extra` is the one of the last message in the batch.
 * Exported so custom strategies can compose it.
 */
export const createBatchDeliveryStrategy = <Data, Extra = any>({
  interval,
  maxSize = Infinity,
}: Omit<BatchDeliveryType, "strategy">): DeliveryStrategyType<Data, Data[], Extra> => {
  return ({ deliver }) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let buffer: Data[] = [];
    let lastExtra: Extra | undefined;
    let disposed = false;

    const flush = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      timer = undefined;
      if (buffer.length === 0) {
        return;
      }
      const data = buffer;
      const extra = lastExtra as Extra;
      // Reset before delivering, so a synchronous unsubscribe inside the callback sees clean state.
      buffer = [];
      lastExtra = undefined;
      deliver({ data, extra });
    };

    return {
      push: ({ data, extra }) => {
        if (disposed) {
          return;
        }
        buffer.push(data);
        lastExtra = extra;
        if (buffer.length >= maxSize) {
          flush();
          return;
        }
        if (timer === undefined) {
          timer = setTimeout(flush, interval);
        }
      },
      dispose: () => {
        disposed = true;
        buffer = [];
        lastExtra = undefined;
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        timer = undefined;
      },
    };
  };
};
