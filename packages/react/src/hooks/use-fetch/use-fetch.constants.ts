import { DateInterval, RequestInstance, RequiredKeys } from "@hyper-fetch/core";

import { UseFetchOptionsType } from "hooks/use-fetch";

type DefaultOptionsType = RequiredKeys<Omit<UseFetchOptionsType<RequestInstance>, "initialData">> & {
  initialData: null;
};

export const useFetchDefaultOptions: DefaultOptionsType = {
  dependencies: [],
  disabled: false,
  dependencyTracking: true,
  revalidate: true,
  initialData: null,
  refresh: false,
  refreshTime: DateInterval.hour,
  refetchBlurred: true,
  refetchOnBlur: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  bounce: false,
  bounceType: "debounce",
  bounceTime: 400,
  deepCompare: true,
};
