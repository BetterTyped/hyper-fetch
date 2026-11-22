import type { AnyRequestPatch, LoaderConfig, RowKey } from "../collection/collection.types";
import type { CollectionRuntime } from "../db/collection.runtime";
import { evaluate } from "../operators/operators.utils";
import type { ListPlan } from "../query/planner";
import { getOrderMapping, getWhereMapping } from "../query/planner";
import type { QueryDefinition } from "../query/query.types";
import type { Row } from "../store/store.types";
import { applyRequestPatches } from "../utils/request.utils";
import type { LoadOptions } from "./base-subset";
import { BaseSubset } from "./base-subset";

/**
 * The rows one list loader returned for one set of sent conditions, order and range. It owns those rows until it is
 * released, and records which rows a refetch no longer returned.
 */
export class ListSubset extends BaseSubset {
  owned = new Set<RowKey>();
  /** Rows that inserts added inside a paginated subset's range */
  inserted = new Set<RowKey>();
  /** Rows a refetch no longer returned, which another subset still holds */
  excluded = new Set<RowKey>();
  orderIndex = new Map<RowKey, number>();
  cursor: unknown = undefined;
  hasMore = false;
  /** How many pages a paginated subset has loaded, so a refetch reloads all of them */
  pages = 0;

  readonly listLoader: LoaderConfig;
  readonly plan: ListPlan;
  readonly definition: Pick<QueryDefinition, "orderBy" | "limit">;

  constructor(
    collection: CollectionRuntime,
    options: { loader: LoaderConfig; plan: ListPlan; definition: Pick<QueryDefinition, "orderBy" | "limit"> },
  ) {
    super(collection, options.loader);
    this.listLoader = options.loader;
    this.plan = options.plan;
    this.definition = options.definition;
  }

  get id() {
    return this.plan.subsetId;
  }

  /** The values of the subset's sent `eq` conditions, which syncs use to pick their subscription */
  getEqValues = (): Record<string, unknown> => {
    return Object.fromEntries(
      this.plan.sent.filter((node) => node.op === "eq").map((node) => [node.field, node.value]),
    );
  };

  /** Whether a row matches what the backend was asked for, including the loader's fixed filters */
  matchesSent = (row: Row) => {
    const fixed = this.listLoader.fixed ?? {};
    const fixedMatch = Object.keys(fixed).every((field) => evaluate({ op: "eq", field, value: fixed[field] }, row));
    return fixedMatch && this.plan.sent.every((node) => evaluate(node, row));
  };

  /** Whether the backend decides membership alone: pages, or a server-only operator the client cannot evaluate */
  get ownsOnly() {
    return this.plan.paginated || this.plan.sent.some((node) => node.op === "server");
  }

  holds = (key: RowKey) => {
    if (this.ownsOnly) {
      return this.owned.has(key) || this.inserted.has(key);
    }
    if (this.excluded.has(key)) {
      return false;
    }
    const row = this.collection.store.getServerRow(key);
    return this.owned.has(key) || Boolean(row && this.matchesSent(row));
  };

  /** Adds an inserted row to a paginated subset when it sorts inside the loaded range */
  noteInsert = (key: RowKey) => {
    this.excluded.delete(key);
    if (!this.plan.paginated) {
      // A new row may match a server-only operator, which only a refetch can tell
      if (this.ownsOnly && this.hasLoaded) {
        this.invalidate();
      }
      return;
    }
    const row = this.collection.store.get(key);
    if (!row || !this.matchesSent(row)) {
      return;
    }
    if (!this.hasMore) {
      this.inserted.add(key);
      return;
    }
    const compare = this.collection.createComparator(this.definition.orderBy, this);
    const last = [...this.owned].toSorted(compare).pop();
    if (last !== undefined && compare(key, last) < 0) {
      this.inserted.add(key);
    }
  };

