import { Time, RequestInstance, RequiredKeys } from "@hyper-fetch/core";

import { UseFetchOptionsType } from "hooks/use-fetch";

type DefaultOptionsType = RequiredKeys<Omit<UseFetchOptionsType<RequestInstance>, "initialResponse">> & {
  initialResponse: null;
};

export const useFetchDefaultOptions: DefaultOptionsType = {
  dependencies: [],
  disabled: false,
  dependencyTracking: true,
  revalidate: true,
  initialResponse: null,
  refresh: false,
  refreshTime: Time.HOUR,
  refetchBlurred: true,
  refetchOnBlur: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  bounce: false,
  bounceType: "debounce",
  bounceTime: 400,
  deepCompare: true,
};
