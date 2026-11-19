import type { ClientInstance, Request } from "@hyper-fetch/core";
import type { HonoBase } from "hono/hono-base";

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never;

/* -------------------------------------------------------------------------------------------------
 * Hono schema -> flat record of methods
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
 * Turns the `{ $method: endpoint }` entry of a Hono path into Hyper Fetch `Request`s. The endpoint
 * is the one `createSdk` builds from the accessors, so `:param` segments type `setParams()`.
 */
type ConvertMethods<Methods, Endpoint extends string, Client extends ClientInstance> = {
  [K in ExtractMethodKeys<Methods> as K extends `$${infer M extends string}` ? `$${Lowercase<M>}` : never]: Request<
    ExtractOutput<Methods[K]>,
    ExtractJson<ExtractInput<Methods[K]>>,
    ExtractQuery<ExtractInput<Methods[K]>>,
    undefined,
    Endpoint,
    Client
  >;
};

/* -------------------------------------------------------------------------------------------------
 * Paths -> nested SDK schema
 * -----------------------------------------------------------------------------------------------*/

type TrimStartSlash<S extends string> = S extends `/${infer R}` ? R : S;

type SplitPath<S extends string> = S extends ""
  ? []
  : S extends `${infer Head}/${infer Tail}`
    ? [Head, ...SplitPath<Tail>]
    : [S];

type JoinSegments<Segments extends string[]> = Segments extends [infer Head extends string]
  ? Head
  : Segments extends [infer Head extends string, ...infer Rest extends string[]]
    ? `${Head}/${JoinSegments<Rest>}`
    : "";

/**
 * `createSdk` joins the accessors with `/` behind a leading slash, so a Hono path without a leading
 * slash, or with a trailing one, gets the endpoint the request is really sent to.
 */
type JoinPath<Segments extends string[]> = `/${JoinSegments<Segments>}`;

type StripOptionalMarkers<Segments extends string[]> = {
  [I in keyof Segments]: Segments[I] extends `:${infer Param}?` ? `:${Param}` : Segments[I];
};

/**
 * Hono serves `/files/:id?` both at `/files` and at `/files/:id`, and a chain of trailing optional
 * params at every prefix. Hyper Fetch params are always required, so each prefix is its own route.
 */
type ExpandOptionalParams<Segments extends string[]> = Segments extends [
  ...infer Init extends string[],
  `:${infer Param}?`,
]
  ? ExpandOptionalParams<Init> | [...StripOptionalMarkers<Init>, `:${Param}`]
  : Segments;

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

/** Distributes over the routes one Hono path expands to. */
type ConvertRoutes<Methods, Routes extends string[], Client extends ClientInstance> = Routes extends string[]
  ? BuildNestedObject<Routes, Prettify<ConvertMethods<Methods, JoinPath<Routes>, Client>>>
  : never;

type ConvertSchema<Schema extends Record<string, any>, Client extends ClientInstance> = UnionToIntersection<
  {
    [Path in keyof Schema & string]: ConvertRoutes<
      Schema[Path],
      ExpandOptionalParams<SplitPath<TrimStartSlash<Path>>>,
      Client
    >;
  }[keyof Schema & string]
>;

/**
 * Converts the type of a Hono app into a Hyper Fetch SDK schema for `createSdk`.
 *
 * Every route becomes a `Request` whose response, JSON payload, query params and endpoint come
 * from the Hono route definition and its validators. Path segments become nested properties,
 * `:param` segments become `$param` properties, and kebab-case segments become camelCase.
 *
 * Routes below an optional `:param?` segment appear both without and with the param. The endpoint
 * is the one `createSdk` sends the request to, so a trailing slash of the Hono path is dropped.
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
  App extends HonoBase<any, infer S, any, any> ? Prettify<ConvertSchema<MergeUnionToRecord<S>, Client>> : {};
