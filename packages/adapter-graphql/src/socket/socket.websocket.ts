/* eslint-disable @typescript-eslint/no-use-before-define */
import type { EmptyTypes, QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams } from "@hyper-fetch/core";
import type { ConnectionAttemptType, ConnectionLossType } from "@hyper-fetch/sockets";
import {
  SocketAdapter,
  WebsocketReadyState,
  createReconnectingConnection,
  getSocketError,
  getSocketUrl,
  getWebsocketConstructor,
} from "@hyper-fetch/sockets";

import {
  GRAPHQL_TRANSPORT_WS_PROTOCOL,
  GraphqlWsCloseCode,
  GraphqlWsMessageType,
  defaultKeepAlive,
} from "./socket.constants";
import type { GraphqlSubscriptionType } from "./socket.subscriptions";
import { createGraphqlSubscriptions } from "./socket.subscriptions";
import type {
  GraphqlWsAdapterOptionsType,
  GraphqlWsAdapterType,
  GraphqlWsExtraType,
  GraphqlWsListenerOptionsType,
} from "./socket.types";
import type { GraphqlWsServerMessageType } from "./socket.utils";
import {
  GraphqlSubscriptionError,
  getBadResponseError,
  limitCloseReason,
  parseServerMessage,
  shouldReconnectGraphqlWs,
  toError,
} from "./socket.utils";

/** A close the client starts because of the protocol - sent to the server with its code */
type ProtocolCloseType = { code: number; reason: string };

type CloseEventLikeType = Pick<CloseEvent, "code"> & Partial<Pick<CloseEvent, "reason">> & Event;

/** Explains a lost connection - the protocol codes (4000+) carry the server's reason */
const getCloseError = (event: CloseEventLikeType) => {
  if (event.code >= 4000) {
    return new Error(`The server closed the connection with ${event.code}: ${event.reason || "no reason given"}`);
  }
  return new Error(getSocketError(event));
};

/**
 * Socket adapter for GraphQL subscriptions over WebSocket. It speaks `graphql-transport-ws`, the protocol of the
 * `graphql-ws` library - supported by Apollo Server, GraphQL Yoga, Mercurius, Hot Chocolate, Hasura and most others.
 *
 * - The connection counts as open once the server acknowledged `connection_init`, so the socket's
 *   `connectionTimeout` covers the whole handshake. `connectionParams` are sent with it, a function runs on every
 *   connection attempt.
 * - Every document with one set of variables is one server subscription, shared by the listeners with those
 *   variables. Subscriptions started before the connection is acknowledged wait for it, and after a reconnect they are
 *   sent again.
 * - The server's `ping` is answered, and `keepAlive` pings a quiet connection to notice when it died.
 * - Reconnecting follows the socket's reconnection options. Close codes a retry can't fix (4400, 4401, 4409...) stop
 *   it - see {@link shouldReconnectGraphqlWs}.
 * - With `lazy`, the connection is open only while there are subscriptions.
 *
 * Queries and mutations are sent with the `GraphqlAdapter` - `emit` throws.
 *
 * @example
 * const socket = new Socket({
 *   url: "ws://localhost:4000/graphql",
 *   adapter: GraphqlWsAdapter(),
 *   adapterOptions: { connectionParams: () => ({ token: getToken() }) },
 * });
 *
 * const onMessage = socket.createListener()({ topic: "OnMessage", options: { document: OnMessageDocument } });
 * onMessage.listen(({ data, extra }) => {}, { payload: { room: "general" } });
 */
