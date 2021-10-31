import { ClientResponseType } from "client";

export type CacheStoreKeyType = string;
export type CacheStoreValueType = Map<CacheKeyType, CacheValueType>;

export type CacheKeyType = string;
export type CacheValueType<DataType = any, ErrorType = any> = {
  response: ClientResponseType<DataType, ErrorType>;
  retries: number;
  timestamp: Date;
};
