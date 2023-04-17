import { useRef } from "react";
import { useDidUpdate, useForceUpdate } from "@better-hooks/lifecycle";
import {
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  RequestInstance,
  ExtractAdapterType,
} from "@hyper-fetch/core";

import { isEqual } from "utils";
import {
  UseTrackedStateActions,
  UseTrackedStateType,
  UseTrackedStateProps,
  UseTrackedStateReturn,
} from "./use-tracked-state.types";
import { getDetailsState, getInitialState, isStaleCacheData } from "./use-tracked-state.utils";

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

  // ******************
  // Utils
  // ******************

  const getStaleStatus = (): boolean => {
    const cacheData = cache.get(cacheKey);

    return isStaleCacheData(cacheTime, cacheData?.timestamp || state.current.timestamp);
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
      const newState = getInitialState(initialData, dispatcher, request);

      const hasInitialState = isEqual(initialData?.data, state.current.data);
      const hasState = !!(state.current.data || state.current.error) && !hasInitialState;
      const shouldLoadInitialCache = !hasState && !!state.current.data;
      const shouldRemovePreviousData = hasState && !state.current.data;

      if (shouldLoadInitialCache || shouldRemovePreviousData) {
        // Don't update the state when we are fetching data for new cacheKey
        // So on paginated page we will have previous page access until the new one will be fetched
        state.current = newState;
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

  const mapResponseData = (
    data: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
  ): CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>> => {
    if (responseMapper) {
      return { ...data, ...responseMapper(data) };
    }
    return data;
  };

  const setCacheData = async (
    cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
  ) => {
    const localData = mapResponseData(cacheData);
    const newStateValues: UseTrackedStateType<T> = {
      data: localData.data,
      error: localData.error,
      status: localData.status,
      isSuccess: localData.isSuccess,
      additionalData: localData.additionalData,
      retries: localData.retries,
      timestamp: new Date(localData.timestamp),
      loading: state.current.loading,
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

  // ******************
  // Actions
  // ******************

  const actions: UseTrackedStateActions<T> = {
    setData: (data, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), isSuccess: true, data });
      } else {
        state.current.data = data;
        renderKeyTrigger(["data"]);
      }
    },
    setError: (error, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), isSuccess: false, error });
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
    setIsSuccess: (isSuccess, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), isSuccess });
      } else {
        state.current.isSuccess = isSuccess;
        renderKeyTrigger(["isSuccess"]);
      }
    },
    setAdditionalData: (additionalData, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), additionalData });
      } else {
        state.current.additionalData = additionalData;
        renderKeyTrigger(["additionalData"]);
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

  return [state.current, actions, { setRenderKey, setCacheData, getStaleStatus }];
};
