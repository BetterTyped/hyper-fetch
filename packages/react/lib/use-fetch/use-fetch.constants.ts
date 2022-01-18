import { DateInterval } from "@better-typed/hyper-fetch";

export const useFetchDefaultOptions = {
  dependencies: [],
  disabled: false,
  dependencyTracking: true,
  cacheOnMount: true,
  revalidateOnMount: true,
  initialData: null,
  refresh: false,
  refreshTime: DateInterval.hour,
  refreshBlurred: false,
  refreshOnTabBlur: false,
  refreshOnTabFocus: false,
  refreshOnReconnect: false,
  cancelable: false,
  debounce: false,
  debounceTime: 400, // milliseconds
  deepCompareFn: undefined,
  responseDataModifierFn: null,
  shouldThrow: false,
};
