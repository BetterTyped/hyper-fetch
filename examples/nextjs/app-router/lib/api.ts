import { createClient } from "@hyper-fetch/core";

/** One client for the server and the browser. On the server it runs in server mode and keeps no shared cache. */
export const client = createClient({ url: "https://dummyjson.com" });

export type Post = { id: number; title: string; body: string; views: number; tags: string[] };
export type Comment = { id: number; body: string; user: { username: string } };

const getPosts = client.createRequest<{
  response: { posts: Post[]; total: number };
  queryParams: { limit: number; select: string };
}>()({
  endpoint: "/posts",
});

/**
 * The server page and the client component must use the same request, so the cache keys match.
 * Exporting the prepared request keeps the query params in one place.
 */
// `select` is a dummyjson query param: the API returns only these fields.
export const latestPosts = getPosts.setQueryParams({ limit: 8, select: "title,body,views,tags" });

export const getPostComments = client.createRequest<{ response: { comments: Comment[] } }>()({
  endpoint: "/posts/:postId/comments",
});
