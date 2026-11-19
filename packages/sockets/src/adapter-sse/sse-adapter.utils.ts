import type { EmptyTypes } from "@hyper-fetch/core";

import { getWindowImplementation } from "../utils/environment.utils";
import type { SSEAdapterOptionsType } from "./sse-adapter.types";

/** The `EventSource` class to use: the one from the options, else the page's. `null` when there is none. */
export const getEventSourceImplementation = (
  adapterOptions: SSEAdapterOptionsType | EmptyTypes,
): typeof EventSource | null => {
  // Callers pass `eventsource` or another class with the browser API, which the adapter is limited to
  const implementation = (adapterOptions?.eventSourceImpl ?? getWindowImplementation("EventSource")) as
    | typeof EventSource
    | undefined;
  return typeof implementation === "function" ? implementation : null;
};

export const getServerSentEventsAdapter = (url: string, adapterOptions: SSEAdapterOptionsType | EmptyTypes) => {
  const EventSourceImplementation = getEventSourceImplementation(adapterOptions);
  if (!EventSourceImplementation) {
    return null;
  }

  class HyperFetchEventSource extends EventSourceImplementation {
    // Named to avoid shadowing EventEmitter.listeners() in Node.js environments
    public registeredHandlers = new Map<
      (...args: any[]) => any,
      { type: keyof EventSourceEventMap; listener: (...args: any[]) => void; options: any }
    >();

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(socketUrl: string, eventSourceInit?: EventSourceInit) {
      super(socketUrl, eventSourceInit);
    }

    onopen: EventSource["onopen"] = (...args) => {
      this.registeredHandlers.forEach(({ type, listener }) => {
        if (type === "open") {
          listener(...args);
        }
      });
    };

    onerror: EventSource["onerror"] = (...args) => {
      this.registeredHandlers.forEach(({ type, listener }) => {
        if (type === "error") {
          listener(...args);
        }
      });
    };

    onmessage: EventSource["onmessage"] = (...args) => {
      this.registeredHandlers.forEach(({ type, listener }) => {
        if (type === "message") {
          listener(...args);
        }
      });
    };

    addEventListener = <K extends keyof EventSourceEventMap>(
      type: K,
      listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
      options?: boolean | (AddEventListenerOptions & { disableCleanup?: boolean }),
    ): void => {
      super.addEventListener(type, listener, options);
      this.registeredHandlers.set(listener, { type, listener, options });
    };

    removeEventListener = <K extends keyof EventSourceEventMap>(
      type: K,
      listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
      options?: boolean | EventListenerOptions,
    ): void => {
      super.removeEventListener(type, listener, options);
      this.registeredHandlers.delete(listener);
    };

    clearListeners = () => {
      this.registeredHandlers.forEach(({ type, listener, options }) => {
        if (!options?.disableCleanup) {
          this.removeEventListener(type, listener, options);
        }
      });
    };
  }

  return new HyperFetchEventSource(url, adapterOptions?.eventSourceInit);
};
