/* eslint-disable @typescript-eslint/no-shadow */
import type {
  NullableKeys,
  EmptyTypes,
  ExtractParamsType,
  ExtractPayloadType,
  ExtractAdapterType,
  ExtractEndpointType,
  ExtractHasPayloadType,
  ExtractHasParamsType,
  ExtractHasQueryParamsType,
  ExtractErrorType,
  ExtractResponseType,
  HttpMethodsType,
  ExtractQueryParamsType,
  ExtractAdapterOptionsType,
  ExtractAdapterMethodType,
  TypeWithDefaults,
} from "types";
import type { Request } from "./request";
import type { RequestResponseType, ResponseSuccessType, ResponseErrorType } from "adapter";
import type { RequestEventType, RequestProgressEventType, RequestResponseEventType } from "managers";
import type { ClientInstance } from "client";

// Instance

export type RequestInstanceProperties = {
  response?: any;
  payload?: any;
  error?: any;
  client?: ClientInstance;
  queryParams?: any;
  endpoint?: string;
  hasParams?: boolean;
  hasQueryParams?: boolean;
  hasPayload?: boolean;
};

/**
 * The **constraint** form of a Request type. Mindset: "any Request that matches this partial shape".
 *
 * Use `RequestInstance` when you are writing a **reusable abstraction** that accepts requests from
 * the outside - generic helpers (`<T extends RequestInstance>`), reusable UI components / hooks,
 * `sdk.$configure({...})` callbacks, mocking utilities, interceptors, return types, etc.
 *
 * Unspecified generic parameters default to `any` **on purpose**: an omitted field means
 * "I do not care about that field, the caller picks anything". This is exactly what you want
 * for a constraint - any concrete `Request` satisfies it. Partial constraints work too:
 * `RequestInstance<{ response: User[] }>` accepts every request that returns `User[]`,
 * regardless of payload, params, queryParams, error, etc.
 *
 * For describing a **single endpoint** inside an SDK schema, use {@link RequestModel} instead.
 * `RequestModel` uses safe non-`any` defaults (`unknown`, `undefined`, `Error`, `string`, `false`)
 * so omitted fields stay strict instead of silently collapsing to `any`.
 *
 * @example
 * ```ts
 * // Reusable component: accepts any request whose response is User[]
 * function UserList<T extends RequestInstance<{ response: User[] }>>(props: { request: T }) {
 *   // ...
 * }
 *
 * // sdk.$configure callback: accepts any request the SDK happens to dispatch
 * sdk.$configure({
 *   "users.$get": (request: RequestInstance) => request.setMock(() => ({ data: [] })),
 * });
 * ```
 *
 * @see {@link RequestModel} - definition counterpart for SDK schema modeling.
 */
export type RequestInstance<
  RequestProperties extends RequestInstanceProperties = {
    response?: any;
    payload?: any;
    queryParams?: any;
    error?: any;
    client?: ClientInstance;
  },
> = Request<
  TypeWithDefaults<RequestProperties, "response", any>,
  TypeWithDefaults<RequestProperties, "payload", any>,
  TypeWithDefaults<RequestProperties, "queryParams", any>,
  TypeWithDefaults<RequestProperties, "error", any>,
  TypeWithDefaults<RequestProperties, "endpoint", any>,
  TypeWithDefaults<RequestProperties, "client", ClientInstance>,
  TypeWithDefaults<RequestProperties, "hasPayload", any>,
  TypeWithDefaults<RequestProperties, "hasParams", any>,
  TypeWithDefaults<RequestProperties, "hasQueryParams", any>,
  any
>;

