/** The simulated server and the log. Not HyperFetch code: it only makes the rate limit visible. */

const LIMIT = 3;
const WINDOW_MS = 5000;

let windowStart = 0;
let used = 0;

export const rateLimiter = {
  limit: LIMIT,
  /** Counts a request. Returns 0 when allowed, or the seconds until the window resets. */
  take: () => {
    const now = Date.now();
    if (now - windowStart >= WINDOW_MS) {
      windowStart = now;
      used = 0;
    }
    if (used < LIMIT) {
      used += 1;
      return 0;
    }
    return Math.ceil((windowStart + WINDOW_MS - now) / 1000);
  },
  status: () => {
    const left = windowStart + WINDOW_MS - Date.now();
    return left > 0 ? { used, resetsIn: Math.ceil(left / 1000) } : { used: 0, resetsIn: 0 };
  },
};

export type LogEntry = { id: number; time: string; text: string };

let log: LogEntry[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

export const addLog = (text: string) => {
  nextId += 1;
  log = [{ id: nextId, time: new Date().toLocaleTimeString(), text }, ...log].slice(0, 10);
  listeners.forEach((listener) => listener());
};

export const logStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => log,
};
