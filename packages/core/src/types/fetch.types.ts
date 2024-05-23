import { ResponseReturnType } from "adapter";
import { ExtractRouteParams, Request } from "request";

export type ExtractAdapterReturnType<T> = ResponseReturnType<
  ExtractResponseType<T>,
  ExtractErrorType<T>,
  ExtractAdapterType<T>
>;

export type ExtractPropertiesType<T> = T extends Request<infer P> ? P : never;

export type ExtractResponseType<T> = T extends Request<infer P> ? P["response"] : void;

export type ExtractPayloadType<T> = T extends Request<infer P> ? P["payload"] : void;

export type ExtractRequestQueryParamsType<T> = T extends Request<infer P> ? P["queryParams"] : never;

export type ExtractErrorType<T> = T extends Request<infer P> ? P["globalError"] | P["localError"] : never;

export type ExtractGlobalErrorType<T> = T extends Request<infer P> ? P["globalError"] : never;

export type ExtractLocalErrorType<T> = T extends Request<infer P> ? P["localError"] : never;

export type ExtractParamsType<T> = T extends Request<infer P> ? ExtractRouteParams<P["endpoint"]> : never;

export type ExtractEndpointType<T> = T extends Request<infer P> ? P["endpoint"] : never;

export type ExtractAdapterType<T> = T extends Request<infer P> ? P["adapter"] : never;

export type ExtractHasDataType<T> = T extends Request<infer P> ? P["hasData"] : never;

export type ExtractHasParamsType<T> = T extends Request<infer P> ? P["hasParams"] : never;

export type ExtractHasQueryParamsType<T> = T extends Request<infer P> ? P["hasQuery"] : never;
