import { FetchMiddlewareInstance } from "middleware";
import { deepCompare, CacheStore } from "cache";
import { ExtractResponse, ExtractError } from "types";
import { ClientResponseType } from "client";
import {
  CacheKeyType,
  CacheStoreKeyType,
  CacheValueType,
  CacheStoreValueType,
} from "./cache.types";
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

  set = (
    key: CacheKeyType,
    response: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
    retries: number,
  ): void => {
    const storedEntity = CacheStore.get(this.cacheKey);
    const cachedData = storedEntity?.get(key);
    const isEqual = cachedData ? deepCompare(cachedData.response, response) : false;

    const newData: CacheValueType = { response, retries, timestamp: new Date() };

    if (storedEntity && !isEqual) {
      storedEntity.set(key, newData);
      CACHE_EVENTS.set<T>(key, newData);
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

  initialize = (cacheKey: CacheKeyType): void => {
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
