import { RequestInstance } from "request";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType, HttpMethodsType, HttpStatusType } from "../types";

/**
 * Base Adapter
 */

export type BaseAdapterType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  AdapterOptions = AdapterOptionsType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MethodType = HttpMethodsType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  StatusType = HttpStatusType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  AdditionalData extends Record<string, any> = AdapterAdditionalDataType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  QueryParams = QueryParamsType | string,
> = <T extends RequestInstance>(
  request: T,
  requestId: string,
  // This is never used in the application, we pass this type to have unions extracting possibilities
  genericMapper?: {
    method: MethodType;
    options: AdapterOptions;
    status: StatusType;
    additionalData: AdditionalData;
    queryParams: QueryParams;
  },
) => Promise<ResponseReturnType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>>;

/**
 * Extractors
 */

export type ExtractAdapterOptions<T> = T extends BaseAdapterType<infer O, any, any, any, any> ? O : never;
export type ExtractAdapterMethodType<T> = T extends BaseAdapterType<any, infer M, any, any, any> ? M : never;
export type ExtractAdapterStatusType<T> = T extends BaseAdapterType<any, any, infer S, any, any> ? S : never;
export type ExtractAdapterAdditionalDataType<T> = T extends BaseAdapterType<any, any, any, infer A, any> ? A : never;
export type ExtractAdapterQueryParamsType<T> = T extends BaseAdapterType<any, any, any, any, infer Q> ? Q : never;
export type ExtractUnionAdapter<
  AdapterType extends BaseAdapterType,
  Values extends {
    method: any;
    options: any;
    status: any;
    additionalData: any;
    queryParams: any;
  },
> = Extract<
  AdapterType,
  BaseAdapterType<Values["options"], Values["method"], Values["status"], Values["additionalData"]>
>;

/**
 * Options
 */

export type AdapterOptionsType = Partial<XMLHttpRequest>;

// TODO - add headers later
export type AdapterAdditionalDataType = Record<string, any>;

export type AdapterPayloadMappingType = (data: unknown) => string | FormData;

// Responses

export type ResponseReturnType<GenericDataType, GenericErrorType, AdapterType extends BaseAdapterType> = {
  data: GenericDataType | null;
  error: GenericErrorType | null;
  status: ExtractAdapterStatusType<AdapterType> | null;
  isSuccess: boolean;
  additionalData: ExtractAdapterAdditionalDataType<AdapterType> | null;
};
export type ResponseReturnSuccessType<GenericDataType, AdapterType extends BaseAdapterType> = {
  data: GenericDataType;
  error: null;
  status: ExtractAdapterStatusType<AdapterType> | null;
  isSuccess: boolean;
  additionalData: ExtractAdapterAdditionalDataType<AdapterType> | null;
};
export type ResponseReturnErrorType<GenericErrorType, AdapterType extends BaseAdapterType> = {
  data: null;
  error: GenericErrorType;
  status: ExtractAdapterStatusType<AdapterType> | null;
  isSuccess: boolean;
  additionalData: ExtractAdapterAdditionalDataType<AdapterType> | null;
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

export type AdapterBindingsReturnType = {
  fullUrl: string;
  config;
};
