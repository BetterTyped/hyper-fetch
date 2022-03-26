import { useRef, useState } from "react";
import { useDidMount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";
import {
  ClientResponseType,
  FetchCommandInstance,
  ExtractResponse,
  ExtractError,
  FetchBuilderInstance,
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
] => {
  const { builder, cacheKey, queueKey } = command;
  const { appManager, fetchQueue, cache } = builder;

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

        const queueElement = await queue.getQueue(queueKey);
        const initialLoading = state.current.loading || !!queueElement.requests.length;

        state.current = getInitialDependentStateData(command, cacheValue, initialLoading);

        rerender(+new Date());
        setInitialized(true);
      };

      getInitialData();
    },
    [...dependencies],
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

  const actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>> = {
    setCacheData: async (cacheData, emitToCache = true) => {
      if (emitToCache) {
        await cache.set(cacheKey, cacheData.data, cacheData.details, command.cache);
      } else {
        const newStateValues = {
          data: cacheData.data[0],
          error: cacheData.data[1],
          status: cacheData.data[2],
          retries: cacheData.details.retries,
          timestamp: new Date(cacheData.details.timestamp),
          retryError: cacheData.retryError,
          refreshError: cacheData.refreshError,
          isRefreshed: cacheData.details.isRefreshed,
          loading: false,
        };
        state.current = {
          ...state.current,
          ...newStateValues,
        };
        renderOnKeyTrigger(Object.keys(newStateValues) as Array<keyof UseDependentStateType>);
      }
    },
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
        fetchQueue.events.setLoading(cacheKey, {
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
    setRefreshError: async (refreshError, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, refreshError, currentState.status],
          getDetailsState(command, state.current, { isRefreshed: !!refreshError }),
          command.cache,
        );
      } else {
        state.current.refreshError = refreshError;
        renderOnKeyTrigger(["refreshError"]);
      }
    },
    setRetryError: async (retryError, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set(
          cacheKey,
          [currentState.data, retryError, currentState.status],
          getDetailsState(command, state.current, { retries: 1 }),
          command.cache,
        );
      } else {
        state.current.retryError = retryError;
        renderOnKeyTrigger(["retryError"]);
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

  return [state.current, actions, setRenderKeys, initialized];
};
