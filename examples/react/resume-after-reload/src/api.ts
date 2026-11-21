import { AppManager, createClient, Dispatcher, type DispatcherStorageType } from "@hyper-fetch/core";

const PREFIX = "hyper-fetch-queue:";
const OFFLINE_KEY = "demo-offline";

const queueKeys = () =>
  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .map((key) => key.slice(PREFIX.length));

const read = (key: string) => {
  const value = localStorage.getItem(PREFIX + key);
  return value ? JSON.parse(value) : undefined;
};

/**
 * The dispatcher queue in localStorage. `JSON.stringify` calls `request.toJSON()`, and the dispatcher turns the saved
 * JSON back into a request with `client.fromJSON()` when it reads the queue after a reload.
 */
const localStorageQueue: DispatcherStorageType = {
  set: (key, data) => localStorage.setItem(PREFIX + key, JSON.stringify(data)),
  get: read,
  keys: queueKeys,
  entries: function* () {
    for (const key of queueKeys()) yield [key, read(key)];
  },
  delete: (key) => localStorage.removeItem(PREFIX + key),
  clear: () => queueKeys().forEach((key) => localStorage.removeItem(PREFIX + key)),
};

export const client = createClient({
  url: "https://dummyjson.com",
  // Mutations go to the submit dispatcher, so that is the one that needs a persistent storage.
  submitDispatcher: () => new Dispatcher({ storage: localStorageQueue }),
  // The demo switch is saved too, so a reload while "offline" stays offline.
  appManager: () => new AppManager({ initiallyOnline: () => localStorage.getItem(OFFLINE_KEY) !== "true" }),
});

// The dispatcher only flushes its queues when the app goes online. Requests restored from the storage while the app
// is already online need one flush on start.
client.submitDispatcher.flush();

export const setNetwork = (online: boolean) => {
  localStorage.setItem(OFFLINE_KEY, String(!online));
  client.appManager.setOnline(online);
};

export type Todo = { id: number; todo: string; completed: boolean; userId: number };

export const addTodo = client
  .createRequest<{
    response: Todo;
    payload: Omit<Todo, "id">;
    queryParams: { delay: number };
  }>()({
    endpoint: "/todos/add",
    method: "POST",
    // Waits in the queue while offline instead of failing.
    offline: true,
    // Sent one by one, in the order they were made.
    queued: true,
  })
  // A slow answer, so you can watch the todos leave the queue one by one.
  .setQueryParams({ delay: 1000 });
