import { RequestInstance } from "request";
import { ResponseType, AdapterType, QueryParamsType } from "adapter";
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
  adapter?: AdapterType;
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
export type ResponseInterceptorType<Response = any, Error = any> = (
  response: ResponseType<Response, Error>,
  request: RequestInstance,
) => Promise<ResponseType<any, any>> | ResponseType<any, any>;

// Stringify

export type StringifyCallbackType = (queryParams: QueryParamsType | string | NegativeTypes) => string;
