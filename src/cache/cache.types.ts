export type CacheStoreKeyType = string;
export type CacheStoreValueType = Map<CacheKeyType, CacheValueType>;

export type CacheKeyType = string;
export type CacheValueType<DataType = any> = {
  data: DataType;
  timestamp: Date;
};
