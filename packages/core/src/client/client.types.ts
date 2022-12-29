import { Cache } from "cache";
import { RequestInstance } from "request";
import { Dispatcher } from "dispatcher";
import { ResponseType, AdapterType, QueryParamsType } from "adapter";
import { Client } from "client";
import { AppManager } from "managers";
import { NegativeTypes } from "types";

export type ClientErrorType = Record<string, any> | string;
export type ClientInstance = Client<any, any>;

/**
 * Configuration setup for the client
 */
export type ClientOptionsType = {
  /**
   * Url to your server
   */
  url: string;
  /**
   * Custom adapter initialization prop
   */
  adapter?: AdapterType;
  /**
   * Custom cache initialization prop
   */
  cache?: <B extends ClientInstance, C extends Cache>(client: B) => C;
  /**
   * Custom app manager initialization prop
   */
  appManager?: <B extends ClientInstance, A extends AppManager>(client: B) => A;
  /**
   * Custom fetch dispatcher initialization prop
   */
  fetchDispatcher?: <B extends ClientInstance, D extends Dispatcher>(client: B) => D;
  /**
   * Custom submit dispatcher initialization prop
   */
  submitDispatcher?: <B extends ClientInstance, D extends Dispatcher>(client: B) => D;
};

// Interceptors

export type RequestInterceptorType = (request: RequestInstance) => Promise<RequestInstance> | RequestInstance;
export type ResponseInterceptorType<Response = any, Error = any> = (
  response: ResponseType<Response, Error>,
  request: RequestInstance,
) => Promise<ResponseType<any, any>> | ResponseType<any, any>;

// Stringify

export type StringifyCallbackType = (queryParams: QueryParamsType | string | NegativeTypes) => string;
