import { HttpMethodsType, HttpStatusType } from "../types";
import { Adapter, QueryParamsType, QueryParamType } from "adapter";

/**
 * Base Adapter
 */

export type HttpAdapterType = Adapter<
  HttpAdapterOptionsType,
  HttpMethodsType,
  HttpStatusType,
  HttpAdapterExtraType,
  QueryParamsType | string | null,
  string,
  any,
  any,
  any
>;

/**
 * Options
 */
export interface HttpAdapterRequest extends Omit<XMLHttpRequest, "responseType"> {
  responseType: XMLHttpRequestResponseType | "stream";
}
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
