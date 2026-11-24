import type { SortDirection } from "../collection/collection.types";
import type { DbRuntime } from "../db/db.runtime";
import type {
  Condition,
  ExtractConditionEq,
  ExtractConditionTokens,
  FieldRef,
  RowRefs,
} from "../operators/operators.types";
import { stableStringify } from "../operators/operators.utils";
import type { InfiniteQueryOptions } from "./infinite-query";
import { InfiniteQuery } from "./infinite-query";
import type { IsServable, QueryDefinition, QueryExplanation, QueryState } from "./query.types";

const createRefs = <Row>(): RowRefs<Row> => {
  return new Proxy(
    {},
    {
      get: (_target, field) => ({ kind: "field", field }),
    },
  ) as RowRefs<Row>;
};

/** What a query's `data` holds: a list of results, or one result for `findOne` */
export type QueryData<Result, Mode extends "list" | "one"> = Mode extends "one" ? Result : Result[];

/** A collection a query can join: a handle of the db, with its name, row and key field */
export type JoinTarget = { readonly collectionName: string; readonly __types?: { row: unknown; key: string } };

/** The row of a joined collection */
export type JoinedRowOf<Target extends JoinTarget> = NonNullable<Target["__types"]>["row"];

/** The key type of a joined collection, which the foreign key must hold */
export type JoinedKeyOf<Target extends JoinTarget> = JoinedRowOf<Target>[NonNullable<Target["__types"]>["key"] &
  keyof JoinedRowOf<Target>];

/** What a join adds to each result: one row, one row or `undefined`, or an array of rows with `on` */
export type JoinedValue<JoinedRow, On, Type> = unknown extends On
  ? [Type] extends ["inner"]
    ? JoinedRow
    : JoinedRow | undefined
  : JoinedRow[];

/** The value the foreign key must hold: the joined collection's key, or its `on` field */
export type JoinedMatchOf<Target extends JoinTarget, On> = unknown extends On
  ? JoinedKeyOf<Target>
  : On extends keyof JoinedRowOf<Target>
    ? JoinedRowOf<Target>[On]
    : never;

/** The field that holds the joined key, alone or with join options */
export type JoinSpec<Row, Field extends keyof Row & string, Match, On, Type> =
  | JoinBy<Row, Field, Match>
  | { by: JoinBy<Row, Field, Match>; on?: On; type?: Type & ("left" | "inner") };

/** Picks the field of a row that holds the joined key or value */
export type JoinBy<Row, Field extends keyof Row & string, Match> = (
  row: RowRefs<Row>,
) => FieldRef<Field, Row[Field] & (Match | null | undefined)>;

/** The result of a query with one more joined value */
type Joined<Result, Name extends string, Value> = {
  [Field in keyof Result | Name]: Field extends Name ? Value : Field extends keyof Result ? Result[Field] : never;
};

type Selected<Selection> = {
  [Output in keyof Selection]: Selection[Output] extends FieldRef<string, infer Value> ? Value : never;
};

/**
 * An immutable description of a query over one collection. Each method returns a new query, and two queries with the
 * same structure are the same query, so a component can rebuild its query on every render.
 *
 * The type parameters record what the query asks a backend for, so the types can check that a loader serves it.
 */
export class Query<
  Row,
  Loaders,
  Result,
  Tokens extends string = never,
  Eq extends string = never,
  Order extends string = never,
  Mode extends "list" | "one" = "list",
  Local extends boolean = false,
