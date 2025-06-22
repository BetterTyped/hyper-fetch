import { AdapterInstance, ResponseType } from "adapter";
import { ResponseDetailsType, LoggerMethods } from "managers";
import { ClientInstance } from "client";
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
export class Cache {
  public emitter = new EventEmitter();
  public events: ReturnType<typeof getCacheEvents>;

  public storage: CacheStorageType;
  public lazyStorage?: CacheAsyncStorageType;
  public version: string;
  public garbageCollectors = new Map<string, ReturnType<typeof setTimeout>>();
  private logger: LoggerMethods;
  private client: ClientInstance;

  constructor(public options?: CacheOptionsType) {
    const { storage = new Map<string, CacheValueType>(), lazyStorage, version = "0.0.1" } = options ?? {};

    this.emitter?.setMaxListeners(1000);
    this.events = getCacheEvents(this.emitter);

    this.storage = storage;
    this.version = version;
    this.lazyStorage = lazyStorage;
  }

  initialize = (client: ClientInstance) => {
    this.client = client;
    this.logger = client.loggerManager.initialize(client, "Cache");

    // Going back from offline should re-trigger garbage collection
    client.appManager.events.onOnline(() => {
      [...this.storage.keys()].forEach(this.scheduleGarbageCollector);
    });

    [...this.storage.keys()].forEach(this.scheduleGarbageCollector);

    return this;
  };

  /**
   * Set the cache data to the storage
   * @param request
   * @param response
   * @param isTriggeredExternally - informs whether trigger comes from an external source, such as devtools
   * @returns
   */
  set = <Request extends RequestCacheType<RequestInstance>>(
    request: Request,
    response: CacheSetState<
      ResponseType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>> &
        ResponseDetailsType
    > & { hydrated?: boolean },
    isTriggeredExternally = false,
  ): void => {
    this.logger.debug({ title: "Processing cache response", type: "system", extra: { request, response } });
    const { cacheKey, cache, staleTime, cacheTime } = request;
    const previousCacheData = this.storage.get<
      ExtractResponseType<Request>,
      ExtractErrorType<Request>,
      ExtractAdapterType<Request>
    >(cacheKey);

    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const processedResponse = typeof response === "function" ? response(previousCacheData || null) : response;
    const data = getCacheData(previousCacheData, processedResponse);

    const newCacheData: CacheValueType<any, any, ExtractAdapterType<Request>> = {
      ...data,
      staleTime,
      version: this.version,
      cacheKey,
      cacheTime,
    };

    // Only success data is valid for the cache store
    if (processedResponse.success && cache) {
      this.logger.debug({ title: "Saving response to cache storage", type: "system", extra: { request, data } });
      this.storage.set<Response, Error, ExtractAdapterType<Request>>(cacheKey, newCacheData);
      this.lazyStorage?.set<Response, Error, ExtractAdapterType<Request>>(cacheKey, newCacheData);
      this.client.triggerPlugins("onCacheItemChange", {
        cache: this,
        cacheKey,
        prevData: (previousCacheData || null) as CacheValueType<any, any, AdapterInstance>,
        newData: newCacheData as CacheValueType<any, any, AdapterInstance>,
      });

      this.scheduleGarbageCollector(cacheKey);
    } else {
      // If request should not use cache - just emit response data
      this.logger.debug({ title: "Prevented saving response to cache", type: "system", extra: { request, data } });
    }

    this.logger.debug({ title: "Emitting cache response", type: "system", extra: { request, data } });
    this.events.emitCacheData<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>({
      ...newCacheData,
      isTriggeredExternally,
      cached: request.cache,
      cacheKey,
    });
  };

