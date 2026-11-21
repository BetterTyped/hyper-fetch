import { useFetch, useSubmit } from "@hyper-fetch/react";
import type { FormEvent } from "react";

import { createTodo, getTodos, toggleAllTodos } from "../../api/todos";
import { TodoFooter } from "./TodoFooter";
import { TodoItem } from "./TodoItem";
import { filterTodos, useFilter } from "./use-filter";

export const TodoApp = () => {
  const filter = useFilter();
  const { data: todos, error, loading, refetch } = useFetch(getTodos);
  const create = useSubmit(createTodo);
  const toggleAll = useSubmit(toggleAllTodos);

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = String(new FormData(form).get("title") ?? "").trim();
    if (!title) return;
    create.submit({ payload: { title } });
    form.reset();
  };

  if (loading && !todos) return <p aria-busy="true">Loading todos...</p>;
  if (error && !todos) {
    return (
      <p className="error">
        Could not load todos: {error.message}{" "}
        <button type="button" className="outline" onClick={refetch}>
          Try again
        </button>
      </p>
    );
  }

  const list = todos ?? [];
  const activeCount = list.filter((todo) => !todo.completed).length;
  const allCompleted = list.length > 0 && activeCount === 0;

  return (
    <article className="todoapp">
      <header>
        <form onSubmit={handleAdd} className="new-todo">
          {list.length > 0 && (
            <input
              type="checkbox"
              checked={allCompleted}
              aria-label="Mark all as complete"
              onChange={() => toggleAll.submit({ payload: { completed: !allCompleted } })}
            />
          )}
          <input name="title" placeholder="What needs to be done?" aria-label="New todo" autoFocus />
        </form>
      </header>
      <ul className="todo-list">
        {filterTodos(list, filter).map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
      {list.length > 0 && (
        <TodoFooter activeCount={activeCount} completedCount={list.length - activeCount} filter={filter} />
      )}
    </article>
  );
};
