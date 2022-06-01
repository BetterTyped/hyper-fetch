import {
  ClientType,
  fetchClient,
  ClientDefaultOptionsType,
  ClientResponseType,
  ClientQueryParamsType,
  QueryStringifyOptions,
  ClientHeaderMappingCallback,
  ClientPayloadMappingCallback,
} from "client";
import {
  stringifyQueryParams,
  getClientHeaders,
  getClientPayload,
  FetchBuilderConfig,
  FetchBuilderInstance,
  FetchBuilderErrorType,
  StringifyCallbackType,
  RequestInterceptorCallback,
  ResponseInterceptorCallback,
} from "builder";
import { Cache } from "cache";
import { Dispatcher } from "dispatcher";
import { FetchEffectInstance } from "effect";
import { FetchCommand, FetchCommandConfig, FetchCommandInstance } from "command";
import { AppManager, CommandManager, LoggerManager, LoggerLevelType } from "managers";

/**
 * **FetchBuilder** is a class that allows you to configure the connection with the server and then use it to create
 * commands which, when called using the appropriate method, will cause the server to be queried for the endpoint and
 * method specified in the command.
 */
export class FetchBuilder<
  GlobalErrorType extends FetchBuilderErrorType = Error,
  RequestConfigType = ClientDefaultOptionsType,
