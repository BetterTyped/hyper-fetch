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
  ResponseReturnType,
  xhrExtra,
} from "adapter";
import {
  ClientErrorType,
  ClientInstance,
  ClientOptionsType,
  getAdapterHeaders,
  getAdapterPayload,
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
import { HttpMethodsEnum } from "../constants/http.constants";

/**
 * **Client** is a class that allows you to configure the connection with the server and then use it to create
 * requests which, when called using the appropriate method, will cause the server to be queried for the endpoint and
 * method specified in the request.
 */
export class Client<GlobalErrorType extends ClientErrorType = Error, Adapter extends AdapterInstance = AdapterType> {
  readonly url: string;
  public debug: boolean;

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

  defaultMethod: ExtractAdapterMethodType<Adapter> = HttpMethodsEnum.get as ExtractAdapterMethodType<Adapter>;
  defaultExtra: ExtractAdapterExtraType<Adapter> = xhrExtra as ExtractAdapterExtraType<Adapter>;

  // Registered requests effect
  effects: RequestEffectInstance[] = [];

  // Options
  queryParamsConfig?: QueryStringifyOptionsType;
  adapterDefaultOptions?: (request: RequestInstance) => ExtractAdapterOptionsType<Adapter>;
  requestDefaultOptions?: (
    options: RequestOptionsType<string, ExtractAdapterOptionsType<Adapter>, ExtractAdapterMethodType<Adapter>>,
  ) => Partial<RequestOptionsType<string, ExtractAdapterOptionsType<Adapter>, ExtractAdapterMethodType<Adapter>>>;
  abortKeyMapper?: (request: RequestInstance) => string = getSimpleKey;
  cacheKeyMapper?: (request: RequestInstance) => string = getRequestKey;
  queueKeyMapper?: (request: RequestInstance) => string = getSimpleKey;
  effectKeyMapper?: (request: RequestInstance) => string = getSimpleKey;

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

  // Logger
  logger = this.loggerManager.init("Client");

  constructor(public options: ClientOptionsType<Client<GlobalErrorType, Adapter>>) {
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
    callback: (
      request: RequestInstance,
    ) => Partial<RequestOptionsType<string, ExtractAdapterOptionsType<Adapter>, ExtractAdapterMethodType<Adapter>>>,
  ): Client<GlobalErrorType, Adapter> => {
    this.requestDefaultOptions = callback;
    return this;
  };

  setAdapterDefaultOptions = (
    callback: (request: RequestInstance) => ExtractAdapterOptionsType<Adapter>,
  ): Client<GlobalErrorType, Adapter> => {
    this.adapterDefaultOptions = callback;
    return this;
  };

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (debug: boolean): Client<GlobalErrorType, Adapter> => {
    this.debug = debug;
    return this;
  };

  /**
   * Set the logger severity of the messages displayed to the console
   */
  setLoggerSeverity = (severity: SeverityType): Client<GlobalErrorType, Adapter> => {
    this.loggerManager.setSeverity(severity);
    return this;
  };

  /**
   * Set the new logger instance to the Client
   */
  setLogger = (callback: (Client: ClientInstance) => LoggerManager): Client<GlobalErrorType, Adapter> => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Set config for the query params stringify method, we can set here, among others, arrayFormat, skipNull, encode, skipEmptyString and more
   */
  setQueryParamsConfig = (queryParamsConfig: QueryStringifyOptionsType): Client<GlobalErrorType, Adapter> => {
    this.queryParamsConfig = queryParamsConfig;
    return this;
  };

  /**
   * Set the custom query params stringify method to the Client
   * @param stringifyFn Custom callback handling query params stringify
   */
  setStringifyQueryParams = (stringifyFn: StringifyCallbackType): Client<GlobalErrorType, Adapter> => {
    this.stringifyQueryParams = stringifyFn;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = (headerMapper: HeaderMappingType): Client<GlobalErrorType, Adapter> => {
    this.headerMapper = headerMapper;
    return this;
  };

  /**
   * Set the request payload mapping function which get triggered before request get send
   */
  setPayloadMapper = (payloadMapper: AdapterPayloadMappingType): Client<GlobalErrorType, Adapter> => {
    this.payloadMapper = payloadMapper;
    return this;
  };

  /**
   * Set custom http adapter to handle graphql, rest, firebase or others
   */
  setAdapter = <NewAdapter extends AdapterInstance>(
    callback: (Client: ClientInstance) => NewAdapter,
  ): Client<GlobalErrorType, NewAdapter> => {
    this.adapter = callback(this) as unknown as Adapter;
    return this as unknown as Client<GlobalErrorType, NewAdapter>;
  };

  /**
   * Set default method for requests.
   */
  setDefaultMethod = (defaultMethod: ExtractAdapterMethodType<Adapter>) => {
    this.defaultMethod = defaultMethod;
    return this as ClientInstance;
  };

  /**
   * Set default additional data for initial state.
   */
  setDefaultExtra = (defaultExtra: ExtractAdapterExtraType<Adapter>) => {
    this.defaultExtra = defaultExtra;
    return this as ClientInstance;
  };

  /**
   * Method of manipulating requests before sending the request. We can for example add custom header with token to the request which request had the auth set to true.
   */
  onAuth = (callback: RequestInterceptorType): Client<GlobalErrorType, Adapter> => {
    this.__onAuthCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting error responses. It can be used for example to refresh tokens.
   */
  onError = <ErrorType = null>(
    callback: ResponseInterceptorType<any, ErrorType | GlobalErrorType, Adapter>,
  ): Client<GlobalErrorType, Adapter> => {
    this.__onErrorCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting success responses.
   */
  onSuccess = <ErrorType = null>(
    callback: ResponseInterceptorType<any, ErrorType | GlobalErrorType, Adapter>,
  ): Client<GlobalErrorType, Adapter> => {
    this.__onSuccessCallbacks.push(callback);
    return this;
  };

  /**
   * Method of manipulating requests before sending the request.
   */
  onRequest = (callback: RequestInterceptorType): Client<GlobalErrorType, Adapter> => {
    this.__onRequestCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting any responses.
   */
  onResponse = <ErrorType = null>(
    callback: ResponseInterceptorType<any, ErrorType | GlobalErrorType, Adapter>,
  ): Client<GlobalErrorType, Adapter> => {
    this.__onResponseCallbacks.push(callback);
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
  __modifyErrorResponse = async (
    response: ResponseReturnType<any, GlobalErrorType, Adapter>,
    request: RequestInstance,
  ) => interceptResponse<GlobalErrorType, Adapter>(this.__onErrorCallbacks, response, request);

  /**
   * Private helper to run async on-success response processing
   */
  __modifySuccessResponse = async (
    response: ResponseReturnType<any, GlobalErrorType, Adapter>,
    request: RequestInstance,
  ) => interceptResponse<GlobalErrorType, Adapter>(this.__onSuccessCallbacks, response, request);

  /**
   * Private helper to run async response processing
   */
  __modifyResponse = async (response: ResponseReturnType<any, GlobalErrorType, Adapter>, request: RequestInstance) =>
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
   */
  createRequest = <
    Response,
    Payload = undefined,
    LocalError extends ClientErrorType | undefined = undefined,
    QueryParams = ExtractAdapterQueryParamsType<Adapter>,
  >() => {
    return <
      EndpointType extends string,
      AdapterOptions extends ExtractAdapterOptionsType<Adapter>,
      MethodType extends ExtractAdapterMethodType<Adapter>,
    >(
      params: RequestOptionsType<EndpointType, AdapterOptions, MethodType>,
    ) =>
      new Request<
        Response,
        Payload,
        QueryParams,
        GlobalErrorType,
        LocalError,
        EndpointType,
        ExtractUnionAdapter<
          Adapter,
          {
            method: MethodType;
            options: AdapterOptions;
            queryParams: QueryParams;
          }
        >
      >(this as any, params);
  };
}
