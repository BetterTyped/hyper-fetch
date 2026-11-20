import { createORPCErrorFromJson, isORPCErrorJson, ORPCError } from "@orpc/client";
import { getMalformedResponseErrorCode } from "@orpc/client/standard";

import type { OrpcErrorType } from "../adapter/adapter.types";
import type { OrpcSerializerType } from "../adapter/adapter.utils";
import type { OrpcSocketErrorOptionsType } from "./socket.types";

export const toError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

/**
 * Turns the serialized `{ json, meta }` data into the value. Anything else is not a part of the RPC protocol.
 * It throws for malformed data, the same as the serializer of oRPC.
 */
export const deserializeOrpcData = (data: unknown, serializer: OrpcSerializerType): unknown => {
  if (data !== undefined && !isRecord(data)) {
    throw new TypeError("Invalid RPC serialized data: expected the { json, meta } object");
  }
  return serializer.deserialize(data);
};

/**
 * The error of a call the server rejected before the event iterator started, e.g. a failed input validation or
 * middleware. The same as in the `RPCLink` of oRPC: an `ORPCError` from the body, or one named after the status
 * when the body is not an oRPC error.
 */
export const getOrpcResponseError = ({
  status,
  body,
  serializer,
}: {
  status: number;
  body: unknown;
  serializer: OrpcSerializerType;
}): ORPCError<string, unknown> => {
  let value = body;
  try {
    value = deserializeOrpcData(body, serializer);
  } catch {
    // The raw body stays in the data of the error below
  }

  if (isORPCErrorJson(value)) {
    return createORPCErrorFromJson(value);
  }
  return new ORPCError(getMalformedResponseErrorCode(status), { status, data: value });
};

/** Reported when the procedure of a listener returns a regular output instead of an event iterator */
export const getNotIteratorError = (topic: string): Error => {
  return new Error(`The procedure "${topic}" did not return an event iterator`);
};

/**
 * Error of an oRPC subscription, reported to the `socket.onError` callbacks. `topic` and `payload` tell which
 * subscription failed. `shape` is the error the server sent, in the shape of `ORPCError.toJSON()` - it is `null` when
 * the failure did not come from a procedure, e.g. a dropped stream or a malformed message. The original error is the
 * `cause`.
 *
 * @example
 * socket.onError(({ error }) => {
 *   if (error instanceof OrpcSocketError && error.defined && error.code === "UNAUTHORIZED") {
 *     logout();
 *   }
 * });
 */
export class OrpcSocketError<Code extends string = string, Data = unknown> extends Error {
  /** Error sent by the server, `null` when the failure did not come from a procedure */
  readonly shape: OrpcErrorType<Code, Data> | null;
  /** Topic of the failed subscription, `null` when the message can't be matched to a subscription */
  readonly topic: string | null;
  /** Input of the failed subscription */
  readonly payload: unknown;
  /** The `ORPCError` sent by the server, or the error of the transport or the decoding */
  declare readonly cause: unknown;

  constructor({ cause, topic, payload }: OrpcSocketErrorOptionsType) {
    const shape = cause instanceof ORPCError ? (cause.toJSON() as OrpcErrorType<Code, Data>) : null;
    super(shape?.message ?? toError(cause).message, { cause });
    this.name = "OrpcSocketError";
    this.shape = shape;
    this.topic = topic;
    this.payload = payload;
  }

  /** `true` for the errors from the `.errors()` map of the procedure */
  get defined(): boolean {
    return this.shape?.defined ?? false;
  }

  /** Code of the server error, e.g. `"NOT_FOUND"` */
  get code(): Code | undefined {
    return this.shape?.code;
  }

  /** Status of the server error */
  get status(): number | undefined {
    return this.shape?.status;
  }

  /** Data of the server error */
  get data(): Data | undefined {
    return this.shape?.data;
  }
}
