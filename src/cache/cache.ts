import {
  CacheKeyType,
  CacheStoreKeyType,
  CacheValueType,
  CacheStoreValueType,
} from "./cache.types";
import { FetchMiddlewareInstance } from "middleware/fetch.middleware.types";
import { deepCompare } from "./cache.utils";

const CacheStore = new Map<CacheStoreKeyType, CacheStoreValueType>();

/**
 * Cache class should be initialized per "base" endpoint of middleware(not modified with params or queryParams).
 * This way we create container which contains different requests to the same endpoint.
 * With this segregation of data we can keep paginated data, filtered data, without overriding it between not related fetches.
 * Key for interactions should be generated later in the hooks with getCacheKey util function, which joins the stringified values to create isolated space.
 *
 * Example:
 *   endpoint => user/:userId
 *        cache => "user/1": {...}, "user/2": {...}, "user/6": {...}
 */
export class Cache {
  constructor(private fetchMiddleware: FetchMiddlewareInstance) {
    this.initialize();
  }

  private readonly cacheKey: CacheStoreKeyType = this.fetchMiddleware.apiConfig.endpoint;

  set = <T>(key: CacheKeyType, data: T): void => {
    const storedEntity = CacheStore.get(this.cacheKey);
    const cachedData = storedEntity?.get(key);
    const isEqual = deepCompare(cachedData, data);

    const newData: CacheValueType = { data, timestamp: new Date() };

    if (storedEntity && !isEqual) {
      storedEntity.set(key, newData);
    }
  };

  get = <T>(key: string): CacheValueType<T> | undefined => {
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
