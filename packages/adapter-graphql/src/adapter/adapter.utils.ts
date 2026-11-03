import type { EmptyTypes, QueryParamsType, RequestInstance } from "@hyper-fetch/core";
import { HttpMethods, stringifyQueryParams } from "@hyper-fetch/core";
import type { DocumentNode, OperationDefinitionNode } from "graphql";
import { print, parse } from "graphql";

import type { GraphQlEndpointType, GraphqlRequestOptionsType } from "./adapter.types";

const getDocumentOption = (request: RequestInstance) => {
  return (request.requestOptions as unknown as GraphqlRequestOptionsType).document;
};

const hasDocumentOption = (request: RequestInstance) => getDocumentOption(request) != null;

/** The document of the request - from the `document` option or, when it is omitted, from the `endpoint` */
export const getGqlDocument = (request: RequestInstance): GraphQlEndpointType => {
  return getDocumentOption(request) ?? request.endpoint;
};

/** Query string keys owned by the GraphQL over HTTP GET format - they win over the user query params */
const reservedQueryParams = ["query", "variables"];

const isReservedQueryParam = (param: string) => {
  const [rawKey] = param.split("=");
  try {
    // Array formats encode the key as `key[]` or `key[0]`
    return reservedQueryParams.includes(decodeURIComponent(rawKey).split("[")[0]);
  } catch {
    return false;
  }
};

const omitReservedQueryParams = (queryString: string) => {
  return queryString
    .replace(/^\?/, "")
    .split("&")
    .filter((param) => !isReservedQueryParam(param))
    .join("&");
};

const joinQueryStrings = (...queryStrings: string[]) => {
  const joined = queryStrings
    .map((queryString) => queryString.replace(/^\?/, ""))
    .filter(Boolean)
    .join("&");

  return joined ? `?${joined}` : "";
};

export const getRequestValues = <R extends RequestInstance>(
  request: R,
  queryParams: unknown = request.client.adapter.unstable_queryParamsMapper(request.queryParams),
) => {
  const isPostRequest = request.method === HttpMethods.POST;

  const query = gqlEndpointMapper(getGqlDocument(request));
  const variables = request.payload;

  const url = hasDocumentOption(request) ? `${request.client.url}${request.endpoint}` : request.client.url;
  // Mappers can return anything, so we normalize their result to the query string
  const queryString = stringifyQueryParams(queryParams as QueryParamsType | string | EmptyTypes);

  const fullUrl = isPostRequest
    ? url + joinQueryStrings(queryString)
    : url + joinQueryStrings(stringifyQueryParams({ query, variables }), omitReservedQueryParams(queryString));

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

const getOperationName = (ast: DocumentNode): string | undefined => {
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
    if (selection?.kind === "InlineFragment" && selection.typeCondition) {
      return selection.typeCondition.name.value;
    }
  }

  return undefined;
};

export const gqlEndpointNameMapper = (endpoint: GraphQlEndpointType): string => {
  if (typeof endpoint !== "string") {
    return getOperationName(endpoint) || "graphql-request";
  }

  try {
    const name = getOperationName(parse(endpoint));

    if (name) {
      return name;
    }
  } catch {
    // We can ignore this error and just return some fallback
  }

  // Fallback for invalid gql queries or something else
  const clearedQuery = endpoint
    .replace(/(query|mutation|subscription)/, "")
    .replaceAll(/[{}().,:]/g, " ")
    .trim();
  const [name] = clearedQuery.split(" ");

  return name || "graphql-request";
};

/**
 * Name identifying the request in the cache, query and abort keys.
 * With the `document` option the same operation can be sent to many paths, so the path is a part of the name.
 */
export const gqlRequestNameMapper = (request: RequestInstance): string => {
  const name = gqlEndpointNameMapper(getGqlDocument(request));

  return hasDocumentOption(request) ? `${name}${request.requestOptions.endpoint}` : name;
};
