import {
  RequestInterceptorCallback,
  ResponseInterceptorCallback,
  ErrorMessageMapperCallback,
  FetchBuilderProps,
  FetchBuilderErrorType,
  FetchBuilderInstance,
} from "builder";
import { Cache, isEqual } from "cache";
import { AppManager, CommandManager, Logger } from "managers";
import { FetchQueue, SubmitQueue } from "queues";
import { FetchCommand, FetchCommandOptions, FetchCommandInstance } from "command";
import { ClientType, FetchClientXHR, fetchClient, ClientResponseType, ClientQueryParamsType } from "client";
import { FetchActionInstance } from "action";

export class FetchBuilder<ErrorType extends FetchBuilderErrorType = Error, ClientOptions = FetchClientXHR> {
  readonly baseUrl: string;
  readonly debug: boolean;
  readonly options: ClientOptions | undefined;

  builded = false;

  __onErrorCallback: ErrorMessageMapperCallback<ErrorType> | undefined;
  __onRequestCallbacks: RequestInterceptorCallback[] = [];
  __onResponseCallbacks: ResponseInterceptorCallback[] = [];

  // Managers
  commandManager: CommandManager = new CommandManager();
  appManager: AppManager;
  logger: Logger = new Logger(this);

  // Config
  client: ClientType<ErrorType, ClientOptions>;
  cache: Cache<ErrorType, ClientOptions>;
  fetchQueue: FetchQueue<ErrorType, ClientOptions>;
  submitQueue: SubmitQueue<ErrorType, ClientOptions>;
  deepEqual: typeof isEqual;

  // Registered requests Actions
  actions: FetchActionInstance[] = [];

  constructor({
    baseUrl,
    debug,
    options,
    client,
    appManager,
    cache,
    fetchQueue,
    submitQueue,
    deepEqual,
  }: FetchBuilderProps<ErrorType, ClientOptions>) {
    this.baseUrl = baseUrl;
    this.debug = debug ?? false;
    this.options = options;
    this.client = client || fetchClient;

    // IMPORTANT: Do not change initialization order as it's crucial for dependencies and 'this' usage
    this.deepEqual = deepEqual || isEqual;
    this.cache = cache?.(this) || new Cache(this);
    this.appManager = appManager?.(this) || new AppManager();
    this.fetchQueue = fetchQueue?.(this) || new FetchQueue<ErrorType, ClientOptions>(this);
    this.submitQueue = submitQueue?.(this) || new SubmitQueue<ErrorType, ClientOptions>(this);
  }

  setLogger = (callback: (builder: FetchBuilderInstance) => Logger): FetchBuilder<ErrorType, ClientOptions> => {
    this.logger = callback(this);
    return this;
  };

  setClient = (
    callback: (builder: FetchBuilderInstance) => ClientType<ErrorType, ClientOptions>,
  ): FetchBuilder<ErrorType, ClientOptions> => {
    this.client = callback(this);
    return this;
  };

  onError = (callback: ErrorMessageMapperCallback<ErrorType>): FetchBuilder<ErrorType, ClientOptions> => {
    this.__onErrorCallback = callback;
    return this;
  };

  onRequest = (callback: RequestInterceptorCallback): FetchBuilder<ErrorType, ClientOptions> => {
    this.__onRequestCallbacks.push(callback);
    return this;
  };

  onResponse = (callback: ResponseInterceptorCallback): FetchBuilder<ErrorType, ClientOptions> => {
    this.__onResponseCallbacks.push(callback);
    return this;
  };

  clear = () => {
    this.cache.clear();
    this.fetchQueue.clear();
    this.submitQueue.clear();
    this.commandManager.abortControllers.clear();

    this.commandManager.emitter.removeAllListeners();
    this.cache.emitter.removeAllListeners();
    this.fetchQueue.emitter.removeAllListeners();
    this.submitQueue.emitter.removeAllListeners();
    this.commandManager.emitter.removeAllListeners();
  };

  /**
   * Helper used by http client to apply the modifications of request command
   * @param command
   * @returns
   */
  __modifyRequest = async <T extends FetchCommandInstance>(command: T): Promise<T> => {
    let newCommand = command;
    if (!command.commandOptions.disableRequestInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.__onRequestCallbacks) {
        newCommand = (await interceptor(command)) as T;
        if (!newCommand) throw new Error("Request modifier must return command");
      }
    }
    return newCommand;
  };

  /**
   * Helper used by http client to apply the modifications of response from command
   * @param command
   * @returns
   */
  __modifyResponse = async <T extends FetchCommandInstance>(
    response: ClientResponseType<any, ErrorType>,
    command: T,
  ) => {
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
    QueryParamsType extends ClientQueryParamsType = ClientQueryParamsType,
  >() => {
    if (!this.builded) {
      throw new Error(`To create new commands you have to first use the build method on FetchBuilder class.
      Build method indicates the ended setup and prevents synchronization/registration issues.`);
    }

    return <EndpointType extends string>(
      params: FetchCommandOptions<EndpointType, ClientOptions>,
    ): FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions> =>
      new FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions>(
        this,
        params,
      );
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

    this.logger.info("[Builder] Initialized Builder");

    return this;
  };
}
