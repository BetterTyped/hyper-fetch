import { AppManager, Cache, createClient, Dispatcher, Time } from "@hyper-fetch/core";

import { indexedDbCache, localStorageQueue, readPersistedCache, saveOffline, wasOffline } from "./storage";

// Read IndexedDB once before the first render. The hooks then find the data in memory right away,
// instead of sending a request while the async read is still running.
const persistedCache = await readPersistedCache();

export const client = createClient({
  url: "https://dummyjson.com",
  // Memory for fast reads, IndexedDB for every write. Both hold the same entries.
  cache: () => new Cache({ storage: new Map(persistedCache), lazyStorage: indexedDbCache }),
  // Mutations wait here while offline, and the queue outlives a reload.
  submitDispatcher: () => new Dispatcher({ storage: localStorageQueue }),
  appManager: () => new AppManager({ initiallyOnline: () => !wasOffline() }),
});

// Queued requests are sent on the "online" event. A session that starts online needs one flush.
client.submitDispatcher.flush();

export const setNetwork = (online: boolean) => {
  saveOffline(!online);
  client.appManager.setOnline(online);
};

export type Todo = { id: number; todo: string; completed: boolean };

export const getTodos = client
  .createRequest<{ response: { todos: Todo[] }; queryParams: { limit: number; select: string } }>()({
    endpoint: "/todos",
    // Persisted data is shown without a request for a day, and kept for a week.
    staleTime: Time.DAY,
    cacheTime: Time.WEEK,
  })
  .setQueryParams({ limit: 4, select: "todo,completed" });

export const addTodo = client
  .createRequest<{ response: Todo; payload: Omit<Todo, "id"> & { userId: number }; queryParams: { delay: number } }>()({
    endpoint: "/todos/add",
    method: "POST",
    // Kept in the queue while offline, sent one at a time in the order they were made.
    offline: true,
    queued: true,
    // Only the list is worth keeping. The answer goes into it below.
    cache: false,
  })
  .setQueryParams({ delay: 1000 });

// A queued todo can be sent after a reload, when no `send()` call waits for it anymore. This client-wide listener
// puts every server answer into the cached list, which writes it to IndexedDB as well.
client.requestManager.events.onResponse<typeof addTodo>(({ request, response }) => {
  const saved = response.data;
  if (request.queryKey !== addTodo.queryKey || !saved) return;
  client.cache.update(getTodos, (cached) => (cached?.data ? { data: { todos: [...cached.data.todos, saved] } } : {}));
});
