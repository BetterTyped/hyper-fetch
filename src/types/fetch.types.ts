import { ClientResponseType } from "client";
import { ExtractRouteParams, FetchMiddleware, FetchMiddlewareInstance } from "middleware";

export type ExtractFetchReturn<T extends FetchMiddlewareInstance> = ClientResponseType<
  ExtractResponse<T>,
  ExtractError<T>
>;

export type ExtractResponse<T> = T extends FetchMiddleware<infer D, any, any, any, any, any> ? D : never;

export type ExtractRequest<T> = T extends FetchMiddleware<any, infer D, any, any, any, any> ? D : never;

export type ExtractQueryParams<T> = T extends FetchMiddleware<any, any, infer Q, any, any, any> ? Q : never;

export type ExtractError<T> = T extends FetchMiddleware<any, any, any, infer E, any, any> ? E : never;

export type ExtractParams<T> = T extends FetchMiddleware<any, any, any, any, infer P, any>
  ? ExtractRouteParams<P>
  : never;

export type ExtractEndpoint<T> = T extends FetchMiddleware<any, any, any, any, infer P, any> ? P : never;

export type ExtractHasData<T> = T extends FetchMiddleware<any, any, any, any, any, any, infer D> ? D : never;

export type ExtractHasParams<T> = T extends FetchMiddleware<any, any, any, any, any, any, any, infer D> ? D : never;

export type ExtractHasQueryParams<T> = T extends FetchMiddleware<any, any, any, any, any, any, any, any, infer D>
  ? D
  : never;

export type ExtractMappedError<T> = T extends FetchMiddleware<any, any, any, infer E, any, any>
  ? { error: E; message: string }
  : never;
