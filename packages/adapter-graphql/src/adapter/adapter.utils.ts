import { RequestInstance, HttpMethods, stringifyQueryParams } from "@hyper-fetch/core";
import { print } from "graphql/language/printer";

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
