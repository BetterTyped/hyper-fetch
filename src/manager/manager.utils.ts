export const hasWindow = () => {
  return Boolean(window?.addEventListener);
};
export const hasDocument = () => {
  return Boolean(document?.addEventListener);
};

export const onWindowEvent = <K extends keyof WindowEventMap>(
  key: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions | undefined,
) => {
  if (hasWindow()) {
    window?.addEventListener(key, listener, options);
  }
};

export const onDocumentEvent = <K extends keyof DocumentEventMap>(
  key: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions | undefined,
) => {
  if (hasDocument()) {
    document?.addEventListener(key, listener, options);
  }
};
