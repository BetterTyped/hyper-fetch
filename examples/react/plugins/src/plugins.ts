import { Plugin } from "@hyper-fetch/core";

/** A tiny store, so React can subscribe to what the plugins collect. */
const createStore = <T>(initial: T) => {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

// ---------- Logger ----------

export type LogLine = { id: number; text: string; kind: "start" | "success" | "error" };
export const logStore = createStore<LogLine[]>([]);
let lineId = 0;

const writeLog = (text: string, kind: LogLine["kind"]) => {
  lineId += 1;
  logStore.set([{ id: lineId, text, kind }, ...logStore.get()].slice(0, 12));
};

/** Writes one line when a request starts and one when it ends. */
export const loggerPlugin = () =>
  new Plugin({ name: "logger" })
    .onRequestStart(({ request }) => writeLog(`→ ${request.method} ${request.endpoint}`, "start"))
    .onRequestFinished(({ request, response }) => {
      const ms = response.responseTimestamp - response.requestTimestamp;
      writeLog(
        `← ${response.status} ${request.method} ${request.endpoint} in ${ms} ms`,
        response.success ? "success" : "error",
      );
    });

// ---------- Metrics ----------

export type EndpointStats = { calls: number; errors: number; totalMs: number; maxMs: number };
export const metricsStore = createStore<Record<string, EndpointStats>>({});

/** Counts calls, errors and durations per endpoint template, like an APM agent would. */
export const metricsPlugin = () =>
  new Plugin({ name: "metrics" }).onRequestFinished(({ request, response }) => {
    // `requestOptions.endpoint` is the template ("/posts/:postId"), so all ids share one row.
    const key = `${request.method} ${request.requestOptions.endpoint}`;
    const ms = response.responseTimestamp - response.requestTimestamp;
    const previous = metricsStore.get()[key] ?? { calls: 0, errors: 0, totalMs: 0, maxMs: 0 };
    metricsStore.set({
      ...metricsStore.get(),
      [key]: {
        calls: previous.calls + 1,
        errors: previous.errors + (response.success ? 0 : 1),
        totalMs: previous.totalMs + ms,
        maxMs: Math.max(previous.maxMs, ms),
      },
    });
  });
