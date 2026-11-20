/* eslint-disable @typescript-eslint/no-use-before-define */
import type { QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams } from "@hyper-fetch/core";
import {
  createReconnectingConnection,
  getSocketError,
  getSocketUrl,
  getWebsocketConstructor,
  SocketAdapter,
  WebsocketReadyState,
} from "@hyper-fetch/sockets";
import { isORPCErrorStatus } from "@orpc/client";

import { createOrpcSerializer } from "../adapter/adapter.utils";
import { createOrpcSubscriptions } from "../socket/socket.subscriptions";
import type { OrpcSocketAdapterConfigType, OrpcSocketExtraType, OrpcSubscriptionType } from "../socket/socket.types";
import { getNotIteratorError, getOrpcResponseError, OrpcSocketError, toError } from "../socket/socket.utils";
import type { OrpcWebsocketAdapterOptionsType, OrpcWebsocketAdapterType } from "./websocket-adapter.types";
import type { OrpcPeerResponseMessageType } from "./websocket-adapter.utils";
import {
  decodeOrpcResponseMessage,
  encodeOrpcAbortMessage,
  encodeOrpcRequestMessage,
  isOrpcEventIteratorResponse,
} from "./websocket-adapter.utils";

/** Server side of one subscription - its request on the connection */
type WebsocketTransportType = { id: string; websocket: WebSocket };

type WebsocketSubscriptionType = OrpcSubscriptionType<WebsocketTransportType>;

/**
 * Socket adapter for the event iterators of oRPC over one WebSocket connection. It speaks the protocol of the
 * `RPCHandler` of `@orpc/server/ws` (the same as `@orpc/client/websocket`): every subscription is a request on the
 * shared connection, and its events arrive as messages of that request.
 *
 * The adapter only subscribes. Emitting, and calling regular procedures, is not supported - use `OrpcAdapter` for
 * them. Listeners of the same procedure and input share one request, the last one to unsubscribe aborts it.
 * After a reconnect every running subscription starts again with the id of its last event. A subscription starts
 * (`onStart`) when the server answers with the event iterator, and ends (`onEnd`) when the iterator finishes, fails
 * or the server rejects the call.
 *
 * @example
 * const socket = new Socket({ url: "ws://localhost:3000", adapter: OrpcWebsocketAdapter() });
 * const sdk = createSocketSdk<typeof socket, OrpcSocketSchema<typeof router>>(socket, { camelCaseToKebabCase: false });
 *
 * sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data }) => console.log(data));
 */
