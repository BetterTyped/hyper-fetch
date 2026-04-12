import type { TypeWithDefaults } from "types";
import type { ClientErrorType, ClientOptionsType } from "client";
import { Client } from "client";
import type { HttpAdapterType } from "http-adapter";

export type ClientGenericType = {
  error?: ClientErrorType;
};

export function createClient<ClientProperties extends ClientGenericType = {}>(
  options: ClientOptionsType<Client<NonNullable<TypeWithDefaults<ClientProperties, "error", Error>>>>,
): Client<NonNullable<TypeWithDefaults<ClientProperties, "error", Error>>, HttpAdapterType> {
  return new Client<NonNullable<TypeWithDefaults<ClientProperties, "error", Error>>, HttpAdapterType>(options);
}
