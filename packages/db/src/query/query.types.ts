import type { ListLoaderDescriptor, RowKey, SortDirection } from "../collection/collection.types";
import type { ComparisonOperator, ExpressionNode, LocalToken, SendableNode } from "../operators/operators.types";

/** A query as data. Two queries with the same definition are the same query. */
export type QueryDefinition = {
  collection: string;
  where?: ExpressionNode;
  orderBy: { field: string; direction: SortDirection }[];
  /** Output name to row field */
  select?: Record<string, string>;
  limit?: number;
  one?: { key: RowKey };
  local: boolean;
  /** Left joins on another collection's key: each result carries the joined row under `name` */
  joins?: { name: string; collection: string; field: string; type?: "inner"; on?: string }[];
};

export type QueryStatus = "loading" | "ready" | "error";

export type QueryState<Data> = {
  /** `undefined` until the query has loaded, then the selected fields of every row */
  data: Data | undefined;
  /** `error` only when a first load failed and there is nothing to show */
  status: QueryStatus;
  /** The last failure, also when a refresh failed and the rows stay */
  error: unknown;
  /** Whether the rows may be out of date: their subset is stale or its syncs are disconnected */
  stale: boolean;
  /** Whether a request for the query is in flight */
  isFetching: boolean;
  /** Whether a paginated query has another page */
  hasNextPage: boolean;
};

/** How the db serves a query, from `query.explain()` */
export type QueryExplanation = {
  kind: "list" | "one" | "local" | "error";
  /** Index of the loader in the collection's chain */
  loader?: number;
  /** Conditions sent to the backend */
  sent: SendableNode[];
  /** Conditions evaluated on the rows the db holds */
  local: ExpressionNode[];
  /** Whether rows the db already holds answer the query, with no request */
  answeredLocally: boolean;
  /** The syncs that keep the result live */
  syncs: { type: "insert" | "update" | "delete" | "changes"; topic: string }[];
  error?: Error;
};

/**
 * Whether some loader can serve a query: the query sets its required filters, and a paginated loader can send every
 * condition and order.
 */
export type IsServable<
  Loaders,
  Tokens extends string,
  Eq extends string,
  Order extends string,
  Mode extends "list" | "one",
  Local extends boolean,
> = Local extends true
  ? true
  : Mode extends "one"
    ? [Extract<Loaders, { kind: "key" }>] extends [never]
      ? false
      : true
    : true extends ServableBy<Loaders, Tokens, Eq, Order>
      ? true
      : false;

/** Tokens of server-only operators, which the loader must send because the client cannot evaluate them */
type ServerTokens<Tokens extends string> = Tokens extends `${string}:${ComparisonOperator}` | LocalToken
  ? never
  : Tokens;

type ServableBy<Loaders, Tokens extends string, Eq extends string, Order extends string> =
  Loaders extends ListLoaderDescriptor<infer Required, infer LoaderTokens, infer LoaderOrder, infer Paginated>
    ? [Required] extends [Eq]
      ? [ServerTokens<Tokens>] extends [LoaderTokens]
        ? Paginated extends true
          ? [Tokens] extends [LoaderTokens]
            ? [Order] extends [LoaderOrder]
              ? true
              : false
            : false
          : true
        : false
      : false
    : false;
