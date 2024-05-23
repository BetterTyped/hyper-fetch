import {
  RequestSendOptionsType,
  ParamsType,
  RequestSendType,
  PayloadType,
  RequestJSON,
  RequestOptionsType,
  ExtractRouteParams,
  sendRequest,
  RequestCurrentType,
  PayloadMapperType,
  RequestInstance,
  RequestMapper,
  ResponseMapper,
  RequestExtend,
} from "request";
import { Client } from "client";
import { getUniqueRequestId } from "utils";
import {
  ExtractAdapterMethodType,
  ExtractAdapterOptionsType,
  QueryParamsType,
  AdapterInstance,
  AdapterType,
} from "adapter";
import { NegativeTypes, TypeWithDefaults } from "types";
import { DateInterval } from "constants/time.constants";
import { GeneratorReturnMockTypes, RequestDataMockTypes } from "mocker";

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
  // Keys are required by design to make it easier to spot bugs in the code
  Properties extends {
    response: any;
    payload: any;
    queryParams: any;
    globalError: any; // Global Error Type
    localError: any; // Additional Error for specific endpoint
    endpoint: string;
    adapter: AdapterInstance;
    hasData?: true | false;
    hasParams?: true | false;
    hasQuery?: true | false;
  },
> {
  endpoint: TypeWithDefaults<Properties, "endpoint", string>;
  headers?: HeadersInit;
  auth: boolean;
  method: ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>;
  params: ExtractRouteParams<TypeWithDefaults<Properties, "endpoint", string>> | NegativeTypes;
  data: PayloadType<TypeWithDefaults<Properties, "payload", undefined>>;
  queryParams: TypeWithDefaults<Properties, "queryParams", string | QueryParamsType> | NegativeTypes;
  options?: ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>> | undefined;
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
  dataMapper?: PayloadMapperType<TypeWithDefaults<Properties, "payload", undefined>>;
  mock?: Generator<
    GeneratorReturnMockTypes<TypeWithDefaults<Properties, "response", undefined>, this>,
    GeneratorReturnMockTypes<TypeWithDefaults<Properties, "response", undefined>, this>,
    GeneratorReturnMockTypes<TypeWithDefaults<Properties, "response", undefined>, this>
  >;
  mockData?: RequestDataMockTypes<TypeWithDefaults<Properties, "response", undefined>, this>;
  isMockEnabled = false;
  requestMapper?: RequestMapper<this, any>;
  responseMapper?: ResponseMapper<this, any, any>;

  private updatedAbortKey: boolean;
  private updatedCacheKey: boolean;
  private updatedQueueKey: boolean;
  private updatedEffectKey: boolean;

  constructor(
    readonly client: Client<{
      error: TypeWithDefaults<Properties, "globalError", Error>;
      adapter: TypeWithDefaults<Properties, "adapter", AdapterType>;
      mapper: any;
    }>,
    readonly requestOptions: RequestOptionsType<
      TypeWithDefaults<Properties, "endpoint", string>,
      ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>
    >,
    readonly requestJSON?:
      | RequestCurrentType<
          TypeWithDefaults<Properties, "payload", undefined>,
          TypeWithDefaults<Properties, "queryParams", string | QueryParamsType>,
          TypeWithDefaults<Properties, "endpoint", string>,
          ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>,
          ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>
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
    this.method = method as typeof this.method;
    this.params = requestJSON?.params;
    this.data = requestJSON?.data;
    this.queryParams = requestJSON?.queryParams;
    this.options = (requestJSON?.options ?? options) as typeof this.options;
    this.cancelable = requestJSON?.cancelable ?? cancelable;
    this.retry = requestJSON?.retry ?? retry;
    this.retryTime = requestJSON?.retryTime ?? retryTime;
    this.garbageCollection = requestJSON?.garbageCollection ?? garbageCollection;
    this.cache = requestJSON?.cache ?? cache;
    this.cacheTime = requestJSON?.cacheTime ?? cacheTime;
    this.queued = requestJSON?.queued ?? queued;
    this.offline = requestJSON?.offline ?? offline;
    this.abortKey = requestJSON?.abortKey ?? abortKey ?? this.client.abortKeyMapper(this);
    this.cacheKey = requestJSON?.cacheKey ?? cacheKey ?? this.client.cacheKeyMapper(this);
    this.queueKey = requestJSON?.queueKey ?? queueKey ?? this.client.queueKeyMapper(this);
    this.effectKey = requestJSON?.effectKey ?? effectKey ?? this.client.effectKeyMapper(this);
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

  public setParams = <P extends ExtractRouteParams<TypeWithDefaults<Properties, "endpoint", string>>>(params: P) => {
    return this.clone<{ hasParams: P extends null ? false : true }>({ params });
  };

  public setData = <D extends TypeWithDefaults<Properties, "payload", undefined>>(data: D) => {
    return this.clone<{ hasData: D extends NegativeTypes ? false : true }>({
      data,
    });
  };

  public setQueryParams = (queryParams: TypeWithDefaults<Properties, "queryParams", string | QueryParamsType>) => {
    return this.clone<{ hasQuery: true }>({ queryParams });
  };

  public setOptions = (options: ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>) => {
    return this.clone({ options });
  };

  public setCancelable = (cancelable: boolean) => {
    return this.clone({ cancelable });
  };

  public setRetry = (
    retry: RequestOptionsType<
      TypeWithDefaults<Properties, "endpoint", string>,
      ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>
    >["retry"],
  ) => {
    return this.clone({ retry });
  };

  public setRetryTime = (
    retryTime: RequestOptionsType<
      TypeWithDefaults<Properties, "endpoint", string>,
      ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>
    >["retryTime"],
  ) => {
    return this.clone({ retryTime });
  };

  public setGarbageCollection = (
    garbageCollection: RequestOptionsType<
      TypeWithDefaults<Properties, "endpoint", string>,
      ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>
    >["garbageCollection"],
  ) => {
    return this.clone({ garbageCollection });
  };

  public setCache = (
    cache: RequestOptionsType<
      TypeWithDefaults<Properties, "endpoint", string>,
      ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>
    >["cache"],
  ) => {
    return this.clone({ cache });
  };

  public setCacheTime = (
    cacheTime: RequestOptionsType<
      TypeWithDefaults<Properties, "endpoint", string>,
      ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>
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

  public setMock = (mockData: RequestDataMockTypes<TypeWithDefaults<Properties, "response", undefined>, this>) => {
    const mockGenerator = function* mocked(
      mockedValues: RequestDataMockTypes<TypeWithDefaults<Properties, "response", undefined>, RequestInstance>,
    ) {
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
    this.isMockEnabled = true;
    return this;
  };

  public removeMock = () => {
    this.mockData = null;
    this.mock = null;
    this.isMockEnabled = false;
    return this;
  };

  public setEnableMocking = (isMockEnabled: boolean) => {
    this.isMockEnabled = isMockEnabled;
    return this;
  };

  /**
   * Mappers
   */

  /**
   * Map data before it gets send to the server
   * @param dataMapper
   * @returns
   */
  public setDataMapper = <
    DataMapper extends (data: TypeWithDefaults<Properties, "payload", undefined>) => any | Promise<any>,
  >(
    dataMapper: DataMapper,
  ) => {
    const cloned = this.clone(undefined);

    cloned.dataMapper = dataMapper;

    return cloned;
  };

  /**
   * Map request before it gets send to the server
   * @param requestMapper mapper of the request
   * @returns new request
   */
  public setRequestMapper = <NewRequest extends RequestInstance>(requestMapper: RequestMapper<this, NewRequest>) => {
    const cloned = this.clone(undefined);

    cloned.requestMapper = requestMapper as unknown as typeof cloned.requestMapper;

    return cloned;
  };

  /**
   * Map the response to the new interface
   * @param responseMapper our mapping callback
   * @returns new response
   */
  public setResponseMapper = <
    NewResponse = TypeWithDefaults<Properties, "response", undefined>,
    NewError = TypeWithDefaults<Properties, "globalError", Error> | TypeWithDefaults<Properties, "localError", Error>,
  >(
    responseMapper?: ResponseMapper<this, NewResponse, NewError>,
  ) => {
    const cloned = this.clone();

    cloned.responseMapper = responseMapper as unknown as typeof cloned.responseMapper;

    return cloned as unknown as RequestExtend<
      Request<Properties>,
      {
        response: NewResponse;
      }
    >;
  };

  private paramsMapper = (
    params: ParamsType | null | undefined,
    queryParams: TypeWithDefaults<Properties, "queryParams", string | QueryParamsType> | NegativeTypes,
  ): string => {
    let endpoint = this.requestOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    if (queryParams) {
      endpoint += this.client.stringifyQueryParams(queryParams as unknown as QueryParamsType);
    }
    return endpoint;
  };

  public toJSON(): RequestJSON<Request<Properties>> {
    return {
      requestOptions: this.requestOptions as any,
      endpoint: this.endpoint,
      headers: this.headers,
      auth: this.auth,
      method: this.method as any,
      params: this.params as any,
      data: this.data as any,
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
    ExtendedProperties extends {
      hasData?: true | false;
      hasParams?: true | false;
      hasQuery?: true | false;
      // eslint-disable-next-line @typescript-eslint/ban-types
    } = {
      hasData?: TypeWithDefaults<Properties, "hasData", false>;
      hasParams?: TypeWithDefaults<Properties, "hasParams", false>;
      hasQuery?: TypeWithDefaults<Properties, "hasQuery", false>;
    },
  >(
    options?: RequestCurrentType<
      TypeWithDefaults<Properties, "payload", undefined>,
      TypeWithDefaults<Properties, "queryParams", string | QueryParamsType>,
      TypeWithDefaults<Properties, "endpoint", string>,
      ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>
    >,
  ): Request<{
    response: TypeWithDefaults<Properties, "response", undefined>;
    payload: TypeWithDefaults<Properties, "payload", undefined>;
    queryParams: TypeWithDefaults<Properties, "queryParams", string | QueryParamsType>;
    globalError: TypeWithDefaults<Properties, "globalError", Error>;
    localError: TypeWithDefaults<Properties, "localError", Error>;
    endpoint: TypeWithDefaults<Properties, "endpoint", string>;
    adapter: TypeWithDefaults<Properties, "adapter", AdapterType>;
    hasData: TypeWithDefaults<ExtendedProperties, "hasData", false>;
    hasParams: TypeWithDefaults<ExtendedProperties, "hasParams", false>;
    hasQuery: TypeWithDefaults<ExtendedProperties, "hasQuery", false>;
  }> {
    const json = this.toJSON();
    const requestJSON: RequestCurrentType<
      TypeWithDefaults<Properties, "payload", undefined>,
      TypeWithDefaults<Properties, "queryParams", string | QueryParamsType>,
      TypeWithDefaults<Properties, "endpoint", string>,
      ExtractAdapterOptionsType<TypeWithDefaults<Properties, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Properties, "adapter", AdapterType>>
    > = {
      ...json,
      ...options,
      params: options.params as typeof this.params,
      abortKey: this.updatedAbortKey ? options?.abortKey || this.abortKey : undefined,
      cacheKey: this.updatedCacheKey ? options?.cacheKey || this.cacheKey : undefined,
      queueKey: this.updatedQueueKey ? options?.queueKey || this.queueKey : undefined,
      endpoint: this.paramsMapper(
        options?.params || this.params,
        options?.queryParams || this.queryParams,
      ) as TypeWithDefaults<Properties, "endpoint", string>,
      queryParams: options?.queryParams || this.queryParams,
      // Typescript circular types issue - we have to leave any here
      data: (options?.data || this.data) as any,
    };

    const cloned = new Request<{
      response: TypeWithDefaults<Properties, "response", undefined>;
      payload: TypeWithDefaults<Properties, "payload", undefined>;
      queryParams: TypeWithDefaults<Properties, "queryParams", string | QueryParamsType>;
      globalError: TypeWithDefaults<Properties, "globalError", Error>;
      localError: TypeWithDefaults<Properties, "localError", Error>;
      endpoint: TypeWithDefaults<Properties, "endpoint", string>;
      adapter: TypeWithDefaults<Properties, "adapter", AdapterType>;
      hasData: TypeWithDefaults<ExtendedProperties, "hasData", false>;
      hasParams: TypeWithDefaults<ExtendedProperties, "hasParams", false>;
      hasQuery: TypeWithDefaults<ExtendedProperties, "hasQuery", false>;
    }>(this.client, this.requestOptions, requestJSON);

    // Inherit methods
    cloned.dataMapper = this.dataMapper;
    cloned.responseMapper = this.responseMapper as unknown as typeof cloned.responseMapper;
    cloned.requestMapper = this.requestMapper as unknown as typeof cloned.requestMapper;

    cloned.mockData = this.mockData as unknown as typeof cloned.mockData;
    cloned.mock = this.mock as unknown as typeof cloned.mock;
    cloned.isMockEnabled = this.isMockEnabled;

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
  public exec: RequestSendType<Request<Properties>> = async (options?: RequestSendOptionsType<Request<Properties>>) => {
    const { adapter, requestManager } = this.client;
    const request = this.clone(options as unknown);

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
  public send: RequestSendType<Request<Properties>> = async (options?: RequestSendOptionsType<Request<Properties>>) => {
    const { dispatcherType, ...rest } = options || {};

    const request = this.clone(rest as any) as any;
    return sendRequest<Request<Properties>>(request, options);
  };
}

// /**
//  *Typescript test cases
//  */

// const client = new Client({
//   url: "http://localhost:3000",
// });

// const getUsers = client.createRequest<{ response: { id: string }[] }>()({
//   method: "GET",
//   endpoint: "/users",
// });

// const getUser = client.createRequest<{ response: { id: string } }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });

// const postUser = client.createRequest<{ response: { id: string }; payload: { name: string } }>()({
//   method: "POST",
//   endpoint: "/users",
// });

// const patchUser = client.createRequest<{ response: { id: string }; payload: { name: string } }>()({
//   method: "PATCH",
//   endpoint: "/users/:id",
// });

// const mappedReq = client
//   .createRequest<{ response: { id: string }; payload: { name: string } }>()({
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
// getUsers.send();
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
// getUser.send({ params: { id: null } }); // <----- Should fail

// // ================>

// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null }); // <------ Should fail
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
// mappedReq.send({ data: undefined }); // <---- should fail
// mappedReq.setData(null).send();
// mappedReq.setData(null).send({ data: null, queryParams: () => null });
// mappedReq.send();
// mappedReq.send({ data: new FormData() });
// mappedReq.setData({ name: "" }).send({ data: { name: "" } });
