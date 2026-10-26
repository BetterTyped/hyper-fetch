import type { AdapterInstance, ClientInstance, Dispatcher } from "@hyper-fetch/core";
import type { UseIsFetchingOptionsType } from "hooks/use-is-fetching";
import { useCallback, useRef, useSyncExternalStore } from "react";

const useRunningRequestsCount = (
  dispatcher: Dispatcher<AdapterInstance>,
  options?: UseIsFetchingOptionsType,
): number => {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const subscribe = useCallback(
    (listener: () => void) => dispatcher.events.onRunningRequestsChange(listener),
    [dispatcher],
  );

  const getCount = () => {
    const { queryKey, predicate } = optionsRef.current || {};
    return dispatcher.getAllRunningRequests().filter(({ request }) => {
      if (typeof queryKey === "string" && request.queryKey !== queryKey) {
        return false;
      }
      if (queryKey instanceof RegExp && !queryKey.test(request.queryKey)) {
        return false;
      }
      return !predicate || predicate(request);
    }).length;
  };

  return useSyncExternalStore(subscribe, getCount, getCount);
};

/**
 * Count of the currently running fetch requests (useFetch, useCache and fetch dispatcher). Useful for global loading indicators.
 * @param client Client instance
 * @param options Filters for the counted requests
 * @returns number of running requests
 */
export const useIsFetching = (client: ClientInstance, options?: UseIsFetchingOptionsType): number => {
  return useRunningRequestsCount(client.fetchDispatcher, options);
};

/**
 * Count of the currently running submit requests (useSubmit and submit dispatcher). Useful for global saving indicators.
 * @param client Client instance
 * @param options Filters for the counted requests
 * @returns number of running requests
 */
export const useIsSubmitting = (client: ClientInstance, options?: UseIsFetchingOptionsType): number => {
  return useRunningRequestsCount(client.submitDispatcher, options);
};
