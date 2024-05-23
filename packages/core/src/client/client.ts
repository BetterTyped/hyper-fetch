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
  ExtractAdapterEndpointType,
} from "adapter";
import {
  ClientErrorType,
  ClientInstance,
  ClientOptionsType,
  DefaultEndpointMapper,
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
import { NegativeTypes, TypeWithDefaults } from "types";

/**
 * **Client** is a class that allows you to configure the connection with the server and then use it to create
 * requests which, when called using the appropriate method, will cause the server to be queried for the endpoint and
 * method specified in the request.
 */
export class Client<
  Types extends {
    error?: ClientErrorType;
    adapter?: AdapterInstance;
    mapper?: DefaultEndpointMapper;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {
    error: Error;
    adapter: AdapterType;
    mapper: DefaultEndpointMapper;
  },
> {
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
  adapter: TypeWithDefaults<Types, "adapter", AdapterType>;
  cache: Cache<this>;
  fetchDispatcher: Dispatcher;
  submitDispatcher: Dispatcher;

  defaultMethod: ExtractAdapterMethodType<TypeWithDefaults<Types, "adapter", AdapterType>> =
    HttpMethodsEnum.get as ExtractAdapterMethodType<TypeWithDefaults<Types, "adapter", AdapterType>>;
  defaultExtra: ExtractAdapterExtraType<TypeWithDefaults<Types, "adapter", AdapterType>> =
    xhrExtra as ExtractAdapterExtraType<TypeWithDefaults<Types, "adapter", AdapterType>>;

  isMockEnabled = true;

  // Registered requests effect
  effects: RequestEffectInstance[] = [];

  // Options
  queryParamsConfig?: QueryStringifyOptionsType;
  adapterDefaultOptions?: (
    request: RequestInstance,
  ) => ExtractAdapterOptionsType<TypeWithDefaults<Types, "adapter", AdapterType>>;
  requestDefaultOptions?: (
    options: RequestOptionsType<
      string,
      ExtractAdapterOptionsType<TypeWithDefaults<Types, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Types, "adapter", AdapterType>>
    >,
  ) => Partial<
    RequestOptionsType<
      string,
      ExtractAdapterOptionsType<TypeWithDefaults<Types, "adapter", AdapterType>>,
      ExtractAdapterMethodType<TypeWithDefaults<Types, "adapter", AdapterType>>
    >
  >;
  abortKeyMapper?: (request: RequestInstance) => string = getSimpleKey;
  cacheKeyMapper?: (request: RequestInstance) => string = getRequestKey;
  queueKeyMapper?: (request: RequestInstance) => string = getRequestKey;
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
  /**
   * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
   */
  // eslint-disable-next-line class-methods-use-this
  endpointMapper: TypeWithDefaults<Types, "mapper", DefaultEndpointMapper> = ((endpoint) => endpoint) as any;

  // Logger
  logger = this.loggerManager.init("Client");

  constructor(public options: ClientOptionsType<Client<Types>>) {
    const { url, adapter, appManager, cache, fetchDispatcher, submitDispatcher } = this.options;
    this.url = url;
    this.adapter = (adapter || defaultAdapter) as TypeWithDefaults<Types, "adapter", AdapterType>;

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
    ) => Partial<
      RequestOptionsType<
        string,
        ExtractAdapterOptionsType<TypeWithDefaults<Types, "adapter", AdapterType>>,
        ExtractAdapterMethodType<TypeWithDefaults<Types, "adapter", AdapterType>>
      >
    >,
  ): Client<Types> => {
    this.requestDefaultOptions = callback as unknown as Client<Types>["requestDefaultOptions"];
    return this;
  };

  setAdapterDefaultOptions = (
    callback: (request: RequestInstance) => ExtractAdapterOptionsType<TypeWithDefaults<Types, "adapter", AdapterType>>,
  ): Client<Types> => {
    this.adapterDefaultOptions = callback;
    return this;
  };

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (debug: boolean): Client<Types> => {
    this.debug = debug;
    return this;
  };

  /**
   * Set the logger severity of the messages displayed to the console
   */
  setLoggerSeverity = (severity: SeverityType): Client<Types> => {
    this.loggerManager.setSeverity(severity);
    return this;
  };

  /**
   * Set the new logger instance to the Client
   */
  setLogger = (callback: (Client: ClientInstance) => LoggerManager): Client<Types> => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Set config for the query params stringify method, we can set here, among others, arrayFormat, skipNull, encode, skipEmptyString and more
   */
  setQueryParamsConfig = (queryParamsConfig: QueryStringifyOptionsType): Client<Types> => {
    this.queryParamsConfig = queryParamsConfig;
    return this;
  };

  /**
   * Set the custom query params stringify method to the Client
   * @param stringifyFn Custom callback handling query params stringify
   */
  setStringifyQueryParams = (stringifyFn: StringifyCallbackType): Client<Types> => {
    this.stringifyQueryParams = stringifyFn;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = (headerMapper: HeaderMappingType): Client<Types> => {
    this.headerMapper = headerMapper;
    return this;
  };

  /**
   * Set the request payload mapping function which get triggered before request get send
   */
  setPayloadMapper = (payloadMapper: AdapterPayloadMappingType): Client<Types> => {
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
  setEndpointMapper = <NewEndpointMapper extends DefaultEndpointMapper>(endpointMapper: NewEndpointMapper) => {
    this.endpointMapper = endpointMapper as any;
    return this as unknown as Client<{
      error: TypeWithDefaults<Types, "error", Error>;
      adapter: TypeWithDefaults<Types, "adapter", AdapterType>;
      mapper: NewEndpointMapper;
    }>;
  };

  /**
   * Set custom http adapter to handle graphql, rest, firebase or others
   */
  setAdapter = <NewAdapter extends AdapterInstance, Returns extends AdapterInstance | ClientInstance>(
    callback: (client: this) => Returns extends AdapterInstance
      ? NewAdapter
      : Client<{
          error: TypeWithDefaults<Types, "error", Error>;
          adapter: NewAdapter;
          mapper: TypeWithDefaults<Types, "mapper", DefaultEndpointMapper>;
        }>,
  ): Client<{
    error: TypeWithDefaults<Types, "error", Error>;
    adapter: NewAdapter;
    // adapter: Returns extends AdapterInstance ? NewAdapter : ExtractClientAdapterType<NewAdapter>;
    mapper: TypeWithDefaults<Types, "mapper", DefaultEndpointMapper>;
  }> => {
    const value = callback(this) as unknown as TypeWithDefaults<Types, "adapter", AdapterType>;

    if (value instanceof Client) {
      return value as any;
    }

    this.adapter = value;
    return this as any;
  };

  /**
   * Set default method for requests.
   */
  setDefaultMethod = (defaultMethod: ExtractAdapterMethodType<TypeWithDefaults<Types, "adapter", AdapterType>>) => {
    this.defaultMethod = defaultMethod;
    return this as Client<Types>;
  };

  /**
   * Set default additional data for initial state.
   */
  setDefaultExtra = (defaultExtra: ExtractAdapterExtraType<TypeWithDefaults<Types, "adapter", AdapterType>>) => {
    this.defaultExtra = defaultExtra;
    return this as Client<Types>;
  };

  /**
   * Method of manipulating requests before sending the request. We can for example add custom header with token to the request which request had the auth set to true.
   */
  onAuth = (callback: RequestInterceptorType): Client<Types> => {
    this.__onAuthCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on auth.
   * */
  removeOnAuthInterceptors = (callbacks: RequestInterceptorType[]): Client<Types> => {
    this.__onAuthCallbacks = this.__onAuthCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting error responses. It can be used for example to refresh tokens.
   */
  onError = <ErrorType = null>(
    callback: ResponseInterceptorType<
      any,
      ErrorType | TypeWithDefaults<Types, "error", Error>,
      TypeWithDefaults<Types, "adapter", AdapterType>
    >,
  ): Client<Types> => {
    this.__onErrorCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on error.
   * */
  removeOnErrorInterceptors = (
    callbacks: ResponseInterceptorType<
      any,
      null | TypeWithDefaults<Types, "error", Error>,
      TypeWithDefaults<Types, "adapter", AdapterType>
    >[],
  ): Client<Types> => {
    this.__onErrorCallbacks = this.__onErrorCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting success responses.
   */
  onSuccess = <ErrorType = null>(
    callback: ResponseInterceptorType<
      any,
      ErrorType | TypeWithDefaults<Types, "error", Error>,
      TypeWithDefaults<Types, "adapter", AdapterType>
    >,
  ): Client<Types> => {
    this.__onSuccessCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on success.
   * */
  removeOnSuccessInterceptors = (
    callbacks: ResponseInterceptorType<
      any,
      null | TypeWithDefaults<Types, "error", Error>,
      TypeWithDefaults<Types, "adapter", AdapterType>
    >[],
  ): Client<Types> => {
    this.__onSuccessCallbacks = this.__onSuccessCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method of manipulating requests before sending the request.
   */
  onRequest = (callback: RequestInterceptorType): Client<Types> => {
    this.__onRequestCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on request.
   * */
  removeOnRequestInterceptors = (callbacks: RequestInterceptorType[]): Client<Types> => {
    this.__onRequestCallbacks = this.__onRequestCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting any responses.
   */
  onResponse = <ErrorType = null>(
    callback: ResponseInterceptorType<
      any,
      ErrorType | TypeWithDefaults<Types, "error", Error>,
      TypeWithDefaults<Types, "adapter", AdapterType>
    >,
  ): Client<Types> => {
    this.__onResponseCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on request.
   * */
  removeOnResponseInterceptors = (
    callbacks: ResponseInterceptorType<
      any,
      null | TypeWithDefaults<Types, "error", Error>,
      TypeWithDefaults<Types, "adapter", AdapterType>
    >[],
  ): Client<Types> => {
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
  __modifyErrorResponse = async (
    response: ResponseReturnType<
      any,
      TypeWithDefaults<Types, "error", Error>,
      TypeWithDefaults<Types, "adapter", AdapterType>
    >,
    request: RequestInstance,
  ) =>
    interceptResponse<TypeWithDefaults<Types, "error", Error>, TypeWithDefaults<Types, "adapter", AdapterType>>(
      this.__onErrorCallbacks,
      response,
      request,
    );

  /**
   * Private helper to run async on-success response processing
   */
  __modifySuccessResponse = async (
    response: ResponseReturnType<
      any,
      TypeWithDefaults<Types, "error", Error>,
      TypeWithDefaults<Types, "adapter", AdapterType>
    >,
    request: RequestInstance,
  ) =>
    interceptResponse<TypeWithDefaults<Types, "error", Error>, TypeWithDefaults<Types, "adapter", AdapterType>>(
      this.__onSuccessCallbacks,
      response,
      request,
    );

  /**
   * Private helper to run async response processing
   */
  __modifyResponse = async (
    response: ResponseReturnType<
      any,
      TypeWithDefaults<Types, "error", Error>,
      TypeWithDefaults<Types, "adapter", AdapterType>
    >,
    request: RequestInstance,
  ) =>
    interceptResponse<TypeWithDefaults<Types, "error", Error>, TypeWithDefaults<Types, "adapter", AdapterType>>(
      this.__onResponseCallbacks,
      response,
      request,
    );

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
    this.cache = (cache?.(this) as Cache<this>) || new Cache(this);
    this.fetchDispatcher = fetchDispatcher?.(this) || new Dispatcher(this);
    this.submitDispatcher = submitDispatcher?.(this) || new Dispatcher(this);
  };

  /**
   * Create requests based on the Client setup
   */
  createRequest = <
    Properties extends {
      response?: any;
      payload?: any;
      error?: any;
      queryParams?: ExtractAdapterQueryParamsType<TypeWithDefaults<Types, "adapter", AdapterType>>;
    } = {
      response?: undefined;
      payload?: undefined;
      error?: Error;
      queryParams?: ExtractAdapterQueryParamsType<TypeWithDefaults<Types, "adapter", AdapterType>>;
    },
  >() => {
    type Response = TypeWithDefaults<Properties, "response", undefined>;
    type Payload = TypeWithDefaults<Properties, "payload", undefined>;
    type LocalError = TypeWithDefaults<Properties, "error", Error>;
    type QueryParams = TypeWithDefaults<
      Properties,
      "queryParams",
      ExtractAdapterQueryParamsType<TypeWithDefaults<Types, "adapter", AdapterType>>
    >;

    return <
      EndpointType extends ExtractAdapterEndpointType<TypeWithDefaults<Types, "adapter", AdapterType>>,
      AdapterOptions extends ExtractAdapterOptionsType<TypeWithDefaults<Types, "adapter", AdapterType>>,
      MethodType extends ExtractAdapterMethodType<TypeWithDefaults<Types, "adapter", AdapterType>>,
    >(
      params: RequestOptionsType<EndpointType, AdapterOptions, MethodType>,
    ) => {
      const endpoint = this.endpointMapper(params.endpoint);

      type ExtractedAdapterType =
        ExtractUnionAdapter<
          TypeWithDefaults<Types, "adapter", AdapterType>,
          {
            method: MethodType;
            options: AdapterOptions;
            queryParams: QueryParams;
          }
        > extends NegativeTypes
          ? TypeWithDefaults<Types, "adapter", AdapterType>
          : ExtractUnionAdapter<
              TypeWithDefaults<Types, "adapter", AdapterType>,
              {
                method: MethodType;
                options: AdapterOptions;
                queryParams: QueryParams;
              }
            >;

      const mappedParams: RequestOptionsType<
        EndpointType extends string ? EndpointType : typeof endpoint,
        AdapterOptions,
        MethodType
      > = {
        ...params,
        endpoint: endpoint as EndpointType extends string ? EndpointType : typeof endpoint,
      };

      return new Request<{
        response: Response;
        payload: Payload;
        queryParams: QueryParams;
        globalError: TypeWithDefaults<Types, "error", Error>;
        localError: LocalError;
        endpoint: EndpointType extends string ? EndpointType : typeof endpoint;
        adapter: ExtractedAdapterType;
      }>(this as any, mappedParams);
    };
  };
}
