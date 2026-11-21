import type { AdapterInstance, ResponseType } from "adapter";
import type {
  CacheOptionsType,
  CacheAsyncStorageType,
  CacheStorageType,
  CacheValueType,
  CacheSetState,
  RequestCacheType,
} from "cache";
import { getCacheData, getCacheEvents, replaceEqualDeep } from "cache";
import type { ClientInstance } from "client";
import type { ResponseDetailsType, LoggerMethods } from "managers";
import type { RequestInstance } from "request";
import { Request, scopeKey } from "request";
import type { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";
import { EventEmitter } from "utils";

/** Timers can't wait longer than 2^31-1 ms (~24.8 days) - a longer delay overflows and fires immediately */
const MAX_TIMER_DELAY = 2_147_483_647;

/**
 * Cache class handles the data exchange with the dispatchers.
 *
 * @note
 * Keys used to save the values are created dynamically on the Request class
 *
 */
export class Cache<Adapter extends AdapterInstance> {
  public emitter = new EventEmitter();
  public events: ReturnType<typeof getCacheEvents>;

  public storage: CacheStorageType;
  public lazyStorage?: CacheAsyncStorageType = undefined;
  public version: string;
  public garbageCollectors = new Map<string, ReturnType<typeof setTimeout>>();
  private logger: LoggerMethods;
  private client: ClientInstance<{ adapter: Adapter }>;

  constructor(public options?: CacheOptionsType) {
    const { storage = new Map<string, CacheValueType>(), lazyStorage, version = "0.0.1" } = options ?? {};

    this.emitter?.setMaxListeners(1000);
    this.events = getCacheEvents(this.emitter);

    this.storage = storage;
    this.version = version;
    this.lazyStorage = lazyStorage;
  }

  /** Initialize the cache with a client reference, set up logging, and start garbage collection. */
  initialize = (client: ClientInstance<{ adapter: Adapter }>) => {
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
   * @returns
   */
  set = <Request extends RequestCacheType<RequestInstance>>(
    request: Request,
    response: CacheSetState<
      ResponseType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>> &
        ResponseDetailsType
    > & { hydrated?: boolean },
  ): void => {
    this.logger.debug({ title: "Processing cache response", type: "system", extra: { request, response } });
    const { cacheKey, cache, staleTime, cacheTime, scope } = request;
    const storageKey = scopeKey(cacheKey, scope);
    const previousCacheData = this.storage.get<
      ExtractResponseType<Request>,
      ExtractErrorType<Request>,
      ExtractAdapterType<Request>
    >(storageKey);

    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const processedResponse = typeof response === "function" ? response(previousCacheData || null) : response;
    const data = getCacheData(previousCacheData, processedResponse);

    // Keep references of the unchanged data parts, so deeply equal responses don't produce new objects
    if (request.structuralSharing !== false && previousCacheData) {
      data.data = replaceEqualDeep(previousCacheData.data, data.data);
    }

    const newCacheData: CacheValueType<any, any, ExtractAdapterType<Request>> = {
      ...data,
      scope,
      staleTime,
      version: this.version,
      cacheKey,
      cacheTime,
      cached: !!request.cache,
    };

    const isServerMode = this.client.mode === "server";
    const isCachingAllowed = cache && (!isServerMode || !!(request as any).scope);

    // Only success data is valid for the cache store
    if (processedResponse.success && isCachingAllowed) {
      this.logger.debug({ title: "Saving response to cache storage", type: "system", extra: { request, data } });
      this.storage.set<Response, Error, ExtractAdapterType<Request>>(storageKey, newCacheData);
      this.runLazyStorage("set", storageKey, (lazyStorage) =>
        lazyStorage.set<Response, Error, ExtractAdapterType<Request>>(storageKey, newCacheData),
      );
      this.client.triggerPlugins("onCacheItemChange", {
        cache: this,
        cacheKey,
        prevData: (previousCacheData || null) as CacheValueType<any, any, AdapterInstance>,
        newData: newCacheData as CacheValueType<any, any, AdapterInstance>,
      });

      this.scheduleGarbageCollector(storageKey);
    } else {
      // If request should not use cache - just emit response data
      this.logger.debug({ title: "Prevented saving response to cache", type: "system", extra: { request, data } });
    }

    this.logger.debug({ title: "Emitting cache response", type: "system", extra: { request, data } });
    this.events.emitCacheData<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>(
      newCacheData,
    );
  };

  /**
   * Update the cache data with partial response data. The `responseTimestamp` is set to the time of the update, so
   * the `cacheTime` and `staleTime` count from the update. Use `set` to store the data with another timestamp.
   * @param request
   * @param partialResponse
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
  ): void => {
    this.logger.debug({ title: "Processing cache update", type: "system", extra: { request, partialResponse } });
    const { cacheKey, scope } = request;
    const storageKey = scopeKey(cacheKey, scope);
    const cachedData = this.storage.get<
      ExtractResponseType<Request>,
      ExtractErrorType<Request>,
      ExtractAdapterType<Request>
    >(storageKey);

    const processedResponse =
      typeof partialResponse === "function" ? partialResponse(cachedData || null) : partialResponse;
    if (cachedData) {
      // The updated data is as old as the update - the cache and stale times count from now. Callbacks usually
      // spread the previous value, so its timestamp is replaced as well.
      this.set(request, { ...cachedData, ...processedResponse, responseTimestamp: Date.now() });
    }
  };

  /**
   * Get particular record from storage by cacheKey. It will trigger lazyStorage to emit lazy load event for reading it's data.
   * @param cacheKey
   * @returns
   */
  get = <Response, Error>(cacheKey: string): CacheValueType<Response, Error, Adapter> | undefined => {
    this.getLazyResource<Response, Error>(cacheKey);
    const cachedData = this.storage.get<Response, Error, Adapter>(cacheKey);

    // Data saved by another cache version is never returned - the lazy resource check above removes it
    if (cachedData && cachedData.version !== this.version) {
      return undefined;
    }
    return cachedData;
  };

  /**
   * Get sync storage keys, lazyStorage keys will not be included
   * @returns
   */
  keys = (): string[] => {
    const values = this.storage.keys();

    return [...values];
  };

  /**
   * Delete record from storages and trigger invalidation event
   * @param cacheKey
   */
  delete = (cacheKey: string): void => {
    this.logger.debug({ title: "Deleting cache element", type: "system", extra: { cacheKey } });
    // Removed element has nothing left to collect - pending collector would only emit the deletion once again
    clearTimeout(this.garbageCollectors.get(cacheKey));
    this.garbageCollectors.delete(cacheKey);

    // Listeners are subscribed with the cache key of the request, scoped elements are stored under another key
    const listenersKey = this.storage.get(cacheKey)?.cacheKey ?? cacheKey;
    this.storage.delete(cacheKey);
    this.runLazyStorage("delete", cacheKey, (lazyStorage) => lazyStorage.delete(cacheKey));

    this.client.triggerPlugins("onCacheItemDelete", {
      cache: this,
      cacheKey,
    });

    this.events.emitDelete(cacheKey, false, listenersKey);
  };

  /**
   * Invalidate cache by cacheKey or partial matching with RegExp
   * It emits invalidation event for each matching cacheKey and sets staleTime to 0 to indicate out of time cache
   * Called without arguments it invalidates every cached element.
   * @param cacheKeys - cacheKey or Request instance or RegExp for partial matching (defaults to all elements)
   */
  invalidate = (cacheKeys: string | RegExp | RequestInstance | (string | RegExp | RequestInstance)[] = /.*/) => {
    this.logger.debug({ title: "Revalidating cache element", type: "system", extra: { cacheKeys } });

    const onInvalidate = (key: string | RegExp | RequestInstance) => {
      const keys = [...this.storage.keys()];
      const handleInvalidation = (invalidateStorageKey: string, notifyCacheKey: string = invalidateStorageKey) => {
        const value = this.storage.get(invalidateStorageKey);
        if (value) {
          this.storage.set(invalidateStorageKey, { ...value, staleTime: 0 });
        }

        this.client.triggerPlugins("onCacheItemInvalidate", {
          cache: this,
          cacheKey: notifyCacheKey,
        });

        // Listeners are subscribed with the cache key of the request, scoped elements are stored under another key.
        // The key of the element goes as the event data, so they can tell the scopes apart.
        const listenersKey =
          notifyCacheKey === invalidateStorageKey ? (value?.cacheKey ?? notifyCacheKey) : notifyCacheKey;
        this.events.emitInvalidation(invalidateStorageKey, false, listenersKey);
      };

      if (key instanceof Request) {
        handleInvalidation(scopeKey(key.cacheKey, key.scope), key.cacheKey);
      } else if (typeof key === "string") {
        handleInvalidation(key);
      } else if (keys.length > 0) {
        // Global and sticky expressions remember the position of the last match, which would skip some of the keys
        const matcher = new RegExp(key.source, key.flags.replaceAll(/[gy]/g, ""));
        keys.forEach((entityKey) => {
          if (matcher.test(entityKey)) {
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
  getLazyResource = async <Response, Error>(
    cacheKey: string,
  ): Promise<CacheValueType<Response, Error, Adapter> | undefined> => {
    const data = await this.runLazyStorage("get", cacheKey, (lazyStorage) =>
      lazyStorage.get<Response, Error, Adapter>(cacheKey),
    );
    const syncData = this.storage.get<Response, Error, Adapter>(cacheKey);

    // No data in lazy storage
    if (data) {
      const now = Date.now();
      const isNewestData = syncData ? syncData.responseTimestamp < data.responseTimestamp : true;
      // Storages based on JSON turn Infinity into null - such data never gets stale
      const isStaleData = data.staleTime === null ? false : data.staleTime <= now - data.responseTimestamp;
      const isValidLazyData = data.version === this.version;
      // Collectors do not survive the application restart, so outdated data has to be removed once we meet it
      const isExpiredData = this.client.appManager.isOnline && this.getTimeLeft(data, now) < 0;

      if (!isValidLazyData || isExpiredData) {
        this.runLazyStorage("delete", cacheKey, (lazyStorage) => lazyStorage.delete(cacheKey));
      }
      if (isNewestData && !isStaleData && isValidLazyData && !isExpiredData) {
        this.storage.set<Response, Error, Adapter>(cacheKey, data);
        // Data loaded to the sync storage is collected the same way as the data set directly
        this.scheduleGarbageCollector(cacheKey);
        // Data events are emitted with the request cacheKey, which differs from the storage key for scoped requests
        this.events.emitCacheData<Response, Error, Adapter>({
          ...data,
          cacheKey: typeof data.cacheKey === "string" ? data.cacheKey : cacheKey,
          cached: true,
        });
        return data;
      }
    }

    const isValidData = syncData?.version === this.version;
    if (syncData && !isValidData) {
      this.delete(cacheKey);
      return undefined;
    }
    return syncData;
  };

  /**
   * Used to receive keys from lazy storage only
   */
  getLazyKeys = async () => {
    const keys = (await this.lazyStorage?.keys()) || [];

    return [...new Set(keys)];
  };

  /**
   * Used to receive deduplicated keys from both sync storage and lazy storage
   */
  getAllKeys = async () => {
    const keys = await this.lazyStorage?.keys();
    const asyncKeys = [...(keys || [])];
    const syncKeys = [...this.storage.keys()];

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
    this.garbageCollectors.delete(cacheKey);

    // Garbage collect
    if (cacheData) {
      const timeLeft = this.getTimeLeft(cacheData, Date.now());
      // null
      if (cacheData.cacheTime === null) {
        this.logger.debug({ title: "Cache time is null", type: "system", extra: { cacheKey } });
      }
      // Infinity
      else if (timeLeft === Infinity) {
        this.logger.debug({ title: "Cache time is Infinite", type: "system", extra: { cacheKey } });
      }
      // Run garbage collector
      else if (timeLeft >= 0) {
        // Longer delays are split into parts, as timers fire immediately when the delay is too big for them
        const delay = Math.min(timeLeft, MAX_TIMER_DELAY);
        this.garbageCollectors.set(
          cacheKey,
          setTimeout(() => {
            this.garbageCollectors.delete(cacheKey);
            if (delay < timeLeft) {
              this.scheduleGarbageCollector(cacheKey);
            } else if (this.client.appManager.isOnline) {
              this.logger.info({ title: "Garbage collecting cache data", type: "system", extra: { cacheKey } });
              this.delete(cacheKey);
            }
          }, delay),
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
   * Time left to the garbage collection of the cache element. Returns Infinity for elements stored forever
   * and a negative value for outdated elements or elements without valid times.
   */
  private getTimeLeft = (cacheData: Pick<CacheValueType, "cacheTime" | "responseTimestamp">, now: number): number => {
    const { cacheTime, responseTimestamp } = cacheData;
    // Storages based on JSON turn Infinity into null
    if (cacheTime === null || (typeof cacheTime === "number" && !Number.isFinite(cacheTime))) {
      return Infinity;
    }
    const timeLeft = cacheTime + responseTimestamp - now;
    // Missing times can't be scheduled, such element is treated as outdated
    return Number.isNaN(timeLeft) ? -1 : timeLeft;
  };

  /**
   * Lazy storage is an external resource (IndexedDB, AsyncStorage etc.) - its failures are logged, they must not
   * break the cache flow nor end up as unhandled promise rejections.
   */
  private runLazyStorage = async <Result>(
    action: "get" | "set" | "delete" | "clear",
    cacheKey: string,
    callback: (lazyStorage: CacheAsyncStorageType) => Promise<Result>,
  ): Promise<Result | undefined> => {
    if (!this.lazyStorage) {
      return undefined;
    }
    try {
      return await callback(this.lazyStorage);
    } catch (error) {
      this.logger?.error({
        title: `Lazy storage "${action}" failed`,
        type: "system",
        extra: { cacheKey, error },
      });
      return undefined;
    }
  };

  /**
   * Clear cache storages - the memory and the lazy one. Data left in the lazy storage would be loaded back
   * by the next read, for example for the next user after a logout.
   */
  clear = async (): Promise<void> => {
    this.garbageCollectors.forEach((timeout) => clearTimeout(timeout));
    this.garbageCollectors.clear();
    this.storage.clear();

    await this.runLazyStorage("clear", "*", async (lazyStorage) => {
      const keys = [...(await lazyStorage.keys())];
      // One element that can't be removed must not keep the others in the storage
      const results = await Promise.allSettled(keys.map((key) => lazyStorage.delete(key)));
      // The type guard keeps older compilers (docs generation) narrowing the result to the rejected one
      const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
      if (failed) {
        throw failed.reason;
      }
    });
  };
}
