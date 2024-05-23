import { Client, ClientInstance, DefaultEndpointMapper } from "client";
import { TypeWithDefaults } from "./helpers.types";
import { AdapterType } from "adapter";

export type ExtractClientGlobalError<T extends ClientInstance> =
  T extends Client<infer P> ? TypeWithDefaults<P, "error", Error> : never;
export type ExtractClientAdapterType<T extends ClientInstance> =
  T extends Client<infer P> ? TypeWithDefaults<P, "adapter", AdapterType> : never;
export type ExtractClientMapperType<T extends ClientInstance> =
  T extends Client<infer P> ? TypeWithDefaults<P, "mapper", DefaultEndpointMapper> : never;
