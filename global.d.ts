declare module "abortcontroller-polyfill/dist/cjs-ponyfill" {
  /** A controller object that allows you to abort one or more DOM requests as and when desired. */
  interface AbortController {
    /**
     * Returns the AbortSignal object associated with this object.
     */
    readonly signal: AbortSignal;

    /**
     * Invoking this method will set this object's AbortSignal's aborted flag and signal to any observers that the associated activity is to be aborted.
     */
    abort(): void;
  }

  const AbortController: {
    prototype: AbortController;
    new (): AbortController;
  };

  interface AbortSignalEventMap {
    abort: Event;
  }

  /** A signal object that allows you to communicate with a DOM request (such as a Fetch) and abort it if required via an AbortController object. */
  interface AbortSignal extends EventTarget {
    /**
     * Returns true if this AbortSignal's AbortController has signaled to abort, and false otherwise.
     */
    readonly aborted: boolean;
    onabort: ((this: AbortSignal, ev: Event) => any) | null;

    addEventListener<K extends keyof AbortSignalEventMap>(
      type: K,
      listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions,
    ): void;

    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void;

    removeEventListener<K extends keyof AbortSignalEventMap>(
      type: K,
      listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
      options?: boolean | EventListenerOptions,
    ): void;

    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ): void;
  }

  const AbortSignal: {
    prototype: AbortSignal;
    new (): AbortSignal;
  };
}
