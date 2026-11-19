export const hasWindow = () => {
  try {
    return Boolean(window && window.addEventListener);
  } catch {
    /* istanbul ignore next */
    return false;
  }
};

export const hasDocument = () => {
  try {
    return Boolean(hasWindow() && window.document && window.document.addEventListener);
  } catch {
    /* istanbul ignore next */
    return false;
  }
};

/**
 * Reads the current network state from the browser. Falls back to `true` when it is unknown - e.g. in Node.js or
 * React Native, where `navigator.onLine` is not available.
 */
export const isNavigatorOnline = () => {
  try {
    return typeof navigator.onLine === "boolean" ? navigator.onLine : true;
  } catch {
    /* istanbul ignore next */
    return true;
  }
};

export const onWindowEvent = <K extends keyof WindowEventMap>(
  key: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions | undefined,
): VoidFunction => {
  /* istanbul ignore next */
  if (hasWindow()) {
    // Keep the target - the cleanup has to reach the same object, even when the global one is already gone
    const target = window;
    target.addEventListener(key, listener, options);
    return () => target.removeEventListener(key, listener, options);
  }
  /* istanbul ignore next */
  return () => null;
};

export const onDocumentEvent = <K extends keyof DocumentEventMap>(
  key: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions | undefined,
): VoidFunction => {
  /* istanbul ignore next */
  if (hasDocument()) {
    // Keep the target - the cleanup has to reach the same object, even when the global one is already gone
    const target = window.document;
    target.addEventListener(key, listener, options);
    return () => target.removeEventListener(key, listener, options);
  }
  /* istanbul ignore next */
  return () => null;
};
