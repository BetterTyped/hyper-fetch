import { useRef, useState } from "react";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import { FetchProgressType } from "client";
import { FetchLoadingEventType } from "queues";
import { FetchCommandInstance, FetchCommand } from "command";
import { OnProgressCallbackType, OnStartCallbackType } from "hooks";
import { getCacheRequestKey, CacheValueType, getCacheKey } from "cache";
import { ExtractResponse, ExtractError, ExtractFetchReturn } from "types";

import { useDependentState } from "hooks/use-dependent-state/use-dependent-state.hooks";
import { useDebounce } from "hooks/use-debounce/use-debounce.hooks";
import { useInterval } from "hooks/use-interval/use-interval.hooks";

import {
  OnRequestCallbackType,
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseFetchOptionsType,
  UseFetchReturnType,
} from "./use-fetch.types";
import { getCacheState, getUseFetchInitialData, isStaleCacheData } from "./use-fetch.utils";
import { useFetchDefaultOptions } from "./use-fetch.constants";

// TBD - suspense
export const useFetch = <T extends FetchCommandInstance, MapperResponse>(
  command: T,
  {
    dependencies = useFetchDefaultOptions.dependencies,
    disabled = useFetchDefaultOptions.disabled,
    dependencyTracking = useFetchDefaultOptions.dependencyTracking,
    cacheOnMount = useFetchDefaultOptions.cacheOnMount,
    revalidateOnMount = useFetchDefaultOptions.revalidateOnMount,
    initialData = useFetchDefaultOptions.initialData,
    refresh = useFetchDefaultOptions.refresh,
    refreshTime = useFetchDefaultOptions.refreshTime,
    refreshBlurred = useFetchDefaultOptions.refreshBlurred,
    refreshOnTabBlur = useFetchDefaultOptions.refreshOnTabBlur,
    refreshOnTabFocus = useFetchDefaultOptions.refreshOnTabFocus,
    refreshOnReconnect = useFetchDefaultOptions.refreshOnReconnect,
    debounce = useFetchDefaultOptions.debounce,
    debounceTime = useFetchDefaultOptions.debounceTime,
    mapperFn = useFetchDefaultOptions.mapperFn,
    shouldThrow = useFetchDefaultOptions.shouldThrow,
  }: UseFetchOptionsType<T, MapperResponse> = useFetchDefaultOptions,
): UseFetchReturnType<T, MapperResponse extends never ? ExtractResponse<T> : MapperResponse> => {
  const { cacheTime, cacheKey, queueKey } = command;

  const requestDebounce = useDebounce(debounceTime);
  const refreshInterval = useInterval(refreshTime);

  const { cache, fetchQueue, manager, commandManager } = command.builder;
  const requestKey = getCacheRequestKey(command);
  const initCacheState = useRef(getCacheState(cache.get(cacheKey, requestKey), cacheOnMount, cacheTime));
  const initialStale = useRef(isStaleCacheData(cacheTime, initCacheState.current?.timestamp));
  const initState = useRef(initialStale.current ? getUseFetchInitialData<T>(initialData) : initCacheState.current);
  const [state, actions, setRenderKey] = useDependentState<T>(cacheKey, requestKey, command.builder, initState.current);
  const [hasCacheData, setHasCacheData] = useState(!initialStale.current);

  const onRequestCallback = useRef<null | OnRequestCallbackType>(null);
  const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>>>(null);
  const onRequestStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onResponseStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onDownloadProgressCallback = useRef<null | OnProgressCallbackType>(null);
  const onUploadProgressCallback = useRef<null | OnProgressCallbackType>(null);

  const handleFetch = (isRefreshed = state.isRefreshed, isRevalidated = false) => {
    const isStale = isStaleCacheData(cacheTime, state.timestamp);

    /**
     * We can fetch when data is not stale or we don't have data at all
     * The exception is made for refreshing which should be triggered no matter if data is fresh or not
     * That's because cache time gives the details if the INITIAL call should be made, refresh works without limits
     */
    if (!disabled && (isStale || !hasCacheData || isRefreshed || isRevalidated)) {
      fetchQueue.add(command, { isRefreshed, isRevalidated });
    }
  };

  const handleRefresh = () => {
    refreshInterval.resetInterval();

    const { timestamp } = state;

    const timeLeft = timestamp ? Math.max(+timestamp + refreshTime - +new Date()) : 0;

    if (refresh) {
      refreshInterval.interval(() => {
        const currentRequest = fetchQueue.get(queueKey);
        const isBlur = !command.builder.manager.isFocused;

        // If window tab is not active should we refresh the cache
        const canRefreshBlurred = isBlur && refreshBlurred;
        const canRefresh = canRefreshBlurred || command.builder.manager.isFocused;

        if (!currentRequest && canRefresh) {
          handleFetch(true);
          refreshInterval.resetInterval();
        }
      }, timeLeft);
    }
  };

  const handleCallbacks = (response: ExtractFetchReturn<T> | undefined) => {
    if (response) {
      if (response[0]) {
        onSuccessCallback?.current?.(response[0]);
      }
      if (response[1]) {
        onErrorCallback?.current?.(response[1]);
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
    handleCallbacks(cacheData.response);
  };

  const handleGetRefreshedCache = () => {
    if (!hasCacheData) {
      const data = cache.get(cacheKey, requestKey);
      if (data) {
        actions.setCacheData(data, false);
        setHasCacheData(true);
      }
    }

    actions.setRefreshed(true, false);
    actions.setTimestamp(new Date(), false);
    handleCallbacks([state.data, state.error, state.status]);
  };

  const handleGetLoadingEvent = ({ isLoading, isRefreshed, isRetry, isRevalidated }: FetchLoadingEventType) => {
    actions.setLoading(isLoading, false);
    onRequestCallback.current?.({ isRefreshed, isRetry, isRevalidated });
  };

  const handleRevalidate = () => {
    handleFetch(false, true);
  };

  const refreshFn = (invalidateKey?: string | FetchCommandInstance) => {
    if (invalidateKey && typeof invalidateKey === "string") {
      command.builder.cache.events.revalidate(invalidateKey);
    } else if (invalidateKey && invalidateKey instanceof FetchCommand) {
      command.builder.cache.events.revalidate(getCacheKey(invalidateKey));
    } else {
      handleRevalidate();
    }
  };

  const handleDownloadProgress = (progress: FetchProgressType) => {
    onDownloadProgressCallback?.current?.(progress);
  };

  const handleUploadProgress = (progress: FetchProgressType) => {
    onUploadProgressCallback?.current?.(progress);
  };

  const handleRequestStart = (middleware: T) => {
    onRequestStartCallback?.current?.(middleware);
  };

  const handleResponseStart = (middleware: T) => {
    onRequestStartCallback?.current?.(middleware);
  };

  const handleMountEvents = () => {
    const focusUnmount = manager.events.onFocus(() => refreshOnTabFocus && handleFetch(true));
    const blurUnmount = manager.events.onBlur(() => refreshOnTabBlur && handleFetch(true));
    const onlineUnmount = manager.events.onOnline(() => refreshOnReconnect && handleFetch(true));

    const downloadUnmount = commandManager.events.onDownloadProgress(queueKey, handleDownloadProgress);
    const uploadUnmount = commandManager.events.onUploadProgress(queueKey, handleUploadProgress);
    const requestStartUnmount = commandManager.events.onRequestStart(queueKey, handleRequestStart);
    const responseStartUnmount = commandManager.events.onResponseStart(queueKey, handleResponseStart);

    const loadingUnmount = fetchQueue.events.getLoading(requestKey, handleGetLoadingEvent);

    const getUnmount = cache.events.get<T>(requestKey, handleGetUpdatedCache);
    const getRefreshedUnmount = cache.events.getRefreshed(requestKey, handleGetRefreshedCache);
    const revalidateUnmount = cache.events.onRevalidate(requestKey, handleRevalidate);

    return () => {
      focusUnmount();
      blurUnmount();
      onlineUnmount();

      downloadUnmount();
      uploadUnmount();
      requestStartUnmount();
      responseStartUnmount();
      loadingUnmount();

      getUnmount();
      getRefreshedUnmount();
      revalidateUnmount();
    };
  };

  const handleData = () => {
    return mapperFn && state.data ? mapperFn(state.data) : state.data;
  };

  const handleDependencyTracking = () => {
    if (!dependencyTracking) {
      Object.keys(state).forEach((key) => setRenderKey(key as Parameters<typeof setRenderKey>[0]));
    }
  };

  /**
   * Initialization of the events related to data exchange with cache and queue
   * This allow to share the state with other hooks and keep it related
   */
  useDidMount(() => {
    handleCallbacks(initState.current?.response);
    handleDependencyTracking();
    return handleMountEvents();
  });

  /**
   * Main fetching logic for mounting and updates handling
   */
  useDidUpdate(
    () => {
      /**
       * While debouncing we need to make sure that first request is not debounced when the cache is not available
       * This way it will not wait for debouncing but fetch data right away
       */
      if (hasCacheData && debounce) {
        requestDebounce.debounce(handleFetch);
      } else {
        handleFetch(false, revalidateOnMount);
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

  return {
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
    get isOnline() {
      setRenderKey("isOnline");
      return state.isOnline;
    },
    get isFocused() {
      setRenderKey("isFocused");
      return state.isFocused;
    },
    get isStale() {
      return isStaleCacheData(cacheTime, state.timestamp);
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
    onRequestStart: (callback: OnStartCallbackType<T>) => {
      onRequestStartCallback.current = callback;
    },
    onResponseStart: (callback: OnStartCallbackType<T>) => {
      onResponseStartCallback.current = callback;
    },
    onDownloadProgress: (callback: OnProgressCallbackType) => {
      onDownloadProgressCallback.current = callback;
    },
    onUploadProgress: (callback: OnProgressCallbackType) => {
      onUploadProgressCallback.current = callback;
    },
    isRefreshingError: !!state.error && state.isRefreshed,
    isDebouncing: requestDebounce.active,
    refresh: refreshFn,
  };
};