> {
  /** Type-only carrier of the query's generics, never set at runtime */
  declare readonly __types?: {
    row: Row;
    loaders: Loaders;
    result: Result;
    tokens: Tokens;
    eq: Eq;
    order: Order;
    mode: Mode;
    local: Local;
  };

  /** Identifies the query by its structure */
  readonly key: string;

  constructor(
    private readonly runtime: DbRuntime,
    readonly definition: QueryDefinition,
  ) {
    this.key = stableStringify(definition);
  }

  /**
   * Filters rows. The db splits the condition at its top-level `and`: conditions the loader declares are sent to the
   * backend, and the rest run on the rows the db holds. Calling it again adds conditions.
   */
  where<C extends Condition<string, string>>(
    this: Query<Row, Loaders, Result, Tokens, Eq, Order, "list", Local>,
    callback: (row: RowRefs<Row>) => C,
  ): Query<Row, Loaders, Result, Tokens | ExtractConditionTokens<C>, Eq | ExtractConditionEq<C>, Order, Mode, Local> {
    const { node } = callback(createRefs<Row>());
    const where = this.definition.where ? { op: "and" as const, items: [this.definition.where, node] } : node;
    return new Query(this.runtime, { ...this.definition, where });
  }

  /** Sorts rows by a field. Calling it again adds a sort that breaks ties of the previous ones. */
  orderBy<Name extends keyof Row & string>(
    this: Query<Row, Loaders, Result, Tokens, Eq, Order, "list", Local>,
    callback: (row: RowRefs<Row>) => FieldRef<Name, Row[Name]>,
    direction: SortDirection = "asc",
  ): Query<Row, Loaders, Result, Tokens, Eq, Order | Name, Mode, Local> {
    const { field } = callback(createRefs<Row>());
    return new Query(this.runtime, { ...this.definition, orderBy: [...this.definition.orderBy, { field, direction }] });
  }

  /** Picks and renames the fields each result holds */
  select<Selection extends Record<string, FieldRef<string, unknown>>>(
    callback: (row: RowRefs<Row>) => Selection,
  ): Query<Row, Loaders, Selected<Selection>, Tokens, Eq, Order, Mode, Local> {
    const selection = callback(createRefs<Row>());
    const select = Object.fromEntries(Object.entries(selection).map(([output, ref]) => [output, ref.field]));
    return new Query(this.runtime, { ...this.definition, select });
  }

  /**
   * Adds the row of another collection whose key is the given field, as a left join: each result holds it under `name`,
   * or `undefined` while it is not loaded or when there is none. With `{ type: "inner" }`, results without a joined row
   * are left out. With `{ on: "postId" }`, the join matches that field of the joined collection instead of its key and
   * holds an array of every matching row, loaded through a list loader that can send `inArray` on it. Options go in an
   * object with the field as `by`, as in `join("comments", db.comment, { by: (post) => post.id, on: "postId" })`. The db loads joined rows in batches through the joined
   * collection's key loader, and a result updates whenever its joined row changes. Syncs keep a joined row live too: a
   * sync with `where` subscribes with the values of the joined row's own fields, such as its `teamId`.
   */
  join<Name extends string, Target extends JoinTarget, Field extends keyof Row & string, const On, const Type>(
    name: Name,
    collection: Target,
    by: JoinSpec<Row, Field, JoinedMatchOf<Target, On>, On, Type>,
  ): Query<
    Row,
    Loaders,
    Joined<Result, Name, JoinedValue<JoinedRowOf<Target>, On, Type>>,
    Tokens,
    Eq,
    Order,
    Mode,
    Local
  > {
    const options: { type?: string; on?: unknown } = typeof by === "function" ? {} : by;
    const callback = typeof by === "function" ? by : by.by;
    const { field } = callback(createRefs<Row>());
    const join = {
      name,
      collection: collection.collectionName,
      field,
      ...(options.type === "inner" ? { type: "inner" as const } : {}),
      ...(options.on ? { on: options.on as string } : {}),
    };
    return new Query(this.runtime, { ...this.definition, joins: [...(this.definition.joins ?? []), join] });
  }

  /** Limits the number of results. A paginated loader that declares `limit` receives it as its page size. */
  limit(
    this: Query<Row, Loaders, Result, Tokens, Eq, Order, "list", Local>,
    limit: number,
  ): Query<Row, Loaders, Result, Tokens, Eq, Order, Mode, Local> {
    return new Query(this.runtime, { ...this.definition, limit });
  }

  /** Reads only the rows the db holds and never sends a request */
  local(): Query<Row, Loaders, Result, Tokens, Eq, Order, Mode, true> {
    return new Query(this.runtime, { ...this.definition, local: true });
  }

  /**
   * Subscribes to the query's state. The first subscriber attaches the query to the subset that serves it, which loads
   * when it is stale. Returns a function that unsubscribes.
   */
  subscribe(
    this: Query<Row, Loaders, Result, Tokens, Eq, Order, Mode, Local> &
      ServableCheck<Loaders, Tokens, Eq, Order, Mode, Local>,
    listener: () => void,
  ): () => void {
    return this.runtime.getLiveQuery(this.definition).subscribe(listener);
  }

  /** The current state. It keeps its identity until something changes, as `useSyncExternalStore` expects. */
  getSnapshot(): QueryState<QueryData<Result, Mode>> {
    return this.runtime.getLiveQuery(this.definition).getState() as QueryState<QueryData<Result, Mode>>;
  }

  /** Reads the query once: resolves with the first state that is not loading */
  get(
    this: Query<Row, Loaders, Result, Tokens, Eq, Order, Mode, Local> &
      ServableCheck<Loaders, Tokens, Eq, Order, Mode, Local>,
  ): Promise<QueryState<QueryData<Result, Mode>>> {
    const live = this.runtime.getLiveQuery(this.definition);
    return new Promise((resolve) => {
      let settled = false;
      const settle = () => {
        const state = live.getState();
        if (settled || state.status === "loading") {
          return;
        }
        settled = true;
        resolve(state as QueryState<QueryData<Result, Mode>>);
        // The first state can arrive while subscribing, before `unsubscribe` exists
        queueMicrotask(() => unsubscribe());
      };
      const unsubscribe = live.subscribe(settle);
      settle();
    });
  }

  /**
   * A window over the query's ordered result, widened one page at a time with `fetchNextPage`. Rows the db holds show
   * at once, and the loader loads more only when the window runs past them. The query must have `orderBy`, so a page
   * never shifts between renders.
   *
   * @example
   * const feed = db.post.orderBy((post) => post.createdAt, "desc").infinite({ pageSize: 20 });
   * feed.subscribe(() => render(feed.getSnapshot().pages));
   */
  infinite(
    this: Query<Row, Loaders, Result, Tokens, Eq, Order, Mode, Local> &
      ServableCheck<Loaders, Tokens, Eq, Order, Mode, Local> &
      InfiniteCheck<Order, Mode>,
    options: InfiniteQueryOptions,
  ): InfiniteQuery<Result> {
    return new InfiniteQuery<Result>(this.runtime, this.definition, options);
  }

  /** Loads the query's subset again */
  refetch(): Promise<void> {
    return this.runtime.getLiveQuery(this.definition).refetch();
  }

  /** Loads the next page of a paginated query */
  fetchNextPage(): Promise<void> {
    return this.runtime.getLiveQuery(this.definition).fetchNextPage();
  }

  /** How the db serves the query: the loader, what is sent, what runs locally and which syncs keep it live */
  explain(): QueryExplanation {
    return this.runtime.getLiveQuery(this.definition).explain();
  }
}

