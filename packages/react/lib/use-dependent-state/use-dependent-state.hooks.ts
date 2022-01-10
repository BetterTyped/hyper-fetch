import { useRef, useState } from "react";
import { useDidMount } from "@better-typed/react-lifecycle-hooks";
import {
  FetchBuilder,
  CacheValueType,
  FetchCommandInstance,
  ExtractResponse,
  ExtractError,
  ExtractClientOptions,
  NullableType,
} from "@better-typed/hyper-fetch";

import { UseDependentStateActions, UseDependentStateType } from "./use-dependent-state.types";
import { getInitialDependentStateData } from "./use-dependent-state.utils";

export const useDependentState = <T extends FetchCommandInstance>(
  cacheKey: string,
  requestKey: string,
  builder: FetchBuilder<ExtractError<T>, ExtractClientOptions<T>>,
  initialData: NullableType<CacheValueType>,
): [
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>,
  (renderKey: keyof UseDependentStateType) => void,
] => {
  const [, rerender] = useState(+new Date());
  const state = useRef<UseDependentStateType<ExtractResponse<T>, ExtractError<T>>>(
    getInitialDependentStateData(initialData, builder),
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
    const focusUnmount = builder.manager.events.onFocus(() => {
      state.current.isFocused = true;
      renderOnKeyTrigger(["isFocused"]);
    });
    const blurUnmount = builder.manager.events.onBlur(() => {
      state.current.isFocused = false;
      renderOnKeyTrigger(["isFocused"]);
    });
    const onlineUnmount = builder.manager.events.onOnline(() => {
      state.current.isOnline = true;
      renderOnKeyTrigger(["isOnline"]);
    });
    const offlineUnmount = builder.manager.events.onOffline(() => {
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
    setCacheData: (cacheData, emitToCache = true) => {
      if (emitToCache) {
        builder.cache.set({
          cacheKey,
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
        builder.cache.set({
          cacheKey,
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
        builder.cache.set({
          cacheKey,
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
        builder.fetchQueue.events.setLoading(requestKey, {
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
        builder.cache.set({
          cacheKey,
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
        builder.cache.set({
          cacheKey,
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
        builder.cache.set({
          cacheKey,
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
        builder.cache.set({
          cacheKey,
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
        builder.cache.set({
          cacheKey,
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
        builder.cache.set({
          cacheKey,
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
