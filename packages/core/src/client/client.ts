import { AdapterInstance, ResponseType } from "adapter";
import { HttpAdapterType, xhrExtra, parseResponse, HttpAdapter } from "http-adapter";
import {
  ClientErrorType,
  ClientInstance,
  ClientOptionsType,
  RequestGenericType,
  RequestInterceptorType,
  ResponseInterceptorType,
} from "client";
import { Cache } from "cache";
import { Dispatcher } from "dispatcher";
import { PluginInstance, PluginMethodParameters, PluginMethods } from "plugin";
import { getRequestKey, getSimpleKey, Request, RequestInstance, RequestOptionsType } from "request";
import { AppManager, LoggerManager, RequestManager, LogLevel } from "managers";
import { interceptRequest, interceptResponse } from "./client.utils";
import { HttpMethods } from "../constants/http.constants";
import {
  EmptyTypes,
  TypeWithDefaults,
  ExtractAdapterExtraType,
  ExtractAdapterMethodType,
  ExtractAdapterOptionsType,
  ExtractAdapterQueryParamsType,
  ExtractAdapterEndpointType,
  ExtractUnionAdapter,
} from "types";
import { HydrateDataType, HydrationOptions } from "utils";

/**
 * **Client** is a class that allows you to configure the connection with the server and then use it to create
 * requests. It allows you to set global defaults for the requests configuration, query params configuration.
 * It is also orchestrator for all of the HyperFetch modules like Cache, Dispatcher, AppManager, LoggerManager,
 * RequestManager and more.
 */
export class Client<
  GlobalErrorType extends ClientErrorType = Error,
  Adapter extends AdapterInstance = HttpAdapterType,
