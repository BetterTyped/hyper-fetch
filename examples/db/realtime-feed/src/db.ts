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
export const socket = createSocketClient({ url: "hyper-fetch-db-realtime-feed", adapter: BroadcastChannelAdapter() });

/** The schema is the row type. Rows a loader, sync or write returns must match it, or the collection does not compile. */
const PostSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  author: z.string(),
  title: z.string(),
  likes: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Post = z.infer<typeof PostSchema>;

/**
 * Rows count as fresh while their syncs are live. Without a live socket they fall back to `staleTime`, so `0` makes the
 * feed report `stale` as soon as the socket drops, instead of minutes later.
 */
export const getTeamPosts = client.createRequest<{ response: Post[] }>()({
  endpoint: "/teams/:teamId/posts",
  staleTime: 0,
});

export const updatePost = client.createRequest<{ response: Post; payload: Partial<Post> }>()({
  endpoint: "/posts/:postId",
  method: "PATCH",
});

// The server publishes three topics per team: a new post, changed fields and a deleted post.
export const onPostCreated = socket.createListener<Post>()({ topic: "teams/:teamId/posts/created" });
export const onPostChanged = socket.createListener<Partial<Post> & { id: string }>()({
  topic: "teams/:teamId/posts/changed",
});
export const onPostDeleted = socket.createListener<{ id: string }>()({ topic: "teams/:teamId/posts/deleted" });

/** Turns a query's `teamId` filter into the listener's `:teamId` param, so each team listens to its own topics. */
const byTeam = { teamId: { eq: (teamId: string) => ({ params: { teamId } }) } };

/**
 * `load` reads one team's posts, so a query must name the team. The three syncs keep the loaded rows live: a new post
 * joins the list, an update changes its fields and a delete removes it, with no refetch. `version` stops a late
 * response from overwriting a newer event.
 */
const Post = collection(PostSchema, { key: "id", version: "updatedAt" })
  .load(getTeamPosts, {
    where: { teamId: { eq: (teamId) => ({ params: { teamId } }), required: true } },
  })
  .sync(onPostCreated, { type: "insert", where: byTeam })
  .sync(onPostChanged, { type: "update", where: byTeam })
  .sync(onPostDeleted, { type: "delete", where: byTeam })
  .mutate({
    update: { request: updatePost, map: (key, changes) => ({ params: { postId: key }, payload: changes }) },
  });

export const db = createDb({ post: Post });
