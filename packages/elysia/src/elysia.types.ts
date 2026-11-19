import type { ClientInstance, Request } from "@hyper-fetch/core";

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/* -------------------------------------------------------------------------------------------------
 * Route entries
 * -----------------------------------------------------------------------------------------------*/

/**
 * The entry Elysia stores under a method key of its route tree. `response` maps every status the
 * handler can return to the body it returns with that status.
 */
type ElysiaRoute = {
  body: unknown;
  params: unknown;
  query: unknown;
  headers: unknown;
  response: Record<number, unknown>;
};

/**
 * Elysia stores WebSocket routes under `subscribe`, and `.all()` routes under an index signature.
 * Neither maps to a single HTTP method, so they are not part of the schema.
 */
type MethodKeys<Node> = {
  [K in keyof Node & string]: string extends K
    ? never
    : K extends "subscribe"
      ? never
      : Node[K] extends ElysiaRoute
        ? K
        : never;
}[keyof Node & string];

type SuccessStatus<Responses> = {
  [S in keyof Responses]: `${S & number}` extends `2${string}` ? S : never;
}[keyof Responses];

type ErrorStatus<Responses> = Exclude<keyof Responses, SuccessStatus<Responses>>;

/**
 * `fetch` resolves a 2xx status as a success, so only 2xx bodies are the response. A route without
 * a 2xx status gets `undefined`, because a `never` response breaks the `Extract*` helpers of core.
 */
type RouteResponse<Route extends ElysiaRoute> = [SuccessStatus<Route["response"]>] extends [never]
  ? undefined
  : Route["response"][SuccessStatus<Route["response"]>];

/** Bodies of every other status, including the `422` Elysia sends when a schema rejects the input. */
type RouteError<Route extends ElysiaRoute> = [ErrorStatus<Route["response"]>] extends [never]
  ? undefined
  : Route["response"][ErrorStatus<Route["response"]>];

/** Elysia types a route without a `body` or `query` schema as `unknown`. */
type DefinedOrUndefined<T> = unknown extends T ? undefined : T;

type Endpoint<Path extends string> = Path extends "" ? "/" : Path;

type ConvertMethods<Node, Path extends string, Client extends ClientInstance> = {
  [K in MethodKeys<Node> as `$${Lowercase<K>}`]: Node[K] extends ElysiaRoute
    ? Request<
        RouteResponse<Node[K]>,
        DefinedOrUndefined<Node[K]["body"]>,
        DefinedOrUndefined<Node[K]["query"]>,
        RouteError<Node[K]>,
        Endpoint<Path>,
        Client
      >
    : never;
};

/* -------------------------------------------------------------------------------------------------
 * Path segments
 * -----------------------------------------------------------------------------------------------*/

type CamelCase<S extends string> = S extends `${infer H}-${infer T}` ? `${H}${Capitalize<CamelCase<T>>}` : S;

/**
 * Keys of the route tree that are path segments. Wildcard segments are left out, because Hyper
 * Fetch has no way to fill them, and so are optional params, which `ConvertOptionalParams` handles.
 */
type SegmentKeys<Node> = {
  [K in keyof Node & string]: string extends K
    ? never
    : K extends "*" | `:${string}?`
      ? never
      : Node[K] extends ElysiaRoute
        ? never
        : K;
}[keyof Node & string];

/** `:userId` becomes `$userId` and `google-login` becomes `googleLogin`, as `createSdk` expects. */
type NormalizeSegment<S extends string> = S extends `:${infer P}` ? `$${P}` : CamelCase<S>;

/** A segment that only holds left out routes, like `/live` with a WebSocket, is left out as well. */
type OmitEmpty<T> = {
  [K in keyof T as keyof T[K] extends never ? never : K]: T[K];
};

type ConvertSegments<Node, Path extends string, Client extends ClientInstance, Depth extends unknown[]> = OmitEmpty<{
  [K in SegmentKeys<Node> as NormalizeSegment<K>]: ConvertNode<Node[K], `${Path}/${K}`, Client, [...Depth, unknown]>;
}>;

type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never;

/**
 * Elysia matches `/files/:id?` with and without the param. Hyper Fetch params are always required,
 * so the routes below an optional param are added twice: on the current level without the param,
 * and under `$id` with it.
 */
type ConvertOptionalParams<
  Node,
  Path extends string,
  Client extends ClientInstance,
  Depth extends unknown[],
> = UnionToIntersection<
  {
    [K in keyof Node & string]: K extends `:${infer P}?`
      ? ConvertNode<Node[K], Path, Client, [...Depth, unknown]> & {
          [Key in `$${P}`]: ConvertNode<Node[K], `${Path}/:${P}`, Client, [...Depth, unknown]>;
        }
      : never;
  }[keyof Node & string]
>;

/**
 * The depth guard matches the 10 levels `createSdk` injects its client into. Without optional
 * params the last intersection resolves to `unknown`, which leaves the level unchanged.
 */
type ConvertNode<
  Node,
  Path extends string,
  Client extends ClientInstance,
  Depth extends unknown[] = [],
> = Depth["length"] extends 10
  ? {}
  : Prettify<
      ConvertMethods<Node, Path, Client> &
        ConvertSegments<Node, Path, Client, Depth> &
        ConvertOptionalParams<Node, Path, Client, Depth>
    >;

/**
 * Converts the type of an Elysia app into a Hyper Fetch SDK schema for `createSdk`.
 *
 * Every route becomes a `Request`. The response is the union of the bodies the handler returns with
 * a 2xx status, the local error is the union of the bodies of every other status, and the payload
 * and query params come from the route's `body` and `query` schemas. Path segments become nested
 * properties, `:param` segments become `$param` properties, and kebab-case segments become
 * camelCase.
 *
 * Routes below an optional `:param?` segment appear both without and with the param. WebSocket
 * routes, `.all()` routes and wildcard `*` segments are left out. Anything that is not an Elysia
 * app resolves to `{}`.
 *
 * @typeParam App - The Elysia app type, usually `typeof app`.
 * @typeParam Client - The client the requests belong to. `createSdk` injects its own client, so
 * this is only needed when the schema is used outside of `createSdk`.
 *
 * @example
 * ```ts
 * // backend
 * const app = new Elysia().get("/users/:userId", ({ params }) => ({ id: params.userId }));
 * export type AppSchema = ElysiaAppToHyperFetch<typeof app>;
 *
 * // frontend
 * const sdk = createSdk<typeof client, AppSchema>(client);
 * const { data } = await sdk.users.$userId.$get.setParams({ userId: "1" }).send();
 * ```
 */
export type ElysiaAppToHyperFetch<App, Client extends ClientInstance = ClientInstance> = App extends {
  "~Routes": infer Routes;
}
  ? ConvertNode<Routes, "", Client>
  : {};
