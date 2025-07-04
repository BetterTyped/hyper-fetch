import { Client, ClientInstance } from "client";

export type ExtractClientGlobalError<T extends ClientInstance> = T extends Client<infer P, any> ? P : never;
export type ExtractClientAdapterType<T extends ClientInstance> = T extends Client<any, infer P> ? P : never;
