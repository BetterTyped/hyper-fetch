import { ProgressType, ResponseType } from "adapter";
import { RequestInstance } from "request";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";

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

export type ResponseDetailsType = {
  retries: number;
  /** When we receive response */
  timestamp: number;
  /** When added to dispatcher's queue */
  addedTimestamp: number;
  isCanceled: boolean;
  isOffline: boolean;
};
