import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type NewPost = { title: string; body: string; userId?: number };
export type Post = NewPost & { id: number };

/** The shape dummyjson sends with a 4xx status, for example `{ "message": "User id is required" }`. */
export type ApiError = { message: string };

/**
 * `payload` types the `submit({ payload })` call, `error` types `error` for this endpoint.
 * dummyjson validates the post on the server and simulates the write, so nothing is saved.
 */
export const createPostRequest = client.createRequest<{
  response: Post;
  payload: NewPost;
  error: ApiError;
}>()({
  endpoint: "/posts/add",
  method: "POST",
});
