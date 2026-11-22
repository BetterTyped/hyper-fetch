/**
 * @vitest-environment node
 */
/* oxlint-disable max-params -- route handlers follow the e2e server's signature */
import { createSdk } from "@hyper-fetch/core";
import type { RequestModel } from "@hyper-fetch/core";
import { collection, createDb, eq } from "@hyper-fetch/db";
import type { DbOptions } from "@hyper-fetch/db";
import { createE2EServer, createWebsocketE2EServer, waitForConnection } from "@hyper-fetch/testing";

import type { Post, PostSummary } from "../utils/fixtures";
import {
  PostSchema,
  PostSummarySchema,
  createHttpClient,
  createListeners,
  createMemoryStorage,
  createPost,
  createSocket,
  toSummary,
} from "../utils/fixtures";

type Schema = {
  teams: {
    $teamId: {
      posts: { $get: RequestModel<{ endpoint: "/teams/:teamId/posts"; response: PostSummary[] }> };
    };
  };
  posts: {
    $post: RequestModel<{ endpoint: "/posts"; response: Post; payload: Post }>;
    $postId: {
      $get: RequestModel<{ endpoint: "/posts/:postId"; response: Post }>;
      $patch: RequestModel<{ endpoint: "/posts/:postId"; response: Post; payload: Partial<Post> }>;
      $delete: RequestModel<{ endpoint: "/posts/:postId"; response: null }>;
    };
  };
};

const http = createE2EServer();
const ws = createWebsocketE2EServer();
const posts = new Map<number, Post>();
let wsUrl = "";

const json = (
  res: { writeHead: (status: number, headers: Record<string, string>) => void; end: (body: string) => void },
  status: number,
  data: unknown,
) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

/** A small backend: REST routes that change an in-memory table and broadcast every change over the socket */
const startBackend = async () => {
  http.route("GET", "/teams/:teamId/posts", (_req, res, _body, params) => {
    json(res, 200, [...posts.values()].filter((post) => post.teamId === Number(params.teamId)).map(toSummary));
  });
  http.route("GET", "/posts/:postId", (_req, res, _body, params) => {
    const post = posts.get(Number(params.postId));
    json(res, post ? 200 : 404, post ?? { message: "Not found" });
  });
  http.route("POST", "/posts", (_req, res, body) => {
    const post = JSON.parse(body.toString()) as Post;
    posts.set(post.id, post);
    ws.sendToAll(`teams/${post.teamId}/posts/created`, post);
    json(res, 200, post);
  });
  http.route("PATCH", "/posts/:postId", (_req, res, body, params) => {
    const current = posts.get(Number(params.postId));
    if (!current) {
      json(res, 404, { message: "Not found" });
      return;
    }
    const changes = JSON.parse(body.toString()) as Partial<Post>;
    if (changes.title === "") {
      json(res, 422, { message: "Title is required" });
      return;
    }
    const next = { ...current, ...changes, updatedAt: current.updatedAt + 1 };
    posts.set(next.id, next);
    ws.sendToAll(`teams/${next.teamId}/posts/changed`, next);
    json(res, 200, next);
  });
  http.route("DELETE", "/posts/:postId", (_req, res, _body, params) => {
    const current = posts.get(Number(params.postId));
    posts.delete(Number(params.postId));
    if (current) {
      ws.sendToAll(`teams/${current.teamId}/posts/deleted`, { id: current.id });
    }
    json(res, 200, null);
  });
};

/** One running app: its own client, socket and db */
const createApp = async (options: DbOptions = {}) => {
  const client = createHttpClient(http.getUrl());
  const sdk = createSdk<typeof client, Schema>(client);
  const socket = createSocket(wsUrl);
  const listeners = createListeners(socket);
  const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }) } };

  const Post = collection(PostSchema, { key: "id", version: "updatedAt" }).resource(sdk.posts, {
    item: "$postId",
    list: false,
  });
  const PostSummaryCollection = collection(PostSummarySchema, { key: "id", version: "updatedAt" })
    .load(sdk.teams.$teamId.posts.$get, {
      where: { teamId: { eq: (teamId) => ({ params: { teamId } }), required: true } },
    })
    .sync(listeners.onPostCreated, { type: "insert", where: byTeam, row: ({ body: _body, ...summary }) => summary })
    .sync(listeners.onPostChanged, { type: "update", where: byTeam, row: ({ body: _body, ...changes }) => changes })
    .sync(listeners.onPostDeleted, { type: "delete", where: byTeam });
  const PostLive = Post.sync(listeners.onPostChanged, { type: "update", where: byTeam });

  const db = createDb({ post: PostLive, postSummary: PostSummaryCollection }, options);
  await waitForConnection(socket);
  return { client, socket, db };
};

