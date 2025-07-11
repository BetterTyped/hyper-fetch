import { TypeWithDefaults } from "types";
import { Client, ClientErrorType, ClientOptionsType } from "client";
import { HttpAdapterType } from "http-adapter";

export type ClientGenericType = {
  error?: ClientErrorType;
};

export function createClient<
  ClientProperties extends ClientGenericType = {
    error?: ClientErrorType;
  },
>(
  options: ClientOptionsType<Client<NonNullable<TypeWithDefaults<ClientProperties, "error", ClientErrorType>>>>,
): Client<NonNullable<TypeWithDefaults<ClientProperties, "error", ClientErrorType>>, HttpAdapterType> {
  return new Client<NonNullable<TypeWithDefaults<ClientProperties, "error", ClientErrorType>>, HttpAdapterType>(
    options,
  );
}
