import { RequestInstance } from "request";

// Events
export type RequestLoadingEventType = {
  queueKey: string;
  requestId: string;
  loading: boolean;
  isRetry: boolean;
  isOffline: boolean;
};

export type RequestEventType<T extends RequestInstance> = {
  requestId: string;
  request: T;
};

export type ResponseDetailsType = {
  retries: number;
  timestamp: number;
  isSuccess: boolean;
  isCanceled: boolean;
  isOffline: boolean;
};

export type RequestRemoveDataType = { queueKey: string; requestId: string };
