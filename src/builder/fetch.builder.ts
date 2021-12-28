import {
  RequestInterceptorCallback,
  ResponseInterceptorCallback,
  ErrorMessageMapperCallback,
  FetchBuilderProps,
  CommandManager,
} from "builder";
import { Cache } from "cache";
import { Manager } from "manager";
import { FetchQueue, SubmitQueue } from "queues";
import { FetchCommand, FetchCommandOptions, FetchCommandInstance } from "command";
import { ClientType, FetchClientXHR, fetchClient, ClientResponseType, ClientQueryParamsType } from "client";

export class FetchBuilder<ErrorType extends Record<string, any> | string, ClientOptions = FetchClientXHR> {
  readonly baseUrl: string;
  readonly debug: boolean;
  readonly options: ClientOptions | undefined;

  onErrorCallback: ErrorMessageMapperCallback<ErrorType> | undefined;
  onRequestCallbacks: RequestInterceptorCallback[] = [];
  onResponseCallbacks: ResponseInterceptorCallback[] = [];

  // Config
  commandManager: CommandManager = new CommandManager();
  client: ClientType<ErrorType, ClientOptions> = fetchClient;
  cache: Cache<ErrorType>;
  manager: Manager;
  fetchQueue: FetchQueue<ErrorType, ClientOptions>;
  submitQueue: SubmitQueue<ErrorType, ClientOptions>;

  // Persisting actions
  actions = [];

  constructor({
    baseUrl,
    debug,
    options,
    cache,
    manager,
    fetchQueue,
    submitQueue,
  }: FetchBuilderProps<ErrorType, ClientOptions>) {
    this.baseUrl = baseUrl;
    this.debug = debug || false;
    this.options = options;
    this.cache = cache || new Cache();
    this.manager = manager || new Manager();
    this.fetchQueue = fetchQueue || new FetchQueue<ErrorType, ClientOptions>(this);
    this.submitQueue = submitQueue || new SubmitQueue<ErrorType, ClientOptions>(this);
  }

  setClient = (callback: ClientType<ErrorType, ClientOptions>): FetchBuilder<ErrorType, ClientOptions> => {
    this.client = callback;
    return this;
  };

  onError = (callback: ErrorMessageMapperCallback<ErrorType>): FetchBuilder<ErrorType, ClientOptions> => {
    this.onErrorCallback = callback;
    return this;
  };

  onRequest = (callback: RequestInterceptorCallback): FetchBuilder<ErrorType, ClientOptions> => {
    this.onRequestCallbacks.push(callback);
    return this;
  };

  onResponse = (callback: ResponseInterceptorCallback): FetchBuilder<ErrorType, ClientOptions> => {
    this.onResponseCallbacks.push(callback);
    return this;
  };

  clear = () => {
    this.cache.clear();
    this.fetchQueue.clear();
    this.submitQueue.clear();
    this.commandManager.abortControllers.clear();

    this.cache.emitter.removeAllListeners();
    this.fetchQueue.emitter.removeAllListeners();
    this.submitQueue.emitter.removeAllListeners();
    this.commandManager.emitter.removeAllListeners();
  };

  // TODO - move to the client method -> should not be accessible for user.
  modifyRequest = async <T extends FetchCommandInstance>(command: T): Promise<T> => {
    let newCommand = command;
    if (!command.commandOptions.disableRequestInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.onRequestCallbacks) {
        newCommand = (await interceptor(command)) as T;
      }
    }
    return newCommand;
  };

  modifyResponse = async <T extends FetchCommandInstance>(response: ClientResponseType<any, ErrorType>, command: T) => {
    let newResponse = response;
    if (!command.commandOptions.disableResponseInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.onResponseCallbacks) {
        newResponse = await interceptor(response, command);
      }
    }
    return newResponse;
  };

  public create =
    <ResponseType, PayloadType = undefined, QueryParamsType extends ClientQueryParamsType = ClientQueryParamsType>() =>
    <EndpointType extends string>(
      params: FetchCommandOptions<EndpointType, ClientOptions>,
    ): FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions> =>
      new FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions>(
        this,
        params,
      );
}
