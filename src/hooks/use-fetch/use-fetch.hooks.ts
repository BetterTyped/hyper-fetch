import { useRef } from "react";
import { useDidMount, useDidUpdate, useWillUnmount } from "@better-typed/react-lifecycle-hooks";

import {
  isEqual,
  getCacheKey,
  CACHE_EVENTS,
  CacheValueType,
  getCacheEndpointKey,
  getRevalidateKey,
  getRefreshedKey,
} from "cache";
import { FetchCommandInstance, FetchCommand } from "command";
import { FetchLoadingEventType, FETCH_QUEUE_EVENTS } from "queues";
import { ExtractResponse, ExtractError, ExtractFetchReturn } from "types";

import { useDependentState } from "hooks/use-dependent-state/use-dependent-state.hooks";
import { useDebounce } from "hooks/use-debounce/use-debounce.hooks";
import { useInterval } from "hooks/use-interval/use-interval.hooks";
import { useWindowEvent } from "hooks/use-window-event/use-window-event.hooks";

import {
  OnRequestCallbackType,
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

export const useFetch = <T extends FetchCommandInstance, MapperResponse>(
  command: T,
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

  const { cache, fetchQueue } = command.builderConfig;
  const endpointKey = getCacheEndpointKey(command, cacheKey);
  const requestKey = getCacheKey(command);
  const initCacheState = useRef(getCacheState(cache.get(endpointKey, requestKey), cacheOnMount, cacheTime));
  const initState = useRef(initialData || initCacheState.current);
  const [state, actions, setRenderKey] = useDependentState<T>(endpointKey, requestKey, cache, initState.current);

  const onRequestCallback = useRef<null | OnRequestCallbackType>(null);
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

  const handleFetch = (retries = 0, isRefreshed = state.isRefreshed, isRevalidated = false) => {
    const isStale = isStaleCacheData();
    const hasData = hasStateData();

    /**
     * We can fetch when data is not stale or we don't have data at all
     * The exception is made for refreshing which should be triggered no matter if data is fresh or not
     * That's because cache time gives the details if the INITIAL call should be made, refresh works without limits
     */
    if (!disabled && (isStale || !hasData || isRefreshed || isRevalidated)) {
      const queueElement = {
        request: command,
        retries,
        timestamp: new Date(),
      };

      const options = {
        cancelable,
        deepCompareFn: deepCompareFn as typeof isEqual,
        isRefreshed,
        isRevalidated,
        isRetry: Boolean(retries),
      };

      fetchQueue.add(endpointKey, requestKey, queueElement, options);
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
        const currentRequest = fetchQueue.get(endpointKey);

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

  const handleGetRefreshedCache = () => {
    actions.setRefreshed(true, false);
    actions.setTimestamp(new Date(), false);
    handleCallbacks([state.data, state.error, state.status], state.retries);
  };

  const handleGetLoadingEvent = ({ isLoading, isRefreshed, isRetry, isRevalidated }: FetchLoadingEventType) => {
    actions.setLoading(isLoading, false);
    onRequestCallback.current?.({ isRefreshed, isRetry, isRevalidated });
  };

  const handleInitialCacheState = () => {
    if (!initCacheState && initialCacheData) {
      cache.set({ endpointKey, requestKey, response: initialCacheData, retries: 0, isRefreshed: false });
    }
    if (initCacheState.current) {
      actions.setCacheData(initCacheState.current, false);
    }
  };

  const handleRevalidate = () => {
    handleFetch(0, true, true);
  };

  const refreshFn = (invalidateKey?: string | FetchCommandInstance) => {
    if (invalidateKey && typeof invalidateKey === "string") {
      CACHE_EVENTS.revalidate(invalidateKey);
    } else if (invalidateKey && invalidateKey instanceof FetchCommand) {
      CACHE_EVENTS.revalidate(getCacheEndpointKey(invalidateKey));
    } else {
      handleRevalidate();
    }
  };

  const handleMountEvents = () => {
    FETCH_QUEUE_EVENTS.getLoading(requestKey, handleGetLoadingEvent);
    CACHE_EVENTS.get<T>(requestKey, handleGetUpdatedCache);
    CACHE_EVENTS.getRefreshed(requestKey, handleGetRefreshedCache);
    CACHE_EVENTS.onRevalidate(requestKey, handleRevalidate);
  };

  const handleUnMountEvents = () => {
    FETCH_QUEUE_EVENTS.umount(requestKey, handleGetLoadingEvent);
    CACHE_EVENTS.umount(requestKey, handleGetUpdatedCache);
    CACHE_EVENTS.umount(getRefreshedKey(requestKey), handleGetRefreshedCache);
    CACHE_EVENTS.umount(getRevalidateKey(requestKey), handleRevalidate);
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
    command.clean();
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
    onRequest: (callback: OnRequestCallbackType) => {
      onRequestCallback.current = callback;
    },
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
