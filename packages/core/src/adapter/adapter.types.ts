import { RequestInstance } from "request";
import {HttpMethodsType} from "../types";

// Adapter

export type ExtractAdapterOptions<T> = T extends BaseAdapterType<infer O, any, any> ? O : never;
export type ExtractAdapterMethodType<T> = T extends BaseAdapterType<any, infer O, any> ? O : never;
export type ExtractAdapterQueryParamsType<T> = T extends BaseAdapterType<any, any, infer O> ? O : never;

export type BaseAdapterType<AdapterOptions = AdapterOptionsType, MethodType = HttpMethodsType, QueryParams = QueryParamsType>= (request: RequestInstance, requestId: string) => Promise<ResponseType<any, any>>;

export type AdapterOptionsType = Partial<XMLHttpRequest>;

export type AdapterPayloadMappingType = (data: unknown) => string | FormData;

// Responses

export type ResponseType<GenericDataType, GenericErrorType> = [
  GenericDataType | null,
  GenericErrorType | null,
  number | null,
];
export type ResponseSuccessType<GenericDataType> = [GenericDataType, null, number | null];
export type ResponseErrorType<GenericErrorType> = [null, GenericErrorType, number | null];

// QueryParams

export type QueryParamValuesType = number | string | boolean | null | undefined;
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
