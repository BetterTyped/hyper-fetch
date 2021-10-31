import { useRef } from "react";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import { Cache } from "cache/cache";
import { FetchMiddlewareInstance } from "middleware";
import { getCacheKey, CACHE_EVENTS } from "cache";
import { FetchQueue } from "queues";
import { useCacheState } from "hooks/use-cache-state/use-cache-state.hooks";
import { ExtractResponse, ExtractError } from "types";

/**
 * const {
 data: T
 isLoading: boolean
 error: T
 actions: setters
 onSuccess: fn (data, isRefreshed)
 onError: fn (data, isRefreshed)
 onFinished: fn (data, error, isRefreshed)
 status: number 200 404 etc
 isCanceled: bool
 isCached: bool
 isRefreshed: bool
 timestamp: Date
 isSuccess: bool
 isError: bool
 isRefreshingError: bool
 isDebounce: bool
 failureCount: number
 fetchCount: number
 refresh: fn
 invalidateCache: fn - jednocześnie triggeruje refresh
 cancel: fn
} = useFetch({
 dependencies: any[]
 disabled: bool
 retry: boolean / number
 retryTime: number
 cache: once, service-worker, aging, none
 cacheTime: number
 cacheKey: string - custom to endpoint
 cacheOnMount: boolean
 cacheInitialData: T
 refreshTime: number / null
 refreshOnTabBlur: boolean
 refreshOnTabFocus: boolean
 refreshOnReconnect: boolean
 debounceTime: number,
 suspense: boolean
 throw: boolean
 cancelable: boolean
 mapperFn: (data) => newDataType
 deepCompareFn: (data) => void
 middleware: []
})
 */

export const useFetch = <T extends FetchMiddlewareInstance>(
  middleware: T,
  { cacheKey = "" } = { cacheKey: "" },
) => {
  const key = useRef(getCacheKey(middleware, cacheKey)).current;
  const cache = useRef(new Cache<T>(middleware)).current;
  const [state, actions] = useCacheState<ExtractResponse<T>, ExtractError<T>>(cache.get(key));

  useDidMount(() => {
    CACHE_EVENTS.get<T>(key, (cacheData) => {
      actions.setCacheData(cacheData);
    });
    // listeners for retries and responses, cache injection etc
  });

  useDidUpdate(
    () => {
      const queue = new FetchQueue(key, cache);

      const isPending = queue.get();

      // If already ongoing
      if (isPending) {
        // Here await for event to finish
      }

      // If it's first request
      if (!isPending) {
        queue.add({
          request: middleware,
          retries: 0,
        });
      }
    },
    [],
    true,
  );

  return {
    ...state,
    actions,
    onSuccess: () => null,
    onError: () => null,
    onFinished: () => null,
    isCanceled: false,
    isRefreshed: !!state.retries,
    isRefreshingError: !!state.error && !!state.retries,
    isDebouncing: false,
    refresh: () => null,
    invalidateCache: () => null,
    cancel: () => null,
  };
};
