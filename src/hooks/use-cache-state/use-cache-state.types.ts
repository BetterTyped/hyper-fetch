import { CacheValueType } from "cache";
import { UseCacheStateEnum } from "./use-cache-state.constants";

export type UseCacheStateType<DataType = any, ErrorType = any> = {
  data: null | DataType;
  error: null | ErrorType;
  loading: boolean;
  status: null | number;
  isCanceled: boolean;
  retries: number;
  timestamp: null | Date;
};

export type UseCacheStateActions<DataType, ErrorType> = {
  [UseCacheStateEnum.setCacheData]: (cacheData: CacheValueType) => void;
  [UseCacheStateEnum.setLoading]: (loading: boolean) => void;
  [UseCacheStateEnum.setData]: (data: DataType) => void;
  [UseCacheStateEnum.setError]: (error: ErrorType) => void;
};

export type UseCacheStateAction<DataType, ErrorType> =
  | { type: typeof UseCacheStateEnum.setCacheData; cacheData: CacheValueType }
  | { type: typeof UseCacheStateEnum.setLoading; loading: boolean }
  | { type: typeof UseCacheStateEnum.setData; data: DataType | null }
  | { type: typeof UseCacheStateEnum.setError; error: null | ErrorType };
