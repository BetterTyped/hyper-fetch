export const hasWindow = () => {
  try {
    return Boolean(window && window.addEventListener);
  } catch (err) {
    /* istanbul ignore next */
    return false;
  }
};

export const hasDocument = () => {
  try {
    return Boolean(hasWindow() && window.document && window.document.addEventListener);
  } catch (err) {
    /* istanbul ignore next */
    return false;
  }
};

export const onWindowEvent = <K extends keyof WindowEventMap>(
  key: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions | undefined,
): VoidFunction => {
  /* istanbul ignore next */
  if (hasWindow()) {
    window.addEventListener(key, listener, options);
    return () => window.removeEventListener(key, listener, options);
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
    window.document.addEventListener(key, listener, options);
    return () => window.document.removeEventListener(key, listener, options);
  }
  /* istanbul ignore next */
  return () => null;
};
