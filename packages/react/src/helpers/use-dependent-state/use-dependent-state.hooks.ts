import { useRef } from "react";
import { useDidUpdate, useForceUpdate } from "@better-typed/react-lifecycle-hooks";
import { ExtractError, CacheValueType, ExtractResponse, CommandInstance } from "@better-typed/hyper-fetch";

import { isEqual } from "utils";
import {
  UseDependentStateActions,
  UseDependentStateType,
  UseDependentStateProps,
  UseDependentStateReturn,
} from "./use-dependent-state.types";
import { getDetailsState, getInitialState, isStaleCacheData } from "./use-dependent-state.utils";

/**
 *
 * @param command
 * @param initialData
 * @param dispatcher
 * @param dependencies
 * @internal
 */
export const useDependentState = <T extends CommandInstance>({
  command,
  dispatcher,
  initialData,
  deepCompare,
  dependencyTracking,
  defaultCacheEmitting = true,
}: UseDependentStateProps<T>): UseDependentStateReturn<T> => {
  const { builder, cacheKey, queueKey, cacheTime } = command;
  const { cache, commandManager } = builder;

  const forceUpdate = useForceUpdate();

  const state = useRef<UseDependentStateType<T>>(getInitialState(initialData, dispatcher, command));
  const renderKeys = useRef<Array<keyof UseDependentStateType<T>>>([]);

  // ******************
  // Utils
  // ******************

  const getStaleStatus = (): boolean => {
    const cacheData = cache.get(cacheKey);

    return isStaleCacheData(cacheTime, cacheData?.details.timestamp);
  };

  // ******************
  // Dependency Tracking
  // ******************

  const renderKeyTrigger = (keys: Array<keyof UseDependentStateType>) => {
    const shouldRerender = renderKeys.current.some((renderKey) => keys.includes(renderKey));
    if (shouldRerender) forceUpdate();
  };

  const setRenderKey = (renderKey: keyof UseDependentStateType) => {
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
      const newState = getInitialState(initialData, dispatcher, command);

      const hasInitialState = initialData?.[0] === state.current.data;
      const hasState = !!(state.current.data || state.current.error) && !hasInitialState;
      const shouldLoadInitialCache = !hasState && state.current.data;
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

  const setCacheData = async (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    const newStateValues: UseDependentStateType<T> = {
      data: cacheData.data[0],
      error: cacheData.data[1],
      status: cacheData.data[2],
      retries: cacheData.details.retries,
      timestamp: new Date(cacheData.details.timestamp),
      loading: state.current.loading,
    };

    const changedKeys = Object.keys(newStateValues).filter((key) => {
      const keyValue = key as keyof UseDependentStateType<T>;
      const firstValue = state.current[keyValue];
      const secondValue = newStateValues[keyValue];

      return !handleCompare(firstValue, secondValue);
    }) as unknown as (keyof UseDependentStateType<T>)[];

    state.current = {
      ...state.current,
      ...newStateValues,
    };

    renderKeyTrigger(changedKeys);
  };

  // ******************
  // Actions
  // ******************

  const actions: UseDependentStateActions<T> = {
    setData: (data, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(command, [data, currentState.error, currentState.status], getDetailsState(state.current));
      } else {
        state.current.data = data;
        renderKeyTrigger(["data"]);
      }
    },
    setError: (error, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(
          command,
          [currentState.data, error, currentState.status],
          getDetailsState(state.current, { isFailed: !!error }),
        );
      } else {
        state.current.error = error;
        renderKeyTrigger(["error"]);
      }
    },
    setLoading: (loading, emitToHooks = true) => {
      if (emitToHooks) {
        commandManager.events.emitLoading(queueKey, "", {
          queueKey,
          requestId: "",
          isLoading: loading,
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
        cache.set(command, [currentState.data, currentState.error, status], getDetailsState(state.current));
      } else {
        state.current.status = status;
        renderKeyTrigger(["status"]);
      }
    },
    setRetries: (retries, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(
          command,
          [currentState.data, currentState.error, currentState.status],
          getDetailsState(state.current, { retries }),
        );
      } else {
        state.current.retries = retries;
        renderKeyTrigger(["retries"]);
      }
    },
    setTimestamp: (timestamp, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(
          command,
          [currentState.data, currentState.error, currentState.status],
          getDetailsState(state.current, { timestamp }),
        );
      } else {
        state.current.timestamp = timestamp;
        renderKeyTrigger(["timestamp"]);
      }
    },
  };

  return [state.current, actions, { setRenderKey, setCacheData, getStaleStatus }];
};
