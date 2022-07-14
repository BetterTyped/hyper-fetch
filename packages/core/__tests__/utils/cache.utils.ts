import { Cache, CacheOptionsType } from "cache";
import { BuilderInstance } from "builder";

export const createCache = (builder: BuilderInstance, options?: CacheOptionsType) => {
  return new Cache(builder, options);
};

export const createLazyCacheAdapter = (storage: Map<any, any>) => {
  return {
    get: async (key) => storage.get(key),
    set: async (key, value) => {
      storage.set(key, value);
    },
    keys: async () => storage.keys(),
    delete: async (key) => {
      storage.delete(key);
    },
  };
};
