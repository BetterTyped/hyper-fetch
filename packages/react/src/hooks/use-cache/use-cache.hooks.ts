import { useRef } from "react";
import { useDidUpdate } from "@better-hooks/lifecycle";
import { getRequestDispatcher, RequestInstance, Request, getRequestKey } from "@hyper-fetch/core";

import { UseCacheOptionsType, useCacheDefaultOptions, UseCacheReturnType } from "hooks/use-cache";
import { useRequestEvents, useTrackedState } from "helpers";
import { useProvider } from "provider";

export const useCache = <T extends RequestInstance>(
  request: T,
  options?: UseCacheOptionsType<T>,
): UseCacheReturnType<T> => {
  const { cacheKey, client } = request;

  const { cache, loggerManager } = client;
  const logger = useRef(loggerManager.init("useCache")).current;
  const [dispatcher] = getRequestDispatcher(request);
  const updateKey = JSON.stringify(request.toJSON());

  // Build the configuration options
  const { config: globalConfig } = useProvider();
  const { dependencyTracking, initialData, deepCompare } = {
    ...useCacheDefaultOptions,
    ...globalConfig.useCacheConfig,
    ...options,
  };

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData }] = useTrackedState<T>({
    logger,
    request,
    dispatcher,
    initialData,
    deepCompare,
    dependencyTracking,
  });

  /**
   * Handles the data exchange with the core logic - responses, loading, downloading etc
   */
  const [callbacks, listeners] = useRequestEvents({
    logger,
    actions,
    request,
    dispatcher,
    setCacheData,
  });

  const { addDataListener, addLifecycleListeners } = listeners;

  const handleMountEvents = () => {
    const unmountDataListener = addDataListener(request);
    const unmountLifecycleListener = addLifecycleListeners(request);
    return () => {
      unmountDataListener();
      unmountLifecycleListener();
    };
  };

  useDidUpdate(
    () => {
      return handleMountEvents();
    },
    [updateKey],
    true,
  );

  const refetch = (invalidateKey?: string | RequestInstance | RegExp) => {
    if (invalidateKey instanceof Request) {
      cache.invalidate(getRequestKey(invalidateKey, true));
    } else if (invalidateKey) {
      cache.invalidate(invalidateKey);
    } else {
      cache.invalidate(cacheKey);
    }
  };

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
    get success() {
      setRenderKey("success");
      return state.success;
    },
    get extra() {
      setRenderKey("extra");
      return state.extra;
    },
    get retries() {
      setRenderKey("retries");
      return state.retries;
    },
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    },
    onCacheError: callbacks.onError,
    onCacheSuccess: callbacks.onSuccess,
    onCacheChange: callbacks.onFinished,
    ...actions,
    refetch,
  };
};
