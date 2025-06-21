import { AdapterInstance, ResponseType } from "adapter";
import { HttpAdapterType, parseResponse, HttpAdapter } from "http-adapter";
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
import {
  EmptyTypes,
  TypeWithDefaults,
  ExtractAdapterMethodType,
  ExtractAdapterOptionsType,
  ExtractAdapterQueryParamsType,
  ExtractAdapterEndpointType,
  ExtractUnionAdapter,
  HydrateDataType,
  HydrationOptions,
  ExtractAdapterDefaultQueryParamsType,
} from "types";
import { getUniqueRequestId } from "utils";

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
  unstable_onErrorCallbacks: ResponseInterceptorType<ClientInstance>[] = [];
  unstable_onSuccessCallbacks: ResponseInterceptorType<ClientInstance>[] = [];
  unstable_onResponseCallbacks: ResponseInterceptorType<ClientInstance>[] = [];
  unstable_onAuthCallbacks: RequestInterceptorType[] = [];
  unstable_onRequestCallbacks: RequestInterceptorType[] = [];

  // Managers
  loggerManager: LoggerManager = new LoggerManager();
  requestManager: RequestManager = new RequestManager();
  appManager: AppManager;

  // Config
  adapter: Adapter;
  cache: Cache;
  fetchDispatcher: Dispatcher;
  submitDispatcher: Dispatcher;
  isMockerEnabled = true;

  // Registered requests effect
  plugins: PluginInstance[] = [];

  /** @internal */
  unstable_abortKeyMapper: (request: RequestInstance) => string = getSimpleKey;

  /** @internal */
  unstable_cacheKeyMapper: (request: RequestInstance) => string = getRequestKey;

  /** @internal */
  unstable_queryKeyMapper: (request: RequestInstance) => string = getRequestKey;

  /** @internal */
  unstable_requestIdMapper: (request: RequestInstance) => string = getUniqueRequestId;

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
   * Method of manipulating requests before sending the request. We can for example add custom header with token to the request which request had the auth set to true.
   */
  onAuth = (callback: RequestInterceptorType): Client<GlobalErrorType, Adapter> => {
    this.unstable_onAuthCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on auth.
   * */
  removeOnAuthInterceptors = (callbacks: RequestInterceptorType[]): Client<GlobalErrorType, Adapter> => {
    this.unstable_onAuthCallbacks = this.unstable_onAuthCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting error responses. It can be used for example to refresh tokens.
   */
  onError = <ErrorType = null>(
    callback: ResponseInterceptorType<ClientInstance, any, ErrorType | GlobalErrorType>,
  ): Client<GlobalErrorType, Adapter> => {
    this.unstable_onErrorCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on error.
   * */
  removeOnErrorInterceptors = (
    callbacks: ResponseInterceptorType<ClientInstance, any, null | GlobalErrorType>[],
  ): Client<GlobalErrorType, Adapter> => {
    this.unstable_onErrorCallbacks = this.unstable_onErrorCallbacks.filter((callback) => !callbacks.includes(callback));
    return this;
  };

  /**
   * Method for intercepting success responses.
   */
  onSuccess = <ErrorType = null>(
    callback: ResponseInterceptorType<ClientInstance, any, ErrorType | GlobalErrorType>,
  ): Client<GlobalErrorType, Adapter> => {
    this.unstable_onSuccessCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on success.
   * */
  removeOnSuccessInterceptors = (
    callbacks: ResponseInterceptorType<ClientInstance, any, null | GlobalErrorType>[],
  ): Client<GlobalErrorType, Adapter> => {
    this.unstable_onSuccessCallbacks = this.unstable_onSuccessCallbacks.filter(
      (callback) => !callbacks.includes(callback),
    );
    return this;
  };

  /**
   * Method of manipulating requests before sending the request.
   */
  onRequest = (callback: RequestInterceptorType): Client<GlobalErrorType, Adapter> => {
    this.unstable_onRequestCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on request.
   * */
  removeOnRequestInterceptors = (callbacks: RequestInterceptorType[]): Client<GlobalErrorType, Adapter> => {
    this.unstable_onRequestCallbacks = this.unstable_onRequestCallbacks.filter(
      (callback) => !callbacks.includes(callback),
    );
    return this;
  };

  /**
   * Method for intercepting any responses.
   */
  onResponse = <ErrorType = null>(
    callback: ResponseInterceptorType<ClientInstance, any, ErrorType | GlobalErrorType>,
  ): Client<GlobalErrorType, Adapter> => {
    this.unstable_onResponseCallbacks.push(callback);
    return this;
  };

  /**
   * Method for removing listeners on request.
   * */
  removeOnResponseInterceptors = (
    callbacks: ResponseInterceptorType<ClientInstance, any, null | GlobalErrorType>[],
  ): Client<GlobalErrorType, Adapter> => {
    this.unstable_onResponseCallbacks = this.unstable_onResponseCallbacks.filter(
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
    this.unstable_abortKeyMapper = callback;
    return this;
  };
  setCacheKeyMapper = (callback: (request: RequestInstance) => string) => {
    this.unstable_cacheKeyMapper = callback;
    return this;
  };
  setQueryKeyMapper = (callback: (request: RequestInstance) => string) => {
    this.unstable_queryKeyMapper = callback;
    return this;
  };
  setRequestIdMapper = (callback: (request: RequestInstance) => string) => {
    this.unstable_requestIdMapper = callback;
    return this;
  };

  /**
   * Helper used by http adapter to apply the modifications on response error
   * @private
   */
  unstable_modifyAuth = async (request: RequestInstance) => interceptRequest(this.unstable_onAuthCallbacks, request);

  /**
   * Private helper to run async pre-request processing
   * @private
   */
  unstable_modifyRequest = async (request: RequestInstance) =>
    interceptRequest(this.unstable_onRequestCallbacks, request);

  /**
   * Private helper to run async on-error response processing
   * @private
   */
  unstable_modifyErrorResponse = async (
    response: ResponseType<any, GlobalErrorType, Adapter>,
    request: RequestInstance,
  ) => interceptResponse<GlobalErrorType, ClientInstance>(this.unstable_onErrorCallbacks, response, request);

  /**
   * Private helper to run async on-success response processing
   * @private
   */
  unstable_modifySuccessResponse = async (
    response: ResponseType<any, GlobalErrorType, Adapter>,
    request: RequestInstance,
  ) => interceptResponse<GlobalErrorType, ClientInstance>(this.unstable_onSuccessCallbacks, response, request);

  /**
   * Private helper to run async response processing
   * @private
   */
  unstable_modifyResponse = async (response: ResponseType<any, GlobalErrorType, Adapter>, request: RequestInstance) =>
    interceptResponse<GlobalErrorType, ClientInstance>(this.unstable_onResponseCallbacks, response, request);

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
      response?: void;
      payload?: void;
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
    type Response = TypeWithDefaults<RequestProperties, "response", void>;
    type Payload = TypeWithDefaults<RequestProperties, "payload", void>;
    type LocalError = TypeWithDefaults<RequestProperties, "error", GlobalErrorType>;
    type QueryParams = TypeWithDefaults<
      RequestProperties,
      "queryParams",
      ExtractAdapterDefaultQueryParamsType<Adapter>
    >;

    return <
      EndpointType extends ExtractAdapterEndpointType<Adapter>,
      AdapterOptions extends ExtractAdapterOptionsType<Adapter>,
      MethodType extends ExtractAdapterMethodType<Adapter>,
    >(
      params: RequestOptionsType<EndpointType, AdapterOptions, MethodType>,
    ) => {
      type Endpoint = TypeWithDefaults<RequestProperties, "endpoint", EndpointType>;

      const endpoint = this.adapter.unstable_endpointMapper(params.endpoint);

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
