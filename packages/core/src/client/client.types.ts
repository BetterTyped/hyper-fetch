import { RequestInstance } from "request";
import { ResponseReturnType, BaseAdapterType, QueryParamsType } from "adapter";
import { Client } from "client";
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
  adapter?: BaseAdapterType;
  /**
   * Custom cache initialization prop
   */
  cache?: <B extends ClientInstance>(client: B) => B["cache"];
  /**
   * Custom app manager initialization prop
   */
  appManager?: <B extends ClientInstance>(client: B) => B["appManager"];
  /**
   * Custom fetch dispatcher initialization prop
   */
  fetchDispatcher?: <B extends ClientInstance>(client: B) => B["submitDispatcher"];
  /**
   * Custom submit dispatcher initialization prop
   */
  submitDispatcher?: <B extends ClientInstance>(client: B) => B["fetchDispatcher"];
};

// Interceptors

export type RequestInterceptorType = (request: RequestInstance) => Promise<RequestInstance> | RequestInstance;
export type ResponseInterceptorType<
  Response = any,
  Error = any,
  AdapterType extends BaseAdapterType = BaseAdapterType,
> = (
  response: ResponseReturnType<Response, Error, AdapterType>,
  request: RequestInstance,
) => Promise<ResponseReturnType<any, any, AdapterType>> | ResponseReturnType<any, any, AdapterType>;

// Stringify

export type StringifyCallbackType = (queryParams: QueryParamsType | string | NegativeTypes) => string;
