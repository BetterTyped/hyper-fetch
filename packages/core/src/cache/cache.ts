import EventEmitter from "events";

import { AdapterInstance, ResponseReturnType } from "adapter";
import { ClientInstance, ExtractAdapterTypeFromClient } from "client";
import { ResponseDetailsType, LoggerType } from "managers";
import {
  CacheOptionsType,
  CacheAsyncStorageType,
  CacheStorageType,
  getCacheData,
  getCacheEvents,
  CacheValueType,
  CacheMethodType,
} from "cache";
import { RequestJSON, RequestInstance } from "request";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";

/**
 * Cache class handles the data exchange with the dispatchers.
 *
 * @note
 * Keys used to save the values are created dynamically on the Request class
 *
 */
export class Cache<C extends ClientInstance> {
  public emitter = new EventEmitter();
  public events: ReturnType<typeof getCacheEvents>;

  public storage: CacheStorageType;
  public lazyStorage?: CacheAsyncStorageType;
  public clearKey: string;
  public garbageCollectors = new Map<string, ReturnType<typeof setTimeout>>();
  private logger: LoggerType;

  constructor(public client: C, public options?: CacheOptionsType) {
    this.storage = this.options?.storage || new Map<string, CacheValueType>();
    this.events = getCacheEvents(this.emitter);
    this.options?.onInitialization?.(this);

    this.clearKey = this.options?.clearKey || "";
    this.lazyStorage = this.options?.lazyStorage;
    this.logger = this.client.loggerManager.init("Cache");

    this.getLazyKeys().then((keys) => {
      keys.forEach(this.scheduleGarbageCollector);
    });

    // Going back from offline should re-trigger garbage collection
    this.client.appManager.events.onOnline(() => {
      this.getLazyKeys().then((keys) => {
        keys.forEach(this.scheduleGarbageCollector);
      });
    });
  }

  /**
   * Set the cache data to the storage
   * @param request
   * @param response
   * @returns
   */
  set = <Request extends RequestInstance>(
    request: RequestInstance | RequestJSON<any>,
    response: CacheMethodType<
      ResponseReturnType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>> &
        ResponseDetailsType
    >,
  ): void => {
    this.logger.debug("Processing cache response", { request, response });
    const { cacheKey, cache, cacheTime, garbageCollection } = request;
    const cachedData = this.storage.get<
      ExtractResponseType<Request>,
      ExtractErrorType<Request>,
      ExtractAdapterType<Request>
    >(cacheKey);

    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const processedResponse = typeof response === "function" ? response(cachedData) : response;
    const data = getCacheData(cachedData, processedResponse);

    const newCacheData: CacheValueType = { ...data, cacheTime, clearKey: this.clearKey, garbageCollection };

    this.events.emitCacheData<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>(
      cacheKey,
      newCacheData,
    );
    this.logger.debug("Emitting cache response", { request, data });

    // If request should not use cache - just emit response data
    if (!cache) {
      return this.logger.debug("Prevented saving response to cache", { request, data });
    }

    // Only success data is valid for the cache store
    if (processedResponse.success) {
      this.logger.debug("Saving response to cache storage", { request, data });
      this.storage.set<Response, Error, ExtractAdapterTypeFromClient<typeof this.client>>(cacheKey, newCacheData);
      this.lazyStorage?.set<Response, Error, ExtractAdapterTypeFromClient<typeof this.client>>(cacheKey, newCacheData);
      this.options?.onChange?.(cacheKey, newCacheData);
      this.scheduleGarbageCollector(cacheKey);
    }
  };

  /**
   * Update the cache data with partial response data
   * @param request
   * @param partialResponse
   * @returns
   */
  update = <Request extends RequestInstance>(
    request: RequestInstance | RequestJSON<RequestInstance>,
    partialResponse: CacheMethodType<
      Partial<
        ResponseReturnType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>> &
          ResponseDetailsType
      >
    >,
  ): void => {
    this.logger.debug("Processing cache update", { request, partialResponse });
    const { cacheKey } = request;
    const cachedData = this.storage.get<
      ExtractResponseType<Request>,
      ExtractErrorType<Request>,
      ExtractAdapterType<Request>
    >(cacheKey);

    const processedResponse = typeof partialResponse === "function" ? partialResponse(cachedData) : partialResponse;
    if (cachedData) {
      this.set(request, { ...cachedData, ...processedResponse });
    }
  };

