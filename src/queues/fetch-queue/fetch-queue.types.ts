import { FetchMiddlewareInstance } from "middleware";

export type FetchQueueStoreKeyType = string;
export type FetchQueueStoreValueType = FetchQueueValueType;
export type FetchQueueValueType = {
  request: FetchMiddlewareInstance;
  retries: number;
};
