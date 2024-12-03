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
  ExtractAdapterReturnType,
  NullableType,
} from "@hyper-fetch/core";

import { isEqual } from "utils";

export type UseTrackedStateProps<T extends RequestInstance> = {
  request: T;
  logger: LoggerType;
  initialData: NullableType<Partial<ExtractAdapterReturnType<T>>>;
  dispatcher: Dispatcher;
  dependencyTracking: boolean;
  defaultCacheEmitting?: boolean;
  deepCompare: boolean | typeof isEqual;
};

export type UseTrackedStateReturn<T extends RequestInstance> = [
  UseTrackedStateType<T>,
  UseTrackedStateActions<T>,
  {
    setRenderKey: (renderKey: keyof UseTrackedStateType<T>) => void;
    setCacheData: (cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>) => void;
    getStaleStatus: () => boolean;
    getIsDataProcessing: () => boolean;
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
  status: ExtractAdapterStatusType<ExtractAdapterType<T>>;
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
  setData: (data: ExtractResponseType<T>, emitToCache?: boolean) => void;
  /**
   * Action to set custom error. We can do it locally(inside hook state) or in all hooks with 'emitToCache' option.
   */
  setError: (error: ExtractErrorType<T>, emitToCache?: boolean) => void;
  /**
   * Action to set custom loading. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setLoading: (loading: boolean, emitToHooks?: boolean) => void;
  /**
   * Action to set custom status. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setStatus: (status: ExtractAdapterStatusType<ExtractAdapterType<T>>, emitToCache?: boolean) => void;
  /**
   * Action to set custom success. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setSuccess: (success: boolean, emitToCache?: boolean) => void;
  /**
   * Action to set custom additional data. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setExtra: (extra: ExtractAdapterExtraType<ExtractAdapterType<T>>, emitToCache?: boolean) => void;
  /**
   * Action to set custom retries count. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setRetries: (retries: number, emitToCache?: boolean) => void;
  /**
   * Action to set custom timestamp. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
};
