import {
  Dispatcher,
  ExtractError,
  CacheValueType,
  ExtractResponse,
  ClientResponseType,
  CommandInstance,
  LoggerType,
} from "@better-typed/hyper-fetch";

import { isEqual } from "utils";

export type UseTrackedStateProps<T extends CommandInstance> = {
  command: T;
  logger: LoggerType;
  initialData: ClientResponseType<ExtractResponse<T>, ExtractError<T>> | null;
  dispatcher: Dispatcher;
  dependencyTracking: boolean;
  defaultCacheEmitting?: boolean;
  deepCompare: boolean | typeof isEqual;
};

export type UseTrackedStateReturn<T extends CommandInstance> = [
  UseTrackedStateType<T>,
  UseTrackedStateActions<T>,
  {
    setRenderKey: (renderKey: keyof UseTrackedStateType<T>) => void;
    setCacheData: (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void;
    getStaleStatus: () => boolean;
  },
];

export type UseTrackedStateType<T extends CommandInstance = CommandInstance> = {
  /**
   * Request response data
   */
  data: null | ExtractResponse<T>;
  /**
   * Request response error
   */
  error: null | ExtractError<T>;
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

export type UseTrackedStateActions<T extends CommandInstance> = {
  /**
   * Action to set custom data. We can do it locally(inside hook state) or in cache(all related sources) with 'emitToCache' option.
   */
  setData: (data: ExtractResponse<T>, emitToCache?: boolean) => void;
  /**
   * Action to set custom error. We can do it locally(inside hook state) or in all hooks with 'emitToCache' option.
   */
  setError: (error: ExtractError<T>, emitToCache?: boolean) => void;
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
