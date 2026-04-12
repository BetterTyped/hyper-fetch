import type { RequestInstance, ExtractErrorType, ExtractAdapterExtraType, ExtractAdapterType } from "@hyper-fetch/core";

export type UseStreamOptionsType = {
  /**
   * When true, the stream starts automatically on mount. Defaults to false.
   */
  autoStart?: boolean;
};

export type UseStreamReturnType<T extends RequestInstance> = {
  /**
   * Accumulated text from all stream chunks decoded as UTF-8.
   * Useful for text-based streaming like LLM responses or SSE.
   */
  text: string;
  /**
   * Raw binary chunks received from the stream.
   * Useful for binary streaming like file downloads.
   */
  chunks: Uint8Array[];
  /**
   * Whether the stream is currently being consumed.
   */
  streaming: boolean;
  /**
   * Whether the stream has finished (all chunks consumed).
   */
  done: boolean;
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
   * Start consuming the stream. The request is sent with `streaming: true`.
   */
  start: () => void;
  /**
   * Abort the ongoing stream.
   */
  abort: () => void;
  /**
   * Reset state to initial values, allowing a fresh stream.
   */
  reset: () => void;
};
