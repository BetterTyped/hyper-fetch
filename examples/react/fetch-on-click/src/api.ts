import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Comment = { id: number; body: string; likes: number; user: { username: string } };
export type Quote = { id: number; quote: string; author: string };

export const getPostCommentsRequest = client
  .createRequest<{ response: { comments: Comment[]; total: number } }>()({ endpoint: "/posts/:postId/comments" })
  .setParams({ postId: 1 });

export const getRandomQuoteRequest = client.createRequest<{ response: Quote }>()({
  endpoint: "/quotes/random",
});
