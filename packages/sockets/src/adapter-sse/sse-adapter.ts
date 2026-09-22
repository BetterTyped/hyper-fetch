/* eslint-disable @typescript-eslint/no-use-before-define */
import type { EmptyTypes, QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams } from "@hyper-fetch/core";
import type { SocketData } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";

import { getSocketUrl, parseMessageEvent } from "../utils";
import { getSocketError } from "../utils/socket.errors";
import type { SSEAdapterOptionsType } from "./sse-adapter.types";
import { getServerSentEventsAdapter } from "./sse-adapter.utils";

/**
 * -------------------------------------------
 * Server-Sent Events
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

/** Create a preconfigured socket adapter for Server-Sent Events (EventSource) connections. */
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
        onConnectFailed,
        onReconnect,
        onDisconnect,
        onListen,
        onConnected,
        onDisconnected,
        onError,
        onEvent,
      }) => {
        let sse: ReturnType<typeof getServerSentEventsAdapter> | undefined;

        const autoConnect =
          typeof socket.adapter.adapterOptions?.autoConnect === "boolean"
            ? socket.adapter.adapterOptions?.autoConnect
            : true;

        const connect = async (): Promise<boolean> => {
          const connection = await onConnect();
          if (!connection) {
            return socket.adapter.connected;
          }

          sse?.clearListeners();
          sse?.close();

          const url = getSocketUrl(connection.url, getQueryParams(connection.queryParams));
          const eventSource = createEventSource(url, connection.adapterOptions);
          sse = eventSource;

          if (!eventSource) {
            return false;
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
          const currentSse = sse;
          const hasTransport = currentSse && currentSse.readyState !== EventSource.CLOSED;

          // When there is nothing to close, only a connection attempt may still be preparing (onConnect) - cancel it
          const wasConnecting = adapter.connecting;
          onDisconnect();
          if (hasTransport) {
            currentSse.close();
          }
          if (hasTransport || wasConnecting) {
            onDisconnected();
          }

          return true;
        };

        const reconnect = () => {
          onReconnect({ disconnect, connect });
        };

        /** Creates the transport, reporting a failed attempt when the environment or the connection details are invalid */
        const createEventSource = (url: string, adapterOptions: SSEAdapterOptionsType | EmptyTypes) => {
          try {
            const instance = getServerSentEventsAdapter(url, adapterOptions);
            if (!instance) {
              onConnectFailed({ error: new Error("EventSource is not available in this environment") });
            }
            return instance;
          } catch (error) {
            onConnectFailed({ error: error as Error });
            return null;
          }
        };

        const listen = (
          listener: ListenerOfAdapter<ServerSentEventsAdapterType>,
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
