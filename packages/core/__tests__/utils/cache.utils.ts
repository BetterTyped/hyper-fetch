import { Cache, CacheOptionsType } from "cache";
import { FetchBuilderInstance } from "builder";

export const createCache = (builder: FetchBuilderInstance, options?: CacheOptionsType) => {
  return new Cache(builder, options);
};
