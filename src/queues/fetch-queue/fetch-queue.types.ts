import { FetchMiddlewareInstance } from "middleware";

export type FetchQueueStoreKeyType = string;
export type FetchQueueStoreValueType = Set<FetchQueueValueType>;
export type FetchQueueValueType = {
  request: FetchMiddlewareInstance;
  retries: number;
  timestamp: Date;
};
