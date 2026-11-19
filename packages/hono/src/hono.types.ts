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

/** Hono marks the routes handled by `upgradeWebSocket()` with the `ws` output format. */
type IsWebSocketEndpoint<T> = T extends { outputFormat: "ws" } ? true : false;

/** Method keys of a path entry that answer over HTTP - WebSocket upgrades are left out. */
type ExtractHttpMethodKeys<T> = {
  [K in ExtractMethodKeys<T>]: IsWebSocketEndpoint<T[K]> extends true ? never : K;
}[ExtractMethodKeys<T>];

/**
 * Turns every `path -> { $method: endpoint }` entry of a Hono schema into a Hyper Fetch `Request`.
 * The full Hono path is kept as the endpoint, so `:param` segments type `setParams()`.
 * WebSocket upgrades are not requests, so they are skipped, and so is a path left without an HTTP method.
 */
type ConvertToRequest<Schema extends Record<string, any>, Client extends ClientInstance> = {
  [Path in keyof Schema as [ExtractHttpMethodKeys<Schema[Path]>] extends [never] ? never : Path]: {
    [K in ExtractMethodKeys<Schema[Path]> as IsWebSocketEndpoint<Schema[Path][K]> extends true
      ? never
      : K extends `$${infer M extends string}`
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
 * Routes handled by `upgradeWebSocket()` are not requests, so they are left out - connect to them with a
 * `Socket` and check the address with {@link HonoWebSocketPath}. Server-Sent Events routes (`streamSSE()`)
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
type ToPathPattern<Path extends string> = Path extends `${infer Head}/${infer Tail}`
  ? `${ToSegmentPattern<Head>}/${ToPathPattern<Tail>}`
  : ToSegmentPattern<Path>;

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
 * const path: HonoWebSocketPath<AppType> = `/chat/${roomId}`;
 * const socket = new Socket({ url: `wss://api.example.com${path}` });
 * ```
 */
export type HonoWebSocketPath<App> = {
  [Path in keyof WebSocketEndpoints<App> & string]: ToPathPattern<Path>;
}[keyof WebSocketEndpoints<App> & string];
