import { Cache } from "cache";
import { FetchCommandInstance } from "command";
import { Dispatcher } from "dispatcher";
import { ClientResponseType, ClientType, ClientQueryParamsType } from "client";
import { FetchBuilder } from "builder";
import { AppManager } from "managers";
import { NegativeTypes } from "types";

/**
 * Configuration setup for the builder
 */
export type FetchBuilderConfig = {
  /**
   * Url to your server
   */
  baseUrl: string;
  /**
   * Custom client initialization prop
   */
  client?: ClientType;
  /**
   * Custom cache initialization prop
   */
  cache?: <B extends FetchBuilderInstance>(builder: B) => Cache;
  /**
   * Custom app manager initialization prop
   */
  appManager?: <B extends FetchBuilderInstance>(builder: B) => AppManager;
  /**
   * Custom fetch dispatcher initialization prop
   */
  fetchDispatcher?: <B extends FetchBuilderInstance>(builder: B) => Dispatcher;
  /**
   * Custom submit dispatcher initialization prop
   */
  submitDispatcher?: <B extends FetchBuilderInstance>(builder: B) => Dispatcher;
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
