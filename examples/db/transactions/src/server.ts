import type { TransactionWrite } from "@hyper-fetch/db";

import {
  type Activity,
  ActivitySchema,
  applyWrites,
  type Card,
  CardSchema,
  createActivity,
  deleteCard,
  getActivity,
  getCards,
} from "./db";

/**
 * A fake backend made with HyperFetch mocking, so the example runs without a server. `setMock` replaces the adapter of
 * a request: the db sends the same requests it would send to a real API.
 */
let cards: Card[] = [
  { id: "c1", title: "Write the brief", column: "todo", position: 1 },
  { id: "c2", title: "Book the venue", column: "todo", position: 2 },
  { id: "c3", title: "Design the poster", column: "doing", position: 1 },
  { id: "c4", title: "Pick a date", column: "done", position: 1 },
  { id: "c5", title: "Sign the contract", column: "done", position: 2 },
  { id: "c6", title: "Send the invites", column: "done", position: 3 },
];
let activity: Activity[] = [];
/** The server refuses to delete a signed contract, so clearing the Done column fails in the middle */
const locked = new Set(["c5"]);
const appliedKeys = new Set<string>();

// Slow enough to see a write on screen before the server answers.
const latency = { responseTime: 800 };

let failing = false;

/** While on, every write answers 500 and the db reverts it */
export const setServerFailing = (value: boolean) => {
  failing = value;
};

export type ServerLogEntry = { id: number; time: string; line: string; body?: unknown };
let log: ServerLogEntry[] = [];
let nextId = 0;
const logListeners = new Set<() => void>();

const addLog = (line: string, body?: unknown) => {
  log = [{ id: nextId++, time: new Date().toLocaleTimeString(), line, body }, ...log].slice(0, 6);
  logListeners.forEach((listener) => listener());
};

/** What the server received. For `useSyncExternalStore`. */
export const getServerLog = () => log;
export const subscribeToServerLog = (listener: () => void) => {
  logListeners.add(listener);
  return () => logListeners.delete(listener);
};

const fail = (line: string, status: number, body?: unknown) => {
  addLog(`${line} → ${status}`, body);
  return { error: new Error(line), status };
};

/** Applies one write of a transaction, validated like any other write. Returns the new tables, or an error. */
const applyWrite = (tables: { cards: Card[]; activity: Activity[] }, write: TransactionWrite) => {
  if (write.collection === "card" && write.op === "update") {
    const changes = CardSchema.partial().parse(write.values);
    return { ...tables, cards: tables.cards.map((card) => (card.id === write.key ? { ...card, ...changes } : card)) };
  }
  if (write.collection === "activity" && write.op === "insert") {
    return { ...tables, activity: [...tables.activity, ActivitySchema.parse(write.values)] };
  }
  throw new Error(`Unsupported write: ${write.op} ${write.collection}`);
};

getCards.setMock(() => ({ data: cards, status: 200 }), latency);
getActivity.setMock(() => ({ data: activity, status: 200 }), latency);

/** One request with every write. They are applied together, or not at all. */
applyWrites.setMock(({ request }) => {
  const line = "POST /board/transactions";
  if (!request.payload) return fail(line, 400);
  const { idempotencyKey, mutations } = request.payload;
  if (failing) return fail(`${line}, nothing applied`, 500, request.payload);
  if (appliedKeys.has(idempotencyKey)) {
    addLog(`${line} → 200, already applied`, request.payload);
    return { data: { applied: 0 }, status: 200 };
  }
  try {
    const next = mutations.reduce(applyWrite, { cards, activity });
    cards = next.cards;
    activity = next.activity;
    appliedKeys.add(idempotencyKey);
    addLog(`${line} → 200, ${mutations.length} writes applied`, request.payload);
    return { data: { applied: mutations.length }, status: 200 };
  } catch (error) {
    return fail(`${line}, ${String(error)}`, 400, request.payload);
  }
}, latency);

deleteCard.setMock(({ request }) => {
  const id = String(request.params?.cardId);
  const line = `DELETE /cards/${id}`;
  if (failing) return fail(line, 500);
  if (locked.has(id)) return fail(`${line}, the contract is signed`, 403);
  cards = cards.filter((card) => card.id !== id);
  addLog(`${line} → 200`);
  return { data: { id }, status: 200 };
}, latency);

createActivity.setMock(({ request }) => {
  const line = "POST /activity";
  if (!request.payload) return fail(line, 400);
  if (failing) return fail(line, 500, request.payload);
  activity = [...activity, request.payload];
  addLog(`${line} → 201`, request.payload);
  return { data: request.payload, status: 201 };
}, latency);
