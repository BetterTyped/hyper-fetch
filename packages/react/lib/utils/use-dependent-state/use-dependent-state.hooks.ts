import { useRef, useState } from "react";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";
import {
  ClientResponseType,
  FetchCommandInstance,
  ExtractResponse,
  ExtractError,
  FetchBuilderInstance,
  CacheValueType,
} from "@better-typed/hyper-fetch";

import { getCacheInitialData } from "utils";
import { UseDependentStateActions, UseDependentStateType } from "./use-dependent-state.types";
import { getDetailsState, getInitialDependentStateData, transformDataToCacheValue } from "./use-dependent-state.utils";

export const useDependentState = <T extends FetchCommandInstance>(
  command: T,
  initialData: ClientResponseType<ExtractResponse<T>, ExtractError<T>> | null,
  queue: FetchBuilderInstance["fetchQueue"] | FetchBuilderInstance["submitQueue"],
  dependencies: any[],
): [
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>,
  (renderKey: keyof UseDependentStateType) => void,
  boolean,
  (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void,
] => {
  const { builder, cacheKey, queueKey } = command;
  const { appManager, cache } = builder;

  const [initialized, setInitialized] = useState(false);
  const [, rerender] = useState(+new Date());
  const state = useRef<UseDependentStateType<ExtractResponse<T>, ExtractError<T>>>(
    getInitialDependentStateData(command, transformDataToCacheValue(command, initialData)),
  );
  const renderKeys = useRef<Array<keyof UseDependentStateType>>([]);

  const renderOnKeyTrigger = (keys: Array<keyof UseDependentStateType>) => {
    const shouldRerender = renderKeys.current.find((renderKey) => keys.includes(renderKey));
    if (shouldRerender) rerender(+new Date());
  };

  const setRenderKeys = (renderKey: keyof UseDependentStateType) => {
    renderKeys.current.push(renderKey);
  };

  useDidUpdate(
    () => {
      const getInitialData = async () => {
        const cacheData = await builder.cache.get(cacheKey);
        const cacheValue = !cacheData ? getCacheInitialData<T>(command, initialData) : cacheData;

        const queueStorage = await queue.getQueue(queueKey);
        const initialLoading = state.current.loading || (!!queueStorage.requests.length && !queueStorage.stopped);

        const newState = getInitialDependentStateData(command, cacheValue, initialLoading);

        const hasInitialState = initialData?.[0] === state.current.data;
        const hasState = !!(state.current.data || state.current.error) && !hasInitialState;
        const shouldLoadInitialCache = !hasState && cacheData;
        const shouldRemovePreviousData = hasState && !cacheData && false;

        // Don't update the state when we are fetching data for new cacheKey
        // So on paginated page we will have previous page access until the new one will be fetched
        if (shouldLoadInitialCache || shouldRemovePreviousData) {
          state.current = newState;
        }

        // Handle loading state
        state.current.loading = initialLoading;

        rerender(+new Date());
        setInitialized(true);
      };

      getInitialData();
    },
    [...dependencies, cacheKey, queueKey],
    true,
  );

  useDidMount(() => {
    const focusUnmount = appManager.events.onFocus(() => {
      state.current.isFocused = true;
      renderOnKeyTrigger(["isFocused"]);
    });
    const blurUnmount = appManager.events.onBlur(() => {
      state.current.isFocused = false;
      renderOnKeyTrigger(["isFocused"]);
    });
    const onlineUnmount = appManager.events.onOnline(() => {
      state.current.isOnline = true;
      renderOnKeyTrigger(["isOnline"]);
    });
    const offlineUnmount = appManager.events.onOffline(() => {
      state.current.isOnline = false;
      renderOnKeyTrigger(["isOnline"]);
    });

    return () => {
      focusUnmount();
      blurUnmount();
      onlineUnmount();
      offlineUnmount();
    };
  });

  const setCacheData = async (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    const newStateValues = {
      data: cacheData.data[0],
      error: cacheData.data[1],
      status: cacheData.data[2],
      retries: cacheData.details.retries,
      timestamp: new Date(cacheData.details.timestamp),
      isRefreshed: cacheData.details.isRefreshed,
      loading: false,
    };
    state.current = {
      ...state.current,
      ...newStateValues,
    };
    renderOnKeyTrigger(Object.keys(newStateValues) as Array<keyof UseDependentStateType>);
  };

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
        queue.events.setLoading(cacheKey, {
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
