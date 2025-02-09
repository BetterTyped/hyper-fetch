import { RequestInstance } from "request";
import {
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
import { Adapter, DefaultMapperType } from "./adapter";
import { getAdapterBindings } from "./adapter.bindings";

/**
 * Base Adapter
 */

export type AdapterInstance = Adapter<any, any, any, any, any, any, any, any, any, any>;

export type AdapterGenericType<
  AdapterOptions,
  MethodType extends string,
  StatusType extends number | string,
  Extra extends Record<string, any>,
  QueryParams = QueryParamsType | string | EmptyTypes,
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
  endpointType: EndpointType;
  endpointMapperType?: EndpointMapperType;
  queryParamsMapperType?: QueryParamsMapperType;
  headerMapperType?: HeaderMapperType;
  payloadMapperType?: PayloadMapperType;
};

export type DeclareAdapterType<Properties extends AdapterGenericType<any, any, any, any, any, any, any, any, any>> =
  Adapter<
    TypeWithDefaults<Properties, "adapterOptions", any>,
    TypeWithDefaults<Properties, "methodType", any>,
    TypeWithDefaults<Properties, "statusType", any>,
    TypeWithDefaults<Properties, "extra", any>,
    TypeWithDefaults<Properties, "queryParams", QueryParamsType | string | EmptyTypes>,
    TypeWithDefaults<Properties, "endpointType", string>,
    TypeWithDefaults<Properties, "endpointMapperType", DefaultMapperType>,
    TypeWithDefaults<Properties, "queryParamsMapperType", DefaultMapperType>,
    TypeWithDefaults<Properties, "headerMapperType", DefaultMapperType>,
    NonNullable<TypeWithDefaults<Properties, "payloadMapperType", DefaultMapperType>>
  >;

export type AdapterFetcherType<Adapter extends AdapterInstance> = (
  options: Exclude<Awaited<ReturnType<typeof getAdapterBindings<Adapter>>>, "payload"> & {
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
export type QueryParamType = QueryParamValuesType | Array<QueryParamValuesType> | Record<string, QueryParamValuesType>;
export type QueryParamsType = Record<string, QueryParamType>;

// Responses

export type RequestResponseType<Request extends RequestInstance> = {
  data: ExtractResponseType<Request> | null;
  error: ExtractErrorType<Request> | null;
  status: ExtractAdapterStatusType<ExtractAdapterType<Request>> | null;
  success: true | false;
  extra: ExtractAdapterExtraType<ExtractAdapterType<Request>> | null;
  responseTimestamp: number;
  requestTimestamp: number;
};
export type ResponseType<GenericDataType, GenericErrorType, Adapter extends AdapterInstance> = {
  data: GenericDataType | null;
  error: GenericErrorType | null;
  status: ExtractAdapterStatusType<Adapter> | null;
  success: true | false;
  extra: ExtractAdapterExtraType<Adapter> | null;
  responseTimestamp: number;
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
  total?: number;
  loaded?: number;
};

export type ProgressType = {
  progress: number;
  timeLeft: number | null;
  sizeLeft: number;
  total: number;
  loaded: number;
  startTimestamp: number;
};
