import { RequestInstance } from "request";
import { HttpMethodsType } from "../types";

// Adapter

export type ExtractAdapterOptions<T> = T extends BaseAdapterType<infer O, any, any, any> ? O : never;
export type ExtractAdapterMethodType<T> = T extends BaseAdapterType<any, infer M, any, any> ? M : never;
export type ExtractAdapterAdditionalDataType<T> = T extends BaseAdapterType<any, any, infer A, any> ? A : never;
export type ExtractAdapterQueryParamsType<T> = T extends BaseAdapterType<any, any, any, infer Q> ? Q : never;

export type BaseAdapterType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  AdapterOptions = AdapterOptionsType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MethodType = HttpMethodsType,
  AdditionalData extends Record<string, any> = AdapterAdditionalDataType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  QueryParams = QueryParamsType,
> = (request: RequestInstance, requestId: string) => Promise<ResponseType<any, any, AdditionalData>>;

export type AdapterOptionsType = Partial<XMLHttpRequest>;
export type AdapterAdditionalDataType = { status: number };

export type AdapterPayloadMappingType = (data: unknown) => string | FormData;

// Responses

export type ResponseType<GenericDataType, GenericErrorType, AdditionalData> = {
  data: GenericDataType | null;
  error: GenericErrorType | null;
  additionalData: AdditionalData;
};
export type ResponseSuccessType<GenericDataType, AdditionalData> = {
  data: GenericDataType;
  error: null;
  additionalData: AdditionalData;
};
export type ResponseErrorType<GenericErrorType, AdditionalData> = {
  data: null;
  error: GenericErrorType;
  additionalData: AdditionalData;
};

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
