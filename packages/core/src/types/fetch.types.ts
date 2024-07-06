import { ResponseType } from "adapter";
import { ExtractRouteParams, Request, RequestInstance } from "request";
import { ExtractClientAdapterType, ExtractClientGlobalError } from "./client.types";

export type ExtractAdapterReturnType<T extends RequestInstance> = ResponseType<
  ExtractResponseType<T>,
  ExtractErrorType<T>,
  ExtractAdapterType<T>
>;

export type ExtractResponseType<T> = T extends Request<infer D, any, any, any, any, any, any, any, any> ? D : never;

export type ExtractPayloadType<T> = T extends Request<any, infer D, any, any, any, any, any, any, any> ? D : never;

export type ExtractQueryParamsType<T> = T extends Request<any, any, infer Q, any, any, any, any, any, any> ? Q : never;

export type ExtractErrorType<T> =
  T extends Request<any, any, any, infer G, any, infer C, any, any, any> ? G | ExtractClientGlobalError<C> : never;

export type ExtractGlobalErrorType<T> =
  T extends Request<any, any, any, any, any, infer C, any, any, any> ? ExtractClientGlobalError<C> : never;

export type ExtractLocalErrorType<T> = T extends Request<any, any, any, infer E, any, any, any, any, any> ? E : never;

export type ExtractParamsType<T> =
  T extends Request<any, any, any, any, infer E, any, any, any, any>
    ? E extends string
      ? ExtractRouteParams<E>
      : never
    : never;

export type ExtractEndpointType<T> = T extends Request<any, any, any, any, infer E, any, any, any, any> ? E : never;

export type ExtractClientType<T> = T extends Request<any, any, any, any, any, infer C, any, any, any> ? C : never;

export type ExtractAdapterType<T> =
  T extends Request<any, any, any, any, any, infer C, any, any, any> ? ExtractClientAdapterType<C> : never;

export type ExtractHasDataType<T> = T extends Request<any, any, any, any, any, any, infer D, any, any> ? D : never;

export type ExtractHasParamsType<T> = T extends Request<any, any, any, any, any, any, any, infer P, any> ? P : never;

export type ExtractHasQueryParamsType<T> =
  T extends Request<any, any, any, any, any, any, any, any, infer Q> ? Q : never;
