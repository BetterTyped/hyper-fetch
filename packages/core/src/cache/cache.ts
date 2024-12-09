import { AdapterInstance, ResponseType } from "adapter";
import { ClientInstance } from "client";
import { ResponseDetailsType, LoggerType } from "managers";
import {
  CacheOptionsType,
  CacheAsyncStorageType,
  CacheStorageType,
  getCacheData,
  getCacheEvents,
  CacheValueType,
  CacheSetState,
  RequestCacheType,
} from "cache";
import { Request, RequestInstance } from "request";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";
import { EventEmitter } from "utils";

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
  public version: string;
  public garbageCollectors = new Map<string, ReturnType<typeof setTimeout>>();
  private logger: LoggerType;

  constructor(
    public client: C,
    public options?: CacheOptionsType,
  ) {
    this.emitter?.setMaxListeners(20000);
    this.storage = this.options?.storage || (new Map<string, CacheValueType>() as typeof this.storage);
    this.events = getCacheEvents(this.emitter);
    this.options?.onInitialization?.(this);

    this.version = this.options?.version || "0.0.1";
    this.lazyStorage = this.options?.lazyStorage;
    this.logger = this.client.loggerManager.init("Cache");

    [...this.storage.keys()].forEach(this.scheduleGarbageCollector);

    // Going back from offline should re-trigger garbage collection
    this.client.appManager.events.onOnline(() => {
      [...this.storage.keys()].forEach(this.scheduleGarbageCollector);
    });
  }

  /**
   * Set the cache data to the storage
   * @param request
   * @param response
   * @returns
   */
  set = <Request extends RequestInstance>(
    request: RequestCacheType<Request>,
    response: CacheSetState<
      ResponseType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>> &
        ResponseDetailsType
    > & { hydrated?: boolean },
  ): void => {
    this.logger.debug("Processing cache response", { request, response });
    const { cacheKey, cache, staleTime, cacheTime } = request;
    const cachedData = this.storage.get<
      ExtractResponseType<Request>,
      ExtractErrorType<Request>,
      ExtractAdapterType<Request>
    >(cacheKey);

    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const processedResponse = typeof response === "function" ? response(cachedData || null) : response;
    const data = getCacheData(cachedData, processedResponse);

    const newCacheData: CacheValueType<any, any, ExtractAdapterType<Request>> = {
      ...data,
      staleTime,
      version: this.version,
      cacheKey,
      cacheTime,
    };

    // Only success data is valid for the cache store
    if (processedResponse.success && cache) {
      this.logger.debug("Saving response to cache storage", { request, data });
      this.storage.set<Response, Error, ExtractAdapterType<Request>>(cacheKey, newCacheData);
      this.lazyStorage?.set<Response, Error, ExtractAdapterType<Request>>(cacheKey, newCacheData);
      this.options?.onChange?.(cacheKey, newCacheData);
      this.scheduleGarbageCollector(cacheKey);
    } else {
      // If request should not use cache - just emit response data
      this.logger.debug("Prevented saving response to cache", { request, data });
    }

    this.logger.debug("Emitting cache response", { request, data });
    this.events.emitCacheData<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>({
      ...newCacheData,
      cacheKey,
    });
  };

  /**
   * Update the cache data with partial response data
   * @param request
   * @param partialResponse
   * @returns
   */
  update = <Request extends RequestInstance>(
    request: RequestCacheType<Request>,
    partialResponse: CacheSetState<
      Partial<
        ResponseType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>> &
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

    const processedResponse =
      typeof partialResponse === "function" ? partialResponse(cachedData || null) : partialResponse;
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
    this.events.emitDelete(cacheKey);
  };

  /**
   * Invalidate cache by cacheKey or partial matching with RegExp
   * It emits invalidation event for each matching cacheKey and sets staleTime to 0 to indicate out of time cache
   * @param key - cacheKey or Request instance or RegExp for partial matching
   */
  invalidate = async (invalidateKeys: string | RegExp | RequestInstance | Array<string | RegExp | RequestInstance>) => {
    this.logger.debug("Revalidating cache element", { invalidateKeys });
    const keys = await this.getLazyKeys();

    const invalidate = (key: string | RegExp | RequestInstance) => {
      const handleInvalidation = (cacheKey: string) => {
        const value = this.storage.get(cacheKey);
        if (value) {
          this.storage.set(cacheKey, { ...value, staleTime: 0 });
        }
        this.events.emitInvalidation(cacheKey);
      };

      if (key instanceof Request) {
        handleInvalidation(key.cacheKey);
      } else if (typeof key === "string") {
        handleInvalidation(key);
      } else if (keys?.length) {
        keys.forEach((entityKey) => {
          if (key.test(entityKey)) {
            handleInvalidation(entityKey);
          }
        });
      }
    };

    if (Array.isArray(invalidateKeys)) {
      invalidateKeys.forEach(invalidate);
    } else {
      invalidate(invalidateKeys);
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
      const isNewestData = syncData ? syncData.responseTimestamp < data.responseTimestamp : true;
      const isStaleData = data.staleTime <= now - data.responseTimestamp;
      const isValidLazyData = data.version === this.version;

      if (!isValidLazyData) {
        this.lazyStorage?.delete(cacheKey);
      }
      if (isNewestData && !isStaleData && isValidLazyData) {
        this.storage.set<Response, Error, Adapter>(cacheKey, data);
        this.events.emitCacheData<Response, Error, Adapter>({ ...data, cacheKey });
        return data;
      }
    }

    const isValidData = syncData?.version === this.version;
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
  scheduleGarbageCollector = (cacheKey: string) => {
    // We need to make sure that all of the values will be removed, also that we have the proper data
    const cacheData = this.storage.get(cacheKey);

    // Clear running garbage collectors for given key
    clearTimeout(this.garbageCollectors.get(cacheKey));

    // Garbage collect
    if (cacheData) {
      const timeLeft = cacheData.cacheTime + cacheData.responseTimestamp - +new Date();
      if (cacheData.cacheTime !== null && JSON.stringify(cacheData.cacheTime) === "null") {
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
