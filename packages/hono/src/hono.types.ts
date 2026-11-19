import type { ClientInstance, Request } from "@hyper-fetch/core";
import type { HonoBase } from "hono/hono-base";

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never;

/* -------------------------------------------------------------------------------------------------
 * Hono schema -> flat record of requests
 * -----------------------------------------------------------------------------------------------*/

/**
 * `app.route()` returns a union of schemas. Merge it into one record keyed by path so that two
 * routers registering methods on the same path end up on the same entry.
 */
type UnionKeys<U> = U extends any ? keyof U : never;

type MergeUnionToRecord<U> = {
  [K in UnionKeys<U> & string]: UnionToIntersection<U extends any ? (K extends keyof U ? U[K] : never) : never>;
};

type ExtractInput<T> = "input" extends keyof T ? T["input"] : undefined;
type ExtractOutput<T> = "output" extends keyof T ? T["output"] : undefined;
type ExtractJson<T> = "json" extends keyof T ? T["json"] : undefined;
type ExtractQuery<T> = "query" extends keyof T ? T["query"] : undefined;

/** Hono encodes methods as `$get`, `$post`, ... on every path entry of the schema. */
type ExtractMethodKeys<T> = Extract<keyof T, `$${string}`>;

/**
 * Turns every `path -> { $method: endpoint }` entry of a Hono schema into a Hyper Fetch `Request`.
 * The full Hono path is kept as the endpoint, so `:param` segments type `setParams()`.
 */
type ConvertToRequest<Schema extends Record<string, any>, Client extends ClientInstance> = {
  [Path in keyof Schema]: {
    [K in ExtractMethodKeys<Schema[Path]> as K extends `$${infer M extends string}`
      ? `$${Lowercase<M>}`
      : never]: Request<
      ExtractOutput<Schema[Path][K]>,
      ExtractJson<ExtractInput<Schema[Path][K]>>,
      ExtractQuery<ExtractInput<Schema[Path][K]>>,
      undefined,
      Path extends string ? Path : never,
      Client
    >;
  };
};

/* -------------------------------------------------------------------------------------------------
 * Flat record -> nested SDK schema
 * -----------------------------------------------------------------------------------------------*/

type TrimStartSlash<S extends string> = S extends `/${infer R}` ? R : S;

type SplitPath<S extends string> = S extends ""
  ? []
  : S extends `${infer Head}/${infer Tail}`
    ? [Head, ...SplitPath<Tail>]
    : [S];

type CamelCase<S extends string> = S extends `${infer H}-${infer T}` ? `${H}${Capitalize<CamelCase<T>>}` : S;

/**
 * `:userId` becomes `$userId` and `google-login` becomes `googleLogin`, matching the accessors
 * `createSdk` resolves back to the endpoint at runtime.
 */
type NormalizeSegment<S extends string> = S extends `:${infer P}` ? `$${P}` : CamelCase<S>;

type BuildNestedObject<Segments extends readonly string[], Value> = Segments extends [
  infer Head extends string,
  ...infer Rest extends string[],
]
  ? { [K in NormalizeSegment<Head>]: BuildNestedObject<Rest, Value> }
  : Value;

type NestFlatRecord<R extends Record<string, any>> = Prettify<
  UnionToIntersection<
    {
      [P in keyof R & string]: BuildNestedObject<SplitPath<TrimStartSlash<P>>, R[P]>;
    }[keyof R & string]
  >
>;

/**
 * Converts the type of a Hono app into a Hyper Fetch SDK schema for `createSdk`.
 *
 * Every route becomes a `Request` whose response, JSON payload, query params and endpoint come
 * from the Hono route definition and its validators. Path segments become nested properties,
 * `:param` segments become `$param` properties, and kebab-case segments become camelCase.
 *
 * Pass the type of the app returned by your route chain, including apps mounted with
 * `app.route()` and `basePath()`. Anything that is not a Hono app resolves to `{}`.
 *
 * @typeParam App - The Hono app type, usually `typeof app`.
 * @typeParam Client - The client the requests belong to. `createSdk` injects its own client, so
 * this is only needed when the schema is used outside of `createSdk`.
 *
 * @example
 * ```ts
 * // backend
 * const app = new Hono().get("/users/:userId", (c) => c.json({ id: c.req.param("userId") }));
 * export type AppSchema = HonoAppToHyperFetch<typeof app>;
 *
 * // frontend
 * const sdk = createSdk<typeof client, AppSchema>(client);
 * const { data } = await sdk.users.$userId.$get.send({ params: { userId: "1" } });
 * ```
 */
export type HonoAppToHyperFetch<App, Client extends ClientInstance = ClientInstance> =
  // Match `HonoBase` with all four generics: `.route()` returns `HonoBase<E, S, BasePath, CurrentPath>`,
  // so matching against `Hono<E, S, BasePath>` fails to infer the schema and resolves to `{}`.
  App extends HonoBase<any, infer S, any, any>
    ? Prettify<NestFlatRecord<ConvertToRequest<MergeUnionToRecord<S>, Client>>>
    : {};
