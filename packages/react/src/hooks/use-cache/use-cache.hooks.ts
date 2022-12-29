import { useRef } from "react";
import { getRequestDispatcher, RequestInstance, Request, getRequestKey } from "@hyper-fetch/core";

import { UseCacheOptionsType, useCacheDefaultOptions, UseCacheReturnType } from "hooks/use-cache";
import { useRequestEvents, useTrackedState } from "helpers";
import { useConfigProvider } from "config-provider";

export const useCache = <T extends RequestInstance>(
  request: T,
  options: UseCacheOptionsType<T> = useCacheDefaultOptions,
): UseCacheReturnType<T> => {
  const { cacheKey, client } = request;

  const { cache, loggerManager } = client;
  const logger = useRef(loggerManager.init("useCache")).current;
  const [dispatcher] = getRequestDispatcher(request);

  // Build the configuration options
  const [globalConfig] = useConfigProvider();
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
  const [callbacks] = useRequestEvents({
    logger,
    actions,
    request,
    dispatcher,
    setCacheData,
  });

  const revalidate = (invalidateKey?: string | RequestInstance | RegExp) => {
    if (invalidateKey instanceof Request) {
      cache.revalidate(getRequestKey(invalidateKey, true));
    } else if (invalidateKey) {
      cache.revalidate(invalidateKey);
    } else {
      cache.revalidate(cacheKey);
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
    revalidate,
  };
};
