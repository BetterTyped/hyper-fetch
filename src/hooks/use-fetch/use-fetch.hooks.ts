import { useRef } from "react";
import { useDidMount, useDidUpdate, useWillUnmount } from "@better-typed/react-lifecycle-hooks";

import { Cache } from "cache/cache";
import { FetchMiddlewareInstance } from "middleware";
import { getCacheKey, CACHE_EVENTS, CacheValueType } from "cache";
import { FetchQueue, FETCH_QUEUE_EVENTS } from "queues";
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
    cacheTime = DateInterval.minute * 5,
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

  let key = useRef(getCacheKey(middleware, cacheKey)).current;
  let cache = useRef(new Cache<T>(middleware)).current;
  const initCacheState = useRef(getCacheState(cache.get(key), cacheOnMount, cacheTime)).current;
  const initState = useRef(initialData || initCacheState).current;
  const [state, actions] = useCacheState<T>(key, cache, initState);

  const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>>>(null);

  const isStaleCacheData = () => {
    const { timestamp, data } = state;
    if (!timestamp || !data) return true;
    return +new Date() > +timestamp + cacheTime;
  };

  const hasStateData = () => {
    return !!state.data || !!state.error;
  };

  const handleFetch = (retries = 0, isRefreshed = state.isRefreshed) => {
    const queue = new FetchQueue(key, cache);

    const isStale = isStaleCacheData();
    const hasData = hasStateData();

    /**
     * We can fetch when data is not stale or we don't have data at all
     * The exception is made for refreshing which should be triggered no matter if data is fresh or not
     * That's because cache time gives the details if the INITIAL call should be made, refresh works without limits
     */
    if (!disabled && (isStale || !hasData || isRefreshed)) {
      const request = {
        request: middleware,
        retries,
        timestamp: new Date(),
      };

      queue.add(request, {
        cancelable,
        deepCompareFn,
        isRefreshed,
      });
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

    const { timestamp } = state;

    const timeLeft = timestamp ? Math.max(+timestamp + refreshTime - +new Date()) : 0;

    if (refresh) {
      refreshInterval.interval(() => {
        const queue = new FetchQueue(key, cache);
        const currentRequest = queue.get();

        if (!currentRequest) {
          handleFetch(0, true);
          refreshInterval.resetInterval();
        }
      }, timeLeft);
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
    actions.setCacheData(cacheData, false);
    handleCallbacks(cacheData.response, cacheData.retries);
  };

  const handleGetLoadingEvent = (isLoading: boolean) => {
    actions.setLoading(isLoading, false);
  };

  const handleInitialCacheState = () => {
    if (!initCacheState && initialCacheData) {
      cache.set({ key, response: initialCacheData, retries: 0, isRefreshed: false });
    }
    if (initCacheState) {
      actions.setCacheData(initCacheState, false);
    }
  };

  const refreshFn = () => {
    handleFetch(0, true);
  };

  const handleData = () => {
    return mapperFn && state.data ? mapperFn(state.data) : state.data;
  };

  /**
   * Initialization of the events related to data exchange with cache and queue
   * This allow to share the state with other hooks and keep it related
   */
  useDidMount(() => {
    handleCallbacks(initState?.response);
    handleInitialCacheState();

    FETCH_QUEUE_EVENTS.getLoading(key, handleGetLoadingEvent);
    CACHE_EVENTS.get<T>(key, handleGetUpdatedCache);
  });

  /**
   * Main fetching logic for mounting and updates handling
   */
  useDidUpdate(
    () => {
      const hasData = hasStateData();

      /**
       * While debouncing we need to make sure that first request is not debounced when the cache is not available
       * This way it will not wait for debouncing but fetch data right away
       */
      if (hasData && debounce) {
        requestDebounce.debounce(handleFetch);
      } else {
        handleFetch(0);
      }
    },
    [...dependencies, disabled],
    true,
  );

  /**
   * When cache key changes - we have to apply changes to switch the cache container
   */
  useDidUpdate(
    () => {
      key = getCacheKey(middleware);
      cache = new Cache<T>(middleware);
    },
    [getCacheKey(middleware)],
    true,
  );

  useDidUpdate(
    () => {
      if (!disabled && refresh) {
        handleRefresh();
      }
    },
    [refresh, disabled, refreshTime, state.timestamp, refreshInterval.active],
    true,
  );

  /**
   * Unmount all events to prevent updates of unmounted state
   */
  useWillUnmount(() => {
    FETCH_QUEUE_EVENTS.umountLoading(key, handleGetLoadingEvent);
    CACHE_EVENTS.umount(key, handleGetUpdatedCache);
  });

  useWindowEvent(
    "online",
    () => {
      handleFetch(0, true);
    },
    !refreshOnReconnect,
  );

  useWindowEvent(
    "focus",
    () => {
      handleFetch(0, true);
    },
    !refreshOnTabFocus,
  );

  useWindowEvent(
    "blur",
    () => {
      handleFetch(0, true);
    },
    !refreshOnTabBlur,
  );

  return {
    ...state,
    data: handleData() as any,
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
    isRefreshed: state.isRefreshed,
    isRefreshingError: !!state.error && state.isRefreshed,
    isDebouncing: requestDebounce.active,
    refresh: refreshFn,
  };
};
