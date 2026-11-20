import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Quote = { id: number; quote: string; author: string };
export type Todo = { id: number; todo: string; completed: boolean };
export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

/** The requests know nothing about refreshing. That is hook behavior, set once in the Provider. */
export const getRandomQuoteRequest = client.createRequest<{
  response: Quote;
}>()({
  endpoint: "/quotes/random",
});

export const getRandomTodoRequest = client.createRequest<{ response: Todo }>()({
  endpoint: "/todos/random",
});

export const getUserRequest = client
  .createRequest<{
    response: User;
    queryParams: { select: string };
  }>()({ endpoint: "/users/:userId" })
  .setParams({ userId: 1 })
  .setQueryParams({ select: "firstName,lastName,email" });
