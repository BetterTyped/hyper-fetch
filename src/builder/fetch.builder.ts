import { ClientType, FetchClientXHR, fetchClient, ClientResponseType, ClientQueryParamsType } from "client";
import { FetchCommand, FetchCommandOptions, FetchCommandInstance } from "command";
import {
  RequestInterceptorCallback,
  ResponseInterceptorCallback,
  FetchBuilderProps,
  ErrorMessageMapperCallback,
} from "builder";
import { Cache } from "cache";
import { FetchQueue, SubmitQueueStoreKeyType, SubmitQueueStoreValueType } from "queues";
import { FetchBuilderConfig } from "./fetch.builder.types";

export class FetchBuilder<ErrorType extends Record<string, any> | string, ClientOptions = FetchClientXHR> {
  readonly baseUrl: string;
  readonly debug: boolean;
  readonly options: ClientOptions | undefined;

  onErrorCallback: ErrorMessageMapperCallback<ErrorType> | undefined;
  onRequestCallbacks: RequestInterceptorCallback[] = [];
  onResponseCallbacks: ResponseInterceptorCallback[] = [];

  // Config
  client: ClientType<ErrorType, ClientOptions> = fetchClient;
  cache: Cache<ErrorType>;
  fetchQueue: FetchQueue<ErrorType, ClientOptions>;
  submitQueue: Map<SubmitQueueStoreKeyType, SubmitQueueStoreValueType>; // todo change

  // Offline
  isOnline = true;
  actions = [];

  constructor({
    baseUrl,
    debug = false,
    options,
    cache,
    fetchQueue,
    submitQueue,
  }: FetchBuilderProps<ErrorType, ClientOptions>) {
    this.baseUrl = baseUrl;
    this.debug = debug;
    this.options = options;
    this.cache = cache || new Cache();
    this.fetchQueue = fetchQueue || new FetchQueue<ErrorType, ClientOptions>(this);
    this.submitQueue = submitQueue || new Map<SubmitQueueStoreKeyType, SubmitQueueStoreValueType>();

    /**
     * TODO Persist queue renew
     * When application mounts, we need to start persisting queue elements
     * as they did not finished their previous life cycle
     * Challenge: Trigger it with debounce after all methods got applied?
     * EG. new Builder().onResponse().onRequest()...
     * ----flush starts-----methods added later may change the way it works, but will not get applied
     * Persistence will get rid of any effects applied to the command :(
     */
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
  };

  private handleRequestCallbacks = async <T extends FetchCommandInstance>(command: T): Promise<T> => {
    let newCommand = command;
    if (!command.commandOptions.disableRequestInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.onRequestCallbacks) {
        newCommand = (await interceptor(command)) as T;
      }
    }
    return newCommand;
  };

  private handleResponseCallbacks = async <T extends FetchCommandInstance>(
    response: ClientResponseType<any, ErrorType>,
    command: T,
  ) => {
    let newResponse = response;
    if (!command.commandOptions.disableResponseInterceptors) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const interceptor of this.onResponseCallbacks) {
        newResponse = await interceptor(response, command);
      }
    }
    return newResponse;
  };

  public getBuilderConfig = (): FetchBuilderConfig<ErrorType, ClientOptions> => ({
    baseUrl: this.baseUrl,
    debug: this.debug,
    options: this.options,
    onErrorCallback: this.onErrorCallback,
    onRequestCallbacks: this.handleRequestCallbacks,
    onResponseCallbacks: this.handleResponseCallbacks,
    client: this.client,
    cache: this.cache,
    fetchQueue: this.fetchQueue,
    isOnline: this.isOnline,
    actions: this.actions,
  });

  public create =
    <ResponseType, PayloadType = undefined, QueryParamsType extends ClientQueryParamsType = ClientQueryParamsType>() =>
    <EndpointType extends string>(
      params: FetchCommandOptions<EndpointType, ClientOptions>,
    ): FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions> =>
      new FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions>(
        this.getBuilderConfig(),
        params,
      );
}
