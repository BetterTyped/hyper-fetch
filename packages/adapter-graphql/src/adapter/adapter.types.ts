import { Adapter, EmptyTypes, QueryParamsType } from "@hyper-fetch/core";
import { DocumentNode } from "graphql/language/ast";

export enum GraphqlMethod {
  POST = "POST",
  GET = "GET",
}

export type GraphQlExtraType = { headers: HeadersInit; extensions: Record<string, any> };

export type GraphQlEndpointType = string | DocumentNode;

export type GraphQLAdapterType = Adapter<
  Partial<XMLHttpRequest>,
  GraphqlMethod,
  number,
  GraphQlExtraType,
  QueryParamsType | string,
  undefined,
  GraphQlEndpointType,
  (endpoint: GraphQlEndpointType) => string
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
