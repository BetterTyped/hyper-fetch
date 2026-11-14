import type { ProgressType, ResponseType } from "adapter";
import type { OptimisticCallbackResult, RequestInstance } from "request";
import type { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";

// Events
export type RequestLoadingEventType<T extends RequestInstance> = {
  loading: boolean;
  isRetry: boolean;
  isOffline: boolean;
} & RequestEventType<T>;

export type RequestProgressEventType<T extends RequestInstance> = ProgressType & RequestEventType<T>;

export type RequestEventType<T extends RequestInstance> = {
  request: T;
  requestId: string;
  mutationContext?: OptimisticCallbackResult<any>;
};

/**
 * Emitted for every chunk of a streamed response body (adapter option `streaming: true`).
 * Chunks arrive before the request resolves - `onResponse`/`onSuccess` fire only once the body has been fully read.
 */
export type RequestResponseChunkEventType<T extends RequestInstance> = RequestEventType<T> & {
  /** Raw bytes of this chunk */
  chunk: Uint8Array;
  /** This chunk decoded as UTF-8 (multi-byte characters split across chunks are handled) */
  text: string;
  /** Zero-based position of the chunk within the current response */
  index: number;
  /** Total bytes received so far, including this chunk */
  loaded: number;
};

export type RequestRemovedEventType<T extends RequestInstance> = {
  request: T;
  requestId: string;
  /** @true when we receive any response, @false if removed before response is received */
  resolved: boolean;
};

export type RequestResponseEventType<T extends RequestInstance> = {
  request: T;
  requestId: string;
  response: ResponseType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>;
  details: ResponseDetailsType;
};

export type RequestDeduplicatedEventType<T extends RequestInstance> = RequestEventType<T> & {
  deduplicatedRequest: T;
};

export type ResponseDetailsType = {
  /** If it's retry request we can see which attempt is it */
  retries: number;
  /** If request was canceled */
  isCanceled: boolean;
  /** If error from offline status */
  isOffline: boolean;
  /** Whether the dispatcher will schedule another retry for this request */
  willRetry: boolean;
  /** When added to dispatcher's queue (pre-middleware which could take time) */
  addedTimestamp: number;
  /** When request is picked from queue and started to be sent */
  triggerTimestamp: number;
  /** When adapter triggers request (after all middlewares) */
  requestTimestamp: number;
  /** When we receive response */
  responseTimestamp: number;
};
