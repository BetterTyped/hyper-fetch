import { TypeWithDefaults } from "types";
import { Client, ClientErrorType, ClientOptionsType } from "client";
import { AdapterInstance } from "adapter";
import { HttpAdapterType } from "http-adapter";

export type ClientGenericType = {
  error?: ClientErrorType;
  adapter?: AdapterInstance;
};

export function createClient<
  ClientProperties extends ClientGenericType = {
    error?: ClientErrorType;
    // TODO: Kacper - adapter type should be always auto-populated? maybe we should remove it from the options and leave only setAdapter method
    adapter?: HttpAdapterType;
  },
>(
  options: ClientOptionsType<
    Client<
      NonNullable<TypeWithDefaults<ClientProperties, "error", ClientErrorType>>,
      NonNullable<TypeWithDefaults<ClientProperties, "adapter", HttpAdapterType>>
    >
  >,
) {
  return new Client<
    NonNullable<TypeWithDefaults<ClientProperties, "error", ClientErrorType>>,
    NonNullable<TypeWithDefaults<ClientProperties, "adapter", HttpAdapterType>>
  >(options);
}
