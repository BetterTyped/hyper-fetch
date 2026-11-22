import type { ClientInstance } from "@hyper-fetch/core";
import type { SocketInstance } from "@hyper-fetch/sockets";

import type { CollectionInstance } from "../collection/collection";
import type { CollectionConfig, RowKey } from "../collection/collection.types";
import { MutationEngine } from "../mutation/mutation";
import { stableStringify } from "../operators/operators.utils";
import { Persistence } from "../persistence/persistence";
import type { Serializer } from "../persistence/serializer";
import { createSerializer } from "../persistence/serializer";
import type { CollectionSnapshot } from "../persistence/snapshot";
import { restoreSnapshot, snapshotCollection } from "../persistence/snapshot";
import type { TabsMessage } from "../persistence/tabs";
import { Tabs } from "../persistence/tabs";
import { LiveQuery } from "../query/live-query";
import type { QueryDefinition } from "../query/query.types";
import type { KeySubset } from "../subset/key-subset";
import { ListSubset } from "../subset/list-subset";
import { CollectionRuntime } from "./collection.runtime";
import type {
  DbErrorEvent,
  DbInspection,
  DbNotation,
  DbOptions,
  DehydratedDb,
  TransactionConfig,
  TransactionRecord,
} from "./db.types";

const DEFAULT_GC_TIME = 5 * 60 * 1000;
const DEFAULT_SYNC_TIMEOUT = 5000;

/**
 * The running db. It owns the collections, batches writes into transactions so every query updates once, revalidates
 * stale subsets on focus and reconnect, and connects persistence, the outbox and other tabs.
 */
export class DbRuntime {
  readonly collections = new Map<string, CollectionRuntime>();
  readonly gcTime: number;
  readonly syncTimeout: number;
  readonly notation: DbNotation;
  readonly mutations: MutationEngine;
  readonly persistence: Persistence | undefined;
  private readonly serializer: Serializer;
  private changeListeners = new Set<() => void>();
  /** Timers of sync waits, cleared on `destroy` */
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private queryTimers = new Map<LiveQuery, ReturnType<typeof setTimeout>>();
  readonly tabs: Tabs | undefined;
  readonly ready: Promise<void>;
  /** Changes on `clear`, so responses to requests sent before are never written */
  generation = 0;
  isReady = true;
  isDestroyed = false;
  private seq = 0;
  private batchDepth = 0;
  private changedRows = new Map<CollectionRuntime, Set<RowKey>>();
  private dirtyQueries = new Set<LiveQuery>();
  private liveQueries = new Map<string, LiveQuery>();
  private inflight = new Set<number>();
  private errorListeners = new Set<(event: DbErrorEvent) => void>();
  private syncWaiters = new Map<string, Set<() => void>>();
  private lastSyncWrite = new Map<string, number>();
  private sockets = new Set<SocketInstance>();
  private cleanups: (() => void)[] = [];

  constructor(
    collections: Record<string, CollectionInstance>,
    options: DbOptions & {
      links?: readonly (readonly [string, string])[];
      transactions?: Record<string, TransactionConfig>;
    } = {},
  ) {
    this.gcTime = options.gcTime ?? DEFAULT_GC_TIME;
    this.syncTimeout = options.syncTimeout ?? DEFAULT_SYNC_TIMEOUT;
    this.notation = { where: options.where, orderBy: options.orderBy };
    this.mutations = new MutationEngine(this, options.offline, options.transactions);
    this.serializer = createSerializer(options.codecs);

    Object.entries(collections).forEach(([name, definition]) => {
      this.collections.set(name, new CollectionRuntime(this, name, definition.config));
    });
    // A reference to a collection the db does not hold is a setup mistake, so it fails here and not during a write
    this.collections.forEach((collection) => {
      (collection.config.normalize ?? []).forEach(({ target }) => {
        if (!this.getCollectionByConfig(target)) {
          throw new Error(`"${collection.name}" normalizes into a collection that was not passed to createDb`);
        }
      });
    });
    (options.links ?? []).forEach(([first, second]) => {
      const left = this.collections.get(first)!.store;
      const right = this.collections.get(second)!.store;
      left.link(right);
      right.link(left);
    });
    this.collections.forEach((collection) => {
      collection.config.loaders.forEach((loader) => this.watchClient(loader.request.client));
      Object.values(collection.config.mutations).forEach((mutation) => this.watchClient(mutation!.request.client));
    });

    if (options.state) {
      this.hydrate(options.state);
    }

    if (options.persistence) {
      const scope = options.persistence.scope ?? "default";
      this.persistence = new Persistence(this, options.persistence, this.serializer);
      if (options.tabs !== false) {
        this.tabs = new Tabs(`hf-db:${scope}`, options.tabs, {
          onLeader: this.takeLead,
          onMessage: this.onTabsMessage,
        });
      }
      this.isReady = false;
      this.ready = this.restore();
      this.tabs?.start();
    } else {
      this.ready = Promise.resolve();
    }
  }

