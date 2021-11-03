import { ClientResponseType } from "client";
import { ExtractResponse, ExtractError } from "types";
import { deepCompare } from "cache";

export type CacheStoreKeyType = string;
export type CacheStoreValueType = Map<CacheKeyType, CacheValueType>;

export type CacheKeyType = string;
export type CacheValueType<DataType = any, ErrorType = any> = {
  response: ClientResponseType<DataType, ErrorType>;
  retries: number;
  timestamp: Date;
  refreshError: ErrorType;
  isRefreshed: boolean;
};

export type CacheSetDataType<T> = {
  key: CacheKeyType;
  response: ClientResponseType<ExtractResponse<T>, ExtractError<T>>;
  retries: number;
  isRefreshed: boolean;
  timestamp?: Date;
  deepCompareFn?: typeof deepCompare | null;
};
