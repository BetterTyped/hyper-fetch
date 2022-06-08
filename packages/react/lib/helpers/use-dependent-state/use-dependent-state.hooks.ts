import { useRef, useState } from "react";
import { useDidUpdate, useForceUpdate } from "@better-typed/react-lifecycle-hooks";
import { ExtractError, CacheValueType, ExtractResponse, CommandInstance } from "@better-typed/hyper-fetch";

import {
  UseDependentStateActions,
  UseDependentStateType,
  UseDependentStateProps,
  UseDependentStateReturn,
} from "./use-dependent-state.types";
import {
  getDetailsState,
  getInitialState,
  responseToCacheValue,
  getValidCacheData,
  isStaleCacheData,
} from "./use-dependent-state.utils";

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
  dependencyTracking,
  defaultCacheEmitting = true,
}: UseDependentStateProps<T>): UseDependentStateReturn<T> => {
  const { builder, cacheKey, queueKey } = command;
  const { cache } = builder;
  const initialState = getInitialState(responseToCacheValue(initialData), dispatcher.hasRunningRequests(queueKey));

  const forceUpdate = useForceUpdate();

  const state = useRef<UseDependentStateType<ExtractResponse<T>, ExtractError<T>>>(initialState);
  const renderKeys = useRef<Array<keyof UseDependentStateType>>([]);
  const [isInitialized, setInitialized] = useState(false);

  // ******************
  // Utils
  // ******************

  const getStaleStatus = async () => {
    const cacheData = await command.builder.cache.get(command.cacheKey);

    return isStaleCacheData(command.cacheTime, cacheData?.details.timestamp);
  };

  // ******************
  // Dependency Tracking
  // ******************

  const renderOnKeyTrigger = (keys: Array<keyof UseDependentStateType>) => {
    const shouldRerender = renderKeys.current.find((renderKey) => keys.includes(renderKey));
    if (shouldRerender) forceUpdate();
  };

  const setRenderKey = (renderKey: keyof UseDependentStateType) => {
    renderKeys.current.push(renderKey);
  };

  // ******************
  // Cache initialization
  // ******************

  useDidUpdate(
    () => {
      const getInitialData = async () => {
        setInitialized(false);

        // Handle initial loading state
        state.current.loading = dispatcher.hasRunningRequests(queueKey);

        // Get cache state
        const cacheData = await builder.cache.get<ExtractResponse<T>, ExtractError<T>>(cacheKey);
        const cacheState = getValidCacheData<T>(command, initialData, cacheData);
        const newState = getInitialState(cacheState, dispatcher.hasRunningRequests(queueKey));

        const hasInitialState = initialData?.[0] === state.current.data;
        const hasState = !!(state.current.data || state.current.error) && !hasInitialState;
        const shouldLoadInitialCache = !hasState && cacheData;
        const shouldRemovePreviousData = hasState && !cacheData;

        if (shouldLoadInitialCache || shouldRemovePreviousData) {
          // Don't update the state when we are fetching data for new cacheKey
          // So on paginated page we will have previous page access until the new one will be fetched
          state.current = newState;
        }

        setInitialized(true);
      };

      getInitialData();
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

  const setCacheData = async (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    const newStateValues = {
      data: cacheData.data[0],
      error: cacheData.data[1],
      status: cacheData.data[2],
      retries: cacheData.details.retries,
      timestamp: new Date(cacheData.details.timestamp),
    };
    state.current = {
      ...state.current,
      ...newStateValues,
    };

    forceUpdate();
  };

  // ******************
  // Actions
  // ******************

  const actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>> = {
    setData: async (data, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [data, currentState.error, currentState.status],
          getDetailsState(state.current),
          command.cache,
        );
      } else {
        state.current.data = data;
        renderOnKeyTrigger(["data"]);
      }
    },
    setError: async (error, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, error, currentState.status],
          getDetailsState(state.current, { isFailed: !!error }),
          command.cache,
        );
      } else {
        state.current.error = error;
        renderOnKeyTrigger(["error"]);
      }
    },
    setLoading: async (loading, emitToHooks = true) => {
      if (emitToHooks) {
        dispatcher.events.setLoading(queueKey, "", {
          isLoading: loading,
          isRetry: false,
          isOffline: false,
        });
      } else {
        state.current.loading = loading;
        renderOnKeyTrigger(["loading"]);
      }
    },
    setStatus: async (status, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, currentState.error, status],
          getDetailsState(state.current),
          command.cache,
        );
      } else {
        state.current.status = status;
        renderOnKeyTrigger(["status"]);
      }
    },
    setRetries: async (retries, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, currentState.error, currentState.status],
          getDetailsState(state.current, { retries }),
          command.cache,
        );
      } else {
        state.current.retries = retries;
        renderOnKeyTrigger(["retries"]);
      }
    },
    setTimestamp: async (timestamp, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, currentState.error, currentState.status],
          getDetailsState(state.current, { timestamp }),
          command.cache,
        );
      } else {
        state.current.timestamp = timestamp;
        renderOnKeyTrigger(["timestamp"]);
      }
    },
  };

  return [state.current, actions, { setRenderKey, isInitialized, setCacheData, getStaleStatus }];
};