  /** Listens to every change the db makes, once per batch of writes, load or outbox change. Returns the unsubscribe. */
  onChange = (listener: () => void) => {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  };

  notifyChange = () => {
    this.changeListeners.forEach((listener) => listener());
  };

  /** What the db holds right now: collections with their layers and subsets, live queries and the outbox */
  inspect = (): DbInspection => ({
    collections: [...this.collections.values()].map((collection) => ({
      name: collection.name,
      rows: collection.store.keys().length,
      layers: collection.store.getLayers().map(({ id, key, type }) => ({ id, key, type })),
      subsets: collection.getSubsets().map((subset) => ({
        id: subset instanceof ListSubset ? subset.id : String((subset as KeySubset).key),
        kind: subset instanceof ListSubset ? ("list" as const) : ("key" as const),
        loader: collection.config.loaders.indexOf(subset.loader),
        rows:
          subset instanceof ListSubset
            ? subset.owned.size
            : Number(Boolean(collection.store.get((subset as KeySubset).key))),
        fresh: subset.isFresh(),
        live: subset.isLive(),
        loading: subset.isLoading,
        error: subset.error,
        loadedAt: subset.loadedAt,
        observers: subset.observerCount,
      })),
    })),
    queries: [...this.liveQueries.values()].map((query) => {
      const state = query.getState();
      return {
        key: query.key,
        collection: query.collection.name,
        subscribers: query.subscriberCount,
        status: state.status,
        rows: Array.isArray(state.data) ? state.data.length : undefined,
        plan: query.explain(),
      };
    }),
    outbox: [...this.mutations.outbox],
  });

  /** The server rows and loaded subsets of every collection that holds any, as type-tagged JSON */
  dehydrate = (): DehydratedDb => {
    const collections = Object.fromEntries(
      [...this.collections.values()]
        .map((collection) => [collection.name, snapshotCollection(collection)] as const)
        .filter(([, snapshot]) => snapshot.rows.length > 0 || snapshot.subsets.length > 0),
    );
    return { __dehydrated: true, collections: this.serializer.encode(collections) };
  };

  /** Writes a server's rows and subsets, before anything renders, so the first render matches the server's */
  private hydrate = (state: DehydratedDb) => {
    const collections = this.serializer.decode(state.collections) as Record<string, CollectionSnapshot>;
    Object.entries(collections).forEach(([name, snapshot]) => {
      const collection = this.collections.get(name);
      if (collection) {
        restoreSnapshot(collection, snapshot);
      }
    });
  };

  /** Whether this tab replays the outbox and writes persisted rows */
  get isLeader() {
    return this.tabs ? this.tabs.isLeader : true;
  }

  /** The collection a config belongs to, for references between collections such as `normalize` */
  getCollectionByConfig = (config: CollectionConfig): CollectionRuntime | undefined => {
    return [...this.collections.values()].find((item) => item.config === config);
  };

  tick = () => {
    this.seq += 1;
    return this.seq;
  };

  /** Runs writes as one transaction: every query updates once, after the last write */
  batch = <T>(callback: () => T): T => {
    this.batchDepth += 1;
    try {
      return callback();
    } finally {
      this.batchDepth -= 1;
      if (this.batchDepth === 0) {
        this.flush();
      }
    }
  };

  /** Records a changed row. Every store write runs inside `batch`, which flushes the changes once it ends. */
  markRowChanged = (collection: CollectionRuntime, key: RowKey) => {
    const keys = this.changedRows.get(collection) ?? new Set<RowKey>();
    keys.add(key);
    this.changedRows.set(collection, keys);
  };

  markQueryDirty = (query: LiveQuery) => {
    this.dirtyQueries.add(query);
    if (this.batchDepth === 0) {
      this.flush();
    }
  };

