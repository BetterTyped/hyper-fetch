import { useDidUpdate } from "@better-hooks/lifecycle";
import type { ExtractResponseType, RequestInstance } from "@hyper-fetch/core";
import { getRequestDispatcher } from "@hyper-fetch/core";
import { useRequestEvents, useTrackedState } from "helpers";
import type { UseCacheOptionsType, UseCacheReturnType } from "hooks/use-cache";
import { useCacheDefaultOptions } from "hooks/use-cache";
import { useProvider } from "provider";
import { useRef } from "react";
import { createTrackedProxy } from "utils";
import { keyReplacer } from "utils/key.utils";

/**
 * Options passed as `undefined` (e.g. forwarded optional props) fall back to the defaults instead of overriding them
 */
const mergeOptions = <T extends object>(...sources: (object | undefined)[]): T => {
  const merged: Record<string, unknown> = {};
  sources.forEach((source) => {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        merged[key] = value;
      }
    });
  });
  return merged as T;
};

/** Subscribe to cache updates for a given request without triggering network activity. */
export const useCache = <T extends RequestInstance, TSelected = ExtractResponseType<T>>(
  request: T,
  options?: UseCacheOptionsType<T, TSelected>,
): UseCacheReturnType<T, TSelected> => {
  const { cacheKey, client } = request;

  const { cache, loggerManager } = client;
  const logger = useRef(loggerManager.initialize(client, "useCache")).current;
  const [dispatcher] = getRequestDispatcher(request);
  const updateKey = JSON.stringify(request.toJSON(), keyReplacer);

  // Build the configuration options
  const { config: globalConfig } = useProvider();
  const { dependencyTracking, initialResponse, deepCompare, structuralSharing } = mergeOptions<
    typeof useCacheDefaultOptions & UseCacheOptionsType<T, TSelected>
  >(useCacheDefaultOptions, globalConfig.useCacheConfig, options);

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData, getIsDataProcessing }] = useTrackedState<T, TSelected>({
    logger,
    request,
    dispatcher,
    initialResponse,
    deepCompare,
    dependencyTracking,
    // Cache observer shows the data of the given key only - nothing would replace the data kept from the previous key
    keepPreviousData: "clean",
    select: options?.select,
    structuralSharing,
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

  const invalidate = (cacheKeys?: string | RegExp | RequestInstance | (string | RegExp | RequestInstance)[]) => {
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
  ) as UseCacheReturnType<T, TSelected>;
};
