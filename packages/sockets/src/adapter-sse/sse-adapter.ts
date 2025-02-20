/* eslint-disable @typescript-eslint/no-use-before-define */
import { QueryParamsType, stringifyQueryParams } from "@hyper-fetch/core";

import { ExtendListener, ListenerCallbackType, ListenerInstance } from "listener";
import { SocketData } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import { getServerSentEventsAdapter } from "./sse-adapter.utils";
import { SSEAdapterOptionsType } from "./sse-adapter.types";
import { getSocketUrl, parseMessageEvent } from "../utils";
import { getSocketError } from "../utils/socket.errors";
import { Socket } from "socket";

/**
 * -------------------------------------------
 * Websocket
 * -------------------------------------------
 */

export type ServerSentEventsAdapterType = SocketAdapter<
  MessageEvent<any>,
  SSEAdapterOptionsType,
  undefined,
  undefined,
  QueryParamsType | string,
  typeof stringifyQueryParams
>;

export const ServerSentEventsAdapter = (): ServerSentEventsAdapterType =>
  new SocketAdapter<
    MessageEvent<any>,
    SSEAdapterOptionsType,
    undefined,
    undefined,
    QueryParamsType | string,
    typeof stringifyQueryParams
  >({
    name: "sse",
  })
    .setQueryParamsMapper(stringifyQueryParams)
    .setConnector(
      ({
        socket,
        adapter,
        getQueryParams,
        onConnect,
        onReconnect,
        onDisconnect,
        onListen,
        onConnected,
        onDisconnected,
        onError,
        onEvent,
      }) => {
        let sse: ReturnType<typeof getServerSentEventsAdapter> | undefined;

        const autoConnect = adapter.adapterOptions?.autoConnect ?? true;

        const connect = () => {
          const url = getSocketUrl(socket.url, getQueryParams());
          const enabled = onConnect();
          if (!enabled) {
            return Promise.resolve(false);
          }

          sse?.clearListeners();
          sse?.close();

          const eventSource = getServerSentEventsAdapter(url, adapter.adapterOptions);
          sse = eventSource;

          // Make sure we picked good environment
          if (!eventSource) {
            return Promise.resolve(false);
          }

          // Reconnection timeout
          const timeout = setTimeout(() => {
            reconnect();
          }, socket.reconnectTime);

          /**
           *  Mount listeners
           */

          eventSource.addEventListener("open", () => {
            clearTimeout(timeout);
            onConnected();
          });

          eventSource.addEventListener("error", (event) => {
            const error = getSocketError(event);

            onError({ error: new Error(error) });
          });

          eventSource.addEventListener("message", (newEvent: MessageEvent<SocketData>) => {
            const { topic, data, event } = parseMessageEvent(newEvent);

            onEvent({ topic, data, extra: event });
          });

          return new Promise((resolve) => {
            if (eventSource.readyState === EventSource.OPEN) {
              resolve(true);
              adapter.setConnected(true);
              adapter.setConnecting(false);
              return;
            }

            // Promise lifecycle
            const resolveConnected = () => {
              resolve(true);
              eventSource.removeEventListener("open", resolveConnected);
            };
            const resolveError = () => {
              resolve(false);
              eventSource.removeEventListener("error", resolveError);
            };

            eventSource.addEventListener("open", resolveConnected, { disableCleanup: true });
            eventSource.addEventListener("error", resolveError, { disableCleanup: true });
          });
        };

        const disconnect = async (): Promise<boolean> => {
          if (!sse) {
            return Promise.resolve(false);
          }
          const currentSse = sse;
          const promise = new Promise<boolean>((resolve) => {
            if (currentSse.readyState === EventSource.CLOSED) {
              resolve(true);
              adapter.setConnected(false);
              adapter.setConnecting(false);
              return;
            }

            const resolveDisconnected = () => {
              resolve(true);
              currentSse.removeEventListener("error", resolveDisconnected);
            };
            currentSse.addEventListener("error", resolveDisconnected, { disableCleanup: true });
          });

          onDisconnect();
          currentSse.close();
          onDisconnected();

          return promise;
        };

        const reconnect = () => {
          onReconnect({ disconnect, connect });
        };

        const listen = (
          listener: ExtendListener<ListenerInstance, { socket: Socket<ServerSentEventsAdapterType> }>,
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
