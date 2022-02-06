import { useRef } from "react";
import { useDidUpdate } from "@better-typed/react-lifecycle-hooks";

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
import { isStaleCacheData } from "utils";

import {
  OnRequestCallbackType,
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseFetchOptionsType,
  UseFetchReturnType,
} from "./use-fetch.types";
import { useFetchDefaultOptions } from "./use-fetch.constants";

// TBD - suspense
export const useFetch = <T extends FetchCommandInstance>(
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
    // suspense = useFetchDefaultOptions.suspense
    shouldThrow = useFetchDefaultOptions.shouldThrow,
  }: UseFetchOptionsType<T> = useFetchDefaultOptions,
): UseFetchReturnType<T> => {
  const { cacheTime, cacheKey, queueKey, builder } = command;
  const commandDump = command.dump();

  const requestDebounce = useDebounce(debounceTime);
  const refreshInterval = useInterval(refreshTime);

  const { cache, fetchQueue, appManager, commandManager, loggerManager } = builder;
  const logger = useRef(loggerManager.init("useFetch")).current;
  const [state, actions, setRenderKey, initialized] = useDependentState<T>(command, initialData, fetchQueue);

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

    let timeLeft = refreshTime;
    if (timestamp) {
      const diff = +new Date() - +timestamp;
      if (diff >= 0 && diff < refreshTime) {
        timeLeft = refreshTime - diff;
      } else {
        timeLeft = 0;
      }
    }

    if (refresh) {
      logger.debug(`Starting refresh counter, request will be send in ${timeLeft}ms`);
      refreshInterval.interval(async () => {
        const queueStorage = await fetchQueue.get(queueKey);
        const isBlur = !appManager.isFocused;

        // If window tab is not active should we refresh the cache
        const canRefreshBlurred = isBlur && refreshBlurred;
        const canRefresh = canRefreshBlurred || appManager.isFocused;
        const hasQueueElements = !!queueStorage.requests.length;

        if (!hasQueueElements && canRefresh) {
          logger.debug(`Performing refresh request`, {
            hasQueueElements,
            canRefresh,
            isFocused: appManager.isFocused,
            timestamp: state.timestamp,
          });

          handleFetch();
          refreshInterval.resetInterval();
        } else {
          logger.debug(`Cannot trigger refresh request`, {
            hasQueueElements,
            canRefresh,
            isFocused: appManager.isFocused,
            timestamp: state.timestamp,
          });
        }
      }, timeLeft);
    }
  };

  const handleCallbacks = (response: ExtractFetchReturn<T> | undefined) => {
    if (response) {
      const status = response[2] || 0;
      const hasSuccessState = !!(response[0] && !response[1]);
      const hasSuccessStatus = !!(!response[1] && status >= 200 && status <= 400);
      if (hasSuccessState || hasSuccessStatus) {
        onSuccessCallback?.current?.(response[0] as ExtractResponse<T>);
      } else {
        onErrorCallback?.current?.(response[1] as ExtractError<T>);
        if (shouldThrow) {
          throw {
            message: "Fetching Error.",
            error: response[1],
          };
        }
      }
      onFinishedCallback?.current?.(response);
    } else {
      logger.debug("No response to perform callbacks");
    }
  };

  const handleGetCacheData = async (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    logger.debug("Received new data");
    handleCallbacks(cacheData.response); // Must be first
    await actions.setCacheData(cacheData, false);
    await actions.setLoading(false, false);
    handleRefresh();
  };

  const handleGetEqualCacheUpdate = async (
    cacheData: CacheValueType<ExtractResponse<T>>,
    isRefreshed: boolean,
    timestamp: number,
  ) => {
    logger.debug("Received equal data event");
    handleCallbacks(cacheData.response); // Must be first
    await actions.setRefreshed(isRefreshed, false);
    await actions.setTimestamp(new Date(timestamp), false);
    await actions.setLoading(false, false);
    handleRefresh();
  };

  const handleGetLoadingEvent = ({ isLoading, isRetry }: FetchLoadingEventType) => {
    actions.setLoading(isLoading, false);
    onRequestCallback.current?.({ isRetry });
  };

  const handleRevalidate = () => {
    handleFetch();
  };

  const refreshFn = (invalidateKey?: string | FetchCommandInstance | RegExp) => {
    if (invalidateKey && invalidateKey instanceof FetchCommand) {
      cache.events.revalidate(`/${getCommandKey(invalidateKey, true)}/`);
    } else if (invalidateKey) {
      cache.events.revalidate(invalidateKey);
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
    const focusUnmount = appManager.events.onFocus(() => {
      if (refreshOnTabFocus) handleFetch();
      handleRefresh();
    });
    const blurUnmount = appManager.events.onBlur(() => {
      if (refreshOnTabBlur) handleFetch();
      handleRefresh();
    });
    const onlineUnmount = appManager.events.onOnline(() => {
      if (refreshOnReconnect) handleFetch();
      handleRefresh();
    });
    const offlineUnmount = builder.appManager.events.onOffline(() => {
      handleRefresh();
    });

    const downloadUnmount = commandManager.events.onDownloadProgress(queueKey, handleDownloadProgress);
    const uploadUnmount = commandManager.events.onUploadProgress(queueKey, handleUploadProgress);
    const requestStartUnmount = commandManager.events.onRequestStart(queueKey, handleRequestStart);
    const responseStartUnmount = commandManager.events.onResponseStart(queueKey, handleResponseStart);

    const loadingUnmount = fetchQueue.events.getLoading(queueKey, handleGetLoadingEvent);
    const getUnmount = cache.events.get<T>(cacheKey, handleGetCacheData);
    const getEqualDataUnmount = cache.events.getEqualData<T>(cacheKey, handleGetEqualCacheUpdate);
    const revalidateUnmount = cache.events.onRevalidate(cacheKey, handleRevalidate);

    return () => {
      focusUnmount();
      blurUnmount();
      onlineUnmount();
      offlineUnmount();

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

  const handleDependencyTracking = () => {
    if (!dependencyTracking) {
      Object.keys(state).forEach((key) => setRenderKey(key as Parameters<typeof setRenderKey>[0]));
    }
  };

  /**
   * Initial fetch triggered once data is stale or we use the revalidate strategy
   */
  useDidUpdate(() => {
    const hasStaleData = initialized && isStaleCacheData(cacheTime, state.timestamp);
    if (revalidateOnMount || hasStaleData) {
      handleFetch();
    }
  }, [initialized]);

  /**
   * Initialization of the events related to data exchange with cache and queue
   * This allow to share the state with other hooks and keep it related
   */
  useDidUpdate(
    () => {
      handleDependencyTracking();
      return handleMountEvents();
    },
    [JSON.stringify(commandDump)],
    true,
  );

  /**
   * On the init if we have data we should call the callback functions
   */
  useDidUpdate(
    () => {
      if (initialized) {
        handleCallbacks([state.data, state.error, state.status]);
      }
    },
    [JSON.stringify(commandDump), initialized],
    true,
  );

  /**
   * Fetching logic for updates handling
   */
  useDidUpdate(() => {
    /**
     * While debouncing we need to make sure that first request is not debounced when the cache is not available
     * This way it will not wait for debouncing but fetch data right away
     */
    if (!fetchQueue.getRequestCount(queueKey) && debounce) {
      logger.debug("Debouncing request", { queueKey, command });
      requestDebounce.debounce(() => handleFetch());
    } else {
      handleFetch();
    }
  }, [JSON.stringify(commandDump), ...dependencies, disabled]);

  useDidUpdate(
    () => {
      handleRefresh();
    },
    [JSON.stringify(commandDump), ...dependencies, disabled, refresh, refreshTime],
    true,
  );

  return {
    // necessary due to TS 4.5 restrictions on assignability of conditional types
    get data() {
      setRenderKey("data");
      return state.data;
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