  /** The live query for a definition, shared by every query with the same structure */
  getLiveQuery = (definition: QueryDefinition): LiveQuery => {
    const key = stableStringify(definition);
    const existing = this.liveQueries.get(key);
    if (existing) {
      return existing;
    }
    const collection = this.collections.get(definition.collection)!;
    const query = new LiveQuery(collection, definition, key);
    this.liveQueries.set(key, query);
    this.releaseLater(query);
    return query;
  };

  /**
   * Forgets a live query nobody subscribes to after `gcTime`, so queries made once, such as each search, do not pile
   * up and slow every write. A query read again later is made again.
   */
  releaseLater = (query: LiveQuery) => {
    clearTimeout(this.queryTimers.get(query));
    const timer = setTimeout(() => {
      this.queryTimers.delete(query);
      if (!query.isActive() && this.liveQueries.get(query.key) === query) {
        this.liveQueries.delete(query.key);
      }
    }, this.gcTime);
    this.queryTimers.set(query, timer);
  };

  trackRequest = (seq: number) => {
    this.inflight.add(seq);
  };

  /** A request the db sent settled, so deletes made after every pending request no longer need remembering */
  settleRequest = (seq: number) => {
    this.inflight.delete(seq);
    const oldest = this.inflight.size > 0 ? Math.min(...this.inflight) : Number.POSITIVE_INFINITY;
    this.collections.forEach((collection) => collection.store.forgetTombstones(oldest));
  };

  onError = (listener: (event: DbErrorEvent) => void) => {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  };

  emitError = (event: DbErrorEvent) => {
    this.errorListeners.forEach((listener) => listener(event));
  };

  /** A sync event touched a row, which writes with `onSuccess: "sync"` wait for */
  notifySyncWrite = (collection: string, key: RowKey) => {
    const id = `${collection}:${String(key)}`;
    this.lastSyncWrite.set(id, this.tick());
    const waiters = this.syncWaiters.get(id);
    this.syncWaiters.delete(id);
    waiters?.forEach((resolve) => resolve());
  };

