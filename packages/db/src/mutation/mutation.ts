import type { ClientInstance } from "@hyper-fetch/core";

import type { RowKey } from "../collection/collection.types";
import type { CollectionRuntime } from "../db/collection.runtime";
import type { DbRuntime } from "../db/db.runtime";
import type {
  DbOfflineOptions,
  MutationOperation,
  MutationResult,
  TransactionConfig,
  TransactionRecord,
  TransactionWrite,
} from "../db/db.types";
import type { Row } from "../store/store.types";
import { applyRequestPatches, isPlainObject } from "../utils/request.utils";
import { DependencyError } from "./mutation.errors";
import type { AnyResponse, PreparedWrite, Transaction } from "./mutation.utils";
import {
  combineResults,
  createTransaction,
  defaultRetryDelay,
  isTemporaryFailure,
  rowsOf,
  waitForOnline,
} from "./mutation.utils";

export type { PreparedWrite, Transaction } from "./mutation.utils";
export { createTransaction, isTemporaryFailure } from "./mutation.utils";

/**
 * Sends writes. Each write shows at once as an optimistic layer. Writes to one row go out one at a time, and a failure
 * drops the writes queued after it on that row. With `offline`, every write goes through a persisted outbox that is
 * replayed in order across the whole db by one tab.
 */
export class MutationEngine {
  /** The outbox, in replay order */
  outbox: TransactionRecord[] = [];
  /** The last write of each row, which the next write to the row waits for while it is pending */
  private chains = new Map<string, { id: string; run: Promise<boolean> }>();
  private inFlight = new Map<string, number>();
  private settleWaiters = new Map<string, (() => void)[]>();
  private resolvers = new Map<string, (result: MutationResult) => void>();
  /** Writes counted as in flight, so a write is counted once however its sending ends */
  private begun = new Set<string>();
  /** Whether each settled write succeeded, so `dependsOn` can name a write that already settled */
  private outcomes = new Map<string, boolean>();
  private outcomeWaiters = new Map<string, ((success: boolean) => void)[]>();
  /** When each write's request was sent, so a sync event that arrived while it was in flight confirms it */
  private sentAt = new Map<string, number>();
  private pumping = false;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private cancelWait = () => {};
  private readonly offline: DbOfflineOptions | undefined;

  constructor(
    private readonly db: DbRuntime,
    offline: boolean | DbOfflineOptions | undefined,
    private readonly transactions: Record<string, TransactionConfig> = {},
  ) {
    this.offline = offline === true ? {} : offline || undefined;
  }

  /**
   * Applies several writes as one transaction. A named transaction sends them through its `mutationFn` as one request.
   * Without a name, each write goes through its collection's `mutate`, in order, and a failure drops the writes after
   * it and refetches the subsets holding the rows already written.
   */
  submitTransaction = ({
    id,
    name,
    writes,
  }: {
    id: string;
    name: string | undefined;
    writes: PreparedWrite[];
  }): Transaction => {
    if (writes.length === 0) {
      return createTransaction(id, Promise.resolve({ success: true, data: [], error: null }));
    }
    return name === undefined ? this.submitSequence(id, writes) : this.submitNamed(id, name, writes);
  };

  private createRecord = (write: PreparedWrite & { id: string; dependsOn: string[] }): TransactionRecord => ({
    id: write.id,
    collection: write.collection.name,
    op: write.op,
    key: write.key,
    values: write.values,
    dependsOn: write.dependsOn,
    sent: false,
    createdAt: Date.now(),
  });

  /** The result promise of a record, resolved once the record settles */
  private track = (record: TransactionRecord) => {
    return new Promise<MutationResult>((resolve) => {
      this.resolvers.set(record.id, resolve);
      this.generations.set(record.id, this.db.generation);
    });
  };

