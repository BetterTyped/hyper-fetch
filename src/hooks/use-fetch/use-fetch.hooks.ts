import { useRef } from "react";
import { useDidMount, useDidUpdate, useWillUnmount } from "@better-typed/react-lifecycle-hooks";

import { Cache } from "cache/cache";
import { FetchMiddlewareInstance, FetchMiddleware } from "middleware";
import { getCacheKey, CACHE_EVENTS, CacheValueType, getCacheInstanceKey, getRevalidateKey } from "cache";
import { FetchQueue, FETCH_QUEUE_EVENTS } from "queues";
import { ExtractResponse, ExtractError, ExtractFetchReturn } from "types";

import { useDependentState } from "hooks/use-dependent-state/use-dependent-state.hooks";
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
    dependencies = useFetchDefaultOptions.dependencies,
    disabled = useFetchDefaultOptions.disabled,
    retry = useFetchDefaultOptions.retry,
    retryTime = useFetchDefaultOptions.retryTime,
    cacheTime = useFetchDefaultOptions.cacheTime,
    cacheKey = useFetchDefaultOptions.cacheKey,
    cacheOnMount = useFetchDefaultOptions.cacheOnMount,
    initialCacheData = useFetchDefaultOptions.initialCacheData,
    initialData = useFetchDefaultOptions.initialData,
    refresh = useFetchDefaultOptions.refresh,
    refreshTime = useFetchDefaultOptions.refreshTime,
    refreshOnTabBlur = useFetchDefaultOptions.refreshOnTabBlur,
    refreshOnTabFocus = useFetchDefaultOptions.refreshOnTabFocus,
    refreshOnReconnect = useFetchDefaultOptions.refreshOnReconnect,
    debounce = useFetchDefaultOptions.debounce,
    debounceTime = useFetchDefaultOptions.debounceTime,
    cancelable = useFetchDefaultOptions.cancelable,
    deepCompareFn = useFetchDefaultOptions.deepCompareFn,
    mapperFn = useFetchDefaultOptions.mapperFn,
    shouldThrow = useFetchDefaultOptions.shouldThrow,
  }: UseFetchOptionsType<T, MapperResponse> = useFetchDefaultOptions,
): UseFetchReturnType<T, MapperResponse extends never ? ExtractResponse<T> : MapperResponse> => {
  const requestDebounce = useDebounce(debounceTime);
  const retryDebounce = useDebounce(retryTime);
  const refreshInterval = useInterval(refreshTime);

  const cache = new Cache<T>(middleware, cacheKey);
  const key = getCacheKey(middleware);
  const initCacheState = useRef(getCacheState(cache.get(key), cacheOnMount, cacheTime));
  const initState = useRef(initialData || initCacheState.current);
  const [state, actions, setRenderKey] = useDependentState<T>(key, cache, initState.current);

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

  const handleFetch = (retries = 0, isRefreshed = state.isRefreshed, shouldCancel = cancelable) => {
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
        cancelable: shouldCancel,
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
    if (initCacheState.current) {
      actions.setCacheData(initCacheState.current, false);
    }
  };

  const handleRevalidate = () => {
    handleFetch(0, true, true);
  };

  const refreshFn = (invalidateKey?: string | FetchMiddlewareInstance) => {
    if (invalidateKey && typeof invalidateKey === "string") {
      CACHE_EVENTS.revalidate(invalidateKey);
    } else if (invalidateKey && invalidateKey instanceof FetchMiddleware) {
      CACHE_EVENTS.revalidate(getCacheInstanceKey(invalidateKey));
    } else {
      handleRevalidate();
    }
  };

  const handleMountEvents = () => {
    FETCH_QUEUE_EVENTS.getLoading(key, handleGetLoadingEvent);
    CACHE_EVENTS.get<T>(key, handleGetUpdatedCache);
    CACHE_EVENTS.onRevalidate(key, handleRevalidate);
  };

  const handleUnMountEvents = () => {
    FETCH_QUEUE_EVENTS.umount(key, handleGetLoadingEvent);
    CACHE_EVENTS.umount(key, handleGetUpdatedCache);
    CACHE_EVENTS.umount(getRevalidateKey(key), handleRevalidate);
  };

  const handleData = () => {
    return mapperFn && state.data ? mapperFn(state.data) : state.data;
  };

  /**
   * Initialization of the events related to data exchange with cache and queue
   * This allow to share the state with other hooks and keep it related
   */
  useDidMount(() => {
    handleCallbacks(initState.current?.response);
    handleInitialCacheState();
    handleMountEvents();
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

  useDidUpdate(
    () => {
      handleRefresh();
    },
    [refresh, refreshTime, state.timestamp],
    true,
  );

  /**
   * Unmount all events to prevent updates of unmounted state
   */
  useWillUnmount(() => {
    handleUnMountEvents();
    middleware.clean();
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
    // ts bug somehow multiplies the typings required here
    get data(): (MapperResponse extends never ? ExtractResponse<T> : MapperResponse) extends never
      ? ExtractResponse<T>
      : MapperResponse extends never
      ? ExtractResponse<T>
      : MapperResponse {
      setRenderKey("data");
      return handleData() as (MapperResponse extends never ? ExtractResponse<T> : MapperResponse) extends never
        ? ExtractResponse<T>
        : MapperResponse extends never
        ? ExtractResponse<T>
        : MapperResponse;
    },
    get error() {
      setRenderKey("error");
      return state.error;
    },
    get loading() {
      setRenderKey("loading");
      return state.loading;
    },
    get status() {
      setRenderKey("status");
      return state.status;
    },
    get retryError() {
      setRenderKey("retryError");
      return state.retryError;
    },
    get refreshError() {
      setRenderKey("refreshError");
      return state.refreshError;
    },
    get isRefreshed() {
      setRenderKey("isRefreshed");
      return state.isRefreshed;
    },
    get retries() {
      setRenderKey("retries");
      return state.retries;
    },
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    },
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
    isRefreshingError: !!state.error && state.isRefreshed,
    isDebouncing: requestDebounce.active,
    refresh: refreshFn,
  };
};
