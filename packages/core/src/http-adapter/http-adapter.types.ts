import type { DeclareAdapterType, QueryParamsType, QueryParamType } from "adapter";

import type { HttpMethodsType, HttpStatusType } from "../types";
import type { stringifyQueryParams } from "./http-adapter.utils";
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
   * When true, every chunk of the response body is emitted as it arrives - through the `onResponseChunk`
   * send option, the request's `$hooks.onResponseChunk`, `requestManager.events.onResponseChunk*` and the
   * `onResponseChunk` plugin method. Use it for SSE, NDJSON, LLM token streams or large downloads.
   *
   * The request still resolves only once the whole body has been read: `data` is the full body, parsed the
   * same way as a non-streaming response, and success/error/finished fire after the last chunk.
   */
  streaming?: boolean;
};

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
  | "utf8"
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "base64url"
  | "latin1"
  | "binary"
  | "hex";
