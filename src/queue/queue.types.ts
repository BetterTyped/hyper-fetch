import { FetchMiddlewareInstance } from "middleware/fetch.middleware.types";

export type QueueStoreKeyType = string;
export type QueueStoreValueType = Set<QueueValueType>;
export type QueueValueType = {
  request: FetchMiddlewareInstance;
};
