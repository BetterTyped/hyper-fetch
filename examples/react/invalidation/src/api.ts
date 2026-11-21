import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

type Post = { id: number; title: string };
type User = { id: number; firstName: string; lastName: string };
type ListQuery = { limit: number; select: string };

export const getPostsRequest = client
  .createRequest<{
    response: { posts: Post[] };
    queryParams: ListQuery & { sortBy: "id"; order: "desc" };
  }>()({
    endpoint: "/posts",
  })
  // `select` is a dummyjson query param: the API returns only these fields.
  .setQueryParams({ limit: 3, select: "title", sortBy: "id", order: "desc" });

export const getUserPostsRequest = client
  .createRequest<{
    response: { posts: Post[] };
    queryParams: ListQuery;
  }>()({ endpoint: "/posts/user/:userId" })
  .setParams({ userId: 1 })
  .setQueryParams({ limit: 3, select: "title" });

export const getUsersRequest = client
  .createRequest<{
    response: { users: User[] };
    queryParams: ListQuery;
  }>()({ endpoint: "/users" })
  .setQueryParams({ limit: 3, select: "firstName,lastName" });

export const createPostRequest = client.createRequest<{
  response: Post;
  payload: { title: string; userId: number };
}>()({ endpoint: "/posts/add", method: "POST" });
