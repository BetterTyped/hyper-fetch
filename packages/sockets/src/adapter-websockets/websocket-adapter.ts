/* eslint-disable @typescript-eslint/no-use-before-define */
import type { EmptyTypes, QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams, Time } from "@hyper-fetch/core";
import type { SocketData } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import type { ConnectionLossType } from "connection";
import { createReconnectingConnection } from "connection";
import type { EmitterInstance } from "emitter";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";

import { getSocketUrl, parseMessageEvent } from "../utils";
import { getSocketError } from "../utils/socket.errors";
import type { WebsocketAdapterOptionsType, WebsocketDecodedMessageType } from "./websocket-adapter.types";
import { getWebsocketAdapter, WebsocketReadyState } from "./websocket-adapter.utils";

type HyperFetchWebsocketType = NonNullable<ReturnType<typeof getWebsocketAdapter>>;

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
    .setConnector((bindings) => {
      const { socket, getQueryParams, onConnectFailed, onListen, onEmit, onEmitError, onError, onEvent } = bindings;

      // The transport of the current attempt - `undefined` once it is detached
      let websocket: HyperFetchWebsocketType | undefined;
      // Options of the current connection attempt (after onConnect interceptors)
      let options: WebsocketAdapterOptionsType | EmptyTypes = socket.adapter.adapterOptions;
      // Ends the current attempt - the heartbeat uses it when the server stops answering
      let loseCurrent: ((loss: ConnectionLossType) => void) | undefined;

      let pingTimer: ReturnType<typeof setTimeout> | undefined;
      let pongTimer: ReturnType<typeof setTimeout> | undefined;

      const clearTimers = () => {
        clearTimeout(pingTimer);
        clearTimeout(pongTimer);
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

      /**
       * Closes a detached transport. Resolves on its close - or on an error, as a transport that fails while closing
       * may report only `error` (Node.js 22). The error listener also keeps such a late error from going unhandled.
       *
       * The listeners of the transport are kept: the engine ignores whatever a detached transport reports, and a
       * WebSocket wrapped by a library (msw forwards unmocked connections with listeners of its own on the instance)
       * would never close the real connection without them.
       */
      const closeWebsocket = (transport: HyperFetchWebsocketType): Promise<void> => {
        if (websocket === transport) {
          websocket = undefined;
          loseCurrent = undefined;
          clearTimers();
        }
        if (transport.readyState === WebsocketReadyState.CLOSED) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          const resolveClosed = () => {
            resolve();
            transport.removeEventListener("close", resolveClosed);
            transport.removeEventListener("error", resolveClosed);
          };
          transport.addEventListener("close", resolveClosed, { disableCleanup: true });
          transport.addEventListener("error", resolveClosed, { disableCleanup: true });
          try {
            transport.close(1000);
          } catch {
            // Closing a transport that never connected may throw in some runtimes - it is detached already
            resolveClosed();
          }
        });
      };

      const connection = createReconnectingConnection({
        bindings,
        autoConnect: socket.adapter.adapterOptions?.autoConnect ?? true,
        open: (attempt) => {
          options = attempt.connection.adapterOptions;
          const url = getSocketUrl(attempt.connection.url, getQueryParams(attempt.connection.queryParams));
          const transport = createWebsocket(url, options);
          if (!transport) {
            return null;
          }
          websocket = transport;

          /** The transport is gone - report it and let the engine decide about the next attempt */
          const onTransportClosed = (event: Pick<CloseEvent, "code"> & Partial<Pick<CloseEvent, "reason">> & Event) => {
            clearTimers();
            const error = new Error(getSocketError(event));
            // The socket is reported as disconnected first, then the error that explains why
            attempt.lost({ code: event.code, reason: event.reason || undefined });
            onError({ error });
          };

          loseCurrent = (loss) => {
            if (attempt.isCurrent()) {
              attempt.lost(loss);
            }
          };

          transport.addEventListener("open", () => {
            if (!attempt.isCurrent()) {
              return;
            }
            attempt.ready();
            // A connected callback may have closed the connection already
            if (attempt.isCurrent()) {
              onHeartbeat();
            }
          });

          transport.addEventListener("close", (event) => {
            if (!attempt.isCurrent()) {
              return;
            }
            onTransportClosed(event);
          });

          // Node.js 22 reports a failed handshake with `error` only - no `close` follows and the transport stays
          // CONNECTING. Browsers set CLOSED before the error and send the close event, which handles it as usual.
          // Here it is treated as an abnormally closed transport (1006).
          transport.addEventListener("error", () => {
            if (!attempt.isCurrent() || transport.readyState !== WebsocketReadyState.CONNECTING) {
              return;
            }
            onTransportClosed(Object.assign(new Event("close"), { code: 1006 }));
          });

          transport.addEventListener("message", (newEvent: MessageEvent<SocketData>) => {
            if (!attempt.isCurrent()) {
              return;
            }
            // Any frame proves the connection is alive, even the ones ignored by the decoder
            onHeartbeat();

            const message = decodeMessage(newEvent);
            if (message) {
              onEvent({ topic: message.topic, data: message.data, extra: newEvent });
            }
          });

          // No open event follows a transport that is open already
          if (transport.readyState === WebsocketReadyState.OPEN) {
            attempt.ready();
          }

          return { close: () => closeWebsocket(transport) };
        },
      });

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
          const frame = options?.encode ? options.encode({ topic, payload }) : JSON.stringify({ topic, data: payload });
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
       * The server did not answer the ping - the connection is dead. On a dead connection the closing handshake may
       * take very long (or never finish), so the engine detaches the transport right away instead of waiting for its
       * `close` event.
       */
      const onHeartbeatTimeout = () => {
        const error = new Error("Heartbeat timeout - the server did not respond to the ping in time");
        // The socket is reported as disconnected first, then the error that explains why
        loseCurrent?.({ error });
        onError({ error });
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

      return {
        connect: connection.connect,
        reconnect: connection.reconnect,
        disconnect: connection.disconnect,
        listen,
        emit,
        dispose: () => {
          connection.dispose();
          clearTimers();
        },
      };
    });
