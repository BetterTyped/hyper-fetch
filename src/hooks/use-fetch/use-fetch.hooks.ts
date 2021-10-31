import React, { useRef } from "react";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import { Cache } from "cache/cache";
import { FetchMiddlewareInstance } from "middleware";
import { getCacheKey } from "cache";
import { FetchQueue } from "queues";

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
 id: string - custom to endpoint
 dependencies: any[]
 disabled: bool
 retry: boolean / number
 retryTime: number
 cache: once, service-worker, number, none
 cacheOnMount: boolean
 refreshTime: number / null
 refreshOnTabBlur: boolean
 refreshOnTabFocus: boolean
 refreshOnReconnect: boolean
 debounceTime: number,
 suspense: boolean
 initialData: T
 initialDataCache: boolean
 throw: boolean
 offline: boolean
 cancelable: boolean
 mapperFn: (data) => newDataType
 compareFn: (data) => void
 middleware: []
})
 */

export const useFetch = <T extends FetchMiddlewareInstance>(
  middleware: T,
  { cacheKey = "" } = { cacheKey: "" },
) => {
  const cache = useRef(new Cache<T>(middleware)).current;

  useDidUpdate(
    () => {
      const key = getCacheKey(middleware, cacheKey);
      const queue = new FetchQueue(key);

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

  useDidMount(() => {
    // listeners for retries and responses, cache injection etc
  });

  return false;
  // return (
  //   // data: T
  //   // isLoading: boolean
  //   // error: T
  //   // actions: setters
  //   // onSuccess: fn (data, isRefreshed)
  //   // onError: fn (data, isRefreshed)
  //   // onFinished: fn (data, error, isRefreshed)
  //   // status: number 200 404 etc
  //   // isCanceled: bool
  //   // isCached: bool
  //   // isRefreshed: bool
  //   // timestamp: Date
  //   // isSuccess: bool
  //   // isError: bool
  //   // isRefreshingError: bool
  //   // isDebounce: bool
  //   // failureCount: number
  //   // fetchCount: number
  //   // refresh: fn
  //   // invalidateCache: fn - jednocześnie triggeruje refresh
  //   // cancel: fn
  // )
};
