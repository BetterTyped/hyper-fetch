import EventEmitter from "events";

import { LoggerMethodsType } from "managers";
import { FetchBuilder } from "builder";
import { CacheOptionsType, CacheStorageType, getCacheData, getCacheEvents } from "cache";
import { CacheStoreKeyType, CacheValueType, CacheStoreValueType, CacheSetDataType } from "./cache.types";

/**
 * Cache class should be initialized per every command instance(not modified with params or queryParams).
 * This way we create container which contains different requests to the same endpoint.
 * With this segregation of data we can keep paginated data, filtered data, without overriding it between not related fetches.
 * Key for interactions should be generated later in the hooks with getCommandKey util function, which joins the stringified values to create isolated space.
 *
 *
 * <center>
 * ```mermaid
 * graph TD
 *   C{Cache Storage}
 *   C -->|"GET_/users?page=1"| D[Data#1]
 *   C -->|"GET_/users/1"| E[Data#2]
 *   C -->|"GET_/users"| F[Data#3]
 *   C -->|unique key| G[Data...]
 * ```
 * </center>
 *
 * ### Response event flow:
 * <center>
 * ```mermaid
 * graph TD
 *     A(Cache Events)
 *     C{Cache Storage}
 *     B[Cache Listeners]
 *     C -->|unique key| D[Data#1]
 *     C -->|unique key| E[Data#2]
 *     A -->|Mutation| E
 *     E -->|Response| B
 * ```
 * </center>
 *
 *
 * @note
 * Keys used to save the values are created dynamically on the FetchCommand class
 */
export class Cache<ErrorType, ClientOptions> {
  emitter = new EventEmitter();
  events: ReturnType<typeof getCacheEvents>;
  storage: CacheStorageType;

  private logger: LoggerMethodsType;

  constructor(
    private builder: FetchBuilder<ErrorType, ClientOptions>,
    private options?: CacheOptionsType<ErrorType, ClientOptions>,
  ) {
    this.logger = this.builder.loggerManager.init("Cache");
    this.storage = this?.options?.storage || new Map<CacheStoreKeyType, CacheStoreValueType>();
    this.events = getCacheEvents(this.emitter, this.storage);

    this.options?.onInitialization(this);

    if (this.options?.initialData) {
      Object.keys(this.options.initialData).forEach(async (key) => {
        const value = await this.storage.get(key);
        if (!value && this.options?.initialData?.[key]) {
          await this.storage.set(key, this.options?.initialData[key]);
        }
      });
    }
  }

  set = async <Response>(data: CacheSetDataType<Response, ErrorType>): Promise<void> => {
    const {
      cache,
      cacheKey,
      response,
      retries = 0,
      deepEqual = true,
      isRefreshed = false,
      timestamp = +new Date(),
    } = data;
    const cachedData = await this.storage.get(cacheKey);

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
      this.logger.debug(`Only emitting payload as command cache is off`, data);

      return this.events.set<Response>(cacheKey, newData);
    }

    // We have to compare stored data with deepCompare, this will allow us to limit rerendering
    const equal = deepEqual && this.builder.deepEqual(cachedData?.response, response);

    // Global response emitter to handle command execution
    this.builder.commandManager.events.emitResponse(cacheKey, response);

    // Cache response emitter to provide optimization for libs(re-rendering)
    if (!equal) {
      this.logger.debug(`Setting new data to cache, emitting setter event...`, data);
      await this.storage.set(cacheKey, newData);
      this.events.set<Response>(cacheKey, newData);
    } else {
      this.logger.debug(`Cached data was equal to previous values, emitting update event...`, data);
      this.events.setEqualData<Response>(cacheKey, newData, isRefreshed, timestamp);
    }
  };

  get = async <Response>(cacheKey: string): Promise<CacheValueType<Response> | undefined> => {
    const cachedData = this.storage.get<Response>(cacheKey);
    return cachedData;
  };

  getResponses = async <Response>(cacheKey: string): Promise<CacheStoreValueType<Response> | undefined> => {
    const responses = await this.storage.get(cacheKey);
    return responses as CacheStoreValueType<Response>;
  };

  delete = (cacheKey: string): void => {
    this.logger.debug(`Removing data from cache, emitting revalidation event...`);
    this.events.revalidate(cacheKey);
    this.storage.delete(cacheKey);
  };

  clear = (): void => {
    this.storage.clear();
  };
}
