import { Time } from "@hyper-fetch/core";

/** Defaults of the tRPC `wsLink` keep-alive */
export const defaultKeepAlive = {
  intervalMs: Time.SEC * 5,
  pongTimeoutMs: Time.SEC,
};

/** Text frames of the tRPC WebSocket keep-alive, sent outside of the JSON messages */
export const TrpcKeepAliveFrames = {
  PING: "PING",
  PONG: "PONG",
} as const;

/**
 * JSON-RPC code of `INTERNAL_SERVER_ERROR`, `BAD_GATEWAY`, `SERVICE_UNAVAILABLE` and `GATEWAY_TIMEOUT`.
 * A stream that ends with it is retried by the `EventSource`, the same way `httpSubscriptionLink` does it.
 */
export const retryableTrpcErrorCode = -32_603;

/** Events of the tRPC Server-Sent Events protocol, next to the unnamed `message` events carrying the data */
export const TrpcSseEvents = {
  CONNECTED: "connected",
  PING: "ping",
  SERIALIZED_ERROR: "serialized-error",
  RETURN: "return",
} as const;
