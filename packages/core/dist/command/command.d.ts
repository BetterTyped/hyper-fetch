import { FetchMethodType, CommandData, CommandDump, CommandConfig, ExtractRouteParams, CommandCurrentType, CommandQueueOptions } from "command";
import { Builder } from "builder";
import { ClientQueryParamsType } from "client";
import { HttpMethodsType, NegativeTypes } from "types";
/**
 * Fetch command it is designed to prepare the necessary setup to execute the request to the server.
 * We can setup basic options for example endpoint, method, headers and advanced settings like cache, invalidation patterns, concurrency, retries and much, much more.
 * :::info Usage
 * We should not use this class directly in the standard development flow. We can initialize it using the `createCommand` method on the **Builder** class.
 * :::
 *
 * @attention
 * The most important thing about the command is that it keeps data in the format that can be dumped. This is necessary for the persistance and different dispatcher storage types.
 * This class doesn't have any callback methods by design and communicate with dispatcher and cache by events.
 */
export declare class Command<ResponseType, PayloadType, QueryParamsType extends ClientQueryParamsType | string, GlobalErrorType, // Global Error Type
LocalErrorType, // Additional Error for specific endpoint
EndpointType extends string, ClientOptions, HasData extends true | false = false, HasParams extends true | false = false, HasQuery extends true | false = false, MappedData = undefined> {
    readonly builder: Builder<GlobalErrorType, ClientOptions>;
    readonly commandOptions: CommandConfig<EndpointType, ClientOptions>;
    readonly commandDump?: CommandCurrentType<ResponseType, PayloadType, QueryParamsType, GlobalErrorType | LocalErrorType, EndpointType, ClientOptions, MappedData> | undefined;
    readonly dataMapper?: (data: PayloadType) => MappedData;
    endpoint: EndpointType;
    headers?: HeadersInit;
    auth: boolean;
    method: HttpMethodsType;
    params: ExtractRouteParams<EndpointType> | NegativeTypes;
    data: CommandData<PayloadType, MappedData>;
    queryParams: QueryParamsType | NegativeTypes;
    options?: ClientOptions | undefined;
    cancelable: boolean;
    retry: number;
    retryTime: number;
    cache: boolean;
    cacheTime: number;
    queued: boolean;
    offline: boolean;
    abortKey: string;
    cacheKey: string;
    queueKey: string;
    effectKey: string;
    used: boolean;
    deduplicate: boolean;
    deduplicateTime: number;
    private updatedAbortKey;
    private updatedCacheKey;
    private updatedQueueKey;
    private updatedEffectKey;
    constructor(builder: Builder<GlobalErrorType, ClientOptions>, commandOptions: CommandConfig<EndpointType, ClientOptions>, commandDump?: CommandCurrentType<ResponseType, PayloadType, QueryParamsType, GlobalErrorType | LocalErrorType, EndpointType, ClientOptions, MappedData> | undefined, dataMapper?: (data: PayloadType) => MappedData);
    setHeaders: (headers: HeadersInit) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setAuth: (auth: boolean) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setParams: (params: ExtractRouteParams<EndpointType>) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, true, HasQuery, MappedData>;
    setData: (data: PayloadType) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, true, HasParams, HasQuery, MappedData>;
    setQueryParams: (queryParams: QueryParamsType) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, true, MappedData>;
    setOptions: (options: ClientOptions) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, true, MappedData>;
    setCancelable: (cancelable: boolean) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setRetry: (retry: CommandConfig<EndpointType, ClientOptions>["retry"]) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setRetryTime: (retryTime: CommandConfig<EndpointType, ClientOptions>["retryTime"]) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setCache: (cache: CommandConfig<EndpointType, ClientOptions>["cache"]) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setCacheTime: (cacheTime: CommandConfig<EndpointType, ClientOptions>["cacheTime"]) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setQueued: (queued: boolean) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setAbortKey: (abortKey: string) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setCacheKey: (cacheKey: string) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setQueueKey: (queueKey: string) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setEffectKey: (effectKey: string) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setDeduplicate: (deduplicate: boolean) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setDeduplicateTime: (deduplicateTime: number) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setUsed: (used: boolean) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setOffline: (offline: boolean) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    setDataMapper: <DataMapper>(mapper: (data: PayloadType) => DataMapper) => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, DataMapper>;
    abort: () => Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>;
    private paramsMapper;
    dump(): CommandDump<Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>, ClientOptions, QueryParamsType>;
    clone<D extends true | false = HasData, P extends true | false = HasParams, Q extends true | false = HasQuery, MapperData = MappedData>(options?: CommandCurrentType<ResponseType, PayloadType, QueryParamsType, GlobalErrorType | LocalErrorType, EndpointType, ClientOptions, MapperData>, mapper?: (data: PayloadType) => MapperData): Command<ResponseType, PayloadType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, D, P, Q, MapperData>;
    /**
     * Method to use the command WITHOUT adding it to cache and queues. This mean it will make straight requests without side effects like events.
     * @param options
     * @returns
     */
    exec: FetchMethodType<ResponseType, PayloadType, QueryParamsType, GlobalErrorType | LocalErrorType, EndpointType, HasData, HasParams, HasQuery>;
    /**
     * Method used to perform requests with usage of cache and queues
     * @param options
     */
    send: FetchMethodType<ResponseType, PayloadType, QueryParamsType, GlobalErrorType | LocalErrorType, EndpointType, HasData, HasParams, HasQuery, CommandQueueOptions>;
}
