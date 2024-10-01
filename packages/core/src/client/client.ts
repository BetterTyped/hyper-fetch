import {
  adapter as defaultAdapter,
  AdapterInstance,
  AdapterPayloadMappingType,
  AdapterType,
  ExtractAdapterExtraType,
  ExtractAdapterMethodType,
  ExtractAdapterOptionsType,
  ExtractAdapterQueryParamsType,
  ExtractUnionAdapter,
  HeaderMappingType,
  QueryStringifyOptionsType,
  ResponseType,
  xhrExtra,
  ExtractAdapterEndpointType,
} from "adapter";
import {
  ClientErrorType,
  ClientInstance,
  ClientOptionsType,
  DefaultEndpointMapper,
  getAdapterHeaders,
  getAdapterPayload,
  RequestGenericType,
  RequestInterceptorType,
  ResponseInterceptorType,
  StringifyCallbackType,
  stringifyQueryParams,
} from "client";
import { Cache } from "cache";
import { Dispatcher } from "dispatcher";
import { RequestEffectInstance } from "effect";
import { getRequestKey, getSimpleKey, Request, RequestInstance, RequestOptionsType } from "request";
import { AppManager, LoggerManager, RequestManager, SeverityType } from "managers";
import { interceptRequest, interceptResponse } from "./client.utils";
import { HttpMethods } from "../constants/http.constants";
import { ExtractAdapterType, NegativeTypes, TypeWithDefaults } from "types";

/**
 * **Client** is a class that allows you to configure the connection with the server and then use it to create
 * requests. It allows you to set global defaults for the requests configuration, query params configuration.
 * It is also orchestrator for all of the HyperFetch modules like Cache, Dispatcher, AppManager, LoggerManager,
 * RequestManager and more.
 */
export class Client<
  GlobalErrorType extends ClientErrorType = Error,
  Adapter extends AdapterInstance = AdapterType,
  EndpointMapper extends DefaultEndpointMapper = (endpoint: any) => any,