export const OrpcWebsocketAdapter = ({
  customJsonSerializers,
}: OrpcSocketAdapterConfigType = {}): OrpcWebsocketAdapterType => {
  const serializer = createOrpcSerializer(customJsonSerializers);

  return new SocketAdapter<
    OrpcSocketExtraType,
    OrpcWebsocketAdapterOptionsType,
    undefined,
    undefined,
    QueryParamsType | string,
    typeof stringifyQueryParams
  >({ name: "orpc-websocket", confirmsSubscriptions: true })
    .setQueryParamsMapper(stringifyQueryParams)
    .setConnector((bindings) => {
      const { adapter, getQueryParams, onConnectFailed, onError } = bindings;

      // The transport of the current attempt - `undefined` once it is detached
      let websocket: WebSocket | undefined;
      // Options of the current connection (after onConnect interceptors)
      let options: OrpcWebsocketAdapterOptionsType | undefined;
      // Request ids are never reused, so a late message of a stopped request can't reach a new one
      let lastRequestId = 0;
      // Running requests of the current connection
      const requests = new Map<string, WebsocketSubscriptionType>();

      const subscriptions = createOrpcSubscriptions<OrpcWebsocketAdapterType, WebsocketTransportType>({
        bindings,
        serializer,
        start: (subscription) => startSubscription(subscription),
        stop: (subscription) => stopSubscription(subscription),
        release: (subscription) => {
          releaseSubscription(subscription);
        },
      });

      /** Sends a frame of the subscription, reporting the failure instead of throwing */
      const sendFrame = (subscription: WebsocketSubscriptionType, target: WebSocket, frame: string): boolean => {
        try {
          target.send(frame);
          return true;
        } catch (error) {
          subscriptions.report(subscription, error);
          return false;
        }
      };

      const startSubscription = (subscription: WebsocketSubscriptionType) => {
        // Not connected - the subscription starts on connect
        const current = websocket;
        if (!current || !adapter.connected) {
          return;
        }

        lastRequestId += 1;
        const id = lastRequestId.toString(36);
        const { lastEventId } = subscription;
        // The server reads it as `lastEventId` and can resume where the previous connection stopped
        const headers =
          lastEventId === undefined ? { ...options?.headers } : { ...options?.headers, "last-event-id": lastEventId };

        let frame: string;
        try {
          frame = encodeOrpcRequestMessage({
            id,
            topic: subscription.topic,
            payload: subscription.payload,
            headers,
            serializer,
          });
        } catch (error) {
          // An input that can't be encoded never will be, so the subscription is over
          subscriptions.end(subscription, error);
          return;
        }

        if (sendFrame(subscription, current, frame)) {
          subscription.transport = { id, websocket: current };
          requests.set(id, subscription);
        }
      };

      /** Forgets the request of the subscription. Messages that still come for it are ignored. */
      const releaseSubscription = (subscription: WebsocketSubscriptionType) => {
        const { transport } = subscription;
        subscription.transport = undefined;
        subscription.started = false;
        if (transport) {
          requests.delete(transport.id);
        }
        return transport;
      };

      const stopSubscription = (subscription: WebsocketSubscriptionType) => {
        const transport = releaseSubscription(subscription);
        if (transport) {
          sendFrame(subscription, transport.websocket, encodeOrpcAbortMessage(transport.id));
        }
      };

      /** The connection is gone and the server dropped every request with it */
      const releaseAll = () => {
        requests.forEach((subscription) => {
          subscription.transport = undefined;
          subscription.started = false;
        });
        requests.clear();
      };

      const handleResponse = (
        subscription: WebsocketSubscriptionType,
        { status, headers, body }: Extract<OrpcPeerResponseMessageType, { type: "response" }>,
      ) => {
        // The server rejected the call before the iterator started, e.g. a failed input validation
        if (isORPCErrorStatus(status)) {
          subscriptions.end(subscription, getOrpcResponseError({ status, body, serializer }));
          return;
        }
        if (!isOrpcEventIteratorResponse(headers)) {
          subscriptions.end(subscription, getNotIteratorError(subscription.topic));
          return;
        }
        // The response of an event iterator - the subscription runs
        subscriptions.confirm(subscription);
      };

      const handleMessage = (frame: unknown) => {
        let message: OrpcPeerResponseMessageType;
        try {
          message = decodeOrpcResponseMessage(frame);
        } catch (error) {
          // A frame that can't be read can't be matched to its subscription either
          onError({ error: new OrpcSocketError({ cause: error, topic: null, payload: undefined }) });
          return;
        }

        // Late messages of stopped requests, and the abort the server sends for iterators in the input, are ignored
        const subscription = requests.get(message.id);
        if (!subscription || message.type === "abort") {
          return;
        }

        if (message.type === "response") {
          handleResponse(subscription, message);
          return;
        }
        // `done` and `error` end the subscription there
        subscriptions.receive(subscription, message.event);
      };

      /** Creates the transport, reporting a failed attempt when the environment or the connection details are invalid */
      const createWebsocket = (url: string): WebSocket | null => {
        const WebSocketConstructor = getWebsocketConstructor(options);
        if (!WebSocketConstructor) {
          onConnectFailed({ error: new Error("WebSocket is not available in this environment") });
          return null;
        }
        try {
          return new WebSocketConstructor(url, options?.protocols);
        } catch (error) {
          onConnectFailed({ error: toError(error) });
          return null;
        }
      };

      /**
       * Closes a detached transport. The server cancels every subscription of the connection, the listeners stay
       * registered and keep the id of their last event for the next connection. Resolves on the close - or on an
       * error, as a transport that fails while closing may report only `error` (Node.js 22).
       */
      const closeWebsocket = (transport: WebSocket): Promise<void> => {
        if (websocket === transport) {
          websocket = undefined;
          releaseAll();
        }
        if (transport.readyState === WebsocketReadyState.CLOSED) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          transport.addEventListener("close", () => resolve(), { once: true });
          transport.addEventListener("error", () => resolve(), { once: true });
          try {
            transport.close(1000);
          } catch {
            // Closing a transport that never connected may throw in some runtimes - it is detached already
            resolve();
          }
        });
      };

      const connection = createReconnectingConnection({
        bindings,
        autoConnect: adapter.adapterOptions?.autoConnect ?? true,
        open: (attempt) => {
          options = attempt.connection.adapterOptions;
          const url = getSocketUrl(attempt.connection.url, getQueryParams(attempt.connection.queryParams));
          const transport = createWebsocket(url);
          if (!transport) {
            return null;
          }
          // Binary frames are read synchronously, so messages keep their order
          transport.binaryType = "arraybuffer";
          websocket = transport;

          /** The transport is gone - report it and let the engine decide about the next attempt */
          const onTransportClosed = (event: Pick<CloseEvent, "code"> & Partial<Pick<CloseEvent, "reason">> & Event) => {
            // The socket is reported as disconnected first, then the error that explains why
            attempt.lost({ code: event.code, reason: event.reason || undefined });
            onError({ error: new Error(getSocketError(event)) });
          };

          transport.addEventListener("open", () => {
            if (!attempt.isCurrent()) {
              return;
            }
            attempt.ready();
            subscriptions.values().forEach((subscription) => {
              // A listener added by an `onConnected` callback is running already
              if (!subscription.transport) {
                startSubscription(subscription);
              }
            });
          });

          transport.addEventListener("close", (event) => {
            if (attempt.isCurrent()) {
              onTransportClosed(event);
            }
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

          transport.addEventListener("message", (event) => {
            if (attempt.isCurrent()) {
              handleMessage(event.data);
            }
          });

          return { close: () => closeWebsocket(transport) };
        },
      });

      // Throwing synchronously makes `emitter.emit()` fail right at the call site, the same as in the
      // Server-Sent Events adapter
      const emit = () => {
        throw new Error("Cannot emit events in the oRPC WebSocket adapter, it only receives events of subscriptions");
      };

      return {
        connect: connection.connect,
        reconnect: connection.reconnect,
        disconnect: connection.disconnect,
        listen: subscriptions.listen,
        emit,
        dispose: connection.dispose,
      };
    });
};
