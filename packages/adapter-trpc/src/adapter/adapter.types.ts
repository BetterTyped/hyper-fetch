import type {
  Adapter,
  DefaultMapperType,
  QueryParamsType,
  RequestInstance,
  stringifyQueryParams,
} from "@hyper-fetch/core";

import type { TrpcMethods } from "./adapter.constants";

export type TrpcMethod = (typeof TrpcMethods)[keyof typeof TrpcMethods];

export type TrpcExtraType = { headers: Record<string, string> };

/**
 * Serializes the input and deserializes the output, for example `superjson`.
 * It has to match the `transformer` passed to `initTRPC.create()` on the server.
 */
export type TrpcTransformerType = {
  serialize: (value: any) => any;
  deserialize: (value: any) => any;
};

export type TrpcAdapterOptionsType = {
  transformer?: TrpcTransformerType;
};

export type FetchTrpcAdapterOptionsType = Omit<RequestInit, "method" | "headers" | "body" | "signal"> & {
  timeout?: number;
};

/** Default shape of the `error.data` field, servers can change it with the `errorFormatter` */
export type TrpcErrorDataType = {
  code: string;
  httpStatus: number;
  path?: string;
  stack?: string;
};

/** Default shape of the tRPC error, servers can change it with the `errorFormatter` */
export type TrpcErrorType<Data = TrpcErrorDataType> = {
  message: string;
  code: number;
  data: Data;
};

export type TrpcAdapterType = Adapter<
  FetchTrpcAdapterOptionsType,
  TrpcMethod,
  number,
  TrpcExtraType,
  QueryParamsType | string,
  QueryParamsType | string | undefined,
  string,
  (endpoint: string) => string,
  typeof stringifyQueryParams,
  (request: RequestInstance) => HeadersInit,
  DefaultMapperType
>;
