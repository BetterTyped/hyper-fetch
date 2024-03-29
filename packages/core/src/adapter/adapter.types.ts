import { RequestInstance } from "request";
import { HttpMethodsType, HttpStatusType } from "../types";

/**
 * Base Adapter
 */

export type AdapterInstance = AdapterType<any, any, any, any, any, any>;

export type AdapterType<
  AdapterOptions = AdapterOptionsType,
  MethodType = HttpMethodsType,
  StatusType = HttpStatusType,
  Extra extends Record<string, any> = AdapterExtraType,
  QueryParams = QueryParamsType | string,
  EndpointType = string,
> = (
  request: RequestInstance,
  requestId: string,
  // This is never used in the application, we pass this type to have unions extracting possibilities
  DO_NOT_USE?: {
    method?: MethodType;
    options?: AdapterOptions;
    status?: StatusType;
    extra?: Extra;
    queryParams?: QueryParams;
    endpointType?: EndpointType;
  },
  // [any any any] as a way to avoid circular reference that destroyed request type.
) => Promise<ResponseReturnType<any, any, any>>;

/**
 * Extractors
 */

export type ExtractAdapterOptionsType<T> = T extends AdapterType<infer O, any, any, any, any> ? O : never;
export type ExtractAdapterMethodType<T> = T extends AdapterType<any, infer M, any, any, any> ? M : never;
export type ExtractAdapterStatusType<T> = T extends AdapterType<any, any, infer S, any, any> ? S : never;
export type ExtractAdapterExtraType<T> = T extends AdapterType<any, any, any, infer A, any> ? A : never;
export type ExtractAdapterQueryParamsType<T> = T extends AdapterType<any, any, any, any, infer Q> ? Q : never;
export type ExtractAdapterEndpointType<T> = T extends AdapterType<any, any, any, any, any, infer E> ? E : never;
// Special type only for selecting appropriate AdapterType union version (check FirebaseAdapterType).
export type ExtractUnionAdapter<
  Adapter extends AdapterInstance,
  Values extends {
    method?: any;
    options?: any;
    status?: any;
    extra?: any;
    queryParams?: any;
    endpointType?: any;
  },
> = Extract<
  Adapter,
  AdapterType<
    Values["options"],
    Values["method"],
    Values["status"],
    Values["extra"],
    Values["queryParams"],
    Values["endpointType"]
  >
> extends AdapterInstance
  ? Extract<
      Adapter,
      AdapterType<
        Values["options"],
        Values["method"],
        Values["status"],
        Values["extra"],
        Values["queryParams"],
        Values["endpointType"]
      >
    >
  : never;

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