/**
 * The **definition** form of a Request type. Mindset: "**this** specific endpoint".
 *
 * Use `RequestModel` when you are **defining** a request inside an SDK schema or a request
 * factory. Unlike {@link RequestInstance}, every unspecified field stays strict instead of
 * falling back to `any` - because in a definition, an omitted field means "**there is no
 * payload / no query / no params here**", not "anything goes". The type system will reject
 * mismatches at the call site instead of silently erasing them.
 *
 * The `client` field is also injected automatically by `createSdk(client)` at the SDK boundary,
 * so you never need to repeat it inside schema declarations.
 *
 * ### Defaults for omitted fields
 *
 * | Field             | Default          | Why                                                                    |
 * | ----------------- | ---------------- | ---------------------------------------------------------------------- |
 * | `response`        | `unknown`        | Forces narrowing in consumer code; never silently widened.             |
 * | `payload`         | `undefined`      | "No body declared." `.setData()` is required for typed bodies.         |
 * | `queryParams`     | `undefined`      | Same as payload.                                                       |
 * | `error`           | `Error`          | Sensible default; override per-endpoint when the API has a known shape.|
 * | `endpoint`        | `string`         | Allows literal narrowing without erasure. Pass a string literal.       |
 * | `client`          | `ClientInstance` | Injected by `createSdk(client)`; you do not need to set this manually. |
 * | `hasPayload`      | `false`          | "Caller must call `.setData()`." Override only when payload is bound.  |
 * | `hasParams`       | `false`          | Same as `hasPayload` for params.                                       |
 * | `hasQueryParams`  | `false`          | Same as `hasPayload` for query params.                                 |
 * | `mutationContext` | `undefined`      | Optional context; default is "no context".                             |
 *
 * @example
 * ```ts
 * // Schema describes shape only - client is injected by createSdk(client).
 * type ApiSchema = {
 *   users: {
 *     $get: RequestModel<{
 *       response: User[];
 *       endpoint: "/users";
 *     }>;
 *     $userId: {
 *       $get: RequestModel<{
 *         response: User;
 *         endpoint: "/users/:userId";
 *       }>;
 *     };
 *   };
 * };
 * ```
 *
 * @see {@link RequestInstance} - constraint counterpart for accepting any Request.
 */
export type RequestModel<
  RequestProperties extends RequestInstanceProperties = {
    response?: unknown;
    payload?: undefined;
    queryParams?: undefined;
    error?: Error;
    client?: ClientInstance;
  },
> = Request<
  TypeWithDefaults<RequestProperties, "response", unknown>,
  TypeWithDefaults<RequestProperties, "payload", undefined>,
  TypeWithDefaults<RequestProperties, "queryParams", undefined>,
  TypeWithDefaults<RequestProperties, "error", Error>,
  TypeWithDefaults<RequestProperties, "endpoint", string>,
  TypeWithDefaults<RequestProperties, "client", ClientInstance>,
  TypeWithDefaults<RequestProperties, "hasPayload", false>,
  TypeWithDefaults<RequestProperties, "hasParams", false>,
  TypeWithDefaults<RequestProperties, "hasQueryParams", false>,
  undefined
>;

// Progress
export type ProgressEventType = { total: number; loaded: number };

/**
 * Dump of the request used to later recreate it
 */
export type RequestJSON<Request extends RequestInstance> = {
  requestOptions: RequestOptionsType<
    ExtractEndpointType<Request>,
    ExtractAdapterOptionsType<ExtractAdapterType<Request>>,
    ExtractAdapterMethodType<ExtractAdapterType<Request>>
  >;
  endpoint: ExtractEndpointType<Request>;
  method: ExtractAdapterMethodType<ExtractAdapterType<Request>>;
  headers?: HeadersInit;
  auth: boolean;
  cancelable: boolean;
  retry: number;
  retryTime: number;
  cacheTime: number;
  cache: boolean;
  staleTime: number;
  queued: boolean;
  offline: boolean;
  disableResponseInterceptors: boolean | undefined;
  disableRequestInterceptors: boolean | undefined;
  options?: ExtractAdapterOptionsType<ExtractAdapterType<Request>>;
  payload: PayloadType<ExtractPayloadType<Request>>;
  params: ExtractParamsType<Request> | EmptyTypes;
  queryParams: ExtractQueryParamsType<Request> | EmptyTypes;
  abortKey: string;
  cacheKey: string;
  queryKey: string;
  used: boolean;
  updatedAbortKey: boolean;
  updatedCacheKey: boolean;
  updatedQueryKey: boolean;
  deduplicate: boolean;
  deduplicateTime: number | null;
  scope: string | null;
  isMockerEnabled: boolean;
  hasMock: boolean;
};