  /**
   * Resolves with `true` when a sync event touched the row after `since`, also while the write was in flight, or with
   * `false` after the timeout
   */
  waitForSync = ({
    collection,
    key,
    since,
    timeout,
  }: {
    collection: string;
    key: RowKey;
    since: number;
    timeout: number;
  }): Promise<boolean> => {
    const id = `${collection}:${String(key)}`;
    if ((this.lastSyncWrite.get(id) ?? 0) > since) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      const waiters = this.syncWaiters.get(id) ?? new Set<() => void>();
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        waiters.delete(onSync);
        resolve(false);
      }, timeout);
      this.timers.add(timer);
      const onSync = () => {
        clearTimeout(timer);
        this.timers.delete(timer);
        resolve(true);
      };
      waiters.add(onSync);
      this.syncWaiters.set(id, waiters);
    });
  };

  /** Marks the subsets a socket's syncs covered stale after a reconnect, unless their subscriptions resume */
  watchSocket = (socket: SocketInstance) => {
    if (this.sockets.has(socket)) {
      return;
    }
    this.sockets.add(socket);
    // A connection after an earlier one is a reconnect, whether or not the disconnect was reported
    let connectedBefore = socket.adapter.connected;
    const notifyAll = () => {
      this.collections.forEach((collection) => collection.getSubsets().forEach((subset) => subset.notify()));
    };
    this.cleanups.push(
      socket.events.onDisconnected(notifyAll),
      socket.events.onConnected(() => {
        if (connectedBefore) {
          this.collections.forEach((collection) => {
            collection.subscriptions.forEach((subscription) => {
              if (subscription.listener.socket !== socket || subscription.sync.resumes) {
                return;
              }
              subscription.getUsers().forEach((user) => {
                const subset = user as ReturnType<CollectionRuntime["getSubsets"]>[number];
                subset.invalidate();
                if (subset.isUsed()) {
                  subset.revalidate();
                }
              });
            });
          });
        }
        connectedBefore = true;
        notifyAll();
      }),
    );
  };

  /** Removes every row, loaded subset and pending write, and the persisted data of the scope */
  clear = async () => {
    this.tabs?.post({ type: "clear" });
    this.clearLocal();
    await this.persistence?.clear();
    this.revalidateActive();
  };

  /** Refetches the stale subsets of every mounted query */
  private revalidateActive = () => {
    this.liveQueries.forEach((query) => {
      if (query.isActive()) {
        query.revalidate();
      }
    });
  };

  /**
   * Drops rows, subsets and pending writes in this tab. Responses to requests sent before belong to the previous user,
   * so the generation changes and they are never written.
   */
  private clearLocal = () => {
    this.generation += 1;
    this.mutations.clear();
    this.batch(() => this.collections.forEach((collection) => collection.clear()));
  };

  /** This tab became the leader: it adopts the persisted outbox, so the previous leader's writes are replayed */
  private takeLead = async () => {
    // Tabs coordinate only a db that persists, so there is always a stored outbox to adopt
    const stored = await this.persistence!.loadOutbox();
    this.mutations.mergeOutbox(stored);
    this.tabs?.post({ type: "leader" });
  };

  destroy = () => {
    this.isDestroyed = true;
    this.mutations.destroy();
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.queryTimers.forEach((timer) => clearTimeout(timer));
    this.queryTimers.clear();
    this.liveQueries.clear();
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups = [];
    this.collections.forEach((collection) => collection.destroy());
    this.persistence?.destroy();
    this.tabs?.close();
  };

  private watchClients = new Set<ClientInstance>();

  private watchClient = (client: ClientInstance) => {
    if (this.watchClients.has(client)) {
      return;
    }
    this.watchClients.add(client);
    const revalidate = () => {
      this.liveQueries.forEach((query) => {
        if (query.isActive()) {
          query.revalidate();
        }
      });
    };
    this.cleanups.push(
      client.appManager.events.onFocus(revalidate),
      client.appManager.events.onOnline(() => {
        revalidate();
        this.mutations.pump();
      }),
    );
  };

  private flush = () => {
    const changed = this.changedRows.size > 0 || this.dirtyQueries.size > 0;
    this.flushPending();
    if (changed) {
      this.notifyChange();
    }
  };

  private flushPending = () => {
    while (this.changedRows.size > 0 || this.dirtyQueries.size > 0) {
      const rows = this.changedRows;
      const dirty = this.dirtyQueries;
      this.changedRows = new Map();
      this.dirtyQueries = new Set();
      this.liveQueries.forEach((query) => {
        const keys = rows.get(query.collection);
        if (keys && !dirty.has(query)) {
          query.onRowsChanged(keys);
        }
        if (
          !dirty.has(query) &&
          query.isActive() &&
          [...rows.keys()].some((collection) => query.dependsOn(collection))
        ) {
          query.onJoinedRowsChanged();
        }
      });
      dirty.forEach((query) => query.rebuild());
      rows.forEach((keys, collection) => collection.refreshKeySyncs(keys));
      if (rows.size > 0) {
        this.persistence?.scheduleSave(rows.keys());
        this.forwardRows(rows);
      }
    }
  };

  /** Tabs that do not persist send their server rows to the tab that does */
  private forwardRows = (rows: Map<CollectionRuntime, Set<RowKey>>) => {
    if (!this.tabs || this.isLeader || !this.isReady) {
      return;
    }
    rows.forEach((keys, collection) => {
      const entries = [...keys]
        .map((key) => [key, collection.store.getServerRow(key)] as const)
        .filter((entry): entry is readonly [RowKey, Record<string, unknown>] => Boolean(entry[1]));
      if (entries.length > 0) {
        this.tabs!.post({ type: "rows", collection: collection.name, rows: entries.map(([key, row]) => [key, row]) });
      }
    });
  };

  private onTabsMessage = (message: TabsMessage) => {
    if (message.type === "outcome") {
      this.mutations.applyOutcome(message);
      return;
    }
    if (message.type === "clear") {
      this.clearLocal();
      this.revalidateActive();
      return;
    }
    if (message.type === "leader") {
      this.mutations.resendToLeader();
      return;
    }
    if (!this.isLeader) {
      return;
    }
    if (message.type === "enqueue") {
      this.mutations.mergeOutbox(message.records);
      return;
    }
    const collection = this.collections.get(message.collection);
    if (!collection) {
      return;
    }
    this.batch(() => {
      message.rows.forEach(([key, row]) => {
        if (!collection.store.hasServerRow(key)) {
          collection.store.write(key, row, { complete: true, stamp: { kind: "sent", seq: 0, wall: 0 } });
        }
      });
    });
  };

  private restore = async () => {
    let outbox: TransactionRecord[] = [];
    try {
      outbox = await this.persistence!.restore();
    } catch (error) {
      // A broken store must not keep the db from starting: it starts with what the network brings
      this.emitError({ type: "persistence", error });
    }
    this.isReady = true;
    this.mutations.restore(outbox);
    this.batch(() => this.liveQueries.forEach((query) => this.markQueryDirty(query)));
  };
}
