import EventEmitter from "events";

import { FetchBuilder } from "builder";
import { CacheOptionsType, CacheStorageType, getCacheData, getCacheEvents } from "cache";
import { CacheStoreKeyType, CacheValueType, CacheStoreValueType, CacheSetDataType } from "./cache.types";

/**
 * Cache class should be initialized per every command instance(not modified with params or queryParams).
 * This way we create container which contains different requests to the same endpoint.
 * With this segregation of data we can keep paginated data, filtered data, without overriding it between not related fetches.
 * Key for interactions should be generated later in the hooks with getCommandKey util function, which joins the stringified values to create isolated space.
 *
 * Example structure:
 *
 * CacheStore:
 *   endpoint => "GET_/users/1" (cacheKey) : {...}
 *   endpoint => "GET_/users" : {...}
 *   endpoint => "GET_/users?page=1" : {...}
 *
 */
export class Cache<ErrorType, ClientOptions> {
  emitter = new EventEmitter();
  events = getCacheEvents(this.emitter);

  storage: CacheStorageType = new Map<CacheStoreKeyType, CacheStoreValueType>();

  constructor(
    private builder: FetchBuilder<ErrorType, ClientOptions>,
    private options?: CacheOptionsType<ErrorType, ClientOptions>,
  ) {
    if (this.options?.storage) {
      this.storage = this.options.storage;
    }

    this.options?.onInitialization(this);

    if (this.options?.initialData) {
      Object.keys(this.options.initialData).forEach((key) => {
        if (!this.storage.get(key) && this.options?.initialData?.[key]) {
          this.storage.set(key, this.options?.initialData[key]);
        }
      });
    }
  }

  set = <Response>({
    cache,
    cacheKey,
    response,
    retries = 0,
    deepEqual = true,
    isRefreshed = false,
    timestamp = +new Date(),
  }: CacheSetDataType<Response, ErrorType>): void => {
    const cachedData = this.storage.get(cacheKey);

    // Refresh/Retry error is saved separate to not confuse render with having already cached data and refreshed one throwing error
    // Keeping it in separate location let us to handle refreshing errors in different ways
    const refreshError = isRefreshed ? response[1] : null;
    const retryError = retries ? response[1] : null;
    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const dataToSave = getCacheData(cachedData?.response, response, refreshError, retryError);

    const newData: CacheValueType = { response: dataToSave, retries, refreshError, retryError, isRefreshed, timestamp };

    // If request should not use cache - just emit response data
    if (!cache) {
      this.builder.logger.debug(
        `[Cache] Only emitting payload as command was not for save to cache`,
        Object.entries({ cache, cacheKey, response, isRefreshed, retries, timestamp, deepEqual }),
      );

      return this.events.set<Response>(cacheKey, newData);
    }

    // We have to compare stored data with deepCompare, this will allow us to limit rerendering
    const equal = deepEqual && this.builder.deepEqual(cachedData?.response, response);

    // Global response emitter to handle command execution
    this.builder.commandManager.events.emitResponse(cacheKey, response);

    // Cache response emitter to provide optimization for libs(re-rendering)
    if (!equal) {
      this.builder.logger.debug(`[Cache] Setting new data to cache, emitting setter event...`);
      this.storage.set(cacheKey, newData);
      this.events.set<Response>(cacheKey, newData);
    } else {
      this.builder.logger.debug(`[Cache] Cached data was equal to previous values, emitting update event...`);
      this.events.setEqualData(cacheKey, isRefreshed, timestamp);
    }
  };

  get = <Response>(cacheKey: string): CacheValueType<Response> | undefined => {
    const cachedData = this.storage.get<Response>(cacheKey);
    return cachedData;
  };

  getResponses = <Response>(cacheKey: string): CacheStoreValueType<Response> | undefined => {
    return this.storage.get(cacheKey) as CacheStoreValueType<Response>;
  };

  delete = (cacheKey: string): void => {
    this.events.revalidate(cacheKey);
    this.storage.delete(cacheKey);
  };

  clear = (): void => {
    this.storage.clear();
  };
}
