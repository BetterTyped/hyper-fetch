import * as browser from "@browser-adapter";
import * as server from "@server-adapter";
import { Client, ClientInstance, ExtractClientGlobalError, ExtractClientAdapterType } from "@hyper-fetch/core";
import { GraphQLError } from "graphql";
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
        ? readonly Partial<GraphQLError>[]
        : ExtractClientGlobalError<C> | readonly Partial<GraphQLError>[],
      ExtractClientAdapterType<C>
    >
  )
    .setAdapter(() => adapter)
    .setDefaultMethod(GraphqlMethod.POST)
    .setEndpointMapper(mapper);
};