  /**
   * Get particular record from storage by cacheKey. It will trigger lazyStorage to emit lazy load event for reading it's data.
   * @param cacheKey
   * @returns
   */
  get = <Response, Error, Adapter extends AdapterInstance>(
    cacheKey: string,
  ): CacheValueType<Response, Error, Adapter> | undefined => {
    this.getLazyResource<Response, Error, Adapter>(cacheKey);
    const cachedData = this.storage.get<Response, Error, Adapter>(cacheKey);
    return cachedData;
  };

  /**
   * Get sync storage keys, lazyStorage keys will not be included
   * @returns
   */
  keys = (): string[] => {
    const values = this.storage.keys();

    return Array.from(values);
  };

  /**
   * Delete record from storages and trigger invalidation event
   * @param cacheKey
   */
  delete = (cacheKey: string): void => {
    this.logger.debug("Deleting cache element", { cacheKey });
    this.storage.delete(cacheKey);
    this.options?.onDelete?.(cacheKey);
    this.lazyStorage?.delete(cacheKey);
  };

  /**
   * Invalidate cache by cacheKey or partial matching with RegExp
   * @param cacheKey
   */
  invalidate = async (cacheKey: string | RegExp) => {
    this.logger.debug("Revalidating cache element", { cacheKey });
    const keys = await this.getLazyKeys();

    if (typeof cacheKey === "string") {
      this.events.emitInvalidation(cacheKey);
      this.delete(cacheKey);
    } else {
      // eslint-disable-next-line no-restricted-syntax
      for (const entityKey of keys) {
        if (cacheKey.test(entityKey)) {
          this.events.emitInvalidation(entityKey);
          this.delete(entityKey);
        }
      }
    }
  };

  /**
   * Used to receive data from lazy storage
   * @param cacheKey
   */
  getLazyResource = async <Response, Error, Adapter extends AdapterInstance>(
    cacheKey: string,
  ): Promise<CacheValueType<Response, Error, Adapter> | undefined> => {
    const data = await this.lazyStorage?.get<Response, Error, Adapter>(cacheKey);
    const syncData = this.storage.get<Response, Error, Adapter>(cacheKey);

    // No data in lazy storage
    const hasLazyData = this.lazyStorage && data;
    if (hasLazyData) {
      const now = +new Date();
      const isNewestData = syncData ? syncData.timestamp < data.timestamp : true;
      const isStaleData = data.cacheTime <= now - data.timestamp;
      const isValidLazyData = data.clearKey === this.clearKey;

      if (!isValidLazyData) {
        this.lazyStorage.delete(cacheKey);
      }
      if (isNewestData && !isStaleData && isValidLazyData) {
        this.storage.set<Response, Error, Adapter>(cacheKey, data);
        this.events.emitCacheData<Response, Error, Adapter>(cacheKey, data);
        return data;
      }
    }

    const isValidData = syncData?.clearKey === this.clearKey;
    if (syncData && !isValidData) {
      this.delete(cacheKey);
    }
    return syncData;
  };

  /**
   * Used to receive keys from sync storage and lazy storage
   * @param cacheKey
   */
  getLazyKeys = async () => {
    const keys = await this.lazyStorage?.keys();
    const asyncKeys = Array.from(keys || []);
    const syncKeys = Array.from(this.storage.keys());

    return [...new Set([...asyncKeys, ...syncKeys])];
  };

  /**
   * Schedule garbage collection for given key
   * @param cacheKey
   * @returns
   */
  scheduleGarbageCollector = async (cacheKey: string) => {
    // We need to make sure that all of the values will be removed, also that we have the proper data
    const cacheData = await this.getLazyResource(cacheKey);

    // Clear running garbage collectors for given key
    clearTimeout(this.garbageCollectors.get(cacheKey));

    // Garbage collect
    if (cacheData) {
      const timeLeft = cacheData.garbageCollection + cacheData.timestamp - +new Date();
      if (cacheData.garbageCollection !== null && JSON.stringify(cacheData.garbageCollection) === "null") {
        this.logger.info("Cache value is Infinite", { cacheKey });
      } else if (timeLeft >= 0) {
        this.garbageCollectors.set(
          cacheKey,
          setTimeout(() => {
            if (this.client.appManager.isOnline) {
              this.logger.info("Garbage collecting cache element", { cacheKey });
              this.delete(cacheKey);
            }
          }, timeLeft),
        );
      } else if (this.client.appManager.isOnline) {
        this.logger.info("Garbage collecting cache element", { cacheKey });
        this.delete(cacheKey);
      }
    }
  };

  /**
   * Clear cache storages
   */
  clear = async (): Promise<void> => {
    this.storage.clear();
  };
}
