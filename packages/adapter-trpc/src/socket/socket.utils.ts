import type { TrpcErrorType, TrpcTransformerType } from "../adapter/adapter.types";
import type { TrpcSocketErrorOptionsType } from "./socket.types";

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const toError = (value: unknown): Error => {
  return value instanceof Error ? value : new Error(String(value));
};

export const deserializeTrpcOutput = (value: unknown, transformer?: TrpcTransformerType): unknown => {
  return transformer ? transformer.deserialize(value) : value;
};

/** Reported to `onError` when a message does not follow the tRPC protocol or the transformer cannot read it */
export const getMalformedMessageError = (cause: unknown): Error => {
  return new Error("Received a malformed tRPC subscription message", { cause });
};

/**
 * Error of a tRPC subscription, reported to the `socket.onError` callbacks and to the `onEnd` of its listeners.
 * The server ended the subscription (or rejected the connection when `topic` is `null`, which ends no subscription),
 * `shape` holds the error it sent.
 *
 * @example
 * socket.onError(({ error }) => {
 *   if (error instanceof TrpcSocketError && error.shape.data.code === "UNAUTHORIZED") {
 *     logout();
 *   }
 * });
 */
export class TrpcSocketError<Shape = TrpcErrorType> extends Error {
  /** Error sent by the server, after the transformer */
  readonly shape: Shape;
  /** Topic of the failed subscription, `null` when the error is about the whole connection */
  readonly topic: string | null;
  /** Input of the failed subscription */
  readonly payload: unknown;

  constructor({ shape, topic, payload }: TrpcSocketErrorOptionsType<Shape>) {
    super(isRecord(shape) && typeof shape.message === "string" ? shape.message : "The tRPC subscription failed");
    this.name = "TrpcSocketError";
    this.shape = shape;
    this.topic = topic;
    this.payload = payload;
  }
}
