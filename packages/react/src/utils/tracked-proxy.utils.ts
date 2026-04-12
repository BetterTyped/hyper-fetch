/**
 * Wraps a plain object in a Proxy that calls `setRenderKey` when tracked properties are accessed.
 * Unlike getter-based tracking, Proxy-wrapped objects display their actual values in console.log,
 * making debugging significantly easier while preserving field-level dependency tracking.
 */
export const createTrackedProxy = <T extends Record<string, unknown>, K extends string>(
  target: T,
  trackedKeys: ReadonlyArray<K>,
  setRenderKey: (key: K) => void,
): T => {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (typeof prop === "string" && trackedKeys.includes(prop as K)) {
        setRenderKey(prop as K);
      }
      return Reflect.get(obj, prop, receiver);
    },
  });
};
