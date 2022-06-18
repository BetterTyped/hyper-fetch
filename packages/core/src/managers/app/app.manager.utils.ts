export const hasWindow = () => {
  try {
    return Boolean(window && window.addEventListener);
  } catch (err) {
    return false;
  }
};
export const hasDocument = () => {
  try {
    return Boolean(hasWindow() && window.document && window.document.addEventListener);
  } catch (err) {
    return false;
  }
};

export const onWindowEvent = <K extends keyof WindowEventMap>(
  key: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions | undefined,
) => {
  if (hasWindow()) {
    window.addEventListener(key, listener, options);
  }
};

export const onDocumentEvent = <K extends keyof DocumentEventMap>(
  key: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions | undefined,
) => {
  if (hasDocument()) {
    window.document.addEventListener(key, listener, options);
  }
};
