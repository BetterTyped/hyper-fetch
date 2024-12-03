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
import { getDetailsState, getInitialState, getValidCacheData, isStaleCacheData } from "./use-tracked-state.utils";

/**
 *
 * @param request
 * @param initialData
 * @param dispatcher
 * @param dependencies
 * @internal
 */
export const useTrackedState = <T extends RequestInstance>({
  request,
  dispatcher,
  initialData,
  deepCompare,
  dependencyTracking,
  defaultCacheEmitting = true,
}: UseTrackedStateProps<T>): UseTrackedStateReturn<T> => {
  const { client, cacheKey, queueKey, cacheTime, responseMapper } = request;
  const { cache, requestManager } = client;

  const forceUpdate = useForceUpdate();

  const state = useRef<UseTrackedStateType<T>>(getInitialState(initialData, dispatcher, request));
  const renderKeys = useRef<Array<keyof UseTrackedStateType<T>>>([]);
  const isProcessingData = useRef("");

  // ******************
  // Utils
  // ******************

  const getStaleStatus = (): boolean => {
    const cacheData = cache.get(cacheKey);
    return !cacheData || isStaleCacheData(cacheTime, cacheData?.timestamp);
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
      // Handle initial loading state
      state.current.loading = dispatcher.hasRunningRequests(queueKey);

      // Get cache state
      const cacheData = cache.get<
        ExtractResponseType<T>,
        ExtractErrorType<T>,
        ExtractAdapterExtraType<ExtractAdapterType<T>>
      >(cacheKey);
      const cacheState = getValidCacheData<T>(request, initialData, cacheData);

      const hasInitialState = isEqual(initialData?.data, state.current.data);
      const hasState = !!(state.current.data || state.current.error) && !hasInitialState;
      const shouldLoadInitialCache = !hasState && !!state.current.data;
      const shouldRemovePreviousData = hasState && !state.current.data;

      if (cacheState || shouldLoadInitialCache || shouldRemovePreviousData) {
        // Don't update the state when we are fetching data for new cacheKey
        // So on paginated page we will have previous page access until the new one will be fetched
        // However: When we have some cached data, we can use it right away
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        setCacheData(cacheState);
      }
    },
    [cacheKey, queueKey],
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
      extra: cacheData.extra,
      retries: cacheData.retries,
      timestamp: new Date(cacheData.timestamp),
      loading: dispatcher.hasRunningRequests(queueKey),
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

  const getIsDataProcessing = () => {
    return isProcessingData.current === cacheKey;
  };

  const setCacheData = (
    cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
  ): Promise<void> | void => {
    setIsDataProcessing({ processingCacheKey: cacheKey, isProcessing: true });
    const data = responseMapper ? responseMapper(cacheData) : cacheData;

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
    setData: (data, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), success: true, data });
      } else {
        state.current.data = data;
        renderKeyTrigger(["data"]);
      }
    },
    setError: (error, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), success: false, error });
      } else {
        state.current.error = error;
        renderKeyTrigger(["error"]);
      }
    },
    setLoading: (loading, emitToHooks = true) => {
      if (emitToHooks) {
        requestManager.events.emitLoading(queueKey, "", {
          queueKey,
          requestId: "",
          loading,
          isRetry: false,
          isOffline: false,
        });
      } else {
        state.current.loading = loading;
        renderKeyTrigger(["loading"]);
      }
    },
    setStatus: (status, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), status });
      } else {
        state.current.status = status;
        renderKeyTrigger(["status"]);
      }
    },
    setSuccess: (success, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), success });
      } else {
        state.current.success = success;
        renderKeyTrigger(["success"]);
      }
    },
    setExtra: (extra, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), extra });
      } else {
        state.current.extra = extra;
        renderKeyTrigger(["extra"]);
      }
    },
    setRetries: (retries, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current, { retries }) });
      } else {
        state.current.retries = retries;
        renderKeyTrigger(["retries"]);
      }
    },
    setTimestamp: (timestamp, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current, { timestamp: +timestamp }) });
      } else {
        state.current.timestamp = timestamp;
        renderKeyTrigger(["timestamp"]);
      }
    },
  };

  return [state.current, actions, { setRenderKey, setCacheData, getStaleStatus, getIsDataProcessing }];
};
