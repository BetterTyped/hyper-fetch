import {
  ClientType,
  fetchClient,
  encodeParams,
  FetchClientXHR,
  FetchClientOptions,
  ClientResponseType,
  ClientQueryParamsType,
  QueryStringifyOptions,
} from "client";
import {
  FetchBuilderProps,
  FetchBuilderInstance,
  FetchBuilderErrorType,
  StringifyCallbackType,
  RequestInterceptorCallback,
  ResponseInterceptorCallback,
} from "builder";
import { Cache, isEqual } from "cache";
import { FetchActionInstance } from "action";
import { FetchQueue, SubmitQueue } from "queues";
import { FetchCommand, FetchCommandOptions, FetchCommandInstance } from "command";
import { AppManager, CommandManager, LoggerManager, LoggerLevelType } from "managers";

/**
 * Fetch builder class is the orchestrator of the whole library, primary used to initialize connections with the server.
 */
export class FetchBuilder<ErrorType extends FetchBuilderErrorType = Error, HttpOptions = FetchClientXHR> {
  readonly baseUrl: string;
  debug: boolean;

  builded = false;

  // Private
  __onErrorCallbacks: ResponseInterceptorCallback[] = [];
  __onSuccessCallbacks: ResponseInterceptorCallback[] = [];
  __onResponseCallbacks: ResponseInterceptorCallback[] = [];

  __onAuthCallbacks: RequestInterceptorCallback[] = [];
  __onRequestCallbacks: RequestInterceptorCallback[] = [];

  // Managers
  commandManager: CommandManager = new CommandManager();
  appManager: AppManager<ErrorType, HttpOptions>;
  loggerManager: LoggerManager = new LoggerManager(this);

  // Config
  client: ClientType;
  cache: Cache<ErrorType, HttpOptions>;
  fetchQueue: FetchQueue<ErrorType, HttpOptions>;
  submitQueue: SubmitQueue<ErrorType, HttpOptions>;

  // Utils
  deepEqual: typeof isEqual = isEqual;
  stringifyQueryParams: StringifyCallbackType = (queryParams) => encodeParams(queryParams, this.queryParamsOptions);

  // Registered requests Actions
  actions: FetchActionInstance[] = [];

  // Options
  httpOptions?: HttpOptions;
  clientOptions?: FetchClientOptions;
  commandOptions?: FetchCommandOptions<string, HttpOptions>;
  queryParamsOptions?: QueryStringifyOptions;

  // Logger
  private logger = this.loggerManager.init("Builder");

  constructor({
    baseUrl,
    client,
    appManager,
    cache,
    fetchQueue,
    submitQueue,
  }: FetchBuilderProps<ErrorType, HttpOptions>) {
    this.baseUrl = baseUrl;
    this.client = client || fetchClient;

    // IMPORTANT: Do not change initialization order as it's crucial for dependencies and 'this' usage
    this.cache = cache?.(this) || new Cache(this);
    this.appManager = appManager?.(this) || new AppManager<ErrorType, HttpOptions>(this);
    this.fetchQueue = fetchQueue?.(this) || new FetchQueue<ErrorType, HttpOptions>(this);
    this.submitQueue = submitQueue?.(this) || new SubmitQueue<ErrorType, HttpOptions>(this);
  }

  setHttpOptions = (httpOptions: HttpOptions): FetchBuilder<ErrorType, HttpOptions> => {
    this.httpOptions = httpOptions;
    return this;
  };

  setClientOptions = (clientOptions: FetchClientOptions): FetchBuilder<ErrorType, HttpOptions> => {
    this.clientOptions = clientOptions;
    return this;
  };

  setCommandDefaultOptions = (
    commandOptions: FetchCommandOptions<string, HttpOptions>,
  ): FetchBuilder<ErrorType, HttpOptions> => {
    this.commandOptions = commandOptions;
    return this;
  };

  setQueryParamsOptions = (queryParamsOptions: QueryStringifyOptions): FetchBuilder<ErrorType, HttpOptions> => {
    this.queryParamsOptions = queryParamsOptions;
    return this;
  };

  setDebug = (debug: boolean): FetchBuilder<ErrorType, HttpOptions> => {
    this.debug = debug;
    return this;
  };

  setDeepEqual = (deepEqual: typeof isEqual): FetchBuilder<ErrorType, HttpOptions> => {
    this.deepEqual = deepEqual;
    return this;
  };

