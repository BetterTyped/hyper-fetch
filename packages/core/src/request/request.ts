import {
  RequestSendOptionsType,
  ParamsType,
  getSimpleKey,
  getRequestKey,
  RequestSendType,
  PayloadType,
  RequestJSON,
  RequestOptionsType,
  ExtractRouteParams,
  sendRequest,
  RequestCurrentType,
  PayloadMapperType,
  RequestInstance,
  RequestDataMockTypes,
  GeneratorReturnMockTypes,
} from "request";
import { Client } from "client";
import { getUniqueRequestId } from "utils";
import {
  BaseAdapterType,
  ExtractAdapterMethodType,
  ExtractAdapterOptions,
  QueryParamsType,
  ResponseReturnType,
  AdapterInstance,
} from "adapter";
import { NegativeTypes } from "types";
import { DateInterval } from "constants/time.constants";

/**
 * Fetch request it is designed to prepare the necessary setup to execute the request to the server.
 * We can set up basic options for example endpoint, method, headers and advanced settings like cache, invalidation patterns, concurrency, retries and much, much more.
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
  QueryParams,
  GlobalError, // Global Error Type
  LocalError, // Additional Error for specific endpoint
  Endpoint extends string,
  AdapterType extends AdapterInstance = BaseAdapterType,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
> {
  endpoint: Endpoint;
  headers?: HeadersInit;
  auth: boolean;
  method: ExtractAdapterMethodType<AdapterType>;
  params: ExtractRouteParams<Endpoint> | NegativeTypes;
  data: PayloadType<Payload>;
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
  dataMapper?: PayloadMapperType<Payload>;
  mock?: Generator<
    GeneratorReturnMockTypes<
      Response,
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
        HasQuery
      >
    >,
    GeneratorReturnMockTypes<
      Response,
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
        HasQuery
      >
    >,
    GeneratorReturnMockTypes<
      Response,
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
        HasQuery
      >
    >
  >;
  mockData?: RequestDataMockTypes<
    Response,
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
      HasQuery
    >
  >;
  requestMapper?: <R extends RequestInstance>(requestId: string, request: RequestInstance) => R;
  responseMapper?: (
    response: ResponseReturnType<any, any, any>,
  ) => ResponseReturnType<Response, GlobalError | LocalError, AdapterType>;

  private updatedAbortKey: boolean;
  private updatedCacheKey: boolean;
  private updatedQueueKey: boolean;
  private updatedEffectKey: boolean;

  constructor(
    readonly client: Client<GlobalError, AdapterType>,
    readonly requestOptions: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      ExtractAdapterMethodType<AdapterType>
    >,
    readonly requestJSON?:
      | RequestCurrentType<
          Payload,
          QueryParams,
          Endpoint,
          ExtractAdapterOptions<AdapterType>,
          ExtractAdapterMethodType<AdapterType>
        >
      | undefined,
  ) {
    const {
      endpoint,
      headers,
      auth = true,
      method = client.defaultMethod,
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

    this.endpoint = requestJSON?.endpoint ?? endpoint;
    this.headers = requestJSON?.headers ?? headers;
    this.auth = requestJSON?.auth ?? auth;
    this.method = method;
    this.params = requestJSON?.params;
    this.data = requestJSON?.data;
    this.queryParams = requestJSON?.queryParams;
    this.options = requestJSON?.options ?? options;
    this.cancelable = requestJSON?.cancelable ?? cancelable;
    this.retry = requestJSON?.retry ?? retry;
    this.retryTime = requestJSON?.retryTime ?? retryTime;
    this.garbageCollection = requestJSON?.garbageCollection ?? garbageCollection;
    this.cache = requestJSON?.cache ?? cache;
    this.cacheTime = requestJSON?.cacheTime ?? cacheTime;
    this.queued = requestJSON?.queued ?? queued;
    this.offline = requestJSON?.offline ?? offline;
    this.abortKey = requestJSON?.abortKey ?? abortKey ?? getSimpleKey(this);
    this.cacheKey = requestJSON?.cacheKey ?? cacheKey ?? getRequestKey(this);
    this.queueKey = requestJSON?.queueKey ?? queueKey ?? getSimpleKey(this);
    this.effectKey = requestJSON?.effectKey ?? effectKey ?? getSimpleKey(this);
    this.used = requestJSON?.used ?? false;
    this.deduplicate = requestJSON?.deduplicate ?? deduplicate;
    this.deduplicateTime = requestJSON?.deduplicateTime ?? deduplicateTime;

    this.updatedAbortKey = requestJSON?.updatedAbortKey ?? false;
    this.updatedCacheKey = requestJSON?.updatedCacheKey ?? false;
    this.updatedQueueKey = requestJSON?.updatedQueueKey ?? false;
    this.updatedEffectKey = requestJSON?.updatedEffectKey ?? false;
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
    return this.clone<D extends null ? false : true, HasParams, HasQuery>({
      data,
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

  public setRetry = (
    retry: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      ExtractAdapterMethodType<AdapterType>
    >["retry"],
  ) => {
    return this.clone({ retry });
  };

  public setRetryTime = (
    retryTime: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      ExtractAdapterMethodType<AdapterType>
    >["retryTime"],
  ) => {
    return this.clone({ retryTime });
  };

  public setGarbageCollection = (
    garbageCollection: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      ExtractAdapterMethodType<AdapterType>
    >["garbageCollection"],
  ) => {
    return this.clone({ garbageCollection });
  };

  public setCache = (
    cache: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      ExtractAdapterMethodType<AdapterType>
    >["cache"],
  ) => {
    return this.clone({ cache });
  };

  public setCacheTime = (
    cacheTime: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      ExtractAdapterMethodType<AdapterType>
    >["cacheTime"],
  ) => {
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

  public setDataMapper = <DataMapper extends (data: Payload) => any>(dataMapper: DataMapper) => {
    const cloned = this.clone<HasData, HasParams, HasQuery>(undefined);

    cloned.dataMapper = dataMapper;

    return cloned;
  };

  public setMock = (
    mockData: RequestDataMockTypes<
      Response,
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
        HasQuery
      >
    >,
  ) => {
    const mockGenerator = function* mocked(mockedValues: RequestDataMockTypes<Response, RequestInstance>) {
      if (Array.isArray(mockData)) {
        let iteration = 0;
        // eslint-disable-next-line no-restricted-syntax
        while (true) {
          yield mockedValues[iteration];
          iteration = mockData.length === iteration + 1 ? 0 : iteration + 1;
        }
      } else {
        while (true) {
          yield mockData;
        }
      }
    };
    this.mockData = mockData;
    this.mock = mockGenerator(mockData);
    return this;
  };

  public removeMock = () => {
    this.mockData = null;
    this.mock = null;
    return this;
  };

  public setRequestMapper = (
    requestMapper: <R extends RequestInstance>(
      requestId: string,
      request: Request<
        Response,
        Payload,
        QueryParams,
        GlobalError,
        LocalError,
        Endpoint,
        AdapterType,
        HasData,
        HasParams,
        HasQuery
      >,
    ) => R,
  ) => {
    const cloned = this.clone<HasData, HasParams, HasQuery>(undefined);

    cloned.requestMapper = requestMapper;

    return cloned;
  };

  /**
   * Map
   * @param cacheKey explicitly provided key will allow us to prevent the cache collisions with non mapped requests or dynamically added mappers
   * @param onResponse our callback
   * @returns
   */
  public setResponseMapper = <NewResponse = Response, NewError = GlobalError | LocalError>(
    responseMapper?: (
      response: ResponseReturnType<Response, GlobalError | LocalError, AdapterType>,
    ) => ResponseReturnType<NewResponse, NewError, AdapterType>,
  ) => {
    const cloned = this.clone<HasData, HasParams, HasQuery>() as unknown as Request<
      Response,
      Payload,
      QueryParams,
      GlobalError,
      LocalError,
      Endpoint,
      AdapterType,
      HasData,
      HasParams,
      HasQuery
    >;

    cloned.responseMapper = responseMapper as any;

    return cloned as unknown as Request<
      NewResponse,
      Payload,
      QueryParams,
      GlobalError,
      LocalError,
      Endpoint,
      AdapterType,
      HasData,
      HasParams,
      HasQuery
    >;
  };

  private paramsMapper = (params: ParamsType | null | undefined, queryParams: QueryParams | NegativeTypes): string => {
    let endpoint = this.requestOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    if (queryParams) {
      endpoint += this.client.stringifyQueryParams(queryParams as QueryParamsType);
    }
    return endpoint;
  };

  public toJSON(): RequestJSON<
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
      HasQuery
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

  public clone<D extends true | false = HasData, P extends true | false = HasParams, Q extends true | false = HasQuery>(
    options?: RequestCurrentType<
      Payload,
      QueryParams,
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      ExtractAdapterMethodType<AdapterType>
    >,
  ): Request<Response, Payload, QueryParams, GlobalError, LocalError, Endpoint, AdapterType, D, P, Q> {
    const json = this.toJSON();
    const requestJSON: RequestCurrentType<
      Payload,
      QueryParams,
      Endpoint,
      ExtractAdapterOptions<AdapterType>,
      ExtractAdapterMethodType<AdapterType>
    > = {
      ...json,
      ...options,
      abortKey: this.updatedAbortKey ? options?.abortKey || this.abortKey : undefined,
      cacheKey: this.updatedCacheKey ? options?.cacheKey || this.cacheKey : undefined,
      queueKey: this.updatedQueueKey ? options?.queueKey || this.queueKey : undefined,
      endpoint: this.paramsMapper(options?.params || this.params, options?.queryParams || this.queryParams) as Endpoint,
      queryParams: options?.queryParams || this.queryParams,
      // Typescript circular types issue - we have to leave any here
      data: (options?.data || this.data) as any,
    };

    const cloned = new Request<Response, Payload, QueryParams, GlobalError, LocalError, Endpoint, AdapterType, D, P, Q>(
      this.client,
      this.requestOptions,
      requestJSON,
    );

    // Inherit methods
    cloned.dataMapper = this.dataMapper;
    cloned.responseMapper = this.responseMapper;
    cloned.requestMapper = this.requestMapper;

    cloned.mockData = this.mockData;
    cloned.mock = this.mock;

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
      HasQuery
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
        HasQuery
      >
    >,
  ) => {
    const { adapter, requestManager } = this.client;
    const request = this.clone(options as any) as Request<
      Response,
      Payload,
      QueryParams,
      GlobalError,
      LocalError,
      Endpoint,
      AdapterType,
      HasData,
      HasParams,
      HasQuery
    >;

    const requestId = getUniqueRequestId(this.queueKey);

    // Listen for aborting
    requestManager.addAbortController(this.abortKey, requestId);

    const response = await adapter(request, requestId);

    // Stop listening for aborting
    requestManager.removeAbortController(this.abortKey, requestId);

    if (request.responseMapper) {
      return request.responseMapper(response);
    }

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
      HasQuery
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
        HasQuery
      >
    >,
  ) => {
    const { dispatcherType, ...rest } = options || {};

    const request = this.clone(rest as any) as Request<
      Response,
      Payload,
      QueryParams,
      GlobalError,
      LocalError,
      Endpoint,
      AdapterType,
      HasData,
      HasParams,
      HasQuery
    >;
    return sendRequest<
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
        HasQuery
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
// getUser.send({ params: { id: null } });   // <----- Should fail
//
// // ================>
//
// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null });  // <------ Should fail
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
// mappedReq.send({ data: undefined });  // <---- should fail
// mappedReq.setData(null).send();
// mappedReq.setData(null).send({ data: null, queryParams: () => null });
// mappedReq.send();
// mappedReq.send({ data: new FormData() });
// mappedReq.setData({ name: "" }).send({ data: { name: "" } });
