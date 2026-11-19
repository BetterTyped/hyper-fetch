import type { EmptyTypes } from "@hyper-fetch/core";

import { getWindowImplementation } from "../utils/environment.utils";
import type { WebsocketAdapterOptionsType } from "./websocket-adapter.types";

/** The `WebSocket` class to use: the one from the options, else the page's. `null` when there is none. */
export const getWebsocketImplementation = (
  adapterOptions: WebsocketAdapterOptionsType | EmptyTypes,
): typeof WebSocket | null => {
  // Callers pass `ws` or another class with the browser API, which the adapter is limited to
  const implementation = (adapterOptions?.webSocketImpl ?? getWindowImplementation("WebSocket")) as
    | typeof WebSocket
    | undefined;
  return typeof implementation === "function" ? implementation : null;
};

export const getWebsocketAdapter = (url: string, adapterOptions: WebsocketAdapterOptionsType | EmptyTypes) => {
  const WebsocketImplementation = getWebsocketImplementation(adapterOptions);
  if (!WebsocketImplementation) {
    return null;
  }

  class HyperFetchWebsocket extends WebsocketImplementation {
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
