import { DateInterval } from "constants/time.constants";

export const useFetchDefaultOptions = {
  dependencies: [],
  disabled: false,
  retry: false,
  retryTime: DateInterval.second,
  cacheTime: DateInterval.hour,
  cacheKey: "",
  cacheOnMount: true,
  initialCacheData: null,
  initialData: null,
  refresh: false,
  refreshTime: DateInterval.hour,
  refreshOnTabBlur: false,
  refreshOnTabFocus: false,
  refreshOnReconnect: false,
  debounce: false,
  cancelable: false,
  debounceTime: DateInterval.second * 200,
  deepCompareFn: null,
  mapperFn: null,
};