  setStringifyQueryParams = (stringify: StringifyCallbackType): FetchBuilder<ErrorType, HttpOptions> => {
    this.stringifyQueryParams = stringify;
    return this;
  };

  setLoggerLevel = (levels: LoggerLevelType[]): FetchBuilder<ErrorType, HttpOptions> => {
    this.loggerManager.setLevels(levels);
    return this;
  };

  setLogger = (callback: (builder: FetchBuilderInstance) => LoggerManager): FetchBuilder<ErrorType, HttpOptions> => {
    this.loggerManager = callback(this);
    return this;
  };

  setClient = (callback: (builder: FetchBuilderInstance) => ClientType): FetchBuilder<ErrorType, HttpOptions> => {
    this.client = callback(this);
    return this;
  };

  onAuth = (callback: RequestInterceptorCallback): FetchBuilder<ErrorType, HttpOptions> => {
    this.__onAuthCallbacks.push(callback);
    return this;
  };

  onError = (callback: ResponseInterceptorCallback): FetchBuilder<ErrorType, HttpOptions> => {
    this.__onErrorCallbacks.push(callback);
    return this;
  };

  onSuccess = (callback: ResponseInterceptorCallback): FetchBuilder<ErrorType, HttpOptions> => {
    this.__onSuccessCallbacks.push(callback);
    return this;
  };

  onRequest = (callback: RequestInterceptorCallback): FetchBuilder<ErrorType, HttpOptions> => {
    this.__onRequestCallbacks.push(callback);
    return this;
  };

  onResponse = (callback: ResponseInterceptorCallback): FetchBuilder<ErrorType, HttpOptions> => {
    this.__onResponseCallbacks.push(callback);
    return this;
  };

  clear = () => {
    this.commandManager.abortControllers.clear();
    this.cache.clear();
    this.fetchQueue.clear();
    this.submitQueue.clear();

    this.commandManager.emitter.removeAllListeners();
    this.cache.emitter.removeAllListeners();
    this.fetchQueue.emitter.removeAllListeners();
    this.submitQueue.emitter.removeAllListeners();
    this.commandManager.emitter.removeAllListeners();
  };

  /**
   * Helper used by http client to apply the modifications on response error
   * @param command
   * @returns
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
   * Helper used by http client to apply the modifications of request command
   * @param command
   * @returns
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

  __modifyErrorResponse = async (response: ClientResponseType<any, ErrorType>, command: FetchCommandInstance) => {
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

  __modifySuccessResponse = async (response: ClientResponseType<any, ErrorType>, command: FetchCommandInstance) => {
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

  __modifyResponse = async (response: ClientResponseType<any, ErrorType>, command: FetchCommandInstance) => {
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

  public createCommand = <
    ResponseType,
    PayloadType = undefined,
    RequestErrorType = undefined,
    QueryParamsType extends ClientQueryParamsType = ClientQueryParamsType,
  >() => {
    if (!this.builded) {
      throw new Error(`To create new commands you have to first use the build method on FetchBuilder class.
      Build method indicates the ended setup and prevents synchronization/registration issues.`);
    }

    return <EndpointType extends string>(params: FetchCommandOptions<EndpointType, HttpOptions>) =>
      new FetchCommand<
        ResponseType,
        PayloadType,
        QueryParamsType,
        ErrorType,
        RequestErrorType,
        EndpointType,
        HttpOptions
      >(this, params);
  };

  public addActions = (actions: FetchActionInstance[]) => {
    if (this.builded) {
      throw new Error(`Actions can be applied only before usage of build method on FetchBuilder class.
      Build method indicates the ended setup and prevents synchronization/registration issues.`);
    }

    // Check for duplicated names of actions
    this.actions.forEach((currentAction) => {
      const hasDuplicate = actions.some((action) => action.getName() === currentAction.getName());

      if (hasDuplicate) {
        throw new Error("Fetch action names must be unique.");
      }
    });

    this.actions = this.actions.concat(actions);

    return this;
  };

  public removeAction = (action: FetchActionInstance | string) => {
    const name = typeof action === "string" ? action : action?.getName();
    this.actions = this.actions.filter((currentAction) => currentAction.getName() !== name);

    return this;
  };

  build = () => {
    this.builded = true;

    /**
     * Start flushing persistent queues
     */
    this.fetchQueue.flushAll();
    this.submitQueue.flushAll();

    this.logger.info("Initialized Builder");

    return this;
  };
}