describe("E2E [ db ]", () => {
  beforeAll(async () => {
    wsUrl = await ws.startServer();
    await startBackend();
    await http.startServer();
  });

  beforeEach(() => {
    posts.clear();
    [createPost(1), createPost(2), createPost(3, { teamId: 2 })].forEach((post) => posts.set(post.id, post));
  });

  afterAll(async () => {
    await http.stopServer();
    await ws.stopServer();
  });

  it("keeps two apps in step through the backend's socket events", async () => {
    const alice = await createApp();
    const bob = await createApp();

    const aliceList = alice.db.postSummary.where((post) => eq(post.teamId, 1)).orderBy((post) => post.id);
    const bobList = bob.db.postSummary.where((post) => eq(post.teamId, 1)).orderBy((post) => post.id);
    const stopAlice = aliceList.subscribe(() => {});
    const stopBob = bobList.subscribe(() => {});
    await vi.waitFor(() => expect(aliceList.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2]));
    await vi.waitFor(() => expect(bobList.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2]));

    const created = await alice.db.post.insert(createPost(4));
    expect(created.success).toBeTrue();
    await vi.waitFor(() => expect(bobList.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 4]));

    await alice.db.post.update(1, { title: "Renamed by Alice" });
    await vi.waitFor(() => expect(bobList.getSnapshot().data?.[0].title).toBe("Renamed by Alice"));

    await bob.db.post.delete(2);
    await vi.waitFor(() => expect(aliceList.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 4]));

    stopAlice();
    stopBob();
    alice.db.destroy();
    bob.db.destroy();
    await alice.socket.disconnect();
    await bob.socket.disconnect();
  });

  it("shows the list's fields at once on the detail screen and loads the rest", async () => {
    const app = await createApp();
    const list = app.db.postSummary.where((post) => eq(post.teamId, 1));
    const stopList = list.subscribe(() => {});
    await vi.waitFor(() => expect(list.getSnapshot().status).toBe("ready"));

    const header = app.db.postSummary.findOne(1).local();
    const body = app.db.post.findOne(1);
    const stopHeader = header.subscribe(() => {});
    const stopBody = body.subscribe(() => {});
    expect(header.getSnapshot().data?.title).toBe("Post 1");
    expect(body.getSnapshot().status).toBe("loading");
    await vi.waitFor(() => expect(body.getSnapshot().data?.body).toBe("Body of post 1"));

    await app.db.post.update(1, { title: "Live title" });
    await vi.waitFor(() => expect(header.getSnapshot().data?.title).toBe("Live title"));

    stopList();
    stopHeader();
    stopBody();
    app.db.destroy();
    await app.socket.disconnect();
  });

  it("joins rows loaded by key and updates them with writes and socket events", async () => {
    const alice = await createApp();
    const bob = await createApp();
    const list = alice.db.postSummary
      .where((post) => eq(post.teamId, 1))
      .orderBy((post) => post.id)
      .join("full", alice.db.post, (post) => post.id);
    const stop = list.subscribe(() => {});
    await vi.waitFor(() =>
      expect(list.getSnapshot().data?.map((post) => post.full?.body)).toStrictEqual([
        "Body of post 1",
        "Body of post 2",
      ]),
    );

    await alice.db.post.update(2, { body: "Edited by Alice" });
    expect(list.getSnapshot().data?.[1].full?.body).toBe("Edited by Alice");

    await bob.db.post.update(1, { title: "Renamed by Bob" });
    await vi.waitFor(() => expect(list.getSnapshot().data?.[0].title).toBe("Renamed by Bob"));
    // The joined post was read by key, and its team's subscription keeps it live too
    await vi.waitFor(() => expect(list.getSnapshot().data?.[0].full?.title).toBe("Renamed by Bob"));

    stop();
    alice.db.destroy();
    bob.db.destroy();
    await alice.socket.disconnect();
    await bob.socket.disconnect();
  });

  it("reverts a rejected write and reports it", async () => {
    const app = await createApp();
    const detail = app.db.post.findOne(1);
    const stop = detail.subscribe(() => {});
    await vi.waitFor(() => expect(detail.getSnapshot().data?.title).toBe("Post 1"));
    const errors: unknown[] = [];
    app.db.onError((event) => errors.push(event));
    const result = await app.db.post.update(1, { title: "" });
    expect(result.success).toBeFalse();
    expect(detail.getSnapshot().data?.title).toBe("Post 1");
    expect(errors).toHaveLength(1);
    stop();
    app.db.destroy();
    await app.socket.disconnect();
  });

  it("replays offline writes after a restart and restores persisted rows", async () => {
    const storage = createMemoryStorage();
    const first = await createApp({ offline: { retryDelay: () => 10 }, persistence: { storage }, tabs: false });
    const list = first.db.postSummary.where((post) => eq(post.teamId, 1));
    const stopList = list.subscribe(() => {});
    await vi.waitFor(() => expect(list.getSnapshot().status).toBe("ready"));
    const detail = first.db.post.findOne(1);
    const stopDetail = detail.subscribe(() => {});
    await vi.waitFor(() => expect(detail.getSnapshot().data?.id).toBe(1));
    first.client.appManager.setOnline(false);
    first.db.post.update(1, { title: "Written offline" });
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(posts.get(1)?.title).toBe("Post 1");
    stopList();
    stopDetail();
    first.db.destroy();
    await first.socket.disconnect();

    const second = await createApp({ offline: { retryDelay: () => 10 }, persistence: { storage }, tabs: false });
    const restored = second.db.postSummary.where((post) => eq(post.teamId, 1));
    const stopRestored = restored.subscribe(() => {});
    await second.db.ready;
    await vi.waitFor(() => expect(posts.get(1)?.title).toBe("Written offline"), { timeout: 3000 });
    await vi.waitFor(
      () => expect(restored.getSnapshot().data?.find((post) => post.id === 1)?.title).toBe("Written offline"),
      { timeout: 3000 },
    );
    stopRestored();
    second.db.destroy();
    await second.socket.disconnect();
  });
});
