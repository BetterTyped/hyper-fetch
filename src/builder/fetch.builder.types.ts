import { FetchQueue, SubmitQueue } from "queues";
import { Cache } from "cache";
import { ClientResponseType, ClientType } from "client";
import { FetchCommandInstance } from "../command/fetch.command.types";

export type FetchBuilderProps<ErrorType, ClientOptions> = {
  baseUrl: string;
  debug?: boolean;
  options?: ClientOptions;
  cache?: Cache<ErrorType>;
  fetchQueue?: FetchQueue<ErrorType, ClientOptions>;
  submitQueue?: SubmitQueue<ErrorType, ClientOptions>;
};

export type FetchBuilderConfig<ErrorType, ClientOptions> = {
  baseUrl: string;
  debug: boolean;
  options: ClientOptions | undefined;
  client: ClientType<ErrorType, ClientOptions>;
  onErrorCallback: ErrorMessageMapperCallback<ErrorType> | undefined;
  onRequestCallbacks: RequestInterceptorCallback;
  onResponseCallbacks: ResponseInterceptorCallback;
  cache: Cache<ErrorType>;
  fetchQueue: FetchQueue<ErrorType, ClientOptions>;
  submitQueue: SubmitQueue<ErrorType, ClientOptions>;
  isOnline: boolean;
  actions: FetchAction[];
};

// Interceptors
export type ErrorMessageMapperCallback<ErrorType> = (error: any) => Promise<ErrorType> | ErrorType;
export type RequestInterceptorCallback = (
  command: FetchCommandInstance,
) => Promise<FetchCommandInstance> | FetchCommandInstance;
export type ResponseInterceptorCallback = (
  response: ClientResponseType<any, any>,
  command: FetchCommandInstance,
) => Promise<ClientResponseType<any, any>> | ClientResponseType<any, any>;

// Actions
export type FetchAction = {
  name: string;
  callback: () => void;
};
