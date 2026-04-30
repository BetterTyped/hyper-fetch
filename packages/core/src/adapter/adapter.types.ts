/* eslint-disable @typescript-eslint/no-shadow */
import type { RequestInstance } from "request";

import type {
  EmptyTypes,
  ExtractAdapterEndpointMapperType,
  ExtractAdapterExtraType,
  ExtractAdapterPayloadMapperType,
  ExtractAdapterHeaderMapperType,
  ExtractAdapterQueryParamsMapperType,
  ExtractAdapterStatusType,
  ExtractAdapterType,
  ExtractErrorType,
  ExtractResponseType,
  TypeWithDefaults,
} from "../types";
import type { Adapter, DefaultMapperType } from "./adapter";
import type { getAdapterBindings } from "./adapter.bindings";

/**
 * Base Adapter
 */

export type AdapterInstance = Adapter<any, any, any, any, any, any, any, any, any, any, any>;

export type AdapterGenericType<
  AdapterOptions,
  MethodType extends string,
  StatusType extends number | string,
  Extra extends Record<string, any>,
  QueryParams = QueryParamsType | string | EmptyTypes,
  DefaultQueryParams = undefined,
  EndpointType = string,
  EndpointMapperType extends EndpointMapper<EndpointType> | DefaultMapperType = DefaultMapperType,
  QueryParamsMapperType extends QueryParamsMapper<QueryParams> | DefaultMapperType = DefaultMapperType,
  HeaderMapperType extends HeaderMappingType | DefaultMapperType = DefaultMapperType,
  PayloadMapperType extends AdapterPayloadMappingType | DefaultMapperType = DefaultMapperType,
> = {
  adapterOptions: AdapterOptions;
  methodType: MethodType;
  statusType: StatusType;
  extra: Extra;
  queryParams?: QueryParams;
  defaultQueryParams?: DefaultQueryParams;
  endpointType: EndpointType;
  endpointMapperType?: EndpointMapperType;
  queryParamsMapperType?: QueryParamsMapperType;
  headerMapperType?: HeaderMapperType;
  payloadMapperType?: PayloadMapperType;
};

export type DeclareAdapterType<
  Properties extends AdapterGenericType<any, any, any, any, any, any, any, any, any, any>,
> = Adapter<
  TypeWithDefaults<Properties, "adapterOptions", any>,
  TypeWithDefaults<Properties, "methodType", any>,
  TypeWithDefaults<Properties, "statusType", any>,
  TypeWithDefaults<Properties, "extra", any>,
  TypeWithDefaults<Properties, "queryParams", QueryParamsType | string | EmptyTypes>,
  TypeWithDefaults<Properties, "defaultQueryParams", undefined>,
  TypeWithDefaults<Properties, "endpointType", string>,
  TypeWithDefaults<Properties, "endpointMapperType", DefaultMapperType>,
  TypeWithDefaults<Properties, "queryParamsMapperType", DefaultMapperType>,
  TypeWithDefaults<Properties, "headerMapperType", DefaultMapperType>,
  NonNullable<TypeWithDefaults<Properties, "payloadMapperType", DefaultMapperType>>
>;

export type AdapterFetcherType<Adapter extends AdapterInstance> = (
  options: Omit<Awaited<ReturnType<typeof getAdapterBindings<Adapter>>>, "payload"> & {
    url: string;
    endpoint: ReturnType<ExtractAdapterEndpointMapperType<Adapter>>;
    queryParams: ReturnType<ExtractAdapterQueryParamsMapperType<Adapter>>;
    headers: ReturnType<ExtractAdapterHeaderMapperType<Adapter>>;
    payload: ReturnType<ExtractAdapterPayloadMapperType<Adapter>>;
    requestId: string;
    request: RequestInstance;
  },
) => void;

// Mappers

export type HeaderMappingType<Config = never> = (request: RequestInstance, config?: Config) => HeadersInit;
export type EndpointMapper<EndpointType, Config = never> = (endpoint: EndpointType, config?: Config) => string;
export type QueryParamsMapper<QueryParams, Config = never> = (
  queryParams: QueryParams | EmptyTypes,
  config?: Config,
) => any;
export type AdapterPayloadMappingType<Config = never> = (
  options: { request: RequestInstance; payload: unknown },
  config?: Config,
) => any;

export type DefaultEndpointMapper = (endpoint: string) => string;
export type DefaultQueryParamsMapper = (
  queryParams: QueryParamsType | string | EmptyTypes,
) => QueryParamsType | string | EmptyTypes;
export type DefaultHeaderMapper = (request: RequestInstance) => HeadersInit;
export type DefaultPayloadMapper = (options: { request: RequestInstance; payload: unknown }) => string;

// QueryParams

export type QueryParamValuesType = number | string | boolean | null | undefined | Record<any, any>;
export type QueryParamType = QueryParamValuesType | QueryParamValuesType[] | Record<string, QueryParamValuesType>;
export type QueryParamsType = Record<string, QueryParamType>;

// Responses

type RequestAdapterStatus<Req extends RequestInstance> = ExtractAdapterStatusType<ExtractAdapterType<Req>>;
type RequestAdapterExtra<Req extends RequestInstance> = ExtractAdapterExtraType<ExtractAdapterType<Req>>;

// It cannot be a union type because graphql may return both data and error
export type RequestResponseType<Request extends RequestInstance> = {
  data: ExtractResponseType<Request> | null;
  error: ExtractErrorType<Request> | null;
  status: RequestAdapterStatus<Request> | null;
  success: true | false;
  extra: RequestAdapterExtra<Request> | null;
  responseTimestamp: number;
  requestTimestamp: number;
};

/** The normalized response shape returned by every adapter after a request completes. */
export type ResponseType<GenericDataType, GenericErrorType, Adapter extends AdapterInstance> = {
  /** Response data when successful, null on error */
  data: GenericDataType | null;
  /** Error payload when the request fails, null on success */
  error: GenericErrorType | null;
  /** HTTP status code or adapter-specific status indicator */
  status: ExtractAdapterStatusType<Adapter> | null;
  /** Whether the request completed successfully */
  success: true | false;
  /** Adapter-specific metadata (e.g., response headers) */
  extra: ExtractAdapterExtraType<Adapter> | null;
  /** Timestamp (ms) when the response was received */
  responseTimestamp: number;
  /** Timestamp (ms) when the request was sent */
  requestTimestamp: number;
};
export type ResponseSuccessType<GenericDataType, Adapter extends AdapterInstance> = {
  data: GenericDataType;
  error: null;
  status: ExtractAdapterStatusType<Adapter> | null;
  success: true;
  extra: ExtractAdapterExtraType<Adapter> | null;
  responseTimestamp: number;
  requestTimestamp: number;
};
export type ResponseErrorType<GenericErrorType, Adapter extends AdapterInstance> = {
  data: null;
  error: GenericErrorType;
  status: ExtractAdapterStatusType<Adapter> | null;
  success: false;
  extra: ExtractAdapterExtraType<Adapter> | null;
  responseTimestamp: number;
  requestTimestamp: number;
};

// Progress

export type ProgressDataType = {
  /** Total size in bytes */
  total?: number;
  /** Loaded size in bytes */
  loaded?: number;
};

export type ProgressType = {
  /** Progress in percentage (0-100) */
  progress: number;
  /** Time left in seconds (null if not available) */
  timeLeft: number | null;
  /** Size left in bytes */
  sizeLeft: number;
  /** Total size in bytes */
  total: number;
  /** Loaded size in bytes */
  loaded: number;
  /** Start timestamp in milliseconds */
  startTimestamp: number;
};
