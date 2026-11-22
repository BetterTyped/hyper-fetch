import type { ListenerInstance } from "@hyper-fetch/sockets";

import type { SyncConfig } from "../collection/collection.types";
import type { Stamp } from "../store/store.types";

export type SyncHost = {
  tick: () => number;
  applySyncMessage: (sync: SyncConfig, message: unknown, stamp: Stamp) => void;
  onLiveChange: () => void;
  onRemove: (subscription: SyncSubscription) => void;
};

/**
 * One server-side subscription of a sync, for one set of filter values. Subsets that need the same subscription
 * share it, and it stops when the last one releases it.
 *
 * While a subset that uses it is loading, events are buffered and applied after the response, so an `update` for a row
 * that only the response brings is not lost.
 */
export class SyncSubscription {
  started = false;
  private users = new Set<object>();
  private loading = new Set<object>();
  private buffer: { message: unknown; stamp: Stamp }[] = [];
  private unsubscribe: (() => void) | undefined;

  readonly id: string;
  readonly sync: SyncConfig;
  readonly listener: ListenerInstance;
  private readonly host: SyncHost;

  constructor(options: { id: string; sync: SyncConfig; listener: ListenerInstance; host: SyncHost }) {
    this.id = options.id;
    this.sync = options.sync;
    this.listener = options.listener;
    this.host = options.host;
  }

  /** Whether the server has started the subscription and the socket is connected */
  isLive = () => this.started && this.listener.socket.adapter.connected;

  addUser = (user: object) => {
    this.users.add(user);
    if (this.unsubscribe) {
      return;
    }
    // A `changes` sync reads the whole event, such as a Firestore snapshot with its grouped changes
    const toMessage = (event: { data: unknown }) => (this.sync.type === "changes" ? event : event.data);
    this.unsubscribe = this.listener.listen((event: { data: unknown }) => this.receive(toMessage(event)), {
      onStart: () => {
        this.started = true;
        this.host.onLiveChange();
      },
      onEnd: () => {
        this.started = false;
        this.unsubscribe = undefined;
        this.host.onLiveChange();
      },
    });
  };

  removeUser = (user: object) => {
    this.users.delete(user);
    this.endLoad(user);
    if (this.users.size > 0) {
      return;
    }
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.started = false;
    this.host.onRemove(this);
  };

  getUsers = () => [...this.users];

  beginLoad = (user: object) => {
    this.loading.add(user);
  };

  endLoad = (user: object) => {
    this.loading.delete(user);
    if (this.loading.size > 0) {
      return;
    }
    const buffered = this.buffer;
    this.buffer = [];
    buffered.forEach(({ message, stamp }) => this.host.applySyncMessage(this.sync, message, stamp));
  };

  private receive = (message: unknown) => {
    const seq = this.host.tick();
    const stamp: Stamp = { kind: "now", seq, wall: Date.now() };
    if (this.loading.size > 0) {
      this.buffer.push({ message, stamp });
      return;
    }
    this.host.applySyncMessage(this.sync, message, stamp);
  };
}
