import { Cache, CacheOptionsType } from "cache";
import { FetchBuilderInstance } from "builder";

export const createCache = (builder: FetchBuilderInstance, options?: CacheOptionsType<unknown, unknown>) => {
  return new Cache(builder, options);
};
