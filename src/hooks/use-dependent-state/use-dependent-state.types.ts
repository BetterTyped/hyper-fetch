import { CacheValueType } from "cache";

export type UseDependentStateType<DataType = any, ErrorType = any> = {
  data: null | DataType;
  error: null | ErrorType;
  loading: boolean;
  status: null | number;
  refreshError: null | ErrorType;
  retryError: null | ErrorType;
  isRefreshed: boolean;
  retries: number;
  timestamp: null | Date;
  isOnline: boolean;
  isFocused: boolean;
};

export type UseDependentStateActions<DataType, ErrorType> = {
  setCacheData: (cacheData: CacheValueType, emitToCache?: boolean) => void;
  setData: (data: DataType, emitToCache?: boolean) => void;
  setError: (error: ErrorType, emitToCache?: boolean) => void;
  setLoading: (loading: boolean, emitToHooks?: boolean) => void;
  setStatus: (status: number | null, emitToCache?: boolean) => void;
  setRefreshed: (isRefreshed: boolean, emitToCache?: boolean) => void;
  setRetries: (retries: number, emitToCache?: boolean) => void;
  setTimestamp: (timestamp: null | Date, emitToCache?: boolean) => void;
  setRefreshError: (refreshError: null | ErrorType, emitToCache?: boolean) => void;
  setRetryError: (retryError: null | ErrorType, emitToCache?: boolean) => void;
};
