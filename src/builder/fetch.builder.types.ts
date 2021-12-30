import { Cache, isEqual } from "cache";
import { FetchCommandInstance } from "command";
import { FetchQueue, SubmitQueue } from "queues";
import { ClientResponseType } from "client";
import { FetchBuilder } from "builder";
import { Manager } from "manager";

export type FetchBuilderProps<ErrorType, ClientOptions> = {
  baseUrl: string;
  debug?: boolean;
  options?: ClientOptions;
  cache?: <B extends FetchBuilderInstance>(builder: B) => Cache<ErrorType, ClientOptions>;
  manager?: <B extends FetchBuilderInstance>(builder: B) => Manager;
  fetchQueue?: <B extends FetchBuilderInstance>(builder: B) => FetchQueue<ErrorType, ClientOptions>;
  submitQueue?: <B extends FetchBuilderInstance>(builder: B) => SubmitQueue<ErrorType, ClientOptions>;
  deepEqual?: typeof isEqual;
};

export type FetchBuilderInstance = FetchBuilder<any, any>;

export type FetchBuilderErrorType = Record<string, any> | string;

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
