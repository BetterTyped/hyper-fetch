type ImplementationName = "WebSocket" | "EventSource";

/**
 * Remove a browser API class from the environment, as on runtimes that don't have it. In jsdom `window` and
 * `globalThis` are different objects, so both lose it. Returns a function that puts it back.
 */
export const removeImplementation = (name: ImplementationName) => {
  const targets: Record<string, unknown>[] = [globalThis];
  if (typeof window !== "undefined" && (window as unknown) !== globalThis) {
    targets.push(window as unknown as Record<string, unknown>);
  }
  const originals = targets.map((target) => Object.getOwnPropertyDescriptor(target, name));
  const setValue = (target: Record<string, unknown>, descriptor: PropertyDescriptor | undefined, value: unknown) => {
    // Some setups define it as writable but not configurable
    if (descriptor && !descriptor.configurable) {
      target[name] = value;
      return;
    }
    Object.defineProperty(target, name, { value, configurable: true, writable: true });
  };
  targets.forEach((target, index) => setValue(target, originals[index], undefined));

  return () => {
    targets.forEach((target, index) => {
      const original = originals[index];
      if (!original) {
        Reflect.deleteProperty(target, name);
      } else if (original.configurable) {
        Object.defineProperty(target, name, original);
      } else {
        setValue(target, original, original.value);
      }
    });
  };
};

export const withoutImplementation = async (name: ImplementationName, callback: () => unknown) => {
  const restore = removeImplementation(name);
  try {
    await callback();
  } finally {
    restore();
  }
};
