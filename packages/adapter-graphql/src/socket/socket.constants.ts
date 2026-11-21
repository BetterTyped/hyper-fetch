import { Time } from "@hyper-fetch/core";

/** Subprotocol of GraphQL over WebSocket, the protocol of `graphql-ws` */
export const GRAPHQL_TRANSPORT_WS_PROTOCOL = "graphql-transport-ws";

/** Message types of the `graphql-transport-ws` protocol */
export const GraphqlWsMessageType = {
  CONNECTION_INIT: "connection_init",
  CONNECTION_ACK: "connection_ack",
  PING: "ping",
  PONG: "pong",
  SUBSCRIBE: "subscribe",
  NEXT: "next",
  ERROR: "error",
  COMPLETE: "complete",
} as const;

/** Close codes of the `graphql-transport-ws` protocol */
export const GraphqlWsCloseCode = {
  INTERNAL_SERVER_ERROR: 4500,
  INTERNAL_CLIENT_ERROR: 4005,
  BAD_REQUEST: 4400,
  BAD_RESPONSE: 4004,
  UNAUTHORIZED: 4401,
  FORBIDDEN: 4403,
  SUBPROTOCOL_NOT_ACCEPTABLE: 4406,
  CONNECTION_INITIALISATION_TIMEOUT: 4408,
  CONNECTION_ACKNOWLEDGEMENT_TIMEOUT: 4504,
  SUBSCRIBER_ALREADY_EXISTS: 4409,
  TOO_MANY_INITIALISATION_REQUESTS: 4429,
} as const;

/**
 * Close codes that a retry can't fix - the same ones the `graphql-ws` client gives up on. Forbidden (4403) and the
 * timeouts (4408, 4504) are retried, as access may be granted and the server may answer in time on the next attempt.
 */
export const fatalGraphqlWsCloseCodes: ReadonlySet<number> = new Set([
  GraphqlWsCloseCode.INTERNAL_SERVER_ERROR,
  GraphqlWsCloseCode.INTERNAL_CLIENT_ERROR,
  GraphqlWsCloseCode.BAD_REQUEST,
  GraphqlWsCloseCode.BAD_RESPONSE,
  GraphqlWsCloseCode.UNAUTHORIZED,
  GraphqlWsCloseCode.SUBPROTOCOL_NOT_ACCEPTABLE,
  GraphqlWsCloseCode.SUBSCRIBER_ALREADY_EXISTS,
  GraphqlWsCloseCode.TOO_MANY_INITIALISATION_REQUESTS,
]);

/**
 * Close codes of the WebSocket standard (1001-1999) that a retry can fix: going away, no status, abnormal closure,
 * service restart, try again later and bad gateway. The other ones report a broken client or server, e.g. 1002
 * (protocol error) or 1003 (unsupported data). A normal closure (1000) stays closed, as with every socket adapter.
 */
export const retriedStandardCloseCodes: ReadonlySet<number> = new Set([1001, 1005, 1006, 1012, 1013, 1014]);

/** Defaults of the keep-alive */
export const defaultKeepAlive = {
  intervalMs: Time.SEC * 10,
  pongTimeoutMs: Time.SEC * 5,
};
