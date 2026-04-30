import type { RequestInstance, RequiredKeys } from "@hyper-fetch/core";
import { Time } from "@hyper-fetch/core";
import type { UseFetchOptionsType } from "hooks/use-fetch";

type DefaultOptionsType = RequiredKeys<Omit<UseFetchOptionsType<RequestInstance>, "initialResponse">> & {
  initialResponse: null;
};

export const useFetchDefaultOptions: DefaultOptionsType = {
  suspense: false,
  dependencies: [],
  disabled: false,
  dependencyTracking: true,
  revalidate: true,
  initialResponse: null,
  keepPreviousData: "auto",
  refresh: false,
  refreshTime: Time.HOUR,
  refetchBlurred: true,
  refetchOnBlur: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  bounce: false,
  bounceType: "debounce",
  bounceTime: 400,
  bounceTimeout: 400,
  deepCompare: true,
};
