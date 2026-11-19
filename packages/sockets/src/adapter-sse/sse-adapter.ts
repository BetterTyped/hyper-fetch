/* eslint-disable @typescript-eslint/no-use-before-define */
import type { EmptyTypes, QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams } from "@hyper-fetch/core";
import type { SocketData } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";

import { getSocketUrl, parseMessageEvent } from "../utils";
import { getSocketError } from "../utils/socket.errors";
import type { SSEAdapterOptionsType, SSEDecodedMessageType } from "./sse-adapter.types";
import { EventSourceReadyState } from "./sse-adapter.types";
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
        // The transport in use. Events of any other instance (replaced or closed on purpose) are ignored.
        let sse: ReturnType<typeof getServerSentEventsAdapter> | undefined;
        // Connection attempt in progress - concurrent `connect()` calls join it
        let pendingConnection: Promise<boolean> | undefined;
        // Connection timeout while connecting, reconnection delay after the connection was lost
        let timeout: ReturnType<typeof setTimeout> | undefined;

        const autoConnect =
          typeof socket.adapter.adapterOptions?.autoConnect === "boolean"
            ? socket.adapter.adapterOptions?.autoConnect
            : true;

        /** Maps an incoming message to the listener event, reporting decoder failures instead of throwing */
        const decodeMessage = (
          event: MessageEvent<SocketData>,
          decode: SSEAdapterOptionsType["decode"],
        ): SSEDecodedMessageType | null => {
          try {
            if (decode) {
              return decode(event);
            }
            const { topic, data } = parseMessageEvent(event);
            return { topic, data };
          } catch (error) {
            onError({ error: error as Error });
            return null;
          }
        };

        const scheduleReconnect = () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            reconnect();
          }, socket.reconnectTime);
        };

        const openConnection = async (): Promise<boolean> => {
          const connection = await onConnect();
          if (!connection) {
            return socket.adapter.connected;
          }

          clearTimeout(timeout);
          sse?.clearListeners();
          sse?.close();

          const url = getSocketUrl(connection.url, getQueryParams(connection.queryParams));
          const eventSource = createEventSource(url, connection.adapterOptions);
          sse = eventSource ?? undefined;

          if (!eventSource) {
            return false;
          }

          const isCurrent = () => sse === eventSource;

          // Connection timeout - when the server does not answer in time, start over
          scheduleReconnect();

          /**
           *  Mount listeners
           */

          eventSource.addEventListener("open", () => {
            if (!isCurrent()) {
              return;
            }
            clearTimeout(timeout);
            onConnected();
          });

          eventSource.addEventListener("error", (event) => {
            if (!isCurrent()) {
              return;
            }
            const error = getSocketError(event);

            onError({ error: new Error(error) });

            // An open stream broke. The browser either retries on its own (CONNECTING) or gives up (CLOSED) -
            // in both cases the socket is not connected anymore. The timeout takes over when the stream
            // does not come back in time, the same way it guards the initial connection.
            const isLost = adapter.connected && eventSource.readyState !== EventSourceReadyState.OPEN;
            if (isLost) {
              onDisconnected();
              if (eventSource.readyState === EventSourceReadyState.CONNECTING) {
                adapter.setConnecting(true);
                socket.events.emitConnecting({ connecting: true });
              }
              scheduleReconnect();
            }
          });

          const { decode } = connection.adapterOptions || {};
          eventSource.addEventListener("message", (newEvent: MessageEvent<SocketData>) => {
            if (!isCurrent()) {
              return;
            }
            const message = decodeMessage(newEvent, decode);
            if (message) {
              onEvent({ topic: message.topic, data: message.data, extra: newEvent });
            }
          });

          return new Promise((resolve) => {
            if (eventSource.readyState === EventSourceReadyState.OPEN) {
              // No open event follows, so the attempt timeout would reconnect a working connection
              clearTimeout(timeout);
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

        const connect = (): Promise<boolean> => {
          // Another attempt is already on its way (e.g. the automatic one) - resolve together with it
          if (adapter.connecting && pendingConnection) {
            return pendingConnection;
          }

          const connection = openConnection();
          pendingConnection = connection;
          const release = () => {
            if (pendingConnection === connection) {
              pendingConnection = undefined;
            }
          };
          connection.then(release, release);

          return connection;
        };

        /**
         * Closes the transport and resets the connection state. From this point the closed transport is detached -
         * whatever it reports later does not reach the socket anymore.
         */
        const closeConnection = async ({ manual }: { manual: boolean }): Promise<boolean> => {
          clearTimeout(timeout);

          const currentSse = sse;
          sse = undefined;
          const hasTransport = currentSse && currentSse.readyState !== EventSourceReadyState.CLOSED;

          // When there is nothing to close, only a connection attempt may still be preparing (onConnect) - cancel it
          const wasActive = adapter.connected || adapter.connecting;
          onDisconnect();
          if (!manual) {
            // Closing the previous transport is a part of reconnecting - only `disconnect()` keeps the socket closed
            adapter.setForceClosed(false);
          }
          if (hasTransport) {
            currentSse.clearListeners();
            currentSse.close();
          }
          if (hasTransport || wasActive) {
            onDisconnected();
          }

          return true;
        };

        /** Manual disconnect - the socket stays closed until `connect()` or `reconnect()` is called */
        const disconnect = (): Promise<boolean> => {
          return closeConnection({ manual: true });
        };

        const reconnect = async () => {
          // Reconnecting is a request to be connected, also after a manual disconnect
          adapter.setForceClosed(false);

          await onReconnect({
            disconnect: () => closeConnection({ manual: false }),
            connect: async () => {
              // `disconnect()` called in the meantime wins over the reconnection
              if (adapter.forceClosed) {
                adapter.setReconnectionAttempts(0);
                return false;
              }
              return connect();
            },
          });
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

        // Server-Sent Events are receive-only. Throwing synchronously makes `emitter.emit()` fail right at the
        // call site instead of leaving a rejected promise nobody awaits.
        const emit = () => {
          throw new Error("Cannot emit events in SSE adapter");
        };

        // Initialize
        if (autoConnect) {
          connect();
        }

        socket.appManager.events.onOnline(() => {
          // A socket disconnected on purpose stays closed until `connect()` or `reconnect()` is called
          if (autoConnect && !adapter.connected && !adapter.forceClosed) {
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