> {
  readonly url: string;
  public debug: boolean;

  /** Only used in dev mode */
  __requestsMap: Array<RequestInstance> = [];

  // Private
  __onErrorCallbacks: ResponseInterceptorType[] = [];
  __onSuccessCallbacks: ResponseInterceptorType[] = [];
  __onResponseCallbacks: ResponseInterceptorType[] = [];
  __onAuthCallbacks: RequestInterceptorType[] = [];
  __onRequestCallbacks: RequestInterceptorType[] = [];

  // Managers
  requestManager: RequestManager = new RequestManager();
  appManager: AppManager;
  loggerManager: LoggerManager = new LoggerManager(this);

  // Config
  adapter: Adapter;
  cache: Cache<this>;
  fetchDispatcher: Dispatcher;
  submitDispatcher: Dispatcher;

  defaultMethod: ExtractAdapterMethodType<Adapter> = HttpMethods.GET as ExtractAdapterMethodType<Adapter>;
  defaultExtra: ExtractAdapterExtraType<Adapter> = xhrExtra as ExtractAdapterExtraType<Adapter>;

  isMockEnabled = true;

  // Registered requests effect
  effects: RequestEffectInstance[] = [];

  // Options
  queryParamsConfig?: QueryStringifyOptionsType;
  adapterDefaultOptions?: (request: RequestInstance) => ExtractAdapterOptionsType<Adapter>;
  requestDefaultOptions?: (
    options: RequestOptionsType<
      ExtractAdapterEndpointType<Adapter>,
      ExtractAdapterOptionsType<Adapter>,
      ExtractAdapterMethodType<Adapter>
    >,
  ) => Partial<
    RequestOptionsType<
      ExtractAdapterEndpointType<Adapter>,
      ExtractAdapterOptionsType<Adapter>,
      ExtractAdapterMethodType<Adapter>
    >
  >;
  abortKeyMapper: (request: RequestInstance) => string = getSimpleKey;
  cacheKeyMapper: (request: RequestInstance) => string = getRequestKey;
  queueKeyMapper: (request: RequestInstance) => string = getRequestKey;
  effectKeyMapper: (request: RequestInstance) => string = getSimpleKey;

  // Utils

  /**
   * Method to stringify query params from objects.
   */
  stringifyQueryParams: StringifyCallbackType = (queryParams) =>
    stringifyQueryParams(queryParams, this.queryParamsConfig);
  /**
   * Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats.
   */
  headerMapper: HeaderMappingType = getAdapterHeaders;
  /**
   * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
   */
  payloadMapper: AdapterPayloadMappingType = getAdapterPayload;
  /**
   * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
   */
  // eslint-disable-next-line class-methods-use-this
  endpointMapper = ((endpoint) => endpoint) as EndpointMapper;

  // Logger
  logger = this.loggerManager.init("Client");

  constructor(public options: ClientOptionsType<Client<GlobalErrorType, Adapter, EndpointMapper>>) {
    const { url, adapter, appManager, cache, fetchDispatcher, submitDispatcher } = this.options;
    this.url = url;
    this.adapter = (adapter || defaultAdapter) as Adapter;

    // IMPORTANT: Do not change initialization order as it's crucial for dependencies injection
    this.appManager = appManager?.(this) || new AppManager();
    this.cache = (cache?.(this) || new Cache(this)) as Cache<this>;
    this.fetchDispatcher = fetchDispatcher?.(this) || new Dispatcher(this);
    this.submitDispatcher = submitDispatcher?.(this) || new Dispatcher(this);
  }

  /**
   * This method allows to configure global defaults for the request configuration like method, auth, deduplication etc.
   */
  setRequestDefaultOptions = (
    callback: typeof this.requestDefaultOptions,
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.requestDefaultOptions = callback;
    return this;
  };

  setAdapterDefaultOptions = (
    callback: (request: RequestInstance) => ExtractAdapterOptionsType<Adapter>,
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.adapterDefaultOptions = callback;
    return this;
  };

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (debug: boolean): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.debug = debug;
    return this;
  };

  /**
   * Set the logger severity of the messages displayed to the console
   */
  setLoggerSeverity = (severity: SeverityType): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.loggerManager.setSeverity(severity);
    return this;
  };

  /**
   * Set the new logger instance to the Client
   */
  setLogger = (
    callback: (Client: ClientInstance) => LoggerManager,
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Set config for the query params stringify method, we can set here, among others, arrayFormat, skipNull, encode, skipEmptyString and more
   */
  setQueryParamsConfig = (
    queryParamsConfig: QueryStringifyOptionsType,
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.queryParamsConfig = queryParamsConfig;
    return this;
  };

  /**
   * Set the custom query params stringify method to the Client
   * @param stringifyFn Custom callback handling query params stringify
   */
  setStringifyQueryParams = (stringifyFn: StringifyCallbackType): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.stringifyQueryParams = stringifyFn;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = (headerMapper: HeaderMappingType): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.headerMapper = headerMapper;
    return this;
  };

  /**
   * Set the request payload mapping function which get triggered before request get send
   */
  setPayloadMapper = (payloadMapper: AdapterPayloadMappingType): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.payloadMapper = payloadMapper;
    return this;
  };

  /**
   * Set globally if mocking should be enabled or disabled for all client requests.
   * @param isMockEnabled
   */
  setEnableGlobalMocking = (isMockEnabled: boolean) => {
    this.isMockEnabled = isMockEnabled;
    return this;
  };

  /**
   * Set the request payload mapping function which get triggered before request get send
   */
  setEndpointMapper = <NewEndpointMapper extends DefaultEndpointMapper<ExtractAdapterEndpointType<Adapter>>>(
    endpointMapper: NewEndpointMapper,
  ) => {
    this.endpointMapper = endpointMapper as any;
    return this as unknown as Client<GlobalErrorType, Adapter, NewEndpointMapper>;
  };

  /**
   * Set custom http adapter to handle graphql, rest, firebase or others
   */
  setAdapter = <NewAdapter extends AdapterInstance, Returns extends AdapterInstance | ClientInstance>(
    callback: (client: this) => Returns extends AdapterInstance ? NewAdapter : Returns,
  ): Returns extends ClientInstance
    ? Returns
    : Client<
        GlobalErrorType,
        Returns extends AdapterInstance ? NewAdapter : ExtractAdapterType<NewAdapter>,
        EndpointMapper
      > => {
    const value = callback(this) as Adapter | ClientInstance;

    if (value instanceof Client) {
      return value as any;
    }

    this.adapter = value as Adapter;
    return this as any;
  };

  /**
   * Set default method for requests.
   */
  setDefaultMethod = (defaultMethod: ExtractAdapterMethodType<Adapter>) => {
    this.defaultMethod = defaultMethod;
    return this;
  };

  /**
   * Set default additional data for initial state.
   */
  setDefaultExtra = (defaultExtra: ExtractAdapterExtraType<Adapter>) => {
    this.defaultExtra = defaultExtra;
    return this;
  };

  /**
   * Method of manipulating requests before sending the request. We can for example add custom header with token to the request which request had the auth set to true.
   */
  onAuth = (callback: RequestInterceptorType): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onAuthCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on auth.
   * */
  removeOnAuthInterceptors = (
    callbacks: RequestInterceptorType[],
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onAuthCallbacks = this.__onAuthCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting error responses. It can be used for example to refresh tokens.
   */
  onError = <ErrorType = null>(
    callback: ResponseInterceptorType<any, ErrorType | GlobalErrorType, Adapter>,
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onErrorCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on error.
   * */
  removeOnErrorInterceptors = (
    callbacks: ResponseInterceptorType<any, null | GlobalErrorType, Adapter>[],
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onErrorCallbacks = this.__onErrorCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting success responses.
   */
  onSuccess = <ErrorType = null>(
    callback: ResponseInterceptorType<any, ErrorType | GlobalErrorType, Adapter>,
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onSuccessCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on success.
   * */
  removeOnSuccessInterceptors = (
    callbacks: ResponseInterceptorType<any, null | GlobalErrorType, Adapter>[],
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onSuccessCallbacks = this.__onSuccessCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method of manipulating requests before sending the request.
   */
  onRequest = (callback: RequestInterceptorType): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onRequestCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on request.
   * */
  removeOnRequestInterceptors = (
    callbacks: RequestInterceptorType[],
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onRequestCallbacks = this.__onRequestCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting any responses.
   */
  onResponse = <ErrorType = null>(
    callback: ResponseInterceptorType<any, ErrorType | GlobalErrorType, Adapter>,
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onResponseCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on request.
   * */
  removeOnResponseInterceptors = (
    callbacks: ResponseInterceptorType<any, null | GlobalErrorType, Adapter>[],
  ): Client<GlobalErrorType, Adapter, EndpointMapper> => {
    this.__onResponseCallbacks = this.__onResponseCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Add persistent effects which trigger on the request lifecycle
   */
  addEffect = (effect: RequestEffectInstance | RequestEffectInstance[]) => {
    this.effects = this.effects.concat(effect);

    return this;
  };

  /**
   * Remove effects from Client
   */
  removeEffect = (effect: RequestEffectInstance | string) => {
    const name = typeof effect === "string" ? effect : effect.getEffectKey();
    this.effects = this.effects.filter((currentEffect) => currentEffect.getEffectKey() !== name);

    return this;
  };

  /**
   * Key setters
   */

  setAbortKeyMapper = (callback: (request: RequestInstance) => string) => {
    this.abortKeyMapper = callback;
  };
  setCacheKeyMapper = (callback: (request: RequestInstance) => string) => {
    this.cacheKeyMapper = callback;
  };
  setQueueKeyMapper = (callback: (request: RequestInstance) => string) => {
    this.queueKeyMapper = callback;
  };
  setEffectKeyMapper = (callback: (request: RequestInstance) => string) => {
    this.effectKeyMapper = callback;
  };

  /**
   * Helper used by http adapter to apply the modifications on response error
   */
  __modifyAuth = async (request: RequestInstance) => interceptRequest(this.__onAuthCallbacks, request);

  /**
   * Private helper to run async pre-request processing
   */
  __modifyRequest = async (request: RequestInstance) => interceptRequest(this.__onRequestCallbacks, request);

  /**
   * Private helper to run async on-error response processing
   */
  __modifyErrorResponse = async (response: ResponseType<any, GlobalErrorType, Adapter>, request: RequestInstance) =>
    interceptResponse<GlobalErrorType, Adapter>(this.__onErrorCallbacks, response, request);

  /**
   * Private helper to run async on-success response processing
   */
  __modifySuccessResponse = async (response: ResponseType<any, GlobalErrorType, Adapter>, request: RequestInstance) =>
    interceptResponse<GlobalErrorType, Adapter>(this.__onSuccessCallbacks, response, request);

  /**
   * Private helper to run async response processing
   */
  __modifyResponse = async (response: ResponseType<any, GlobalErrorType, Adapter>, request: RequestInstance) =>
    interceptResponse<GlobalErrorType, Adapter>(this.__onResponseCallbacks, response, request);

  /**
   * Clears the Client instance and remove all listeners on it's dependencies
   */
  clear = () => {
    const { appManager, cache, fetchDispatcher, submitDispatcher } = this.options;

    this.requestManager.abortControllers.clear();
    this.fetchDispatcher.clear();
    this.submitDispatcher.clear();
    this.cache.clear();

    this.requestManager.emitter.removeAllListeners();
    this.fetchDispatcher.emitter.removeAllListeners();
    this.submitDispatcher.emitter.removeAllListeners();
    this.cache.emitter.removeAllListeners();

    this.appManager = appManager?.(this) || new AppManager();
    this.cache = (cache?.(this) || new Cache(this)) as Cache<this>;
    this.fetchDispatcher = fetchDispatcher?.(this) || new Dispatcher(this);
    this.submitDispatcher = submitDispatcher?.(this) || new Dispatcher(this);
  };

  /**
   * Create requests based on the Client setup
   *
   * @template Response Your response
   */
  createRequest = <
    RequestProperties extends RequestGenericType<ExtractAdapterQueryParamsType<Adapter>> = {
      response?: undefined;
      payload?: undefined;
      error?: Error;
      queryParams?: ExtractAdapterQueryParamsType<Adapter>;
      endpoint?: string;
    },
  >(
    /**
     * `createRequest` must be initialized twice(currying).
     *
     * ✅ Good:
     * ```ts
     * const request = createRequest<RequestProperties>()(params)
     * ```
     * ⛔ Bad:
     * ```ts
     * const request = createRequest<RequestProperties>(params)
     * ```
     *
     * We are using currying to achieve auto generated types for the endpoint string.
     *
     * This solution will be removed once https://github.com/microsoft/TypeScript/issues/10571 get resolved.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _USE_DOUBLE_INITIALIZATION?: never,
  ) => {
    type Response = TypeWithDefaults<RequestProperties, "response", undefined>;
    type Payload = TypeWithDefaults<RequestProperties, "payload", undefined>;
    type LocalError = TypeWithDefaults<RequestProperties, "error", GlobalErrorType>;
    type QueryParams = TypeWithDefaults<RequestProperties, "queryParams", ExtractAdapterQueryParamsType<Adapter>>;

    return <
      EndpointType extends ExtractAdapterEndpointType<Adapter>,
      AdapterOptions extends ExtractAdapterOptionsType<Adapter>,
      MethodType extends ExtractAdapterMethodType<Adapter>,
    >(
      params: RequestOptionsType<EndpointType, AdapterOptions, MethodType>,
    ) => {
      const endpoint = this.endpointMapper(params.endpoint);

      // Splitting this type prevents "Type instantiation is excessively deep and possibly infinite" error
      type ExtractedAdapter = ExtractUnionAdapter<
        Adapter,
        {
          method: MethodType;
          options: AdapterOptions;
          queryParams: QueryParams;
        }
      >;
      type ExtractedAdapterType = ExtractedAdapter extends NegativeTypes ? Adapter : ExtractedAdapter;

      const mappedParams: RequestOptionsType<
        EndpointType extends string ? EndpointType : typeof endpoint,
        AdapterOptions,
        MethodType
      > = {
        ...params,
        endpoint: endpoint as EndpointType extends string ? EndpointType : typeof endpoint,
      };

      const request = new Request<
        Response,
        Payload,
        QueryParams,
        LocalError,
        EndpointType extends string ? EndpointType : typeof endpoint,
        Client<GlobalErrorType, ExtractedAdapterType, EndpointMapper>
      >(this as unknown as Client<GlobalErrorType, ExtractedAdapterType, EndpointMapper>, mappedParams);

      if (process?.env?.NODE_ENV === "development") {
        this.__requestsMap.push(request);
      }

      return request;
    };
  };

  addPlugin = <NewClient extends ClientInstance>(callback: (client: typeof this) => NewClient) => {
    return callback(this);
  };
}
