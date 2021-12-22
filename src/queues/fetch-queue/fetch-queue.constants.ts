import { isEqual } from "cache";

export const initialFetchQueueOptions = {
  cancelable: false,
  deepCompareFn: isEqual,
  isRetry: false,
  isRefreshed: false,
  isRevalidated: false,
};
