import type {
  RequestInstance,
  ExtractErrorType,
  ExtractAdapterExtraType,
  ExtractAdapterType,
  ExtractResponseType,
  ServerSentEventType,
} from "@hyper-fetch/core";

/**
 * How to interpret the streamed text:
 * - `"text"` - only accumulate `text` and `chunks` (default)
 * - `"sse"` - also parse Server-Sent Events into `events` (works for POST requests, unlike `EventSource`)
 * - `"ndjson"` - also parse newline-delimited JSON into `events`
 */
export type UseStreamFormatType = "text" | "sse" | "ndjson";

export type UseStreamEventType<Format extends UseStreamFormatType, NDJSONValue = unknown> = Format extends "sse"
  ? ServerSentEventType
  : Format extends "ndjson"
    ? NDJSONValue
    : never;

export type UseStreamOptionsType<Format extends UseStreamFormatType = "text", NDJSONValue = unknown> = {
  /**
   * When true, the stream starts automatically on mount. Defaults to false.
   */
  autoStart?: boolean;
  /**
   * Parse the stream into `events`. Defaults to `"text"` (no parsing).
   */
  format?: Format;
  /**
   * Called for every parsed event (requires `format` to be `"sse"` or `"ndjson"`).
   */
  onEvent?: (event: UseStreamEventType<Format, NDJSONValue>) => void;
  /**
   * Called for every raw chunk with its decoded text.
   */
  onChunk?: (chunk: { chunk: Uint8Array; text: string; index: number }) => void;
};

export type UseStreamReturnType<
  T extends RequestInstance,
  Format extends UseStreamFormatType = "text",
  NDJSONValue = unknown,
> = {
  /**
   * Accumulated text from all stream chunks decoded as UTF-8.
   * Useful for text-based streaming like LLM responses or SSE.
   */
  text: string;
  /**
   * Raw binary chunks received from the stream. The array is appended in place while streaming
   * (no copy per chunk) - read it during render, don't use its identity as a memo dependency.
   */
  chunks: Uint8Array[];
  /**
   * Parsed events when `format` is `"sse"` or `"ndjson"`. Appended in place like `chunks`.
   */
  events: UseStreamEventType<Format, NDJSONValue>[];
  /**
   * Full response data once the stream is done (parsed the same way as a non-streaming response).
   */
  data: ExtractResponseType<T> | null;
  /**
   * Whether the stream is currently being consumed.
   */
  streaming: boolean;
  /**
   * Whether the stream has finished (all chunks consumed).
   */
  done: boolean;
  /**
   * Whether the stream was aborted with `abort()`.
   */
  aborted: boolean;
  /**
   * Error from the request or stream consumption.
   */
  error: ExtractErrorType<T> | null;
  /**
   * Response extra metadata (headers, etc.).
   */
  extra: ExtractAdapterExtraType<ExtractAdapterType<T>> | null;
  /**
   * HTTP status code from the response.
   */
  status: number | null;
  /**
   * Start consuming the stream. The request is sent with `streaming: true`. Restarting while a stream is
   * running is ignored - call `abort()` or `reset()` first.
   */
  start: () => void;
  /**
   * Abort the ongoing stream. The underlying request is aborted, so the network connection is closed too.
   */
  abort: () => void;
  /**
   * Abort any ongoing stream and reset state to initial values, allowing a fresh stream.
   */
  reset: () => void;
};
