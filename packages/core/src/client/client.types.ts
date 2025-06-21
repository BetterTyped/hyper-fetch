import { RequestInstance } from "request";
import { AdapterInstance, ResponseType } from "adapter";
import { Client } from "client";
import type { ExtendRequest, ExtractClientAdapterType, TypeWithDefaults } from "types";

export type ClientErrorType = Record<string, any> | string;
export type ClientInstanceProperties = {
  error?: any;
  adapter?: AdapterInstance;
};

export type ClientInstance<
  ClientProperties extends ClientInstanceProperties = {
    error?: any;
    adapter?: AdapterInstance;
  },
> = Client<
  TypeWithDefaults<ClientProperties, "error", any>,
  TypeWithDefaults<ClientProperties, "adapter", AdapterInstance>
>;

export type RequestGenericType<QueryParams> = {
  response?: any;
  payload?: any;
  error?: any;
  queryParams?: QueryParams;
  endpoint?: string;
  params?: Record<string, string | number>;
};

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
  adapter?: ExtractClientAdapterType<C>;
  /**
   * Custom cache initialization prop
   */
  cache?: () => C["cache"];
  /**
   * Custom app manager initialization prop
   */
  appManager?: () => C["appManager"];
  /**
   * Custom fetch dispatcher initialization prop
   */
  fetchDispatcher?: () => C["submitDispatcher"];
  /**
   * Custom submit dispatcher initialization prop
   */
  submitDispatcher?: () => C["fetchDispatcher"];
};

// Interceptors

export type RequestInterceptorType = (request: RequestInstance) => Promise<RequestInstance> | RequestInstance;
export type ResponseInterceptorType<Client extends ClientInstance, Response = any, Error = any> = (
  response: ResponseType<Response, Error, ExtractClientAdapterType<Client>>,
  request: ExtendRequest<
    RequestInstance,
    {
      client: Client;
    }
  >,
) =>
  | Promise<ResponseType<any, any, ExtractClientAdapterType<Client>>>
  | ResponseType<any, any, ExtractClientAdapterType<Client>>;

// Stringify

export type ModifyQueryParamsCallbackType<QueryParams, ModifiedQueryParams> = (
  queryParams: QueryParams,
) => ModifiedQueryParams;
