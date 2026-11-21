import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

/** dummyjson waits `delay` ms before it answers, so every card finishes at a different moment. */
type ListQuery = { limit: number; select: string; delay: number };

export type User = { id: number; firstName: string; lastName: string };
export type Post = { id: number; title: string };
export type Todo = { id: number; todo: string; completed: boolean };

export const getUsers = client.createRequest<{
  response: { users: User[]; total: number };
  queryParams: ListQuery;
}>()({ endpoint: "/users" });

export const getPosts = client.createRequest<{
  response: { posts: Post[]; total: number };
  queryParams: ListQuery;
}>()({ endpoint: "/posts" });

export const getTodos = client.createRequest<{
  response: { todos: Todo[]; total: number };
  queryParams: ListQuery;
}>()({ endpoint: "/todos" });
