import { useRef } from "react";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import {
  FetchProgressType,
  FetchLoadingEventType,
  FetchCommandInstance,
  FetchCommand,
  getCommandKey,
  CacheValueType,
  ExtractResponse,
  ExtractError,
  ExtractFetchReturn,
} from "@better-typed/hyper-fetch";

import { OnProgressCallbackType, OnStartCallbackType } from "use-fetch";
import { useDependentState } from "use-dependent-state/use-dependent-state.hooks";
import { useDebounce } from "use-debounce/use-debounce.hooks";
import { useInterval } from "use-interval/use-interval.hooks";

import {
  OnRequestCallbackType,
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseFetchOptionsType,
  UseFetchReturnType,
} from "./use-fetch.types";
import { isStaleCacheData } from "./use-fetch.utils";
import { useFetchDefaultOptions } from "./use-fetch.constants";

// TBD - suspense
export const useFetch = <T extends FetchCommandInstance, MapperResponse>(
  command: T,
  {
    dependencies = useFetchDefaultOptions.dependencies,
    disabled = useFetchDefaultOptions.disabled,
    dependencyTracking = useFetchDefaultOptions.dependencyTracking,
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
    responseDataModifierFn = useFetchDefaultOptions.responseDataModifierFn,
    shouldThrow = useFetchDefaultOptions.shouldThrow,
  }: UseFetchOptionsType<T, MapperResponse> = useFetchDefaultOptions,
): UseFetchReturnType<T, MapperResponse extends never ? ExtractResponse<T> : MapperResponse> => {
  const { cacheTime, cacheKey, queueKey, builder } = command;

  const requestDebounce = useDebounce(debounceTime);
  const refreshInterval = useInterval(refreshTime);

  const { cache, fetchQueue, appManager, commandManager, loggerManager } = builder;
  const logger = useRef(loggerManager.init("useFetch")).current;
  const [state, actions, setRenderKey, initialized] = useDependentState<T>(command, initialData);

  const onRequestCallback = useRef<null | OnRequestCallbackType>(null);
  const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>>>(null);
  const onRequestStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onResponseStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onDownloadProgressCallback = useRef<null | OnProgressCallbackType>(null);
  const onUploadProgressCallback = useRef<null | OnProgressCallbackType>(null);

  const handleFetch = () => {
    /**
     * We can fetch when data is not stale or we don't have data at all
     * The exception is made for refreshing which should be triggered no matter if data is fresh or not
     * That's because cache time gives the details if the INITIAL call should be made, refresh works without limits
     */
    if (!disabled) {
      logger.debug(`Adding request to fetch queue`);
      fetchQueue.add(command);
    } else {
      logger.debug(`Cannot add to fetch queue`, { disabled });
    }
  };

  const handleRefresh = () => {
    refreshInterval.resetInterval();

    const { timestamp } = state;

    const timeLeft = timestamp ? Math.max(+timestamp + refreshTime - +new Date(), refreshTime) : refreshTime;

    if (refresh) {
      logger.debug(`Starting refresh counter, request will be send in ${timeLeft}ms`);
      refreshInterval.interval(async () => {
        const currentRequest = await fetchQueue.get(queueKey);
        const isBlur = !command.builder.appManager.isFocused;

        // If window tab is not active should we refresh the cache
        const canRefreshBlurred = isBlur && refreshBlurred;
        const canRefresh = canRefreshBlurred || command.builder.appManager.isFocused;
        const hasQueueElements = !!currentRequest.requests.length;

        if (!hasQueueElements && canRefresh) {
          logger.info(`Performing refresh request`);
          handleFetch();
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

  const handleGetCacheData = (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    handleCallbacks(cacheData.response);
    actions.setCacheData(cacheData, false);
  };

  const handleGetEqualCacheUpdate = (isRefreshed: boolean, timestamp: number) => {
    handleCallbacks([state.data, state.error, state.status]);
    actions.setRefreshed(isRefreshed, false);
    actions.setTimestamp(new Date(timestamp), false);
  };

  const handleGetLoadingEvent = ({ isLoading, isRetry }: FetchLoadingEventType) => {
    actions.setLoading(isLoading, false);
    onRequestCallback.current?.({ isRetry });
  };

  const handleRevalidate = () => {
    handleFetch();
  };

  const refreshFn = (invalidateKey?: string | FetchCommandInstance) => {
    if (invalidateKey && typeof invalidateKey === "string") {
      command.builder.cache.events.revalidate(invalidateKey);
    } else if (invalidateKey && invalidateKey instanceof FetchCommand) {
      command.builder.cache.events.revalidate(getCommandKey(invalidateKey));
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
    const focusUnmount = appManager.events.onFocus(() => refreshOnTabFocus && handleFetch());
    const blurUnmount = appManager.events.onBlur(() => refreshOnTabBlur && handleFetch());
    const onlineUnmount = appManager.events.onOnline(() => refreshOnReconnect && handleFetch());

    const downloadUnmount = commandManager.events.onDownloadProgress(queueKey, handleDownloadProgress);
    const uploadUnmount = commandManager.events.onUploadProgress(queueKey, handleUploadProgress);
    const requestStartUnmount = commandManager.events.onRequestStart(queueKey, handleRequestStart);
    const responseStartUnmount = commandManager.events.onResponseStart(queueKey, handleResponseStart);

    const loadingUnmount = fetchQueue.events.getLoading(queueKey, handleGetLoadingEvent);

    const getUnmount = cache.events.get<T>(cacheKey, handleGetCacheData);
    const getEqualDataUnmount = cache.events.getEqualData(cacheKey, handleGetEqualCacheUpdate);
    const revalidateUnmount = cache.events.onRevalidate(cacheKey, handleRevalidate);

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
      getEqualDataUnmount();
      revalidateUnmount();
    };
  };

  const handleData = () => {
    return responseDataModifierFn && state.data ? responseDataModifierFn(state.data) : state.data;
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
    if (revalidateOnMount || isStaleCacheData(cacheTime, state.timestamp)) {
      handleFetch();
    }

    handleDependencyTracking();
    return handleMountEvents();
  });
  /**
   * Initialization of the events related to data exchange with cache and queue
   * This allow to share the state with other hooks and keep it related
   */
  useDidUpdate(
    () => {
      if (initialized) {
        handleCallbacks([state.data, state.error, state.status]);
      }
    },
    [initialized],
    true,
  );

  /**
   * Main fetching logic for mounting and updates handling
   */
  useDidUpdate(() => {
    /**
     * While debouncing we need to make sure that first request is not debounced when the cache is not available
     * This way it will not wait for debouncing but fetch data right away
     */
    if (!fetchQueue.requestCount && debounce) {
      requestDebounce.debounce(() => handleFetch());
    } else {
      handleFetch();
    }
  }, [...dependencies, disabled]);

  useDidUpdate(
    () => {
      handleRefresh();
    },
    [refresh, refreshTime, state.timestamp],
    true,
  );

  return {
    // necessary due to TS 4.5 restrictions on assignability of conditional types
    get data() {
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
