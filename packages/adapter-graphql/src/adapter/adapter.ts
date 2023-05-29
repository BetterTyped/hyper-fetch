import * as browser from "@browser-adapter";
import * as server from "@server-adapter";
import { HttpMethodsEnum, ClientInstance } from "@hyper-fetch/core";
import { print } from "graphql/language/printer";

import { GraphQLAdapterType, GraphQlEndpointType } from "adapter";

export const graphqlAdapter = (client: ClientInstance) => {
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

  return client
    .setDefaultMethod(HttpMethodsEnum.post)
    .setEndpointMapper(mapper)
    .setAdapter(() => adapter);
};
