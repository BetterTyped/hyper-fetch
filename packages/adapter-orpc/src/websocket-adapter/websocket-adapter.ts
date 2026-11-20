/* eslint-disable @typescript-eslint/no-use-before-define */
import type { QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams } from "@hyper-fetch/core";
import {
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
      const {
        socket,
        adapter,
        getQueryParams,
        onConnect,
        onConnectFailed,
        onReconnect,
        onDisconnect,
        onConnected,
        onDisconnected,
        onError,
      } = bindings;

      const autoConnect = adapter.adapterOptions?.autoConnect ?? true;

      // The transport in use. Events of any other instance (replaced or closed on purpose) are ignored.
      let websocket: WebSocket | undefined;
      // Options of the current connection (after onConnect interceptors)
      let options: OrpcWebsocketAdapterOptionsType | undefined;
      // Connection attempt in progress - concurrent `connect()` calls join it
      let pendingConnection: Promise<boolean> | undefined;
      // Connection timeout while connecting, reconnection delay after the connection was lost
      let timeout: ReturnType<typeof setTimeout> | undefined;
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

      /** Starts over after `delay` - the connection timeout while connecting, the reconnect delay after a loss */
      const scheduleReconnect = (delay = socket.reconnectTime) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          reconnect();
        }, delay);
      };

      const openConnection = async (): Promise<boolean> => {
        const connection = await onConnect();
        if (!connection) {
          return adapter.connected;
        }

        clearTimeout(timeout);
        options = connection.adapterOptions;
        const url = getSocketUrl(connection.url, getQueryParams(connection.queryParams));

        const WebSocketConstructor = getWebsocketConstructor(options);
        if (!WebSocketConstructor) {
          onConnectFailed({ error: new Error("WebSocket is not available in this environment") });
          return false;
        }

        let instance: WebSocket;
        try {
          instance = new WebSocketConstructor(url, options?.protocols);
        } catch (error) {
          onConnectFailed({ error: toError(error) });
          return false;
        }
        // Binary frames are read synchronously, so messages keep their order
        instance.binaryType = "arraybuffer";
        websocket = instance;
        const isCurrent = () => websocket === instance;

        // Connection timeout - when the server does not answer in time, start over
        scheduleReconnect(socket.connectionTimeout);

        return new Promise<boolean>((resolve) => {
          // A closed instance never opens, so the open event always belongs to the current one
          instance.addEventListener("open", () => {
            clearTimeout(timeout);
            onConnected();
            [...subscriptions.values()].forEach((subscription) => {
              // A listener added by an `onConnected` callback is running already
              if (!subscription.transport) {
                startSubscription(subscription);
              }
            });
            resolve(true);
          });

          /** The transport is gone - report it and get the connection back unless it was closed normally */
          const onTransportClosed = (event: Pick<CloseEvent, "code"> & Event) => {
            websocket = undefined;
            clearTimeout(timeout);
            releaseAll();
            onDisconnected();
            onError({ error: new Error(getSocketError(event)) });

            // The connection was lost or closed by the server with an error - try to get it back
            if (event.code !== 1000) {
              scheduleReconnect();
            }
          };

          instance.addEventListener("close", (event) => {
            resolve(false);
            if (!isCurrent()) {
              return;
            }
            onTransportClosed(event);
          });

          // Node.js 22 reports a failed handshake with `error` only - no `close` follows and the transport stays
          // CONNECTING. Browsers set CLOSED before the error and send the close event, which handles it as usual.
          // Here the transport is detached and treated as an abnormally closed one (1006).
          instance.addEventListener("error", () => {
            if (!isCurrent() || instance.readyState !== WebsocketReadyState.CONNECTING) {
              return;
            }
            resolve(false);
            try {
              instance.close();
            } catch {
              // Closing a transport that never connected may throw in some runtimes - it is detached already
            }
            onTransportClosed(Object.assign(new Event("close"), { code: 1006 }));
          });

          instance.addEventListener("message", (event) => {
            if (isCurrent()) {
              handleMessage(event.data);
            }
          });
        });
      };

      const connect = (): Promise<boolean> => {
        // Another attempt is already on its way (e.g. the automatic one) - resolve together with it
        if (adapter.connecting && pendingConnection) {
          return pendingConnection;
        }

        const attempt = openConnection();
        pendingConnection = attempt;
        const release = () => {
          if (pendingConnection === attempt) {
            pendingConnection = undefined;
          }
        };
        attempt.then(release, release);

        return attempt;
      };

      /**
       * Closes the transport and resets the connection state. The server cancels every subscription of the
       * connection, the listeners stay registered and keep the id of their last event for the next connection.
       */
      const closeConnection = async ({ manual }: { manual: boolean }): Promise<boolean> => {
        clearTimeout(timeout);

        const current = websocket;
        websocket = undefined;
        releaseAll();

        const wasActive = adapter.connected || adapter.connecting;
        onDisconnect();
        if (!manual) {
          // Closing the previous transport is a part of reconnecting - only `disconnect()` keeps the socket closed
          adapter.setForceClosed(false);
        }
        if (wasActive) {
          onDisconnected();
        }

        if (!current) {
          return true;
        }
        return new Promise<boolean>((resolve) => {
          current.addEventListener("close", () => resolve(true), { once: true });
          // A transport that fails while closing may report only `error` (Node.js 22) - don't wait for a close
          current.addEventListener("error", () => resolve(true), { once: true });
          current.close(1000);
        });
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
            // `disconnect()` called while the previous transport was closing wins over the reconnection
            if (adapter.forceClosed) {
              adapter.setReconnectionAttempts(0);
              return false;
            }
            return connect();
          },
        });
      };

      // Throwing synchronously makes `emitter.emit()` fail right at the call site, the same as in the
      // Server-Sent Events adapter
      const emit = () => {
        throw new Error("Cannot emit events in the oRPC WebSocket adapter, it only receives events of subscriptions");
      };

      // Initialize
      if (autoConnect) {
        connect();
      }

      const unmountOnline = socket.appManager.events.onOnline(() => {
        // A socket disconnected on purpose stays closed until `connect()` or `reconnect()` is called
        if (autoConnect && !adapter.connected && !adapter.forceClosed) {
          connect();
        }
      });

      return {
        connect,
        reconnect,
        disconnect,
        listen: subscriptions.listen,
        emit,
        // Nothing of this connector outlives the socket - no online subscription, no pending reconnect
        dispose: () => {
          unmountOnline();
          clearTimeout(timeout);
        },
      };
    });
};
