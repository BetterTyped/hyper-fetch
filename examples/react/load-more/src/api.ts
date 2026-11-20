import { createClient } from "@hyper-fetch/core";
import type { Pagination } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Post = { id: number; title: string; views: number };

export const getPosts = client.createRequest<{
  response: { posts: Post[]; total: number };
  queryParams: { limit: number; skip?: number; select: string };
}>()({
  endpoint: "/posts",
});

/** Offset paging: each page adds `limit` to `skip`. `total` tells the hook where the list ends. */
export const postsPagination = {
  offset: "skip",
  limit: "limit",
  items: "posts",
  total: "total",
} satisfies Pagination<typeof getPosts>;
