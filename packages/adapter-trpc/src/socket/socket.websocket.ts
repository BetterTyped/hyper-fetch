/* eslint-disable @typescript-eslint/no-use-before-define */
import type { EmptyTypes, QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams } from "@hyper-fetch/core";
import {
  SocketAdapter,
  WebsocketReadyState,
  getSocketError,
  getSocketUrl,
  getWebsocketConstructor,
} from "@hyper-fetch/sockets";

import type { TrpcAdapterOptionsType } from "../adapter/adapter.types";
import { TrpcKeepAliveFrames, defaultKeepAlive } from "./socket.constants";
import type { TrpcSubscriptionType } from "./socket.subscriptions";
import { createTrpcSubscriptions } from "./socket.subscriptions";
import type { TrpcSocketExtraType, TrpcWebsocketAdapterOptionsType, TrpcWebsocketAdapterType } from "./socket.types";
import { TrpcSocketError, deserializeTrpcOutput, getMalformedMessageError, isRecord, toError } from "./socket.utils";

/** The server reads the connection params from the first message only when the url asks for it */
const getWebsocketUrl = (url: string, options: TrpcWebsocketAdapterOptionsType | EmptyTypes) => {
  if (!options?.connectionParams) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}connectionParams=1`;
};

/**
 * Socket adapter for tRPC subscriptions over WebSocket. It speaks the protocol of `wsLink` and
 * `applyWSSHandler` from `@trpc/server/adapters/ws`.
 *
 * Every procedure called with one input is one server subscription, shared by the listeners with that input.
 * Subscriptions started before the connection opens wait for it, and after a reconnect they are restarted with
 * the id of the last `tracked()` event, so the server can resume. Queries and mutations are not supported - `emit`
 * throws.
 *
 * @example
 * const socket = new Socket({ url: "ws://localhost:3001", adapter: TrpcWebsocketAdapter({ transformer: superjson }) });
 * const api = createSocketSdk<typeof socket, TrpcSocketSchema<AppRouter>>(socket, { camelCaseToKebabCase: false });
 *
 * api.user.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data, extra }) => {});
 */
export const TrpcWebsocketAdapter = ({ transformer }: TrpcAdapterOptionsType = {}): TrpcWebsocketAdapterType =>
  new SocketAdapter<
    TrpcSocketExtraType,
    TrpcWebsocketAdapterOptionsType,
    undefined,
    undefined,
    QueryParamsType | string,
    typeof stringifyQueryParams
  >({
    name: "trpc-websocket",
    // The server confirms every subscription with `started` and ends it with `stopped` or an error
    confirmsSubscriptions: true,
  })
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
      // Options of the current connection attempt (after onConnect interceptors)
      let options: TrpcWebsocketAdapterOptionsType | EmptyTypes = adapter.adapterOptions;
      // Connection attempt in progress - concurrent `connect()` calls join it
      let pendingConnection: Promise<boolean> | undefined;

      let pingTimer: ReturnType<typeof setTimeout> | undefined;
      let pongTimer: ReturnType<typeof setTimeout> | undefined;
      // Connection timeout while connecting, reconnection delay after the connection was lost
      let timeout: ReturnType<typeof setTimeout> | undefined;

      // Ids are never reused, so a late message of a stopped subscription can't reach a new one
      let lastRequestId = 0;
      // Subscriptions running on the current connection, by their request id
      const running = new Map<unknown, TrpcSubscriptionType>();
      const requestIds = new Map<TrpcSubscriptionType, number>();

      const subscriptions = createTrpcSubscriptions({
        bindings,
        transformer,
        onStart: (subscription) => startSubscription(subscription),
        onStop: (subscription) => stopSubscription(subscription),
      });

      /** Sends a frame. Returns the error instead of throwing, so callers decide how to report it. */
      const send = (frame: string): Error | null => {
        try {
          // Frames are sent only while there is a transport - a closed one throws and the error is returned
          websocket?.send(frame);
          return null;
        } catch (error) {
          return toError(error);
        }
      };

      const sendOrReport = (frame: string) => {
        const error = send(frame);
        if (error) {
          onError({ error });
        }
        return !error;
      };

      /**
       * Subscriptions
       */

      const startSubscription = (subscription: TrpcSubscriptionType) => {
        // Not connected yet - every subscription is started when the connection opens
        if (!websocket || !adapter.connected) {
          return;
        }
        lastRequestId += 1;
        const id = lastRequestId;
        const message = {
          id,
          method: "subscription",
          params: {
            path: subscription.path,
            input: subscription.input,
            lastEventId: subscription.lastEventId ?? undefined,
          },
        };
        if (sendOrReport(JSON.stringify(message))) {
          running.set(id, subscription);
          requestIds.set(subscription, id);
        }
      };

      /** The server forgets the subscription - after `stopped`, an error or when the connection closes */
      const forget = (subscription: TrpcSubscriptionType) => {
        running.delete(requestIds.get(subscription));
        requestIds.delete(subscription);
      };

      /** The connection is gone, and the server stopped every subscription of it - they start again on reconnect */
      const forgetAll = () => {
        running.forEach(subscriptions.unconfirm);
        running.clear();
        requestIds.clear();
      };

      const stopSubscription = (subscription: TrpcSubscriptionType) => {
        const id = requestIds.get(subscription);
        if (id === undefined) {
          return;
        }
        forget(subscription);
        sendOrReport(JSON.stringify({ id, method: "subscription.stop" }));
      };

      /** The server ended the subscription - with `stopped` (`error: null`) or an error */
      const endSubscription = (subscription: TrpcSubscriptionType, error: Error | null) => {
        forget(subscription);
        if (error) {
          onError({ error });
        }
        subscriptions.end(subscription, error);
      };

      /**
       * Messages
       */

      const onServerError = (message: Record<string, unknown>) => {
        const subscription = running.get(message.id);

        let failure: Error;
        try {
          const shape = deserializeTrpcOutput(message.error, transformer);
          failure = new TrpcSocketError({ shape, topic: subscription?.topic ?? null, payload: subscription?.payload });
        } catch (error) {
          failure = getMalformedMessageError(error);
        }

        // Without a known id the server rejected the whole connection, e.g. `createContext` threw. That is reported,
        // but it does not end the subscriptions.
        if (subscription) {
          endSubscription(subscription, failure);
        } else {
          onError({ error: failure });
        }
      };

      const onServerResult = (id: unknown, result: Record<string, unknown>) => {
        const subscription = running.get(id);
        // Late messages of a subscription stopped by the client
        if (!subscription) {
          return;
        }

        switch (result.type) {
          case "started": {
            subscriptions.confirm(subscription);
            return;
          }
          case "stopped": {
            endSubscription(subscription, null);
            return;
          }
          case "data": {
            let output: unknown;
            try {
              output = deserializeTrpcOutput(result.data, transformer);
            } catch (error) {
              onError({ error: getMalformedMessageError(error) });
              return;
            }
            // Tracked events come with the id, and the data is sent as `{ id, data }`
            const eventId = result.id === undefined ? null : String(result.id);
            const data = eventId !== null && isRecord(output) ? output.data : output;
            subscriptions.deliver(subscription, { data, eventId });
            return;
          }
          default: {
            onError({ error: getMalformedMessageError(result) });
          }
        }
      };

      const onMessage = (event: MessageEvent) => {
        // Any frame proves the connection is alive
        onHeartbeat();

        if (event.data === TrpcKeepAliveFrames.PING) {
          sendOrReport(TrpcKeepAliveFrames.PONG);
          return;
        }
        if (event.data === TrpcKeepAliveFrames.PONG) {
          return;
        }

        let message: unknown;
        try {
          message = JSON.parse(event.data);
        } catch (error) {
          onError({ error: getMalformedMessageError(error) });
          return;
        }

        if (!isRecord(message)) {
          onError({ error: getMalformedMessageError(message) });
          return;
        }
        // The server asks the clients to move to another instance, e.g. before a deploy
        if (message.method === "reconnect") {
          reconnect();
          return;
        }
        if ("error" in message) {
          onServerError(message);
          return;
        }
        if (isRecord(message.result)) {
          onServerResult(message.id, message.result);
          return;
        }
        onError({ error: getMalformedMessageError(message) });
      };

      /**
       * Connection
       */

      /**
       * Reconnects after `delay`: `socket.connectionTimeout` limits a connection attempt, `socket.reconnectTime` is the
       * pause before the next attempt after the connection was lost.
       */
      const scheduleReconnect = (delay = socket.reconnectTime) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          reconnect();
        }, delay);
      };

      /** Creates the transport, reporting a failed attempt when the environment or the connection details are invalid */
      const createWebsocket = (url: string) => {
        try {
          const WebsocketConstructor = getWebsocketConstructor(options);
          if (!WebsocketConstructor) {
            onConnectFailed({ error: new Error("WebSocket is not available in this environment") });
            return null;
          }
          return new WebsocketConstructor(url, options?.protocols);
        } catch (error) {
          onConnectFailed({ error: toError(error) });
          return null;
        }
      };

      const onOpen = () => {
        clearTimeout(timeout);
        onConnected();
        // The server waits for the connection params before it handles any other message
        if (options?.connectionParams) {
          sendOrReport(JSON.stringify({ method: "connectionParams", data: options.connectionParams }));
        }
        subscriptions.getAll().forEach(startSubscription);
        onHeartbeat();
      };

      const onClose = (event: Pick<CloseEvent, "code"> & Event) => {
        clearTimeout(timeout);
        clearTimers();
        forgetAll();
        onDisconnected();
        onError({ error: new Error(getSocketError(event)) });

        // The connection was lost or closed by the server with an error - try to get it back
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };

      const openConnection = async (): Promise<boolean> => {
        const connection = await onConnect();
        if (!connection) {
          return adapter.connected;
        }

        clearTimeout(timeout);
        const previousWebsocket = websocket;
        websocket = undefined;
        previousWebsocket?.close(1000);

        options = connection.adapterOptions;
        const url = getWebsocketUrl(getSocketUrl(connection.url, getQueryParams(connection.queryParams)), options);
        const newWebsocket = createWebsocket(url);

        if (!newWebsocket) {
          return false;
        }
        websocket = newWebsocket;

        const isCurrent = () => websocket === newWebsocket;

        // Connection timeout - when the server does not answer in time, start over
        scheduleReconnect(socket.connectionTimeout);

        return new Promise<boolean>((resolve) => {
          newWebsocket.addEventListener("open", () => {
            resolve(true);
            if (isCurrent()) {
              onOpen();
            }
          });
          newWebsocket.addEventListener("close", (event) => {
            resolve(false);
            if (isCurrent()) {
              onClose(event);
            }
          });
          // Node.js 22 reports a failed handshake with `error` only - no `close` follows and the transport stays
          // CONNECTING. Browsers set CLOSED before the error and send the close event, which handles it as usual.
          // Here the transport is detached and treated as an abnormally closed one (1006).
          newWebsocket.addEventListener("error", () => {
            if (!isCurrent() || newWebsocket.readyState !== WebsocketReadyState.CONNECTING) {
              return;
            }
            resolve(false);
            websocket = undefined;
            try {
              newWebsocket.close();
            } catch {
              // Closing a transport that never connected may throw in some runtimes - it is detached already
            }
            onClose(Object.assign(new Event("close"), { code: 1006 }));
          });
          newWebsocket.addEventListener("message", (event) => {
            if (isCurrent()) {
              onMessage(event);
            }
          });
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
       * whatever it reports later does not reach the socket anymore, so closing on purpose is never treated as
       * a lost connection. The server stops every subscription of a closed connection on its own.
       */
      const closeConnection = async ({ manual }: { manual: boolean }): Promise<boolean> => {
        clearTimeout(timeout);
        clearTimers();
        forgetAll();

        const currentWebsocket = websocket;
        websocket = undefined;

        const wasActive = adapter.connected || adapter.connecting;
        onDisconnect();
        if (!manual) {
          // Closing the previous transport is a part of reconnecting - only `disconnect()` keeps the socket closed
          adapter.setForceClosed(false);
        }
        if (wasActive) {
          onDisconnected();
        }

        if (!currentWebsocket || currentWebsocket.readyState === WebsocketReadyState.CLOSED) {
          return true;
        }

        return new Promise<boolean>((resolve) => {
          currentWebsocket.addEventListener("close", () => resolve(true), { once: true });
          // A transport that fails while closing may report only `error` (Node.js 22) - don't wait for a close
          currentWebsocket.addEventListener("error", () => resolve(true), { once: true });
          currentWebsocket.close(1000);
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

      /**
       * Keep-alive
       */

      const clearTimers = () => {
        clearTimeout(pingTimer);
        clearTimeout(pongTimer);
      };

      const onHeartbeat = () => {
        const { enabled = false, ...keepAlive } = options?.keepAlive ?? {};
        const { intervalMs, pongTimeoutMs } = { ...defaultKeepAlive, ...keepAlive };

        if (adapter.connecting || !enabled) {
          return;
        }
        clearTimers();
        pingTimer = setTimeout(() => {
          sendOrReport(TrpcKeepAliveFrames.PING);
          pongTimer = setTimeout(() => {
            onHeartbeatTimeout();
          }, pongTimeoutMs);
        }, intervalMs);
      };

      /**
       * The server did not answer the ping - the connection is dead. Its closing handshake may never finish,
       * so the socket is marked as disconnected right away instead of waiting for the `close` event.
       */
      const onHeartbeatTimeout = () => {
        // The pong timer runs only while there is a transport
        const deadWebsocket = websocket;
        websocket = undefined;
        clearTimers();
        forgetAll();
        deadWebsocket?.close();
        onDisconnected();
        onError({ error: new Error("Keep-alive timeout - the server did not answer the ping in time") });
        scheduleReconnect();
      };

      // Subscriptions only - queries and mutations are sent with the TrpcAdapter. Throwing synchronously makes
      // `emitter.emit()` fail right at the call site, the same way the SSE adapter does it.
      const emit = () => {
        throw new Error("Cannot emit events with the tRPC WebSocket adapter, it supports subscriptions only");
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
        // The socket is destroyed or the adapter moves to another socket - stop following the network state
        dispose: () => {
          unmountOnline();
        },
      };
    });
