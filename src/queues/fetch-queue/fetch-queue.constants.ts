import { isEqual } from "cache";
import { FetchQueueStoreKeyType, FetchQueueStoreValueType } from "./fetch-queue.types";

export const FetchQueueStore = new Map<FetchQueueStoreKeyType, FetchQueueStoreValueType>();

export const initialFetchQueueOptions = {
  cancelable: false,
  deepCompareFn: isEqual,
  isRefreshed: false,
  isRevalidated: false,
};
