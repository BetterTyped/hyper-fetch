import { FetchMiddlewareInstance } from "middleware";
import { deepCompare } from "cache";

export type FetchQueueStoreKeyType = string;
export type FetchQueueStoreValueType = FetchQueueValueType;
export type FetchQueueValueType = {
  request: FetchMiddlewareInstance;
  retries: number;
  timestamp: Date;
};
export type FetchQueueOptionsType = {
  isRefreshed: boolean;
  cancelable: boolean;
  deepCompareFn?: typeof deepCompare | null;
};
