import * as browser from "@browser-adapter";
import * as server from "@server-adapter";
import {
  ClientInstance,
  Client,
  ExtractClientGlobalError,
  ExtractClientAdapterType,
  ExtractClientMapperType,
} from "@hyper-fetch/core";
import { print } from "graphql/language/printer";

import { GraphQLAdapterType, GraphQlEndpointType, GraphqlMethod } from "adapter";

export const GraphqlAdapter = <C extends ClientInstance>(client: C) => {
  const adapter: GraphQLAdapterType = async (request, requestId) => {
    if (typeof XMLHttpRequest !== "undefined") {
      return browser.adapter(request, requestId);
    }
    return server.adapter(request, requestId);
  };

  const mapper = <E extends GraphQlEndpointType>(endpoint: E): string => {
    if (typeof endpoint === "string") {
      return endpoint;
    }
    return print(endpoint);
  };

  return (
    client as Client<
      ExtractClientGlobalError<C> extends Error
        ? { errors: Error[] }
        : ExtractClientGlobalError<C> | { errors: Error[] },
      ExtractClientAdapterType<C>,
      ExtractClientMapperType<C>
    >
  )
    .setAdapter(() => adapter)
    .setDefaultMethod(GraphqlMethod.POST)
    .setEndpointMapper(mapper);
};
