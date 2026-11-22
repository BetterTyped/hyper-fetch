import type { CollectionRuntime } from "../db/collection.runtime";
import type { DbRuntime } from "../db/db.runtime";
import type { DbPersistenceOptions, DbStorage, TransactionRecord } from "../db/db.types";
import type { Serializer } from "./serializer";
import type { CollectionSnapshot } from "./snapshot";
import { restoreSnapshot, snapshotCollection } from "./snapshot";

/** The outbox's own format version. It changes only when the stored shape of a transaction changes. */
export const OUTBOX_FORMAT = 1;

type PersistedCollection = CollectionSnapshot & { version: string | number };

type PersistedOutbox = { format: number; entries: TransactionRecord[] };

/**
 * Persists server rows, loaded subsets and the outbox under a scope, such as the user id. Rows of another db version
 * are cleared, because the server holds a copy. The outbox is never cleared with them.
 */
export class Persistence {
  readonly networkTimeout: number;
  private readonly storage: DbStorage;
  private readonly prefix: string;
  private readonly version: string | number;
  private readonly serializer: Serializer;
  /** Set when the stored outbox cannot be read, so it is never written over */
  private outboxLocked = false;
  private scheduled = new Set<CollectionRuntime>();
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly db: DbRuntime,
    options: DbPersistenceOptions,
    serializer: Serializer,
  ) {
    this.storage = options.storage;
    this.prefix = `hf-db:${options.scope ?? "default"}`;
    this.version = options.version ?? 1;
    this.networkTimeout = options.networkTimeout ?? 5000;
    this.serializer = serializer;
  }

  /** Restores every collection and returns the persisted outbox */
  restore = async (): Promise<TransactionRecord[]> => {
    await Promise.all([...this.db.collections.values()].map((collection) => this.restoreCollection(collection)));
    return this.loadOutbox();
  };

  /**
   * Reads the outbox. An outbox this version cannot read, corrupt or of another format, is reported and never written
   * over, because it may hold the only copy of writes another version of the app can replay.
   */
  loadOutbox = async (): Promise<TransactionRecord[]> => {
    const key = `${this.prefix}:outbox`;
    let raw: string | null;
    try {
      raw = await this.storage.getItem(key);
    } catch (error) {
      this.db.emitError({ type: "persistence", error });
      return [];
    }
    if (!raw) {
      return [];
    }
    let stored: PersistedOutbox;
    try {
      stored = this.serializer.parse(raw) as PersistedOutbox;
    } catch (error) {
      this.outboxLocked = true;
      this.db.emitError({ type: "persistence", error });
      return [];
    }
    if (stored.format !== OUTBOX_FORMAT) {
      this.outboxLocked = true;
      this.db.emitError({
        type: "outbox",
        error: new Error(`The persisted outbox has format ${stored.format}, which this version cannot replay`),
      });
      return [];
    }
    return stored.entries;
  };

  saveOutbox = (entries: TransactionRecord[]) => {
    if (this.outboxLocked) {
      return Promise.resolve();
    }
    const value: PersistedOutbox = { format: OUTBOX_FORMAT, entries };
    return this.write(`${this.prefix}:outbox`, value);
  };

  /** Saves the collections whose rows changed, once the current tick is over */
  scheduleSave = (collections: Iterable<CollectionRuntime>) => {
    if (!this.db.isLeader || !this.db.isReady) {
      return;
    }
    [...collections].forEach((collection) => this.scheduled.add(collection));
    if (this.timer || this.scheduled.size === 0) {
      return;
    }
    this.timer = setTimeout(() => {
      this.timer = undefined;
      const due = [...this.scheduled];
      this.scheduled.clear();
      due.forEach((collection) => this.saveCollection(collection));
    }, 0);
  };

  saveCollection = (collection: CollectionRuntime) => {
    const value: PersistedCollection = { version: this.version, ...snapshotCollection(collection) };
    return this.write(`${this.prefix}:rows:${collection.name}`, value);
  };

  /** Removes everything this scope persisted */
  clear = async () => {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.scheduled.clear();
    await Promise.all([
      this.remove(`${this.prefix}:outbox`),
      ...[...this.db.collections.keys()].map((name) => this.remove(`${this.prefix}:rows:${name}`)),
    ]);
  };

  destroy = () => {
    clearTimeout(this.timer);
    this.timer = undefined;
  };

  private restoreCollection = async (collection: CollectionRuntime) => {
    const key = `${this.prefix}:rows:${collection.name}`;
    const stored = await this.read<PersistedCollection>(key);
    if (!stored) {
      return;
    }
    if (stored.version !== this.version) {
      await this.remove(key);
      return;
    }
    // Restored load times are not trusted, because the app may have been closed for a long time
    restoreSnapshot(collection, { ...stored, subsets: stored.subsets.map((subset) => ({ ...subset, loadedAt: 0 })) });
  };

  private read = async <T>(key: string): Promise<T | undefined> => {
    try {
      const raw = await this.storage.getItem(key);
      return raw ? (this.serializer.parse(raw) as T) : undefined;
    } catch (error) {
      this.db.emitError({ type: "persistence", error });
      return undefined;
    }
  };

  private write = async (key: string, value: unknown) => {
    try {
      await this.storage.setItem(key, this.serializer.stringify(value));
    } catch (error) {
      this.db.emitError({ type: "persistence", error });
    }
  };

  private remove = async (key: string) => {
    try {
      await this.storage.removeItem(key);
    } catch (error) {
      this.db.emitError({ type: "persistence", error });
    }
  };
}
