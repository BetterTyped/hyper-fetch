/// <reference types="node" />
import EventEmitter from "events";
import { ClientResponseType } from "client";
import { BuilderInstance } from "builder";
import { CommandResponseDetails } from "managers";
import { CacheOptionsType, CacheStorageType, getCacheEvents, CacheValueType } from "cache";
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
export declare class Cache {
    private builder;
    private options?;
    emitter: EventEmitter;
    events: ReturnType<typeof getCacheEvents>;
    storage: CacheStorageType;
    constructor(builder: BuilderInstance, options?: CacheOptionsType);
    set: <Response_1, Error_1>(command: CommandInstance | CommandDump<CommandInstance>, response: ClientResponseType<Response_1, Error_1>, details: CommandResponseDetails) => void;
    get: <Response_1, Error_1>(cacheKey: string) => CacheValueType<Response_1, Error_1>;
    keys: () => string[];
    delete: (cacheKey: string) => void;
    clear: () => void;
}
