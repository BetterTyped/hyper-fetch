import { useSyncExternalStore } from "react";

import type { Todo } from "../../api/todos";

export type Filter = "all" | "active" | "completed";

/** TodoMVC keeps the filter in the hash: `#/`, `#/active` and `#/completed`. Back, reload and links keep it. */
const readFilter = (): Filter => {
  const hash = window.location.hash.replace("#/", "");
  return hash === "active" || hash === "completed" ? hash : "all";
};

const subscribe = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};

export const useFilter = () => useSyncExternalStore(subscribe, readFilter);

export const filterTodos = (todos: Todo[], filter: Filter) => {
  if (filter === "active") return todos.filter((todo) => !todo.completed);
  if (filter === "completed") return todos.filter((todo) => todo.completed);
  return todos;
};
