import type { OrpcSerializerType } from "../adapter/adapter.utils";
import { orpcEndpointMapper } from "../adapter/adapter.utils";
import type { OrpcIteratorEventType } from "../socket/socket.types";
import { isRecord } from "../socket/socket.utils";

/** Message types of the oRPC peer protocol, used by `@orpc/server/ws` and `@orpc/client/websocket` */
const peerMessageType = {
  REQUEST: 1,
  RESPONSE: 2,
  EVENT_ITERATOR: 3,
  ABORT_SIGNAL: 4,
} as const;

/** JSON and binary parts of a binary frame are split by this byte */
const binaryDelimiter = 255;

/** A message the server sends for one request */
export type OrpcPeerResponseMessageType =
  | { id: string; type: "response"; status: number; headers: Record<string, unknown>; body: unknown }
  | { id: string; type: "event"; event: OrpcIteratorEventType }
  | { id: string; type: "abort" };

const getMalformedError = (detail: string) => new TypeError(`Invalid oRPC message: ${detail}`);

/**
 * Starts the call of the procedure - the same request message as the `RPCLink` of `@orpc/client/websocket`.
 * The input is serialized with the RPC serializer, inputs with files are not supported.
 */
export const encodeOrpcRequestMessage = ({
  id,
  topic,
  payload,
  headers,
  serializer,
}: {
  id: string;
  topic: string;
  payload: unknown;
  headers: Record<string, string>;
  serializer: OrpcSerializerType;
}): string => {
  const body = serializer.serialize(payload);
  if (body instanceof FormData) {
    throw new TypeError(`Files in the input of "${topic}" are not supported by the oRPC WebSocket adapter`);
  }

  // The `POST` method is the default of the protocol, so it is not sent
  return JSON.stringify({
    i: id,
    p: { u: orpcEndpointMapper(topic), b: body, h: Object.keys(headers).length > 0 ? headers : undefined },
  });
};

/** Stops the call of the procedure, the server cancels its iterator */
export const encodeOrpcAbortMessage = (id: string): string => {
  return JSON.stringify({ i: id, t: peerMessageType.ABORT_SIGNAL });
};

const readFrameText = (frame: unknown): string => {
  if (typeof frame === "string") {
    return frame;
  }
  if (frame instanceof ArrayBuffer || ArrayBuffer.isView(frame)) {
    const bytes =
      frame instanceof ArrayBuffer
        ? new Uint8Array(frame)
        : new Uint8Array(frame.buffer, frame.byteOffset, frame.byteLength);
    // Binary frames carry a file after the delimiter, event iterators never send files
    const end = bytes.indexOf(binaryDelimiter);
    return new TextDecoder().decode(end === -1 ? bytes : bytes.subarray(0, end));
  }
  throw getMalformedError("expected a text or a binary frame");
};

/** Reads a message of the server, the same as `decodeResponseMessage` of oRPC. Throws for malformed frames. */
export const decodeOrpcResponseMessage = (frame: unknown): OrpcPeerResponseMessageType => {
  const message: unknown = JSON.parse(readFrameText(frame));
  if (!isRecord(message) || typeof message.i !== "string") {
    throw getMalformedError("expected an object with the request id");
  }

  const { i: id, t: type, p: payload } = message;
  if (type === peerMessageType.ABORT_SIGNAL) {
    return { id, type: "abort" };
  }
  if (!isRecord(payload)) {
    throw getMalformedError("expected the payload object");
  }

  if (type === peerMessageType.EVENT_ITERATOR) {
    const { e: event, d: data, m: meta } = payload;
    if (event !== "message" && event !== "error" && event !== "done") {
      throw getMalformedError(`unknown event "${String(event)}"`);
    }
    return { id, type: "event", event: { event, data, meta: isRecord(meta) ? meta : undefined } };
  }

  // Any other message is a response, the same as in oRPC
  const { s: status = 200, h: headers = {}, b: body } = payload;
  if (typeof status !== "number" || !isRecord(headers)) {
    throw getMalformedError("expected the status and the headers of the response");
  }
  return { id, type: "response", status, headers, body };
};

const flattenHeader = (header: unknown): string | undefined => {
  if (typeof header === "string") {
    return header;
  }
  return Array.isArray(header) && header.length > 0 ? header.join(", ") : undefined;
};

/** The same check as `isEventIteratorHeaders` of oRPC - an event stream that is not a file */
export const isOrpcEventIteratorResponse = (headers: Record<string, unknown>): boolean => {
  return (
    !!flattenHeader(headers["content-type"])?.startsWith("text/event-stream") &&
    flattenHeader(headers["content-disposition"]) === undefined
  );
};
