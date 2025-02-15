/* eslint-disable @typescript-eslint/naming-convention */
import { useRef } from "react";
import { useDidUpdate, useForceUpdate } from "@better-hooks/lifecycle";
import {
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  RequestInstance,
  ExtractAdapterType,
  ExtractAdapterExtraType,
} from "@hyper-fetch/core";

import { isEqual } from "utils";
import {
  UseTrackedStateActions,
  UseTrackedStateType,
  UseTrackedStateProps,
  UseTrackedStateReturn,
} from "./use-tracked-state.types";
import { getInitialState, getIsInitiallyLoading, getValidCacheData, isStaleCacheData } from "./use-tracked-state.utils";

/**
 *
 * @param request
 * @param initialResponse
 * @param dispatcher
 * @param dependencies
 * @internal
 */
export const useTrackedState = <T extends RequestInstance>({
  request,
  dispatcher,
  initialResponse,
  deepCompare,
  dependencyTracking,
  disabled,
  revalidate,
}: UseTrackedStateProps<T>): UseTrackedStateReturn<T> => {
  const { client, cacheKey, queryKey, staleTime, unsafe_responseMapper } = request;
  const { cache, requestManager } = client;

  const forceUpdate = useForceUpdate();

  const state = useRef<UseTrackedStateType<T>>(getInitialState({ initialResponse, dispatcher, request, disabled }));
  const renderKeys = useRef<Array<keyof UseTrackedStateType<T>>>([]);
  const isProcessingData = useRef("");

  // ******************
  // Utils
  // ******************

  const getStaleStatus = (): boolean => {
    const cacheData = cache.get(cacheKey);
    return !cacheData || isStaleCacheData(staleTime, cacheData?.responseTimestamp);
  };

  // ******************
  // Dependency Tracking
  // ******************

  const renderKeyTrigger = (keys: Array<keyof UseTrackedStateType>) => {
    const shouldRerender = renderKeys.current.some((renderKey) => keys.includes(renderKey));
    if (shouldRerender) forceUpdate();
  };

  const setRenderKey = (renderKey: keyof UseTrackedStateType) => {
    if (!renderKeys.current.includes(renderKey)) {
      renderKeys.current.push(renderKey);
    }
  };

  // ******************
  // Cache initialization
  // ******************

  useDidUpdate(
    () => {
      // Get cache state
      const cacheData = cache.get<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>(cacheKey);
      const cacheState = getValidCacheData<T>(request, initialResponse, cacheData);

      // Handle initial loading state
      state.current.loading = getIsInitiallyLoading({
        queryKey: request.queryKey,
        dispatcher,
        disabled,
        revalidate,
        hasState: !!cacheState,
      });

      if (cacheState) {
        // Don't update the state when we are fetching data for new cacheKey
        // So on paginated page we will have previous page access until the new one will be fetched
        // However: When we have some cached data, we can use it right away
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        setCacheData(cacheState);
      }
    },
    [cacheKey, queryKey],
    true,
  );

  // ******************
  // Turn off dependency tracking
  // ******************

  useDidUpdate(
    () => {
      const handleDependencyTracking = () => {
        if (!dependencyTracking) {
          Object.keys(state.current).forEach((key) => setRenderKey(key as Parameters<typeof setRenderKey>[0]));
        }
      };

      handleDependencyTracking();
    },
    [dependencyTracking],
    true,
  );

  // ******************
  // Cache data handler
  // ******************

  const handleCompare = (firstValue: unknown, secondValue: unknown) => {
    if (typeof deepCompare === "function") {
      return deepCompare(firstValue, secondValue);
    }
    if (deepCompare) {
      return isEqual(firstValue, secondValue);
    }
    return false;
  };

  const handleCacheData = (
    cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
  ) => {
    const newStateValues: UseTrackedStateType<T> = {
      data: cacheData.data,
      error: cacheData.error,
      status: cacheData.status,
      success: cacheData.success,
      extra: cacheData.extra as ExtractAdapterExtraType<ExtractAdapterType<T>>,
      retries: cacheData.retries,
      responseTimestamp: new Date(cacheData.responseTimestamp),
      requestTimestamp: new Date(cacheData.requestTimestamp),
      loading: dispatcher.hasRunningRequests(queryKey),
    };

    const changedKeys = Object.keys(newStateValues).filter((key) => {
      const keyValue = key as keyof UseTrackedStateType<T>;
      const firstValue = state.current[keyValue];
      const secondValue = newStateValues[keyValue];

      return !handleCompare(firstValue, secondValue);
    }) as unknown as (keyof UseTrackedStateType<T>)[];

    state.current = {
      ...state.current,
      ...newStateValues,
    };

    renderKeyTrigger(changedKeys);
  };

  const setIsDataProcessing = ({
    processingCacheKey,
    isProcessing,
  }: {
    processingCacheKey: string;
    isProcessing: boolean;
  }) => {
    if (isProcessing) {
      isProcessingData.current = processingCacheKey;
    }
    // Do not turn off other keys processing
    else if (isProcessingData.current === cacheKey) {
      isProcessingData.current = "";
    }
  };

  const getIsDataProcessing = (processingCacheKey: string) => {
    return isProcessingData.current === processingCacheKey;
  };

  const setCacheData = (
    cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
  ): Promise<void> | void => {
    setIsDataProcessing({ processingCacheKey: cacheKey, isProcessing: true });
    const data = unsafe_responseMapper ? unsafe_responseMapper(cacheData) : cacheData;

    if (data instanceof Promise) {
      return (async () => {
        const promiseData = await data;
        handleCacheData({ ...cacheData, ...promiseData });
        setIsDataProcessing({ processingCacheKey: cacheKey, isProcessing: false });
      })();
    }
    setIsDataProcessing({ processingCacheKey: cacheKey, isProcessing: false });
    return handleCacheData({ ...cacheData, ...data });
  };

  // ******************
  // Actions
  // ******************

  const actions: UseTrackedStateActions<T> = {
    setData: (data, emitToHooks = true) => {
      if (emitToHooks) {
        cache.update(request, (prev) => ({ data: data instanceof Function ? data(prev?.data || null) : data }));
      }
      state.current.data = data instanceof Function ? data(state.current.data || null) : data;
      renderKeyTrigger(["data"]);
    },
    setError: (error, emitToCache = true) => {
      if (emitToCache) {
        cache.update(request, (prev) => {
          const value = error instanceof Function ? error(prev?.error || null) : error;
          return {
            error: value,
            success: !value,
          };
        });
      }
      state.current.error = error instanceof Function ? error(state.current.error || null) : error;
      renderKeyTrigger(["error"]);
    },
    setLoading: (loading, emitToHooks = true) => {
      const value = loading instanceof Function ? loading(state.current.loading) : loading;
      if (emitToHooks) {
        requestManager.events.emitLoading({
          request,
          requestId: "",
          loading: value,
          isRetry: false,
          isOffline: false,
        });
      }
      state.current.loading = value;
      renderKeyTrigger(["loading"]);
    },
    setStatus: (status, emitToCache = true) => {
      if (emitToCache) {
        cache.update(request, (prev) => ({
          status: status instanceof Function ? status((prev?.status as any) || null) : status,
        }));
      }
      state.current.status = status instanceof Function ? status(state.current.status || null) : status;
      renderKeyTrigger(["status"]);
    },
    setSuccess: (success, emitToCache = true) => {
      if (emitToCache) {
        cache.update(request, (prev) => ({
          success: success instanceof Function ? success(prev?.success || false) : success,
        }));
      }
      state.current.success = success instanceof Function ? success(state.current.success || false) : success;
      renderKeyTrigger(["success"]);
    },
    setExtra: (extra, emitToCache = true) => {
      if (emitToCache) {
        cache.update(request, (prev) => ({
          extra: extra instanceof Function ? extra(prev?.extra || null) : extra,
        }));
      }
      state.current.extra = extra instanceof Function ? extra(state.current.extra) : extra;
      renderKeyTrigger(["extra"]);
    },
    setRetries: (retries, emitToCache = true) => {
      if (emitToCache) {
        cache.update(request, (prev) => ({
          retries: retries instanceof Function ? retries(prev?.retries || 0) : retries,
        }));
      }
      state.current.retries = retries instanceof Function ? retries(state.current.retries || 0) : retries;
      renderKeyTrigger(["retries"]);
    },
    setResponseTimestamp: (timestamp, emitToCache = true) => {
      const getTimestamp = (prev: Date | null) => {
        return timestamp instanceof Function ? timestamp(prev ? new Date(prev) : null) : timestamp;
      };

      if (emitToCache) {
        cache.update(request, (prev) => {
          const responseTimestamp = +getTimestamp(prev?.responseTimestamp ? new Date(prev.responseTimestamp) : null);

          return {
            responseTimestamp,
          };
        });
      }

      state.current.responseTimestamp = getTimestamp(state.current.responseTimestamp);
      renderKeyTrigger(["responseTimestamp"]);
    },
    setRequestTimestamp: (timestamp, emitToCache = true) => {
      const getTimestamp = (prev: Date | null) => {
        return timestamp instanceof Function ? timestamp(prev ? new Date(prev) : null) : timestamp;
      };

      if (emitToCache) {
        cache.update(request, (prev) => ({
          requestTimestamp: +getTimestamp(prev?.requestTimestamp ? new Date(prev.requestTimestamp) : null),
        }));
      }
      state.current.requestTimestamp = getTimestamp(state.current.requestTimestamp);
      renderKeyTrigger(["requestTimestamp"]);
    },
  };

  return [state.current, actions, { setRenderKey, setCacheData, getStaleStatus, getIsDataProcessing }];
};
