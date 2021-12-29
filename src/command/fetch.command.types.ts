import { ClientResponseType, ClientQueryParamsType } from "client";
import { HttpMethodsType, NegativeTypes, NullableKeys } from "types";
import { FetchCommand } from "./fetch.command";

// Progress
export type ClientProgressEvent = { total: number; loaded: number };
export type ClientProgressResponse = { progress: number; timeLeft: number; sizeLeft: number };

// Dump

export type FetchCommandDump<ClientOptions> = Omit<
  FetchCommandOptions<string, ClientOptions>,
  "method" | "abortKey" | "cacheKey" | "queueKey"
> & {
  method: HttpMethodsType;
  data?: unknown;
  queryParams: ClientQueryParamsType | string | NegativeTypes;
  abortKey: string;
  cacheKey: string;
  queueKey: string;
};

// Command
export type FetchCommandOptions<GenericEndpoint extends string, ClientOptions> = {
  endpoint: GenericEndpoint;
  headers?: HeadersInit;
  method?: HttpMethodsType;
  cancelable?: boolean;
  retry?: boolean | number;
  retryTime?: number;
  cacheTime?: number;
  queued?: boolean;
  deepEqual?: boolean;
  disableResponseInterceptors?: boolean;
  disableRequestInterceptors?: boolean;
  options?: ClientOptions;
  abortKey?: string;
  cacheKey?: string;
  queueKey?: string;
};

export type DefaultOptionsType<
  ResponseType,
  PayloadType,
  QueryParamsType,
  ErrorType,
  GenericEndpoint extends string,
  ClientOptions,
> = {
  params?: ExtractRouteParams<GenericEndpoint> | NegativeTypes;
  queryParams?: QueryParamsType | string | NegativeTypes;
  data?: PayloadType | NegativeTypes;
  mockCallback?: ((data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) | undefined;
  headers?: HeadersInit;
} & Partial<NullableKeys<FetchCommandOptions<GenericEndpoint, ClientOptions>>>;

export type ParamType = string | number;
export type ParamsType = Record<string, ParamType>;

export type ExtractRouteParams<T extends string> = string extends T
  ? NegativeTypes
  : T extends `${string}:${infer Param}/${infer Rest}`
  ? { [k in Param | keyof ExtractRouteParams<Rest>]: ParamType }
  : T extends `${string}:${infer Param}`
  ? { [k in Param]: ParamType }
  : NegativeTypes;

export type FetchQueryParamsType<QueryParamsType, HasQuery extends true | false = false> = HasQuery extends true
  ? { queryParams?: NegativeTypes }
  : {
      queryParams?: QueryParamsType | string;
    };

export type FetchParamsType<
  EndpointType extends string,
  HasParams extends true | false = false,
> = ExtractRouteParams<EndpointType> extends NegativeTypes
  ? { params?: NegativeTypes }
  : true extends HasParams
  ? { params?: NegativeTypes }
  : { params: ExtractRouteParams<EndpointType> };

export type FetchRequestDataType<PayloadType, HasData extends true | false = false> = PayloadType extends NegativeTypes
  ? { data?: NegativeTypes }
  : HasData extends true
  ? { data?: NegativeTypes }
  : { data: PayloadType };

export type FetchType<
  PayloadType,
  QueryParamsType,
  EndpointType extends string,
  HasData extends true | false,
  HasParams extends true | false,
  HasQuery extends true | false,
> = FetchQueryParamsType<QueryParamsType, HasQuery> &
  FetchParamsType<EndpointType, HasParams> &
  FetchRequestDataType<PayloadType, HasData>;

export type FetchMethodType<
  ResponseType,
  PayloadType,
  QueryParamsType,
  ErrorType,
  EndpointType extends string,
  HasData extends true | false,
  HasParams extends true | false,
  HasQuery extends true | false,
> = FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>["data"] extends any
  ? (
      options?: FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>,
    ) => Promise<ClientResponseType<ResponseType, ErrorType>>
  : FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>["data"] extends NegativeTypes
  ? FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>["params"] extends NegativeTypes
    ? (
        options?: FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>,
      ) => Promise<ClientResponseType<ResponseType, ErrorType>>
    : (
        options: FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>,
      ) => Promise<ClientResponseType<ResponseType, ErrorType>>
  : (
      options: FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>,
    ) => Promise<ClientResponseType<ResponseType, ErrorType>>;

export type FetchCommandInstance = FetchCommand<any, any, any, any, any, any, any, any, any>;
