import type { RequestInstance } from "@hyper-fetch/core";

import type {
  CollectionConfig,
  IngestConfig,
  ListenerPatch,
  LoaderConfig,
  RowKey,
  SortDirection,
  SyncConfig,
} from "../collection/collection.types";
import type { ComparisonNode } from "../operators/operators.types";
import { compareValues, stableStringify } from "../operators/operators.utils";
import type { ListPlan } from "../query/planner";
import type { QueryDefinition } from "../query/query.types";
import { Store } from "../store/store";
import type { Row, Stamp } from "../store/store.types";
import type { BaseSubset } from "../subset/base-subset";
import { KeySubset } from "../subset/key-subset";
import { ListSubset } from "../subset/list-subset";
import { SyncSubscription } from "../sync/sync";
import { applyListenerPatches, applyRequestPatches, isPlainObject } from "../utils/request.utils";
import type { DbRuntime } from "./db.runtime";

type KeyRequest = { subset: KeySubset; resolve: () => void; waitForWrites: boolean };

/** Everything the db keeps for one collection: its rows, loaded subsets, sync subscriptions and ingested requests */
export class CollectionRuntime {
  readonly store: Store;
  readonly listSubsets = new Map<string, ListSubset>();
  readonly keySubsets = new Map<RowKey, KeySubset>();
  readonly subscriptions = new Map<string, SyncSubscription>();
  /** Server keys that replaced temporary keys of inserts */
  readonly aliases = new Map<RowKey, RowKey>();
  private renderKeys = new Map<RowKey, string>();
  private keyRequests: KeyRequest[] = [];
  private cleanups: (() => void)[] = [];

  constructor(
    readonly db: DbRuntime,
    readonly name: string,
    readonly config: CollectionConfig,
  ) {
    this.store = new Store({
      keyField: config.key,
      versionField: config.version,
      onChange: (key) => db.markRowChanged(this, key),
    });
    config.ingests.forEach((ingest) => this.listenToIngest(ingest));
  }

  /** The stable key for rendering a row, which survives swapping a temporary key for the server's */
  getRenderKey = (key: RowKey): string => this.renderKeys.get(key) ?? String(key);

  setRenderKey = (key: RowKey, renderKey: string) => {
    this.renderKeys.set(key, renderKey);
  };

  /** Resolves a temporary insert key to the key the server assigned, when it has */
  resolveKey = (key: RowKey): RowKey => this.aliases.get(key) ?? key;

  getListSubset = (plan: ListPlan, definition: QueryDefinition): ListSubset => {
    const existing = this.listSubsets.get(plan.subsetId);
    if (existing) {
      return existing;
    }
    const loader = this.config.loaders[plan.loaderIndex];
    const subset = new ListSubset(this, {
      loader,
      plan,
      definition: { orderBy: definition.orderBy, limit: definition.limit },
    });
    this.listSubsets.set(plan.subsetId, subset);
    return subset;
  };

  getKeySubset = (key: RowKey, loaderIndex: number): KeySubset => {
    const existing = this.keySubsets.get(key);
    if (existing) {
      return existing;
    }
    const subset = new KeySubset(this, this.config.loaders[loaderIndex], key);
    this.keySubsets.set(key, subset);
    return subset;
  };

  /**
   * Finds a fresh subset whose rows contain every row a query can return, so the query is answered locally. The
   * subset must not be paginated, its sent conditions must all be part of the query's, and its loader's fixed filters
   * must be part of the query loader's.
   */
  findContainingSubset = (plan: ListPlan): ListSubset | undefined => {
    if (plan.paginated || plan.serverOnly) {
      return undefined;
    }
    const queryLoader = this.config.loaders[plan.loaderIndex];
    const sent = new Set(plan.sent.map((node) => stableStringify(node)));
    return [...this.listSubsets.values()].find((subset) => {
      // A subset of a server-only operator holds what the server matched, which says nothing about other queries
      if (subset.plan.paginated || subset.plan.serverOnly || !subset.isFresh()) {
        return false;
      }
      const fixed = subset.listLoader.fixed ?? {};
      const fixedContained = Object.keys(fixed).every(
        (field) => stableStringify(queryLoader.fixed?.[field]) === stableStringify(fixed[field]),
      );
      return fixedContained && subset.plan.sent.every((node) => sent.has(stableStringify(node)));
    });
  };

