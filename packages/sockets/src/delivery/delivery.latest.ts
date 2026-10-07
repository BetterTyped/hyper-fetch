import type { DeliveryMessageType, DeliveryStrategyType, LatestDeliveryType } from "delivery";

/**
 * Creates the built-in `latest` (sampling) strategy.
 *
 * Timeline for `interval: 100` with messages A, B, C at 0/20/40ms and D at 300ms:
 * ```
 * t=0    push(A)  idle → deliver(A) immediately, open 100ms window
 * t=20   push(B)  pending = B
 * t=40   push(C)  pending = C (B is dropped)
 * t=100  window closes → deliver(C), open next window
 * t=200  window closes → nothing pending → idle
 * t=300  push(D)  idle → deliver(D) immediately
 * ```
 *
 * Exported so custom strategies can compose it.
 */
export const createLatestDeliveryStrategy = <Data, Extra = any>({
  interval,
  leading = true,
}: Omit<LatestDeliveryType, "strategy">): DeliveryStrategyType<Data, Data, Extra> => {
  return ({ deliver }) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: DeliveryMessageType<Data, Extra> | undefined;
    let disposed = false;

    const closeWindow = () => {
      timer = undefined;
      if (!pending) {
        // Nothing arrived during the window - go idle, the next message leads again.
        return;
      }
      const message = pending;
      pending = undefined;
      // Re-arm before delivering, so a synchronous unsubscribe inside the callback clears this timer.
      timer = setTimeout(closeWindow, interval);
      deliver(message);
    };

    return {
      push: (message) => {
        if (disposed) {
          return;
        }
        if (timer === undefined) {
          timer = setTimeout(closeWindow, interval);
          if (leading) {
            deliver(message);
            return;
          }
        }
        pending = message;
      },
      dispose: () => {
        disposed = true;
        pending = undefined;
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        timer = undefined;
      },
    };
  };
};
