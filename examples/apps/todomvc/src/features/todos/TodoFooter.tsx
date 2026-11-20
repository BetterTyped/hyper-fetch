import { useSubmit } from "@hyper-fetch/react";

import { clearCompletedTodos } from "../../api/todos";
import type { Filter } from "./use-filter";

const filters: { value: Filter; label: string; href: string }[] = [
  { value: "all", label: "All", href: "#/" },
  { value: "active", label: "Active", href: "#/active" },
  { value: "completed", label: "Completed", href: "#/completed" },
];

type TodoFooterProps = { activeCount: number; completedCount: number; filter: Filter };

export const TodoFooter = ({ activeCount, completedCount, filter }: TodoFooterProps) => {
  const clearCompleted = useSubmit(clearCompletedTodos);

  return (
    <footer className="todo-footer">
      <small>
        <strong>{activeCount}</strong> {activeCount === 1 ? "item" : "items"} left
      </small>
      <nav>
        <ul>
          {filters.map((item) => (
            <li key={item.value}>
              <a href={item.href} aria-current={filter === item.value ? "page" : undefined}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <button
        type="button"
        className="secondary outline"
        disabled={completedCount === 0}
        onClick={() => clearCompleted.submit()}
      >
        Clear completed
      </button>
    </footer>
  );
};
