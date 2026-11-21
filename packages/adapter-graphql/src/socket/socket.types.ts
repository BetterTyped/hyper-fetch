import type { QueryParamsType, stringifyQueryParams } from "@hyper-fetch/core";
import type { SocketAdapter } from "@hyper-fetch/sockets";
import type { GraphQLFormattedError } from "graphql";

import type { GraphQlEndpointType } from "../adapter/adapter.types";

/**
 * The `extra` of every subscription event, received by `listen` callbacks next to the `data`.
 */
export type GraphqlWsExtraType = {
  /**
   * Errors of the event. The server sends them next to the `data` when resolving the event failed in part - the
   * subscription keeps running. `undefined` when the event has none.
   *
   * A subscription the server can't execute at all, e.g. with missing variables, gets one event with these errors and
   * `null` data, and then it completes.
   */
  errors?: GraphQLFormattedError[];
  /** The `extensions` of the event, `{}` when the server sent none */
  extensions: Record<string, unknown>;
  /**
   * Variables of the subscription the event belongs to. Listeners of one topic with other variables are separate
   * subscriptions, so it tells them apart where events of every subscription meet, like `socket.events.onListenerEvent`.
   */
  payload: unknown;
};

/** Payload of `connection_init`, read by the server in `onConnect` as `ctx.connectionParams`, e.g. an auth token */
export type GraphqlWsConnectionParamsType = Record<string, unknown>;

/**
 * Keep-alive of the connection. The client sends `ping` when the connection is quiet and treats it as lost when the
 * `pong` does not arrive in time - the only way to notice a connection that died without a close, e.g. behind a proxy.
 */
export type GraphqlWsKeepAliveOptionsType = {
  enabled: boolean;
  /**
   * How long the connection can be quiet before the client sends `ping`, in milliseconds.
   * @default 10000
   */
  intervalMs?: number;
  /**
   * How long the client waits for `pong` before it reconnects, in milliseconds.
   * @default 5000
   */
  pongTimeoutMs?: number;
};

/**
 * Options of the GraphQL WebSocket connection, passed as `adapterOptions` to the `Socket`.
 * They can be changed per connection attempt with `socket.onConnect`.
 */
export type GraphqlWsAdapterOptionsType = {
  /**
   * Connect when the socket is created. Only the first connection depends on it - a socket connected by hand also
   * reconnects after a lost connection and when the app goes back online. Ignored with `lazy`.
   * @default true
   */
  autoConnect?: boolean;
  /**
   * Connect when the first subscription starts and close the connection when the last one stops, after
   * `lazyCloseTimeout`. A socket without subscriptions holds no connection.
   * @default false
   */
  lazy?: boolean;
  /**
   * With `lazy`, how long the connection stays open after the last subscription stopped, in milliseconds. A
   * subscription started in this time reuses the connection.
   * @default 0
   */
  lazyCloseTimeout?: number;
  /**
   * The `WebSocket` class to use, for example from the `ws` package. Defaults to the global one
   * (browsers, Node.js 22+, Bun, Deno).
   */
  WebSocket?: typeof WebSocket;
  /**
   * Sent with `connection_init` on every connection, before any subscription starts. A function runs on every
   * connection attempt, so a reconnect sends a fresh token. When it throws or rejects, the connection is closed with
   * 4005 and not retried.
   */
  connectionParams?:
    | GraphqlWsConnectionParamsType
    | (() => GraphqlWsConnectionParamsType | undefined | Promise<GraphqlWsConnectionParamsType | undefined>);
  /** Sends `ping` on a quiet connection and reconnects when the server does not answer */
  keepAlive?: GraphqlWsKeepAliveOptionsType;
};

/**
 * Options of a listener, set with `options` in `createListener` or with `listener.setOptions()`.
 */
export type GraphqlWsListenerOptionsType = {
  /**
   * The subscription document. A typed document (graphql-codegen, gql.tada) types the listener's data and variables.
   * When it is omitted, the `topic` is sent as the document.
   */
  document?: GraphQlEndpointType;
};

/** Socket adapter speaking the GraphQL over WebSocket protocol (`graphql-transport-ws`) */
export type GraphqlWsAdapterType = SocketAdapter<
  GraphqlWsExtraType,
  GraphqlWsAdapterOptionsType,
  GraphqlWsListenerOptionsType,
  undefined,
  QueryParamsType | string,
  typeof stringifyQueryParams
>;

/** Details of the subscription a {@link GraphqlSubscriptionError} belongs to */
export type GraphqlSubscriptionErrorOptionsType = {
  /** Errors sent by the server with the `error` message */
  errors: GraphQLFormattedError[];
  /** Topic of the failed subscription */
  topic: string;
  /** Variables of the failed subscription */
  payload: unknown;
};
