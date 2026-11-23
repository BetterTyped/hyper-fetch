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
  /** Result of the optimistic callback - available in the callbacks of `send()` and in the request `$hooks` */
  mutationContext?: OptimisticCallbackResult<any>;
};

/**
 * Event of a failed attempt which scheduled a retry. It comes after the response of that attempt and before the
 * request waits `delay` milliseconds to be sent again.
 */
export type RequestRetryEventType<T extends RequestInstance> = RequestResponseEventType<T> & {
  /** Number of the scheduled retry, counted from 1 - the request makes up to `request.retry` of them */
  retry: number;
  /** Time in milliseconds the request waits before it is sent again */
  delay: number;
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
