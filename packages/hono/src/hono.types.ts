import type { ClientInstance, Request } from "@hyper-fetch/core";
import type { HonoBase } from "hono/hono-base";
import type { METHODS } from "hono/router";

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

type StandardMethodKey = `$${(typeof METHODS)[number]}`;

/** Hono marks the routes handled by `upgradeWebSocket()` with the `ws` output format. */
type IsWebSocketEndpoint<T> = T extends { outputFormat: "ws" } ? true : false;

/** Method keys of a path entry that answer over HTTP - WebSocket upgrades are left out. */
type ExtractHttpMethodKeys<T> = {
  [K in ExtractMethodKeys<T>]: IsWebSocketEndpoint<T[K]> extends true ? never : K;
}[ExtractMethodKeys<T>];

/**
 * Hono stores `.all()` routes under `$all`, and `ALL` is not a method a client can send. Like Hono's
 * own client, the route gets every standard method instead. A method registered on the same path
 * keeps its own handler.
 */
type ExpandAllMethod<Methods> = "$all" extends keyof Methods
  ? Omit<Methods, "$all"> & { [M in Exclude<StandardMethodKey, keyof Methods>]: Methods["$all"] }
  : Methods;

/**
 * Turns the `{ $method: endpoint }` entry of a Hono path into Hyper Fetch `Request`s. The endpoint
 * is the one `createSdk` builds from the accessors, so `:param` segments type `setParams()`.
 * WebSocket upgrades are not requests, so they are skipped.
 */
