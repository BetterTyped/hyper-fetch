import { EmptyTypes } from "@hyper-fetch/core";

import { SSEAdapterOptionsType } from "./sse-adapter.types";

export const getServerSentEventsAdapter = (url: string, adapterOptions: SSEAdapterOptionsType | EmptyTypes) => {
  /** istanbul ignore next */
  if (!window?.EventSource) return null;

  class HyperFetchEventSource extends EventSource {
    public listeners: Map<
      (...args: any[]) => any,
      { type: keyof EventSourceEventMap; listener: (...args: any[]) => void; options: any }
    > = new Map();

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(socketUrl: string, eventSourceInit?: EventSourceInit) {
      super(socketUrl, eventSourceInit);
    }

    onopen: EventSource["onopen"] = (...args) => {
      this.listeners.forEach(({ type, listener }) => {
        if (type === "open") {
          listener(...args);
        }
      });
    };

    onerror: EventSource["onerror"] = (...args) => {
      this.listeners.forEach(({ type, listener }) => {
        if (type === "error") {
          listener(...args);
        }
      });
    };

    onmessage: EventSource["onmessage"] = (...args) => {
      this.listeners.forEach(({ type, listener }) => {
        if (type === "message") {
          listener(...args);
        }
      });
    };

    addEventListener<K extends keyof EventSourceEventMap>(
      type: K,
      listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
      options?: boolean | (AddEventListenerOptions & { disableCleanup?: boolean }),
    ): void {
      super.addEventListener(type, listener, options);
      this.listeners.set(listener, { type, listener, options });
    }

    removeEventListener<K extends keyof EventSourceEventMap>(
      type: K,
      listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
      options?: boolean | EventListenerOptions,
    ): void {
      super.removeEventListener(type, listener, options);
      this.listeners.delete(listener);
    }

    clearListeners() {
      this.listeners.forEach(({ type, listener, options }) => {
        if (!options?.disableCleanup) {
          this.removeEventListener(type, listener, options);
        }
      });
    }
  }

  return new HyperFetchEventSource(url, adapterOptions?.eventSourceInit);
};
