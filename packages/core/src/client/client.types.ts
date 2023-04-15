import { RequestInstance } from "request";
import { ResponseReturnType, BaseAdapterType, QueryParamsType, AdapterInstance } from "adapter";
import { Client } from "client";
import { NegativeTypes } from "types";

export type ClientErrorType = Record<string, any> | string;
export type ClientInstance = Client<any, BaseAdapterType<any, any, any, any>>;
export type ExtractAdapterTypeFromClient<T> = T extends Client<any, infer A> ? A : never;

/**
 * Configuration setup for the client
 */
export type ClientOptionsType<C extends ClientInstance> = {
  /**
   * Url to your server
   */
  url: string;
  /**
   * Custom adapter initialization prop
   */
  adapter?: BaseAdapterType;
  /**
   * Custom cache initialization prop
   */
  cache?: (client: C) => C["cache"];
  /**
   * Custom app manager initialization prop
   */
  appManager?: (client: C) => C["appManager"];
  /**
   * Custom fetch dispatcher initialization prop
   */
  fetchDispatcher?: (client: C) => C["submitDispatcher"];
  /**
   * Custom submit dispatcher initialization prop
   */
  submitDispatcher?: (client: C) => C["fetchDispatcher"];
};

// Interceptors

export type RequestInterceptorType = (request: RequestInstance) => Promise<RequestInstance> | RequestInstance;
export type ResponseInterceptorType<
  Response = any,
  Error = any,
  AdapterType extends AdapterInstance = BaseAdapterType,
> = (
  response: ResponseReturnType<Response, Error, AdapterType>,
  request: RequestInstance,
) => Promise<ResponseReturnType<any, any, AdapterType>> | ResponseReturnType<any, any, AdapterType>;

// Stringify

export type StringifyCallbackType = (queryParams: QueryParamsType | string | NegativeTypes) => string;
