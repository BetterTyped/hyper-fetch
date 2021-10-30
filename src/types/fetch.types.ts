import { ExtractRouteParams, FetchMiddleware } from "middleware";

export type ExtractError<T> = T extends FetchMiddleware<any, any, infer E, any, any> ? E : never;

export type ExtractParams<T> = T extends FetchMiddleware<any, any, any, infer E, any>
  ? ExtractRouteParams<E>
  : never;

export type ExtractResponse<T> = T extends FetchMiddleware<infer D, any, any, any, any> ? D : never;

export type ExtractRequest<T> = T extends FetchMiddleware<any, any, infer D, any, any> ? D : never;

export type ExtractHasData<T> = T extends FetchMiddleware<any, any, any, any, any, infer D>
  ? D
  : never;

export type ExtractHasParams<T> = T extends FetchMiddleware<any, any, any, any, any, any, infer D>
  ? D
  : never;

export type ExtractHasQueryParams<T> = T extends FetchMiddleware<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  infer D
>
  ? D
  : never;
