import { Cache, CacheAsyncStorageType, CacheOptionsType } from "cache";
import { ClientInstance } from "client";

export const createCache = (client: ClientInstance, options?: CacheOptionsType) => {
  return new Cache(client, options);
};

export const createLazyCacheAdapter = (storage: Map<any, any>): CacheAsyncStorageType => {
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
