import {
  FetchType,
  ParamsType,
  getSimpleKey,
  getCommandKey,
  FetchMethodType,
  CommandData,
  CommandDump,
  CommandConfig,
  ExtractRouteParams,
  commandSendRequest,
  CommandCurrentType,
  CommandMapperType,
} from "command";
import { Builder } from "builder";
import { getUniqueRequestId } from "utils";
import { ClientQueryParamsType } from "client";
import { HttpMethodsType, NegativeTypes } from "types";
import { DateInterval } from "constants/time.constants";
import { HttpMethodsEnum } from "constants/http.constants";

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
export class Command<
  ResponseType,
  RequestDataType,
  QueryParamsType extends ClientQueryParamsType | string,
  GlobalErrorType, // Global Error Type
  LocalErrorType, // Additional Error for specific endpoint
  EndpointType extends string,
  ClientOptions,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
  MappedData = undefined,
> {
  endpoint: EndpointType;
  headers?: HeadersInit;
  auth: boolean;
  method: HttpMethodsType;
  params: ExtractRouteParams<EndpointType> | NegativeTypes;
  data: CommandData<RequestDataType, MappedData>;
  queryParams: QueryParamsType | NegativeTypes;
  options?: ClientOptions | undefined;
  cancelable: boolean;
  retry: number;
  retryTime: number;
  garbageCollection: boolean;
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

  private updatedAbortKey: boolean;
  private updatedCacheKey: boolean;
  private updatedQueueKey: boolean;
  private updatedEffectKey: boolean;

  constructor(
    readonly builder: Builder<GlobalErrorType, ClientOptions>,
    readonly commandOptions: CommandConfig<EndpointType, ClientOptions>,
    readonly commandDump?:
      | CommandCurrentType<
          ResponseType,
          RequestDataType,
          QueryParamsType,
          GlobalErrorType | LocalErrorType,
          EndpointType,
          ClientOptions,
          MappedData
        >
      | undefined,
    readonly dataMapper?: CommandMapperType<RequestDataType, MappedData>,
  ) {
    const {
      endpoint,
      headers,
      auth = true,
      method = HttpMethodsEnum.get,
      options,
      cancelable = false,
      retry = 0,
      retryTime = 500,
      garbageCollection = true,
      cache = true,
      cacheTime = DateInterval.minute * 5,
      queued = false,
      offline = true,
      abortKey,
      cacheKey,
      queueKey,
      effectKey,
      deduplicate = false,
      deduplicateTime = 10,
    } = { ...this.builder.commandConfig?.(commandOptions), ...commandOptions };

    this.endpoint = commandDump?.endpoint ?? endpoint;
    this.headers = commandDump?.headers ?? headers;
    this.auth = commandDump?.auth ?? auth;
    this.method = method;
    this.params = commandDump?.params;
    this.data = commandDump?.data;
    this.queryParams = commandDump?.queryParams;
    this.options = commandDump?.options ?? options;
    this.cancelable = commandDump?.cancelable ?? cancelable;
    this.retry = commandDump?.retry ?? retry;
    this.retryTime = commandDump?.retryTime ?? retryTime;
    this.garbageCollection = commandDump?.garbageCollection ?? garbageCollection;
    this.cache = commandDump?.cache ?? cache;
    this.cacheTime = commandDump?.cacheTime ?? cacheTime;
    this.queued = commandDump?.queued ?? queued;
    this.offline = commandDump?.offline ?? offline;
    this.abortKey = commandDump?.abortKey ?? abortKey ?? getSimpleKey(this);
    this.cacheKey = commandDump?.cacheKey ?? cacheKey ?? getCommandKey(this);
    this.queueKey = commandDump?.queueKey ?? queueKey ?? getSimpleKey(this);
    this.effectKey = commandDump?.effectKey ?? effectKey ?? getSimpleKey(this);
    this.used = commandDump?.used ?? false;
    this.deduplicate = commandDump?.deduplicate ?? deduplicate;
    this.deduplicateTime = commandDump?.deduplicateTime ?? deduplicateTime;

    this.updatedAbortKey = commandDump?.updatedAbortKey ?? false;
    this.updatedCacheKey = commandDump?.updatedCacheKey ?? false;
    this.updatedQueueKey = commandDump?.updatedQueueKey ?? false;
    this.updatedEffectKey = commandDump?.updatedEffectKey ?? false;
  }

  public setHeaders = (headers: HeadersInit) => {
    return this.clone({ headers });
  };

  public setAuth = (auth: boolean) => {
    return this.clone({ auth });
  };

  public setParams = <P extends ExtractRouteParams<EndpointType>>(params: P) => {
    return this.clone<HasData, P extends null ? false : true, HasQuery>({ params });
  };

  public setData = <D extends RequestDataType>(data: D) => {
    const modifiedData = this.dataMapper?.(data) || data;
    return this.clone<D extends null ? false : true, HasParams, HasQuery, MappedData>({
      data: modifiedData as CommandData<RequestDataType, MappedData>,
    });
  };

  public setQueryParams = (queryParams: QueryParamsType) => {
    return this.clone<HasData, HasParams, true>({ queryParams });
  };

  public setOptions = (options: ClientOptions) => {
    return this.clone<HasData, HasParams, true>({ options });
  };

  public setCancelable = (cancelable: boolean) => {
    return this.clone({ cancelable });
  };

  public setRetry = (retry: CommandConfig<EndpointType, ClientOptions>["retry"]) => {
    return this.clone({ retry });
  };

  public setRetryTime = (retryTime: CommandConfig<EndpointType, ClientOptions>["retryTime"]) => {
    return this.clone({ retryTime });
  };

  public setGarbageCollection = (
    garbageCollection: CommandConfig<EndpointType, ClientOptions>["garbageCollection"],
  ) => {
    return this.clone({ garbageCollection });
  };

  public setCache = (cache: CommandConfig<EndpointType, ClientOptions>["cache"]) => {
    return this.clone({ cache });
  };

  public setCacheTime = (cacheTime: CommandConfig<EndpointType, ClientOptions>["cacheTime"]) => {
    return this.clone({ cacheTime });
  };

  public setQueued = (queued: boolean) => {
    return this.clone({ queued });
  };

  public setAbortKey = (abortKey: string) => {
    this.updatedAbortKey = true;
    return this.clone({ abortKey });
  };

  public setCacheKey = (cacheKey: string) => {
    this.updatedCacheKey = true;
    return this.clone({ cacheKey });
  };

  public setQueueKey = (queueKey: string) => {
    this.updatedQueueKey = true;
    return this.clone({ queueKey });
  };

  public setEffectKey = (effectKey: string) => {
    this.updatedEffectKey = true;
    return this.clone({ effectKey });
  };

  public setDeduplicate = (deduplicate: boolean) => {
    return this.clone({ deduplicate });
  };

  public setDeduplicateTime = (deduplicateTime: number) => {
    return this.clone({ deduplicateTime });
  };

  public setUsed = (used: boolean) => {
    return this.clone({ used });
  };

  public setOffline = (offline: boolean) => {
    return this.clone({ offline });
  };

  public setDataMapper = <DataMapper extends (data: RequestDataType) => any>(mapper: DataMapper) => {
    return this.clone<HasData, HasParams, HasQuery>(undefined, mapper);
  };

  private paramsMapper = (
    params: ParamsType | null | undefined,
    queryParams: QueryParamsType | NegativeTypes,
  ): string => {
    let endpoint = this.commandOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    if (queryParams) {
      endpoint += this.builder.stringifyQueryParams(queryParams);
    }
    return endpoint;
  };

  public dump(): CommandDump<
    Command<
      ResponseType,
      RequestDataType,
      QueryParamsType,
      GlobalErrorType,
      LocalErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      HasParams,
      HasQuery,
      MappedData
    >,
    ClientOptions,
    QueryParamsType
  > {
    return {
      commandOptions: this.commandOptions,
      endpoint: this.endpoint,
      headers: this.headers,
      auth: this.auth,
      method: this.method,
      params: this.params,
      data: this.data,
      queryParams: this.queryParams,
      options: this.options,
      cancelable: this.cancelable,
      retry: this.retry,
      retryTime: this.retryTime,
      garbageCollection: this.garbageCollection,
      cache: this.cache,
      cacheTime: this.cacheTime,
      queued: this.queued,
      offline: this.offline,
      abortKey: this.abortKey,
      cacheKey: this.cacheKey,
      queueKey: this.queueKey,
      effectKey: this.effectKey,
      used: this.used,
      disableResponseInterceptors: this.commandOptions.disableResponseInterceptors,
      disableRequestInterceptors: this.commandOptions.disableRequestInterceptors,
      updatedAbortKey: this.updatedAbortKey,
      updatedCacheKey: this.updatedCacheKey,
      updatedQueueKey: this.updatedQueueKey,
      updatedEffectKey: this.updatedEffectKey,
      deduplicate: this.deduplicate,
      deduplicateTime: this.deduplicateTime,
    };
  }

  public clone<
    D extends true | false = HasData,
    P extends true | false = HasParams,
    Q extends true | false = HasQuery,
    NewMappedData = MappedData,
  >(
    options?: CommandCurrentType<
      ResponseType,
      RequestDataType,
      QueryParamsType,
      GlobalErrorType | LocalErrorType,
      EndpointType,
      ClientOptions,
      NewMappedData
    >,
    mapper?: CommandMapperType<RequestDataType, NewMappedData>,
  ): Command<
    ResponseType,
    RequestDataType,
    QueryParamsType,
    GlobalErrorType,
    LocalErrorType,
    EndpointType,
    ClientOptions,
    D,
    P,
    Q,
    NewMappedData
  > {
    const dump = this.dump();
    const commandDump: CommandCurrentType<
      ResponseType,
      RequestDataType,
      QueryParamsType,
      GlobalErrorType | LocalErrorType,
      EndpointType,
      ClientOptions,
      NewMappedData
    > = {
      ...dump,
      ...options,
      abortKey: this.updatedAbortKey ? options?.abortKey || this.abortKey : undefined,
      cacheKey: this.updatedCacheKey ? options?.cacheKey || this.cacheKey : undefined,
      queueKey: this.updatedQueueKey ? options?.queueKey || this.queueKey : undefined,
      endpoint: this.paramsMapper(
        options?.params || this.params,
        options?.queryParams || this.queryParams,
      ) as EndpointType,
      queryParams: options?.queryParams || this.queryParams,
      // Typescript circular types issue - we have to leave any here
      data: (options?.data || this.data) as any,
    };

    const cloned = new Command<
      ResponseType,
      RequestDataType,
      QueryParamsType,
      GlobalErrorType,
      LocalErrorType,
      EndpointType,
      ClientOptions,
      D,
      P,
      Q,
      NewMappedData
    >(this.builder, this.commandOptions, commandDump, mapper);

    return cloned;
  }

  public abort = () => {
    const { commandManager } = this.builder;
    commandManager.abortByKey(this.abortKey);

    return this.clone();
  };

  /**
   * Method to use the command WITHOUT adding it to cache and queues. This mean it will make simple request without queue side effects.
   * @param options
   * @disableReturns
   * @returns
   * ```tsx
   * Promise<[Data | null, Error | null, HttpStatus]>
   * ```
   */
  public exec: FetchMethodType<
    Command<
      ResponseType,
      RequestDataType,
      QueryParamsType,
      GlobalErrorType,
      LocalErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      HasParams,
      HasQuery,
      MappedData
    >
  > = async (
    options?: FetchType<
      Command<
        ResponseType,
        RequestDataType,
        QueryParamsType,
        GlobalErrorType,
        LocalErrorType,
        EndpointType,
        ClientOptions,
        HasData,
        HasParams,
        HasQuery,
        MappedData
      >
    >,
  ) => {
    const { client } = this.builder;
    const command = this.clone(options as any);

    const requestId = getUniqueRequestId(this.queueKey);

    return client(command, requestId);
  };

  /**
   * Method used to perform requests with usage of cache and queues
   * @param options
   * @param requestCallback
   * @disableReturns
   * @returns
   * ```tsx
   * Promise<[Data | null, Error | null, HttpStatus]>
   * ```
   */
  public send: FetchMethodType<
    Command<
      ResponseType,
      RequestDataType,
      QueryParamsType,
      GlobalErrorType,
      LocalErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      HasParams,
      HasQuery,
      MappedData
    >
  > = async (
    options?: FetchType<
      Command<
        ResponseType,
        RequestDataType,
        QueryParamsType,
        GlobalErrorType,
        LocalErrorType,
        EndpointType,
        ClientOptions,
        HasData,
        HasParams,
        HasQuery,
        MappedData
      >
    >,
  ) => {
    const { dispatcherType, ...rest } = options || {};

    const command = this.clone(rest as any);
    return commandSendRequest<
      Command<
        ResponseType,
        RequestDataType,
        QueryParamsType,
        GlobalErrorType,
        LocalErrorType,
        EndpointType,
        ClientOptions,
        HasData,
        HasParams,
        HasQuery,
        MappedData
      >
    >(command, options);
  };
}

