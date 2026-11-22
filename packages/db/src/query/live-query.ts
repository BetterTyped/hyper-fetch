import type { RowKey } from "../collection/collection.types";
import type { CollectionRuntime } from "../db/collection.runtime";
import { evaluate } from "../operators/operators.utils";
import type { Row } from "../store/store.types";
import type { SubsetObserver } from "../subset/base-subset";
import type { KeySubset } from "../subset/key-subset";
import type { ListSubset } from "../subset/list-subset";
import type { QueryPlan } from "./planner";
import { planQuery } from "./planner";
import type { QueryDefinition, QueryExplanation, QueryState } from "./query.types";

const isSameState = (left: QueryState<unknown>, right: QueryState<unknown>) => {
  return (
    left.data === right.data &&
    left.status === right.status &&
    left.error === right.error &&
    left.stale === right.stale &&
    left.isFetching === right.isFetching &&
    left.hasNextPage === right.hasNextPage
  );
};

type JoinDefinition = NonNullable<QueryDefinition["joins"]>[number];

const EMPTY_ROWS: Row[] = [];

/** Joined values are the same row, or arrays of the same rows */
const sameJoined = (left: unknown, right: unknown) => {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => item === right[index]);
  }
  return left === right;
};

const sameItems = (left: unknown, right: unknown[]) => {
  return (
    Array.isArray(left) && left.length === right.length && left.every((item, index) => Object.is(item, right[index]))
  );
};

/**
 * The running form of a query: it attaches to the loaded subset that serves it, keeps its result current as rows
 * change and tells its subscribers. Queries with the same definition share one live query.
 */
export class LiveQuery implements SubsetObserver {
  readonly plan: QueryPlan;
  private listeners = new Set<() => void>();
  private source: ListSubset | undefined;
  private keySubset: KeySubset | undefined;
  private answeredLocally = false;
  /** The subset a query that nothing subscribes to reads, see `getSource` */
  private peeked: ListSubset | undefined;
  private sorted: RowKey[] = [];
  private members = new Set<RowKey>();
  private selections = new Map<RowKey, { row: Row; joined: unknown[]; value: unknown }>();
  /** Key subsets that load the joined rows, by `collection:key` */
  private joinSubsets = new Map<string, KeySubset>();
  /** Live queries that load the rows of one-to-many joins, by join name */
  private joinQueries = new Map<string, { key: string; unsubscribe: () => void }>();
  /** The rows of each one-to-many join by the value of its `on` field, built when first read */
  private childIndex = new Map<string, Map<unknown, Row[]>>();
  private state: QueryState<unknown> = {
    data: undefined,
    status: "loading",
    error: null,
    stale: false,
    isFetching: false,
    hasNextPage: false,
  };

  constructor(
    readonly collection: CollectionRuntime,
    readonly definition: QueryDefinition,
    readonly key: string,
  ) {
    this.plan = planQuery({
      collectionName: collection.name,
      config: collection.config,
      definition,
      notation: collection.db.notation,
    });
    this.state = this.computeState();
  }

