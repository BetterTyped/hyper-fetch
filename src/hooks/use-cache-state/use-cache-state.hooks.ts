import { useReducer } from "react";

import { Cache, CacheValueType } from "cache";
import { FetchMiddlewareInstance } from "middleware";
import { ExtractResponse, ExtractError } from "types";
import { FETCH_QUEUE_EVENTS } from "queues";
import { UseCacheStateEnum, cacheStateReducer } from "./use-cache-state.constants";
import { UseCacheStateActions, UseCacheStateType } from "./use-cache-state.types";
import { getInitialCacheStateData } from "./use-cache-state.utils";

// TBD: implement DEPENDENCY TRACKING MECHANISM!!!
export const useCacheState = <T extends FetchMiddlewareInstance>(
  key: string,
  cache: Cache<T>,
  initialData: CacheValueType | undefined,
): [
  UseCacheStateType<ExtractResponse<T>, ExtractError<T>>,
  UseCacheStateActions<ExtractResponse<T>, ExtractError<T>>,
] => {
  const [state, dispatch] = useReducer(
    cacheStateReducer<ExtractResponse<T>, ExtractError<T>>(),
    getInitialCacheStateData(initialData),
  );

  const actions: UseCacheStateActions<ExtractResponse<T>, ExtractError<T>> = {
    setCacheData: (cacheData, emitToCache = true) => {
      if (emitToCache) {
        cache.set({
          ...cacheData,
          key,
        });
      } else {
        dispatch({ type: UseCacheStateEnum.setCacheData, cacheData });
      }
    },
    setData: (data, emitToCache = true) => {
      if (emitToCache) {
        cache.set({
          key,
          response: [data, state.error, state.status],
          retries: state.retries,
          isRefreshed: state.isRefreshed,
        });
      } else {
        dispatch({ type: UseCacheStateEnum.setData, data });
      }
    },
    setError: (error, emitToCache = true) => {
      if (emitToCache) {
        cache.set({
          key,
          response: [state.data, error, state.status],
          retries: state.retries,
          isRefreshed: state.isRefreshed,
        });
      } else {
        dispatch({ type: UseCacheStateEnum.setError, error });
      }
    },
    setLoading: (loading, emitToHooks = true) => {
      if (emitToHooks) {
        FETCH_QUEUE_EVENTS.setLoading(key, loading);
      } else {
        dispatch({ type: UseCacheStateEnum.setLoading, loading });
      }
    },
    setStatus: (status, emitToCache = true) => {
      if (emitToCache) {
        cache.set({
          key,
          response: [state.data, state.error, status],
          retries: state.retries,
          isRefreshed: state.isRefreshed,
        });
      } else {
        dispatch({ type: UseCacheStateEnum.setStatus, status });
      }
    },
    setRefreshed: (isRefreshed, emitToCache = true) => {
      if (emitToCache) {
        cache.set({
          key,
          response: [state.data, state.error, state.status],
          retries: state.retries,
          isRefreshed,
        });
      } else {
        dispatch({ type: UseCacheStateEnum.setRefreshed, isRefreshed });
      }
    },
    setRefreshError: (refreshError, emitToCache = true) => {
      if (emitToCache) {
        cache.set({
          key,
          response: [state.data, refreshError, state.status],
          retries: state.retries,
          isRefreshed: true,
        });
      } else {
        dispatch({ type: UseCacheStateEnum.setRefreshError, refreshError });
      }
    },
    setRetries: (retries, emitToCache = true) => {
      if (emitToCache) {
        cache.set({
          key,
          response: [state.data, state.error, state.status],
          retries,
          isRefreshed: state.isRefreshed,
        });
      } else {
        dispatch({ type: UseCacheStateEnum.setRetries, retries });
      }
    },
    setTimestamp: (timestamp, emitToCache = true) => {
      if (emitToCache) {
        cache.set({
          key,
          response: [state.data, state.error, state.status],
          retries: state.retries,
          isRefreshed: state.isRefreshed,
          timestamp: timestamp || undefined,
        });
      } else {
        dispatch({ type: UseCacheStateEnum.setTimestamp, timestamp });
      }
    },
  };

  return [state, actions];
};
