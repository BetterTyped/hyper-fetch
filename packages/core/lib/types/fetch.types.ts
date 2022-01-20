import { ClientResponseType } from "client";
import { ExtractRouteParams, FetchCommand, FetchCommandInstance } from "command";

export type ExtractFetchReturn<T extends FetchCommandInstance> = ClientResponseType<
  ExtractResponse<T>,
  ExtractError<T>
>;

export type ExtractResponse<T> = T extends FetchCommand<infer D, any, any, any, any, any, any, any, any, any>
  ? D
  : never;

export type ExtractRequest<T> = T extends FetchCommand<any, infer D, any, any, any, any, any, any, any, any>
  ? D
  : never;

export type ExtractQueryParams<T> = T extends FetchCommand<any, any, infer Q, any, any, any, any, any, any, any>
  ? Q
  : never;

export type ExtractError<T> = T extends FetchCommand<any, any, any, infer E, any, any, any, any, any, any> ? E : never;

export type ExtractRequestError<T> = T extends FetchCommand<any, any, any, any, infer E, any, any, any, any, any>
  ? E
  : never;

export type ExtractParams<T> = T extends FetchCommand<any, any, any, any, any, infer P, any, any, any, any>
  ? ExtractRouteParams<P>
  : never;

export type ExtractEndpoint<T> = T extends FetchCommand<any, any, any, any, any, infer E, any, any, any, any>
  ? E
  : never;

export type ExtractClientOptions<T> = T extends FetchCommand<any, any, any, any, any, any, infer O, any, any, any>
  ? O
  : never;

export type ExtractHasData<T> = T extends FetchCommand<any, any, any, any, any, any, any, infer D, any, any>
  ? D
  : never;

export type ExtractHasParams<T> = T extends FetchCommand<any, any, any, any, any, any, any, any, infer P, any>
  ? P
  : never;

export type ExtractHasQueryParams<T> = T extends FetchCommand<any, any, any, any, any, any, any, any, any, infer Q>
  ? Q
  : never;
