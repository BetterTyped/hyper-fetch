import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Post = { id: number; title: string; body: string; userId: number };

export const getPostsRequest = client.createRequest<{
  response: { posts: Post[]; total: number };
  queryParams: { limit: number; select: string };
}>()({ endpoint: "/posts" });

export const getPostRequest = client.createRequest<{ response: Post }>()({
  endpoint: "/posts/:postId",
});

export const updatePostRequest = client.createRequest<{
  response: Post;
  payload: Pick<Post, "title">;
}>()({
  endpoint: "/posts/:postId",
  method: "PATCH",
});
