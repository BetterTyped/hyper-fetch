/* eslint-disable @typescript-eslint/no-use-before-define */
import type { QueryParamsType } from "@hyper-fetch/core";
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
        logger,
        getQueryParams,
        onConnect,
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

        let pingTimer: ReturnType<typeof setTimeout> | undefined;
        let pongTimer: ReturnType<typeof setTimeout> | undefined;
        let timeout: ReturnType<typeof setTimeout> | undefined;

        const connect = async (): Promise<boolean> => {
          const url = getSocketUrl(socket.url, getQueryParams());
          const enabled = onConnect();
          if (!enabled) {
            return false;
          }

          clearTimeout(timeout);
          websocket?.clearListeners();
          websocket?.close(1000);

          const newWebsocket = getWebsocketAdapter(url, socket.adapter.adapterOptions);
          websocket = newWebsocket;

          // Make sure we picked good environment
          if (!newWebsocket) {
            logger.error({
              title: "Cannot connect to websocket",
              type: "system",
              extra: {
                websocket,
              },
            });
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
          if (!websocket) {
            socket.adapter.setConnected(false);
            socket.adapter.setConnecting(false);
            return true;
          }
          const currentWebsocket = websocket;
          const promise = new Promise<boolean>((resolve) => {
            if (currentWebsocket.readyState === WebSocket.CLOSED) {
              resolve(true);
              socket.adapter.setConnected(false);
              socket.adapter.setConnecting(false);
              return;
            }

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

        const clearTimers = () => {
          clearTimeout(pingTimer);
          clearTimeout(pongTimer);
        };

        const sendEventMessage = ({ topic, payload }: Pick<EmitterInstance, "topic" | "payload">) => {
          if (!websocket) {return false;}
          websocket!.send(JSON.stringify({ topic, data: payload }));
          return true;
        };

        const onHeartbeat = () => {
          const {
            heartbeat = false,
            pingTimeout = Time.SEC * 5,
            pongTimeout = Time.SEC * 5,
            heartbeatMessage = "heartbeat",
          } = socket.adapter.adapterOptions ||
          /* istanbul ignore next */
          {};

          if (socket.adapter.connecting || !heartbeat) {return;}
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
          if (!mappedEmitter) {return;}

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
