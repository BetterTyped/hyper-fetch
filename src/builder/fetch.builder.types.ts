import {
  FetchQueueStoreKeyType,
  FetchQueueStoreValueType,
  SubmitQueueStoreKeyType,
  SubmitQueueStoreValueType,
} from "queues";
import { CacheStoreKeyType, CacheStoreValueType } from "cache";
import { ClientResponseType, ClientType } from "client";
import { FetchCommandInstance } from "../command/fetch.command.types";

export type FetchBuilderProps<ClientOptions> = {
  baseUrl: string;
  debug?: boolean;
  options?: ClientOptions;
  cache?: Map<CacheStoreKeyType, CacheStoreValueType>; // TODO change type
  fetchQueue?: Map<FetchQueueStoreKeyType, FetchQueueStoreValueType>; // TODO change type
  submitQueue?: Map<SubmitQueueStoreKeyType, SubmitQueueStoreValueType>; // TODO change type
};

export type FetchBuilderConfig<ErrorType, ClientOptions> = {
  baseUrl: string;
  debug: boolean;
  options: ClientOptions | undefined;
  client: ClientType<ErrorType, ClientOptions>;
  onErrorCallback: ErrorMessageMapperCallback<ErrorType> | undefined;
  onRequestCallbacks: RequestInterceptorCallback;
  onResponseCallbacks: ResponseInterceptorCallback;
  cache: any;
  fetchQueue: any;
  submitQueue: any;
  isOnline: boolean;
  actions: any[];
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
