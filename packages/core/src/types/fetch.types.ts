import { ClientResponseType } from "client";
import { ExtractRouteParams, Command, CommandInstance } from "command";

export type ExtractFetchReturn<T extends CommandInstance> = ClientResponseType<ExtractResponse<T>, ExtractError<T>>;

export type ExtractResponse<T> = T extends Command<infer D, any, any, any, any, any, any, any, any, any> ? D : never;

export type ExtractRequestData<T> = T extends Command<any, infer D, any, any, any, any, any, any, any, any> ? D : never;

export type ExtractQueryParams<T> = T extends Command<any, any, infer Q, any, any, any, any, any, any, any> ? Q : never;

export type ExtractError<T> = T extends Command<any, any, any, infer G, infer L, any, any, any, any, any>
  ? G | L
  : never;

export type ExtractGlobalError<T> = T extends Command<any, any, any, infer E, any, any, any, any, any, any> ? E : never;

export type ExtractLocalError<T> = T extends Command<any, any, any, any, infer E, any, any, any, any, any> ? E : never;

export type ExtractParams<T> = T extends Command<any, any, any, any, any, infer P, any, any, any, any>
  ? ExtractRouteParams<P>
  : never;

export type ExtractEndpoint<T> = T extends Command<any, any, any, any, any, infer E, any, any, any, any> ? E : never;

export type ExtractClientOptions<T> = T extends Command<any, any, any, any, any, any, infer O, any, any, any>
  ? O
  : never;

export type ExtractHasData<T> = T extends Command<any, any, any, any, any, any, any, infer D, any, any> ? D : never;

export type ExtractHasParams<T> = T extends Command<any, any, any, any, any, any, any, any, infer P, any> ? P : never;

export type ExtractHasQueryParams<T> = T extends Command<any, any, any, any, any, any, any, any, any, infer Q>
  ? Q
  : never;