  /** Loads the page after the last loaded one */
  loadNext = (): Promise<void> => {
    if (!this.hasMore || this.isLoading) {
      return this.pending ?? Promise.resolve();
    }
    this.pendingIsFull = false;
    const pending: Promise<void> = this.loadPages(false).finally(() => {
      if (this.pending === pending) {
        this.pending = undefined;
      }
    });
    this.pending = pending;
    return pending;
  };

  protected run = (options: LoadOptions) => this.loadPages(true, options.waitForWrites !== false);

  private buildRequest = (cursor: { value: unknown } | undefined) => {
    const loader = this.listLoader;
    const { notation } = this.collection.db;
    // The planner only sends conditions and orders that have a mapping
    const patches: AnyRequestPatch[] = this.plan.sent.map((node) =>
      getWhereMapping(loader, node, notation)!(node.value),
    );
    if (this.plan.sendOrder) {
      this.definition.orderBy.forEach(({ field, direction }) => {
        patches.push(getOrderMapping(loader, field, notation)!(direction));
      });
    }
    if (this.plan.sendLimit) {
      patches.push(loader.limit!(this.definition.limit!));
    }
    if (cursor && loader.page) {
      patches.push(loader.page(cursor.value));
    }
    return applyRequestPatches(loader.request.setCache(false), patches);
  };

  /**
   * Loads from the first page, or the page after the last loaded one. A paginated subset is a prefix of its result, so
   * loading from the first page reloads every page loaded so far, in order, and then releases the rows none of them
   * returned. The rows stay until the last page is back, so the list does not jump while it reloads.
   */
  private loadPages = async (fromStart: boolean, waitForWrites = true) => {
    const { db } = this.collection;
    const { generation } = db;
    this.beginLoad();
    const timeout = this.startNetworkTimeout();
    const returned: RowKey[] = fromStart ? [] : [...this.orderIndex.keys()];
    let loadSeq = 0;
    let result: Awaited<ReturnType<typeof this.fetchPages>>;
    try {
      await db.ready;
      if (waitForWrites) {
        await this.collection.mutationsSettled();
      }
      // Rows written after this point are newer than what the load can return, so a reload never releases them
      loadSeq = db.tick();
      result = await this.fetchPages({
        cursor: fromStart ? undefined : { value: this.cursor },
        remaining: fromStart ? Math.max(1, this.pages) : 1,
        returned,
        timeout,
        generation,
      });
    } catch (error) {
      // A mapping that throws, such as `rows` on an unexpected response, fails the load instead of leaving it pending
      clearTimeout(timeout);
      result = { success: false, error };
      db.emitError({ type: "load", error, collection: this.collection.name });
    }
    // After `clear`, the response belongs to the previous user
    if (db.generation !== generation) {
      db.batch(() => {
        this.endLoad();
        this.collection.markSubsetChanged(this);
      });
      return;
    }
    if (!result.success) {
      db.batch(() => {
        this.error = result.error;
        this.endLoad();
        this.collection.markSubsetChanged(this);
      });
      return;
    }
    const { cursor, loaded } = result;
    db.batch(() => {
      if (fromStart) {
        this.release(returned, loadSeq);
      }
      this.orderIndex.clear();
      returned.forEach((key, index) => this.orderIndex.set(key, index));
      this.cursor = cursor;
      this.hasMore = cursor !== undefined && cursor !== null;
      this.pages = (fromStart ? 0 : this.pages) + loaded;
      this.hasLoaded = true;
      this.loadedAt = Date.now();
      this.invalidated = false;
      this.error = null;
      this.endLoad();
      this.collection.markSubsetChanged(this);
    });
  };

