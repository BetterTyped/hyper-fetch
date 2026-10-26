import type {
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
  ResponseDetailsType,
  CacheSetState,
  LoggerMethods,
} from "@hyper-fetch/core";
import type { isEqual } from "utils";

export type UseTrackedStateProps<T extends RequestInstance, TData = ExtractResponseType<T>> = {
  request: T;
  logger: LoggerMethods;
  initialResponse: NullableType<Partial<ExtractAdapterResolvedType<T>>>;
  dispatcher: Dispatcher<ExtractAdapterType<T>>;
  dependencyTracking: boolean;
  deepCompare: boolean | typeof isEqual;
  keepPreviousData?: "auto" | "preserve" | "clean";
  disabled?: boolean;
  revalidate?: boolean;
  select?: UseTrackedStateSelect<T, TData>;
  structuralSharing?: boolean;
};

/**
 * Selector picking (or transforming) the part of the response data used by the component
 */
export type UseTrackedStateSelect<T extends RequestInstance, TData = ExtractResponseType<T>> = (
  data: ExtractResponseType<T>,
) => TData;

export type UseTrackedStateReturn<T extends RequestInstance, TData = ExtractResponseType<T>> = [
  UseTrackedStateType<T, TData>,
  UseTrackedStateActions<T, TData>,
  {
    setRenderKey: (renderKey: keyof UseTrackedStateType<T, TData>) => void;
    setCacheData: (cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>) => void;
    getStaleStatus: () => boolean;
    getIsDataProcessing: (cacheKey: string) => boolean;
    selectData: (data: ExtractResponseType<T> | null) => TData | null;
    /**
     * Details of the last response received from the cache - null when the state did not come from a response
     */
    getResponseDetails: () => UseTrackedStateResponseDetails | null;
  },
];

export type UseTrackedStateResponseDetails = Pick<ResponseDetailsType, "willRetry" | "isCanceled" | "isOffline">;

export type UseTrackedStateType<T extends RequestInstance = RequestInstance, TData = ExtractResponseType<T>> = {
  /**
   * Request response data
   */
  data: null | TData;
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

export type UseTrackedStateActions<T extends RequestInstance, TData = ExtractResponseType<T>> = {
  /**
   * Action to set custom data. We can do it locally(inside hook state).
   * When `select` is used it receives the selected data shape.
   * If you need to update cache data use client.cache.update(). method.
   */
  setData: (data: CacheSetState<TData | null>) => void;
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
  /**
   * Reset all state fields to their initial values (data, error, status, extra → null, loading → false, etc.).
   */
  clearState: () => void;
};
