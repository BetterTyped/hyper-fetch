import type { ShouldReconnectType } from "@hyper-fetch/sockets";
import { defaultShouldReconnect } from "@hyper-fetch/sockets";
import type { GraphQLFormattedError } from "graphql";

import { GraphqlWsMessageType, fatalGraphqlWsCloseCodes, retriedStandardCloseCodes } from "./socket.constants";
import type { GraphqlSubscriptionErrorOptionsType } from "./socket.types";

/** The object check of the `graphql-ws` client, so both accept the same messages */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const toError = (value: unknown): Error => {
  return value instanceof Error ? value : new Error(String(value));
};

/** A message the server may send - every other one breaks the protocol */
export type GraphqlWsServerMessageType =
  | { type: typeof GraphqlWsMessageType.CONNECTION_ACK; payload?: Record<string, unknown> | null }
  | { type: typeof GraphqlWsMessageType.PING; payload?: Record<string, unknown> | null }
  | { type: typeof GraphqlWsMessageType.PONG; payload?: Record<string, unknown> | null }
  | { type: typeof GraphqlWsMessageType.NEXT; id: string; payload: Record<string, unknown> }
  | { type: typeof GraphqlWsMessageType.ERROR; id: string; payload: GraphQLFormattedError[] }
  | { type: typeof GraphqlWsMessageType.COMPLETE; id: string };

const isFormattedErrors = (value: unknown): value is GraphQLFormattedError[] => {
  return Array.isArray(value) && value.length > 0 && value.every((error) => isRecord(error) && "message" in error);
};

const hasId = (message: Record<string, unknown>): message is Record<string, unknown> & { id: string } => {
  return typeof message.id === "string" && message.id.length > 0;
};

/**
 * Reads a frame of the server. Throws when it breaks the protocol - the same checks the `graphql-ws` client makes, so
 * a server that works with it works with the adapter.
 */
export const parseServerMessage = (data: unknown): GraphqlWsServerMessageType => {
  if (typeof data !== "string") {
    throw new TypeError("Expected a text frame");
  }
  const message: unknown = JSON.parse(data);
  if (!isRecord(message) || typeof message.type !== "string") {
    throw new TypeError("Expected a message object with a string 'type'");
  }

  switch (message.type) {
    case GraphqlWsMessageType.CONNECTION_ACK:
    case GraphqlWsMessageType.PING:
    case GraphqlWsMessageType.PONG: {
      if (message.payload !== undefined && message.payload !== null && !isRecord(message.payload)) {
        throw new TypeError(`"${message.type}" expects the payload to be an object or nullish`);
      }
      return message as GraphqlWsServerMessageType;
    }
    case GraphqlWsMessageType.NEXT: {
      if (!hasId(message) || !isRecord(message.payload)) {
        throw new TypeError(`"next" expects a non-empty string 'id' and an object payload`);
      }
      return message as GraphqlWsServerMessageType;
    }
    case GraphqlWsMessageType.ERROR: {
      if (!hasId(message) || !isFormattedErrors(message.payload)) {
        throw new TypeError(`"error" expects a non-empty string 'id' and an array of GraphQL errors as the payload`);
      }
      return message as GraphqlWsServerMessageType;
    }
    case GraphqlWsMessageType.COMPLETE: {
      if (!hasId(message)) {
        throw new TypeError(`"complete" expects a non-empty string 'id'`);
      }
      return message as GraphqlWsServerMessageType;
    }
    default: {
      throw new TypeError(`Unexpected message type "${message.type}"`);
    }
  }
};

/** Reported to `onError` when the server breaks the protocol - the connection is closed with 4004 */
export const getBadResponseError = (cause: unknown): Error => {
  return new Error("Received a malformed GraphQL over WebSocket message", { cause });
};

/**
 * The close reason may hold at most 123 bytes. Longer reasons are cut by the `graphql-ws` client the same way:
 * replaced with a short generic one.
 */
export const limitCloseReason = (reason: string, fallback: string) => {
  return new TextEncoder().encode(reason).byteLength <= 123 ? reason : fallback;
};

/**
 * The default `shouldReconnect` of the GraphQL WebSocket adapter. It gives up on the close codes a retry can't fix -
 * bad requests, unauthorized, a missing subprotocol, protocol errors and the like, the same ones the `graphql-ws` client
 * gives up on - and on a normal closure (1000), as every socket adapter does. Everything else is retried. The socket's
 * own `shouldReconnect` replaces it, so call this one from yours to keep these rules.
 *
 * @example
 * const socket = new Socket({
 *   url,
 *   adapter: GraphqlWsAdapter(),
 *   // Retry after a normal closure too
 *   shouldReconnect: (loss) => loss.code === 1000 || shouldReconnectGraphqlWs(loss),
 * });
 */
export const shouldReconnectGraphqlWs: ShouldReconnectType = (loss) => {
  const { code } = loss;
  if (code === undefined) {
    return true;
  }
  if (fatalGraphqlWsCloseCodes.has(code)) {
    return false;
  }
  if (code > 1000 && code <= 1999 && !retriedStandardCloseCodes.has(code)) {
    return false;
  }
  return defaultShouldReconnect(loss);
};

/**
 * Error of a GraphQL subscription, reported to the `socket.onError` callbacks and to the `onEnd` of its listeners.
 * The server ended the subscription with the `error` message - its validation or its source failed. `errors` holds what
 * it sent.
 *
 * Errors of a single event do not end the subscription and come with the event in `extra.errors`.
 *
 * @example
 * socket.onError(({ error }) => {
 *   if (error instanceof GraphqlSubscriptionError && error.errors[0].extensions?.code === "UNAUTHENTICATED") {
 *     logout();
 *   }
 * });
 */
export class GraphqlSubscriptionError extends Error {
  /** Errors sent by the server with the `error` message */
  readonly errors: GraphQLFormattedError[];
  /** Topic of the failed subscription */
  readonly topic: string;
  /** Variables of the failed subscription */
  readonly payload: unknown;

  constructor({ errors, topic, payload }: GraphqlSubscriptionErrorOptionsType) {
    super(errors.map((error) => error.message).join("\n"));
    this.name = "GraphqlSubscriptionError";
    this.errors = errors;
    this.topic = topic;
    this.payload = payload;
  }
}
