/* eslint-disable max-lines */
import {
  RequestSendOptionsType,
  ParamsType,
  RequestSendType,
  PayloadType,
  RequestJSON,
  RequestOptionsType,
  sendRequest,
  RequestConfigurationType,
  PayloadMapperType,
  RequestInstance,
  RequestMapper,
  ResponseMapper,
  ExtractRouteParams,
} from "request";
import { ClientInstance } from "client";
import { getUniqueRequestId } from "utils";
import { ExtractAdapterMethodType, ExtractAdapterOptionsType, QueryParamsType, ResponseType } from "adapter";
import {
  ExtractAdapterType,
  ExtractClientAdapterType,
  ExtractClientGlobalError,
  ExtractEndpointType,
  ExtractParamsType,
  ExtractPayloadType,
  ExtractQueryParamsType,
  NegativeTypes,
} from "types";
import { Time } from "constants/time.constants";
import { GeneratorReturnMockTypes, RequestDataMockTypes } from "mocker";

/**
 * Request is a class that represents a request sent to the server. It contains all the necessary information to make a request, like endpoint, method, headers, data, and much more.
 * It is executed at any time via methods like `send` or `exec`.
 *
 * We can set it up with options like endpoint, method, headers and more.
 * We can choose some of advanced settings like cache, invalidation patterns, concurrency, retries and much, much more.
 *
 * @info We should not use this class directly in the standard development flow.
 * We can initialize it using the `createRequest` method on the **Client** class.
 *
 * @attention The most important thing about the request is that it keeps data in the format that can be dumped.
 * This is necessary for the persistence and different dispatcher storage types.
 * This class doesn't have any callback methods by design and communicate with dispatcher and cache by events.
 *
 * It should be serializable to JSON and deserializable back to the class.
 * Serialization should not affect the result of the request, so it's methods and functional part should be only syntax sugar for given runtime.
 */

export class Request<
  Response,
  Payload,
  QueryParams,
  LocalError,
  Endpoint extends string,
  Client extends ClientInstance,
  HasPayload extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
