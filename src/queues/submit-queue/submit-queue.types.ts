import { FetchCommandInstance } from "command";

export type SubmitQueueStoreKeyType = string;
export type SubmitQueueStoreValueType = Set<SubmitQueueValueType>;
export type SubmitQueueValueType = {
  request: FetchCommandInstance;
  retries: number;
  timestamp: Date;
};
