import { DateInterval, CommandInstance, RequiredKeys } from "@better-typed/hyper-fetch";

import { UseFetchOptionsType } from "hooks/use-fetch";

type DefaultOptionsType = RequiredKeys<Omit<UseFetchOptionsType<CommandInstance>, "initialData">> & {
  initialData: null;
};

export const useFetchDefaultOptions: DefaultOptionsType = {
  dependencies: [],
  disabled: false,
  dependencyTracking: true,
  revalidateOnMount: true,
  initialData: null,
  refresh: false,
  refreshTime: DateInterval.hour,
  refreshBlurred: true,
  refreshOnBlur: false,
  refreshOnFocus: false,
  refreshOnReconnect: false,
  bounce: false,
  bounceType: "debounce",
  bounceTime: 400,
  deepCompare: true,
};
