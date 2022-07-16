import EventEmitter from "events";

import { ClientResponseType } from "client";
import { BuilderInstance } from "builder";
import { CommandResponseDetails, LoggerType } from "managers";
import {
  CacheOptionsType,
  CacheAsyncStorageType,
  CacheStorageType,
  getCacheData,
  getCacheEvents,
  CacheValueType,
} from "cache";
import { CommandDump, CommandInstance } from "command";

/**
 * Cache class handles the data exchange with the dispatchers.
 *
 * @note
 * Keys used to save the values are created dynamically on the Command class
 *
 */
export class Cache {
  public emitter = new EventEmitter();
  public events: ReturnType<typeof getCacheEvents>;

  public storage: CacheStorageType;
  public lazyStorage?: CacheAsyncStorageType;
  public clearKey: string;
  public garbageCollectors = new Map<string, ReturnType<typeof setTimeout>>();
  private logger: LoggerType;

  constructor(public builder: BuilderInstance, public options?: CacheOptionsType) {
    this.storage = this.options?.storage || new Map<string, CacheValueType>();
    this.events = getCacheEvents(this.emitter);
    this.options?.onInitialization?.(this);

    this.clearKey = this.options?.clearKey || "";
    this.lazyStorage = this.options?.lazyStorage;
    this.logger = this.builder.loggerManager.init("Cache");

    this.getLazyKeys().then((keys) => {
      keys.forEach(this.scheduleGarbageCollector);
    });
  }

  /**
   * Set the cache data to the storage
   * @param command
   * @param response
   * @param details
   * @returns
   */
  set = <Response, Error>(
    command: CommandInstance | CommandDump<CommandInstance>,
    response: ClientResponseType<Response, Error>,
    details: CommandResponseDetails,
  ): void => {
    this.logger.debug("Processing cache response", { command, response, details });
    const { cacheKey, cache, cacheTime } = command;
    const cachedData = this.storage.get<Response, Error>(cacheKey);

    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const data = getCacheData(cachedData?.data, response);

    const newCacheData: CacheValueType = { data, details, cacheTime, clearKey: this.clearKey };

    this.events.emitCacheData<Response, Error>(cacheKey, newCacheData);
    this.logger.debug("Emitting cache response", { command, response, details });

    // If request should not use cache - just emit response data
    if (!cache) {
      return this.logger.debug("Prevented saving response to cache", { command, response, details });
    }

    // Only success data is valid for the cache store
    if (!details.isFailed) {
      this.logger.debug("Saving response to cache storage", { command, response, details });
      this.storage.set<Response, Error>(cacheKey, newCacheData);
      this.lazyStorage?.set<Response, Error>(cacheKey, newCacheData);
      this.options?.onChange?.(cacheKey, newCacheData);
      this.scheduleGarbageCollector(cacheKey);
    }
  };

  /**
   * Get particular record from storage by cacheKey. It will trigger lazyStorage to emit lazy load event for reading it's data.
   * @param cacheKey
   * @returns
   */
  get = <Response, Error>(cacheKey: string): CacheValueType<Response, Error> | undefined => {
    this.getLazyResource<Response, Error>(cacheKey);
    const cachedData = this.storage.get<Response, Error>(cacheKey);
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
   * Delete record from storages and trigger revalidation
   * @param cacheKey
   */
  delete = (cacheKey: string): void => {
    this.logger.debug("Deleting cache element", { cacheKey });
    this.storage.delete(cacheKey);
    this.options?.onDelete?.(cacheKey);
    this.lazyStorage?.delete(cacheKey);
  };

  /**
   * Revalidate cache by cacheKey or partial matching with RegExp
   * @param cacheKey
   */
  revalidate = async (cacheKey: string | RegExp) => {
    this.logger.debug("Revalidating cache element", { cacheKey });
    const keys = await this.getLazyKeys();

    if (typeof cacheKey === "string") {
      this.events.emitRevalidation(cacheKey);
      this.delete(cacheKey);
    } else {
      // eslint-disable-next-line no-restricted-syntax
      for (const entityKey of keys) {
        if (cacheKey.test(entityKey)) {
          this.events.emitRevalidation(entityKey);
          this.delete(entityKey);
        }
      }
    }
  };

  /**
   * Used to receive data from lazy storage
   * @param cacheKey
   */
  getLazyResource = async <Response, Error>(cacheKey: string): Promise<CacheValueType<Response, Error> | undefined> => {
    const data = await this.lazyStorage?.get<Response, Error>(cacheKey);
    const syncData = this.storage.get<Response, Error>(cacheKey);

    // No data in lazy storage
    if (!this.lazyStorage || !data) return syncData;

    const now = +new Date();
    const isNewestData = syncData ? syncData.details.timestamp < data.details.timestamp : true;
    const isStaleData = data.cacheTime <= now - data.details.timestamp;
    const isValidData = data.clearKey === this.clearKey;

    if (!isValidData) {
      this.lazyStorage.delete(cacheKey);
    }
    if (isNewestData && !isStaleData && isValidData) {
      this.storage.set<Response, Error>(cacheKey, data);
      this.events.emitCacheData<Response, Error>(cacheKey, data);
      return data;
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

    if (cacheData) {
      const timeLeft = cacheData.cacheTime + cacheData.details.timestamp - +new Date();
      if (timeLeft >= 0) {
        clearTimeout(this.garbageCollectors.get(cacheKey));
        this.garbageCollectors.set(
          cacheKey,
          setTimeout(() => {
            this.logger.info("Garbage collecting cache element", { cacheKey });
            this.delete(cacheKey);
          }, timeLeft),
        );
      } else {
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
