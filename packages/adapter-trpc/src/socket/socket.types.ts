import type { QueryParamsType, stringifyQueryParams } from "@hyper-fetch/core";
import type { SocketAdapter } from "@hyper-fetch/sockets";

import type { TrpcErrorType } from "../adapter/adapter.types";

/**
 * The `extra` of every subscription event, received by `listen` callbacks next to the `data`.
 */
export type TrpcSocketExtraType = {
  /**
   * Id of an event yielded with `tracked(id, data)`, `null` for events without an id.
   * The adapter sends the last one back as `lastEventId` when it restarts the subscription, so the server can resume.
   */
  eventId: string | null;
  /**
   * Input of the subscription the event belongs to. Listeners of one procedure with different inputs are separate
   * subscriptions, so it tells them apart where events of every subscription meet, like `socket.events.onListenerEvent`.
   */
  payload: unknown;
};

/** Connection params read by `createContext` on the server as `info.connectionParams`, e.g. an auth token */
export type TrpcConnectionParamsType = Record<string, string>;

/**
 * Keep-alive of the tRPC WebSocket protocol. The client sends `PING` when the connection is quiet and treats it as
 * lost when the `PONG` does not arrive in time.
 */
export type TrpcKeepAliveOptionsType = {
  enabled: boolean;
  /**
   * How long the connection can be quiet before the client sends `PING`, in milliseconds.
   * @default 5000
   */
  intervalMs?: number;
  /**
   * How long the client waits for `PONG` before it reconnects, in milliseconds.
   * @default 1000
   */
  pongTimeoutMs?: number;
};

/**
 * Options of the tRPC WebSocket connection, passed as `adapterOptions` to the `Socket`.
 * They can be changed per connection attempt with `socket.onConnect`, e.g. to send a fresh auth token.
 */
export type TrpcWebsocketAdapterOptionsType = {
  /**
   * Connect when the socket is created. Only the first connection depends on it - a socket connected by hand also
   * reconnects after a lost connection and when the app goes back online.
   * @default true
   */
  autoConnect?: boolean;
  /** Subprotocols passed to the `WebSocket` constructor (`Sec-WebSocket-Protocol` header) */
  protocols?: string | string[];
  /**
   * The `WebSocket` class to use, for example from the `ws` package. Defaults to the global one
   * (browsers, Node.js 22+, Bun, Deno).
   */
  WebSocket?: typeof WebSocket;
  /**
   * Sent as the first message of every connection, before any subscription starts.
   * The server reads them in `createContext` as `info.connectionParams`.
   */
  connectionParams?: TrpcConnectionParamsType;
  /** Sends `PING` on a quiet connection and reconnects when the server does not answer */
  keepAlive?: TrpcKeepAliveOptionsType;
};

/**
 * Options of the tRPC Server-Sent Events streams, passed as `adapterOptions` to the `Socket`.
 * They can be changed per connection attempt with `socket.onConnect`, e.g. to send a fresh auth token.
 */
export type TrpcSseAdapterOptionsType = {
  /**
   * Open the streams when the socket is created. Only the first connection depends on it - a socket connected by
   * hand also opens them again when the app goes back online.
   * @default true
   */
  autoConnect?: boolean;
  /** Passed to the `EventSource` constructor of every stream, e.g. `{ withCredentials: true }` */
  eventSourceInit?: EventSourceInit;
  /**
   * The `EventSource` class to use, for example from the `eventsource` package in Node.js. Defaults to the global one
   * (browsers, Bun, Deno).
   */
  EventSource?: typeof EventSource;
  /**
   * Sent with every stream as the `connectionParams` query param.
   * The server reads them in `createContext` as `info.connectionParams`.
   */
  connectionParams?: TrpcConnectionParamsType;
};

/** Socket adapter speaking the tRPC WebSocket protocol (`wsLink`) */
export type TrpcWebsocketAdapterType = SocketAdapter<
  TrpcSocketExtraType,
  TrpcWebsocketAdapterOptionsType,
  undefined,
  undefined,
  QueryParamsType | string,
  typeof stringifyQueryParams
>;

/** Socket adapter speaking the tRPC Server-Sent Events protocol (`httpSubscriptionLink`) */
export type TrpcSseAdapterType = SocketAdapter<
  TrpcSocketExtraType,
  TrpcSseAdapterOptionsType,
  undefined,
  undefined,
  QueryParamsType | string,
  typeof stringifyQueryParams
>;

/** Details of the subscription a {@link TrpcSocketError} belongs to */
export type TrpcSocketErrorOptionsType<Shape = TrpcErrorType> = {
  /** Error sent by the server, after the transformer */
  shape: Shape;
  /** Topic of the failed subscription, `null` when the error is about the whole connection */
  topic: string | null;
  /** Input of the failed subscription */
  payload: unknown;
};
