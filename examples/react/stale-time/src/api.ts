import { Time, createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Post = { id: number; title: string; body: string };

/**
 * Short times so you can watch them run out:
 * - `staleTime`: for 10 seconds after a response, the cached post counts as fresh and is not fetched again.
 * - `cacheTime`: 30 seconds after a response, the cached post is removed.
 */
export const getPostRequest = client.createRequest<{ response: Post }>()({
  endpoint: "/posts/:postId",
  staleTime: 10 * Time.SEC,
  cacheTime: 30 * Time.SEC,
});
