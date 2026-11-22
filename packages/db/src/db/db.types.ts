import type { RequestInstance, ResponseType } from "@hyper-fetch/core";

import type { Notation, RowKey } from "../collection/collection.types";
import type { DbCodec } from "../persistence/serializer";
import type { QueryExplanation } from "../query/query.types";

/** The db-wide notation that loaders use for operators and orders they declare with `true` */
export type DbNotation = Notation;

/** Storage for persisted rows and the outbox, such as `localStorage` or an async key-value store */
export type DbStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => unknown;
  removeItem: (key: string) => unknown;
};

/** The part of the Web Locks API the db uses to elect the tab that replays the outbox */
export type DbLockManager = {
  request: (name: string, callback: () => Promise<unknown>) => Promise<unknown>;
};

/** The part of `BroadcastChannel` the db uses to talk to other tabs */
export type DbChannel = {
  postMessage: (message: unknown) => void;
  addEventListener: (type: "message", listener: (event: { data: unknown }) => void) => void;
  removeEventListener: (type: "message", listener: (event: { data: unknown }) => void) => void;
  close: () => void;
};

export type DbPersistenceOptions = {
  storage: DbStorage;
  /** Keeps one user's or tenant's data apart from another's, such as the user id */
  scope?: string;
  /** Persisted rows of another version are cleared. The outbox is kept, because it holds the only copy of writes. */
  version?: string | number;
  /** How long a query whose restore found no rows waits for the network before it shows an empty result */
  networkTimeout?: number;
};

export type DbOfflineOptions = {
  /**
   * Whether a failed replay is temporary and retried, or permanent and dropped. By default a 4xx response other than
   * 408 and 429 is permanent.
   */
  retryable?: (response: ResponseType<unknown, unknown, any>) => boolean;
  /** Delay before retrying a temporary failure */
  retryDelay?: (attempt: number) => number;
};

/** What the db holds right now, for devtools such as HyperFlow */
export type DbInspection = {
  collections: {
    name: string;
    /** Rows with their optimistic layers applied */
    rows: number;
    layers: { id: string; key: RowKey; type: MutationOperation }[];
    subsets: {
      id: string;
      kind: "list" | "key";
      /** Index of the loader in the collection's chain */
      loader: number;
      rows: number;
      fresh: boolean;
      live: boolean;
      loading: boolean;
      error: unknown;
      loadedAt: number;
      /** Queries reading the subset */
      observers: number;
    }[];
  }[];
  queries: {
    key: string;
    collection: string;
    subscribers: number;
    status: "loading" | "ready" | "error";
    rows: number | undefined;
    plan: QueryExplanation;
  }[];
  outbox: TransactionRecord[];
};

/** What `db.dehydrate()` returns: the server rows and loaded subsets, as type-tagged JSON */
export type DehydratedDb = { readonly __dehydrated: true; readonly collections: unknown };

export type DbOptions = DbNotation & {
  /**
   * Value types to persist and dehydrate beyond `Date`, `bigint`, `Map`, `Set`, `undefined`, `NaN` and the
   * infinities, which the db stores as type-tagged JSON on its own
   */
  codecs?: readonly DbCodec[];
  /** Rows and loaded subsets a server rendered with, from `db.dehydrate()`. They show at once and refetch when used. */
  state?: DehydratedDb;
  /** How long a loaded subset no query uses is kept. Defaults to five minutes, like the core `cacheTime`. */
  gcTime?: number;
  /** How long a write with `onSuccess: "sync"` waits for a sync event before it refetches */
  syncTimeout?: number;
  /** Persists rows, loaded subsets and the outbox */
  persistence?: DbPersistenceOptions;
  /** Sends every write through the outbox, so writes made offline are replayed when the connection returns */
  offline?: boolean | DbOfflineOptions;
  /** How tabs agree on which one replays the outbox. Defaults to Web Locks and `BroadcastChannel`. */
  tabs?: false | { locks?: DbLockManager; channel?: DbChannel };
};

export type MutationOperation = "insert" | "update" | "delete";

/** One write of a transaction, as a transaction's `mutationFn` receives it and the outbox keeps it */
export type TransactionWrite = {
  collection: string;
  op: MutationOperation;
  key: RowKey;
  /** The complete row of an insert, or the changed fields of an update. Empty for a delete. */
  values: Record<string, unknown>;
};

/** A named transaction declared in `createDb`: one request sends all of its writes */
export type TransactionConfig = {
  /** Returns the request that sends the writes. The transaction id is an idempotency key. */
  mutationFn: (context: { id: string; mutations: TransactionWrite[] }) => RequestInstance;
  /**
   * What happens to the changes once the request succeeds: `keep` makes them the server state, which is the default,
   * and `refetch` reloads the loaded subsets that hold the changed rows
   */
  onSuccess?: "keep" | "refetch";
};

/** A write as the outbox keeps it */
export type TransactionRecord = {
  id: string;
  collection: string;
  op: MutationOperation;
  key: RowKey;
  values: Record<string, unknown>;
  dependsOn: string[];
  /** Set before the request goes out, so a restart sends it again with the same id */
  sent: boolean;
  /** The key is temporary until the server assigns one, so it is not sent */
  temporaryKey?: boolean;
  createdAt: number;
  /** A named transaction: its writes go out through the transaction's `mutationFn`, as one request */
  transaction?: { name: string; writes: TransactionWrite[] };
};

/** What a write resolves with. Like `send()`, a write never rejects. */
export type MutationResult = {
  success: boolean;
  data: unknown;
  error: unknown;
};

export type DbErrorEvent = {
  type: "mutation" | "outbox" | "validation" | "persistence" | "load" | "sync" | "subscriber";
  error: unknown;
  collection?: string;
  transaction?: TransactionRecord;
};
