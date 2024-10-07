import {
  Dispatcher,
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  RequestInstance,
  LoggerType,
  ExtractAdapterType,
  ExtractAdapterStatusType,
  ExtractAdapterExtraType,
  ExtractAdapterResolvedType,
  NullableType,
  CacheSetState,
} from "@hyper-fetch/core";

import { isEqual } from "utils";

export type UseTrackedStateProps<T extends RequestInstance> = {
  request: T;
  logger: LoggerType;
  initialData: NullableType<Partial<ExtractAdapterResolvedType<T>>>;
  dispatcher: Dispatcher;
  dependencyTracking: boolean;
  deepCompare: boolean | typeof isEqual;
};

export type UseTrackedStateReturn<T extends RequestInstance> = [
  UseTrackedStateType<T>,
  UseTrackedStateActions<T>,
  {
    setRenderKey: (renderKey: keyof UseTrackedStateType<T>) => void;
    setCacheData: (cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>) => void;
    getStaleStatus: () => boolean;
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
  status: ExtractAdapterStatusType<ExtractAdapterType<T>> | null;
  /**
   * Request additional response data
   */
  extra: ExtractAdapterExtraType<ExtractAdapterType<T>>;
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
  timestamp: null | Date;
};

export type UseTrackedStateActions<T extends RequestInstance> = {
  /**
   * Action to set custom data. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option.
   */
  setData: (data: CacheSetState<ExtractResponseType<T> | null>, emitToCache?: boolean) => void;
  /**
   * Action to set custom error. We can do it locally(inside hook state) or in all hooks with 'emitToCache' option.
   */
  setError: (error: CacheSetState<ExtractErrorType<T> | null>, emitToCache?: boolean) => void;
  /**
   * Action to set custom loading. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setLoading: (loading: CacheSetState<boolean>, emitToHooks?: boolean) => void;
  /**
   * Action to set custom status. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setStatus: (status: CacheSetState<ExtractAdapterStatusType<ExtractAdapterType<T>>>, emitToCache?: boolean) => void;
  /**
   * Action to set custom success. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setSuccess: (success: CacheSetState<boolean>, emitToCache?: boolean) => void;
  /**
   * Action to set custom additional data. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setExtra: (
    extra: CacheSetState<ExtractAdapterExtraType<ExtractAdapterType<T>> | null>,
    emitToCache?: boolean,
  ) => void;
  /**
   * Action to set custom retries count. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setRetries: (retries: CacheSetState<number>, emitToCache?: boolean) => void;
  /**
   * Action to set custom timestamp. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setTimestamp: (timestamp: CacheSetState<Date>, emitToCache?: boolean) => void;
};
