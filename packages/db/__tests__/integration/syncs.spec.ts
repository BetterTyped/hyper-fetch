import { collection, createDb, eq } from "@hyper-fetch/db";
import type { StandardSchemaV1 } from "@hyper-fetch/db";
import { createE2EServer, createWebsocketE2EServer, waitForConnection } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import {
  PostSchema,
  PostSummarySchema,
  SOCKET_URL,
  createE2EApi,
  createHttpClient,
  createListeners,
  createPost,
  createRequests,
  createSocket,
  deferred,
  flush,
  toSummary,
} from "../utils/fixtures";

const http = createE2EServer();
let routes = createE2EApi(http);
const ws = createWebsocketE2EServer();
let socketUrl = SOCKET_URL;

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };
const byTeamTopic = { teamId: { eq: (teamId: number) => ({ params: { teamId } }) } };

const send = (topic: string, data: unknown) => ws.sendToAll(topic, data);

const setup = async ({ version = false, resumes = false, gcTime = 1000 } = {}) => {
  const client = createHttpClient(http.getUrl());
  const requests = createRequests(client);
  const socket = createSocket(socketUrl);
  const listeners = createListeners(socket);
  routes.reset();
  requests.getTeamFullPosts.staleTime = 0;
  const Full = collection(PostSchema, { key: "id", ...(version ? { version: "updatedAt" as const } : {}) })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) })
    .load(requests.getAllPosts, {
      rows: (response) => response.items,
      cursor: (response) => response.next,
      page: (cursor) => ({ queryParams: { cursor } }),
      orderBy: { createdAt: (direction) => ({ queryParams: { sort: direction } }) },
    })
    .sync(listeners.onPostCreated, { type: "insert", where: byTeamTopic, resumes })
    .sync(listeners.onPostChanged, { type: "update", where: byTeamTopic, resumes })
    .sync(listeners.onPostDeleted, { type: "delete", where: byTeamTopic, key: (message) => message.id, resumes })
    .sync(listeners.onAnyPostCreated, { type: "insert", resumes })
    .sync(listeners.onAnyPostChanged, { type: "update", incomplete: "refetch", resumes })
    .sync(listeners.onAnyPostDeleted, { type: "delete", key: (message) => message.postId, resumes });
  const Summary = collection(PostSummarySchema, { key: "id" })
    .load(requests.getTeamPosts, { where: byTeam })
    .sync(listeners.onPostChanged, {
      type: "update",
      where: byTeamTopic,
      row: ({ body: _body, ...changes }) => changes,
    })
    .sync(listeners.onAnyPostChanged, {
      type: "update",
      incomplete: "refetch",
      row: ({ body: _body, ...changes }) => changes,
    })
    .sync(listeners.onAnyPostCreated, { type: "insert", row: ({ body: _body, ...summary }) => summary });
  const asyncSchema: StandardSchemaV1<Post, Post> = {
    "~standard": {
      version: 1,
      vendor: "test",
      validate: async (value) => ({ value: value as Post }),
    },
  };
  const Synced = collection(PostSchema, { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .sync(listeners.onAnyPostChanged, { type: "update" })
    .sync(listeners.onAnyPostCreated, { type: "insert" })
    .sync(listeners.onPostDeleted, { type: "delete", where: byTeamTopic })
    .mutate({
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
        onSuccess: "sync",
      },
    });
  const Checked = collection(asyncSchema, { key: "id", validate: "all" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .sync(listeners.onAnyPostCreated, { type: "insert" })
    .syncChanges(listeners.onTeamChanges, { changes: ({ data }) => data });
  const db = createDb({ full: Full, summary: Summary, synced: Synced, checked: Checked }, { gcTime, syncTimeout: 300 });
  await waitForConnection(socket);
  return { api: routes, db, socket, requests };
};

type Context = Awaited<ReturnType<typeof setup>>;

const loadTeam = async (context: Context, posts = [createPost(1), createPost(2)]) => {
  context.api.get("/teams/:teamId/full-posts", () => ({ data: { items: posts } }));
  const query = context.db.full.where((post) => eq(post.teamId, 1)).orderBy((post) => post.likes);
  const unsubscribe = query.subscribe(() => {});
  await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
  return { query, unsubscribe };
};

const ids = (state: { data: { id: number }[] | undefined }) => state.data?.map((post) => post.id);

describe("db [ Syncs ]", () => {
  let context: Context;

  beforeAll(async () => {
    socketUrl = await ws.startServer();
    await http.startServer();
    routes = createE2EApi(http);
  });
  beforeEach(async () => {
    context = await setup();
  });
  afterEach(async () => {
    context.db.destroy();
    await context.socket.disconnect();
  });
  afterAll(async () => {
    await http.stopServer();
    await ws.stopServer();
  });

  it("applies inserts, partial updates and deletes to every query that shows the row", async () => {
    const { query, unsubscribe } = await loadTeam(context);
    expect(query.getSnapshot().stale).toBeFalse();
    expect(query.explain().syncs.map((sync) => sync.topic)).toIncludeAllMembers([
      "teams/1/posts/created",
      "teams/1/posts/changed",
      "teams/1/posts/deleted",
    ]);

    send("teams/1/posts/created", createPost(3, { likes: 0 }));
    await vi.waitFor(() => expect(ids(query.getSnapshot())).toStrictEqual([3, 1, 2]));

    send("teams/1/posts/changed", { id: 1, title: "Renamed" });
    await vi.waitFor(() => expect(query.getSnapshot().data?.[1].title).toBe("Renamed"));
    expect(query.getSnapshot().data?.[1].body).toBe("Body of post 1");

    send("teams/1/posts/changed", { id: 2, teamId: 2 });
    await vi.waitFor(() => expect(ids(query.getSnapshot())).toStrictEqual([3, 1]));

    send("teams/1/posts/deleted", { id: 3 });
    await vi.waitFor(() => expect(ids(query.getSnapshot())).toStrictEqual([1]));
    unsubscribe();
  });

  it("keeps each sync to the filters it covers", async () => {
    const { query, unsubscribe } = await loadTeam(context);
    send("teams/2/posts/created", createPost(9, { teamId: 1 }));
    send("teams/2/posts/changed", { id: 1, title: "Other team" });
    await flush();
    expect(ids(query.getSnapshot())).toStrictEqual([1, 2]);
    expect(query.getSnapshot().data?.[0].title).toBe("Post 1");
    unsubscribe();
  });

  it("ignores an update for a row the collection does not hold, unless it refetches incomplete rows", async () => {
    const { db, api } = context;
    const summary = db.summary.findOne(7).local();
    const unsubscribeSummary = summary.subscribe(() => {});
    api.get("/teams/:teamId/posts", () => ({ data: [] }));
    const team = db.summary.where((post) => eq(post.teamId, 1));
    const unsubscribeTeam = team.subscribe(() => {});
    await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));
    send("teams/1/posts/changed", { id: 7, title: "Unknown" });
    send("posts/changed", { id: 7, title: "No key loader to refetch with" });
    await flush();
    expect(summary.getSnapshot().data).toBeUndefined();

    api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId), { title: "Loaded" }) }));
    const detail = db.full.findOne(7);
    const unsubscribeDetail = detail.subscribe(() => {});
    await vi.waitFor(() => expect(detail.getSnapshot().data?.title).toBe("Loaded"));
    send("posts/changed", { id: 8, title: "Refetched" });
    await vi.waitFor(() => expect(api.callsTo("/posts/8")).toHaveLength(1));
    await vi.waitFor(() => expect(db.full.findOne(8).local().getSnapshot().data?.id).toBe(8));

    send("posts/changed", { id: 7, title: "Live" });
    await vi.waitFor(() => expect(detail.getSnapshot().data?.title).toBe("Live"));
    send("posts/deleted", { postId: 7 });
    await vi.waitFor(() => expect(detail.getSnapshot().data).toBeUndefined());
    unsubscribeSummary();
    unsubscribeTeam();
    unsubscribeDetail();
  });

  it("syncs one listener into several collections", async () => {
    const { db, api } = context;
    api.get("/teams/:teamId/posts", () => ({ data: [toSummary(createPost(1))] }));
    const team = db.summary.where((post) => eq(post.teamId, 1));
    const unsubscribeTeam = team.subscribe(() => {});
    await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));
    const { query, unsubscribe } = await loadTeam(context);

    send("teams/1/posts/changed", { id: 1, title: "Both" });
    await vi.waitFor(() => expect(team.getSnapshot().data?.[0].title).toBe("Both"));
    expect(query.getSnapshot().data?.[0].title).toBe("Both");

    send("posts/created", createPost(5));
    await vi.waitFor(() => expect(team.getSnapshot().data).toHaveLength(2));
    expect(team.getSnapshot().data?.[1]).not.toHaveProperty("body");
    unsubscribeTeam();
    unsubscribe();
  });

  it("buffers events that arrive while a subset loads and applies them after the response", async () => {
    const { api, db } = context;
    const release = deferred();
    api.get("/teams/:teamId/full-posts", async () => {
      await release.promise;
      return { data: { items: [createPost(1)] } };
    });
    const query = db.full.where((post) => eq(post.teamId, 1));
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(api.callsTo("/teams/1/full-posts")).toHaveLength(1));
    await flush();
    send("teams/1/posts/changed", { id: 1, title: "From the event" });
    await flush();
    release.resolve();
    await vi.waitFor(() => expect(query.getSnapshot().data?.[0].title).toBe("From the event"));
    unsubscribe();
  });

  it("never lets a response overwrite a newer event or bring back a deleted row", async () => {
    const { api } = context;
    const { query, unsubscribe } = await loadTeam(context);
    const release = deferred();
    api.get("/teams/:teamId/full-posts", async () => {
      await release.promise;
      return { data: { items: [createPost(1), createPost(2)] } };
    });
    const refetch = query.refetch();
    await vi.waitFor(() => expect(api.callsTo("/teams/1/full-posts")).toHaveLength(2));
    await flush();
    query.getSnapshot();
    release.resolve();
    await refetch;
    expect(ids(query.getSnapshot())).toStrictEqual([1, 2]);
    unsubscribe();
  });

  it("orders writes by version when the collection has one", async () => {
    context.db.destroy();
    context = await setup({ version: true });
    const { api } = context;
    const { query, unsubscribe } = await loadTeam(context, [createPost(1, { updatedAt: 1 })]);
    send("teams/1/posts/changed", { id: 1, title: "Version 5", updatedAt: 5 });
    await vi.waitFor(() => expect(query.getSnapshot().data?.[0].title).toBe("Version 5"));

    api.get("/teams/:teamId/full-posts", () => ({
      data: { items: [createPost(1, { title: "Version 3", updatedAt: 3 })] },
    }));
    await query.refetch();
    expect(query.getSnapshot().data?.[0].title).toBe("Version 5");

    api.get("/teams/:teamId/full-posts", () => ({
      data: { items: [createPost(1, { title: "Version 7", updatedAt: 7 })] },
    }));
    await query.refetch();
    expect(query.getSnapshot().data?.[0].title).toBe("Version 7");
    unsubscribe();
  });

  it("goes stale while the socket is disconnected and refetches after it reconnects", async () => {
    const { api, socket } = context;
    const { query, unsubscribe } = await loadTeam(context);
    await socket.disconnect();
    await vi.waitFor(() => expect(query.getSnapshot().stale).toBeTrue());
    socket.connect();
    await waitForConnection(socket);
    await vi.waitFor(() => expect(api.callsTo("/teams/1/full-posts")).toHaveLength(2));
    unsubscribe();
  });

  it("goes stale when the socket disconnects, even while its last load is within staleTime", async () => {
    const { requests, socket } = context;
    requests.getTeamFullPosts.staleTime = 60_000;
    const { query, unsubscribe } = await loadTeam(context);
    expect(query.getSnapshot().stale).toBeFalse();

    await socket.disconnect();
    await vi.waitFor(() => expect(query.getSnapshot().stale).toBeTrue());
    unsubscribe();
  });

  it("does not refetch after a reconnect when the subscription resumes", async () => {
    context.db.destroy();
    context = await setup({ resumes: true });
    const { api, socket } = context;
    const { query, unsubscribe } = await loadTeam(context);
    await socket.disconnect();
    socket.connect();
    await waitForConnection(socket);
    await flush();
    expect(api.callsTo("/teams/1/full-posts")).toHaveLength(1);
    expect(query.getSnapshot().stale).toBeFalse();
    unsubscribe();
  });

  it("adds an inserted row to a paginated subset only inside its loaded range", async () => {
    const { api, db } = context;
    api.get("/all-posts", ({ url }) =>
      url.searchParams.get("cursor")
        ? { data: { items: [createPost(9, { createdAt: "2026-09-09" })], next: null } }
        : { data: { items: [createPost(1), createPost(3)], next: "next" } },
    );
    const query = db.full.orderBy((post) => post.createdAt);
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));

    send("posts/created", createPost(2));
    send("posts/created", createPost(8, { createdAt: "2026-08-08" }));
    await vi.waitFor(() => expect(ids(query.getSnapshot())).toStrictEqual([1, 2, 3]));

    await query.fetchNextPage();
    send("posts/created", createPost(10, { createdAt: "2026-10-10" }));
    await vi.waitFor(() => expect(ids(query.getSnapshot())).toStrictEqual([1, 2, 3, 9, 10]));

    // A refetch reloads both pages, keeps the inserted row the server returns and releases the one it does not
    api.get("/all-posts", ({ url }) =>
      url.searchParams.get("cursor")
        ? { data: { items: [createPost(9, { createdAt: "2026-09-09" })], next: null } }
        : { data: { items: [createPost(1), createPost(2), createPost(3)], next: "next" } },
    );
    await query.refetch();
    expect(ids(query.getSnapshot())).toStrictEqual([1, 2, 3, 9]);
    unsubscribe();
  });

  it("stops a subscription when no subset uses it", async () => {
    context.db.destroy();
    context = await setup({ gcTime: 10 });
    const { query, unsubscribe } = await loadTeam(context);
    unsubscribe();
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(query.explain().syncs).toStrictEqual([]);
  });

  it("keeps an optimistic update until its sync event arrives, or refetches after the timeout", async () => {
    const { api, db } = context;
    api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
    const query = db.synced.where((post) => eq(post.teamId, 1));
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    const release = deferred();
    api.patch("/posts/:postId", async ({ params }) => {
      if (params.postId === "1") {
        await release.promise;
      }
      return { data: null };
    });

    const confirmed = db.synced.update(1, { title: "Confirmed" });
    await vi.waitFor(() => expect(api.callsTo("/posts/1", "patch")).toHaveLength(1));
    expect(query.getSnapshot().data?.[0].title).toBe("Confirmed");
    send("posts/changed", { id: 1, title: "Confirmed" });
    await vi.waitFor(() => expect(query.getSnapshot().data?.[0].title).toBe("Confirmed"));
    await flush();
    release.resolve();
    expect(await confirmed).toMatchObject({ success: true });

    const later = db.synced.update(1, { likes: 7 });
    await vi.waitFor(() => expect(api.callsTo("/posts/1", "patch")).toHaveLength(2));
    await flush();
    send("posts/changed", { id: 1, likes: 7 });
    expect(await later).toMatchObject({ success: true });
    expect(api.callsTo("/teams/1/full-posts")).toHaveLength(1);

    api.get("/teams/:teamId/full-posts", () => ({
      data: { items: [createPost(1, { title: "Confirmed" }), createPost(2, { title: "Server" })] },
    }));
    expect(await db.synced.update(2, { title: "Unconfirmed" })).toMatchObject({ success: true });
    expect(api.callsTo("/teams/1/full-posts")).toHaveLength(2);
    expect(query.getSnapshot().data?.[1].title).toBe("Server");

    send("teams/1/posts/deleted", { id: 2 });
    await vi.waitFor(() => expect(query.getSnapshot().data).toHaveLength(1));
    unsubscribe();
  });

  it("validates sync events with an async schema", async () => {
    const { api, db } = context;
    api.get("/teams/:teamId/full-posts", () => ({ data: { items: [] } }));
    const team = db.checked.where((post) => eq(post.teamId, 1));
    const unsubscribeTeam = team.subscribe(() => {});
    await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));
    send("posts/created", createPost(3));
    await vi.waitFor(() => expect(team.getSnapshot().data?.map((post) => post.id)).toStrictEqual([3]));
    send("teams/:teamId/changes", { upsert: [createPost(4)], delete: [3] });
    await vi.waitFor(() => expect(team.getSnapshot().data?.map((post) => post.id)).toStrictEqual([4]));
    unsubscribeTeam();
  });

  it("marks unused subsets stale on reconnect without refetching them, and treats a first connection as no reconnect", async () => {
    const client = createHttpClient(http.getUrl());
    const requests = createRequests(client);
    const socket = createSocket(socketUrl);
    const listeners = createListeners(socket);
    routes.reset();
    routes.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
    const Lazy = collection(PostSchema, { key: "id" })
      .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
      .sync(listeners.onAnyPostChanged, { type: "update" });
    const db = createDb({ lazy: Lazy }, { gcTime: 1000 });
    const query = db.lazy.where((post) => eq(post.teamId, 1));
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    await waitForConnection(socket);
    expect(routes.callsTo("/teams/1/full-posts")).toHaveLength(1);
    unsubscribe();
    await socket.disconnect();
    socket.connect();
    await waitForConnection(socket);
    await flush();
    expect(routes.callsTo("/teams/1/full-posts")).toHaveLength(1);
    db.destroy();
    await socket.disconnect();
  });

  it("applies changes events, covers every subset through a notation and leaves writes to the backend", async () => {
    const client = createHttpClient(http.getUrl());
    const requests = createRequests(client);
    const socket = createSocket(socketUrl);
    const listeners = createListeners(socket);
    routes.reset();
    const Changes = collection(PostSchema, { key: "id" })
      .load(requests.getTeamFullPosts, {
        rows: (response) => response.items,
        notation: {
          where: { eq: (field, value) => ({ params: { [field]: value } }) },
          orderBy: (field, direction) => ({ queryParams: { sort: `${field}:${direction}` } }),
        },
      })
      .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) })
      .syncChanges(listeners.onTeamChanges, {
        changes: ({ data }) => data,
        notation: (conditions) => ({
          params: Object.fromEntries(conditions.map((condition) => [condition.field, condition.value])),
        }),
      })
      .mutate({
        update: {
          request: requests.updatePostRequest,
          map: (key, changes) => ({ params: { postId: key }, payload: changes }),
          optimistic: false,
          outbox: false,
          onSuccess: "keep",
        },
      });
    const db = createDb({ changes: Changes });
    await waitForConnection(socket);
    routes.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
    routes.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId), { title: "Refetched" }) }));
    routes.patch("/posts/:postId", () => ({ data: null }));

    const query = db.changes.where((post) => eq(post.teamId, 1)).orderBy((post) => post.likes);
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    expect(routes.callsTo("/teams/1/full-posts")[0].url.searchParams.get("sort")).toBe("likes:asc");
    expect(query.explain().syncs).toStrictEqual([{ type: "changes", topic: "teams/1/changes" }]);
    expect(query.getSnapshot().stale).toBeFalse();

    send("teams/1/changes", { upsert: [createPost(3)], delete: [2], refetch: [1] });
    await vi.waitFor(() => expect(ids(query.getSnapshot())).toStrictEqual([1, 3]));
    await vi.waitFor(() => expect(query.getSnapshot().data?.[0].title).toBe("Refetched"));

    const write = db.changes.update(3, { title: "Saved" });
    expect(query.getSnapshot().data?.[1].title).toBe("Post 3");
    expect(await write).toMatchObject({ success: true });
    expect(query.getSnapshot().data?.[1].title).toBe("Saved");

    // A notation sync never listens to the whole collection for one row
    const one = db.changes.findOne(1);
    const stopOne = one.subscribe(() => {});
    expect(one.explain().syncs).toStrictEqual([]);
    stopOne();
    unsubscribe();
    db.destroy();
    await socket.disconnect();
  });

  it("reports a sync event its mapping cannot read and keeps applying the next ones", async () => {
    const client = createHttpClient(http.getUrl());
    const requests = createRequests(client);
    const socket = createSocket(socketUrl);
    const listeners = createListeners(socket);
    routes.reset();
    const Strict = collection(PostSchema, { key: "id" })
      .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
      .sync(listeners.onPostChanged, {
        type: "update",
        where: byTeamTopic,
        row: (message) => {
          if (message.title === "Unreadable") {
            throw new Error("Cannot read the event");
          }
          return message;
        },
      });
    const db = createDb({ strict: Strict });
    const errors: unknown[] = [];
    db.onError((event) => errors.push(event));
    await waitForConnection(socket);
    routes.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
    const query = db.strict.where((post) => eq(post.teamId, 1));
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().stale).toBeFalse());
    send("teams/1/posts/changed", { id: 1, title: "Unreadable" });
    send("teams/1/posts/changed", { id: 1, title: "Readable" });
    await vi.waitFor(() => expect(query.getSnapshot().data?.[0].title).toBe("Readable"));
    expect(errors).toMatchObject([{ type: "sync" }]);
    unsubscribe();
    db.destroy();
    await socket.disconnect();
  });

  it("keeps a row read by key live through a listener of its own with byKey", async () => {
    const client = createHttpClient(http.getUrl());
    const requests = createRequests(client);
    const socket = createSocket(socketUrl);
    const listeners = createListeners(socket);
    routes.reset();
    const Docs = collection(PostSchema, { key: "id" })
      .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
      .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) })
      .syncChanges(listeners.onPostChanges, {
        changes: ({ data }) => data,
        byKey: (id) => ({ params: { postId: id } }),
      });
    const db = createDb({ docs: Docs });
    await waitForConnection(socket);
    routes.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
    routes.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));

    const list = db.docs.where((post) => eq(post.teamId, 1));
    const one = db.docs.findOne(4);
    const unsubscribes = [list.subscribe(() => {}), one.subscribe(() => {})];
    await vi.waitFor(() => expect(one.getSnapshot().data?.id).toBe(4));
    await vi.waitFor(() => expect(one.getSnapshot().stale).toBeFalse());
    expect(one.explain().syncs).toStrictEqual([{ type: "changes", topic: "posts/4/changes" }]);
    expect(list.explain().syncs).toStrictEqual([]);

    send("posts/4/changes", { upsert: [createPost(4, { title: "Live" })], delete: [] });
    await vi.waitFor(() => expect(one.getSnapshot().data?.title).toBe("Live"));
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    db.destroy();
    await socket.disconnect();
  });

  it("puts a row read by key in the scoped subscriptions its fields pick, and moves it when they change", async () => {
    const { db } = context;
    routes.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
    const one = db.full.findOne(5);
    const unsubscribe = one.subscribe(() => {});
    await vi.waitFor(() => expect(one.getSnapshot().data?.id).toBe(5));
    const topics = () => one.explain().syncs.map((sync) => sync.topic);
    await vi.waitFor(() => expect(topics()).toContain("teams/1/posts/changed"));

    send("teams/1/posts/changed", { id: 5, teamId: 2, title: "Moved" });
    await vi.waitFor(() => expect(topics()).toContain("teams/2/posts/changed"));
    expect(topics()).not.toContain("teams/1/posts/changed");
    send("teams/2/posts/changed", { id: 5, title: "Live in team 2" });
    await vi.waitFor(() => expect(one.getSnapshot().data?.title).toBe("Live in team 2"));
    unsubscribe();

    // Until it is collected, the released subset still receives events, but opens no new subscriptions
    send("teams/2/posts/changed", { id: 5, teamId: 3 });
    await vi.waitFor(() => expect(db.full.findOne(5).local().getSnapshot().data?.teamId).toBe(3));
  });
});
