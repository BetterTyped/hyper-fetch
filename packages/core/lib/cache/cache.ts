import EventEmitter from "events";

import { ClientResponseType } from "client";
import { FetchBuilderInstance } from "builder";
import { CommandResponseDetails } from "managers";
import { CacheOptionsType, CacheStorageType, getCacheData, getCacheEvents, CacheValueType } from "cache";

/**
 * Cache class handles the data exchange with the dispatchers.
 *
 * @note
 * Keys used to save the values are created dynamically on the FetchCommand class
 *
 * @remark
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
 * <center>
 *
 * ### Response event flow
 *
 * </center>
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
 */
export class Cache {
  public emitter = new EventEmitter();
  public events: ReturnType<typeof getCacheEvents>;

  private storage: CacheStorageType;

  constructor(private builder: FetchBuilderInstance, private options?: CacheOptionsType) {
    this.storage = this.options?.storage || new Map<string, CacheValueType>();
    this.events = getCacheEvents(this.emitter, this.storage);
    this.options?.onInitialization?.(this);
  }

  set = async <Response, Error>(
    cacheKey: string,
    response: ClientResponseType<Response, Error>,
    details: CommandResponseDetails,
    useCache: boolean,
  ): Promise<void> => {
    const cachedData = await this.storage.get<Response, Error>(cacheKey);

    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const data = getCacheData(cachedData?.data, response);

    const newCacheData: CacheValueType = { data, details };

    this.events.set<Response, Error>(cacheKey, newCacheData);

    // If request should not use cache - just emit response data
    if (!useCache) {
      return;
    }

    // Only success data is valid for the cache store
    if (!details.isFailed) {
      await this.storage.set<Response, Error>(cacheKey, newCacheData);
    }
  };

  get = async <Response, Error>(cacheKey: string): Promise<CacheValueType<Response, Error> | undefined> => {
    const cachedData = await this.storage.get<Response, Error>(cacheKey);
    return cachedData;
  };

  keys = async (): Promise<string[]> => {
    const values = await this.storage.keys();

    return Array.from(values);
  };

  delete = (cacheKey: string): void => {
    this.events.revalidate(cacheKey);
    this.storage.delete(cacheKey);
  };

  clear = async (): Promise<void> => {
    await this.storage.clear();
  };
}
