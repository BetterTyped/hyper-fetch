import { Time } from "@hyper-fetch/core";

import type { UseInfiniteFetchConfigType } from "./use-infinite-fetch.types";

export const useInfiniteFetchDefaultOptions = {
  suspense: false,
  throwOnError: false,
  dependencies: [],
  disabled: false,
  dependencyTracking: true,
  // Pages restored from the cache are refetched only once they are stale
  revalidate: false,
  keepPreviousData: "auto",
  refresh: false,
  refreshTime: Time.HOUR,
  refetchBlurred: true,
  refetchOnBlur: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  structuralSharing: true,
  bounce: false,
  bounceType: "debounce",
  bounceTime: 400,
  bounceTimeout: 400,
} satisfies Required<UseInfiniteFetchConfigType>;
