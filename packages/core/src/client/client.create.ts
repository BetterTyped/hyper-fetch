import { TypeWithDefaults } from "types";
import { Client, ClientErrorType, ClientOptionsType } from "client";
import { AdapterInstance } from "adapter";

export type ClientGenericType = {
  error?: ClientErrorType;
  adapter?: AdapterInstance;
};

export function createClient<
  ClientProperties extends ClientGenericType = {
    error?: ClientErrorType;
    adapter?: AdapterInstance;
  },
>(
  options: ClientOptionsType<
    Client<
      NonNullable<TypeWithDefaults<ClientProperties, "error", ClientErrorType>>,
      NonNullable<TypeWithDefaults<ClientProperties, "adapter", AdapterInstance>>
    >
  >,
) {
  return new Client<
    NonNullable<TypeWithDefaults<ClientProperties, "error", ClientErrorType>>,
    NonNullable<TypeWithDefaults<ClientProperties, "adapter", AdapterInstance>>
  >(options);
}