  private submitSequence = (id: string, writes: PreparedWrite[]): Transaction => {
    const records = writes.map((write, index) =>
      this.createRecord({ ...write, id: `${id}:${index}`, dependsOn: index > 0 ? [`${id}:${index - 1}`] : [] }),
    );
    const results = records.map(this.track);
    this.db.batch(() => {
      writes.forEach((write, index) => {
        if (write.collection.config.mutations[write.op]?.optimistic !== false) {
          write.collection.store.addLayer({
            id: records[index].id,
            key: write.key,
            type: write.op,
            values: write.values,
          });
        }
      });
    });
    if (this.offline) {
      // The outbox replays them in order, and a rejected write drops the ones that depend on it
      records.forEach((record) => this.enqueue(record));
    } else {
      this.runSequence(records, results, 0);
    }
    return createTransaction(id, Promise.all(results).then(combineResults));
  };

  /** Sends the writes of an unnamed transaction one after another */
  private runSequence = async (records: TransactionRecord[], results: Promise<MutationResult>[], index: number) => {
    const record = records[index];
    this.runDirect(record);
    const result = await results[index];
    if (!result.success) {
      records.slice(index + 1).forEach((later) => this.fail(later, new DependencyError(record.id)));
      records.slice(0, index).forEach((written) => {
        const collection = this.db.collections.get(written.collection)!;
        collection.getSubsetsHolding(collection.resolveKey(written.key)).forEach((subset) => subset.reload());
      });
      return;
    }
    if (index + 1 < records.length) {
      await this.runSequence(records, results, index + 1);
    }
  };

  private submitNamed = (id: string, name: string, writes: PreparedWrite[]): Transaction => {
    const transactionWrites: TransactionWrite[] = writes.map((write) => ({
      collection: write.collection.name,
      op: write.op,
      key: write.key,
      values: write.values,
    }));
    const record: TransactionRecord = {
      ...this.createRecord({ ...writes[0], id, dependsOn: [] }),
      values: {},
      transaction: { name, writes: transactionWrites },
    };
    const result = this.track(record);
    this.addTransactionLayers(record);
    if (this.offline) {
      this.enqueue(record);
    } else {
      this.runDirect(record);
    }
    return createTransaction(id, result);
  };

  private addTransactionLayers = (record: TransactionRecord) => {
    this.db.batch(() => {
      record.transaction!.writes.forEach((write, index) => {
        this.db.collections
          .get(write.collection)!
          .store.addLayer({ id: `${record.id}:${index}`, key: write.key, type: write.op, values: write.values });
      });
    });
  };

  /** Runs a callback for each write of a named transaction, as a plain record with its layer id */
  private eachWrite = (record: TransactionRecord, callback: (write: TransactionRecord) => void) => {
    record.transaction!.writes.forEach((write, index) => {
      callback({ ...record, ...write, id: `${record.id}:${index}`, transaction: undefined });
    });
  };

  /** Applies a write optimistically and sends it */
  submit = ({
    collection,
    op,
    key,
    values,
    dependsOn,
    id,
    temporaryKey,
  }: {
    collection: CollectionRuntime;
    op: MutationOperation;
    key: RowKey;
    values: Row;
    dependsOn: string[];
    id: string;
    temporaryKey?: boolean;
  }): Transaction => {
    const record: TransactionRecord = {
      id,
      collection: collection.name,
      op,
      key,
      values,
      dependsOn,
      sent: false,
      createdAt: Date.now(),
      ...(temporaryKey ? { temporaryKey: true } : {}),
    };
    const result = new Promise<MutationResult>((resolve) => {
      this.resolvers.set(id, resolve);
      this.generations.set(id, this.db.generation);
    });
    const mutation = collection.config.mutations[op];
    // Backends that apply writes locally on their own, such as Firestore, would apply them twice with a layer
    if (mutation?.optimistic !== false) {
      this.db.batch(() => collection.store.addLayer({ id, key, type: op, values }));
    }
    if (this.offline && mutation?.outbox !== false) {
      this.enqueue(record);
    } else {
      this.runDirect(record);
    }
    return createTransaction(id, result);
  };

