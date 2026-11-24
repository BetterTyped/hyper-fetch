import { client, createProject, createTask, getProjects, getTasks, type Project, type Task, updateTask } from "./db";

/**
 * A fake backend made with HyperFetch mocking, so the example runs without a server. `setMock` replaces the adapter of
 * a request: the db sends the same requests it would send to a real API. The server keeps its rows in `localStorage`,
 * so a reload keeps them, like a real database would.
 */
type ServerState = {
  projects: Project[];
  tasks: Task[];
  /** Idempotency keys of the writes already applied */
  applied: string[];
  log: string[];
};

const STORAGE_KEY = "offline-outbox:server";
const NETWORK_KEY = "offline-outbox:offline";

const seed = (): ServerState => ({
  projects: [{ id: "p1", name: "Website relaunch", createdAt: 1 }],
  tasks: [
    { id: "t1", projectId: "p1", title: "Write the copy", done: true, createdAt: 1 },
    { id: "t2", projectId: "p1", title: "Pick the photos", done: false, createdAt: 2 },
  ],
  applied: [],
  log: [],
});

const load = (): ServerState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? (JSON.parse(saved) as ServerState) : seed();
};

let state = load();
const logListeners = new Set<() => void>();

const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

const addLog = (line: string) => {
  state = { ...state, log: [`${new Date().toLocaleTimeString()} ${line}`, ...state.log].slice(0, 8) };
  save();
  logListeners.forEach((listener) => listener());
};

/** What the server received, kept across reloads. For `useSyncExternalStore`. */
export const getServerLog = () => state.log;
export const subscribeToServerLog = (listener: () => void) => {
  logListeners.add(listener);
  return () => logListeners.delete(listener);
};

export type ServerMode = "accept" | "reject" | "down";
let mode: ServerMode = "accept";

/** `reject` answers 422, which the outbox drops. `down` answers 503, which the outbox retries. */
export const setServerMode = (value: ServerMode) => {
  mode = value;
};

/** Removes the server rows and the network switch, for the Reset button */
export const resetServer = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NETWORK_KEY);
};

// The Online switch is part of the fake environment: it is kept across reloads, so you can reload while "offline".
if (localStorage.getItem(NETWORK_KEY)) client.appManager.setOnline(false);
client.appManager.events.onOffline(() => localStorage.setItem(NETWORK_KEY, "true"));
client.appManager.events.onOnline(() => localStorage.removeItem(NETWORK_KEY));

// Slow enough to see a write in the outbox before the server answers.
const latency = { responseTime: 800 };

/** The failure the switch asks for, if any. A rejected write was never applied, so it is not a duplicate. */
const failure = (label: string, idempotencyKey: string) => {
  if (mode === "down") {
    addLog(`${label}: 503, the server is down`);
    return { error: new Error("The server is down"), status: 503 };
  }
  if (mode === "reject" && !state.applied.includes(idempotencyKey)) {
    addLog(`${label}: 422, rejected`);
    return { error: new Error("The server rejected the change"), status: 422 };
  }
  return null;
};

/** A write sent twice carries the same key. The server answers it again without applying it twice. */
const isDuplicate = (label: string, idempotencyKey: string) => {
  if (!state.applied.includes(idempotencyKey)) return false;
  addLog(`${label}: already applied, ignored (key ${idempotencyKey.slice(0, 8)})`);
  return true;
};

const apply = (label: string, idempotencyKey: string, next: Pick<ServerState, "projects" | "tasks">) => {
  state = { ...state, ...next, applied: [...state.applied, idempotencyKey] };
  addLog(`${label}: saved (key ${idempotencyKey.slice(0, 8)})`);
};

const badRequest = () => ({ error: new Error("Missing payload"), status: 400 });

getProjects.setMock(() => ({ data: state.projects, status: 200 }), latency);
getTasks.setMock(() => ({ data: state.tasks, status: 200 }), latency);

createProject.setMock(({ request }) => {
  if (!request.payload) return badRequest();
  const { idempotencyKey, ...project } = request.payload;
  const label = `POST /projects "${project.name}"`;
  const failed = failure(label, idempotencyKey);
  if (failed) return failed;
  if (!isDuplicate(label, idempotencyKey)) {
    apply(label, idempotencyKey, { projects: [...state.projects, project], tasks: state.tasks });
  }
  return { data: project, status: 201 };
}, latency);

createTask.setMock(({ request }) => {
  if (!request.payload) return badRequest();
  const { idempotencyKey, ...task } = request.payload;
  const label = `POST /tasks "${task.title}"`;
  const failed = failure(label, idempotencyKey);
  if (failed) return failed;
  if (!state.projects.some((project) => project.id === task.projectId)) {
    addLog(`${label}: 422, the project does not exist`);
    return { error: new Error("Unknown project"), status: 422 };
  }
  if (!isDuplicate(label, idempotencyKey)) {
    apply(label, idempotencyKey, { projects: state.projects, tasks: [...state.tasks, task] });
  }
  return { data: task, status: 201 };
}, latency);

updateTask.setMock(({ request }) => {
  if (!request.payload) return badRequest();
  const { idempotencyKey, ...changes } = request.payload;
  const task = state.tasks.find((item) => item.id === request.params?.taskId);
  const label = `PATCH /tasks/${request.params?.taskId}`;
  if (!task) return { error: new Error("Not found"), status: 404 };
  const failed = failure(label, idempotencyKey);
  if (failed) return failed;
  if (isDuplicate(label, idempotencyKey)) return { data: task, status: 200 };
  const updated = { ...task, ...changes };
  apply(label, idempotencyKey, {
    projects: state.projects,
    tasks: state.tasks.map((item) => (item.id === updated.id ? updated : item)),
  });
  return { data: updated, status: 200 };
}, latency);
