import { RequestInstance, HttpMethods, stringifyQueryParams } from "@hyper-fetch/core";
import { print, parse, OperationDefinitionNode } from "graphql";

import { GraphQlEndpointType } from "adapter";

export const getRequestValues = <R extends RequestInstance>(request: R) => {
  const isPostRequest = request.method === HttpMethods.POST;

  const query = request.endpoint;
  const variables = request.payload;

  const fullUrl = isPostRequest ? request.client.url : request.client.url + stringifyQueryParams({ query, variables });

  const payload = isPostRequest
    ? JSON.stringify({
        query,
        variables,
      })
    : null;

  return { fullUrl, payload };
};

export const gqlEndpointMapper = <E extends GraphQlEndpointType>(endpoint: E): string => {
  if (typeof endpoint === "string") {
    return endpoint;
  }
  return print(endpoint);
};

export const gqlEndpointNameMapper = (endpoint: string): string => {
  try {
    const ast = parse(endpoint);
    const operationDefinition = ast.definitions.find(
      (def): def is OperationDefinitionNode => def.kind === "OperationDefinition",
    );

    if (operationDefinition) {
      if (operationDefinition.name?.value) {
        return operationDefinition.name.value;
      }

      const selection = operationDefinition.selectionSet.selections[0];
      if (selection?.kind === "Field") {
        return selection.name.value;
      }
    }
  } catch (error) {
    // We can ignore this error and just return some fallback
  }

  // Fallback for invalid gql queries or something else
  const clearedQuery = endpoint
    .replace(/(query|mutation|subscription)/, "")
    .replace(/[{}().,:]/g, " ")
    .trim();
  const [name] = clearedQuery.split(" ");

  return name || "graphql-request";
};
