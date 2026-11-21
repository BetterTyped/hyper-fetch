import type { CacheValueType } from "@hyper-fetch/core";

import { client } from "./api";

export type LogEntry = { id: number; direction: "sent" | "received"; cacheKey: string; time: string };

export const tabId = Math.random().toString(36).slice(2, 6).toUpperCase();

let log: LogEntry[] = [];
const listeners = new Set<() => void>();
const addLog = (direction: LogEntry["direction"], cacheKey: string) => {
  const entry = { id: Date.now() + Math.random(), direction, cacheKey, time: new Date().toLocaleTimeString() };
  log = [entry, ...log].slice(0, 8);
  listeners.forEach((listener) => listener());
};

/** For `useSyncExternalStore` in the log panel. */
export const syncLog = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => log,
};

// Every tab of this site that opens the same channel name gets the messages. The sender does not.
const channel = new BroadcastChannel("hyper-fetch-cache");
let applyingRemoteChange = false;

// 1. Something wrote to the cache in this tab: a response, `cache.update()` or `cache.set()`.
client.cache.events.onData((value) => {
  // Without this flag, a change received from another tab would be sent straight back.
  if (applyingRemoteChange || !value.cached) return;
  channel.postMessage(value);
  addLog("sent", value.cacheKey);
});

// 2. Another tab wrote to its cache. Save the same entry here, and every hook reading that key re-renders.
channel.onmessage = ({ data }: MessageEvent<CacheValueType>) => {
  applyingRemoteChange = true;
  // `set` takes the request fields that decide where and how long to keep the entry. The entry itself has them.
  client.cache.set({ ...data, cache: true }, data);
  applyingRemoteChange = false;
  addLog("received", data.cacheKey);
};
