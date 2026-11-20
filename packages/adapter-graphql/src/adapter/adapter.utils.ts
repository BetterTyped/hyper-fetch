import type { EmptyTypes, QueryParamsType, RequestInstance } from "@hyper-fetch/core";
import { HttpMethods, Request, stringifyKey, stringifyQueryParams } from "@hyper-fetch/core";
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
const reservedQueryParams = new Set(["query", "operationName", "variables"]);

const isReservedQueryParam = (param: string) => {
  const [rawKey] = param.split("=");
  try {
    // Array formats encode the key as `key[]` or `key[0]`
    return reservedQueryParams.has(decodeURIComponent(rawKey).split("[")[0]);
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

  const document = getGqlDocument(request);
  const query = gqlEndpointMapper(document);
  const operationName = getGqlOperationName(document);
  const variables = request.payload;

  const url = hasDocumentOption(request) ? `${request.client.url}${request.endpoint}` : request.client.url;
  // Mappers can return anything, so we normalize their result to the query string
  const queryString = stringifyQueryParams(queryParams as QueryParamsType | string | EmptyTypes);

  const fullUrl = isPostRequest
    ? url + joinQueryStrings(queryString)
    : url +
      joinQueryStrings(stringifyQueryParams({ query, operationName, variables }), omitReservedQueryParams(queryString));

  const payload = isPostRequest
    ? JSON.stringify({
        query,
        operationName,
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

const findOperation = (ast: DocumentNode) => {
  return ast.definitions.find((def): def is OperationDefinitionNode => def.kind === "OperationDefinition");
};

const parseDocument = (document: GraphQlEndpointType): DocumentNode | undefined => {
  if (typeof document !== "string") {
    return document;
  }
  try {
    return parse(document);
  } catch {
    // The server reports an invalid document, the name and the operationName are only a best effort
    return undefined;
  }
};

/**
 * Name of the first operation of the document, sent as `operationName`.
 * Anonymous operations and documents that do not parse have none.
 */
export const getGqlOperationName = (document: GraphQlEndpointType): string | undefined => {
  const ast = parseDocument(document);

  return ast ? findOperation(ast)?.name?.value : undefined;
};

const getOperationLabel = (ast: DocumentNode): string | undefined => {
  const operationDefinition = findOperation(ast);

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

/** Readable name of the document - the operation name or, for anonymous operations, the first selected field */
export const gqlEndpointNameMapper = (endpoint: GraphQlEndpointType): string => {
  const ast = parseDocument(endpoint);
  const name = ast ? getOperationLabel(ast) : undefined;

  if (name) {
    return name;
  }

  if (typeof endpoint !== "string") {
    return "graphql-request";
  }

  // Fallback for invalid gql queries or something else
  const clearedQuery = endpoint
    .replace(/(query|mutation|subscription)/, "")
    .replaceAll(/[{}().,:]/g, " ")
    .trim();
  const [fallbackName] = clearedQuery.split(" ");

  return fallbackName || "graphql-request";
};

/** FNV-1a - a short and stable fingerprint of a text */
const hashText = (text: string): string => {
  let hash = 2_166_136_261; // FNV offset basis
  for (let index = 0; index < text.length; index += 1) {
    // Code units, not code points - the loop walks every UTF-16 unit once
    // eslint-disable-next-line unicorn/prefer-code-point
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619); // FNV prime
  }
  // `>>> 0` reads the 32 bits as unsigned, `Math.trunc` would keep the sign
  // eslint-disable-next-line unicorn/prefer-math-trunc
  return (hash >>> 0).toString(36);
};

/** Printing a DocumentNode is the costly part, and gql documents are created once, so their fingerprint is kept */
const documentNodeHashes = new WeakMap<DocumentNode, string>();

/** Fingerprint of the document text sent as `query`. Documents with other selections get other fingerprints. */
const getDocumentHash = (document: GraphQlEndpointType): string => {
  if (typeof document === "string") {
    return hashText(document);
  }

  const known = documentNodeHashes.get(document);
  if (known) {
    return known;
  }

  const hash = hashText(print(document));
  documentNodeHashes.set(document, hash);
  return hash;
};

/**
 * Name identifying the request in the cache, query and abort keys.
 * With the `document` option the same operation can be sent to many paths, so the path is a part of the name.
 */
export const gqlRequestNameMapper = (request: RequestInstance): string => {
  const name = gqlEndpointNameMapper(getGqlDocument(request));

  return hasDocumentOption(request) ? `${name}${request.requestOptions.endpoint}` : name;
};

/**
 * Cache and query key of a request. The document fingerprint and the variables are a part of it: two documents with
 * one operation name but other selections, or the same operation with other variables, are other queries - with their
 * own cached data and their own place in the queue.
 */
export const gqlRequestKeyMapper = (request: RequestInstance): string => {
  const name = `${gqlRequestNameMapper(request)}@${getDocumentHash(getGqlDocument(request))}`;
  const key = `${request.method}_${name}-${stringifyKey(request.params)}-${stringifyKey(request.queryParams)}`;
  const variables = stringifyKey(request.payload);

  return variables ? `${key}-${variables}` : key;
};

const escapeRegExp = (text: string) => text.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);

/**
 * Matches the cache keys of every request of a GraphQL operation - with any variables, params, query params and
 * method. Pass it to `client.cache.invalidate()` after a mutation, so the active queries of the operation refetch, like
 * `refetchQueries` in Apollo.
 *
 * - A document matches its requests on every url path of the `document` option.
 * - A request matches the requests of its document on its own url path.
 * - Documents with the same operation name but other selections are other operations, they do not match.
 *
 * @example
 * ```ts
 * await updateUser.send({ payload: { id: "1", name: "Ann" } });
 * client.cache.invalidate(matchGqlOperation(GetUserDocument));
 * ```
 */
export const matchGqlOperation = (operation: GraphQlEndpointType | RequestInstance): RegExp => {
  if (operation instanceof Request) {
    const name = escapeRegExp(gqlRequestNameMapper(operation));
    return new RegExp(`^[A-Z]+_${name}@${getDocumentHash(getGqlDocument(operation))}-`);
  }

  const name = escapeRegExp(gqlEndpointNameMapper(operation));
  // The path of the `document` option follows the name and never holds the fingerprint separator
  return new RegExp(`^[A-Z]+_${name}(?:/[^@]*)?@${getDocumentHash(operation)}-`);
};
