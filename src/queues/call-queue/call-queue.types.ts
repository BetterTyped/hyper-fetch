import { FetchMiddlewareInstance } from "middleware";

export type CallQueueStoreKeyType = string;
export type CallQueueStoreValueType = Set<CallQueueValueType>;
export type CallQueueValueType = {
  request: FetchMiddlewareInstance;
  retries: number;
  timestamp: Date;
};
