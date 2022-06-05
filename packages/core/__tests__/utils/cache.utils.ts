import { Cache, CacheOptionsType } from "cache";
import { BuilderInstance } from "builder";

export const createCache = (builder: BuilderInstance, options?: CacheOptionsType) => {
  return new Cache(builder, options);
};
