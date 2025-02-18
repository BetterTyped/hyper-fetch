/* eslint-disable @typescript-eslint/no-use-before-define */
import { QueryParamsType, stringifyQueryParams } from "@hyper-fetch/core";

import { ExtendListener, ListenerCallbackType, ListenerInstance } from "listener";
import { SocketData } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import { getServerSentEventsAdapter } from "./sse-adapter.utils";
import { SSEAdapterOptionsType } from "./sse-adapter.types";
import { getSocketUrl, parseMessageEvent } from "../utils";
import { getSocketError } from "../utils/socket.errors";

/**
 * -------------------------------------------
 * Websocket
 * -------------------------------------------
 */

export type ServerSentEventsAdapterType = SocketAdapter<
  SSEAdapterOptionsType,
  undefined,
  undefined,
  QueryParamsType | string,
  MessageEvent<any>,
  typeof stringifyQueryParams
>;

export const ServerSentEventsAdapter = (): ServerSentEventsAdapterType =>
  new SocketAdapter<
    SSEAdapterOptionsType,
    undefined,
    undefined,
    QueryParamsType | string,
    MessageEvent<any>,
    typeof stringifyQueryParams
  >({
    name: "sse",
  })
    .setQueryParamsMapper(stringifyQueryParams)
    .setConnector(
      ({
        socket,
        adapter,
        queryParams,
        onConnect,
        onReconnect,
        onDisconnect,
        onListen,
        onConnected,
        onDisconnected,
        onError,
        onEvent,
      }) => {
        let pingTimer: ReturnType<typeof setTimeout> | undefined;
        let pongTimer: ReturnType<typeof setTimeout> | undefined;
        const url = getSocketUrl(socket.url, queryParams);
        let sse: ReturnType<typeof getServerSentEventsAdapter> | undefined;

        const autoConnect = adapter.adapterOptions?.autoConnect ?? true;

        const connect = () => {
          const enabled = onConnect();
          if (!enabled) {
            return Promise.resolve(false);
          }

          sse?.clearListeners();
          sse?.close();
          sse = getServerSentEventsAdapter(url, adapter.adapterOptions);

          // Make sure we picked good environment
          if (!sse) {
            return Promise.resolve(false);
          }

          // Reconnection timeout
          const timeout = setTimeout(() => {
            reconnect();
          }, socket.reconnectTime);

          /**
           *  Mount listeners
           */

          sse.addEventListener("open", () => {
            clearTimeout(timeout);
            onConnected();
          });

          sse.addEventListener("error", (event) => {
            const error = getSocketError(event);

            onError({ error: new Error(error) });
          });

          sse.addEventListener("message", (newEvent: MessageEvent<SocketData>) => {
            const { topic, data, event } = parseMessageEvent(newEvent);

            onEvent({ topic, data, extra: event });
          });

          return new Promise((resolve) => {
            if (sse?.readyState === EventSource.OPEN) {
              resolve(true);
              return;
            }

            // Promise lifecycle
            const resolveConnected = () => {
              resolve(true);
              sse?.removeEventListener("open", resolveConnected);
            };
            const resolveError = () => {
              resolve(false);
              sse?.removeEventListener("error", resolveError);
            };

            sse?.addEventListener("open", resolveConnected, { disableCleanup: true });
            sse?.addEventListener("error", resolveError, { disableCleanup: true });
          });
        };

        const disconnect = async (): Promise<boolean> => {
          if (!sse) {
            return Promise.resolve(false);
          }
          const promise = new Promise<boolean>((resolve) => {
            if (sse?.readyState === EventSource.CLOSED) {
              resolve(true);
              return;
            }

            const resolveDisconnected = () => {
              resolve(true);
              sse?.removeEventListener("error", resolveDisconnected);
            };
            sse?.addEventListener("error", resolveDisconnected, { disableCleanup: true });
          });

          onDisconnect();
          sse?.close();
          onDisconnected();
          clearTimers();

          return promise;
        };

        const reconnect = () => {
          onReconnect({ disconnect, connect });
        };

        const clearTimers = () => {
          clearTimeout(pingTimer);
          clearTimeout(pongTimer);
        };

        const listen = (
          listener: ExtendListener<ListenerInstance, { adapter: ServerSentEventsAdapterType }>,
          callback: ListenerCallbackType<ServerSentEventsAdapterType, any>,
        ) => {
          return onListen({ listener, callback });
        };

        const emit = async () => {
          throw new Error("Cannot emit events in SSE adapter");
        };

        // Initialize

        if (autoConnect) {
          connect();
        }

        socket.appManager.events.onOnline(() => {
          if (autoConnect && !adapter.connected) {
            connect();
          }
        });

        return {
          connect,
          reconnect,
          disconnect,
          listen,
          emit,
        };
      },
    );
