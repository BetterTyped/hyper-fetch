import { DateInterval } from "@better-typed/hyper-fetch";

export const useSubmitDefaultOptions = {
  disabled: false,
  queueKey: "",
  invalidate: [],
  retry: false,
  retryTime: DateInterval.second,
  cacheTime: DateInterval.hour,
  cacheKey: "",
  cacheOnMount: true,
  initialCacheData: null,
  initialData: null,
  debounce: false,
  cancelable: false,
  debounceTime: DateInterval.second * 200,
  deepCompareFn: null,
  mapperFn: null,
  shouldThrow: false,
  offline: false,
};
