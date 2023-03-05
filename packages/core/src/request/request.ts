import {
  RequestSendOptionsType,
  ParamsType,
  getSimpleKey,
  getRequestKey,
  RequestSendType,
  PayloadType,
  RequestDump,
  RequestOptionsType,
  ExtractRouteParams,
  requestSendRequest,
  RequestCurrentType,
  PayloadMapperType,
} from "request";
import { Client } from "client";
import { getUniqueRequestId } from "utils";
import {BaseAdapterType, ExtractAdapterMethodType, ExtractAdapterOptions, QueryParamsType} from "adapter";
import { NegativeTypes } from "types";
import { DateInterval } from "constants/time.constants";

/**
 * Fetch request it is designed to prepare the necessary setup to execute the request to the server.
 * We can setup basic options for example endpoint, method, headers and advanced settings like cache, invalidation patterns, concurrency, retries and much, much more.
 * :::info Usage
 * We should not use this class directly in the standard development flow. We can initialize it using the `createRequest` method on the **Client** class.
 * :::
 *
 * @attention
 * The most important thing about the request is that it keeps data in the format that can be dumped. This is necessary for the persistence and different dispatcher storage types.
 * This class doesn't have any callback methods by design and communicate with dispatcher and cache by events.
 */
export class Request<
  Response,
  Payload,
  QueryParams extends QueryParamsType | string,
  GlobalError, // Global Error Type
  LocalError, // Additional Error for specific endpoint
  Endpoint extends string,
  AdapterType extends BaseAdapterType = BaseAdapterType,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
  MappedData = undefined,