// Request

/**
 * Configuration options for request creation
 */
export type RequestOptionsType<GenericEndpoint, AdapterOptions, RequestMethods = HttpMethodsType> = {
  /**
   * Determine the endpoint for the request
   */
  endpoint: GenericEndpoint;
  /**
   * Custom headers for request
   */
  headers?: HeadersInit;
  /**
   * Should the onAuth method get called on this request
   */
  auth?: boolean;
  /**
   * Request method picked from method names handled by adapter
   * With default adapter it is GET | POST | PATCH | PUT | DELETE
   */
  method?: RequestMethods;
  /**
   * Should enable cancelable mode in the Dispatcher
   */
  cancelable?: boolean;
  /**
   * Retry count when request is failed
   */
  retry?: number;
  /**
   * Retry time delay between retries
   */
  retryTime?: number;
  /**
   * Should we trigger garbage collection or leave data in memory
   */
  cacheTime?: number;
  /**
   * Should we save the response to cache
   */
  cache?: boolean;
  /**
   * Time for which the cache is considered up-to-date
   */
  staleTime?: number;
  /**
   * Should the requests be queued and sent one-by-one
   */
  queued?: boolean;
  /**
   * Do we want to store request made in offline mode for latter use when we go back online
   */
  offline?: boolean;
  /**
   * Disable post-request interceptors
   */
  disableResponseInterceptors?: boolean;
  /**
   * Disable pre-request interceptors
   */
  disableRequestInterceptors?: boolean;
  /**
   * Additional options for your adapter, by default XHR options
   */
  options?: AdapterOptions;
  /**
   * Key which will be used to cancel requests. Autogenerated by default.
   */
  abortKey?: string;
  /**
   * Key which will be used to cache requests. Autogenerated by default.
   */
  cacheKey?: string;
  /**
   * Key which will be used to queue requests. Autogenerated by default.
   */
  queryKey?: string;
  /**
   * Should we deduplicate two requests made at the same time into one
   */
  deduplicate?: boolean;
  /**
   * Time of pooling for the deduplication to be active (default 10ms)
   */
  deduplicateTime?: number;
};

export type PayloadMapperType<Payload> = <NewDataType>(payload: Payload) => NewDataType;

export type PayloadType<Payload> = Payload | EmptyTypes;

export type RequestConfigurationType<
  Payload,
  Params,
  QueryParams,
  GenericEndpoint extends string,
  AdapterOptions,
  MethodsType,
> = {
  used?: boolean;
  params?: Params | EmptyTypes;
  queryParams?: QueryParams | EmptyTypes;
  payload?: PayloadType<Payload>;
  headers?: HeadersInit;
  updatedAbortKey?: boolean;
  updatedCacheKey?: boolean;
  updatedQueryKey?: boolean;
  updatedEffectKey?: boolean;
  scope?: string | null;
} & Partial<NullableKeys<RequestOptionsType<GenericEndpoint, AdapterOptions, MethodsType>>>;

export type ParamType = string | number;
export type ParamsType = Record<string, ParamType>;

export type ExtractUrlParams<T extends string> = string extends T
  ? EmptyTypes
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends `${string}:${infer Param}/${infer Rest}`
    ? { [k in Param | keyof ExtractUrlParams<Rest>]: ParamType }
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
      T extends `${string}:${infer Param}`
      ? { [k in Param]: ParamType }
      : EmptyTypes;

/**
 * If the request endpoint parameters are not filled it will throw an error
 */
export type FetchParamsType<Params, HasParams extends true | false> = Params extends EmptyTypes | void | never
  ? { params?: EmptyTypes }
  : HasParams extends true
    ? { params?: EmptyTypes }
    : { params: Params };

/**
 * If the request data is not filled it will throw an error
 */
export type FetchPayloadType<Payload, HasPayload extends true | false> = Payload extends EmptyTypes | void | never
  ? { payload?: EmptyTypes }
  : HasPayload extends true
    ? { payload?: EmptyTypes }
    : { payload: Payload };

/**
 * It will check if the query params are already set
 */
