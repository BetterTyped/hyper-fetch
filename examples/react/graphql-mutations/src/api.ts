import { createClient } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";
import type { GraphQLFormattedError } from "graphql";

/** GraphQLZero is a public fake API: mutations answer like a real server, but nothing is stored. */
export const client = createClient<{ error: GraphQLFormattedError[] }>({
  url: "https://graphqlzero.almansi.me",
}).setAdapter(GraphqlAdapter());

export type Todo = { id: string; title: string; completed: boolean };

const getTodos = client.createRequest<{
  response: { todos: { data: Todo[] } };
  payload: { options: { paginate: { page: number; limit: number } } };
}>()({
  endpoint: "/api",
  // With `document`, the endpoint is the URL path and the operation is sent as `query`.
  document: /* GraphQL */ `
    query Todos($options: PageQueryOptions) {
      todos(options: $options) {
        data {
          id
          title
          completed
        }
      }
    }
  `,
});

/** The variables are a part of the cache key, so the hook and the cache updates use this one request. */
export const todosQuery = getTodos.setPayload({
  options: { paginate: { page: 1, limit: 6 } },
});

// Mutations are requests too: the document holds the operation, the payload holds the variables.
export const createTodo = client.createRequest<{
  response: { createTodo: Todo };
  payload: { input: { title: string; completed: boolean } };
}>()({
  endpoint: "/api",
  document: /* GraphQL */ `
    mutation CreateTodo($input: CreateTodoInput!) {
      createTodo(input: $input) {
        id
        title
        completed
      }
    }
  `,
});

export const updateTodo = client.createRequest<{
  response: { updateTodo: Pick<Todo, "completed"> };
  payload: { id: string; input: { completed: boolean } };
}>()({
  endpoint: "/api",
  document: /* GraphQL */ `
    mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
      updateTodo(id: $id, input: $input) {
        completed
      }
    }
  `,
});

export const deleteTodo = client.createRequest<{
  response: { deleteTodo: boolean };
  payload: { id: string };
}>()({
  endpoint: "/api",
  document: /* GraphQL */ `
    mutation DeleteTodo($id: ID!) {
      deleteTodo(id: $id)
    }
  `,
});

/** Writes the result of a mutation into the cached list. Every `useFetch(todosQuery)` re-renders, no request is sent. */
export const updateCachedTodos = (change: (todos: Todo[]) => Todo[]) => {
  client.cache.update(todosQuery, (cached) =>
    cached?.data ? { data: { todos: { data: change(cached.data.todos.data) } } } : {},
  );
};
