import {
  Dispatcher,
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  ResponseType,
  RequestInstance,
  LoggerType,
} from "@hyper-fetch/core";

import { isEqual } from "utils";

export type UseTrackedStateProps<T extends RequestInstance> = {
  request: T;
  logger: LoggerType;
  initialData: ResponseType<ExtractResponseType<T>, ExtractErrorType<T>> | null;
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
   * Request http status code
   */
  status: null | number;
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
  setStatus: (status: number | null, emitToCache?: boolean) => void;
  /**
   * Action to set custom retries count. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setRetries: (retries: number, emitToCache?: boolean) => void;
  /**
   * Action to set custom timestamp. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option
   */
  setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
};
