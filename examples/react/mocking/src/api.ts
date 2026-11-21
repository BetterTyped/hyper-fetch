import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = { id: number; todo: string; completed: boolean };

/** The real endpoint. Until the backend ships it, a mock answers instead. */
export const getTodos = client.createRequest<{
  response: { todos: Todo[]; total: number };
  queryParams: { limit: number };
}>()({
  endpoint: "/todos",
});

export type Scenario = "success" | "empty" | "error" | "timeout";
export type MockSettings = { scenario: Scenario; latency: number };

const fixtures: Todo[] = [
  { id: 1, todo: "Sketch the todo screen", completed: true },
  { id: 2, todo: "Build it against the mock", completed: true },
  { id: 3, todo: "Handle the empty and error states", completed: false },
  { id: 4, todo: "Switch to the real API when it is ready", completed: false },
];

/**
 * `setMock` changes this request in place, so every clone made afterwards (`setQueryParams`, hooks) uses the mock.
 * The mock goes through the full request lifecycle: loading state, progress events, cache and timeouts.
 */
export const applyMock = ({ scenario, latency }: MockSettings) => {
  getTodos.setMock(
    ({ request }) => {
      const limit = request.queryParams?.limit ?? fixtures.length;

      if (scenario === "error") return { error: new Error("Internal server error"), status: 500 };
      if (scenario === "empty") return { data: { todos: [], total: 0 }, status: 200 };
      return { data: { todos: fixtures.slice(0, limit), total: fixtures.length }, status: 200 };
    },
    scenario === "timeout"
      ? // The response would take 4s, but the mocked request times out after 1.5s.
        { requestTime: 2000, responseTime: 2000, timeout: 1500 }
      : { requestTime: latency / 2, responseTime: latency / 2 },
  );
};

/** Turns every mock of this client on or off. With mocks off, requests go to dummyjson.com. */
export const setMocking = (enabled: boolean) => client.setEnableGlobalMocking(enabled);
