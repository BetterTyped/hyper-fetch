import { Cache, isEqual } from "cache";
import { FetchCommandInstance } from "command";
import { FetchQueue, SubmitQueue } from "queues";
import { ClientResponseType, ClientType } from "client";
import { FetchBuilder } from "builder";
import { AppManager } from "managers";

export type FetchBuilderProps<ErrorType, ClientOptions> = {
  baseUrl: string;
  options?: ClientOptions;
  client?: ClientType<ErrorType, ClientOptions>;
  cache?: <B extends FetchBuilderInstance>(builder: B) => Cache<ErrorType, ClientOptions>;
  appManager?: <B extends FetchBuilderInstance>(builder: B) => AppManager;
  fetchQueue?: <B extends FetchBuilderInstance>(builder: B) => FetchQueue<ErrorType, ClientOptions>;
  submitQueue?: <B extends FetchBuilderInstance>(builder: B) => SubmitQueue<ErrorType, ClientOptions>;
  deepEqual?: typeof isEqual;
};

export type FetchBuilderInstance = FetchBuilder<any, any>;

export type FetchBuilderErrorType = Record<string, any> | string;

// Interceptors

export type RequestInterceptorCallback = (
  command: FetchCommandInstance,
) => Promise<FetchCommandInstance> | FetchCommandInstance;
export type ResponseInterceptorCallback = (
  response: ClientResponseType<any, any>,
  command: FetchCommandInstance,
) => Promise<ClientResponseType<any, any>> | ClientResponseType<any, any>;
