import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { client, getTodosRequest, updateTodoRequest } from "./api";
import type { Todo } from "./api";
import { TodoList } from "./TodoList";

const todos: Todo[] = [
  { id: 1, todo: "Write the tests", completed: false, userId: 1 },
  { id: 2, todo: "Ship the feature", completed: true, userId: 1 },
];

afterEach(() => {
  cleanup();
  // A mock is attached to the request object itself, so remove it. `client.clear()` empties the cache and queues.
  getTodosRequest.clearMock();
  updateTodoRequest.clearMock();
  client.clear();
});

describe("TodoList", () => {
  it("renders the todos from the server", async () => {
    // The mock replaces the adapter. Cache, hooks and callbacks run as with a real response.
    getTodosRequest.setMock(() => ({ data: { todos, total: 2 }, status: 200 }));

    render(<TodoList />);

    expect(screen.getByText("Loading todos...")).toBeTruthy();
    expect(await screen.findByLabelText("Write the tests")).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("Ship the feature").checked).toBe(true);
  });

  it("shows the error when the request fails", async () => {
    getTodosRequest.setMock(() => ({ error: new Error("Server is down"), status: 500 }));

    render(<TodoList />);

    expect(await screen.findByText("Could not load todos: Server is down")).toBeTruthy();
  });

  it("shows the empty state", async () => {
    getTodosRequest.setMock(() => ({ data: { todos: [], total: 0 }, status: 200 }));

    render(<TodoList />);

    expect(await screen.findByText("Nothing to do.")).toBeTruthy();
  });

  it("sends the new state when a todo is checked", async () => {
    const payloads: unknown[] = [];
    getTodosRequest.setMock(() => ({ data: { todos, total: 2 }, status: 200 }));
    // The mock receives the request, so the test can check what the component sent.
    updateTodoRequest.setMock(({ request }) => {
      payloads.push(request.payload);
      return { data: { ...todos[0], completed: true }, status: 200 };
    });

    render(<TodoList />);
    fireEvent.click(await screen.findByLabelText("Write the tests"));

    expect(await screen.findByText('Saved "Write the tests"')).toBeTruthy();
    expect(payloads).toEqual([{ completed: true }]);
    expect(screen.getByLabelText<HTMLInputElement>("Write the tests").checked).toBe(true);
  });

  it("tells the user when saving fails", async () => {
    getTodosRequest.setMock(() => ({ data: { todos, total: 2 }, status: 200 }));
    updateTodoRequest.setMock(() => ({ error: new Error("Conflict"), status: 409 }));

    render(<TodoList />);
    fireEvent.click(await screen.findByLabelText("Write the tests"));

    expect(await screen.findByText('Could not save "Write the tests"')).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("Write the tests").checked).toBe(false);
  });
});
