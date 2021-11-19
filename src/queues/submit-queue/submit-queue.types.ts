import { FetchMiddlewareInstance } from "middleware";

export type SubmitQueueStoreKeyType = string;
export type SubmitQueueStoreValueType = Set<SubmitQueueValueType>;
export type SubmitQueueValueType = {
  request: FetchMiddlewareInstance;
  retries: number;
  timestamp: Date;
};