  removeSubset = (subset: BaseSubset) => {
    if (subset instanceof ListSubset) {
      this.listSubsets.delete(subset.id);
    } else {
      this.keySubsets.delete((subset as KeySubset).key);
    }
    this.sweep();
  };

  /** Every subset, list and key */
  getSubsets = (): BaseSubset[] => [...this.listSubsets.values(), ...this.keySubsets.values()];

  /** Whether a subset other than `except`, or a pending write, holds the row */
  isHeldByOthers = (key: RowKey, except?: BaseSubset) => {
    return this.store.hasLayer(key) || this.getSubsets().some((subset) => subset !== except && subset.holds(key));
  };

  /** The subsets whose rows include the key, which a refetch after a write reloads */
  getSubsetsHolding = (key: RowKey) => this.getSubsets().filter((subset) => subset.holds(key));

  /** Removes rows that no subset and no pending write holds */
  sweep = () => {
    this.db.batch(() => {
      this.store.getServerKeys().forEach((key) => {
        if (!this.isHeldByOthers(key)) {
          this.store.drop(key);
        }
      });
    });
  };

  /** Tells the queries of a subset that its rows or status changed */
  markSubsetChanged = (subset: BaseSubset) => {
    subset.notify();
  };

  /** Orders keys by the query's orders, then by the order the loader returned, then by arrival and key */
  createComparator = (
    orderBy: readonly { field: string; direction: SortDirection }[],
    source: ListSubset | undefined,
  ) => {
    return (left: RowKey, right: RowKey): number => {
      const leftRow = this.store.get(left);
      const rightRow = this.store.get(right);
      for (const { field, direction } of orderBy) {
        const result = compareValues(leftRow?.[field], rightRow?.[field]);
        if (result !== 0) {
          return direction === "desc" ? -result : result;
        }
      }
      if (orderBy.length === 0) {
        const leftIndex = source?.orderIndex.get(left) ?? Number.MAX_SAFE_INTEGER;
        const rightIndex = source?.orderIndex.get(right) ?? Number.MAX_SAFE_INTEGER;
        if (leftIndex !== rightIndex) {
          return leftIndex - rightIndex;
        }
        // Every row the db holds has a distinct arrival, so this settles the order
        return this.store.getArrival(left) - this.store.getArrival(right);
      }
      return compareValues(left, right);
    };
  };

  /** Reads the items of a response: the `rows` mapping, or the response itself */
  readItems = (source: Pick<LoaderConfig, "rows">, data: unknown): unknown[] => {
    if (source.rows) {
      return [...source.rows(data)];
    }
    return Array.isArray(data) ? data : [data];
  };

  /** Validates rows when the collection validates server data */
  prepareServerRows = (items: unknown[]): Row[] | Promise<Row[]> => {
    const mapped = items as Row[];
    const { schema } = this.config;
    if (!schema || this.config.validate !== "all") {
      return mapped;
    }
    const results = mapped.map((row) => schema["~standard"].validate(row));
    const collect = (settled: Awaited<(typeof results)[number]>[]) => {
      const rows: Row[] = [];
      settled.forEach((result) => {
        if (result.issues) {
          this.db.emitError({ type: "validation", error: result.issues, collection: this.name });
        } else {
          rows.push(result.value as Row);
        }
      });
      return rows;
    };
    if (results.some((result) => result instanceof Promise)) {
      return Promise.all(results).then(collect);
    }
    return collect(results as Awaited<(typeof results)[number]>[]);
  };

  /** Writes server rows and returns their keys in order */
  writeServerRows = (rows: Row[], complete: boolean, stamp: Stamp): RowKey[] => {
    return rows.map((row) => {
      const key = row[this.config.key] as RowKey;
      this.store.write(key, row, { complete, stamp });
      if (complete) {
        this.normalize(row, stamp);
      }
      return key;
    });
  };

