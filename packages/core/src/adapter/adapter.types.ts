import { RequestInstance } from "request";
import { HttpMethodsType, HttpStatusType, TypeWithDefaults } from "../types";

/**
 * Base Adapter
 */

export type AdapterInstance = AdapterType<{
  options: any;
  method: any;
  status: any;
  extra: any;
  queryParams: any;
  endpoint: any;
}>;

export type AdapterType<
  Properties extends {
    options?: any;
    method?: any;
    status?: any;
    extra?: Record<string, any>;
    queryParams?: QueryParamsType | string;
    endpoint?: any;
  } = {
    options: AdapterOptionsType;
    method: HttpMethodsType;
    status: HttpStatusType;
    extra: AdapterExtraType;
    queryParams: QueryParamsType | string;
    endpoint: string;
  },
> = (
  request: RequestInstance,
  requestId: string,
  // This is never used in the application, we pass this type to have unions extracting possibilities
  DO_NOT_USE?: {
    options: ExtractAdapterOptionsType<AdapterType<Properties>>;
    method: ExtractAdapterMethodType<AdapterType<Properties>>;
    status: ExtractAdapterStatusType<AdapterType<Properties>>;
    extra: ExtractAdapterExtraType<AdapterType<Properties>>;
    queryParams: ExtractAdapterQueryParamsType<AdapterType<Properties>>;
    endpoint: ExtractAdapterEndpointType<AdapterType<Properties>>;
  },
  // [any any any] as a way to avoid circular reference that destroyed request type.
) => Promise<ResponseReturnType<any, any, any>>;

/**
 * Extractors
 */

export type ExtractAdapterOptionsType<T extends AdapterInstance> =
  T extends AdapterType<infer P> ? TypeWithDefaults<P, "options", AdapterOptionsType> : AdapterOptionsType;
export type ExtractAdapterMethodType<T extends AdapterInstance> =
  T extends AdapterType<infer P> ? TypeWithDefaults<P, "method", HttpMethodsType> : HttpMethodsType;
export type ExtractAdapterStatusType<T extends AdapterInstance> =
  T extends AdapterType<infer P> ? TypeWithDefaults<P, "status", HttpStatusType> : HttpStatusType;
export type ExtractAdapterExtraType<T extends AdapterInstance> =
  T extends AdapterType<infer P> ? TypeWithDefaults<P, "extra", Record<string, any>> : Record<string, any>;
export type ExtractAdapterQueryParamsType<T extends AdapterInstance> =
  T extends AdapterType<infer P>
    ? TypeWithDefaults<P, "queryParams", QueryParamsType | string>
    : QueryParamsType | string;
export type ExtractAdapterEndpointType<T extends AdapterInstance> =
  T extends AdapterType<infer P> ? TypeWithDefaults<P, "endpoint", string> : string;

// Special type only for selecting appropriate AdapterType union version (check FirebaseAdapterType).
export type ExtractUnionAdapter<
  Adapter extends AdapterInstance,
  Values extends {
    options?: any;
    method?: any;
    status?: any;
    extra?: any;
    queryParams?: any;
    endpoint?: any;
  },
> = Extract<Adapter, AdapterType<Values>> extends AdapterInstance ? Extract<Adapter, AdapterType<Values>> : never;

/**
 * Options
 */

export type AdapterOptionsType = Partial<XMLHttpRequest>;

export type AdapterExtraType = {
  headers: Record<string, string>;
};

export type AdapterPayloadMappingType = (data: unknown) => string | FormData;

// Responses

export type ResponseReturnType<GenericDataType, GenericErrorType, Adapter extends AdapterInstance> = {
  data: GenericDataType | null;
  error: GenericErrorType | null;
  status: ExtractAdapterStatusType<Adapter> | null;
  success: boolean;
  extra: ExtractAdapterExtraType<Adapter> | null;
};
export type ResponseReturnSuccessType<GenericDataType, Adapter extends AdapterInstance> = {
  data: GenericDataType;
  error: null;
  status: ExtractAdapterStatusType<Adapter> | null;
  success: boolean;
  extra: ExtractAdapterExtraType<Adapter> | null;
};
export type ResponseReturnErrorType<GenericErrorType, Adapter extends AdapterInstance> = {
  data: null;
  error: GenericErrorType;
  status: ExtractAdapterStatusType<Adapter> | null;
  success: boolean;
  extra: ExtractAdapterExtraType<Adapter> | null;
};

// QueryParams

export type QueryParamValuesType = number | string | boolean | null | undefined | Record<any, any>;
export type QueryParamType = QueryParamValuesType | Array<QueryParamValuesType> | Record<string, QueryParamValuesType>;
export type QueryParamsType = Record<string, QueryParamType>;

// Headers

export type HeaderMappingType = <T extends RequestInstance>(request: T) => HeadersInit;

export type AdapterHeadersProps = {
  isFormData: boolean;
  headers: HeadersInit | undefined;
};

// Stringify

export type QueryStringifyOptionsType = {
  /**
   * Strict URI encoding
   */
  strict?: boolean;
  /**
   * Encode keys and values
   */
  encode?: boolean;
  /**
   * Array encoding type
   */
  arrayFormat?: "bracket" | "index" | "comma" | "separator" | "bracket-separator" | "none";
  /**
   * Array format separator
   */
  arraySeparator?: string;
  /**
   * Skip keys with null values
   */
  skipNull?: boolean;
  /**
   * Skip keys with empty string
   */
  skipEmptyString?: boolean;

  /**
   * Parsing function for date type query param
   */
  dateParser?: (value: QueryParamType) => string;
  /**
   * Parsing function for object type query param
   */
  objectParser?: (value: QueryParamType) => string;
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

export type AdapterBindingsReturnType = {
  fullUrl: string;
  config;
};
