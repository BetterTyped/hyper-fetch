import { useDidUpdate } from "@better-hooks/lifecycle";
import { getRequestDispatcher, RequestInstance } from "@hyper-fetch/core";
import { useRef } from "react";

import { UseCacheOptionsType, useCacheDefaultOptions, UseCacheReturnType } from "hooks/use-cache";
import { useRequestEvents, useTrackedState } from "helpers";
import { useProvider } from "provider";
import { createTrackedProxy } from "utils";

export const useCache = <T extends RequestInstance>(
  request: T,
  options?: UseCacheOptionsType<T>,
): UseCacheReturnType<T> => {
  const { cacheKey, client } = request;

  const { cache, loggerManager } = client;
  const logger = useRef(loggerManager.initialize(client, "useCache")).current;
  const [dispatcher] = getRequestDispatcher(request);
  const updateKey = JSON.stringify(request.toJSON());

  // Build the configuration options
  const { config: globalConfig } = useProvider();
  const { dependencyTracking, initialResponse, deepCompare } = {
    ...useCacheDefaultOptions,
    ...globalConfig.useCacheConfig,
    ...options,
  };

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData, getIsDataProcessing }] = useTrackedState<T>({
    logger,
    request,
    dispatcher,
    initialResponse,
    deepCompare,
    dependencyTracking,
  });

  /**
   * Handles the data exchange with the core logic - responses, loading, downloading etc
   */
  const [, listeners] = useRequestEvents({
    logger,
    actions,
    request,
    dispatcher,
    setCacheData,
    getIsDataProcessing,
  });

  const { addCacheDataListener, addLifecycleListeners } = listeners;

  const handleMountEvents = () => {
    const unmountDataListener = addCacheDataListener(request);
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

  const invalidate = (cacheKeys?: string | RegExp | RequestInstance | Array<string | RegExp | RequestInstance>) => {
    cache.invalidate(cacheKeys ?? cacheKey);
  };

  const trackedKeys = [
    "data",
    "error",
    "loading",
    "status",
    "success",
    "extra",
    "retries",
    "responseTimestamp",
    "requestTimestamp",
  ] as const;

  return createTrackedProxy(
    {
      data: state.data,
      error: state.error,
      loading: state.loading,
      status: state.status,
      success: state.success,
      extra: state.extra,
      retries: state.retries,
      responseTimestamp: state.responseTimestamp,
      requestTimestamp: state.requestTimestamp,
      ...actions,
      invalidate,
    },
    trackedKeys,
    setRenderKey,
  ) as UseCacheReturnType<T>;
};
