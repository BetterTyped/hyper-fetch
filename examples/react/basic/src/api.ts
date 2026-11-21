import { createClient } from "@hyper-fetch/core";

/** One client per backend. Every request below inherits its base url, cache and queues. */
export const client = createClient({ url: "https://dummyjson.com" });

export type Post = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  views: number;
  reactions: { likes: number; dislikes: number };
};

export type Comment = {
  id: number;
  body: string;
  user: { username: string };
};

/** `queryParams` types `setQueryParams()`; the response type flows into every hook that uses the request. */
export const getPosts = client.createRequest<{
  response: { posts: Pick<Post, "id" | "title">[]; total: number };
  queryParams: { limit: number; select: string };
}>()({
  endpoint: "/posts",
});

/** `:postId` in the endpoint becomes a required, typed param: `getPost.setParams({ postId: 1 })`. */
export const getPost = client.createRequest<{ response: Post }>()({
  endpoint: "/posts/:postId",
});

export const getPostComments = client.createRequest<{ response: { comments: Comment[] } }>()({
  endpoint: "/posts/:postId/comments",
});