// /**
//  * Typescript test cases
//  */

// const builder = new Builder({
//   baseUrl: "http://localhost:3000",
// });

// const getUsers = builder.createCommand<{ id: string }[]>()({
//   method: "GET",
//   endpoint: "/users",
// });

// const getUser = builder.createCommand<{ id: string }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });

// const postUser = builder.createCommand<{ id: string }, { name: string }>()({
//   method: "POST",
//   endpoint: "/users",
// });

// const patchUser = builder.createCommand<{ id: string }, { name: string }>()({
//   method: "PATCH",
//   endpoint: "/users/:id",
// });

// const mappedReq = builder
//   .createCommand<{ id: string }, { name: string }>()({
//     method: "POST",
//     endpoint: "/users",
//   })
//   .setDataMapper((data) => {
//     const formData = new FormData();
//     formData.append("key", data.name);
//     return formData;
//   });

// // ================>

// // OK
// getUsers.send({ queryParams: "" });
// getUsers.setQueryParams("").send();
// // Fail
// getUsers.send({ data: "" });
// getUsers.send({ params: "" });
// getUsers.setQueryParams("").send({ queryParams: "" });

// // ================>

// // OK
// getUser.send({ params: { id: "" }, queryParams: "" });
// getUser.setParams({ id: "" }).send({ queryParams: "" });
// // Fail
// getUser.send({ queryParams: "" });
// getUser.send();
// getUser.setParams({ id: "" }).send({ params: { id: "" } });
// getUser.setParams(null).send();
// getUser.send({ params: { id: null } });

// // ================>

// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null });
// postUser.setData(null).send();
// postUser.send();
// postUser.setData({ name: "" }).send({ data: { name: "" } });

// // ================>

// // OK
// patchUser.send({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setData({ name: "" }).send();
// // Fail
// patchUser.send({ queryParams: "" });
// patchUser.send({ data: null });
// patchUser.setData(null).send();
// patchUser.send();
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ params: { id: "" } });

// // ================>

// // OK
// mappedReq.send({ data: { name: "" } });
// mappedReq.setData({ name: "" }).send();
// // Fail
// mappedReq.send({ queryParams: "" });
// mappedReq.send({ data: undefined });
// mappedReq.setData(null).send();
// mappedReq.setData(null).send({ data: null, queryParams: () => null });
// mappedReq.send();
// mappedReq.send({ data: new FormData() });
// mappedReq.setData({ name: "" }).send({ data: { name: "" } });
