import { useRef } from "react";
import { useDidMount, useDidUpdate, useWillUnmount } from "@better-typed/react-lifecycle-hooks";

import { Cache } from "cache/cache";
import { FetchMiddlewareInstance } from "middleware";
import { getCacheKey, CACHE_EVENTS, CacheValueType } from "cache";
import { FetchQueue } from "queues";
import { ExtractResponse, ExtractError, ExtractFetchReturn } from "types";
import { DateInterval } from "constants/time.constants";

import { useCacheState } from "hooks/use-cache-state/use-cache-state.hooks";
import { useDebounce } from "hooks/use-debounce/use-debounce.hooks";
import { useInterval } from "hooks/use-interval/use-interval.hooks";
import { useWindowEvent } from "hooks/use-window-event/use-window-event.hooks";

import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseFetchOptionsType,
  UseFetchReturnType,
} from "./use-fetch.types";
import { getCacheState } from "./use-fetch.utils";
import { useFetchDefaultOptions } from "./use-fetch.constants";

// TBD - suspense in general
// suspense = false,

export const useFetch = <T extends FetchMiddlewareInstance, MapperResponse>(
  middleware: T,
  {
    dependencies = [],
    disabled = false,
    retry = false,
    retryTime = DateInterval.second,
    cacheTime = DateInterval.hour,
    cacheKey = "",
    cacheOnMount = true,
    initialCacheData = null,
    initialData = null,
    refresh = false,
    refreshTime = DateInterval.hour,
    refreshOnTabBlur = false,
    refreshOnTabFocus = false,
    refreshOnReconnect = false,
    debounce = false,
    cancelable = false,
    debounceTime = DateInterval.second * 200,
    deepCompareFn = null,
    mapperFn = null,
    shouldThrow = false,
  }: UseFetchOptionsType<T, MapperResponse> = useFetchDefaultOptions,
): UseFetchReturnType<T, MapperResponse extends never ? ExtractResponse<T> : MapperResponse> => {
  const requestDebounce = useDebounce(debounceTime);
  const retryDebounce = useDebounce(retryTime);
  const refreshInterval = useInterval(refreshTime);

  const key = useRef(getCacheKey(middleware, cacheKey)).current;
  const cache = useRef(new Cache<T>(middleware)).current;
  const initCacheState = useRef(getCacheState(cache.get(key), cacheOnMount, cacheTime)).current;
  const initState = useRef(initialData || initCacheState).current;
  const [state, actions] = useCacheState<ExtractResponse<T>, ExtractError<T>>(initState);

  const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>>>(null);

  const handleFetch = (retries = 0) => {
    if (!disabled) {
      const queue = new FetchQueue(key, cache);

      queue.add(
        {
          request: middleware,
          retries,
        },
        cancelable,
        deepCompareFn,
      );
    }
  };

  const handleRetry = (retries: number) => {
    if (retry === true || (typeof retry === "number" && retries < retry)) {
      retryDebounce.debounce(() => handleFetch(retries + 1));
    } else {
      retryDebounce.resetDebounce();
    }
  };

  const handleRefresh = () => {
    refreshInterval.resetInterval();

    const queue = new FetchQueue(key, cache);
    const currentRequest = queue.get();

    if (refresh && !currentRequest) {
      refreshInterval.interval(() => {
        handleFetch();
      });
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
        if (shouldThrow) {
          throw {
            message: "Fetching Error.",
            error: response[1],
          };
        }
      }
      onFinishedCallback?.current?.(response);
    }
  };

  const handleGetUpdatedCache = (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    actions.setCacheData(cacheData);
    handleCallbacks(cacheData.response, cacheData.retries);
  };

  const handleInitialCacheState = () => {
    if (!initCacheState && initialCacheData) {
      cache.set(key, initialCacheData, 0);
    }
  };

  const refreshFn = () => {
    handleFetch();
  };

  useDidMount(() => {
    handleCallbacks(initState?.response);
    handleInitialCacheState();

    CACHE_EVENTS.get<T>(key, handleGetUpdatedCache);
  });

  useDidUpdate(
    () => {
      if (!initCacheState && !disabled) {
        if (debounce) {
          requestDebounce.debounce(handleFetch);
        } else {
          handleFetch();
        }
      }
    },
    [...dependencies, disabled],
    true,
  );

  useDidUpdate(
    () => {
      if (!disabled && refresh) {
        handleRefresh();
      }
    },
    [refresh, disabled, refreshTime],
    true,
  );

  useWillUnmount(() => {
    CACHE_EVENTS.umount(key, handleGetUpdatedCache);
  });

  useWindowEvent(
    "online",
    () => {
      handleFetch();
    },
    refreshOnReconnect,
  );

  useWindowEvent(
    "focus",
    () => {
      handleFetch();
    },
    refreshOnTabFocus,
  );

  useWindowEvent(
    "blur",
    () => {
      handleFetch();
    },
    refreshOnTabBlur,
  );

  return {
    ...state,
    data: mapperFn && state.data ? (mapperFn(state.data) as any) : state.data,
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
    refresh: refreshFn,
  };
};
