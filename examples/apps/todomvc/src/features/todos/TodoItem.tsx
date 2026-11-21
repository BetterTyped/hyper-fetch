import { useSubmit } from "@hyper-fetch/react";
import { type KeyboardEvent, useState } from "react";

import { deleteTodo, type Todo, updateTodo } from "../../api/todos";

export const TodoItem = ({ todo }: { todo: Todo }) => {
  const [editing, setEditing] = useState(false);
  // The optimistic changes live on the requests: the item only calls `submit()`.
  const update = useSubmit(updateTodo);
  const remove = useSubmit(deleteTodo);
  // A negative id is a todo the server has not saved yet. It cannot be changed until it has a real id.
  const saving = todo.id < 0;

  const save = (value: string) => {
    setEditing(false);
    const title = value.trim();
    // TodoMVC: an empty title removes the todo.
    if (!title) remove.submit({ params: { todoId: todo.id } });
    else if (title !== todo.title) update.submit({ params: { todoId: todo.id }, payload: { title } });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") save(event.currentTarget.value);
    if (event.key === "Escape") setEditing(false);
  };

  if (editing) {
    return (
      <li>
        <input
          className="edit"
          defaultValue={todo.title}
          aria-label="Edit todo"
          autoFocus
          onBlur={(event) => save(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </li>
    );
  }

  return (
    <li className={todo.completed ? "completed" : undefined} aria-busy={saving}>
      <label onDoubleClick={() => !saving && setEditing(true)}>
        <input
          type="checkbox"
          checked={todo.completed}
          disabled={saving}
          onChange={() => update.submit({ params: { todoId: todo.id }, payload: { completed: !todo.completed } })}
        />
        {todo.title}
      </label>
      <button
        type="button"
        className="destroy secondary outline"
        aria-label={`Delete ${todo.title}`}
        disabled={saving}
        onClick={() => remove.submit({ params: { todoId: todo.id } })}
      >
        ×
      </button>
    </li>
  );
};
