import { createClient } from "@hyper-fetch/core";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};
export type Post = { id: number; title: string };
type ApiError = { message: string };

/**
 * `mode: "server"` is what "auto" picks outside the browser anyway. It is written out here because it changes the cache:
 * on the server nothing is cached unless a request sets a scope, so one user's data never reaches another.
 */
export const client = createClient<{ error: ApiError }>({
  url: "https://dummyjson.com",
  mode: "server",
});

export const getUsers = client
  .createRequest<{
    response: { users: User[] };
    queryParams: { limit: number; select: string };
  }>()({
    endpoint: "/users",
  })
  // `select` is a dummyjson query param: the API returns only these fields.
  .setQueryParams({ limit: 3, select: "firstName,lastName,email" });

export const getUserPosts = client.createRequest<{
  response: { posts: Post[]; total: number };
  queryParams: { limit: number; select: string };
}>()({
  endpoint: "/posts/user/:userId",
});

/** dummyjson answers `/http/<status>` with that status, which stands in for an upstream service that is down. */
export const getStatus = client
  .createRequest<{ response: { message: string } }>()({
    endpoint: "/http/:status",
  })
  .setRetry(2)
  .setRetryTime(300)
  // Retry only what can recover: server errors and network failures, never a 4xx.
  .setRetryOnError((response) => response.status === null || Number(response.status) >= 500);
