declare module "events" {
  interface EventEmitterOptions {
    captureRejections?: boolean;
  }
  class EventEmitter {
    constructor(options?: EventEmitterOptions);
    static defaultMaxListeners: number;
    static listenerCount(emitter: EventEmitter, event: string | symbol): number;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: string | symbol): Function[];
    rawListeners(event: string | symbol): Function[];
    emit(event: string | symbol, ...args: any[]): boolean;
    listenerCount(event: string | symbol, listener?: Function): number;
    eventNames(): (string | symbol)[];
  }
  export = EventEmitter;
}

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
