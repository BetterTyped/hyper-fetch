import { useRef, useState } from "react";

import { Cache, CacheValueType } from "cache";
import { FetchCommandInstance } from "command";
import { ExtractResponse, ExtractError, NullableType } from "types";
import { FETCH_QUEUE_EVENTS } from "queues";
import { UseDependentStateActions, UseDependentStateType } from "./use-dependent-state.types";
import { getInitialDependentStateData } from "./use-dependent-state.utils";

export const useDependentState = <T extends FetchCommandInstance>(
  endpointKey: string,
  requestKey: string,
  cache: Cache<ExtractError<T>>,
  initialData: NullableType<CacheValueType>,
): [
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>,
  (renderKey: keyof UseDependentStateType) => void,
] => {
  const [, rerender] = useState(+new Date());
  const state = useRef<UseDependentStateType<ExtractResponse<T>, ExtractError<T>>>(
    getInitialDependentStateData(initialData),
  );
  const renderKeys = useRef<Array<keyof UseDependentStateType>>([]);

  const renderOnKeyTrigger = (keys: Array<keyof UseDependentStateType>) => {
    const shouldRerender = renderKeys.current.find((renderKey) => keys.includes(renderKey));
    if (shouldRerender) rerender(+new Date());
  };

  const setRenderKeys = (renderKey: keyof UseDependentStateType) => {
    renderKeys.current.push(renderKey);
  };

  const actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>> = {
    setCacheData: (cacheData, emitToCache = true) => {
      if (emitToCache) {
        cache.set({
          endpointKey,
          requestKey,
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
    setData: (data, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set({
          endpointKey,
          requestKey,
          response: [data, currentState.error, currentState.status],
          retries: currentState.retries,
          isRefreshed: currentState.isRefreshed,
        });
      } else {
        state.current.data = data;
        renderOnKeyTrigger(["data"]);
      }
    },
    setError: (error, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set({
          endpointKey,
          requestKey,
          response: [currentState.data, error, currentState.status],
          retries: currentState.retries,
          isRefreshed: currentState.isRefreshed,
        });
      } else {
        state.current.error = error;
        renderOnKeyTrigger(["error"]);
      }
    },
    setLoading: (loading, emitToHooks = true) => {
      if (emitToHooks) {
        FETCH_QUEUE_EVENTS.setLoading(requestKey, {
          isLoading: loading,
          isRetry: false,
          isRefreshed: false,
          isRevalidated: false,
        });
      } else {
        state.current.loading = loading;
        renderOnKeyTrigger(["loading"]);
      }
    },
    setStatus: (status, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set({
          endpointKey,
          requestKey,
          response: [currentState.data, currentState.error, status],
          retries: currentState.retries,
          isRefreshed: currentState.isRefreshed,
        });
      } else {
        state.current.status = status;
        renderOnKeyTrigger(["status"]);
      }
    },
    setRefreshed: (isRefreshed, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set({
          endpointKey,
          requestKey,
          response: [currentState.data, currentState.error, currentState.status],
          retries: currentState.retries,
          isRefreshed,
        });
      } else {
        state.current.isRefreshed = isRefreshed;
        renderOnKeyTrigger(["isRefreshed"]);
      }
    },
    setRefreshError: (refreshError, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set({
          endpointKey,
          requestKey,
          response: [currentState.data, refreshError, currentState.status],
          retries: currentState.retries,
          isRefreshed: true,
        });
      } else {
        state.current.refreshError = refreshError;
        renderOnKeyTrigger(["refreshError"]);
      }
    },
    setRetryError: (retryError, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set({
          endpointKey,
          requestKey,
          response: [currentState.data, retryError, currentState.status],
          retries: currentState.retries,
          isRefreshed: true,
        });
      } else {
        state.current.retryError = retryError;
        renderOnKeyTrigger(["retryError"]);
      }
    },
    setRetries: (retries, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set({
          endpointKey,
          requestKey,
          response: [currentState.data, currentState.error, currentState.status],
          retries,
          isRefreshed: currentState.isRefreshed,
        });
      } else {
        state.current.retries = retries;
        renderOnKeyTrigger(["retries"]);
      }
    },
    setTimestamp: (timestamp, emitToCache = true) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set({
          endpointKey,
          requestKey,
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

  return [state.current, actions, setRenderKeys];
};
