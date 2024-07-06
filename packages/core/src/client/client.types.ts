import { RequestInstance } from "request";
import { ResponseType, AdapterType, QueryParamsType, AdapterInstance } from "adapter";
import { Client } from "client";
import { NegativeTypes } from "types";

export type ClientErrorType = Record<string, any> | string;
export type ClientInstance = Client<any, any, any>;

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
  adapter?: AdapterType;
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
export type ResponseInterceptorType<Response = any, Error = any, Adapter extends AdapterInstance = AdapterType> = (
  response: ResponseType<Response, Error, Adapter>,
  request: RequestInstance,
) => Promise<ResponseType<any, any, Adapter>> | ResponseType<any, any, Adapter>;

// Stringify

export type StringifyCallbackType = (queryParams: QueryParamsType | string | NegativeTypes) => string;

// Mapper

export type DefaultEndpointMapper<EndpointType = any> = (endpoint: EndpointType) => string;