export type FetchQueryParamsType<QueryParams, HasQuery extends true | false = false> = HasQuery extends true
  ? { queryParams?: EmptyTypes | undefined }
  : QueryParams extends EmptyTypes | void | never
    ? { queryParams?: QueryParams }
    : {
        queryParams: QueryParams;
      };

export type RequestCachePolicyType = "network-only" | "cache-first" | "revalidate";

export type RequestDynamicSendOptionsType<Request extends RequestInstance> = Omit<
  Partial<RequestOptionsType<string, ExtractAdapterOptionsType<ExtractAdapterType<Request>>>>,
  "params" | "data" | "endpoint" | "method"
> & {
  dispatcherType?: "auto" | "fetch" | "submit";
  cachePolicy?: RequestCachePolicyType;
};

// Request making

export type RequestSendOptionsType<Request extends RequestInstance> = FetchQueryParamsType<
  ExtractQueryParamsType<Request>,
  ExtractHasQueryParamsType<Request>
> &
  FetchParamsType<ExtractParamsType<Request>, ExtractHasParamsType<Request>> &
  FetchPayloadType<ExtractPayloadType<Request>, ExtractHasPayloadType<Request>> &
  RequestSendActionsType<Request> &
  RequestDynamicSendOptionsType<Request>;

export type RequestSendActionsType<Request extends RequestInstance> = {
  onBeforeSent?: (eventData: RequestEventType<Request>) => void;
  onRequestStart?: (eventData: RequestEventType<Request>) => void;
  onResponseStart?: (eventData: RequestEventType<Request>) => void;
  onUploadProgress?: (eventData: RequestProgressEventType<Request>) => void;
  onDownloadProgress?: (eventData: RequestProgressEventType<Request>) => void;
  onResponse?: (eventData: RequestResponseEventType<Request>) => void;
  onRemove?: (eventData: RequestEventType<Request>) => void;
};

type IsNegativeType<T> = void extends T
  ? EmptyTypes
  : undefined extends T
    ? EmptyTypes
    : null extends T
      ? EmptyTypes
      : T;

type HasRequiredSendFields<Opts> =
  IsNegativeType<Opts extends { payload: infer P } ? P : void> extends EmptyTypes | void | never
    ? IsNegativeType<Opts extends { params: infer P } ? P : void> extends EmptyTypes | void | never
      ? IsNegativeType<Opts extends { queryParams: infer Q } ? Q : void> extends EmptyTypes | void | never
        ? false
        : true
      : true
    : true;

export type RequestSendType<Request extends RequestInstance> =
  HasRequiredSendFields<RequestSendOptionsType<Request>> extends true
    ? (options: RequestSendOptionsType<Request>) => Promise<RequestResponseType<Request>>
    : (options?: RequestSendOptionsType<Request>) => Promise<RequestResponseType<Request>>;

// Retry

export type RetryOnErrorCallbackType<Request extends RequestInstance> = (
  response: RequestResponseType<Request>,
) => boolean;

// Optimistic

export type OptimisticCallbackArgs<Req extends RequestInstance> = {
  request: Req;
  client: Req["client"];
  payload: ExtractPayloadType<Req>;
};

export type OptimisticCallbackResult<Ctx> = {
  context?: Ctx;
  rollback?: () => void;
  invalidate?: RequestInstance[];
};

export type OptimisticCallback<Req extends RequestInstance, Ctx = undefined> = (
  args: OptimisticCallbackArgs<Req>,
) => OptimisticCallbackResult<Ctx> | Promise<OptimisticCallbackResult<Ctx>>;

// Mappers

export type RequestMapper<Request extends RequestInstance, NewRequest extends RequestInstance> = (
  request: Request,
  requestId: string,
) => NewRequest | Promise<NewRequest>;

export type ResponseMapper<
  Request extends RequestInstance,
  MappedResponse extends ResponseSuccessType<any, any> | ResponseErrorType<any, any>,
> = (
  response:
    | ResponseSuccessType<ExtractResponseType<Request>, ExtractAdapterType<Request>>
    | ResponseErrorType<ExtractErrorType<Request>, ExtractAdapterType<Request>>,
) => MappedResponse | Promise<MappedResponse>;