/** Fails to compile when no loader can serve the query */
export type ServableCheck<
  Loaders,
  Tokens extends string,
  Eq extends string,
  Order extends string,
  Mode extends "list" | "one",
  Local extends boolean,
> = IsServable<Loaders, Tokens, Eq, Order, Mode, Local> extends true ? unknown : { servable: never };

/** Fails to compile for a query without `orderBy` or one that reads one row */
export type InfiniteCheck<Order extends string, Mode extends "list" | "one"> = [Order] extends [never]
  ? { orderBy: never }
  : Mode extends "one"
    ? { list: never }
    : unknown;

/** The type arguments a query instance records, read directly so that `never` stays `never` */
type QueryTypes<Q> = Q extends { __types?: infer Types } ? NonNullable<Types> : never;

/** Fails to compile when a query cannot be read as an infinite query */
export type InfiniteQueryCheck<Q> =
  QueryTypes<Q> extends {
    loaders: infer Loaders;
    tokens: infer Tokens extends string;
    eq: infer Eq extends string;
    order: infer Order extends string;
    mode: infer Mode extends "list" | "one";
    local: infer Local extends boolean;
  }
    ? ServableCheck<Loaders, Tokens, Eq, Order, Mode, Local> & InfiniteCheck<Order, Mode>
    : never;

/** The item type of a query instance's results */
export type ExtractQueryResult<Q> = QueryTypes<Q> extends { result: infer Result } ? Result : never;

/** Any query, whatever its collection and result */
export type QueryInstance = Query<any, any, any, any, any, any, any, any>;

/** Fails to compile when no loader can serve the query */
export type ServableQuery<Q> =
  QueryTypes<Q> extends {
    loaders: infer Loaders;
    tokens: infer Tokens extends string;
    eq: infer Eq extends string;
    order: infer Order extends string;
    mode: infer Mode extends "list" | "one";
    local: infer Local extends boolean;
  }
    ? ServableCheck<Loaders, Tokens, Eq, Order, Mode, Local>
    : never;

/** The data of a query instance */
export type ExtractQueryData<Q> =
  QueryTypes<Q> extends { result: infer Result; mode: infer Mode extends "list" | "one" }
    ? QueryData<Result, Mode>
    : never;
