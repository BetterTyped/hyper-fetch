import type { Adapter, DefaultMapperType, EmptyTypes, QueryParamsType, stringifyQueryParams } from "@hyper-fetch/core";
import type { DocumentNode } from "graphql/language/ast";

export enum GraphqlMethod {
  POST = "POST",
  GET = "GET",
}

export type GraphQlExtraType = { headers: HeadersInit; extensions: Record<string, any> };

export type GraphQlEndpointType = string | DocumentNode;

export type FetchGraphqlAdapterOptionsType = Omit<RequestInit, "method" | "headers" | "body" | "signal"> & {
  timeout?: number;
};

export type GraphqlRequestOptionsType = {
  /**
   * GraphQL document sent as `query`. When it is set, `endpoint` becomes a URL path appended to `client.url`,
   * the same way as in the HttpAdapter. When it is omitted, `endpoint` holds the document and the URL is `client.url`.
   */
  document?: GraphQlEndpointType;
};

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