  /** Loads pages one after another, each with the cursor the previous one returned, until `remaining` are loaded */
  private fetchPages = async (options: {
    cursor: { value: unknown } | undefined;
    remaining: number;
    returned: RowKey[];
    timeout: ReturnType<typeof setTimeout> | undefined;
    generation: number;
  }): Promise<{ success: true; cursor: unknown; loaded: number } | { success: false; error: unknown }> => {
    const result = await this.fetchPage(options.cursor, options.returned, options.generation);
    clearTimeout(options.timeout);
    if (!result.success) {
      return result;
    }
    const more = result.next !== undefined && result.next !== null;
    if (!more || options.remaining <= 1) {
      return { success: true, cursor: result.next, loaded: 1 };
    }
    const rest = await this.fetchPages({
      ...options,
      cursor: { value: result.next },
      remaining: options.remaining - 1,
    });
    return rest.success ? { ...rest, loaded: rest.loaded + 1 } : rest;
  };

  /** Sends one page's request and writes its rows, adding their keys to `returned` in order */
  private fetchPage = async (
    cursor: { value: unknown } | undefined,
    returned: RowKey[],
    generation: number,
  ): Promise<{ success: true; next: unknown } | { success: false; error: unknown }> => {
    const { db } = this.collection;
    const seq = db.tick();
    const wall = Date.now();
    db.trackRequest(seq);
    try {
      const response = await this.buildRequest(cursor).send();
      if (!response.success) {
        return { success: false, error: response.error ?? response };
      }
      const items = this.collection.readItems(this.listLoader, response.data);
      const next = this.listLoader.cursor?.(response.data);
      const rows = await this.collection.prepareServerRows(items);
      if (db.generation !== generation) {
        return { success: false, error: new Error("Cleared") };
      }
      db.batch(() => {
        const keys = this.collection.writeServerRows(rows, true, { kind: "sent", seq, wall });
        keys.forEach((key) => {
          this.owned.add(key);
          this.excluded.delete(key);
          if (!this.orderIndex.has(key)) {
            this.orderIndex.set(key, this.orderIndex.size);
          }
        });
        returned.push(...keys);
        this.collection.markSubsetChanged(this);
      });
      return { success: true, next };
    } finally {
      db.settleRequest(seq);
    }
  };

  /**
   * Releases rows a complete reload no longer returned: rows it owned, rows inserts had added to its pages, and rows
   * nothing else holds that match what it sent, such as a confirmed insert someone else deleted since. The server
   * answered for its conditions, so such a row is not in them.
   */
  private release = (returned: RowKey[], loadSeq: number) => {
    const returnedKeys = new Set(returned);
    const { store } = this.collection;
    // A row written after the load was sent, by a write, an event or another response, is newer than the load knows
    const isNewer = (key: RowKey) => store.getLastSeq(key) > loadSeq;
    this.inserted.forEach((key) => {
      this.inserted.delete(key);
      if (!returnedKeys.has(key)) {
        this.owned.add(key);
      }
    });
    if (!this.ownsOnly) {
      // Rows another subset or a pending write holds still show, as every matching row the db holds does
      this.collection.store.getServerKeys().forEach((key) => {
        const row = this.collection.store.getServerRow(key)!;
        const unheld = !this.collection.isHeldByOthers(key, this);
        if (!returnedKeys.has(key) && !isNewer(key) && this.matchesSent(row) && unheld) {
          this.collection.store.drop(key);
        }
      });
    }
    this.owned.forEach((key) => {
      if (returnedKeys.has(key) || isNewer(key)) {
        return;
      }
      this.owned.delete(key);
      if (this.collection.isHeldByOthers(key, this)) {
        this.excluded.add(key);
      } else {
        this.collection.store.drop(key);
      }
    });
  };

  /** With persistence, a subset that restored no rows shows an empty result once the network took too long */
  private startNetworkTimeout = () => {
    const { persistence } = this.collection.db;
    if (!persistence || this.hasLoaded) {
      return;
    }
    return setTimeout(() => {
      if (this.hasLoaded) {
        return;
      }
      this.hasLoaded = true;
      this.loadedAt = 0;
      this.invalidated = true;
      this.notify();
    }, persistence.networkTimeout);
  };
}
