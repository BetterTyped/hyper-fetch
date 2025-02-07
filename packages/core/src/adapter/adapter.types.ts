import { RequestInstance } from "request";
import { Client } from "client";
import {
  EmptyTypes,
  ExtendRequest,
  ExtractAdapterEndpointMapperType,
  ExtractAdapterExtraType,
  ExtractAdapterPayloadMapperType,
  ExtractAdapterHeaderMapperType,
  ExtractAdapterQueryParamsMapperType,
  ExtractAdapterQueryParamsType,
  ExtractAdapterStatusType,
  ExtractAdapterType,
  ExtractErrorType,
  ExtractResponseType,
} from "../types";
import { Adapter } from "./adapter";
import { getAdapterBindings } from "./adapter.bindings";

/**
 * Base Adapter
 */

export type AdapterInstance = Adapter<any, any, any, any, any, any, any, any, any, any>;

export type AdapterFetcherType<Adapter extends AdapterInstance> = (
  options: Exclude<Awaited<ReturnType<typeof getAdapterBindings<Adapter>>>, "payload"> & {
    url: string;
    // Todo figure out way to pass the generic types from the mapper functions
    endpoint: ReturnType<ExtractAdapterEndpointMapperType<Adapter>>;
    queryParams: ReturnType<ExtractAdapterQueryParamsMapperType<Adapter>>;
    headers: ReturnType<ExtractAdapterHeaderMapperType<Adapter>>;
    payload: ReturnType<ExtractAdapterPayloadMapperType<Adapter>>;
    request: ExtendRequest<
      RequestInstance,
      {
        client: Client<any, Adapter>;
        queryParams?: ExtractAdapterQueryParamsType<Adapter>;
      }
    >;
  },
) => void;

// Mappers

export type HeaderMappingType = (request: RequestInstance) => HeadersInit;
export type EndpointMapper<EndpointType> = (endpoint: EndpointType) => string;
export type QueryParamsMapper<QueryParams> = (queryParams: QueryParams | EmptyTypes) => any;
export type AdapterPayloadMappingType = (options: { request: RequestInstance; payload: unknown }) => any;

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
