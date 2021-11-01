import { useRef } from "react";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import { Cache } from "cache/cache";
import { FetchMiddlewareInstance } from "middleware";
import { getCacheKey, CACHE_EVENTS } from "cache";
import { FetchQueue } from "queues";
import { ExtractResponse, ExtractError, ExtractFetchReturn } from "types";
import { DateInterval } from "constants/time.constants";

import { useCacheState } from "hooks/use-cache-state/use-cache-state.hooks";
import { useDebounce } from "hooks/use-debounce/use-debounce.hook";

import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseFetchOptionsType,
} from "./use-fetch.types";
import { getCacheState } from "./use-fetch.utils";

export const useFetch = <T extends FetchMiddlewareInstance>(
  middleware: T,
  {
    dependencies = [],
    disabled = false,
    retry = false,
    retryTime = DateInterval.second,
    cacheType = "normal",
    cacheTime = DateInterval.hour,
    cacheKey = "",
    cacheOnMount = true,
    initialCacheData = null,
    initialData = null,
    refreshTime = DateInterval.hour,
    refreshOnTabBlur = false,
    refreshOnTabFocus = false,
    refreshOnReconnect = false,
    debounceTime = 0,
    suspense = false,
    shouldThrow = false,
    cancelable = false,
    mapperFn = null,
    deepCompareFn = null,
    plugins = [],
  }: UseFetchOptionsType<T>,
) => {
  const requestDebounce = useDebounce(debounceTime);
  const refreshDebounce = useDebounce(retryTime);

  const key = useRef(getCacheKey(middleware, cacheKey)).current;
  const cache = useRef(new Cache<T>(middleware)).current;
  const initCacheState = useRef(getCacheState(cache.get(key), cacheOnMount, cacheTime, cacheType)).current;
  const initState = useRef(initialData || initCacheState).current;
  const [state, actions] = useCacheState<ExtractResponse<T>, ExtractError<T>>(initState);

  const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>>>(null);

  const handleFetch = (retries = 0) => {
    if (!disabled) {
      const queue = new FetchQueue(key, cache);

      queue.add({
        request: middleware,
        retries,
      });
    }
  };

  const handleRetry = (retries: number) => {
    if (retry === true || (typeof retry === "number" && retries < retry)) {
      refreshDebounce.debounce(() => handleFetch(retries + 1));
    }
  };

  const handleCallbacks = (response: ExtractFetchReturn<T> | undefined, retries = 0) => {
    if (response) {
      if (response[0]) {
        onSuccessCallback?.current?.(response[0]);
      }
      if (response[1]) {
        onErrorCallback?.current?.(response[1]);
        handleRetry(retries);
      }
      onFinishedCallback?.current?.(response);
    }
  };

  const handleGetUpdatedCache = () => {
    CACHE_EVENTS.get<T>(key, (cacheData) => {
      actions.setCacheData(cacheData); // fix unmount listener
      handleCallbacks(cacheData.response, cacheData.retries);
    });
  };

  const handleInitialCacheState = () => {
    if (!initCacheState && initialCacheData) {
      // cache.set() // add initial injection
    }
  };

  const refresh = () => {
    handleFetch();
  };

  useDidMount(() => {
    handleCallbacks(initState?.response);
    handleGetUpdatedCache();
    handleInitialCacheState();
  });

  useDidUpdate(
    () => {
      if (!initCacheState) {
        requestDebounce.debounce(() => {
          handleFetch();
        });
      }
    },
    [...dependencies, disabled],
    true,
  );

  return {
    ...state,
    actions,
    onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => {
      onSuccessCallback.current = callback;
    },
    onError: (callback: OnErrorCallbackType<ExtractError<T>>) => {
      onErrorCallback.current = callback;
    },
    onFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => {
      onFinishedCallback.current = callback;
    },
    isCanceled: false,
    isRefreshed: state.isRefreshed,
    isRefreshingError: !!state.error && state.isRefreshed,
    isDebouncing: requestDebounce.active,
    refresh,
  };
};
