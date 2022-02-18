import { useRef } from "react";
import { useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import {
  QueueLoadingEventType,
  FetchCommandInstance,
  FetchCommand,
  getCommandKey,
  CacheValueType,
  ExtractResponse,
  ExtractError,
  ExtractFetchReturn,
} from "@better-typed/hyper-fetch";

import { useDependentState } from "use-dependent-state";
import { isStaleCacheData } from "utils";
import {
  OnCacheErrorCallbackType,
  OnCacheFinishedCallbackType,
  OnCacheSuccessCallbackType,
  UseCacheOptionsType,
  UseCacheReturnType,
  OnCacheChangeCallbackType,
  useCacheDefaultOptions,
} from "use-cache";

export const useCache = <T extends FetchCommandInstance>(
  command: T,
  {
    dependencyTracking = useCacheDefaultOptions.dependencyTracking,
    initialData = useCacheDefaultOptions.initialData,
  }: UseCacheOptionsType<T> = useCacheDefaultOptions,
): UseCacheReturnType<T> => {
  const { cacheTime, cacheKey, queueKey, builder } = command;
  const commandDump = command.dump();

  const { cache, fetchQueue, loggerManager } = builder;
  const logger = useRef(loggerManager.init("useCache")).current;
  const [state, actions, setRenderKey, initialized] = useDependentState<T>(command, initialData, fetchQueue, [
    JSON.stringify(commandDump),
  ]);

  const onSuccessCallback = useRef<null | OnCacheSuccessCallbackType<ExtractResponse<T>>>(null);
  const onErrorCallback = useRef<null | OnCacheErrorCallbackType<ExtractError<T>>>(null);
  const onFinishedCallback = useRef<null | OnCacheFinishedCallbackType<ExtractFetchReturn<T>>>(null);
  const onChangeCallback = useRef<null | OnCacheChangeCallbackType<ExtractFetchReturn<T>>>(null);

  const handleCallbacks = (response: ExtractFetchReturn<T> | undefined) => {
    if (response) {
      const status = response[2] || 0;
      const hasSuccessState = !!(response[0] && !response[1]);
      const hasSuccessStatus = !!(!response[1] && status >= 200 && status <= 400);
      if (hasSuccessState || hasSuccessStatus) {
        onSuccessCallback?.current?.(response[0] as ExtractResponse<T>);
      } else {
        onErrorCallback?.current?.(response[1] as ExtractError<T>);
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
  };

  const revalidate = (invalidateKey?: string | FetchCommandInstance | RegExp) => {
    if (invalidateKey && invalidateKey instanceof FetchCommand) {
      cache.events.revalidate(`/${getCommandKey(invalidateKey, true)}/`);
    } else if (invalidateKey) {
      cache.events.revalidate(invalidateKey);
    } else {
      cache.events.revalidate(cacheKey);
    }
  };

  const handleGetLoadingEvent = ({ isLoading }: QueueLoadingEventType) => {
    actions.setLoading(isLoading, false);
  };

  const handleMountEvents = () => {
    const loadingUnmount = fetchQueue.events.onLoading(queueKey, handleGetLoadingEvent);
    const getUnmount = cache.events.get<T>(cacheKey, handleGetCacheData);
    const getEqualDataUnmount = cache.events.getEqualData<T>(cacheKey, handleGetEqualCacheUpdate);

    return () => {
      loadingUnmount();
      getUnmount();
      getEqualDataUnmount();
    };
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

  return {
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
    get isRefreshingError() {
      setRenderKey("error");
      setRenderKey("isRefreshed");
      return !!state.error && state.isRefreshed;
    },
    get isStale() {
      setRenderKey("timestamp");
      return isStaleCacheData(cacheTime, state.timestamp);
    },
    onSuccess: (callback: OnCacheSuccessCallbackType<ExtractResponse<T>>) => {
      onSuccessCallback.current = callback;
    },
    onError: (callback: OnCacheErrorCallbackType<ExtractError<T>>) => {
      onErrorCallback.current = callback;
    },
    onFinished: (callback: OnCacheFinishedCallbackType<ExtractFetchReturn<T>>) => {
      onFinishedCallback.current = callback;
    },
    onChange: (callback: OnCacheChangeCallbackType<ExtractFetchReturn<T>>) => {
      onChangeCallback.current = callback;
    },
    ...actions,
    revalidate,
  };
};
