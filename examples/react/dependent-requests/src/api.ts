import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type User = { id: number; firstName: string; lastName: string; email: string };
export type Post = { id: number; title: string };
export type Todo = { id: number; todo: string; completed: boolean };

/** Step 1: find the user by username. The id is not known until this response arrives. */
export const findUser = client.createRequest<{
  response: { users: User[] };
  // `delay` slows dummyjson down so the waiting steps are easy to see.
  queryParams: { key: "username"; value: string; select: string; delay: number };
}>()({
  endpoint: "/users/filter",
});

/** Step 2: both requests need the `userId` from step 1. */
export const getUserPosts = client.createRequest<{ response: { posts: Post[] } }>()({
  endpoint: "/posts/user/:userId",
});

export const getUserTodos = client.createRequest<{ response: { todos: Todo[] } }>()({
  endpoint: "/todos/user/:userId",
});
