import { FetchMiddlewareInstance } from "middleware";
import { deepCompare, CacheStore } from "cache";
import { ExtractResponse } from "types";
import {
  CacheKeyType,
  CacheStoreKeyType,
  CacheValueType,
  CacheStoreValueType,
} from "./cache.types";

/**
 * Cache class should be initialized per "base" endpoint of middleware(not modified with params or queryParams).
 * This way we create container which contains different requests to the same endpoint.
 * With this segregation of data we can keep paginated data, filtered data, without overriding it between not related fetches.
 * Key for interactions should be generated later in the hooks with getCacheKey util function, which joins the stringified values to create isolated space.
 *
 * Example structure:
 *
 * CacheStore:
 *   endpoint => "/users/:userId":
 *        caches => ["/users/1", {...}], ["/users/3", {...}], ["/users/6", {...}]
 *   endpoint => "/users"
 *        caches => ["/users", {...}], ["/users?page=1", {...}], ["/users?page=2", {...}], ["/users?search=mac", {...}]
 */
export class Cache<T extends FetchMiddlewareInstance> {
  constructor(private fetchMiddleware: T) {
    this.initialize();
  }

  private readonly cacheKey: CacheStoreKeyType = this.fetchMiddleware.apiConfig.endpoint;

  set = (key: CacheKeyType, data: ExtractResponse<T>): void => {
    const storedEntity = CacheStore.get(this.cacheKey);
    const cachedData = storedEntity?.get(key);
    const isEqual = deepCompare(cachedData, data);

    const newData: CacheValueType = { data, timestamp: new Date() };

    if (storedEntity && !isEqual) {
      storedEntity.set(key, newData);
    }
  };

  get = (key: string): CacheValueType<ExtractResponse<T>> | undefined => {
    const storedEntity = CacheStore.get(this.cacheKey);
    const cachedData = storedEntity?.get(key);

    return cachedData;
  };

  delete = (key: string): void => {
    const storedEntity = CacheStore.get(this.cacheKey);
    storedEntity?.delete(key);
  };

  initialize = (): void => {
    const storedEntity = CacheStore.get(this.cacheKey);
    if (!storedEntity) {
      const newCacheData: CacheStoreValueType = new Map();
      CacheStore.set(this.cacheKey, newCacheData);
    }
  };

  destroy = (): void => {
    CacheStore.delete(this.cacheKey);
  };
}