> {
  endpoint: Endpoint;
  headers?: HeadersInit;
  auth: boolean;
  method: ExtractAdapterMethodType<AdapterType>;
  params: ExtractRouteParams<Endpoint> | NegativeTypes;
  data: PayloadType<Payload, MappedData>;
  queryParams: QueryParams | NegativeTypes;
  options?: ExtractAdapterOptions<AdapterType> | undefined;
  cancelable: boolean;
  retry: number;
  retryTime: number;
  garbageCollection: number;
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
    readonly client: Client<GlobalError, AdapterType>,
    readonly requestOptions: RequestOptionsType<Endpoint, ExtractAdapterOptions<AdapterType>, ExtractAdapterMethodType<AdapterType>>,
    readonly requestDump?:
      | RequestCurrentType<
          Response,
          Payload,
          QueryParams,
          GlobalError | LocalError,
          Endpoint,
          ExtractAdapterOptions<AdapterType>,
          MappedData,
          ExtractAdapterMethodType<AdapterType>
        >
      | undefined,
    readonly dataMapper?: PayloadMapperType<Payload, MappedData>,
  ) {
    const {
      endpoint,
      headers,
      auth = true,
      method,
      options,
      cancelable = false,
      retry = 0,
      retryTime = 500,
      garbageCollection = DateInterval.minute * 5,
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
    } = { ...this.client.requestDefaultOptions?.(requestOptions), ...requestOptions };

    this.endpoint = requestDump?.endpoint ?? endpoint;
    this.headers = requestDump?.headers ?? headers;
    this.auth = requestDump?.auth ?? auth;
    this.method = method;
    this.params = requestDump?.params;
    this.data = requestDump?.data;
    this.queryParams = requestDump?.queryParams;
    this.options = requestDump?.options ?? options;
    this.cancelable = requestDump?.cancelable ?? cancelable;
    this.retry = requestDump?.retry ?? retry;
    this.retryTime = requestDump?.retryTime ?? retryTime;
    this.garbageCollection = requestDump?.garbageCollection ?? garbageCollection;
    this.cache = requestDump?.cache ?? cache;
    this.cacheTime = requestDump?.cacheTime ?? cacheTime;
    this.queued = requestDump?.queued ?? queued;
    this.offline = requestDump?.offline ?? offline;
    this.abortKey = requestDump?.abortKey ?? abortKey ?? getSimpleKey(this);
    this.cacheKey = requestDump?.cacheKey ?? cacheKey ?? getRequestKey(this);
    this.queueKey = requestDump?.queueKey ?? queueKey ?? getSimpleKey(this);
    this.effectKey = requestDump?.effectKey ?? effectKey ?? getSimpleKey(this);
    this.used = requestDump?.used ?? false;
    this.deduplicate = requestDump?.deduplicate ?? deduplicate;
    this.deduplicateTime = requestDump?.deduplicateTime ?? deduplicateTime;

    this.updatedAbortKey = requestDump?.updatedAbortKey ?? false;
    this.updatedCacheKey = requestDump?.updatedCacheKey ?? false;
    this.updatedQueueKey = requestDump?.updatedQueueKey ?? false;
    this.updatedEffectKey = requestDump?.updatedEffectKey ?? false;
  }

  public setHeaders = (headers: HeadersInit) => {
    return this.clone({ headers });
  };

  public setAuth = (auth: boolean) => {
    return this.clone({ auth });
  };

  public setParams = <P extends ExtractRouteParams<Endpoint>>(params: P) => {
    return this.clone<HasData, P extends null ? false : true, HasQuery>({ params });
  };

  public setData = <D extends Payload>(data: D) => {
    const modifiedData = this.dataMapper?.(data) || data;
    return this.clone<D extends null ? false : true, HasParams, HasQuery, MappedData>({
      data: modifiedData as PayloadType<Payload, MappedData>,
    });
  };

  public setQueryParams = (queryParams: QueryParams) => {
    return this.clone<HasData, HasParams, true>({ queryParams });
  };

  public setOptions = (options: ExtractAdapterOptions<AdapterType>) => {
    return this.clone<HasData, HasParams, true>({ options });
  };

  public setCancelable = (cancelable: boolean) => {
    return this.clone({ cancelable });
  };

  public setRetry = (retry: RequestOptionsType<Endpoint, ExtractAdapterOptions<AdapterType>, ExtractAdapterMethodType<AdapterType>>["retry"]) => {
    return this.clone({ retry });
  };

  public setRetryTime = (retryTime: RequestOptionsType<Endpoint, ExtractAdapterOptions<AdapterType>, ExtractAdapterMethodType<AdapterType>>["retryTime"]) => {
    return this.clone({ retryTime });
  };

  public setGarbageCollection = (
    garbageCollection: RequestOptionsType<Endpoint, ExtractAdapterOptions<AdapterType>,  ExtractAdapterMethodType<AdapterType>>["garbageCollection"],
  ) => {
    return this.clone({ garbageCollection });
  };

  public setCache = (cache: RequestOptionsType<Endpoint, ExtractAdapterOptions<AdapterType>,  ExtractAdapterMethodType<AdapterType>>["cache"]) => {
    return this.clone({ cache });
  };

  public setCacheTime = (cacheTime: RequestOptionsType<Endpoint, ExtractAdapterOptions<AdapterType>,  ExtractAdapterMethodType<AdapterType>>["cacheTime"]) => {
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

  public setDataMapper = <DataMapper extends (data: Payload) => any>(mapper: DataMapper) => {
    return this.clone<HasData, HasParams, HasQuery>(undefined, mapper);
  };

  private paramsMapper = (params: ParamsType | null | undefined, queryParams: QueryParams | NegativeTypes): string => {
    let endpoint = this.requestOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    if (queryParams) {
      endpoint += this.client.stringifyQueryParams(queryParams);
    }
    return endpoint;
  };

  public dump(): RequestDump<
    Request<
      Response,
      Payload,
      QueryParams,
      GlobalError,
      LocalError,
      Endpoint,
      AdapterType,
      HasData,
      HasParams,
      HasQuery,
      MappedData
    >,
    ExtractAdapterOptions<AdapterType>,
    QueryParams
  > {
    return {
      requestOptions: this.requestOptions,
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
      disableResponseInterceptors: this.requestOptions.disableResponseInterceptors,
      disableRequestInterceptors: this.requestOptions.disableRequestInterceptors,
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
    options?: RequestCurrentType<
      Response,
      Payload,
      QueryParams,
      GlobalError | LocalError,
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      NewMappedData,
      ExtractAdapterMethodType<AdapterType>
    >,
    mapper?: PayloadMapperType<Payload, NewMappedData>,
  ): Request<Response, Payload, QueryParams, GlobalError, LocalError, Endpoint, AdapterType, D, P, Q, NewMappedData> {
    const dump = this.dump();
    const requestDump: RequestCurrentType<
      Response,
      Payload,
      QueryParams,
      GlobalError | LocalError,
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      NewMappedData,
      ExtractAdapterMethodType<AdapterType>
    > = {
      ...dump,
      ...options,
      abortKey: this.updatedAbortKey ? options?.abortKey || this.abortKey : undefined,
      cacheKey: this.updatedCacheKey ? options?.cacheKey || this.cacheKey : undefined,
      queueKey: this.updatedQueueKey ? options?.queueKey || this.queueKey : undefined,
      endpoint: this.paramsMapper(options?.params || this.params, options?.queryParams || this.queryParams) as Endpoint,
      queryParams: options?.queryParams || this.queryParams,
      // Typescript circular types issue - we have to leave any here
      data: (options?.data || this.data) as any,
    };

    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    const cloned = new Request<
      Response,
      Payload,
      QueryParams,
      GlobalError,
      LocalError,
      Endpoint,
      AdapterType,
      D,
      P,
      Q,
      NewMappedData
    >(this.client, this.requestOptions, requestDump, mapperFn);

    return cloned;
  }

  public abort = () => {
    const { requestManager } = this.client;
    requestManager.abortByKey(this.abortKey);

    return this.clone();
  };

  /**
   * Method to use the request WITHOUT adding it to cache and queues. This mean it will make simple request without queue side effects.
   * @param options
   * @disableReturns
   * @returns
   * ```tsx
   * Promise<[Data | null, Error | null, HttpStatus]>
   * ```
   */
  public exec: RequestSendType<
    Request<
      Response,
      Payload,
      QueryParams,
      GlobalError,
      LocalError,
      Endpoint,
      AdapterType,
      HasData,
      HasParams,
      HasQuery,
      MappedData
    >
  > = async (
    options?: RequestSendOptionsType<
      Request<
        Response,
        Payload,
        QueryParams,
        GlobalError,
        LocalError,
        Endpoint,
        AdapterType,
        HasData,
        HasParams,
        HasQuery,
        MappedData
      >
    >,
  ) => {
    const { adapter, requestManager } = this.client;
    const request = this.clone(options as any);

    const requestId = getUniqueRequestId(this.queueKey);

    // Listen for aborting
    requestManager.addAbortController(this.abortKey, requestId);

    const response = await adapter(request, requestId);

    // Stop listening for aborting
    requestManager.removeAbortController(this.abortKey, requestId);

    return response;
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
  public send: RequestSendType<
    Request<
      Response,
      Payload,
      QueryParams,
      GlobalError,
      LocalError,
      Endpoint,
      AdapterType,
      HasData,
      HasParams,
      HasQuery,
      MappedData
    >
  > = async (
    options?: RequestSendOptionsType<
      Request<
        Response,
        Payload,
        QueryParams,
        GlobalError,
        LocalError,
        Endpoint,
        AdapterType,
        HasData,
        HasParams,
        HasQuery,
        MappedData
      >
    >,
  ) => {
    const { dispatcherType, ...rest } = options || {};

    const request = this.clone(rest as any);
    return requestSendRequest<
      Request<
        Response,
        Payload,
        QueryParams,
        GlobalError,
        LocalError,
        Endpoint,
        AdapterType,
        HasData,
        HasParams,
        HasQuery,
        MappedData
      >
    >(request, options);
  };
}

// /**
//  * Typescript test cases
//  */
//
// const client = new Client({
//   url: "http://localhost:3000",
// });
//
// const getUsers = client.createRequest<{ id: string }[]>()({
//   method: "GET",
//   endpoint: "/users",
// });
//
// const getUser = client.createRequest<{ id: string }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });
//
// const postUser = client.createRequest<{ id: string }, { name: string }>()({
//   method: "POST",
//   endpoint: "/users",
// });
//
// const patchUser = client.createRequest<{ id: string }, { name: string }>()({
//   method: "PATCH",
//   endpoint: "/users/:id",
// });
//
// const mappedReq = client
//   .createRequest<{ id: string }, { name: string }>()({
//     method: "POST",
//     endpoint: "/users",
//   })
//   .setDataMapper((data) => {
//     const formData = new FormData();
//     formData.append("key", data.name);
//     return formData;
//   });
//
// // ================>
//
// // OK
// getUsers.send({ queryParams: "" });
// getUsers.setQueryParams("").send();
// // Fail
// getUsers.send({ data: "" });
// getUsers.send({ params: "" });
// getUsers.setQueryParams("").send({ queryParams: "" });
//
// // ================>
//
// // OK
// getUser.send({ params: { id: "" }, queryParams: "" });
// getUser.setParams({ id: "" }).send({ queryParams: "" });
// // Fail
// getUser.send({ queryParams: "" });
// getUser.send();
// getUser.setParams({ id: "" }).send({ params: { id: "" } });
// getUser.setParams(null).send();
// getUser.send({ params: { id: null } });
//
// // ================>
//
// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null });
// postUser.setData(null).send();
// postUser.send();
// postUser.setData({ name: "" }).send({ data: { name: "" } });
//
// // ================>
//
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
//
// // ================>
//
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
