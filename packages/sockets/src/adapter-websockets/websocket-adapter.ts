/* eslint-disable @typescript-eslint/no-use-before-define */
import type { EmptyTypes, QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams, Time } from "@hyper-fetch/core";
import type { SocketData } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import type { EmitterInstance } from "emitter";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";

import { getSocketUrl, parseMessageEvent } from "../utils";
import { getSocketError } from "../utils/socket.errors";
import type { WebsocketAdapterOptionsType } from "./websocket-adapter.types";
import { getWebsocketAdapter } from "./websocket-adapter.utils";

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
        onConnected,
        onDisconnected,
        onError,
        onEvent,
      }) => {
        const autoConnect =
          typeof socket.adapter.adapterOptions?.autoConnect === "boolean"
            ? socket.adapter.adapterOptions?.autoConnect
            : true;

        let websocket: ReturnType<typeof getWebsocketAdapter> | undefined;
        // Options of the current connection attempt (after onConnect interceptors)
        let options: WebsocketAdapterOptionsType | EmptyTypes = socket.adapter.adapterOptions;

        let pingTimer: ReturnType<typeof setTimeout> | undefined;
        let pongTimer: ReturnType<typeof setTimeout> | undefined;
        let timeout: ReturnType<typeof setTimeout> | undefined;

        const connect = async (): Promise<boolean> => {
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
          websocket = newWebsocket;

          if (!newWebsocket) {
            return false;
          }

          // Clear listeners
          newWebsocket.clearListeners();

          // Reconnection timeout
          timeout = setTimeout(() => {
            reconnect();
          }, socket.reconnectTime);

          /**
           *  Mount listeners
           */

          newWebsocket.addEventListener("open", () => {
            clearTimeout(timeout);
            onConnected();
            onHeartbeat();
          });

          newWebsocket.addEventListener("close", (event) => {
            clearTimeout(timeout);
            onDisconnected();
            clearTimers();
            const error = getSocketError(event);
            onError({ error: new Error(error) });

            // If close was not by calling disconnect method, reconnect
            if (event.code !== 1000) {
              timeout = setTimeout(() => {
                reconnect();
              }, socket.reconnectTime);
            }
          });

          newWebsocket.addEventListener("message", (newEvent: MessageEvent<SocketData>) => {
            const { topic, data, event } = parseMessageEvent(newEvent);

            onEvent({ topic, data, extra: event });
            onHeartbeat();
          });

          return new Promise((resolve) => {
            if (newWebsocket.readyState === WebSocket.OPEN) {
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

        const disconnect = async (): Promise<boolean> => {
          // Manual disconnect cancels a scheduled automatic reconnect
          clearTimeout(timeout);

          const currentWebsocket = websocket;
          const hasTransport = currentWebsocket && currentWebsocket.readyState !== WebSocket.CLOSED;

          if (!hasTransport) {
            // Nothing to close - only a connection attempt may still be preparing (onConnect), cancel it
            const wasConnecting = socket.adapter.connecting;
            onDisconnect();
            if (wasConnecting) {
              onDisconnected();
            }
            return true;
          }

          const promise = new Promise<boolean>((resolve) => {
            const resolveDisconnected = () => {
              resolve(true);
              currentWebsocket.removeEventListener("close", resolveDisconnected);
            };
            currentWebsocket.addEventListener("close", resolveDisconnected, { disableCleanup: true });
          });

          onDisconnect();
          currentWebsocket.close(1000);
          clearTimers();

          return promise;
        };

        const reconnect = async () => {
          await onReconnect({ disconnect, connect });
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

        const sendEventMessage = ({ topic, payload }: Pick<EmitterInstance, "topic" | "payload">) => {
          if (!websocket) {
            return false;
          }
          websocket!.send(JSON.stringify({ topic, data: payload }));
          return true;
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
            sendEventMessage({ topic: "heartbeat", payload: heartbeatMessage });
            pongTimer = setTimeout(() => {
              // this should trigger reconnect
              websocket?.close();
            }, pongTimeout);
          }, pingTimeout);
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

          return sendEventMessage(mappedEmitter);
        };

        // Initialize
        if (autoConnect) {
          connect();
        }

        socket.appManager.events.onOnline(() => {
          if (autoConnect && !socket.adapter.connected) {
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
