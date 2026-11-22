import type { DbChannel, DbLockManager, TransactionRecord } from "../db/db.types";

export type TabsMessage =
  /** A follower's writes, which only the leader persists and replays */
  | { type: "enqueue"; records: TransactionRecord[] }
  /** A tab became the leader: followers send it the writes they still wait for */
  | { type: "leader" }
  /** A tab cleared the db, for example on sign-out */
  | { type: "clear" }
  /** A replayed write settled. `key` is the key the server gave an insert that left it to the server. */
  | { type: "outcome"; id: string; success: boolean; error?: unknown; key?: string | number }
  | { type: "rows"; collection: string; rows: [string | number, Record<string, unknown>][] };

const getDefaultLocks = (): DbLockManager | undefined => {
  const navigatorLike = (globalThis as { navigator?: { locks?: DbLockManager } }).navigator;
  return navigatorLike?.locks;
};

const getDefaultChannel = (name: string): DbChannel | undefined => {
  if (typeof BroadcastChannel === "undefined") {
    return undefined;
  }
  return new BroadcastChannel(name) as unknown as DbChannel;
};

/**
 * Elects the one tab that replays the outbox and writes persisted rows, with Web Locks. Without Web Locks every tab
 * treats itself as the leader. Tabs exchange outbox changes, outcomes and rows over a `BroadcastChannel`.
 */
export class Tabs {
  isLeader = false;
  private closed = false;
  private readonly locks: DbLockManager | undefined;
  private readonly channel: DbChannel | undefined;
  private releaseLock: (() => void) | undefined;
  private readonly listener = (event: { data: unknown }) => this.handlers.onMessage(event.data as TabsMessage);

  constructor(
    private readonly name: string,
    options: { locks?: DbLockManager; channel?: DbChannel } | undefined,
    private readonly handlers: { onLeader: () => void; onMessage: (message: TabsMessage) => void },
  ) {
    this.locks = options ? options.locks : getDefaultLocks();
    this.channel = options ? options.channel : getDefaultChannel(name);
  }

  start = () => {
    this.channel?.addEventListener("message", this.listener);
    if (!this.locks) {
      this.becomeLeader();
      return;
    }
    this.locks.request(`${this.name}:leader`, () => {
      // A tab destroyed while it waited releases the lock at once instead of leading
      if (this.closed) {
        return Promise.resolve();
      }
      this.becomeLeader();
      return new Promise<void>((resolve) => {
        this.releaseLock = resolve;
      });
    });
  };

  post = (message: TabsMessage) => {
    // A write can finish after the db was destroyed, and a closed channel throws on post
    if (this.closed) {
      return;
    }
    this.channel?.postMessage(message);
  };

  close = () => {
    this.closed = true;
    this.releaseLock?.();
    this.releaseLock = undefined;
    this.isLeader = false;
    this.channel?.removeEventListener("message", this.listener);
    this.channel?.close();
  };

  private becomeLeader = () => {
    this.isLeader = true;
    this.handlers.onLeader();
  };
}
