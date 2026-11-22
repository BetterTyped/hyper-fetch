import type { ClientInstance, ResponseType } from "@hyper-fetch/core";

import type { RowKey } from "../collection/collection.types";
import type { CollectionRuntime } from "../db/collection.runtime";
import type { MutationOperation, MutationResult, TransactionRecord } from "../db/db.types";
import type { Row } from "../store/store.types";

export type AnyResponse = ResponseType<unknown, unknown, any>;

/**
 * A pending write: a promise of the write's result that never rejects, with the write's `id`. The `id`, or the
 * transaction itself, can be passed to `dependsOn` of a later write, so the later write is dropped when this one is
 * rejected.
 */
export type Transaction = Promise<MutationResult> & { readonly id: string };

export const createTransaction = (id: string, result: Promise<MutationResult>): Transaction => {
  return Object.assign(result, { id });
};

/** By default a 4xx response other than 408 and 429 is permanent, and everything else is retried */
export const isTemporaryFailure = (response: AnyResponse) => {
  const status = Number(response.status);
  if (!status) {
    return true;
  }
  return status >= 500 || status === 408 || status === 429;
};

/** A write of a transaction, validated and ready to apply */
export type PreparedWrite = { collection: CollectionRuntime; op: MutationOperation; key: RowKey; values: Row };

/** The rows a record writes, as `collection:key` */
export const rowsOf = (record: TransactionRecord) => {
  const writes = record.transaction?.writes ?? [record];
  return writes.map((write) => `${write.collection}:${String(write.key)}`);
};

/** One result for several writes: the first failure, or every write's data */
export const combineResults = (results: MutationResult[]): MutationResult => {
  const failed = results.find((result) => !result.success);
  return failed ?? { success: true, data: results.map((result) => result.data), error: null };
};

export const defaultRetryDelay = (attempt: number) => Math.min(1000 * 2 ** (attempt - 1), 30_000);

/** Resolves once the client is online again. `cancel` stops listening, for `destroy`. */
export const waitForOnline = (client: ClientInstance) => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  const cancel = client.appManager.events.onOnline(() => {
    cancel();
    resolve();
  });
  return { promise, cancel };
};
