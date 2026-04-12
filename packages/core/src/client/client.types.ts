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
 * Effective cache mode on the client after resolving {@link ClientModeOption} from options.
 *
 * - `"client"` — Cache is enabled globally by default for cacheable requests.
 * - `"server"` — Cache is disabled by default unless `request.setScope(scopeId)` is set, to prevent
 *   cross-request data leaks.
 */
export type ClientMode = "client" | "server";

/**
 * How `Client` chooses {@link ClientMode}. Use `"auto"` (default) or omit the option to detect the environment.
 */
export type ClientModeOption = "auto" | ClientMode;

/**
 * Configuration setup for the client
 */
export type ClientOptionsType<C extends ClientInstance> = {
  /**
   * Url to your server
   */
  url: string;
  /**
   * How the effective {@link ClientMode} is chosen for cache behavior.
   *
   * - `"auto"` (default when omitted): browser → `"client"`, otherwise `"server"`.
   * - `"client"` / `"server"`: force that mode regardless of environment (tests, SSR overrides, etc.).
   */
  mode?: ClientModeOption;
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