  /** The current state. A query nobody subscribes to is computed from the rows the db holds right now. */
  getState = () => {
    if (!this.isActive()) {
      this.rebuild();
    }
    return this.state;
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.attach();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.detach();
      }
    };
  };

  /** Whether anything subscribes to the query */
  isActive = () => this.listeners.size > 0;

  /** How many listeners subscribe to the query */
  get subscriberCount() {
    return this.listeners.size;
  }

  refetch = (): Promise<void> => {
    return (this.source ?? this.keySubset)?.load() ?? Promise.resolve();
  };

  /** How the query's loader pages: by cursor, by a growing `limit`, or not at all */
  getPaging = (): "cursor" | "limit" | "none" => {
    if (this.plan.kind !== "list") {
      return "none";
    }
    const loader = this.collection.config.loaders[this.plan.loaderIndex];
    if (loader.cursor) {
      return "cursor";
    }
    return loader.limit ? "limit" : "none";
  };

  fetchNextPage = (): Promise<void> => {
    return this.source?.loadNext() ?? Promise.resolve();
  };

  /** Refetches the query's subset when it is stale, after focus or reconnect */
  revalidate = () => {
    (this.source ?? this.keySubset)?.revalidate();
  };

  explain = (): QueryExplanation => {
    const { plan } = this;
    const subset = this.source ?? this.keySubset;
    const syncs = (subset?.subscriptions ?? []).map((subscription) => ({
      type: subscription.sync.type,
      topic: subscription.listener.topic,
    }));
    if (plan.kind === "error") {
      return { kind: "error", sent: [], local: [], answeredLocally: false, syncs, error: plan.error };
    }
    if (plan.kind === "local") {
      return {
        kind: "local",
        sent: [],
        local: this.definition.where ? [this.definition.where] : [],
        answeredLocally: true,
        syncs,
      };
    }
    if (plan.kind === "one") {
      return {
        kind: "one",
        loader: plan.loaderIndex,
        sent: [],
        local: [],
        answeredLocally: plan.loaderIndex === undefined,
        syncs,
      };
    }
    const container = this.source ? undefined : this.collection.findContainingSubset(plan);
    const answeredLocally = this.source ? this.answeredLocally : Boolean(container && container.id !== plan.subsetId);
    return { kind: "list", loader: plan.loaderIndex, sent: plan.sent, local: plan.local, answeredLocally, syncs };
  };

  /** Rows changed: update membership and order of just those rows */
  onRowsChanged = (keys: Iterable<RowKey>) => {
    if (this.plan.kind === "error" || !this.isActive()) {
      return;
    }
    // Most writes touch rows a query does not show, so those queries do no further work
    const touched = [...keys].filter((key) => this.members.has(key) || this.isMember(key));
    if (touched.length === 0) {
      return;
    }
    const compare = this.getComparator();
    touched.forEach((key) => {
      if (this.members.has(key)) {
        this.sorted.splice(this.sorted.indexOf(key), 1);
        this.members.delete(key);
      }
      if (this.isMember(key)) {
        this.insertSorted(key, compare);
      }
    });
    this.syncJoins();
    this.emit();
  };

  /** The subset's rows or status changed */
  onSubsetChange = () => {
    this.collection.db.markQueryDirty(this);
  };

  /** Recomputes the whole result */
  rebuild = () => {
    this.childIndex.clear();
    this.peeked = this.peekSource();
    // A list query without a subset to read shows nothing yet
    const readable = this.plan.kind !== "list" || this.getSource() !== undefined;
    if (this.plan.kind !== "error") {
      const compare = this.getComparator();
      this.members = new Set(readable ? this.collection.store.keys().filter((key) => this.isMember(key)) : []);
      this.sorted = [...this.members].toSorted(compare);
    }
    if (this.isActive()) {
      this.syncJoins();
    }
    this.emit();
  };

  private attach = () => {
    const { plan, collection } = this;
    if (plan.kind === "one") {
      if (plan.loaderIndex !== undefined) {
        this.keySubset = collection.getKeySubset(collection.resolveKey(plan.key), plan.loaderIndex);
        this.keySubset.attach(this);
        if (!collection.store.get(collection.resolveKey(plan.key)) || !this.keySubset.isFresh()) {
          this.keySubset.revalidate();
        }
      }
    } else if (plan.kind === "list") {
      const container = collection.findContainingSubset(plan);
      this.answeredLocally = Boolean(container && container.id !== plan.subsetId);
      this.source = this.answeredLocally ? container : collection.getListSubset(plan, this.definition);
      this.source!.attach(this);
      if (!this.answeredLocally) {
        this.source!.revalidate();
      }
    }
    this.rebuild();
  };

  private detach = () => {
    this.collection.db.releaseLater(this);
    this.source?.detach(this);
    this.keySubset?.detach(this);
    this.joinSubsets.forEach((subset) => subset.detach(this));
    this.joinSubsets.clear();
    this.joinQueries.forEach((entry) => entry.unsubscribe());
    this.joinQueries.clear();
    this.source = undefined;
    this.keySubset = undefined;
    this.answeredLocally = false;
    this.members.clear();
    this.sorted = [];
    this.selections.clear();
  };

  private getComparator = () => this.collection.createComparator(this.definition.orderBy, this.getSource());

  private insertSorted = (key: RowKey, compare: (left: RowKey, right: RowKey) => number) => {
    let low = 0;
    let high = this.sorted.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (compare(this.sorted[middle], key) <= 0) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    this.sorted.splice(low, 0, key);
    this.members.add(key);
  };

  private isMember = (key: RowKey): boolean => {
    const { plan, collection, definition } = this;
    const row = collection.store.get(key);
    if (!row) {
      return false;
    }
    if (plan.kind === "one") {
      return key === collection.resolveKey(plan.key);
    }
    if (definition.where && !evaluate(definition.where, row)) {
      return false;
    }
    if (plan.kind === "local") {
      return true;
    }
    const source = this.getSource()!;
    const plannedLoader = collection.config.loaders[(plan as Extract<QueryPlan, { kind: "list" }>).loaderIndex];
    const fixed = plannedLoader.fixed ?? {};
    if (!Object.keys(fixed).every((field) => evaluate({ op: "eq", field, value: fixed[field] }, row))) {
      return false;
    }
    // Pages and server-only operators hold exactly what the backend returned
    if (source.ownsOnly) {
      return source.holds(key);
    }
    return !source.excluded.has(key);
  };

  /** The joined value of a row: the row with that key, or every row whose `on` field holds the value */
  private resolveJoin = (join: JoinDefinition, row: Row) => {
    const value = row[join.field];
    if (!join.on) {
      return this.collection.db.collections.get(join.collection)!.store.get(value as RowKey);
    }
    return this.getChildren(join).get(value) ?? EMPTY_ROWS;
  };

  private getChildren = (join: JoinDefinition) => {
    const existing = this.childIndex.get(join.name);
    if (existing) {
      return existing;
    }
    const { store } = this.collection.db.collections.get(join.collection)!;
    const index = new Map<unknown, Row[]>();
    store.keys().forEach((childKey) => {
      const child = store.get(childKey)!;
      const value = child[join.on!];
      index.set(value, [...(index.get(value) ?? []), child]);
    });
    this.childIndex.set(join.name, index);
    return index;
  };

  private hasInnerJoins = () => (this.definition.joins ?? []).some((join) => join.type === "inner");

  /** Whether a row has every row its inner joins need */
  private passesInnerJoins = (key: RowKey) => {
    const row = this.collection.store.get(key)!;
    return (this.definition.joins ?? []).every((join) => {
      if (join.type !== "inner") {
        return true;
      }
      const joined = this.resolveJoin(join, row);
      return Array.isArray(joined) ? joined.length > 0 : joined !== undefined;
    });
  };

  private select = (key: RowKey) => {
    const row = this.collection.store.get(key)!;
    const joins = this.definition.joins ?? [];
    const joined = joins.map((join) => this.resolveJoin(join, row));
    const cached = this.selections.get(key);
    const sameJoins = Boolean(cached?.joined.every((item, index) => sameJoined(item, joined[index])));
    if (cached && cached.row === row && sameJoins) {
      return cached.value;
    }
    const { select } = this.definition;
    // A change to a field the query does not select keeps the result, so components that read it do not render
    if (
      cached &&
      select &&
      sameJoins &&
      Object.values(select).every((field) => Object.is(cached.row[field], row[field]))
    ) {
      this.selections.set(key, { ...cached, row });
      return cached.value;
    }
    const selected = select
      ? Object.fromEntries(Object.entries(select).map(([output, field]) => [output, row[field]]))
      : row;
    const value =
      joins.length > 0
        ? { ...selected, ...Object.fromEntries(joins.map(({ name }, index) => [name, joined[index]])) }
        : selected;
    this.selections.set(key, { row, joined, value });
    return value;
  };

  /** Whether the query reads rows of a collection, its own or a joined one */
  dependsOn = (collection: CollectionRuntime) => {
    return (this.definition.joins ?? []).some((join) => join.collection === collection.name);
  };

  /** Rows of a joined collection changed: results that point at them select again */
  onJoinedRowsChanged = () => {
    this.childIndex.clear();
    this.syncJoins();
    this.emit();
  };

  /** Attaches the key subsets that load the joined rows of the current result and releases the others */
  private syncJoins = () => {
    const needed = new Map<string, { collection: CollectionRuntime; key: RowKey }>();
    // Local queries never load, so they read the joined rows the db holds
    const joins = this.definition.local ? [] : (this.definition.joins ?? []);
    this.syncChildQueries(joins.filter((join) => join.on));
    joins
      .filter((join) => !join.on)
      .forEach(({ collection: name, field }) => {
        const collection = this.collection.db.collections.get(name)!;
        this.members.forEach((member) => {
          const key = this.collection.store.get(member)![field] as RowKey | null | undefined;
          if (key !== null && key !== undefined) {
            needed.set(`${name}:${String(key)}`, { collection, key });
          }
        });
      });
    this.joinSubsets.forEach((subset, id) => {
      if (!needed.has(id)) {
        subset.detach(this);
        this.joinSubsets.delete(id);
      }
    });
    needed.forEach(({ collection, key }, id) => {
      const loaderIndex = collection.config.loaders.findIndex((loader) => loader.kind !== "list");
      if (this.joinSubsets.has(id) || loaderIndex === -1) {
        return;
      }
      const subset = collection.getKeySubset(key, loaderIndex);
      subset.attach(this);
      subset.revalidate();
      this.joinSubsets.set(id, subset);
    });
  };

  /**
   * Loads the rows of one-to-many joins: one query of the joined collection for the values of the whole result, when
   * one of its list loaders can send `inArray` on the joined field. Otherwise the join reads the rows the db holds.
   */
  private syncChildQueries = (joins: JoinDefinition[]) => {
    // A query's joins never change, so `detach` releases these queries
    joins.forEach((join) => {
      const values = [
        ...new Set(
          [...this.members]
            .map((member) => this.collection.store.get(member)![join.field])
            .filter((value) => value !== null && value !== undefined),
        ),
      ].toSorted();
      const definition: QueryDefinition = {
        collection: join.collection,
        where: { op: "inArray", field: join.on!, value: values },
        orderBy: [],
        local: false,
      };
      const query = this.collection.db.getLiveQuery(definition);
      const current = this.joinQueries.get(join.name);
      if (current?.key === query.key) {
        return;
      }
      current?.unsubscribe();
      this.joinQueries.delete(join.name);
      const sendsValues =
        query.plan.kind === "list" && query.plan.sent.some((node) => node.op === "inArray" && node.field === join.on);
      if (values.length > 0 && sendsValues) {
        this.joinQueries.set(join.name, { key: query.key, unsubscribe: query.subscribe(() => {}) });
      }
    });
  };

  private buildList = () => {
    const { plan, definition } = this;
    const paginated = plan.kind === "list" && plan.paginated;
    const included = this.hasInnerJoins() ? this.sorted.filter(this.passesInnerJoins) : this.sorted;
    const keys = definition.limit !== undefined && !paginated ? included.slice(0, definition.limit) : included;
    const items = keys.map((key) => this.select(key));
    [...this.selections.keys()].forEach((key) => {
      if (!this.members.has(key)) {
        this.selections.delete(key);
      }
    });
    return sameItems(this.state.data, items) ? this.state.data : items;
  };

  private computeState = (): QueryState<unknown> => {
    const { plan, collection } = this;
    const { db } = collection;
    const base = { error: null as unknown, stale: false, isFetching: false, hasNextPage: false };

    if (plan.kind === "error") {
      return { ...base, data: undefined, status: "error", error: plan.error };
    }
    // While persisted rows are restored, a query has nothing reliable to show, unless a server rendered it: hydrated
    // subsets are loaded, so the first render matches the server's
    if (!db.isReady && !this.getSource()?.hasLoaded && !(plan.kind === "one" && this.members.size > 0)) {
      return { ...base, data: undefined, status: "loading" };
    }
    if (plan.kind === "local") {
      return { ...base, data: this.buildList(), status: "ready" };
    }
    if (plan.kind === "one") {
      const subset = this.keySubset;
      const key = collection.resolveKey(plan.key);
      const row = this.members.has(key) && this.passesInnerJoins(key) ? this.select(key) : undefined;
      let status: QueryState<unknown>["status"] = "loading";
      if (row || !subset || subset.hasLoaded) {
        status = "ready";
      } else if (subset.error) {
        status = "error";
      }
      return {
        data: row,
        status,
        error: subset?.error ?? null,
        stale: subset ? !subset.isFresh() : false,
        isFetching: subset?.isLoading ?? false,
        hasNextPage: false,
      };
    }
    const source = this.getSource();
    if (!source) {
      return { ...base, data: undefined, status: "loading" };
    }
    let status: QueryState<unknown>["status"] = "loading";
    if (source.hasLoaded) {
      status = "ready";
    } else if (source.error) {
      status = "error";
    }
    return {
      data: status === "ready" ? this.buildList() : undefined,
      status,
      error: source.error,
      stale: !source.isFresh(),
      isFetching: source.isLoading,
      hasNextPage: plan.paginated && source.hasMore,
    };
  };

  /**
   * The subset that serves a list query. Before anything subscribes, such as on a component's first render, it is the
   * loaded subset that would serve it, read without attaching to it or loading it.
   */
  private getSource = () => this.source ?? this.peeked;

  private peekSource = () => {
    const { collection, plan } = this;
    if (this.source || plan.kind !== "list") {
      return;
    }
    return collection.findContainingSubset(plan) ?? collection.listSubsets.get(plan.subsetId);
  };

  private emit = () => {
    const next = this.computeState();
    if (isSameState(this.state, next)) {
      return;
    }
    this.state = next;
    this.listeners.forEach((listener) => {
      // A listener that throws, such as a broken component, is reported and never stops the others
      try {
        listener();
      } catch (error) {
        this.collection.db.emitError({ type: "subscriber", error, collection: this.collection.name });
      }
    });
  };
}
