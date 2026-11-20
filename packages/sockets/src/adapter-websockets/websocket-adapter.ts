/* eslint-disable @typescript-eslint/no-use-before-define */
import type { EmptyTypes, QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams, Time } from "@hyper-fetch/core";
import type { SocketData } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import type { EmitterInstance } from "emitter";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";

import { getSocketUrl, parseMessageEvent } from "../utils";
import { getSocketError } from "../utils/socket.errors";
import type { WebsocketAdapterOptionsType, WebsocketDecodedMessageType } from "./websocket-adapter.types";
import { getWebsocketAdapter, WebsocketReadyState } from "./websocket-adapter.utils";

/**
 * -------------------------------------------
 * Websocket
 * -------------------------------------------
 */

export type WebsocketAdapterType = SocketAdapter<
  MessageEvent<any>,
  WebsocketAdapterOptionsType,
  undefined,
  undefined,
  QueryParamsType | string,
  typeof stringifyQueryParams
>;

/** Create a preconfigured socket adapter for native WebSocket connections. */
export const WebsocketAdapter = (): WebsocketAdapterType =>
  new SocketAdapter<
    MessageEvent<any>,
    WebsocketAdapterOptionsType,
    undefined,
    undefined,
    QueryParamsType | string,
    typeof stringifyQueryParams
  >({
    name: "websockets",
  })
    .setQueryParamsMapper(stringifyQueryParams)
    .setConnector(
      ({
        socket,
        getQueryParams,
        onConnect,
        onConnectFailed,
        onReconnect,
        onDisconnect,
        onListen,
        onEmit,
        onEmitError,
        onConnected,
        onDisconnected,
        onError,
        onEvent,
      }) => {
        const autoConnect =
          typeof socket.adapter.adapterOptions?.autoConnect === "boolean"
            ? socket.adapter.adapterOptions?.autoConnect
            : true;

        // The transport in use. Events of any other instance (replaced or closed on purpose) are ignored.
        let websocket: ReturnType<typeof getWebsocketAdapter> | undefined;
        // Options of the current connection attempt (after onConnect interceptors)
        let options: WebsocketAdapterOptionsType | EmptyTypes = socket.adapter.adapterOptions;
        // Connection attempt in progress - concurrent `connect()` calls join it
        let pendingConnection: Promise<boolean> | undefined;

        let pingTimer: ReturnType<typeof setTimeout> | undefined;
        let pongTimer: ReturnType<typeof setTimeout> | undefined;
        // Connection timeout while connecting, reconnection delay after the connection was lost
        let timeout: ReturnType<typeof setTimeout> | undefined;

        /** Starts over after `delay` - the attempt timeout while connecting, the reconnect delay after a loss */
        const scheduleReconnect = (delay = socket.reconnectTime) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            reconnect();
          }, delay);
        };

        const openConnection = async (): Promise<boolean> => {
          const connection = await onConnect();
          if (!connection) {
            return socket.adapter.connected;
          }

          clearTimeout(timeout);
          websocket?.clearListeners();
          websocket?.close(1000);

          options = connection.adapterOptions;
          const url = getSocketUrl(connection.url, getQueryParams(connection.queryParams));
          const newWebsocket = createWebsocket(url, options);
          websocket = newWebsocket ?? undefined;

          if (!newWebsocket) {
            return false;
          }

          const isCurrent = () => websocket === newWebsocket;

          // Connection timeout - when the server does not answer in time, start over
          scheduleReconnect(socket.connectionTimeout);

          /**
           *  Mount listeners
           */

          newWebsocket.addEventListener("open", () => {
            if (!isCurrent()) {
              return;
            }
            clearTimeout(timeout);
            onConnected();
            onHeartbeat();
          });

          /** The transport is gone - report it and get the connection back unless it was closed normally */
          const onTransportClosed = (event: Pick<CloseEvent, "code"> & Event) => {
            clearTimeout(timeout);
            clearTimers();
            onDisconnected();
            const error = getSocketError(event);
            onError({ error: new Error(error) });

            // The connection was lost or closed by the server with an error - try to get it back
            if (event.code !== 1000) {
              scheduleReconnect();
            }
          };

          newWebsocket.addEventListener("close", (event) => {
            if (!isCurrent()) {
              return;
            }
            onTransportClosed(event);
          });

          // Node.js 22 reports a failed handshake with `error` only - no `close` follows and the transport stays
          // CONNECTING. Browsers set CLOSED before the error and send the close event, which handles it as usual.
          // Here the transport is detached and treated as an abnormally closed one (1006).
          newWebsocket.addEventListener("error", () => {
            if (!isCurrent() || newWebsocket.readyState !== WebsocketReadyState.CONNECTING) {
              return;
            }
            websocket = undefined;
            newWebsocket.clearListeners();
            try {
              newWebsocket.close();
            } catch {
              // Closing a transport that never connected may throw in some runtimes - it is detached already
            }
            onTransportClosed(Object.assign(new Event("close"), { code: 1006 }));
          });

          newWebsocket.addEventListener("message", (newEvent: MessageEvent<SocketData>) => {
            if (!isCurrent()) {
              return;
            }
            // Any frame proves the connection is alive, even the ones ignored by the decoder
            onHeartbeat();

            const message = decodeMessage(newEvent);
            if (message) {
              onEvent({ topic: message.topic, data: message.data, extra: newEvent });
            }
          });

          return new Promise((resolve) => {
            if (newWebsocket.readyState === WebsocketReadyState.OPEN) {
              // No open event follows, so the attempt timeout would reconnect a working connection
              clearTimeout(timeout);
              resolve(true);
              socket.adapter.setConnected(true);
              socket.adapter.setConnecting(false);
              return;
            }

            // Promise lifecycle
            const resolveConnected = () => {
              resolve(true);
              newWebsocket.removeEventListener("open", resolveConnected);
            };
            const resolveDisconnected = () => {
              resolve(false);
              newWebsocket.removeEventListener("close", resolveDisconnected);
            };
            const resolveError = () => {
              resolve(false);
              newWebsocket.removeEventListener("error", resolveError);
            };

            newWebsocket.addEventListener("open", resolveConnected, { disableCleanup: true });
            newWebsocket.addEventListener("close", resolveDisconnected, { disableCleanup: true });
            newWebsocket.addEventListener("error", resolveError, { disableCleanup: true });
          });
        };

        const connect = (): Promise<boolean> => {
          // Another attempt is already on its way (e.g. the automatic one) - resolve together with it
          if (socket.adapter.connecting && pendingConnection) {
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
         * whatever it reports later (close code, errors, late frames) does not reach the socket anymore,
         * so closing on purpose is never treated as a lost connection.
         */
        const closeConnection = async ({ manual }: { manual: boolean }): Promise<boolean> => {
          clearTimeout(timeout);
          clearTimers();

          const currentWebsocket = websocket;
          websocket = undefined;

          const wasActive = socket.adapter.connected || socket.adapter.connecting;
          onDisconnect();
          if (!manual) {
            // Closing the previous transport is a part of reconnecting - only `disconnect()` keeps the socket closed
            socket.adapter.setForceClosed(false);
          }
          if (wasActive) {
            onDisconnected();
          }

          if (!currentWebsocket || currentWebsocket.readyState === WebsocketReadyState.CLOSED) {
            return true;
          }

          return new Promise<boolean>((resolve) => {
            const resolveDisconnected = () => {
              resolve(true);
              currentWebsocket.removeEventListener("close", resolveDisconnected);
              currentWebsocket.removeEventListener("error", resolveDisconnected);
            };
            currentWebsocket.addEventListener("close", resolveDisconnected, { disableCleanup: true });
            // A transport that fails while closing may report only `error` (Node.js 22) - don't wait for a close
            currentWebsocket.addEventListener("error", resolveDisconnected, { disableCleanup: true });
            currentWebsocket.close(1000);
          });
        };

        /** Manual disconnect - the socket stays closed until `connect()` or `reconnect()` is called */
        const disconnect = (): Promise<boolean> => {
          return closeConnection({ manual: true });
        };

        const reconnect = async () => {
          // Reconnecting is a request to be connected, also after a manual disconnect
          socket.adapter.setForceClosed(false);

          await onReconnect({
            disconnect: () => closeConnection({ manual: false }),
            connect: async () => {
              // `disconnect()` called while the previous transport was closing wins over the reconnection
              if (socket.adapter.forceClosed) {
                socket.adapter.setReconnectionAttempts(0);
                return false;
              }
              return connect();
            },
          });
        };

        /** Creates the transport, reporting a failed attempt when the environment or the connection details are invalid */
        const createWebsocket = (url: string, adapterOptions: WebsocketAdapterOptionsType | EmptyTypes) => {
          try {
            const instance = getWebsocketAdapter(url, adapterOptions);
            if (!instance) {
              onConnectFailed({ error: new Error("WebSocket is not available in this environment") });
            }
            return instance;
          } catch (error) {
            onConnectFailed({ error: error as Error });
            return null;
          }
        };

        const clearTimers = () => {
          clearTimeout(pingTimer);
          clearTimeout(pongTimer);
        };

        /** Maps an incoming frame to the listener event, reporting decoder failures instead of throwing */
        const decodeMessage = (event: MessageEvent<SocketData>): WebsocketDecodedMessageType | null => {
          try {
            if (options?.decode) {
              return options.decode(event);
            }
            const { topic, data } = parseMessageEvent(event);
            return { topic, data };
          } catch (error) {
            onError({ error: error as Error });
            return null;
          }
        };

        /** Encodes and sends a message. Returns the error instead of throwing, so callers decide how to report it. */
        const sendEventMessage = ({ topic, payload }: Pick<EmitterInstance, "topic" | "payload">): Error | null => {
          if (!websocket) {
            return new Error("Cannot send event when connection is not open");
          }
          try {
            const frame = options?.encode
              ? options.encode({ topic, payload })
              : JSON.stringify({ topic, data: payload });
            websocket.send(frame);
            return null;
          } catch (error) {
            return error instanceof Error ? error : new Error(String(error));
          }
        };

        const onHeartbeat = () => {
          const {
            heartbeat = false,
            pingTimeout = Time.SEC * 5,
            pongTimeout = Time.SEC * 5,
            heartbeatMessage = "heartbeat",
          } = options ||
          /* istanbul ignore next */
          {};

          if (socket.adapter.connecting || !heartbeat) {
            return;
          }
          clearTimers();
          pingTimer = setTimeout(() => {
            const error = sendEventMessage({ topic: "heartbeat", payload: heartbeatMessage });
            if (error) {
              onError({ error });
            }
            pongTimer = setTimeout(() => {
              onHeartbeatTimeout();
            }, pongTimeout);
          }, pingTimeout);
        };

        /**
         * The server did not answer the ping - the connection is dead. On a dead connection the closing handshake
         * may take very long (or never finish), so the socket is marked as disconnected right away instead of
         * waiting for the `close` event of the transport.
         */
        const onHeartbeatTimeout = () => {
          const deadWebsocket = websocket;
          if (!deadWebsocket) {
            return;
          }
          websocket = undefined;
          clearTimers();
          deadWebsocket.close();
          onDisconnected();
          onError({ error: new Error("Heartbeat timeout - the server did not respond to the ping in time") });
          scheduleReconnect();
        };

        const listen = (
          listener: ListenerOfAdapter<WebsocketAdapterType>,
          callback: ListenerCallbackType<WebsocketAdapterType, any>,
        ) => {
          return onListen({ listener, callback });
        };

        const emit = async (emitter: EmitterInstance) => {
          const mappedEmitter = await onEmit({ emitter });
          if (!mappedEmitter) {
            return;
          }

          const error = sendEventMessage(mappedEmitter);
          if (error) {
            onEmitError({ emitter: mappedEmitter, error });
            onError({ error });
            return false;
          }
          return true;
        };

        // Initialize
        if (autoConnect) {
          connect();
        }

        const unmountOnline = socket.appManager.events.onOnline(() => {
          // A socket disconnected on purpose stays closed until `connect()` or `reconnect()` is called
          if (autoConnect && !socket.adapter.connected && !socket.adapter.forceClosed) {
            connect();
          }
        });

        return {
          connect,
          reconnect,
          disconnect,
          listen,
          emit,
          dispose: () => {
            unmountOnline();
          },
        };
      },
    );
