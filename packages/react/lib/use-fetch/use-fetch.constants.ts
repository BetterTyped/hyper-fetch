import { DateInterval } from "@better-typed/hyper-fetch";

export const useFetchDefaultOptions = {
  dependencies: [],
  disabled: false,
  dependencyTracking: true,
  cacheOnMount: true,
  revalidateOnMount: false,
  initialData: null,
  refresh: false,
  refreshTime: DateInterval.hour,
  refreshBlurred: false,
  refreshOnTabBlur: false,
  refreshOnTabFocus: false,
  refreshOnReconnect: false,
  cancelable: false,
  debounce: false,
  debounceTime: DateInterval.second * 200,
  deepCompareFn: undefined,
  mapperFn: null,
  shouldThrow: false,
};