  /** Writes the rows nested in a complete row into the collections that hold them */
  normalize = (row: Row, stamp: Stamp) => {
    (this.config.normalize ?? []).forEach(({ target, extract }) => {
      const collection = this.db.getCollectionByConfig(target)!;
      const rows = collection.prepareServerRows([...extract(row)]);
      const write = (nested: Row[]) => {
        this.db.batch(() => {
          collection.writeServerRows(nested, true, stamp).forEach((key) => collection.noteInsert(key));
        });
      };
      if (rows instanceof Promise) {
        rows.then(write);
      } else {
        write(rows);
      }
    });
  };

  /** Rows of this collection were written: key subsets move to the sync subscriptions their rows' values pick */
  refreshKeySyncs = (keys: Iterable<RowKey>) => {
    [...keys].forEach((key) => this.keySubsets.get(key)?.refreshSyncs());
  };

  /** Tells paginated subsets about an inserted row, so it can join their loaded range */
  noteInsert = (key: RowKey) => {
    this.listSubsets.forEach((subset) => {
      subset.noteInsert(key);
    });
  };

  /** Starts or joins the sync subscriptions that cover a subset */
  subscribeSyncs = (subset: BaseSubset): SyncSubscription[] => {
    const eqValues = subset.getEqValues();
    const subscriptions: SyncSubscription[] = [];
    this.config.syncs.forEach((sync, index) => {
      const target = this.getSyncTarget({ sync, index, subset, eqValues });
      if (!target) {
        return;
      }
      const { id, patches } = target;
      let subscription = this.subscriptions.get(id);
      if (!subscription) {
        const listener = applyListenerPatches(sync.listener, patches);
        subscription = new SyncSubscription({
          id,
          sync,
          listener,
          host: {
            tick: this.db.tick,
            applySyncMessage: this.applySyncMessage,
            onLiveChange: () => this.getSubsets().forEach((item) => item.notify()),
            onRemove: (removed) => this.subscriptions.delete(removed.id),
          },
        });
        this.subscriptions.set(id, subscription);
        this.db.watchSocket(listener.socket);
      }
      subscription.addUser(subset);
      subscriptions.push(subscription);
    });
    return subscriptions;
  };

  /**
   * Which subscription of a sync covers a subset, and the listener params it needs.
   *
   * - A sync with `byKey` covers a row read by key with a listener of its own, and with a notation it also covers every
   *   list subset with its sent conditions. Without `byKey`, a sync with a notation covers list subsets only, because
   *   a listener on the whole collection for one row is wasteful and, on Firestore, billed.
   * - A sync with `where` covers subsets whose values fill every field it declares: the sent `eq` conditions of a list,
   *   or the fields of the row a key subset holds, so a post read by key joins its team's subscription.
   */
  private getSyncTarget = ({
    sync,
    index,
    subset,
    eqValues,
  }: {
    sync: SyncConfig;
    index: number;
    subset: BaseSubset;
    eqValues: Record<string, unknown>;
  }): { id: string; patches: ListenerPatch[] } | undefined => {
    if (subset instanceof KeySubset && sync.byKey) {
      return { id: stableStringify([index, "key", subset.key]), patches: [sync.byKey(subset.key)] };
    }
    if (sync.notation) {
      if (subset instanceof KeySubset) {
        return undefined;
      }
      // A server-only operator has no notation, and a loader that sends one needs no listener notation either
      const conditions = (subset as ListSubset).plan.sent.filter(
        (node): node is ComparisonNode => node.op !== "server",
      );
      return { id: stableStringify([index, conditions]), patches: [sync.notation(conditions)] };
    }
    if (sync.byKey && subset instanceof ListSubset) {
      return undefined;
    }
    const fields = Object.keys(sync.where ?? {});
    if (!fields.every((field) => field in eqValues)) {
      return undefined;
    }
    const values = Object.fromEntries(fields.map((field) => [field, eqValues[field]]));
    return {
      id: stableStringify([index, values]),
      patches: fields.map((field) => sync.where![field].eq(values[field])),
    };
  };

  /** Applies a `changes` event: complete rows to write and keys to delete */
  private applyChanges = (sync: SyncConfig, message: unknown, stamp: Stamp) => {
    const { upsert, delete: deleted, refetch = [] } = sync.changes!(message);
    refetch.forEach((key) => this.fetchByKey(key));
    const apply = (rows: Row[]) => {
      this.db.batch(() => {
        rows.forEach((row) => {
          const key = row[this.config.key] as RowKey;
          this.writeServerRows([row], true, stamp);
          this.noteInsert(key);
          this.db.notifySyncWrite(this.name, key);
        });
        deleted.forEach((key) => {
          this.store.remove(key, stamp);
          this.db.notifySyncWrite(this.name, key);
        });
      });
    };
    const rows = this.prepareServerRows([...upsert]);
    if (rows instanceof Promise) {
      rows.then(apply);
    } else {
      apply(rows);
    }
  };

