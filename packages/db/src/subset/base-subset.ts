import type { LoaderConfig, RowKey } from "../collection/collection.types";
import type { CollectionRuntime } from "../db/collection.runtime";
import type { SyncSubscription } from "../sync/sync";

/** A query attached to a subset, told when the subset's status or rows change */
export type SubsetObserver = { onSubsetChange: () => void };

const getStaleTime = (loader: LoaderConfig) => loader.request.staleTime;

/** What every loaded subset shares: who uses it, its load status, freshness and garbage collection */
export type LoadOptions = {
  /**
   * Whether the load waits for the collection's writes in flight, so its response is never older than them. A write's
   * own `onSuccess: "refetch"` does not wait, because the writes queued behind it wait for that refetch.
   */
  waitForWrites?: boolean;
};

export abstract class BaseSubset {
  hasLoaded = false;
  isLoading = false;
  error: unknown = null;
  loadedAt = 0;
  /** Set when events may have been missed, so only a load makes the subset fresh again */
  invalidated = false;
  subscriptions: SyncSubscription[] = [];
  protected observers = new Set<SubsetObserver>();
  protected pending: Promise<void> | undefined;
  private gcTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    readonly collection: CollectionRuntime,
    readonly loader: LoaderConfig,
  ) {}

  /** Whether a query is attached */
  isUsed = () => this.observers.size > 0;

  /** How many queries read the subset */
  get observerCount() {
    return this.observers.size;
  }

  attach = (observer: SubsetObserver) => {
    if (this.gcTimer) {
      clearTimeout(this.gcTimer);
      this.gcTimer = undefined;
    }
    this.observers.add(observer);
    if (this.observers.size === 1 && this.subscriptions.length === 0) {
      this.subscriptions = this.collection.subscribeSyncs(this);
    }
  };

  detach = (observer: SubsetObserver) => {
    this.observers.delete(observer);
    if (this.observers.size > 0) {
      return;
    }
    this.gcTimer = setTimeout(() => this.dispose(), this.collection.db.gcTime);
  };

  /** The values that pick a sync's subscription for the subset, by field */
  abstract getEqValues: () => Record<string, unknown>;

  /**
   * Moves the subset to the sync subscriptions its values pick now, for example when the row a key subset holds moved
   * to another team, and leaves the ones it no longer needs.
   */
  refreshSyncs = () => {
    if (!this.isUsed()) {
      return;
    }
    const next = this.collection.subscribeSyncs(this);
    this.subscriptions.filter((subscription) => !next.includes(subscription)).forEach((item) => item.removeUser(this));
    this.subscriptions = next;
  };

  /** Stops the garbage collection timer, for `destroy` */
  cancelGc = () => {
    clearTimeout(this.gcTimer);
    this.gcTimer = undefined;
  };

  /** Releases the subset: stops its syncs and removes the rows nothing else holds */
  dispose = () => {
    this.gcTimer = undefined;
    this.subscriptions.forEach((subscription) => subscription.removeUser(this));
    this.subscriptions = [];
    this.collection.removeSubset(this);
  };

  /** Whether syncs deliver every insert, update and delete for the subset */
  isLive = (): boolean => {
    const types = new Set(
      this.subscriptions.filter((subscription) => subscription.isLive()).map((item) => item.sync.type),
    );
    return types.has("changes") || (types.has("insert") && types.has("update") && types.has("delete"));
  };

  isFresh = (): boolean => {
    if (!this.hasLoaded || this.invalidated) {
      return false;
    }
    if (this.isLive()) {
      return true;
    }
    // A sync that is down may be missing events right now, however recent the load
    if (this.subscriptions.some((subscription) => !subscription.isLive())) {
      return false;
    }
    return this.loadedAt > 0 && Date.now() - this.loadedAt < getStaleTime(this.loader);
  };

  /** Marks the subset stale, for example after a reconnect that may have missed events */
  invalidate = () => {
    this.invalidated = true;
    this.notify();
  };

  notify = () => {
    this.observers.forEach((observer) => observer.onSubsetChange());
  };

  /** Whether the load in flight loads the whole subset, rather than its next page */
  protected pendingIsFull = true;

  /** Loads the subset unless a load of the whole subset is in flight. One asked during a next page runs after it. */
  load = (options: LoadOptions = {}): Promise<void> => {
    if (this.pending && !this.pendingIsFull) {
      return this.pending.then(() => this.load(options));
    }
    if (!this.pending) {
      this.pendingIsFull = true;
      const pending: Promise<void> = this.run(options).finally(() => {
        // A next page may have started meanwhile, and it is the load in flight now
        if (this.pending === pending) {
          this.pending = undefined;
        }
      });
      this.pending = pending;
    }
    return this.pending;
  };

  /** Loads again after the load in flight, so the result is newer than anything sent before */
  reload = async (options: LoadOptions = {}): Promise<void> => {
    await this.pending;
    return this.load(options);
  };

  /** Refetches when the subset is stale and no load is in flight */
  revalidate = () => {
    if (!this.isLoading && !this.isFresh()) {
      this.load();
    }
  };

  abstract holds: (key: RowKey) => boolean;

  protected abstract run: (options: LoadOptions) => Promise<void>;

  protected beginLoad = () => {
    this.isLoading = true;
    this.subscriptions.forEach((subscription) => subscription.beginLoad(this));
    this.notify();
  };

  protected endLoad = () => {
    this.isLoading = false;
    this.subscriptions.forEach((subscription) => subscription.endLoad(this));
  };
}
