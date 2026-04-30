import type { Mock } from "vitest";

export const testCallbacksExecution = (callbacks: Mock[]) => {
  callbacks.forEach((spyFn, index) => {
    const nextSpy = callbacks[index + 1];
    if (nextSpy) {
      expect(spyFn).toHaveBeenCalledBefore(nextSpy);
    }
    expect(spyFn).toHaveBeenCalledTimes(1);
  });
};
