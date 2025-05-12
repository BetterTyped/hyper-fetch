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
import { ClientInstance, RequestGenericType } from "client";
import { getUniqueRequestId } from "utils";
import { ResponseType } from "adapter";
import {
  ExtractAdapterType,
  ExtractClientAdapterType,
  ExtractClientGlobalError,
  ExtractEndpointType,
  ExtractParamsType,
  ExtractPayloadType,
  ExtractQueryParamsType,
  EmptyTypes,
  TypeWithDefaults,
  ExtractAdapterMethodType,
  ExtractAdapterOptionsType,
  HydrateDataType,
} from "types";
import { Time } from "constants/time.constants";
import { MockerConfigType, MockResponseType } from "mocker";

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
  params: ExtractRouteParams<Endpoint> | EmptyTypes;
  payload: PayloadType<Payload>;
  queryParams: QueryParams | EmptyTypes;
  options?: ExtractAdapterOptionsType<ExtractClientAdapterType<Client>> | undefined;
  cancelable: boolean;
  retry: number;
  retryTime: number;
  cacheTime: number;
  cache: boolean;
  staleTime: number;
  queued: boolean;
  offline: boolean;
  abortKey: string;
  cacheKey: string;
  queryKey: string;
  used: boolean;
  deduplicate: boolean;
  deduplicateTime: number | null;

  isMockerEnabled = false;

  unstable_mock?: {
    fn: (options: {
      request: RequestInstance;
      requestId: string;
    }) => MockResponseType<Response, LocalError | ExtractClientGlobalError<Client>, ExtractClientAdapterType<Client>>;
    config: MockerConfigType;
  };
  /** @internal */
  unstable_payloadMapper?: PayloadMapperType<Payload>;
  /** @internal */
  unstable_requestMapper?: RequestMapper<any, any>;
  /** @internal */
  unstable_responseMapper?: ResponseMapper<this, any, any>;

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
      ...(this.client.adapter.unstable_getRequestDefaults?.(requestOptions) as RequestOptionsType<
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
      method = client.adapter.defaultMethod,
      options,
      cancelable = false,
      retry = 0,
      retryTime = 500,
      cacheTime = Time.MIN * 5,
      cache = true,
      staleTime = Time.MIN * 5,
      queued = false,
      offline = true,
      abortKey,
      cacheKey,
      queryKey,
      deduplicate = false,
      deduplicateTime = null,
    } = configuration;
    this.endpoint = initialRequestConfiguration?.endpoint ?? endpoint;
    this.headers = initialRequestConfiguration?.headers ?? headers;
    this.auth = initialRequestConfiguration?.auth ?? auth;
    this.method = method as ExtractAdapterMethodType<ExtractClientAdapterType<Client>>;
    this.params = initialRequestConfiguration?.params;
    this.payload = initialRequestConfiguration?.payload;
    this.queryParams = initialRequestConfiguration?.queryParams;
    this.options = initialRequestConfiguration?.options ?? options;
    this.cancelable = initialRequestConfiguration?.cancelable ?? cancelable;
    this.retry = initialRequestConfiguration?.retry ?? retry;
    this.retryTime = initialRequestConfiguration?.retryTime ?? retryTime;
    this.cacheTime = initialRequestConfiguration?.cacheTime ?? cacheTime;
    this.cache = initialRequestConfiguration?.cache ?? cache;
    this.staleTime = initialRequestConfiguration?.staleTime ?? staleTime;
    this.queued = initialRequestConfiguration?.queued ?? queued;
    this.offline = initialRequestConfiguration?.offline ?? offline;
    this.abortKey = initialRequestConfiguration?.abortKey ?? abortKey ?? this.client.unstable_abortKeyMapper(this);
    this.cacheKey = initialRequestConfiguration?.cacheKey ?? cacheKey ?? this.client.unstable_cacheKeyMapper(this);
    this.queryKey = initialRequestConfiguration?.queryKey ?? queryKey ?? this.client.unstable_queryKeyMapper(this);
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

  public setCacheTime = (
    cacheTime: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    >["cacheTime"],
  ) => {
    return this.clone({ cacheTime });
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

  public setStaleTime = (
    staleTime: RequestOptionsType<
      Endpoint,
      ExtractAdapterOptionsType<ExtractClientAdapterType<Client>>,
      ExtractAdapterMethodType<ExtractClientAdapterType<Client>>
    >["staleTime"],
  ) => {
    return this.clone({ staleTime });
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

  public setQueueKey = (queryKey: string) => {
    this.updatedQueueKey = true;
    return this.clone({ queryKey });
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

  public setMock = (
    fn: (options: {
      request: Request<Response, Payload, QueryParams, LocalError, Endpoint, Client, HasPayload, HasParams, HasQuery>;
      requestId: string;
    }) => MockResponseType<Response, LocalError | ExtractClientGlobalError<Client>, ExtractClientAdapterType<Client>>,
    config: MockerConfigType = {},
  ) => {
    this.unstable_mock = { fn, config } as typeof this.unstable_mock;
    this.isMockerEnabled = true;
    return this;
  };

  public clearMock = () => {
    this.unstable_mock = undefined;
    this.isMockerEnabled = false;
    return this;
  };

  public setEnableMocking = (isMockerEnabled: boolean) => {
    this.isMockerEnabled = isMockerEnabled;
    return this;
  };

  /**
   * Map data before it gets send to the server
   * @param payloadMapper
   * @returns
   */
  public setPayloadMapper = <MappedPayload extends any | Promise<any>>(
    payloadMapper: (data: Payload) => MappedPayload,
  ) => {
    const cloned = this.clone<HasPayload, HasParams, HasQuery>(undefined);

    cloned.unstable_payloadMapper = payloadMapper as typeof this.unstable_payloadMapper;

    return cloned;
  };

  /**
   * Map request before it gets send to the server
   * @param requestMapper mapper of the request
   * @returns new request
   */
  public setRequestMapper = <NewRequest extends RequestInstance>(requestMapper: RequestMapper<this, NewRequest>) => {
    const cloned = this.clone<HasPayload, HasParams, HasQuery>(undefined);

    cloned.unstable_requestMapper = requestMapper;

    return cloned;
  };

  /**
   * Map the response to the new interface
   * @param responseMapper our mapping callback
   * @returns new response
   */
  public setResponseMapper = <Properties extends Pick<RequestGenericType<QueryParams>, "response" | "error">>(
    responseMapper?: ResponseMapper<
      this,
      TypeWithDefaults<Properties, "response", Response>,
      TypeWithDefaults<Properties, "error", LocalError>
    >,
  ) => {
    const cloned = this.clone<HasPayload, HasParams, HasQuery>();

    cloned.unstable_responseMapper = responseMapper;

    return cloned as unknown as Request<
      TypeWithDefaults<Properties, "response", Response>,
      Payload,
      QueryParams,
      TypeWithDefaults<Properties, "error", LocalError>,
      Endpoint,
      Client,
      HasPayload,
      HasParams,
      HasQuery
    >;
  };

  private paramsMapper = (params: ParamsType | null | undefined): Endpoint => {
    const { endpoint } = this.requestOptions;

    let stringEndpoint = String(endpoint);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        stringEndpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return stringEndpoint as Endpoint;
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
      // TODO: fix this type
      method: this.method as any,
      params: this.params as ExtractParamsType<this>,
      payload: this.payload as ExtractPayloadType<this>,
      queryParams: this.queryParams as ExtractQueryParamsType<this>,
      options: this.options,
      cancelable: this.cancelable,
      retry: this.retry,
      retryTime: this.retryTime,
      cacheTime: this.cacheTime,
      cache: this.cache,
      staleTime: this.staleTime,
      queued: this.queued,
      offline: this.offline,
      abortKey: this.abortKey,
      cacheKey: this.cacheKey,
      queryKey: this.queryKey,
      used: this.used,
      disableResponseInterceptors: this.requestOptions.disableResponseInterceptors,
      disableRequestInterceptors: this.requestOptions.disableRequestInterceptors,
      updatedAbortKey: this.updatedAbortKey,
      updatedCacheKey: this.updatedCacheKey,
      updatedQueueKey: this.updatedQueueKey,
      deduplicate: this.deduplicate,
      deduplicateTime: this.deduplicateTime,
      isMockerEnabled: this.isMockerEnabled,
      hasMock: !!this.unstable_mock,
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
      queryKey: this.updatedQueueKey ? configuration?.queryKey || this.queryKey : undefined,
      endpoint: this.paramsMapper(configuration?.params || this.params),
      queryParams: configuration?.queryParams || this.queryParams,
      payload: configuration?.payload || this.payload,
      params: (configuration?.params || this.params) as
        | EmptyTypes
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
    cloned.unstable_payloadMapper = this.unstable_payloadMapper;
    cloned.unstable_responseMapper = this.unstable_responseMapper;
    cloned.unstable_requestMapper = this.unstable_requestMapper;

    cloned.unstable_mock = this.unstable_mock;
    cloned.isMockerEnabled = this.isMockerEnabled;

    return cloned;
  }

  public abort = () => {
    const { requestManager } = this.client;
    requestManager.abortByKey(this.abortKey);

    return this.clone();
  };

  public dehydrate = (config?: {
    /** in case of using adapter without cache we can provide response to dehydrate */
    response?: ResponseType<Response, LocalError | ExtractClientGlobalError<Client>, ExtractClientAdapterType<Client>>;
    /** override cache data */
    override?: boolean;
  }):
    | HydrateDataType<Response, LocalError | ExtractClientGlobalError<Client>, ExtractClientAdapterType<Client>>
    | undefined => {
    const { response, override = true } = config || {};

    if (response) {
      return {
        override,
        cacheTime: this.cacheTime,
        staleTime: this.staleTime,
        cacheKey: this.cacheKey,
        timestamp: +new Date(),
        hydrated: true,
        cache: true,
        response,
      };
    }

    const cacheData = this.client.cache.get<
      Response,
      LocalError | ExtractClientGlobalError<Client>,
      ExtractClientAdapterType<Client>
    >(this.cacheKey);

    if (!cacheData) {
      return undefined;
    }

    return {
      override,
      cacheTime: this.cacheTime,
      staleTime: this.staleTime,
      cacheKey: this.cacheKey,
      timestamp: +new Date(),
      hydrated: true,
      cache: true,
      response: {
        data: cacheData.data,
        error: cacheData.error,
        status: cacheData.status,
        success: cacheData.success,
        extra: cacheData.extra,
        requestTimestamp: cacheData.requestTimestamp,
        responseTimestamp: cacheData.responseTimestamp,
      },
    };
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

    if (cacheData) {
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

    const requestId = getUniqueRequestId(this.queryKey);

    // Listen for aborting
    requestManager.addAbortController(this.abortKey, requestId);

    const response = await adapter.fetch(request, requestId);

    // Stop listening for aborting
    requestManager.removeAbortController(this.abortKey, requestId);

    if (request.unstable_responseMapper) {
      return request.unstable_responseMapper(response);
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
