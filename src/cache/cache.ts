import { FetchMiddlewareInstance } from "middleware";
import { deepCompare, CacheStore, getCacheData } from "cache";
import { ExtractResponse } from "types";
import { CacheKeyType, CacheStoreKeyType, CacheValueType, CacheStoreValueType, CacheSetDataType } from "./cache.types";
import { CACHE_EVENTS } from "./cache.events";

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
  private cacheKey: CacheStoreKeyType;

  constructor(private fetchMiddleware: T) {
    this.cacheKey = this.fetchMiddleware.apiConfig.endpoint;
    this.initialize(this.cacheKey);
  }

  set = ({ key, response, retries, deepCompareFn = deepCompare, isRefreshed }: CacheSetDataType<T>): void => {
    const cacheEntity = CacheStore.get(this.cacheKey);
    const cachedData = cacheEntity?.get(key);
    // We have to compare stored data with deepCompare, this will allow us to limit rerendering
    const isEqual = cachedData && deepCompareFn ? deepCompareFn(cachedData.response, response) : false;

    // Refresh error is saved separate to not confuse render with having already cached data and refreshed one throwing error
    // Keeping it in separate location let us to handle refreshing errors in different ways
    const refreshError = isRefreshed ? response[1] : null;
    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const dataToSave = getCacheData(cachedData?.response, response, refreshError);

    const newData: CacheValueType = { response: dataToSave, retries, refreshError, isRefreshed, timestamp: new Date() };

    if (cacheEntity && !isEqual) {
      cacheEntity.set(key, newData);
      CACHE_EVENTS.set<T>(key, newData);
    }
  };

  get = (key: string): CacheValueType<ExtractResponse<T>> | undefined => {
    const cacheEntity = CacheStore.get(this.cacheKey);
    const cachedData = cacheEntity?.get(key);

    return cachedData;
  };

  delete = (key: string): void => {
    const cacheEntity = CacheStore.get(this.cacheKey);
    cacheEntity?.delete(key);
  };

  initialize = (cacheKey: CacheKeyType): void => {
    const cacheEntity = CacheStore.get(cacheKey);
    if (!cacheEntity) {
      const newCacheData: CacheStoreValueType = new Map();
      CacheStore.set(cacheKey, newCacheData);
    }
  };

  destroy = (): void => {
    CacheStore.delete(this.cacheKey);
  };
}