type ConvertMethods<Methods, Endpoint extends string, Client extends ClientInstance> = {
  [K in ExtractHttpMethodKeys<Methods> as K extends `$${infer M extends string}` ? `$${Lowercase<M>}` : never]: Request<
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

/** Skips a regex pattern up to its closing brace, counting the braces nested inside it. */
type SkipPattern<S extends string, Depth extends unknown[] = []> = S extends `${infer Char}${infer Rest}`
  ? Char extends "}"
    ? Depth extends [unknown, ...infer Outer]
      ? SkipPattern<Rest, Outer>
      : Rest
    : Char extends "{"
      ? SkipPattern<Rest, [...Depth, unknown]>
      : SkipPattern<Rest, Depth>
  : S;

/**
 * Hono restricts a param with a regex, as in `/posts/:id{[0-9]+}`. The client fills the param by its
 * name only, so the pattern is dropped from the path, even when it holds a slash or braces.
 */
type StripPatterns<S extends string> = S extends `${infer Head}{${infer Rest}`
  ? `${Head}${StripPatterns<SkipPattern<Rest>>}`
  : S;

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

/** The routes one Hono path expands to - optional params give every prefix, regex patterns are dropped */
type ExpandPath<Path extends string> = ExpandOptionalParams<SplitPath<TrimStartSlash<StripPatterns<Path>>>>;

type ConvertSchema<Schema extends Record<string, any>, Client extends ClientInstance> = UnionToIntersection<
  {
    // A path served only by a WebSocket upgrade has no request to send
    [Path in keyof Schema & string]: [ExtractHttpMethodKeys<ExpandAllMethod<Schema[Path]>>] extends [never]
      ? never
      : ConvertRoutes<ExpandAllMethod<Schema[Path]>, ExpandPath<Path>, Client>;
  }[keyof Schema & string]
>;

/**
 * Converts the type of a Hono app into a Hyper Fetch SDK schema for `createSdk`.
 *
 * Every route becomes a `Request` whose response, JSON payload, query params and endpoint come
 * from the Hono route definition and its validators. Path segments become nested properties,
 * `:param` segments become `$param` properties, and kebab-case segments become camelCase.
 *
 * Routes below an optional `:param?` segment appear both without and with the param, and regex
 * params like `:id{[0-9]+}` become plain `$id` properties. The endpoint is the one `createSdk`
 * sends the request to, so a trailing slash and the regex patterns of the Hono path are dropped.
 * An `.all()` route gets every standard method, like in Hono's own client.
 *
 * Pass the type of the app returned by your route chain, including apps mounted with
 * `app.route()` and `basePath()`. Anything that is not a Hono app resolves to `{}`.
 *
 * Routes handled by `upgradeWebSocket()` are not requests, so they are left out - connect to them with a
 * `Socket` and check the address with {@link HonoSocketPath}. Server-Sent Events routes (`streamSSE()`)
 * stay in the schema as a `$get` with an untyped response: Hono types them like any other raw `Response`.
 *
 * @typeParam App - The Hono app type, usually `typeof app`.
 * @typeParam Client - The client the requests belong to. `createSdk` injects its own client, so
 * this is only needed when the schema is used outside of `createSdk`.
 *
 * @example
 * ```ts
 * // backend
 * const app = new Hono().get("/users/:userId", (c) => c.json({ id: c.req.param("userId") }));
 * export type AppSchema = HonoSchema<typeof app>;
 *
 * // frontend
 * const sdk = createSdk<typeof client, AppSchema>(client);
 * const { data } = await sdk.users.$userId.$get.send({ params: { userId: "1" } });
 * ```
 */
export type HonoSchema<App, Client extends ClientInstance = ClientInstance> =
  // Match `HonoBase` with all four generics: `.route()` returns `HonoBase<E, S, BasePath, CurrentPath>`,
  // so matching against `Hono<E, S, BasePath>` fails to infer the schema and resolves to `{}`.
  App extends HonoBase<any, infer S, any, any> ? Prettify<ConvertSchema<MergeUnionToRecord<S>, Client>> : {};

/* -------------------------------------------------------------------------------------------------
 * WebSocket routes
 * -----------------------------------------------------------------------------------------------*/

type ExtractAppSchema<App> = App extends HonoBase<any, infer S, any, any> ? MergeUnionToRecord<S> : never;

/** `path -> endpoint` of the routes that upgrade a GET to a WebSocket - the routes `hc` exposes as `$ws`. */
type ExtractWebSocketEndpoints<Schema> = {
  [Path in keyof Schema & string as Schema[Path] extends { $get: infer Endpoint }
    ? IsWebSocketEndpoint<Endpoint> extends true
      ? Path
      : never
    : never]: Schema[Path] extends { $get: infer Endpoint } ? Endpoint : never;
};

type WebSocketEndpoints<App> = ExtractWebSocketEndpoints<ExtractAppSchema<App>>;

type ToSegmentPattern<Segment extends string> = Segment extends `:${string}` ? string : Segment;

/** Replaces every `:param` segment with `string`, so a path with the params filled in matches it. */
type ToRoutePattern<Segments extends string[]> = `/${JoinSegments<{
  [I in keyof Segments]: ToSegmentPattern<Segments[I]>;
}>}`;

/** Every address of a Hono path, with optional params and regex patterns handled like in the HTTP schema */
type ToPathPattern<Path extends string> =
  ExpandPath<Path> extends infer Routes extends string[]
    ? Routes extends string[]
      ? ToRoutePattern<Routes>
      : never
    : never;

/**
 * Union of the paths a `Socket` can connect to on a Hono app: every route handled by `upgradeWebSocket()`,
 * including the `basePath()` and `app.route()` prefixes. A `:param` segment accepts any value, so
 * `/chat/:roomId` becomes `` `/chat/${string}` `` and `/chat/42` matches it.
 *
 * Hono has no realtime protocol of its own, so this checks the address only. Describe the messages the
 * route sends and receives with `ListenerModel` and `EmitterModel` in a `createSocketSdk` schema.
 *
 * @typeParam App - The Hono app type, usually `typeof app`. Anything that is not a Hono app resolves to `never`.
 *
 * @example
 * ```ts
 * // backend
 * const app = new Hono().get("/chat/:roomId", upgradeWebSocket((c) => ({ onMessage() {} })));
 * export type AppType = typeof app;
 *
 * // frontend
 * const path: HonoSocketPath<AppType> = `/chat/${roomId}`;
 * const socket = new Socket({ url: `wss://api.example.com${path}` });
 * ```
 */
export type HonoSocketPath<App> = {
  [Path in keyof WebSocketEndpoints<App> & string]: ToPathPattern<Path>;
}[keyof WebSocketEndpoints<App> & string];

/* -------------------------------------------------------------------------------------------------
 * Deprecated names
 * -----------------------------------------------------------------------------------------------*/

/**
 * @deprecated Renamed to {@link HonoSchema}, to match `TrpcSchema` and `OrpcSchema`. This alias will be removed in
 * the next major version.
 */
export type HonoAppToHyperFetch<App, Client extends ClientInstance = ClientInstance> = HonoSchema<App, Client>;

/**
 * @deprecated Renamed to {@link HonoSocketPath}. This alias will be removed in the next major version.
 */
export type HonoWebSocketPath<App> = HonoSocketPath<App>;
