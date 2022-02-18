import { DateInterval } from "@better-typed/hyper-fetch";

export const useFetchDefaultOptions = {
  dependencies: [],
  disabled: false,
  dependencyTracking: true,
  revalidateOnMount: true,
  initialData: null,
  refresh: false,
  refreshTime: DateInterval.hour,
  refreshBlurred: false,
  refreshOnTabBlur: false,
  refreshOnTabFocus: false,
  refreshOnReconnect: false,
  debounce: false,
  debounceTime: 400, // milliseconds
  shouldThrow: false,
};
