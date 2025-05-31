import {
  Dispatcher,
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  RequestInstance,
  ExtractAdapterType,
  ExtractAdapterStatusType,
  ExtractAdapterExtraType,
  ExtractAdapterResolvedType,
  NullableType,
  CacheSetState,
  LoggerMethods,
} from "@hyper-fetch/core";

import { isEqual } from "utils";

export type UseTrackedStateProps<T extends RequestInstance> = {
  request: T;
  logger: LoggerMethods;
  initialResponse: NullableType<Partial<ExtractAdapterResolvedType<T>>>;
  dispatcher: Dispatcher;
  dependencyTracking: boolean;
  deepCompare: boolean | typeof isEqual;
  disabled?: boolean;
  revalidate?: boolean;
};

export type UseTrackedStateReturn<T extends RequestInstance> = [
  UseTrackedStateType<T>,
  UseTrackedStateActions<T>,
  {
    setRenderKey: (renderKey: keyof UseTrackedStateType<T>) => void;
    setCacheData: (cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>) => void;
    getStaleStatus: () => boolean;
    getIsDataProcessing: (cacheKey: string) => boolean;
  },
];

export type UseTrackedStateType<T extends RequestInstance = RequestInstance> = {
  /**
   * Request response data
   */
  data: null | ExtractResponseType<T>;
  /**
   * Request response error
   */
  error: null | ExtractErrorType<T>;
  /**
   * Request loading state
   */
  loading: boolean;
  /**
   * Request status
   */
  status: null | ExtractAdapterStatusType<ExtractAdapterType<T>> | null;
  /**
   * Request additional response data
   */
  extra: null | ExtractAdapterExtraType<ExtractAdapterType<T>>;
  /**
   * Information whether request succeeded
   */
  success: boolean;
  /**
   * Request attempts
   */
  retries: number;
  /**
   * Request response timestamp
   */
  responseTimestamp: null | Date;
  /**
   * Request response timestamp
   */
  requestTimestamp: null | Date;
};

export type UseTrackedStateActions<T extends RequestInstance> = {
  /**
   * Action to set custom data. We can do it locally(inside hook state).
   * If you need to update cache data use client.cache.update(). method.
   */
  setData: (data: CacheSetState<ExtractResponseType<T> | null>) => void;
  /**
   * Action to set custom error. We can do it locally(inside hook state).
   * If you need to update cache data use client.cache.update() method.
   */
  setError: (error: CacheSetState<ExtractErrorType<T> | null>) => void;
  /**
   * Action to set custom loading. We can do it locally(inside hook state).
   * If you need to update cache data use client.cache.update() method.
   */
  setLoading: (loading: CacheSetState<boolean>) => void;
  /**
   * Action to set custom status. We can do it locally(inside hook state).
   * If you need to turn on loading for all listening hooks use client.requestManager.events.emitLoading() method.
   */
  setStatus: (status: CacheSetState<ExtractAdapterStatusType<ExtractAdapterType<T>>>) => void;
  /**
   * Action to set custom success. We can do it locally(inside hook state).
   * If you need to update cache data use client.cache.update() method.
   */
  setSuccess: (success: CacheSetState<boolean>) => void;
  /**
   * Action to set custom additional data. We can do it locally(inside hook state).
   * If you need to update cache data use client.cache.update() method.
   */
  setExtra: (extra: CacheSetState<ExtractAdapterExtraType<ExtractAdapterType<T>> | null>) => void;
  /**
   * Action to set custom retries count. We can do it locally(inside hook state).
   * If you need to update cache data use client.cache.update() method.
   */
  setRetries: (retries: CacheSetState<number>) => void;
  /**
   * Action to set custom timestamp. We can do it locally(inside hook state).
   * If you need to update cache data use client.cache.update() method.
   */
  setResponseTimestamp: (timestamp: CacheSetState<Date>) => void;
  /**
   * Action to set custom timestamp. We can do it locally(inside hook state).
   * If you need to update cache data use client.cache.update() method.
   */
  setRequestTimestamp: (timestamp: CacheSetState<Date>) => void;
};