  /** Applies one sync event */
  /** Applies a sync event. A mapping that throws on one event is reported, and the next events still apply. */
  applySyncMessage = (sync: SyncConfig, message: unknown, stamp: Stamp) => {
    try {
      this.applySyncEvent(sync, message, stamp);
    } catch (error) {
      this.db.emitError({ type: "sync", error, collection: this.name });
    }
  };

  private applySyncEvent = (sync: SyncConfig, message: unknown, stamp: Stamp) => {
    const keyField = this.config.key;
    if (sync.type === "changes") {
      this.applyChanges(sync, message, stamp);
      return;
    }
    if (sync.type === "delete") {
      const key = sync.key ? sync.key(message) : ((message as Row)[keyField] as RowKey);
      this.db.batch(() => {
        this.store.remove(key, stamp);
        this.db.notifySyncWrite(this.name, key);
      });
      return;
    }
    const apply = (rows: Row[]) => {
      this.db.batch(() => {
        rows.forEach((row) => {
          const key = row[keyField] as RowKey;
          if (sync.type === "insert") {
            this.writeServerRows([row], true, stamp);
            this.noteInsert(key);
          } else if (this.store.hasServerRow(key)) {
            this.store.write(key, row, { complete: false, stamp });
            this.listSubsets.forEach((subset) => subset.excluded.delete(key));
          } else if (sync.incomplete === "refetch") {
            this.fetchByKey(key);
          }
          this.db.notifySyncWrite(this.name, key);
        });
      });
    };
    const rows = this.prepareServerRows([sync.row ? sync.row(message) : message]);
    if (rows instanceof Promise) {
      rows.then(apply);
    } else {
      apply(rows);
    }
  };

  /** Loads one row by key without a query, for example for an incomplete sync event */
  fetchByKey = (key: RowKey) => {
    const loaderIndex = this.config.loaders.findIndex((loader) => loader.kind !== "list");
    if (loaderIndex === -1) {
      return Promise.resolve();
    }
    const subset = this.getKeySubset(key, loaderIndex);
    const observer = { onSubsetChange: () => {} };
    subset.attach(observer);
    return subset.load().then(() => subset.detach(observer));
  };

  /** Loads a key subset's row, batched with the other keys requested in the same tick */
  loadKey = (subset: KeySubset, waitForWrites = true): Promise<void> => {
    return new Promise((resolve) => {
      this.keyRequests.push({ subset, resolve, waitForWrites });
      if (this.keyRequests.length === 1) {
        queueMicrotask(() => this.flushKeyRequests());
      }
    });
  };

  /** Resolves once no write of this collection is in flight */
  mutationsSettled = () => this.db.mutations.settled(this.name);

  /** Removes every row and resets the loaded subsets, for example on sign-out */
  clear = () => {
    this.store.clear();
    this.listSubsets.forEach((subset) => {
      subset.owned.clear();
      subset.inserted.clear();
      subset.excluded.clear();
      subset.orderIndex.clear();
      subset.pages = 0;
      subset.hasLoaded = false;
      subset.loadedAt = 0;
    });
    this.keySubsets.forEach((subset) => {
      subset.hasLoaded = false;
      subset.loadedAt = 0;
    });
    this.getSubsets().forEach((subset) => subset.notify());
  };

  destroy = () => {
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups = [];
    this.getSubsets().forEach((subset) => subset.cancelGc());
    this.subscriptions.forEach((subscription) => {
      subscription.getUsers().forEach((user) => subscription.removeUser(user));
    });
  };