> {
  readonly baseUrl: string;
  debug: boolean;

  // Private
  __onErrorCallbacks: ResponseInterceptorCallback[] = [];
  __onSuccessCallbacks: ResponseInterceptorCallback[] = [];
  __onResponseCallbacks: ResponseInterceptorCallback[] = [];
  __onAuthCallbacks: RequestInterceptorCallback[] = [];
  __onRequestCallbacks: RequestInterceptorCallback[] = [];

  // Managers
  commandManager: CommandManager = new CommandManager();
  appManager: AppManager;
  loggerManager: LoggerManager = new LoggerManager(this);

  // Config
  client: ClientType;
  cache: Cache;
  fetchDispatcher: Dispatcher;
  submitDispatcher: Dispatcher;

  // Registered requests effect
  effects: FetchEffectInstance[] = [];

  // Options
  requestConfig?: RequestConfigType;
  commandConfig?: Partial<FetchCommandConfig<string, RequestConfigType>>;
  queryParamsConfig?: QueryStringifyOptions;

  // Utils

  /**
   * Method to stringify query params from objects.
   */
  stringifyQueryParams: StringifyCallbackType = (queryParams) =>
    stringifyQueryParams(queryParams, this.queryParamsConfig);
  /**
   * Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats.
   */
  headerMapper: ClientHeaderMappingCallback = getClientHeaders;
  /**
   * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
   */
  payloadMapper: ClientPayloadMappingCallback = getClientPayload;

  // Logger
  logger = this.loggerManager.init("Builder");

  constructor({ baseUrl, client, appManager, cache, fetchDispatcher, submitDispatcher }: FetchBuilderConfig) {
    this.baseUrl = baseUrl;
    this.client = client || fetchClient;

    // IMPORTANT: Do not change initialization order as it's crucial for dependencies injection
    this.appManager = appManager?.(this) || new AppManager(this);
    this.cache = cache?.(this) || new Cache(this);
    this.fetchDispatcher = fetchDispatcher?.(this) || new Dispatcher(this);
    this.submitDispatcher = submitDispatcher?.(this) || new Dispatcher(this);
  }

  /**
   * It sets the client request config (by default XHR config). This is the global way to setup the configuration for client and trigger it with every command.
   */
  setRequestConfig = (requestConfig: RequestConfigType): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.requestConfig = requestConfig;
    return this;
  };

  /**
   * This method allows to configure global defaults for the command configuration like method, auth, deduplication etc.
   */
  setCommandConfig = (
    commandConfig: Partial<FetchCommandConfig<string, RequestConfigType>>,
  ): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.commandConfig = commandConfig;
    return this;
  };

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (debug: boolean): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.debug = debug;
    return this;
  };

  /**
   * Set the logger level of the messages displayed to the console
   */
  setLoggerLevel = (levels: LoggerLevelType[]): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.loggerManager.setLevels(levels);
    return this;
  };

  /**
   * Set the new logger instance to the builder
   */
  setLogger = (
    callback: (builder: FetchBuilderInstance) => LoggerManager,
  ): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Set config for the query params stringify method, we can set here, among others, arrayFormat, skipNull, encode, skipEmptyString and more
   */
  setQueryParamsConfig = (
    queryParamsConfig: QueryStringifyOptions,
  ): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.queryParamsConfig = queryParamsConfig;
    return this;
  };

  /**
   * Set the custom query params stringify method to the builder
   * @param stringifyFn Custom callback handling query params stringify
   */
  setStringifyQueryParams = (stringifyFn: StringifyCallbackType): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.stringifyQueryParams = stringifyFn;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = (headerMapper: ClientHeaderMappingCallback): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.headerMapper = headerMapper;
    return this;
  };

  /**
   * Set the request payload mapping function which get triggered before request get send
   */
  setPayloadMapper = (
    payloadMapper: ClientPayloadMappingCallback,
  ): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.payloadMapper = payloadMapper;
    return this;
  };

  /**
   * Set custom http client to handle graphql, rest, firebase or other
   */
  setClient = (
    callback: (builder: FetchBuilderInstance) => ClientType,
  ): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.client = callback(this);
    return this;
  };

  /**
   * Method of manipulating commands before sending the request. We can for example add custom header with token to the request which command had the auth set to true.
   */
  onAuth = (callback: RequestInterceptorCallback): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.__onAuthCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting error responses. It can be used for example to refresh tokens.
   */
  onError = (callback: ResponseInterceptorCallback): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.__onErrorCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting success responses.
   */
  onSuccess = (callback: ResponseInterceptorCallback): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.__onSuccessCallbacks.push(callback);
    return this;
  };

  /**
   * Method of manipulating commands before sending the request.
   */
  onRequest = (callback: RequestInterceptorCallback): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.__onRequestCallbacks.push(callback);
    return this;
  };

  /**
   * Method for intercepting any responses.
   */
  onResponse = (callback: ResponseInterceptorCallback): FetchBuilder<GlobalErrorType, RequestConfigType> => {
    this.__onResponseCallbacks.push(callback);
    return this;
  };

  /**
   * Add persistent effects which trigger on the request lifecycle
   */
  addEffect = (effect: FetchEffectInstance | FetchEffectInstance[]) => {
    this.effects = this.effects.concat(effect);

    return this;
  };

  /**
   * Remove effects from builder
   */
  removeEffect = (effect: FetchEffectInstance | string) => {
    const name = typeof effect === "string" ? effect : effect.getEffectKey();
    this.effects = this.effects.filter((currentEffect) => currentEffect.getEffectKey() !== name);

    return this;
  };

  /**
   * Create commands based on the builder setup
   */
  createCommand = <
    ResponseType,
    PayloadType = undefined,
    LocalErrorType extends FetchBuilderErrorType | undefined = undefined,
    QueryParamsType extends ClientQueryParamsType | string = string,
  >() => {
    return <EndpointType extends string>(params: FetchCommandConfig<EndpointType, RequestConfigType>) =>
      new FetchCommand<
        ResponseType,
        PayloadType,
        QueryParamsType,
        GlobalErrorType,
        LocalErrorType,
        EndpointType,
        RequestConfigType
      >(this, params);
  };

  /**
   * Clears the builder instance and remove all listeners on it's dependencies
   */
  clear = () => {
    this.commandManager.abortControllers.clear();
    this.cache.clear();
    this.fetchDispatcher.clear();
    this.submitDispatcher.clear();

    this.commandManager.emitter.removeAllListeners();
    this.cache.emitter.removeAllListeners();
    this.fetchDispatcher.emitter.removeAllListeners();
    this.submitDispatcher.emitter.removeAllListeners();
    this.commandManager.emitter.removeAllListeners();
  };

  /**
   * Helper used by http client to apply the modifications on response error
   */
  __modifyAuth = async (command: FetchCommandInstance): Promise<FetchCommandInstance> => {
    let newCommand = command;
    if (!command.commandOptions.disableRequestInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.__onAuthCallbacks) {
        newCommand = (await interceptor(command)) as FetchCommandInstance;
        if (!newCommand) throw new Error("Auth request modifier must return command");
      }
    }
    return newCommand;
  };

  /**
   * Private helper to run async pre-request processing
   */
  __modifyRequest = async (command: FetchCommandInstance): Promise<FetchCommandInstance> => {
    let newCommand = command;
    if (!command.commandOptions.disableRequestInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.__onRequestCallbacks) {
        newCommand = (await interceptor(command)) as FetchCommandInstance;
        if (!newCommand) throw new Error("Request modifier must return command");
      }
    }
    return newCommand;
  };

  /**
   * Private helper to run async on-error response processing
   */
  __modifyErrorResponse = async (response: ClientResponseType<any, GlobalErrorType>, command: FetchCommandInstance) => {
    let newResponse = response;
    if (!command.commandOptions.disableResponseInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.__onErrorCallbacks) {
        newResponse = await interceptor(response, command);
        if (!newResponse) throw new Error("Response modifier must return data");
      }
    }
    return newResponse;
  };

  /**
   * Private helper to run async on-success response processing
   */
  __modifySuccessResponse = async (
    response: ClientResponseType<any, GlobalErrorType>,
    command: FetchCommandInstance,
  ) => {
    let newResponse = response;
    if (!command.commandOptions.disableResponseInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.__onSuccessCallbacks) {
        newResponse = await interceptor(response, command);
        if (!newResponse) throw new Error("Response modifier must return data");
      }
    }
    return newResponse;
  };

  /**
   * Private helper to run async response processing
   */
  __modifyResponse = async (response: ClientResponseType<any, GlobalErrorType>, command: FetchCommandInstance) => {
    let newResponse = response;
    if (!command.commandOptions.disableResponseInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.__onResponseCallbacks) {
        newResponse = await interceptor(response, command);
        if (!newResponse) throw new Error("Response modifier must return data");
      }
    }
    return newResponse;
  };
}
