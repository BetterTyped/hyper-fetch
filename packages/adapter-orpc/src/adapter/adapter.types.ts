import type {
  Adapter,
  DefaultMapperType,
  QueryParamsType,
  RequestInstance,
  stringifyQueryParams,
} from "@hyper-fetch/core";
import type { StandardRPCCustomJsonSerializer } from "@orpc/client/standard";

import type { OrpcMethods } from "./adapter.constants";

export type OrpcMethod = (typeof OrpcMethods)[keyof typeof OrpcMethods];

export type OrpcExtraType = { headers: Record<string, string> };

/**
 * HTTP method used for the `QUERY` requests.
 * The oRPC `RPCHandler` accepts only `POST` until `GET` is added to its `allowMethods`.
 */
export type OrpcQueryMethod = "POST" | "GET";

export type OrpcAdapterOptionsType = {
  /**
   * HTTP method of the `QUERY` requests, mutations always use `POST`.
   * @default "POST"
   */
  queryMethod?: OrpcQueryMethod;
  /**
   * Serializers of custom types, the same as the `customJsonSerializers` option of `RPCHandler` and `RPCLink`.
   * Both sides need the same list.
   */
  customJsonSerializers?: StandardRPCCustomJsonSerializer[];
};

export type FetchOrpcAdapterOptionsType = Omit<RequestInit, "method" | "headers" | "body" | "signal"> & {
  timeout?: number;
  /** Overrides the `queryMethod` of the adapter for one request */
  queryMethod?: OrpcQueryMethod;
};

/**
 * Error sent by an oRPC procedure, the JSON form of `ORPCError`.
 * Errors from the `.errors()` map of the procedure have `defined: true`.
 */
export type OrpcErrorType<Code extends string = string, Data = unknown> = {
  defined: boolean;
  code: Code;
  status: number;
  message: string;
  data: Data;
};

export type OrpcAdapterType = Adapter<
  FetchOrpcAdapterOptionsType,
  OrpcMethod,
  number,
  OrpcExtraType,
  QueryParamsType | string,
  QueryParamsType | string | undefined,
  string,
  (endpoint: string) => string,
  typeof stringifyQueryParams,
  (request: RequestInstance) => HeadersInit,
  DefaultMapperType
>;
