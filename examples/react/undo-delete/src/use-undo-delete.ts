import { useRef, useState } from "react";

import { client, deleteTodoRequest } from "./api";
import type { Todo } from "./api";

export const undoTime = 5000;

export type PendingDelete = { todo: Todo; status: "waiting" | "deleting" | "failed" };

/**
 * Sends the delete into a stopped queue. The optimistic removal happens at once, but the request waits.
 * Undo removes it from the queue (core rolls the list back); otherwise the queue starts after `undoTime`.
 */
export const useUndoDelete = () => {
  const [pending, setPending] = useState<PendingDelete[]>([]);
  const undoers = useRef(new Map<number, () => void>());

  const setStatus = (id: number, status: PendingDelete["status"] | null) =>
    setPending((list) =>
      status
        ? list.map((item) => (item.todo.id === id ? { ...item, status } : item))
        : list.filter((item) => item.todo.id !== id),
    );

  const deleteTodo = async (todo: Todo) => {
    const request = deleteTodoRequest.setParams({ todoId: todo.id });
    const { submitDispatcher } = client;
    // Every todo has its own queue key (the endpoint with its id), so this holds only this delete.
    const { queryKey } = request;
    let undone = false;

    submitDispatcher.stop(queryKey);
    const timer = setTimeout(() => {
      setStatus(todo.id, "deleting");
      submitDispatcher.start(queryKey);
    }, undoTime);

    undoers.current.set(todo.id, () => {
      undone = true;
      clearTimeout(timer);
      // Removing the waiting request rolls back its optimistic change. Start the queue again for later deletes.
      submitDispatcher.clearQueue(queryKey);
      submitDispatcher.start(queryKey);
    });
    setPending((list) => [...list, { todo, status: "waiting" }]);

    // Resolves after the server answers, or right after undo with `success: false`.
    const response = await request.send();
    undoers.current.delete(todo.id);

    if (response.success || undone) {
      setStatus(todo.id, null);
      return;
    }
    // The rollback already put the todo back. Keep the message on screen for a moment.
    setStatus(todo.id, "failed");
    setTimeout(() => setStatus(todo.id, null), 4000);
  };

  const undo = (id: number) => undoers.current.get(id)?.();

  return { pending, deleteTodo, undo };
};
