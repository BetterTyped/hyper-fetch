import { CacheValueType } from "cache";
import { UseCacheStateEnum } from "./use-cache-state.constants";

export type UseCacheStateType<DataType = any, ErrorType = any> = {
  data: null | DataType;
  error: null | ErrorType;
  loading: boolean;
  status: null | number;
  refreshError: null | ErrorType;
  isRefreshed: boolean;
  retries: number;
  timestamp: null | Date;
};

export type UseCacheStateActions<DataType, ErrorType> = {
  [UseCacheStateEnum.setCacheData]: (cacheData: CacheValueType, emitToCache?: boolean) => void;
  [UseCacheStateEnum.setData]: (data: DataType, emitToCache?: boolean) => void;
  [UseCacheStateEnum.setError]: (error: ErrorType, emitToCache?: boolean) => void;
  [UseCacheStateEnum.setLoading]: (loading: boolean, emitToHooks?: boolean) => void;
  [UseCacheStateEnum.setStatus]: (status: number | null, emitToCache?: boolean) => void;
  [UseCacheStateEnum.setRefreshed]: (isRefreshed: boolean, emitToCache?: boolean) => void;
  [UseCacheStateEnum.setRetries]: (retries: number, emitToCache?: boolean) => void;
  [UseCacheStateEnum.setTimestamp]: (timestamp: null | Date, emitToCache?: boolean) => void;
  [UseCacheStateEnum.setRefreshError]: (refreshError: null | ErrorType, emitToCache?: boolean) => void;
};

export type UseCacheStateAction<DataType, ErrorType> =
  | { type: typeof UseCacheStateEnum.setCacheData; cacheData: CacheValueType }
  | { type: typeof UseCacheStateEnum.setData; data: DataType | null }
  | { type: typeof UseCacheStateEnum.setError; error: null | ErrorType }
  | { type: typeof UseCacheStateEnum.setLoading; loading: boolean }
  | { type: typeof UseCacheStateEnum.setStatus; status: null | number }
  | { type: typeof UseCacheStateEnum.setRefreshed; isRefreshed: boolean }
  | { type: typeof UseCacheStateEnum.setRetries; retries: number }
  | { type: typeof UseCacheStateEnum.setTimestamp; timestamp: null | Date }
  | { type: typeof UseCacheStateEnum.setRefreshError; refreshError: null | ErrorType };
