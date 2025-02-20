/* eslint-disable @typescript-eslint/no-use-before-define */
import { QueryParamsType, stringifyQueryParams, Time } from "@hyper-fetch/core";

import { EmitterInstance } from "emitter";
import { ExtendListener, ListenerCallbackType, ListenerInstance } from "listener";
import { SocketEvent, SocketData } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import { WebsocketAdapterOptionsType } from "./websocket-adapter.types";
import { getWebsocketAdapter } from "./websocket-adapter.utils";
import { getSocketUrl, parseMessageEvent } from "../utils";
import { getSocketError } from "../utils/socket.errors";
import { Socket } from "socket";

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
        const autoConnect = socket.adapter.adapterOptions?.autoConnect ?? true;

        let websocket: ReturnType<typeof getWebsocketAdapter> | undefined;

        let pingTimer: ReturnType<typeof setTimeout> | undefined;
        let pongTimer: ReturnType<typeof setTimeout> | undefined;

        const connect = async (): Promise<boolean> => {
          const url = getSocketUrl(socket.url, getQueryParams());
          const enabled = onConnect();
          if (!enabled) {
            return Promise.resolve(false);
          }

          websocket?.clearListeners();
          websocket?.close();

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
            return Promise.resolve(false);
          }

          // Clear listeners
          newWebsocket.clearListeners();

          // Reconnection timeout
          const timeout = setTimeout(() => {
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
            const error = getSocketError(event);

            onError({ error: new Error(error) });
            onDisconnected();
            clearTimers();
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
            return Promise.resolve(true);
          }
          const currentWebsocket = websocket;
          const promise = new Promise<boolean>((resolve) => {
            if (currentWebsocket.readyState === EventSource.CLOSED) {
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
          currentWebsocket.close();
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

        const sendEventMessage = (payload: SocketEvent): boolean => {
          if (websocket?.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify(payload));
            return true;
          }
          logger.error({
            type: "system",
            title: "Socket is not open",
            extra: {
              payload,
            },
          });
          return false;
        };

        const onHeartbeat = () => {
          const {
            heartbeat = false,
            pingTimeout = Time.SEC * 5,
            pongTimeout = Time.SEC * 5,
            heartbeatMessage = "heartbeat",
          } = socket.adapter.adapterOptions || {};

          if (socket.adapter.connecting || !heartbeat) return;
          clearTimers();
          pingTimer = setTimeout(() => {
            sendEventMessage({ topic: "heartbeat", data: heartbeatMessage });
            pongTimer = setTimeout(() => {
              websocket?.close();
            }, pongTimeout);
          }, pingTimeout);
        };

        const listen = (
          listener: ExtendListener<ListenerInstance, { socket: Socket<WebsocketAdapterType> }>,
          callback: ListenerCallbackType<WebsocketAdapterType, any>,
        ) => {
          return onListen({ listener, callback });
        };

        const emit = async (emitter: EmitterInstance, data: any) => {
          const instance = await onEmit({ emitter });

          if (!instance) return;

          return sendEventMessage({ topic: instance.topic, data });
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
