import { HttpMethodsType, HttpStatusType } from "../types";
import { DeclareAdapterType, QueryParamsType, QueryParamType } from "adapter";
import { stringifyQueryParams } from "./http-adapter.utils";
/**
 * Base Adapter
 */

export type HttpAdapterType = DeclareAdapterType<{
  adapterOptions: FetchAdapterOptionsType;
  methodType: HttpMethodsType;
  statusType: HttpStatusType;
  extra: HttpAdapterExtraType;
  queryParams: QueryParamsType | string | null;
  endpointType: string;
  queryParamsMapperType: typeof stringifyQueryParams;
}>;

/**
 * Options passed to the native fetch adapter. Extends RequestInit with a `timeout` option.
 */
export type FetchAdapterOptionsType = Omit<RequestInit, "method" | "headers" | "body" | "signal"> & {
  /**
   * Request timeout in milliseconds. Defaults to 5000ms.
   */
  timeout?: number;
  /**
   * When true, the response `data` will be a `ReadableStream<Uint8Array>` instead of parsed JSON/text.
   * This enables streaming consumption of the response body (e.g., for SSE, large file downloads,
   * or real-time text generation from LLMs).
   */
  streaming?: boolean;
};

/**
 * @deprecated Use FetchAdapterOptionsType instead. This type is kept for backward compatibility with custom adapters based on XMLHttpRequest.
 */
export interface HttpAdapterRequest extends Omit<XMLHttpRequest, "responseType"> {
  responseType: XMLHttpRequestResponseType | "stream";
}
/**
 * @deprecated Use FetchAdapterOptionsType instead.
 */
export type HttpAdapterOptionsType = Partial<HttpAdapterRequest>;

export type HttpAdapterExtraType = {
  headers: Record<string, string>;
};

// Headers

export type HttpAdapterHeadersProps = {
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

export type BufferEncoding =
  | "ascii"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "base64url"
  | "latin1"
  | "binary"
  | "hex";