> {
  readonly url: string;
  public debug: boolean;

  // Private
  unsafe_onErrorCallbacks: ResponseInterceptorType<ClientInstance>[] = [];
  unsafe_onSuccessCallbacks: ResponseInterceptorType<ClientInstance>[] = [];
  unsafe_onResponseCallbacks: ResponseInterceptorType<ClientInstance>[] = [];
  unsafe_onAuthCallbacks: RequestInterceptorType[] = [];
  unsafe_onRequestCallbacks: RequestInterceptorType[] = [];

  // Managers
  loggerManager: LoggerManager = new LoggerManager();
  requestManager: RequestManager = new RequestManager();
  appManager: AppManager;

  // Config
  adapter: Adapter;
  cache: Cache;
  fetchDispatcher: Dispatcher;
  submitDispatcher: Dispatcher;

  defaultMethod: ExtractAdapterMethodType<Adapter> = HttpMethods.GET as ExtractAdapterMethodType<Adapter>;
  defaultExtra: ExtractAdapterExtraType<Adapter> = xhrExtra as ExtractAdapterExtraType<Adapter>;

  isMockerEnabled = true;

  // Registered requests effect
  plugins: PluginInstance[] = [];

  unsafe_abortKeyMapper: (request: RequestInstance) => string = getSimpleKey;
  unsafe_cacheKeyMapper: (request: RequestInstance) => string = getRequestKey;
  unsafe_queryKeyMapper: (request: RequestInstance) => string = getRequestKey;

  // Logger
  logger = this.loggerManager.initialize(this, "Client");

  constructor(public options: ClientOptionsType<Client<GlobalErrorType, Adapter>>) {
    const { url, adapter, appManager, cache, fetchDispatcher, submitDispatcher } = this.options;
    this.url = url;
    this.adapter = (adapter || HttpAdapter()) as Adapter;

    this.appManager = appManager?.() || new AppManager();
    this.cache = cache?.() || new Cache();
    this.fetchDispatcher = fetchDispatcher?.() || new Dispatcher();
    this.submitDispatcher = submitDispatcher?.() || new Dispatcher();

    // IMPORTANT: Do not change initialization order as it's crucial for dependencies injection
    this.adapter.initialize(this);
    this.appManager.initialize();
    this.cache.initialize(this);
    this.fetchDispatcher.initialize(this);
    this.submitDispatcher.initialize(this);
  }

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (enabled: boolean): Client<GlobalErrorType, Adapter> => {
    this.debug = enabled;
    return this;
  };

  /**
   * Set the logger severity of the messages displayed to the console
   */
  setLogLevel = (severity: LogLevel): Client<GlobalErrorType, Adapter> => {
    this.loggerManager.setSeverity(severity);
    return this;
  };

  /**
   * Set the new logger instance to the Client
   */
  setLogger = (callback: (Client: ClientInstance) => LoggerManager): Client<GlobalErrorType, Adapter> => {
    this.loggerManager = callback(this);
    this.loggerManager.initialize(this, "Client");
    return this;
  };

  /**
   * Set globally if mocking should be enabled or disabled for all client requests.
   * @param isMockerEnabled
   */
  setEnableGlobalMocking = (isMockerEnabled: boolean) => {
    this.isMockerEnabled = isMockerEnabled;
    return this;
  };

  /**
   * Set custom http adapter to handle graphql, rest, firebase or others
   */
  setAdapter = <NewAdapter extends AdapterInstance>(adapter: NewAdapter): Client<GlobalErrorType, NewAdapter> => {
    this.adapter = adapter as unknown as Adapter;
    this.adapter.initialize(this);
    return this as unknown as Client<GlobalErrorType, NewAdapter>;
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
  onAuth = (callback: RequestInterceptorType): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onAuthCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on auth.
   * */
  removeOnAuthInterceptors = (callbacks: RequestInterceptorType[]): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onAuthCallbacks = this.unsafe_onAuthCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting error responses. It can be used for example to refresh tokens.
   */
  onError = <ErrorType = null>(
    callback: ResponseInterceptorType<ClientInstance, any, ErrorType | GlobalErrorType>,
  ): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onErrorCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on error.
   * */
  removeOnErrorInterceptors = (
    callbacks: ResponseInterceptorType<ClientInstance, any, null | GlobalErrorType>[],
  ): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onErrorCallbacks = this.unsafe_onErrorCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting success responses.
   */
  onSuccess = <ErrorType = null>(
    callback: ResponseInterceptorType<ClientInstance, any, ErrorType | GlobalErrorType>,
  ): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onSuccessCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on success.
   * */
  removeOnSuccessInterceptors = (
    callbacks: ResponseInterceptorType<ClientInstance, any, null | GlobalErrorType>[],
  ): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onSuccessCallbacks = this.unsafe_onSuccessCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method of manipulating requests before sending the request.
   */
  onRequest = (callback: RequestInterceptorType): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onRequestCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on request.
   * */
  removeOnRequestInterceptors = (callbacks: RequestInterceptorType[]): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onRequestCallbacks = this.unsafe_onRequestCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting any responses.
   */
  onResponse = <ErrorType = null>(
    callback: ResponseInterceptorType<ClientInstance, any, ErrorType | GlobalErrorType>,
  ): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onResponseCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on request.
   * */
  removeOnResponseInterceptors = (
    callbacks: ResponseInterceptorType<ClientInstance, any, null | GlobalErrorType>[],
  ): Client<GlobalErrorType, Adapter> => {
    this.unsafe_onResponseCallbacks = this.unsafe_onResponseCallbacks.filter(
      (callback) => !callbacks.includes(callback),
    );
    return this;
  };

  /**
   * Add persistent plugins which trigger on the request lifecycle
   */
  addPlugin = (plugin: PluginInstance) => {
    this.plugins.push(plugin);

    plugin.initialize(this);
    plugin.trigger("onMount", { client: this });

    return this;
  };

  /**
   * Remove plugins from Client
   */
  removePlugin = (plugin: PluginInstance) => {
    const pluginCount = this.plugins.length;
    this.plugins = this.plugins.filter((p) => p !== plugin);

    if (this.plugins.length !== pluginCount) {
      plugin.trigger("onUnmount", { client: this });
    }

    return this;
  };

  triggerPlugins = <Key extends keyof PluginMethods<Client>>(key: Key, data: PluginMethodParameters<Key, Client>) => {
    if (!this.plugins.length) {
      return this;
    }

    this.plugins.forEach((plugin) => {
      plugin.trigger(key, data);
    });

    return this;
  };

  /**
   * Key setters
   */

  setAbortKeyMapper = (callback: (request: RequestInstance) => string) => {
    this.unsafe_abortKeyMapper = callback;
  };
  setCacheKeyMapper = (callback: (request: RequestInstance) => string) => {
    this.unsafe_cacheKeyMapper = callback;
  };
  setQueueKeyMapper = (callback: (request: RequestInstance) => string) => {
    this.unsafe_queryKeyMapper = callback;
  };

  /**
   * Helper used by http adapter to apply the modifications on response error
   * @private
   */
  unsafe_modifyAuth = async (request: RequestInstance) => interceptRequest(this.unsafe_onAuthCallbacks, request);

  /**
   * Private helper to run async pre-request processing
   * @private
   */
  unsafe_modifyRequest = async (request: RequestInstance) => interceptRequest(this.unsafe_onRequestCallbacks, request);

  /**
   * Private helper to run async on-error response processing
   * @private
   */
  unsafe_modifyErrorResponse = async (
    response: ResponseType<any, GlobalErrorType, Adapter>,
    request: RequestInstance,
  ) => interceptResponse<GlobalErrorType, ClientInstance>(this.unsafe_onErrorCallbacks, response, request);

  /**
   * Private helper to run async on-success response processing
   * @private
   */
  unsafe_modifySuccessResponse = async (
    response: ResponseType<any, GlobalErrorType, Adapter>,
    request: RequestInstance,
  ) => interceptResponse<GlobalErrorType, ClientInstance>(this.unsafe_onSuccessCallbacks, response, request);

  /**
   * Private helper to run async response processing
   * @private
   */
  unsafe_modifyResponse = async (response: ResponseType<any, GlobalErrorType, Adapter>, request: RequestInstance) =>
    interceptResponse<GlobalErrorType, ClientInstance>(this.unsafe_onResponseCallbacks, response, request);

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

    this.cache = cache?.() || new Cache();
    this.appManager = appManager?.() || new AppManager();
    this.fetchDispatcher = fetchDispatcher?.() || new Dispatcher();
    this.submitDispatcher = submitDispatcher?.() || new Dispatcher();

    // DO NOT CHANGE INITIALIZATION ORDER
    this.appManager.initialize();
    this.cache.initialize(this);
    this.fetchDispatcher.initialize(this);
    this.submitDispatcher.initialize(this);
  };

  /**
   * Hydrate your SSR cache data
   * @param hydrationData
   * @param options
   */
  hydrate = (
    hydrationData: (HydrateDataType | EmptyTypes)[],
    options?: Partial<HydrationOptions> | ((item: HydrateDataType) => Partial<HydrationOptions>),
  ) => {
    hydrationData?.forEach((item) => {
      if (!item) return;

      const { cacheKey, response, ...fallbackOptions } = item;
      const defaults = {
        cache: true,
        override: true,
      } satisfies Partial<HydrationOptions>;
      const config =
        typeof options === "function"
          ? { ...defaults, ...fallbackOptions, ...options(item) }
          : { ...defaults, ...fallbackOptions, ...options };

      if (!config.override) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
          return;
        }
      }

      const parsedData = parseResponse(response);
      this.cache.set({ ...config, cacheKey }, parsedData);
    });
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
    type QueryParams = TypeWithDefaults<RequestProperties, "queryParams", undefined>;

    return <
      EndpointType extends ExtractAdapterEndpointType<Adapter>,
      AdapterOptions extends ExtractAdapterOptionsType<Adapter>,
      MethodType extends ExtractAdapterMethodType<Adapter>,
    >(
      params: RequestOptionsType<EndpointType, AdapterOptions, MethodType>,
    ) => {
      type Endpoint = TypeWithDefaults<RequestProperties, "endpoint", EndpointType>;

      const endpoint = this.adapter.unsafe_endpointMapper(params.endpoint);

      // Splitting this type prevents "Type instantiation is excessively deep and possibly infinite" error
      type ExtractedAdapter = ExtractUnionAdapter<
        Adapter,
        {
          method: MethodType;
          options: AdapterOptions;
          queryParams: QueryParams;
        }
      >;
      type ExtractedAdapterType = ExtractedAdapter extends EmptyTypes ? Adapter : ExtractedAdapter;

      const mappedParams: RequestOptionsType<
        Endpoint extends string ? Endpoint : typeof endpoint,
        AdapterOptions,
        MethodType
      > = {
        ...params,
        endpoint: String(endpoint) as Endpoint extends string ? Endpoint : typeof endpoint,
      };

      const request = new Request<
        Response,
        Payload,
        QueryParams,
        LocalError,
        Endpoint extends string ? Endpoint : typeof endpoint,
        Client<GlobalErrorType, ExtractedAdapterType>
      >(this as unknown as Client<GlobalErrorType, ExtractedAdapterType>, mappedParams);

      this.plugins.forEach((plugin) => plugin.trigger("onRequestCreate", { request }));

      return request;
    };
  };
}