  private flushKeyRequests = async () => {
    const requests = this.keyRequests;
    this.keyRequests = [];
    await this.db.ready;
    if (requests.some((request) => request.waitForWrites)) {
      await this.mutationsSettled();
    }
    const groups = new Map<LoaderConfig, KeyRequest[]>();
    requests.forEach((request) => {
      const { loader } = request.subset;
      groups.set(loader, [...(groups.get(loader) ?? []), request]);
    });
    await Promise.all(
      [...groups.entries()].map(([loader, group]) => {
        if (loader.kind === "byKeys") {
          return this.sendKeyRequest(loader, group, loader.byKeys!(group.map(({ subset }) => subset.key)));
        }
        return Promise.all(
          group.map((request) => this.sendKeyRequest(loader, [request], loader.byKey!(request.subset.key))),
        );
      }),
    );
  };

  private sendKeyRequest = async (
    loader: LoaderConfig,
    group: KeyRequest[],
    patch: ReturnType<NonNullable<LoaderConfig["byKey"]>>,
  ) => {
    const seq = this.db.tick();
    const wall = Date.now();
    const { generation } = this.db;
    this.db.trackRequest(seq);
    try {
      const request: RequestInstance = applyRequestPatches(loader.request.setCache(false), [patch]);
      const response = await request.send();
      const items = response.success ? this.readItems(loader, response.data) : [];
      const rows = await this.prepareServerRows(items);
      if (this.db.generation !== generation) {
        group.forEach(({ subset }) => subset.complete({ success: false, error: new Error("Cleared") }));
        return;
      }
      // A row the response returned but the schema rejected exists on the server, so it is not removed as missing
      const returnedKeys = new Set(items.filter(isPlainObject).map((item) => item[this.config.key] as RowKey));
      this.db.batch(() => {
        if (response.success) {
          const keys = new Set(this.writeServerRows(rows, true, { kind: "sent", seq, wall }));
          const stamp = { kind: "sent" as const, seq, wall };
          group.forEach(({ subset }) => {
            subset.complete({ success: true, found: keys.has(subset.key) || returnedKeys.has(subset.key), stamp });
          });
        } else {
          group.forEach(({ subset }) => subset.complete({ success: false, error: response.error ?? response }));
        }
      });
    } catch (error) {
      this.db.emitError({ type: "load", error, collection: this.name });
      this.db.batch(() => group.forEach(({ subset }) => subset.complete({ success: false, error })));
    } finally {
      this.db.settleRequest(seq);
      group.forEach(({ resolve }) => resolve());
    }
  };

  private listenToIngest = (ingest: IngestConfig) => {
    const { request: ingested } = ingest;
    const { events } = ingested.client.requestManager;
    const matches = (request: RequestInstance) =>
      request.requestOptions.endpoint === ingested.requestOptions.endpoint && request.method === ingested.method;
    // A response is ordered by when its request was sent, so it never beats a write made after it went out
    const sentAt = new Map<string, number>();
    const generations = new Map<string, number>();
    const unsubscribeStart = events.onRequestStart(({ request, requestId }) => {
      if (matches(request)) {
        const seq = this.db.tick();
        sentAt.set(requestId, seq);
        generations.set(requestId, this.db.generation);
        this.db.trackRequest(seq);
      }
    });
    const unsubscribe = events.onResponse(({ request, requestId, response }) => {
      if (!matches(request)) {
        return;
      }
      const seq = sentAt.get(requestId);
      const generation = generations.get(requestId) ?? this.db.generation;
      sentAt.delete(requestId);
      generations.delete(requestId);
      if (seq !== undefined) {
        this.db.settleRequest(seq);
      }
      // A response to a request sent before `clear` belongs to the previous user
      if (!response.success || generation !== this.db.generation) {
        return;
      }
      const items = this.readItems(ingest, response.data).filter(isPlainObject);
      const write = (rows: Row[]) => {
        // A request that started before the db existed counts from now
        const stamp: Stamp = { kind: "sent", seq: seq ?? this.db.tick(), wall: response.requestTimestamp };
        this.db.batch(() => {
          const keys = this.writeServerRows(rows, ingest.type === "insert", stamp);
          if (ingest.type === "insert") {
            keys.forEach((key) => this.noteInsert(key));
          }
        });
      };
      const rows = this.prepareServerRows(items);
      if (rows instanceof Promise) {
        rows.then(write);
      } else {
        write(rows);
      }
    });
    this.cleanups.push(unsubscribe, unsubscribeStart);
  };
}
