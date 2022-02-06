import { useRef, useState } from "react";
import { useDidMount } from "@better-typed/react-lifecycle-hooks";
import {
  ClientResponseType,
  FetchCommandInstance,
  ExtractResponse,
  ExtractError,
  FetchBuilderInstance,
} from "@better-typed/hyper-fetch";

import { getCacheState, getCacheInitialData, isStaleCacheData } from "utils";
import { UseDependentStateActions, UseDependentStateType } from "./use-dependent-state.types";
import { getInitialDependentStateData, transformDataToCacheValue } from "./use-dependent-state.utils";

export const useDependentState = <T extends FetchCommandInstance>(
  command: FetchCommandInstance,
  initialData: ClientResponseType<ExtractResponse<T>, ExtractError<T>> | null,
  queue: FetchBuilderInstance["fetchQueue"] | FetchBuilderInstance["submitQueue"],
): [
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>,
  (renderKey: keyof UseDependentStateType) => void,
  boolean,
] => {
  const { builder, cacheKey, cacheTime, queueKey } = command;
  const { appManager, fetchQueue, cache } = builder;

  const [initialized, setInitialized] = useState(false);
  const [, rerender] = useState(+new Date());
  const state = useRef<UseDependentStateType<ExtractResponse<T>, ExtractError<T>>>(
    getInitialDependentStateData(command, transformDataToCacheValue(initialData)),
  );
  const renderKeys = useRef<Array<keyof UseDependentStateType>>([]);

  const renderOnKeyTrigger = (keys: Array<keyof UseDependentStateType>) => {
    const shouldRerender = renderKeys.current.find((renderKey) => keys.includes(renderKey));
    if (shouldRerender) rerender(+new Date());
  };

  const setRenderKeys = (renderKey: keyof UseDependentStateType) => {
    renderKeys.current.push(renderKey);
  };

  useDidMount(() => {
    const getInitialData = async () => {
      const cacheData = await builder.cache.get(cacheKey);
      const initCacheState = getCacheState(cacheData, command.cache, cacheTime);
      const isStale = isStaleCacheData(cacheTime, initCacheState?.timestamp);
      const cacheValue = isStale ? getCacheInitialData<T>(initialData) : initCacheState;
      const queueElement = await queue.get(queueKey);
      const initialLoading = state.current.loading || !!queueElement.requests.length;

      state.current = getInitialDependentStateData(command, cacheValue, initialLoading);

      rerender(+new Date());
      setInitialized(true);
    };

    getInitialData();
  });

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
        await cache.set({
          cache: command.cache,
          cacheKey,
          ...cacheData,
        });
      } else {
        const newStateValues = {
          data: cacheData.response[0],
          error: cacheData.response[1],
          status: cacheData.response[2],
          retries: cacheData.retries,
          timestamp: new Date(cacheData.timestamp),
          retryError: cacheData.retryError,
          refreshError: cacheData.refreshError,
          isRefreshed: cacheData.isRefreshed,
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
        await cache.set({
          cache: command.cache,
          cacheKey,
          response: [data, currentState.error, currentState.status],
          retries: currentState.retries,
          isRefreshed: currentState.isRefreshed,
        });
      } else {
        state.current.data = data;
        renderOnKeyTrigger(["data"]);
      }
    },
    setError: async (error, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set({
          cache: command.cache,
          cacheKey,
          response: [currentState.data, error, currentState.status],
          retries: currentState.retries,
          isRefreshed: currentState.isRefreshed,
        });
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
        });
      } else {
        state.current.loading = loading;
        renderOnKeyTrigger(["loading"]);
      }
    },
    setStatus: async (status, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set({
          cache: command.cache,
          cacheKey,
          response: [currentState.data, currentState.error, status],
          retries: currentState.retries,
          isRefreshed: currentState.isRefreshed,
        });
      } else {
        state.current.status = status;
        renderOnKeyTrigger(["status"]);
      }
    },
    setRefreshed: async (isRefreshed, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set({
          cache: command.cache,
          cacheKey,
          response: [currentState.data, currentState.error, currentState.status],
          retries: currentState.retries,
          isRefreshed,
        });
      } else {
        state.current.isRefreshed = isRefreshed;
        renderOnKeyTrigger(["isRefreshed"]);
      }
    },
    setRefreshError: async (refreshError, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set({
          cache: command.cache,
          cacheKey,
          response: [currentState.data, refreshError, currentState.status],
          retries: currentState.retries,
          isRefreshed: true,
        });
      } else {
        state.current.refreshError = refreshError;
        renderOnKeyTrigger(["refreshError"]);
      }
    },
    setRetryError: async (retryError, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set({
          cache: command.cache,
          cacheKey,
          response: [currentState.data, retryError, currentState.status],
          retries: currentState.retries,
          isRefreshed: true,
        });
      } else {
        state.current.retryError = retryError;
        renderOnKeyTrigger(["retryError"]);
      }
    },
    setRetries: async (retries, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set({
          cache: command.cache,
          cacheKey,
          response: [currentState.data, currentState.error, currentState.status],
          retries,
          isRefreshed: currentState.isRefreshed,
        });
      } else {
        state.current.retries = retries;
        renderOnKeyTrigger(["retries"]);
      }
    },
    setTimestamp: async (timestamp, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        await cache.set({
          cache: command.cache,
          cacheKey,
          response: [currentState.data, currentState.error, currentState.status],
          retries: currentState.retries,
          isRefreshed: currentState.isRefreshed,
          timestamp: timestamp ? +timestamp : undefined,
        });
      } else {
        state.current.timestamp = timestamp;
        renderOnKeyTrigger(["timestamp"]);
      }
    },
  };

  return [state.current, actions, setRenderKeys, initialized];
};