export const GraphqlWsAdapter = (): GraphqlWsAdapterType =>
  new SocketAdapter<
    GraphqlWsExtraType,
    GraphqlWsAdapterOptionsType,
    GraphqlWsListenerOptionsType,
    undefined,
    QueryParamsType | string,
    typeof stringifyQueryParams
  >({
    name: "graphql-ws",
    // A subscription counts as started once it was sent over an acknowledged connection - the protocol has no
    // confirmation of its own, and before the acknowledgement nothing can be sent
    confirmsSubscriptions: true,
  })
    .setQueryParamsMapper(stringifyQueryParams)
    .setConnector((bindings) => {
      const { adapter, getQueryParams, onConnectFailed, onError } = bindings;

      // The transport of the current attempt - `undefined` once it is detached
      let websocket: WebSocket | undefined;
      // The server acknowledged the current transport - only then subscriptions can be sent
      let acknowledged = false;
      // Options of the current connection attempt (after onConnect interceptors)
      let options: GraphqlWsAdapterOptionsType | EmptyTypes = adapter.adapterOptions;
      // Ends the current attempt - the keep-alive and the protocol checks use it
      let loseCurrent: ((loss: ConnectionLossType) => void) | undefined;
      // The code to close the current transport with, when the client ends it because of the protocol
      let protocolClose: ProtocolCloseType | undefined;

      let pingTimer: ReturnType<typeof setTimeout> | undefined;
      let pongTimer: ReturnType<typeof setTimeout> | undefined;
      let lazyCloseTimer: ReturnType<typeof setTimeout> | undefined;
      // With `lazy`, the connection is closed because no subscription needs it - the next subscription opens it
      let lazyIdle = true;

      // Ids are never reused, so a late message of a stopped subscription can't reach a new one
      let lastId = 0;
      // Subscriptions running on the current connection, by their id
      const running = new Map<string, GraphqlSubscriptionType>();
      const ids = new Map<GraphqlSubscriptionType, string>();

      const subscriptions = createGraphqlSubscriptions({
        bindings,
        onStart: (subscription) => startSubscription(subscription),
        onStop: (subscription) => stopSubscription(subscription),
      });

      const isLazy = () => !!adapter.adapterOptions?.lazy;

      /** Sends a message. Returns the error instead of throwing, so callers decide how to report it. */
      const send = (message: Record<string, unknown>): Error | null => {
        try {
          // Messages are sent only while there is a transport - a closed one throws and the error is returned
          websocket?.send(JSON.stringify(message));
          return null;
        } catch (error) {
          return toError(error);
        }
      };

      const sendOrReport = (message: Record<string, unknown>) => {
        const error = send(message);
        if (error) {
          onError({ error });
        }
        return !error;
      };

      /**
       * Ends the current connection because of the protocol, e.g. a malformed message. The transport is closed with
       * the protocol `code`, so the server learns why, and the engine decides about the next attempt with it.
       */
      const failConnection = (
        attempt: ConnectionAttemptType<GraphqlWsAdapterType>,
        close: ProtocolCloseType,
        error: Error,
      ) => {
        protocolClose = close;
        // The socket is reported as disconnected first, then the error that explains why
        attempt.lost({ code: close.code, reason: close.reason, error });
        onError({ error });
      };

      /**
       * Lazy connection
       */

      const cancelLazyClose = () => {
        clearTimeout(lazyCloseTimer);
        lazyCloseTimer = undefined;
      };

      /** With `lazy`, the first subscription opens the connection */
      const connectLazily = () => {
        cancelLazyClose();
        if (!isLazy() || !lazyIdle) {
          return;
        }
        lazyIdle = false;
        connection.connect();
      };

      /** With `lazy`, the connection closes once no subscription needs it anymore */
      const closeLazily = () => {
        if (!isLazy() || subscriptions.getAll().length > 0) {
          return;
        }
        cancelLazyClose();
        // Every subscription that starts cancels the timer, so it only fires while there are none
        const close = () => {
          lazyCloseTimer = undefined;
          lazyIdle = true;
          connection.disconnect();
        };
        const timeout = adapter.adapterOptions?.lazyCloseTimeout ?? 0;
        if (timeout > 0) {
          lazyCloseTimer = setTimeout(close, timeout);
        } else {
          close();
        }
      };

      /**
       * Subscriptions
       */

      const startSubscription = (subscription: GraphqlSubscriptionType) => {
        // Not acknowledged yet - every subscription is sent once the server acknowledges the connection
        if (!websocket || !acknowledged) {
          connectLazily();
          return;
        }
        cancelLazyClose();
        lastId += 1;
        const id = String(lastId);
        const message = {
          id,
          type: GraphqlWsMessageType.SUBSCRIBE,
          payload: {
            query: subscription.query,
            operationName: subscription.operationName,
            variables: subscription.payload,
          },
        };
        if (sendOrReport(message)) {
          running.set(id, subscription);
          ids.set(subscription, id);
          subscriptions.confirm(subscription);
        }
      };

      /** The server forgets the subscription - after `complete`, an error or when the connection closes */
      const forget = (subscription: GraphqlSubscriptionType) => {
        const id = ids.get(subscription);
        if (id !== undefined) {
          running.delete(id);
        }
        ids.delete(subscription);
      };

      /** The connection is gone, and the server stopped every subscription of it - they are sent again on reconnect */
      const forgetAll = () => {
        running.forEach(subscriptions.unconfirm);
        running.clear();
        ids.clear();
      };

      const stopSubscription = (subscription: GraphqlSubscriptionType) => {
        const id = ids.get(subscription);
        forget(subscription);
        if (id !== undefined) {
          sendOrReport({ id, type: GraphqlWsMessageType.COMPLETE });
        }
        closeLazily();
      };

      /** The server ended the subscription - with `complete` (`error: null`) or the `error` message */
      const endSubscription = (subscription: GraphqlSubscriptionType, error: Error | null) => {
        forget(subscription);
        if (error) {
          onError({ error });
        }
        subscriptions.end(subscription, error);
        closeLazily();
      };

      /**
       * Messages
       */

      const onAcknowledged = (attempt: ConnectionAttemptType<GraphqlWsAdapterType>) => {
        acknowledged = true;
        attempt.ready();
        // A connected callback may have closed the connection already
        if (!attempt.isCurrent()) {
          return;
        }
        subscriptions.getAll().forEach(startSubscription);
        onHeartbeat();
      };

      const onSubscriptionMessage = (message: Extract<GraphqlWsServerMessageType, { id: string }>) => {
        const subscription = running.get(message.id);
        // Late messages of a subscription stopped by the client
        if (!subscription) {
          return;
        }
        switch (message.type) {
          case GraphqlWsMessageType.NEXT: {
            const { data, errors, extensions } = message.payload;
            subscriptions.deliver(subscription, {
              data: data ?? null,
              errors: Array.isArray(errors) ? errors : undefined,
              extensions,
            });
            return;
          }
          case GraphqlWsMessageType.ERROR: {
            const error = new GraphqlSubscriptionError({
              errors: message.payload,
              topic: subscription.topic,
              payload: subscription.payload,
            });
            endSubscription(subscription, error);
            return;
          }
          default: {
            endSubscription(subscription, null);
          }
        }
      };

      const onMessage = (event: MessageEvent, attempt: ConnectionAttemptType<GraphqlWsAdapterType>) => {
        // Any message proves the connection is alive
        onHeartbeat();

        let message: GraphqlWsServerMessageType;
        try {
          message = parseServerMessage(event.data);
        } catch (error) {
          const reason = limitCloseReason(toError(error).message, "Bad response");
          failConnection(attempt, { code: GraphqlWsCloseCode.BAD_RESPONSE, reason }, getBadResponseError(error));
          return;
        }

        switch (message.type) {
          case GraphqlWsMessageType.PING: {
            sendOrReport(
              message.payload
                ? { type: GraphqlWsMessageType.PONG, payload: message.payload }
                : { type: GraphqlWsMessageType.PONG },
            );
            return;
          }
          case GraphqlWsMessageType.PONG: {
            return;
          }
          case GraphqlWsMessageType.CONNECTION_ACK: {
            // A repeated acknowledgement changes nothing
            if (!acknowledged) {
              onAcknowledged(attempt);
            }
            return;
          }
          default: {
            if (!acknowledged) {
              const reason = `First message cannot be of type ${message.type}`;
              failConnection(
                attempt,
                { code: GraphqlWsCloseCode.BAD_RESPONSE, reason },
                getBadResponseError(new Error(reason)),
              );
              return;
            }
            onSubscriptionMessage(message);
          }
        }
      };

      /**
       * Connection
       */

      /** Sends `connection_init` with the connection params of the attempt */
      const initialize = async (attempt: ConnectionAttemptType<GraphqlWsAdapterType>, transport: WebSocket) => {
        const connectionParams = options?.connectionParams;
        let payload: Record<string, unknown> | undefined;
        try {
          payload = typeof connectionParams === "function" ? await connectionParams() : connectionParams;
        } catch (error) {
          if (attempt.isCurrent()) {
            const cause = toError(error);
            const reason = limitCloseReason(cause.message, "Internal client error");
            failConnection(
              attempt,
              { code: GraphqlWsCloseCode.INTERNAL_CLIENT_ERROR, reason },
              new Error("Could not get the connection params", { cause }),
            );
          }
          return;
        }
        // The connection may be gone while the params were prepared
        if (!attempt.isCurrent() || transport.readyState !== WebsocketReadyState.OPEN) {
          return;
        }
        sendOrReport(
          payload
            ? { type: GraphqlWsMessageType.CONNECTION_INIT, payload }
            : { type: GraphqlWsMessageType.CONNECTION_INIT },
        );
      };

      /** Creates the transport, reporting a failed attempt when the environment or the connection details are invalid */
      const createWebsocket = (url: string) => {
        try {
          const WebsocketConstructor = getWebsocketConstructor(options);
          if (!WebsocketConstructor) {
            onConnectFailed({ error: new Error("WebSocket is not available in this environment") });
            return null;
          }
          return new WebsocketConstructor(url, GRAPHQL_TRANSPORT_WS_PROTOCOL);
        } catch (error) {
          onConnectFailed({ error: toError(error) });
          return null;
        }
      };

      /**
       * Closes a detached transport. The server stops every subscription of a closed connection on its own, so they
       * are sent again on the next one. Resolves on the close - or on an error, as a transport that fails while
       * closing may report only `error` (Node.js 22).
       */
      const closeWebsocket = (transport: WebSocket): Promise<void> => {
        // The engine closes an attempt before it opens the next one, so this is always the current transport
        const { code, reason } = protocolClose ?? { code: 1000, reason: "Normal Closure" };
        websocket = undefined;
        acknowledged = false;
        loseCurrent = undefined;
        protocolClose = undefined;
        clearTimers();
        forgetAll();
        if (transport.readyState === WebsocketReadyState.CLOSED) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          transport.addEventListener("close", () => resolve(), { once: true });
          transport.addEventListener("error", () => resolve(), { once: true });
          try {
            transport.close(code, reason);
          } catch {
            // Closing a transport that never connected may throw in some runtimes - it is detached already
            resolve();
          }
        });
      };

      const connection = createReconnectingConnection({
        bindings,
        // A lazy connection waits for its first subscription
        autoConnect: !adapter.adapterOptions?.lazy && (adapter.adapterOptions?.autoConnect ?? true),
        shouldReconnect: shouldReconnectGraphqlWs,
        open: (attempt) => {
          options = attempt.connection.adapterOptions;
          const url = getSocketUrl(attempt.connection.url, getQueryParams(attempt.connection.queryParams));
          const transport = createWebsocket(url);
          if (!transport) {
            return null;
          }
          websocket = transport;
          acknowledged = false;

          // Ignored by the engine once the attempt was replaced
          loseCurrent = attempt.lost;

          /** The transport is gone - report it and let the engine decide about the next attempt */
          const onTransportClosed = (event: CloseEventLikeType) => {
            // The socket is reported as disconnected first, then the error that explains why
            attempt.lost({ code: event.code, reason: event.reason || undefined });
            onError({ error: getCloseError(event) });
          };

          transport.addEventListener("open", () => {
            if (attempt.isCurrent()) {
              initialize(attempt, transport);
            }
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
              onMessage(event, attempt);
            }
          });

          return { close: () => closeWebsocket(transport) };
        },
      });

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

        if (!acknowledged || !enabled) {
          return;
        }
        clearTimers();
        pingTimer = setTimeout(() => {
          sendOrReport({ type: GraphqlWsMessageType.PING });
          pongTimer = setTimeout(() => {
            onHeartbeatTimeout();
          }, pongTimeoutMs);
        }, intervalMs);
      };

      /**
       * The server did not answer the ping - the connection is dead. Its closing handshake may never finish, so the
       * engine detaches the transport right away instead of waiting for its `close` event.
       */
      const onHeartbeatTimeout = () => {
        const error = new Error("Keep-alive timeout - the server did not answer the ping in time");
        // The socket is reported as disconnected first, then the error that explains why
        loseCurrent?.({ error });
        onError({ error });
      };

      // Subscriptions only - queries and mutations are sent with the GraphqlAdapter. Throwing synchronously makes
      // `emitter.emit()` fail right at the call site, the same way the SSE adapter does it.
      const emit = () => {
        throw new Error("Cannot emit events with the GraphQL WebSocket adapter, it supports subscriptions only");
      };

      return {
        connect: () => {
          lazyIdle = false;
          return connection.connect();
        },
        reconnect: () => {
          lazyIdle = false;
          return connection.reconnect();
        },
        disconnect: () => {
          cancelLazyClose();
          return connection.disconnect();
        },
        listen: subscriptions.listen,
        emit,
        // The socket is destroyed or the adapter moves to another socket - stop following the network state
        dispose: () => {
          connection.dispose();
          clearTimers();
          cancelLazyClose();
        },
      };
    });
