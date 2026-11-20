import { client } from "./client";

export type Activity = { id: number; text: string; tone: "saved" | "failed" | "synced"; time: string };

let entries: Activity[] = [];
const listeners = new Set<() => void>();

export const addActivity = (text: string, tone: Activity["tone"]) => {
  const entry = { id: Date.now() + Math.random(), text, tone, time: new Date().toLocaleTimeString() };
  entries = [entry, ...entries].slice(0, 8);
  listeners.forEach((listener) => listener());
};

/** A tiny store for `useSyncExternalStore`. */
export const activity = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: () => entries,
};

// Every write ends here, whichever component sent it. By the time a failure arrives, core has rolled it back.
client.requestManager.events.onResponse(({ request, response }) => {
  if (request.method === "GET") return;
  const label = `${request.method} ${request.endpoint}`;
  if (response.success) addActivity(`${label} saved`, "saved");
  else addActivity(`${label} failed (${response.status}), change undone`, "failed");
});
