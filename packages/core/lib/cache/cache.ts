import EventEmitter from "events";

import { ClientResponseType } from "client";
import { BuilderInstance } from "builder";
import { CommandResponseDetails } from "managers";
import { CacheOptionsType, CacheStorageType, getCacheData, getCacheEvents, CacheValueType } from "cache";
import { CommandDump, CommandInstance } from "command";

/**
 * Cache class handles the data exchange with the dispatchers.
 *
 * @note
 * Keys used to save the values are created dynamically on the Command class
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

  public storage: CacheStorageType;

  constructor(private builder: BuilderInstance, private options?: CacheOptionsType) {
    this.storage = this.options?.storage || new Map<string, CacheValueType>();
    this.events = getCacheEvents(this.emitter, this.storage);
    this.options?.onInitialization?.(this);
  }

  set = <Response, Error>(
    command: CommandInstance | CommandDump<CommandInstance>,
    response: ClientResponseType<Response, Error>,
    details: CommandResponseDetails,
  ): void => {
    const { cacheKey, cache, cacheTime } = command;
    const cachedData = this.storage.get<Response, Error>(cacheKey);

    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const data = getCacheData(cachedData?.data, response);

    const newCacheData: CacheValueType = { data, details, cacheTime };

    this.events.set<Response, Error>(cacheKey, newCacheData);

    // If request should not use cache - just emit response data
    if (!cache) {
      return;
    }

    // Only success data is valid for the cache store
    if (!details.isFailed) {
      this.storage.set<Response, Error>(cacheKey, newCacheData);
    }
  };

  get = <Response, Error>(cacheKey: string): CacheValueType<Response, Error> | undefined => {
    const cachedData = this.storage.get<Response, Error>(cacheKey);
    return cachedData;
  };

  keys = (): string[] => {
    const values = this.storage.keys();

    return Array.from(values);
  };

  delete = (cacheKey: string): void => {
    this.events.revalidate(cacheKey);
    this.storage.delete(cacheKey);
  };

  clear = (): void => {
    this.storage.clear();
  };
}
