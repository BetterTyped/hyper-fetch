import http from "http";

import { CommandInstance } from "command";

// Client

export type ClientType = (command: CommandInstance, requestId: string) => Promise<ClientResponseType<any, any>>;

export type ClientDefaultOptionsType = Partial<XMLHttpRequest> | Partial<http.RequestOptions>;

export type ClientPayloadMappingCallback = (data: unknown) => string | FormData;

// Responses

export type ClientResponseType<GenericDataType, GenericErrorType> = [
  GenericDataType | null,
  GenericErrorType | null,
  number | null,
];
export type ClientResponseSuccessType<GenericDataType> = [GenericDataType, null, number | null];
export type ClientResponseErrorType<GenericErrorType> = [null, GenericErrorType, number | null];

// QueryParams

export type ClientQueryParamValues = number | string | boolean | null | undefined;
export type ClientQueryParam =
  | ClientQueryParamValues
  | Array<ClientQueryParamValues>
  | Record<string, ClientQueryParamValues>;

export type ClientQueryParamsType = Record<string, ClientQueryParam>;

// Headers

export type ClientHeaderMappingCallback = <T extends CommandInstance>(command: T) => HeadersInit;

export type ClientHeadersProps = {
  isFormData: boolean;
  headers: HeadersInit | undefined;
};

// Stringify

export type QueryStringifyOptions = {
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

export type ProgressRequestDataType = {
  total?: number;
  loaded?: number;
};

export type FetchProgressType = {
  progress: number;
  timeLeft: number | null;
  sizeLeft: number;
  total: number;
  loaded: number;
  startTimestamp: number;
};
