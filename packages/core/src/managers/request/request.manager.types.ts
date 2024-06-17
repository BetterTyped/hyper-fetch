import { ProgressType, ResponseType } from "adapter";
import { RequestInstance } from "request";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";

// Events
export type RequestLoadingEventType<T extends RequestInstance> = {
  loading: boolean;
  isRetry: boolean;
  isOffline: boolean;
} & RequestEventType<T>;

export type RequestProgressEventType<T extends RequestInstance> = {
  progress: ProgressType;
} & RequestEventType<T>;

export type RequestEventType<T extends RequestInstance> = {
  request: T;
  requestId: string;
};

export type RequestResponseEventType<T extends RequestInstance> = {
  request: T;
  requestId: string;
  response: ResponseType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>;
  details: ResponseDetailsType;
};

export type ResponseDetailsType = {
  retries: number;
  timestamp: number;
  isCanceled: boolean;
  isOffline: boolean;
};
