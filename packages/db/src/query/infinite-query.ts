import type { DbRuntime } from "../db/db.runtime";
import { stableStringify } from "../operators/operators.utils";
import type { LiveQuery } from "./live-query";
import type { QueryDefinition, QueryState } from "./query.types";

/** The state of an infinite query: the rows of its window, split into pages */
export type InfiniteQueryState<Item> = QueryState<Item[]> & {
  /** `data` split into pages of `pageSize` */
  pages: Item[][];
  /** Whether more rows are loading to fill the window after `fetchNextPage` */
  isFetchingNextPage: boolean;
};

export type InfiniteQueryOptions = {
  /** How many rows each page holds. Pages are independent of the backend's page size. */
  pageSize: number;
};

const toPages = <Item>(items: Item[], pageSize: number): Item[][] => {
  return Array.from({ length: Math.ceil(items.length / pageSize) }, (_, index) =>
    items.slice(index * pageSize, (index + 1) * pageSize),
  );
};

/**
 * A window over an ordered live query: the first `pageSize` times the number of pages rows of its result. Widening it
 * shows rows the db holds at once and loads more from the query's loader only when the window runs past them.
 *
 * The window belongs to this instance, so two components showing the same query share its live query and its subset,
 * and each keeps its own number of pages.
 */
export class InfiniteQuery<Item> {
  /** Identifies the infinite query by its query's structure and page size */
  readonly key: string;
  private pageCount = 1;
  private live: LiveQuery;
  /** The live query of the previous window, shown while a wider `limit` loads */
  private previous: { live: LiveQuery; unsubscribe: () => void; pageCount: number } | undefined;
  private unsubscribeLive: (() => void) | undefined;
  private listeners = new Set<() => void>();
  private filling: Promise<void> | undefined;
  private widening: Promise<void> | undefined;
  private readonly paging: "cursor" | "limit" | "none";
  private snapshot: { source: QueryState<unknown>; pageCount: number; fetching: boolean; value: unknown } | undefined;

  constructor(
    private readonly runtime: DbRuntime,
    private readonly definition: QueryDefinition,
    private readonly options: InfiniteQueryOptions,
  ) {
    if (!Number.isInteger(options.pageSize) || options.pageSize < 1) {
      throw new Error(`An infinite query needs a whole pageSize of at least 1, received ${options.pageSize}`);
    }
    this.key = stableStringify({ definition, pageSize: options.pageSize });
    this.paging = runtime.getLiveQuery(definition).getPaging();
    this.live = runtime.getLiveQuery(this.getDefinition());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      // The db forgets live queries nobody uses, so the window attaches to the one the db serves now
      this.live = this.runtime.getLiveQuery(this.getDefinition());
      this.unsubscribeLive = this.live.subscribe(this.onLiveChange);
      this.fill();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.unsubscribeLive!();
        this.unsubscribeLive = undefined;
        this.dropPrevious();
      }
    };
  };

  getSnapshot = (): InfiniteQueryState<Item> => {
    const { source, pageCount } = this.getSource();
    const fetching = this.isFetchingNextPage();
    const cached = this.snapshot;
    if (cached && cached.source === source && cached.pageCount === pageCount && cached.fetching === fetching) {
      return cached.value as InfiniteQueryState<Item>;
    }
    const size = pageCount * this.options.pageSize;
    const rows = source.data as Item[] | undefined;
    const data = rows?.slice(0, size);
    const value: InfiniteQueryState<Item> = {
      ...(source as QueryState<Item[]>),
      data,
      pages: data ? toPages(data, this.options.pageSize) : [],
      hasNextPage: (rows?.length ?? 0) > size || (this.paging === "cursor" && source.hasNextPage),
      isFetchingNextPage: fetching,
    };
    this.snapshot = { source, pageCount, fetching, value };
    return value;
  };

  /**
   * Widens the window by one page. Rows the db holds show at once, and the loader loads more when the window runs past
   * them. Resolves once the window is filled or the backend has no more rows.
   */
  fetchNextPage = (): Promise<void> => {
    // A page that is still loading answers a second call, so a double scroll event loads one page
    if (this.filling || this.previous) {
      return this.filling ?? this.widening!;
    }
    // Pages load for subscribers, as queries do
    if (!this.unsubscribeLive || !this.getSnapshot().hasNextPage) {
      return Promise.resolve();
    }
    this.pageCount += 1;
    if (this.paging === "limit") {
      return this.widenLimit();
    }
    this.notify();
    return this.fill();
  };

  /** Loads the query again from its first page */
  refetch = (): Promise<void> => this.live.refetch();

  private getDefinition = (): QueryDefinition => {
    if (this.paging !== "limit") {
      return this.definition;
    }
    return { ...this.definition, limit: this.pageCount * this.options.pageSize + 1 };
  };

  /** The state and window the snapshot shows: the previous window while a wider one loads its first response */
  private getSource = () => {
    const state = this.live.getState();
    if (this.previous && state.status === "loading") {
      return { source: this.previous.live.getState(), pageCount: this.previous.pageCount };
    }
    return { source: state, pageCount: this.pageCount };
  };

  private isFetchingNextPage = () => Boolean(this.filling) || Boolean(this.previous);

  private onLiveChange = () => {
    if (this.previous && this.live.getState().status !== "loading") {
      this.dropPrevious();
    }
    this.fill();
    this.notify();
  };

  /** Loads backend pages until the db holds one row past the window, or the backend has none */
  private fill = (): Promise<void> => {
    if (this.filling) {
      return this.filling;
    }
    const state = this.live.getState();
    const size = this.pageCount * this.options.pageSize;
    const held = (state.data as unknown[] | undefined)?.length ?? 0;
    // Only subscribers load pages, so an unsubscribed query never loops on a subset it does not attach to
    const blocked = !this.unsubscribeLive || this.paging !== "cursor" || state.status === "loading";
    if (blocked || !state.hasNextPage || held > size) {
      return Promise.resolve();
    }
    this.filling = this.live.fetchNextPage().then(() => {
      this.filling = undefined;
      const next = this.live.getState();
      // A failed page stops filling, so a broken backend is not asked again in a loop, and so does a page that
      // brought no row, such as an empty page a server filtered
      const failed = next.error !== null && next.error !== undefined;
      this.notify();
      // A call that brought no row stops filling, so filling never spins; the next `fetchNextPage` goes on
      return failed || (next.data as unknown[]).length <= held ? undefined : this.fill();
    });
    this.notify();
    return this.filling;
  };

  /** A loader with `limit` and no cursor is sent the window size plus one, as a new live query */
  private widenLimit = (): Promise<void> => {
    const next = this.runtime.getLiveQuery(this.getDefinition());
    this.previous = { live: this.live, unsubscribe: this.unsubscribeLive!, pageCount: this.pageCount - 1 };
    this.live = next;
    this.unsubscribeLive = next.subscribe(this.onLiveChange);
    this.notify();
    this.widening = new Promise((resolve) => {
      let settled = false;
      const check = () => {
        if (!settled && next.getState().status !== "loading") {
          settled = true;
          resolve();
          // The first state can arrive while subscribing, before `stop` exists
          queueMicrotask(() => stop());
        }
      };
      const stop = next.subscribe(check);
      check();
    });
    return this.widening;
  };

  private dropPrevious = () => {
    this.previous?.unsubscribe();
    this.previous = undefined;
  };

  private notify = () => {
    this.listeners.forEach((listener) => listener());
  };
}