  /**
   * Update the cache data with partial response data
   * @param request
   * @param partialResponse
   * @param isTriggeredExtrenally - informs whether an update was triggered due to internal logic or externally, e.g.
   * via plugin.
   * @returns
   */
  update = <Request extends RequestCacheType<RequestInstance>>(
    request: Request,
    partialResponse: CacheSetState<
      Partial<
        ResponseType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>> &
          ResponseDetailsType
      >
    >,
    isTriggeredExtrenally = false,
  ): void => {
    this.logger.debug({ title: "Processing cache update", type: "system", extra: { request, partialResponse } });
    const { cacheKey } = request;
    const cachedData = this.storage.get<
      ExtractResponseType<Request>,
      ExtractErrorType<Request>,
      ExtractAdapterType<Request>
    >(cacheKey);

    const processedResponse =
      typeof partialResponse === "function" ? partialResponse(cachedData || null) : partialResponse;
    if (cachedData) {
      this.set(request, { ...cachedData, ...processedResponse }, isTriggeredExtrenally);
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
    this.logger.debug({ title: "Deleting cache element", type: "system", extra: { cacheKey } });
    this.storage.delete(cacheKey);
    this.lazyStorage?.delete(cacheKey);

    this.client.triggerPlugins("onCacheItemDelete", {
      cache: this,
      cacheKey,
    });

    this.events.emitDelete(cacheKey);
  };

  /**
   * Invalidate cache by cacheKey or partial matching with RegExp
   * It emits invalidation event for each matching cacheKey and sets staleTime to 0 to indicate out of time cache
   * @param key - cacheKey or Request instance or RegExp for partial matching
   */
  invalidate = (cacheKeys: string | RegExp | RequestInstance | Array<string | RegExp | RequestInstance>) => {
    this.logger.debug({ title: "Revalidating cache element", type: "system", extra: { cacheKeys } });

    const onInvalidate = (key: string | RegExp | RequestInstance) => {
      const keys = Array.from(this.storage.keys());
      const handleInvalidation = (cacheKey: string) => {
        const value = this.storage.get(cacheKey);
        if (value) {
          this.storage.set(cacheKey, { ...value, staleTime: 0 });
        }

        this.client.triggerPlugins("onCacheItemInvalidate", {
          cache: this,
          cacheKey,
        });

        this.events.emitInvalidation(cacheKey);
      };

      if (key instanceof Request) {
        handleInvalidation(key.cacheKey);
      } else if (typeof key === "string") {
        handleInvalidation(key);
      } else if (keys.length) {
        keys.forEach((entityKey) => {
          if (key.test(entityKey)) {
            handleInvalidation(entityKey);
          }
        });
      }
    };

    if (Array.isArray(cacheKeys)) {
      cacheKeys.forEach(onInvalidate.bind(this));
    } else {
      onInvalidate.bind(this)(cacheKeys);
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
        this.events.emitCacheData<Response, Error, Adapter>({ ...data, cacheKey, cached: true });
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
    const keys = (await this.lazyStorage?.keys()) || [];

    return [...new Set(keys)];
  };

  /**
   * Used to receive keys from sync storage and lazy storage
   * @param cacheKey
   */
  getAllKeys = async () => {
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
      // null
      if (cacheData.cacheTime === null) {
        this.logger.debug({ title: "Cache time is null", type: "system", extra: { cacheKey } });
      }
      // Infinity
      else if (
        (cacheData.cacheTime !== null && JSON.stringify(cacheData.cacheTime) === "null") ||
        cacheData.cacheTime === Infinity
      ) {
        this.logger.debug({ title: "Cache time is Infinite", type: "system", extra: { cacheKey } });
      }
      // Run garbage collector
      else if (timeLeft >= 0) {
        this.garbageCollectors.set(
          cacheKey,
          setTimeout(() => {
            if (this.client.appManager.isOnline) {
              this.logger.info({ title: "Garbage collecting cache data", type: "system", extra: { cacheKey } });
              this.delete(cacheKey);
            }
          }, timeLeft),
        );
      }
      // Delete if value is stale and we are online
      else if (this.client.appManager.isOnline) {
        this.logger.info({ title: "Garbage collecting cache data", type: "system", extra: { cacheKey } });
        this.delete(cacheKey);
      }
    }
  };

  /**
   * Clear cache storages
   */
  clear = async (): Promise<void> => {
    this.garbageCollectors.forEach((timeout) => clearTimeout(timeout));
    this.storage.clear();
  };
}
