import type { Adapter, DefaultMapperType, EmptyTypes, QueryParamsType, stringifyQueryParams } from "@hyper-fetch/core";
import type { GraphQLFormattedError } from "graphql";
import type { DocumentNode } from "graphql/language/ast";

export enum GraphqlMethod {
  POST = "POST",
  GET = "GET",
}

export type GraphQlExtraType = {
  headers: HeadersInit;
  extensions: Record<string, any>;
  /**
   * The `errors` of the response body, when the server sent any. With the `"all"` error policy a response with
   * partial data succeeds, and this is where its errors are.
   */
  errors?: GraphQLFormattedError[];
};

/**
 * What a response that has both `data` and `errors` resolves to.
 *
 * - `"none"` - it fails: `data` is `null` and `error` holds the errors.
 * - `"all"` - it succeeds with the partial `data`, and the errors are in `extra.errors`. A response without `data`
 *   still fails.
 */
export type GraphqlErrorPolicy = "none" | "all";

/**
 * Error of a GraphQL request: the `errors` of the response body, or a single network, abort or timeout error.
 * Pass it to the client to type `response.error` - `new Client<GraphqlErrorType>({ url })`.
 */
export type GraphqlErrorType = (GraphQLFormattedError | Error)[];

export type GraphQlEndpointType = string | DocumentNode;

export type FetchGraphqlAdapterOptionsType = Omit<RequestInit, "method" | "headers" | "body" | "signal"> & {
  timeout?: number;
  /**
   * What a response with both `data` and `errors` resolves to. `"none"` fails it, `"all"` keeps the partial data.
   * @default "none"
   */
  errorPolicy?: GraphqlErrorPolicy;
};

export type GraphqlRequestOptionsType = {
  /**
   * GraphQL document sent as `query`. When it is set, `endpoint` becomes a URL path appended to `client.url`,
   * the same way as in the HttpAdapter. When it is omitted, `endpoint` holds the document and the URL is `client.url`.
   */
  document?: GraphQlEndpointType;
};

/**
 * Response and payload of a typed document - a `TypedDocumentNode` from graphql-codegen or a gql.tada document.
 * Pass it to `createRequest` so the request types come from the document instead of being written by hand.
 *
 * @example
 * ```ts
 * const getUser = client.createRequest<GraphqlDocumentTypes<typeof GetUserDocument>>()({
 *   endpoint: GetUserDocument,
 * });
 * ```
 */
export type GraphqlDocumentTypes<Document> = Document extends {
  __apiType?: (variables: infer Variables) => infer Result;
}
  ? {
      response: Result;
      // Codegen types an operation without variables as `{ [key: string]: never }` - nothing to send
      payload: Variables extends Record<string, never> ? undefined : Variables;
    }
  : never;

export type GraphqlAdapterType = Adapter<
  FetchGraphqlAdapterOptionsType,
  GraphqlMethod,
  number,
  GraphQlExtraType,
  QueryParamsType | string,
  QueryParamsType | string | undefined,
  GraphQlEndpointType,
  (endpoint: GraphQlEndpointType) => string,
  typeof stringifyQueryParams,
  DefaultMapperType,
  DefaultMapperType,
  GraphqlRequestOptionsType
>;

// Extract

type GqlParamType = boolean | string | number | Record<string, any> | EmptyTypes;

export type ExtractGqlRouteParams<T extends string> = string extends T
  ? EmptyTypes
  : T extends `${string}query ${infer Parameters} {${infer QueryRest}`
    ? Parameters extends `${string}$${infer Param},${infer Rest}`
      ? GqlParameter<Param, Rest> &
          // eslint-disable-next-line @typescript-eslint/ban-types
          (ExtractGqlRouteParams<QueryRest> extends EmptyTypes ? {} : ExtractGqlRouteParams<QueryRest>)
      : Parameters extends `${string}$${infer Param})${infer Rest}`
        ? GqlParameter<Param, Rest> &
            // eslint-disable-next-line @typescript-eslint/ban-types
            (ExtractGqlRouteParams<QueryRest> extends EmptyTypes ? {} : ExtractGqlRouteParams<QueryRest>)
        : EmptyTypes
    : T extends `${string}$${infer Parameters},${infer Rest}`
      ? GqlParameter<Parameters, Rest>
      : T extends `${string}$${infer Parameters})${infer Rest}`
        ? GqlParameter<Parameters, Rest>
        : EmptyTypes;

export type GqlParameter<T extends string, Rest extends string> = T extends `${infer Param}:${string}!`
  ? { [k in Param]: GqlParamType } & (ExtractGqlRouteParams<Rest> extends EmptyTypes
      ? // eslint-disable-next-line @typescript-eslint/ban-types
        {}
      : ExtractGqlRouteParams<Rest>)
  : T extends `${infer Param}:${string}`
    ? { [k in Param]?: GqlParamType } & (ExtractGqlRouteParams<Rest> extends EmptyTypes
        ? // eslint-disable-next-line @typescript-eslint/ban-types
          {}
        : ExtractGqlRouteParams<Rest>)
    : EmptyTypes;
