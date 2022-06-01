import { useRef, useState } from "react";
import { useDidUpdate, useForceUpdate } from "@better-typed/react-lifecycle-hooks";
import {
  ExtractError,
  CacheValueType,
  ExtractResponse,
  ClientResponseType,
  FetchCommandInstance,
  FetchBuilderInstance,
} from "@better-typed/hyper-fetch";

import { getCacheInitialData } from "utils";
import { UseDependentStateActions, UseDependentStateType } from "./use-dependent-state.types";
import { getDetailsState, getInitialDependentStateData, transformDataToCacheValue } from "./use-dependent-state.utils";

/**
 *
 * @param command
 * @param initialData
 * @param queue
 * @param dependencies
 * @internal
 */
export const useDependentState = <T extends FetchCommandInstance>(
  command: T,
  initialData: ClientResponseType<ExtractResponse<T>, ExtractError<T>> | null,
  queue: FetchBuilderInstance["fetchDispatcher"] | FetchBuilderInstance["submitDispatcher"],
  dependencies: any[],
): [
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>,
  (renderKey: keyof UseDependentStateType) => void,
  boolean,
  (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void,
] => {
  const { builder, cacheKey, queueKey } = command;
  const { cache } = builder;

  const [initialized, setInitialized] = useState(false);

  // ******************
  // Dependency Tracking
  // ******************

  const forceUpdate = useForceUpdate();
  const renderKeys = useRef<Array<keyof UseDependentStateType>>([]);
  const state = useRef<UseDependentStateType<ExtractResponse<T>, ExtractError<T>>>(
    getInitialDependentStateData(command, transformDataToCacheValue(command, initialData)),
  );

  const renderOnKeyTrigger = (keys: Array<keyof UseDependentStateType>) => {
    const shouldRerender = renderKeys.current.find((renderKey) => keys.includes(renderKey));
    if (shouldRerender) forceUpdate();
  };

  const setRenderKeys = (renderKey: keyof UseDependentStateType) => {
    renderKeys.current.push(renderKey);
  };

  // ******************
  // Cache initialization
  // ******************

  useDidUpdate(
    () => {
      const getInitialData = async () => {
        // Handle initial loading state
        const initialLoading = !!queue.getRunningRequests(queueKey).length;
        state.current.loading = initialLoading;

        const cacheData = await builder.cache.get(cacheKey);
        const cacheValue = !cacheData ? getCacheInitialData<T>(command, initialData) : cacheData;

        const newState = getInitialDependentStateData(command, cacheValue, !!queue.getRunningRequests(queueKey).length);

        const hasInitialState = initialData?.[0] === state.current.data;
        const hasState = !!(state.current.data || state.current.error) && !hasInitialState;
        const shouldLoadInitialCache = !hasState && cacheData;
        const shouldRemovePreviousData = hasState && !cacheData && false;

        // Don't update the state when we are fetching data for new cacheKey
        // So on paginated page we will have previous page access until the new one will be fetched
        if (shouldLoadInitialCache || shouldRemovePreviousData) {
          state.current = newState;
        }

        forceUpdate();
        setInitialized(true);
      };

      getInitialData();
    },
    [...dependencies, cacheKey, queueKey],
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
      isRefreshed: cacheData.details.isRefreshed,
    };
    state.current = {
      ...state.current,
      ...newStateValues,
    };
    renderOnKeyTrigger(Object.keys(newStateValues) as Array<keyof UseDependentStateType>);
  };

  // ******************
  // Actions
  // ******************

  const actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>> = {
    setData: async (data, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [data, currentState.error, currentState.status],
          getDetailsState(command, state.current),
          command.cache,
        );
      } else {
        state.current.data = data;
        renderOnKeyTrigger(["data"]);
      }
    },
    setError: async (error, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, error, currentState.status],
          getDetailsState(command, state.current, { isFailed: !!error }),
          command.cache,
        );
      } else {
        state.current.error = error;
        renderOnKeyTrigger(["error"]);
      }
    },
    setLoading: async (loading, emitToHooks = true) => {
      if (emitToHooks) {
        queue.events.setLoading(queueKey, "", {
          isLoading: loading,
          isRetry: false,
          isOffline: false,
        });
      } else {
        state.current.loading = loading;
        renderOnKeyTrigger(["loading"]);
      }
    },
    setStatus: async (status, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, currentState.error, status],
          getDetailsState(command, state.current),
          command.cache,
        );
      } else {
        state.current.status = status;
        renderOnKeyTrigger(["status"]);
      }
    },
    setRefreshed: async (isRefreshed, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, currentState.error, currentState.status],
          getDetailsState(command, state.current, { isRefreshed }),
          command.cache,
        );
      } else {
        state.current.isRefreshed = isRefreshed;
        renderOnKeyTrigger(["isRefreshed"]);
      }
    },
    setRetries: async (retries, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, currentState.error, currentState.status],
          getDetailsState(command, state.current, { retries }),
          command.cache,
        );
      } else {
        state.current.retries = retries;
        renderOnKeyTrigger(["retries"]);
      }
    },
    setTimestamp: async (timestamp, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, currentState.error, currentState.status],
          getDetailsState(command, state.current, { timestamp }),
          command.cache,
        );
      } else {
        state.current.timestamp = timestamp;
        renderOnKeyTrigger(["timestamp"]);
      }
    },
  };

  return [state.current, actions, setRenderKeys, initialized, setCacheData];
};
