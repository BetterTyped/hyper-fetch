import { Cache } from "cache";
import { FetchCommandInstance } from "command";
import { FetchQueue, SubmitQueue } from "queues";
import { ClientResponseType } from "client";
import { FetchBuilder } from "builder";
import { Manager } from "manager";

export type FetchBuilderProps<ErrorType, ClientOptions> = {
  baseUrl: string;
  debug?: boolean;
  options?: ClientOptions;
  cache?: Cache<ErrorType>;
  manager?: Manager;
  fetchQueue?: FetchQueue<ErrorType, ClientOptions>;
  submitQueue?: SubmitQueue<ErrorType, ClientOptions>;
};

export type FetchBuilderInstance = FetchBuilder<any, any>;

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
