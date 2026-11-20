import type { EmptyTypes } from "@hyper-fetch/core";

import type { WebsocketAdapterOptionsType } from "./websocket-adapter.types";

/** `readyState` values of a WebSocket - read without the global, which some runtimes don't have */
export const WebsocketReadyState = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 } as const;

/**
 * The WebSocket constructor to use: the one from `adapterOptions`, otherwise the global one
 * (browsers, Node.js 22+, Bun, Deno). `null` when the runtime has none.
 */
export const getWebsocketConstructor = (adapterOptions: WebsocketAdapterOptionsType | EmptyTypes) => {
  return adapterOptions?.WebSocket ?? (typeof globalThis.WebSocket === "function" ? globalThis.WebSocket : null);
};

export const getWebsocketAdapter = (url: string, adapterOptions: WebsocketAdapterOptionsType | EmptyTypes) => {
  const WebSocketConstructor = getWebsocketConstructor(adapterOptions);
  if (!WebSocketConstructor) {
    return null;
  }

  class HyperFetchWebsocket extends WebSocketConstructor {
    // Named to avoid shadowing EventEmitter.listeners() in Node.js environments
    public registeredHandlers = new Map<
      (...args: any[]) => any,
      { type: keyof WebSocketEventMap; listener: (...args: any[]) => void; options: any }
    >();

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(socketUrl: string, protocols?: string | string[]) {
      super(socketUrl, protocols);
    }

    addEventListener = <K extends keyof WebSocketEventMap>(
      type: K,
      listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
      options?: boolean | (AddEventListenerOptions & { disableCleanup?: boolean }),
    ) => {
      super.addEventListener(type, listener, options);
      this.registeredHandlers.set(listener, { type, listener, options });
    };

    removeEventListener = <K extends keyof WebSocketEventMap>(
      type: K,
      listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
      options?: boolean | EventListenerOptions,
    ) => {
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

  return new HyperFetchWebsocket(url, adapterOptions?.protocols);
};
