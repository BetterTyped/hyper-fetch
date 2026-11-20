import { client } from "./client";

export type NetworkLogEntry = { id: number; endpoint: string; time: string };

let entries: NetworkLogEntry[] = [];
const listeners = new Set<() => void>();

// Only requests that reach the network start here. Data read from the cache never shows up in the log.
client.requestManager.events.onRequestStart(({ request }) => {
  const query = Object.entries(request.queryParams ?? {}).map(([key, value]) => `${key}=${value}`);
  const endpoint = query.length ? `${request.endpoint}?${query.join("&")}` : request.endpoint;
  const entry = { id: Date.now() + Math.random(), endpoint, time: new Date().toLocaleTimeString() };
  entries = [entry, ...entries].slice(0, 8);
  listeners.forEach((listener) => listener());
});

/** A tiny store for `useSyncExternalStore`. */
export const networkLog = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: () => entries,
};
