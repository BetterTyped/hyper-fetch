/* eslint-disable @typescript-eslint/naming-convention */
import { useDidUpdate, useForceUpdate } from "@better-hooks/lifecycle";
import {
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  RequestInstance,
  ExtractAdapterType,
  ExtractAdapterExtraType,
} from "@hyper-fetch/core";
import { useRef } from "react";

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
  const { client, cacheKey, queryKey, staleTime, unstable_responseMapper } = request;
  const { cache } = client;

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
      const cacheData = cache.get<ExtractResponseType<T>, ExtractErrorType<T>>(cacheKey);
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
    const data = unstable_responseMapper ? unstable_responseMapper(cacheData) : cacheData;

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
    setData: (data) => {
      state.current.data = data instanceof Function ? data(state.current.data || null) : data;
      renderKeyTrigger(["data"]);
    },
    setError: (error) => {
      state.current.error = error instanceof Function ? error(state.current.error || null) : error;
      renderKeyTrigger(["error"]);
    },
    setLoading: (loading) => {
      const value = loading instanceof Function ? loading(state.current.loading) : loading;
      if (value === state.current.loading) return;
      state.current.loading = value;
      renderKeyTrigger(["loading"]);
    },
    setStatus: (status) => {
      const value = status instanceof Function ? status(state.current.status) : status;
      if (value === state.current.status) return;
      state.current.status = status instanceof Function ? status(state.current.status || null) : status;
      renderKeyTrigger(["status"]);
    },
    setSuccess: (success) => {
      const value = success instanceof Function ? success(state.current.success || false) : success;
      if (value === state.current.success) return;
      state.current.success = success instanceof Function ? success(state.current.success || false) : success;
      renderKeyTrigger(["success"]);
    },
    setExtra: (extra) => {
      const value = extra instanceof Function ? extra(state.current.extra) : extra;
      if (value === state.current.extra) return;
      state.current.extra = extra instanceof Function ? extra(state.current.extra) : extra;
      renderKeyTrigger(["extra"]);
    },
    setRetries: (retries) => {
      const value = retries instanceof Function ? retries(state.current.retries || 0) : retries;
      if (value === state.current.retries) return;
      state.current.retries = retries instanceof Function ? retries(state.current.retries || 0) : retries;
      renderKeyTrigger(["retries"]);
    },
    setResponseTimestamp: (timestamp) => {
      const value = timestamp instanceof Function ? timestamp(state.current.responseTimestamp) : timestamp;
      if (value === state.current.responseTimestamp) return;
      const getTimestamp = (prev: Date | null) => {
        return timestamp instanceof Function ? timestamp(prev ? new Date(prev) : null) : timestamp;
      };

      state.current.responseTimestamp = getTimestamp(state.current.responseTimestamp);
      renderKeyTrigger(["responseTimestamp"]);
    },
    setRequestTimestamp: (timestamp) => {
      const value = timestamp instanceof Function ? timestamp(state.current.requestTimestamp) : timestamp;
      if (value === state.current.requestTimestamp) return;
      const getTimestamp = (prev: Date | null) => {
        return timestamp instanceof Function ? timestamp(prev ? new Date(prev) : null) : timestamp;
      };

      state.current.requestTimestamp = getTimestamp(state.current.requestTimestamp);
      renderKeyTrigger(["requestTimestamp"]);
    },
  };

  return [state.current, actions, { setRenderKey, setCacheData, getStaleStatus, getIsDataProcessing }];
};
