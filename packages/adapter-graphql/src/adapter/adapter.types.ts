import { AdapterType, NegativeTypes, QueryParamsType } from "@hyper-fetch/core";
import { DocumentNode } from "graphql/language/ast";

export enum GraphqlMethod {
  POST = "POST",
  GET = "GET",
}

export type GraphQlExtraType = { headers: HeadersInit; extensions: Record<string, any> };

export type GraphQlEndpointType = string | DocumentNode;

export type GraphQLAdapterType = AdapterType<
  Partial<XMLHttpRequest>,
  GraphqlMethod,
  number,
  GraphQlExtraType,
  QueryParamsType | string,
  GraphQlEndpointType
>;

// Extract

type GqlParamType = boolean | string | number | Record<string, any> | NegativeTypes;

export type ExtractGqlRouteParams<T extends string> = string extends T
  ? NegativeTypes
  : T extends `${string}query ${infer Parameters} {${infer QueryRest}`
    ? Parameters extends `${string}$${infer Param},${infer Rest}`
      ? GqlParameter<Param, Rest> &
          // eslint-disable-next-line @typescript-eslint/ban-types
          (ExtractGqlRouteParams<QueryRest> extends NegativeTypes ? {} : ExtractGqlRouteParams<QueryRest>)
      : Parameters extends `${string}$${infer Param})${infer Rest}`
        ? GqlParameter<Param, Rest> &
            // eslint-disable-next-line @typescript-eslint/ban-types
            (ExtractGqlRouteParams<QueryRest> extends NegativeTypes ? {} : ExtractGqlRouteParams<QueryRest>)
        : NegativeTypes
    : T extends `${string}$${infer Parameters},${infer Rest}`
      ? GqlParameter<Parameters, Rest>
      : T extends `${string}$${infer Parameters})${infer Rest}`
        ? GqlParameter<Parameters, Rest>
        : NegativeTypes;

export type GqlParameter<T extends string, Rest extends string> = T extends `${infer Param}:${string}!`
  ? { [k in Param]: GqlParamType } & (ExtractGqlRouteParams<Rest> extends NegativeTypes
      ? // eslint-disable-next-line @typescript-eslint/ban-types
        {}
      : ExtractGqlRouteParams<Rest>)
  : T extends `${infer Param}:${string}`
    ? { [k in Param]?: GqlParamType } & (ExtractGqlRouteParams<Rest> extends NegativeTypes
        ? // eslint-disable-next-line @typescript-eslint/ban-types
          {}
        : ExtractGqlRouteParams<Rest>)
    : NegativeTypes;
