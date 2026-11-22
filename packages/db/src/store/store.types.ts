import type { RowKey } from "../collection/collection.types";

export type Row = Record<string, unknown>;

/**
 * When a write happened, for ordering:
 * - `sent`: a response to a request; `seq` and `wall` are when it was sent, also for ingested requests sent elsewhere
 * - `now`: a socket event or a mutation result that is newer than anything before it
 *
 * Every stamp's `seq` comes from one counter, so writes are ordered exactly, even within one millisecond.
 */
export type Stamp = { kind: "sent" | "now"; seq: number; wall: number };

export type FieldMeta = { seq: number; wall: number; version?: unknown };

/** One pending optimistic write */
export type Layer = { id: string; key: RowKey; type: "insert" | "update" | "delete"; values: Row };
