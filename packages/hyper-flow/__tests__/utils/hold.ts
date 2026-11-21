/**
 * Keeps a mocked response in flight until the test calls `release()`. Pass `until` to `mockRequest`, so asserting on
 * an in-flight request never races the mock's delay.
 */
export const createHold = () => {
  let release!: () => void;
  const until = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { until, release };
};
