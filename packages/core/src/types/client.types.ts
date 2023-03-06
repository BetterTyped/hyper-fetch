import { Client } from "client";

export type ExtractClientGlobalError<T> = T extends Client<infer G, any> ? G : never;
export type ExtractClientAdapterType<T> = T extends Client<any, infer A> ? A : never;