> {
  endpoint: Endpoint;
  headers?: HeadersInit;
  auth: boolean;
  method: ExtractAdapterMethodType<ExtractClientAdapterType<Client>>;
  params: ExtractRouteParams<Endpoint> | NegativeTypes;
  payload: PayloadType<Payload>;
  queryParams: QueryParams | NegativeTypes;
  options?: ExtractAdapterOptionsType<ExtractClientAdapterType<Client>> | undefined;
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
  used: boolean;
  deduplicate: boolean;
  deduplicateTime: number;
  payloadMapper?: PayloadMapperType<Payload>;

  mock?: Generator<
    GeneratorReturnMockTypes<Response, any>,
    GeneratorReturnMockTypes<Response, any>,
    GeneratorReturnMockTypes<Response, any>
  >;
  mockData?: RequestDataMockTypes<Response, any>;
  isMockEnabled = false;

  /** @internal */
  __requestMapper?: RequestMapper<any, any>;
  /** @internal */
  __responseMapper?: ResponseMapper<this, any, any>;

  private updatedAbortKey: boolean;
  private updatedCacheKey: boolean;
  private updatedQueueKey: boolean;

  constructor(
    readonly client: Client,
    readonly requestOptions: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    >,
    readonly initialRequestConfiguration?:
      | RequestConfigurationType<
          Payload,
          Endpoint extends string ? ExtractRouteParams<Endpoint> : never,
          QueryParams,
          Endpoint,
          ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
          ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
        >
      | undefined,
  ) {
    const configuration: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    > = {
      ...(this.client.requestDefaultOptions?.(requestOptions) as RequestOptionsType<
        Endpoint,
        ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
        ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
      >),
      ...requestOptions,
    };
    const {
      endpoint,
      headers,
      auth = true,
      method = client.defaultMethod,
      options,
      cancelable = false,
      retry = 0,
      retryTime = 500,
      garbageCollection = Time.MIN * 5,
      cache = true,
      cacheTime = Time.MIN * 5,
      queued = false,
      offline = true,
      abortKey,
      cacheKey,
      queueKey,
      deduplicate = false,
      deduplicateTime = 10,
    } = configuration;
    this.endpoint = initialRequestConfiguration?.endpoint ?? endpoint;
    this.headers = initialRequestConfiguration?.headers ?? headers;
    this.auth = initialRequestConfiguration?.auth ?? auth;
    this.method = method as ExtractAdapterMethodType<ExtractAdapterType<this>>;
    this.params = initialRequestConfiguration?.params;
    this.payload = initialRequestConfiguration?.payload;
    this.queryParams = initialRequestConfiguration?.queryParams;
    this.options = initialRequestConfiguration?.options ?? options;
    this.cancelable = initialRequestConfiguration?.cancelable ?? cancelable;
    this.retry = initialRequestConfiguration?.retry ?? retry;
    this.retryTime = initialRequestConfiguration?.retryTime ?? retryTime;
    this.garbageCollection = initialRequestConfiguration?.garbageCollection ?? garbageCollection;
    this.cache = initialRequestConfiguration?.cache ?? cache;
    this.cacheTime = initialRequestConfiguration?.cacheTime ?? cacheTime;
    this.queued = initialRequestConfiguration?.queued ?? queued;
    this.offline = initialRequestConfiguration?.offline ?? offline;
    this.abortKey = initialRequestConfiguration?.abortKey ?? abortKey ?? this.client.abortKeyMapper(this);
    this.cacheKey = initialRequestConfiguration?.cacheKey ?? cacheKey ?? this.client.cacheKeyMapper(this);
    this.queueKey = initialRequestConfiguration?.queueKey ?? queueKey ?? this.client.queueKeyMapper(this);
    this.used = initialRequestConfiguration?.used ?? false;
    this.deduplicate = initialRequestConfiguration?.deduplicate ?? deduplicate;
    this.deduplicateTime = initialRequestConfiguration?.deduplicateTime ?? deduplicateTime;
    this.updatedAbortKey = initialRequestConfiguration?.updatedAbortKey ?? false;
    this.updatedCacheKey = initialRequestConfiguration?.updatedCacheKey ?? false;
    this.updatedQueueKey = initialRequestConfiguration?.updatedQueueKey ?? false;
  }

  public setHeaders = (headers: HeadersInit) => {
    return this.clone({ headers });
  };

  public setAuth = (auth: boolean) => {
    return this.clone({ auth });
  };

  public setParams = <P extends ExtractParamsType<this>>(params: P) => {
    return this.clone<HasPayload, P extends null ? false : true, HasQuery>({ params });
  };

  public setPayload = <P extends Payload>(payload: P) => {
    return this.clone<P extends null ? false : true, HasParams, HasQuery>({
      payload,
    });
  };

  public setQueryParams = (queryParams: QueryParams) => {
    return this.clone<HasPayload, HasParams, true>({ queryParams });
  };

  public setOptions = (options: ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>) => {
    return this.clone<HasPayload, HasParams, true>({ options });
  };

  public setCancelable = (cancelable: boolean) => {
    return this.clone({ cancelable });
  };

  public setRetry = (
    retry: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    >["retry"],
  ) => {
    return this.clone({ retry });
  };

  public setRetryTime = (
    retryTime: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    >["retryTime"],
  ) => {
    return this.clone({ retryTime });
  };

  public setGarbageCollection = (
    garbageCollection: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    >["garbageCollection"],
  ) => {
    return this.clone({ garbageCollection });
  };

  public setCache = (
    cache: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    >["cache"],
  ) => {
    return this.clone({ cache });
  };

  public setCacheTime = (
    cacheTime: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
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

  public setMock = (mockData: RequestDataMockTypes<Response, this>) => {
    const mockGenerator = function* mocked(mockedValues: typeof mockData) {
      if (Array.isArray(mockedValues)) {
        let iteration = 0;
        // eslint-disable-next-line no-restricted-syntax
        while (true) {
          yield mockedValues[iteration];
          iteration = mockedValues.length === iteration + 1 ? 0 : iteration + 1;
        }
      } else {
        while (true) {
          yield mockedValues;
        }
      }
    };
    this.mockData = mockData;
    this.mock = mockGenerator(mockData);
    this.isMockEnabled = true;
    return this;
  };

  public removeMock = () => {
    this.mockData = undefined;
    this.mock = undefined;
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
   * @param payloadMapper
   * @returns
   */
  public setPayloadMapper = <MappedPayload extends any | Promise<any>>(
    payloadMapper: (data: Payload) => MappedPayload,
  ) => {
    const cloned = this.clone<HasPayload, HasParams, HasQuery>(undefined);

    cloned.payloadMapper = payloadMapper as typeof this.payloadMapper;

    return cloned;
  };

  /**
   * Map request before it gets send to the server
   * @param requestMapper mapper of the request
   * @returns new request
   */
  public setRequestMapper = <NewRequest extends RequestInstance>(requestMapper: RequestMapper<this, NewRequest>) => {
    const cloned = this.clone<HasPayload, HasParams, HasQuery>(undefined);

    cloned.__requestMapper = requestMapper as any;

    return cloned;
  };

  /**
   * Map the response to the new interface
   * @param responseMapper our mapping callback
   * @returns new response
   */
  public setResponseMapper = <NewResponse = Response, NewError = ExtractClientGlobalError<Client> | LocalError>(
    responseMapper?: ResponseMapper<this, NewResponse, NewError>,
  ) => {
    const cloned = this.clone<HasPayload, HasParams, HasQuery>();

    cloned.__responseMapper = responseMapper;

    return cloned as unknown as Request<
      NewResponse,
      Payload,
      QueryParams,
      LocalError,
      Endpoint,
      Client,
      HasPayload,
      HasParams,
      HasQuery
    >;
  };

  private paramsMapper = (
    params: ParamsType | null | undefined,
    queryParams: QueryParams | NegativeTypes,
  ): Endpoint => {
    let { endpoint } = this.requestOptions;
    if (typeof endpoint === "string") {
      let stringEndpoint = String(endpoint);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          stringEndpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
        });
      }
      if (queryParams) {
        stringEndpoint += this.client.stringifyQueryParams(queryParams as unknown as QueryParamsType);
      }
      endpoint = stringEndpoint as typeof endpoint;
    }
    return endpoint;
  };

  public toJSON(): RequestJSON<this> {
    return {
      requestOptions: this.requestOptions as unknown as RequestOptionsType<
        ExtractEndpointType<this>,
        ExtractAdapterOptionsType<ExtractAdapterType<this>>,
        ExtractAdapterMethodType<ExtractAdapterType<this>>
      >,
      endpoint: this.endpoint as ExtractEndpointType<this>,
      headers: this.headers,
      auth: this.auth,
      method: this.method as ExtractAdapterMethodType<ExtractAdapterType<this>>,
      params: this.params as ExtractParamsType<this>,
      payload: this.payload as ExtractPayloadType<this>,
      queryParams: this.queryParams as ExtractQueryParamsType<this>,
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
      used: this.used,
      disableResponseInterceptors: this.requestOptions.disableResponseInterceptors,
      disableRequestInterceptors: this.requestOptions.disableRequestInterceptors,
      updatedAbortKey: this.updatedAbortKey,
      updatedCacheKey: this.updatedCacheKey,
      updatedQueueKey: this.updatedQueueKey,
      deduplicate: this.deduplicate,
      deduplicateTime: this.deduplicateTime,
    };
  }

  public clone<
    NewData extends true | false = HasPayload,
    NewParams extends true | false = HasParams,
    NewQueryParams extends true | false = HasQuery,
  >(
    configuration?: RequestConfigurationType<
      Payload,
      (typeof this)["params"],
      QueryParams,
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    >,
  ) {
    const json = this.toJSON();
    const initialRequestConfiguration: RequestConfigurationType<
      Payload,
      Endpoint extends string ? ExtractRouteParams<Endpoint> : never,
      QueryParams,
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    > = {
      ...json,
      ...configuration,
      options: configuration?.options || this.options,
      abortKey: this.updatedAbortKey ? configuration?.abortKey || this.abortKey : undefined,
      cacheKey: this.updatedCacheKey ? configuration?.cacheKey || this.cacheKey : undefined,
      queueKey: this.updatedQueueKey ? configuration?.queueKey || this.queueKey : undefined,
      endpoint: this.paramsMapper(configuration?.params || this.params, configuration?.queryParams || this.queryParams),
      queryParams: configuration?.queryParams || this.queryParams,
      payload: configuration?.payload || this.payload,
      params: (configuration?.params || this.params) as
        | NegativeTypes
        | (Endpoint extends string ? ExtractRouteParams<Endpoint> : never),
    };

    const cloned = new Request<
      Response,
      Payload,
      QueryParams,
      LocalError,
      Endpoint,
      Client,
      NewData,
      NewParams,
      NewQueryParams
    >(this.client, this.requestOptions, initialRequestConfiguration);

    // Inherit methods
    cloned.payloadMapper = this.payloadMapper;
    cloned.__responseMapper = this.__responseMapper;
    cloned.__requestMapper = this.__requestMapper as any;

    // cloned.mockData = this.mockData as any;
    // cloned.mock = this.mock as any;
    cloned.isMockEnabled = this.isMockEnabled;

    return cloned;
  }

  public abort = () => {
    const { requestManager } = this.client;
    requestManager.abortByKey(this.abortKey);

    return this.clone();
  };

  /**
   * Read the response from cache data
   *
   * If it returns error and data at the same time, it means that latest request was failed
   * and we show previous data from cache together with error received from actual request
   */
  public read():
    | ResponseType<Response, LocalError | ExtractClientGlobalError<Client>, ExtractClientAdapterType<Client>>
    | undefined {
    const cacheData = this.client.cache.get<
      Response,
      LocalError | ExtractClientGlobalError<Client>,
      ExtractClientAdapterType<Client>
    >(this.cacheKey);

    if (cacheData?.data) {
      return {
        data: cacheData.data,
        error: cacheData.error,
        status: cacheData.status,
        success: cacheData.success,
        extra: cacheData.extra,
        requestTimestamp: cacheData.requestTimestamp,
        responseTimestamp: cacheData.responseTimestamp,
      };
    }
    return undefined;
  }

  /**
   * Method to use the request WITHOUT adding it to cache and queues. This mean it will make simple request without queue side effects.
   * @param options
   * @disableReturns
   * @returns
   * ```tsx
   * Promise<[Data | null, Error | null, HttpStatus]>
   * ```
   */
  public exec: RequestSendType<this> = async (options?: RequestSendOptionsType<this>) => {
    const { adapter, requestManager } = this.client;
    const request = this.clone(options);

    const requestId = getUniqueRequestId(this.queueKey);

    // Listen for aborting
    requestManager.addAbortController(this.abortKey, requestId);

    const response = await adapter(request, requestId);

    // Stop listening for aborting
    requestManager.removeAbortController(this.abortKey, requestId);

    if (request.__responseMapper) {
      return request.__responseMapper(response);
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
  public send: RequestSendType<this> = async (options?: RequestSendOptionsType<this>) => {
    const { dispatcherType, ...configuration } = options || {};

    const request = this.clone(configuration);
    return sendRequest(request as unknown as this, options);
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
//   .setPayloadMapper((data) => {
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
// postUser.setPayload({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null });  // <------ Should fail
// postUser.setPayload(null).send();
// postUser.send();
// postUser.setPayload({ name: "" }).send({ data: { name: "" } });
//
// // ================>
//
// // OK
// patchUser.send({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setPayload({ name: "" }).send();
// // Fail
// patchUser.send({ queryParams: "" });
// patchUser.send({ data: null });
// patchUser.setPayload(null).send();
// patchUser.send();
// patchUser
//   .setParams({ id: "" })
//   .setPayload({ name: "" })
//   .send({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setPayload({ name: "" })
//   .send({ params: { id: "" } });
//
// // ================>
//
// // OK
// mappedReq.send({ data: { name: "" } });
// mappedReq.setPayload({ name: "" }).send();
// // Fail
// mappedReq.send({ queryParams: "" });
// mappedReq.send({ data: undefined });  // <---- should fail
// mappedReq.setPayload(null).send();
// mappedReq.setPayload(null).send({ data: null, queryParams: () => null });
// mappedReq.send();
// mappedReq.send({ data: new FormData() });
// mappedReq.setPayload({ name: "" }).send({ data: { name: "" } });
