import { createClient, createSdk } from "@hyper-fetch/core";
import { TrpcAdapter, type TrpcSchema } from "@hyper-fetch/trpc";

// Type-only import: the router code never reaches the browser bundle.
import type { AppRouter } from "../server/router";

/** Points at the path where `fetchRequestHandler` is mounted in server/app.ts. */
export const client = createClient({
  url: `${window.location.origin}/api/trpc`,
}).setAdapter(TrpcAdapter());

/** Inputs, outputs and errors of every procedure come from the router type. */
export const sdk = createSdk<typeof client, TrpcSchema<AppRouter>>(client, {
  // Keep procedure names as written in the router (`todos.list`), not kebab-case.
  camelCaseToKebabCase: false,
});

// Every SDK property access builds a new request, so keep one reference per procedure.
export const listTodos = sdk.todos.list.$query;
export const addTodo = sdk.todos.add.$mutation;
export const toggleTodo = sdk.todos.toggle.$mutation;

/** Every input of `todos.list` has its own cache key, this pattern matches all of them. */
export const todoListsKey = /^QUERY_todos\.list/;