  /** A write rejected before it was sent, for example by validation */
  reject = (error: unknown, id: string): Transaction => {
    return createTransaction(id, Promise.resolve({ success: false, data: null, error }));
  };

  /** Whether writes go through the outbox */
  get usesOutbox() {
    return Boolean(this.offline);
  }

  /** Resolves once no write of the collection is in flight */
  settled = (collection: string): Promise<void> => {
    if (!this.inFlight.get(collection)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.settleWaiters.set(collection, [...(this.settleWaiters.get(collection) ?? []), resolve]);
    });
  };

  /** Rebuilds the optimistic layers of a restored outbox and replays it */
  restore = (records: TransactionRecord[]) => {
    this.addRecords(records);
    this.persistOutbox();
    this.pump();
  };

  /**
   * Writes another tab made: a follower sent them to this tab, the leader, or this tab became the leader and adopts the
   * outbox the previous leader persisted. They are persisted together with this tab's own writes and replayed.
   */
  mergeOutbox = (records: TransactionRecord[]) => {
    this.addRecords(records);
    this.persistOutbox();
    this.pump();
  };

  /** A new leader asks for the writes followers still wait for */
  resendToLeader = () => {
    if (this.outbox.length > 0) {
      this.db.tabs?.post({ type: "enqueue", records: [...this.outbox] });
    }
  };

  /** Adds records this tab does not hold yet, with their optimistic layers, in the order they were made */
  private addRecords = (records: TransactionRecord[]) => {
    const fresh = this.replayable(records).filter((record) => !this.outbox.some((item) => item.id === record.id));
    if (fresh.length === 0) {
      return;
    }
    fresh.forEach((record) => this.generations.set(record.id, this.db.generation));
    this.db.batch(() => {
      fresh.forEach((record) => {
        if (record.transaction) {
          this.addTransactionLayers(record);
          return;
        }
        const collection = this.db.collections.get(record.collection)!;
        collection.store.addLayer({ id: record.id, key: record.key, type: record.op, values: record.values });
      });
    });
    this.outbox = [...this.outbox, ...fresh].toSorted((left, right) => left.createdAt - right.createdAt);
  };

  /** The records this db can replay. The others are reported, never dropped silently. */
  private replayable = (records: TransactionRecord[]) => {
    return records.filter((record) => {
      const canReplay = record.transaction
        ? Boolean(this.transactions[record.transaction.name])
        : Boolean(this.db.collections.get(record.collection)?.config.mutations[record.op]);
      if (!canReplay) {
        const target = record.transaction
          ? `the transaction "${record.transaction.name}"`
          : `a write to "${record.collection}"`;
        this.db.emitError({
          type: "outbox",
          error: new Error(`The outbox holds ${target} that the db cannot replay`),
          transaction: record,
        });
      }
      return canReplay;
    });
  };

  /** The replaying tab reports a write's outcome */
  applyOutcome = (outcome: { id: string; success: boolean; error?: unknown; key?: RowKey }) => {
    const record = this.outbox.find((item) => item.id === outcome.id);
    if (!record) {
      return;
    }
    this.outbox = this.outbox.filter((item) => item.id !== outcome.id);
    if (outcome.success) {
      const collection = this.db.collections.get(record.collection)!;
      // The leader learned the key the server gave this tab's insert, so the row moves to it as on the leader
      if (record.temporaryKey && outcome.key !== undefined && outcome.key !== record.key) {
        collection.aliases.set(record.key, outcome.key);
        collection.setRenderKey(outcome.key, collection.getRenderKey(record.key));
        collection.store.rekeyLayers(record.key, outcome.key);
      }
      this.keep(record);
      this.resolve(record, { success: true, data: null, error: null });
    } else {
      this.fail(record, outcome.error);
    }
  };

  /** Replays the outbox when this tab is the one that replays it, one write at a time and in order */
  pump = async () => {
    /* oxlint-disable no-await-in-loop -- writes replay strictly one after another */
    if (!this.offline || this.pumping || !this.db.isLeader) {
      return;
    }
    this.pumping = true;
    await this.db.ready;
    let attempt = 0;
    while (this.outbox.length > 0 && !this.db.isDestroyed) {
      const record = this.outbox[0];
      const client = this.getClient(record);
      if (client && !client.appManager.isOnline) {
        const online = waitForOnline(client);
        this.cancelWait = online.cancel;
        await online.promise;
        continue;
      }
      record.sent = true;
      await this.persistOutbox();
      try {
        const response = await this.send(record, true);
        if (!response) {
          this.removeFromOutbox([record.id]);
        } else if (response.success) {
          attempt = 0;
          await this.succeed(record, response);
          this.end(record);
          this.removeFromOutbox([record.id]);
          const serverKey = this.db.collections.get(record.collection)?.resolveKey(record.key);
          this.db.tabs?.post({
            type: "outcome",
            id: record.id,
            success: true,
            ...(record.temporaryKey ? { key: serverKey } : {}),
          });
        } else if ((this.offline.retryable ?? isTemporaryFailure)(response)) {
          attempt += 1;
          this.end(record);
          const delay = (this.offline.retryDelay ?? defaultRetryDelay)(attempt);
          await new Promise((resolve) => {
            this.retryTimer = setTimeout(resolve, delay);
          });
        } else {
          attempt = 0;
          this.drop(record, response.error ?? response);
        }
      } catch (error) {
        // A mapping or `mutationFn` that throws can never succeed, so the write is dropped and replay goes on
        attempt = 0;
        this.drop(record, error);
      }
    }
    /* oxlint-enable no-await-in-loop */
    this.pumping = false;
  };

  /**
   * Drops every pending write, for example on sign-out. Writes in flight resolve as failed now, and their responses,
   * which carry the previous user's data, are never written.
   */
  clear = () => {
    this.outbox = [];
    this.chains.clear();
    const cleared = { success: false, data: null, error: new Error("Cleared") };
    [...this.resolvers.values()].forEach((resolve) => resolve(cleared));
    this.resolvers.clear();
    this.sentAt.clear();
    this.persistOutbox();
  };

  /** Stops the retry timer, for `destroy` */
  destroy = () => {
    clearTimeout(this.retryTimer);
    this.cancelWait();
  };

  /** The generation each write was made or restored in, so `clear` ends the writes of the previous user */
  private generations = new Map<string, number>();

  /** Whether a write belongs to the current user, rather than to one `clear` ended */
  private isActive = (record: TransactionRecord) => this.generations.get(record.id) === this.db.generation;

  /** Resolves with whether a write succeeded. A write this db never saw, such as one from another session, is done. */
  private waitForOutcome = (id: string): Promise<boolean> => {
    if (this.outcomes.has(id)) {
      return Promise.resolve(this.outcomes.get(id)!);
    }
    if (!this.resolvers.has(id)) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      this.outcomeWaiters.set(id, [...(this.outcomeWaiters.get(id) ?? []), resolve]);
    });
  };

  private enqueue = async (record: TransactionRecord) => {
    const failed = record.dependsOn.find((id) => this.outcomes.get(id) === false);
    if (failed) {
      this.fail(record, new DependencyError(failed));
      return;
    }
    this.outbox.push(record);
    if (!this.db.isLeader) {
      // Only the leader writes the shared outbox, so two tabs never write over each other's writes
      this.db.tabs?.post({ type: "enqueue", records: [record] });
      this.db.notifyChange();
      return;
    }
    await this.persistOutbox();
    this.pump();
  };

  private persistOutbox = () => {
    this.db.notifyChange();
    if (!this.db.isLeader) {
      return Promise.resolve();
    }
    return this.db.persistence?.saveOutbox(this.outbox) ?? Promise.resolve();
  };

  private removeFromOutbox = (ids: string[]) => {
    this.outbox = this.outbox.filter((record) => !ids.includes(record.id));
    this.persistOutbox();
  };

  private runDirect = (record: TransactionRecord) => {
    const chainKey = `${record.collection}:${String(record.key)}`;
    // A write made after the previous one settled does not depend on it, even when it failed
    const last = this.chains.get(chainKey);
    const previous = last && !this.outcomes.has(last.id) ? last.run : Promise.resolve(true);
    // Counted as in flight from now, so a refetch that starts while it waits is newer than it
    this.begin(record);
    const run = previous.then(async (previousSucceeded) => {
      const dependencies = await Promise.all(record.dependsOn.map(this.waitForOutcome));
      const failedDependency = record.dependsOn.find((_id, index) => !dependencies[index]);
      if (!previousSucceeded || failedDependency) {
        this.fail(record, new DependencyError(failedDependency ?? chainKey));
        return false;
      }
      if (!this.isActive(record)) {
        return false;
      }
      try {
        const response = await this.send(record, false);
        if (!response) {
          return false;
        }
        if (response.success) {
          await this.succeed(record, response);
          return true;
        }
        this.fail(record, response.error ?? response);
        return false;
      } catch (error) {
        this.fail(record, error);
        return false;
      }
    });
    this.chains.set(chainKey, { id: record.id, run });
    run.then(() => {
      this.end(record);
      if (this.chains.get(chainKey)?.run === run) {
        this.chains.delete(chainKey);
      }
    });
  };

  /** The client a record's request goes through, so replay waits while it is offline */
  private getClient = (record: TransactionRecord): ClientInstance | undefined => {
    if (record.transaction) {
      const config = this.transactions[record.transaction.name];
      return config?.mutationFn({ id: record.id, mutations: record.transaction.writes }).client;
    }
    return this.db.collections.get(record.collection)?.config.mutations[record.op]?.request.client;
  };

  private send = async (record: TransactionRecord, fromOutbox: boolean): Promise<AnyResponse | undefined> => {
    if (record.transaction) {
      return this.sendNamed(record, fromOutbox);
    }
    const collection = this.db.collections.get(record.collection)!;
    const mutation = collection.config.mutations[record.op];
    if (!mutation) {
      this.fail(record, new Error(`"${record.collection}" declares no ${record.op} mutation`));
      return undefined;
    }
    if (fromOutbox) {
      this.begin(record);
    }
    const key = collection.resolveKey(record.key);
    const context = { id: record.id };
    // `map` is the collection's request mapping, not an array method
    /* oxlint-disable no-array-method-this-argument */
    let patch;
    if (record.op === "insert") {
      const keyField = collection.config.key;
      const withoutKey = Object.fromEntries(Object.entries(record.values).filter(([field]) => field !== keyField));
      patch = mutation.map(record.temporaryKey ? withoutKey : record.values, context);
    } else if (record.op === "update") {
      patch = mutation.map(key, record.values, context);
    } else {
      patch = mutation.map(key, context);
    }
    /* oxlint-enable no-array-method-this-argument */
    let request = applyRequestPatches(mutation.request, [patch]);
    if (fromOutbox) {
      request = request.setOffline(false);
    }
    this.sentAt.set(record.id, this.db.tick());
    return request.send();
  };

  private sendNamed = (record: TransactionRecord, fromOutbox: boolean): Promise<AnyResponse> => {
    const { name, writes } = record.transaction!;
    if (fromOutbox) {
      this.begin(record);
    }
    let request = this.transactions[name].mutationFn({ id: record.id, mutations: writes });
    if (fromOutbox) {
      request = request.setOffline(false);
    }
    this.sentAt.set(record.id, this.db.tick());
    return request.send();
  };

  /** A named transaction succeeded: its changes become the server state, or the subsets holding them reload */
  private succeedNamed = async (record: TransactionRecord, response: AnyResponse) => {
    const { onSuccess = "keep" } = this.transactions[record.transaction!.name];
    if (onSuccess === "refetch") {
      this.end(record);
      const refetches: Promise<void>[] = [];
      this.eachWrite(record, (write) => {
        refetches.push(this.refetch(this.db.collections.get(write.collection)!, write));
      });
      await Promise.all(refetches);
      this.removeTransactionLayers(record);
    } else {
      this.keep(record);
    }
    this.resolve(record, { success: true, data: response.data, error: null });
  };

  private removeTransactionLayers = (record: TransactionRecord) => {
    this.db.batch(() => {
      this.eachWrite(record, (write) => this.db.collections.get(write.collection)!.store.removeLayer(write.id));
    });
  };

  private succeed = async (record: TransactionRecord, response: AnyResponse) => {
    // After `clear`, the response belongs to the previous user and is never written
    if (!this.isActive(record)) {
      return;
    }
    if (record.transaction) {
      await this.succeedNamed(record, response);
      return;
    }
    const collection = this.db.collections.get(record.collection)!;
    const mutation = collection.config.mutations[record.op]!;
    const key = collection.resolveKey(record.key);
    // The server assigned the key, but the response is not the row, so only the lists the row belongs to can tell it
    if (record.op === "insert" && record.temporaryKey && mutation.onSuccess) {
      this.end(record);
      const lists = [...collection.listSubsets.values()].filter(
        (subset) => subset.hasLoaded && subset.matchesSent(record.values),
      );
      await Promise.all(lists.map((subset) => subset.reload({ waitForWrites: false })));
      this.db.batch(() => collection.store.removeLayer(record.id));
      this.resolve(record, { success: true, data: response.data, error: null });
      return;
    }
    if (mutation.onSuccess === "refetch" || mutation.onSuccess === "sync") {
      this.end(record);
      let confirmed = false;
      if (mutation.onSuccess === "sync") {
        const since = this.sentAt.get(record.id)!;
        confirmed = await this.db.waitForSync({
          collection: record.collection,
          key,
          since,
          timeout: this.db.syncTimeout,
        });
      }
      if (!confirmed) {
        await this.refetch(collection, record);
      }
      this.db.batch(() => collection.store.removeLayer(record.id));
      this.resolve(record, { success: true, data: response.data, error: null });
      return;
    }
    this.db.batch(() => {
      if (mutation.onSuccess === "keep") {
        this.writeKept(collection, record);
      } else {
        this.writeResponse(collection, record, mutation.row ? mutation.row(response.data) : response.data);
      }
      collection.store.removeLayer(record.id);
    });
    this.resolve(record, { success: true, data: response.data, error: null });
  };

  /** A write confirmed by another tab: its values become the server state */
  private keep = (record: TransactionRecord) => {
    if (record.transaction) {
      this.db.batch(() => this.eachWrite(record, this.keep));
      return;
    }
    const collection = this.db.collections.get(record.collection)!;
    this.db.batch(() => {
      this.writeKept(collection, record);
      collection.store.removeLayer(record.id);
    });
  };

  private writeKept = (collection: CollectionRuntime, record: TransactionRecord) => {
    const key = collection.resolveKey(record.key);
    const stamp = { kind: "now" as const, seq: this.db.tick(), wall: Date.now() };
    if (record.op === "delete") {
      collection.store.remove(key, stamp);
      return;
    }
    collection.store.write(
      key,
      { ...record.values, [collection.config.key]: key },
      { complete: record.op === "insert", stamp },
    );
  };

  private writeResponse = (collection: CollectionRuntime, record: TransactionRecord, data: unknown) => {
    const key = collection.resolveKey(record.key);
    const stamp = { kind: "now" as const, seq: this.db.tick(), wall: Date.now() };
    if (record.op === "delete") {
      collection.store.remove(key, stamp);
      return;
    }
    if (!isPlainObject(data)) {
      return;
    }
    const serverKey = (data[collection.config.key] as RowKey | undefined) ?? key;
    collection.writeServerRows([{ ...data, [collection.config.key]: serverKey }], record.op === "insert", stamp);
    if (record.op !== "insert") {
      return;
    }
    if (serverKey !== record.key) {
      collection.aliases.set(record.key, serverKey);
      collection.setRenderKey(serverKey, collection.getRenderKey(record.key));
      collection.store.rekeyLayers(record.key, serverKey);
    }
    collection.noteInsert(serverKey);
  };

  /** Reloads the subsets that hold the row, after the loads already in flight */
  private refetch = async (collection: CollectionRuntime, record: TransactionRecord) => {
    const key = collection.resolveKey(record.key);
    const subsets = collection.getSubsetsHolding(key);
    if (subsets.length === 0) {
      this.db.batch(() => this.writeKept(collection, record));
      return;
    }
    // The writes queued behind this one wait for it, so its refetch must not wait for them
    await Promise.all(subsets.map((subset) => subset.reload({ waitForWrites: false })));
  };

  /** Drops a rejected outbox write and every later write that was built on it */
  private drop = (record: TransactionRecord, error: unknown) => {
    const droppedIds = new Set([record.id]);
    const droppedRows = new Set(rowsOf(record));
    const dropped = [record];
    this.outbox.slice(1).forEach((later) => {
      const rows = rowsOf(later);
      if (rows.some((row) => droppedRows.has(row)) || later.dependsOn.some((id) => droppedIds.has(id))) {
        droppedIds.add(later.id);
        rows.forEach((row) => droppedRows.add(row));
        dropped.push(later);
      }
    });
    this.end(record);
    this.removeFromOutbox([...droppedIds]);
    dropped.forEach((item) => {
      const reason = item === record ? error : new DependencyError(record.id);
      this.fail(item, reason);
      this.db.tabs?.post({ type: "outcome", id: item.id, success: false, error: String(reason) });
    });
  };

  private fail = (record: TransactionRecord, error: unknown) => {
    const active = this.isActive(record);
    if (record.transaction) {
      this.removeTransactionLayers(record);
    } else {
      const collection = this.db.collections.get(record.collection);
      this.db.batch(() => collection?.store.removeLayer(record.id));
    }
    this.resolve(record, { success: false, data: null, error });
    // A write `clear` already ended is not reported again
    if (active) {
      this.db.emitError({ type: "mutation", error, collection: record.collection, transaction: record });
    }
  };

  private resolve = (record: TransactionRecord, result: MutationResult) => {
    this.resolvers.get(record.id)?.(result);
    this.resolvers.delete(record.id);
    this.sentAt.delete(record.id);
    this.outcomes.set(record.id, result.success);
    this.outcomeWaiters.get(record.id)?.forEach((notify) => notify(result.success));
    this.outcomeWaiters.delete(record.id);
  };

  /** The collections a write changes: one, or every collection a named transaction writes */
  private collectionsOf = (record: TransactionRecord) => [
    ...new Set((record.transaction?.writes ?? [record]).map((write) => write.collection)),
  ];

  /** Counts a sent write as in flight in every collection it changes, once per attempt */
  private begin = (record: TransactionRecord) => {
    this.begun.add(record.id);
    this.collectionsOf(record).forEach((collection) => {
      this.inFlight.set(collection, (this.inFlight.get(collection) ?? 0) + 1);
    });
  };

  /** Ends a write's in-flight state once, even when its success handling ended it early */
  private end = (record: TransactionRecord) => {
    if (!this.begun.delete(record.id)) {
      return;
    }
    this.collectionsOf(record).forEach((collection) => {
      const count = this.inFlight.get(collection)! - 1;
      this.inFlight.set(collection, count);
      if (count > 0) {
        return;
      }
      const waiters = this.settleWaiters.get(collection) ?? [];
      this.settleWaiters.delete(collection);
      waiters.forEach((resolve) => resolve());
    });
  };
}
