import { createClient } from "@hyper-fetch/core";
import { collection, createDb } from "@hyper-fetch/db";
import { createSocketClient } from "@hyper-fetch/sockets";
import { z } from "zod";

import { BroadcastChannelAdapter } from "./broadcast-adapter";

/** The base URL is never reached: `server.ts` answers every request with `setMock`. */
export const client = createClient({ url: "https://api.example.com" });

/**
 * With a real backend this is a WebSocket URL and you pass no adapter. Here the URL names the `BroadcastChannel` that
 * the fake server publishes on, so the example runs in the browser alone.
 */
export const socket = createSocketClient({ url: "hyper-fetch-db-infinite-feed", adapter: BroadcastChannelAdapter() });

/** The schema is the row type. Rows a loader, sync or write returns must match it, or the collection does not compile. */
const PostSchema = z.object({
  id: z.string(),
  author: z.string(),
  body: z.string(),
  likes: z.number(),
  createdAt: z.number(),
});
export type Post = z.infer<typeof PostSchema>;

/** One backend page: the posts and the cursor of the next page, `null` after the last one. */
export const getPosts = client.createRequest<{
  response: { items: Post[]; next: string | null };
  queryParams?: { sort?: string; cursor?: string };
}>()({ endpoint: "/posts" });

export const updatePost = client.createRequest<{ response: Post; payload: Partial<Post> }>()({
  endpoint: "/posts/:postId",
  method: "PATCH",
});

export const onPostCreated = socket.createListener<Post>()({ topic: "posts/created" });
export const onPostChanged = socket.createListener<Partial<Post> & { id: string }>()({ topic: "posts/changed" });

/**
 * `cursor` makes the loader paginated: it reads the next page's cursor from a response, and `page` sends it. A
 * paginated loader must send every order a query uses, so `orderBy` says how the endpoint sorts by `createdAt`. The
 * syncs have no `where`, so one topic of each kind keeps every loaded page current.
 */
const Post = collection(PostSchema, { key: "id" })
  .load(getPosts, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    orderBy: { createdAt: (direction) => ({ queryParams: { sort: `createdAt:${direction}` } }) },
  })
  .sync(onPostCreated, { type: "insert" })
  .sync(onPostChanged, { type: "update" })
  .mutate({
    update: { request: updatePost, map: (key, changes) => ({ params: { postId: key }, payload: changes }) },
  });

export const db = createDb({ post: Post });
