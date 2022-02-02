import { Cache } from "cache";
import { FetchCommandInstance } from "command";
import { FetchQueue, SubmitQueue } from "queues";
import { ClientResponseType, ClientType, ClientQueryParamsType } from "client";
import { FetchBuilder } from "builder";
import { AppManager } from "managers";
import { NegativeTypes } from "types";

export type FetchBuilderProps<ErrorType, HttpOptions> = {
  baseUrl: string;
  client?: ClientType;
  cache?: <B extends FetchBuilderInstance>(builder: B) => Cache<ErrorType, HttpOptions>;
  appManager?: <B extends FetchBuilderInstance>(builder: B) => AppManager<ErrorType, HttpOptions>;
  fetchQueue?: <B extends FetchBuilderInstance>(builder: B) => FetchQueue<ErrorType, HttpOptions>;
  submitQueue?: <B extends FetchBuilderInstance>(builder: B) => SubmitQueue<ErrorType, HttpOptions>;
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

// Stringify

export type StringifyCallbackType = (queryParams: ClientQueryParamsType | string | NegativeTypes) => string;
