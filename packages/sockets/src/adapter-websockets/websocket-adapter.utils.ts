import { EmptyTypes } from "@hyper-fetch/core";

import { WebsocketAdapterOptionsType } from "./websocket-adapter.types";

export const getWebsocketAdapter = (url: string, adapterOptions: WebsocketAdapterOptionsType | EmptyTypes) => {
  /** istanbul ignore next */
  if (!window?.WebSocket) return null;

  class HyperFetchWebsocket extends WebSocket {
    public listeners: Map<
      (...args: any[]) => any,
      { type: keyof WebSocketEventMap; listener: (...args: any[]) => void; options: any }
    > = new Map();

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(socketUrl: string, protocols?: string | string[]) {
      super(socketUrl, protocols);
    }

    addEventListener<K extends keyof WebSocketEventMap>(
      type: K,
      listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
      options?: boolean | (AddEventListenerOptions & { disableCleanup?: boolean }),
    ): void {
      super.addEventListener(type, listener, options);
      this.listeners.set(listener, { type, listener, options });
    }

    removeEventListener<K extends keyof WebSocketEventMap>(
      type: K,
      listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
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

  return new HyperFetchWebsocket(url, adapterOptions?.protocols);
};
