import { FetchMiddlewareInstance } from "middleware";
import { isEqual } from "cache";

export type FetchQueueStoreKeyType = string;
export type FetchQueueStoreValueType = FetchQueueValueType;
export type FetchQueueValueType = {
  request: FetchMiddlewareInstance;
  retries: number;
  timestamp: Date;
};
export type FetchQueueOptionsType = {
  cancelable?: boolean;
  isRetry?: boolean;
  isRefreshed?: boolean;
  isRevalidated?: boolean;
  deepCompareFn?: typeof isEqual | undefined;
};

export type FetchLoadingEventType = {
  isLoading: boolean;
  isRefreshed: boolean;
  isRevalidated: boolean;
  isRetry: boolean;
};
