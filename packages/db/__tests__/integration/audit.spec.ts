/**
 * Regressions found by auditing the db against the test suites of Replicache, RxDB, Dexie, PowerSync, Electric,
 * Apollo, urql and Relay. Each case failed before its fix.
 */
import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import type { DbChannel, DbErrorEvent, DbLockManager, DbOptions } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import {
  createApi,
  createHttpClient,
  createMemoryStorage,
  createPost,
  createRequests,
  deferred,
  flush,
} from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

const createChannelHub = () => {
  const channels = new Set<{ listeners: Set<(event: { data: unknown }) => void> }>();
  const create = (): DbChannel => {
    const channel = { listeners: new Set<(event: { data: unknown }) => void>() };
    channels.add(channel);
    return {
      postMessage: (message) => {
        channels.forEach((other) => {
          if (other !== channel) {
            queueMicrotask(() => other.listeners.forEach((listener) => listener({ data: message })));
          }
        });
      },
      addEventListener: (_type, listener) => channel.listeners.add(listener),
      removeEventListener: (_type, listener) => channel.listeners.delete(listener),
      close: () => channels.delete(channel),
    };
  };
  return { create };
};

/** Grants one lock at a time, in request order, like Web Locks */
const createLocks = (): DbLockManager => {
  const queue: (() => Promise<unknown>)[] = [];
  let held = false;
  const next = () => {
    const callback = queue.shift();
    if (!callback) {
      held = false;
      return;
    }
    held = true;
    callback().then(next);
  };
  return {
    request: (_name, callback) => {
      queue.push(callback);
      if (!held) {
        next();
      }
      return Promise.resolve();
    },
  };
};

const setup = (options: DbOptions = {}) => {
  const client = createHttpClient();
  const requests = createRequests(client);
  const post = collection(rowType<Post>(), { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .load(requests.getAllPosts, {
      rows: (response) => response.items,
      cursor: (response) => response.next,
      page: (cursor) => ({ queryParams: { cursor } }),
      orderBy: { createdAt: (direction) => ({ queryParams: { sort: direction } }) },
    })
    .mutate({
      insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => {
          if (changes.title === "Throws") {
            throw new Error("The mapping broke");
          }
          return { params: { postId: key }, payload: changes };
        },
      },
      delete: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
    });
  const db = createDb({ post }, options);
  const errors: DbErrorEvent[] = [];
  db.onError((event) => errors.push(event));
  return { client, db, errors, api: createApi(server) };
};

describe("db [ Audit regressions ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  describe("tabs and the outbox", () => {
    it("never makes a destroyed tab the leader when its lock is granted later", async () => {
      const storage = createMemoryStorage();
      const hub = createChannelHub();
      const locks = createLocks();
      const first = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      const second = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      const third = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      await Promise.all([first.db.ready, second.db.ready, third.db.ready]);
      second.db.destroy();
      first.db.destroy();
      third.api.patch("/posts/:postId", () => ({ data: createPost(1, { title: "Saved" }) }));
      expect(await third.db.post.update(1, { title: "Saved" })).toMatchObject({ success: true });
      third.db.destroy();
    });

    it("keeps the writes of two tabs that write at the same time", async () => {
      const storage = createMemoryStorage();
      const hub = createChannelHub();
      const locks = createLocks();
      const leader = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      const left = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      const right = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      await Promise.all([leader.db.ready, left.db.ready, right.db.ready]);
      leader.api.patch("/posts/:postId", ({ params, body }) => ({
        data: createPost(Number(params.postId), body as Partial<Post>),
      }));
      const results = await Promise.all([
        left.db.post.update(1, { title: "Left" }),
        right.db.post.update(2, { title: "Right" }),
      ]);
      expect(results.map((result) => result.success)).toStrictEqual([true, true]);
      expect(leader.api.calls.filter((call) => call.method === "patch")).toHaveLength(2);
      [leader, left, right].forEach(({ db }) => db.destroy());
    });

    it("replays the writes the old leader held when another tab takes over", async () => {
      const storage = createMemoryStorage();
      const hub = createChannelHub();
      const locks = createLocks();
      const leader = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      const follower = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      await Promise.all([leader.db.ready, follower.db.ready]);
      leader.client.appManager.setOnline(false);
      leader.db.post.update(3, { title: "Written by the old leader" });
      await flush();
      leader.db.destroy();
      follower.api.patch("/posts/:postId", ({ params, body }) => ({
        data: createPost(Number(params.postId), body as Partial<Post>),
      }));
      await vi.waitFor(() => expect(follower.api.callsTo("/posts/3", "patch")).toHaveLength(1));
      follower.db.destroy();
    });

    it("gives a follower the key the server assigned to its insert", async () => {
      const storage = createMemoryStorage();
      const hub = createChannelHub();
      const locks = createLocks();
      const leader = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      const follower = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      await Promise.all([leader.db.ready, follower.db.ready]);
      leader.api.post("/posts", ({ body }) => ({ data: { ...(body as Post), id: 100 } }));
      const { id: _id, ...row } = createPost(1);
      const insert = follower.db.post.insert(row as Post);
      expect(await insert).toMatchObject({ success: true });
      await flush();
      expect(follower.db.post.findOne(100).local().getSnapshot().data?.title).toBe("Post 1");
      expect(follower.db.inspect().collections[0].rows).toBe(1);
      [leader, follower].forEach(({ db }) => db.destroy());
    });

    it("clears the other tabs when one tab clears the db on sign-out", async () => {
      const storage = createMemoryStorage();
      const hub = createChannelHub();
      const locks = createLocks();
      const leader = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      const follower = setup({ persistence: { storage }, offline: true, tabs: { locks, channel: hub.create() } });
      await Promise.all([leader.db.ready, follower.db.ready]);
      leader.client.appManager.setOnline(false);
      const pending = follower.db.post.insert(createPost(4, { title: "Before sign-out" }));
      await flush();
      expect(follower.db.post.findOne(4).local().getSnapshot().data?.title).toBe("Before sign-out");
      await leader.db.clear();
      await vi.waitFor(() => expect(follower.db.post.findOne(4).local().getSnapshot().data).toBeUndefined());
      expect(await pending).toMatchObject({ success: false });
      leader.client.appManager.setOnline(true);
      await flush();
      expect(follower.api.callsTo("/posts", "post")).toHaveLength(0);
      [leader, follower].forEach(({ db }) => db.destroy());
    });

    it("drops a replayed write whose mapping throws and replays the ones after it", async () => {
      const { api, db, errors } = setup({ offline: { retryDelay: () => 0 } });
      api.patch("/posts/:postId", ({ params, body }) => ({
        data: createPost(Number(params.postId), body as Partial<Post>),
      }));
      const broken = db.post.update(1, { title: "Throws" });
      const fine = db.post.update(2, { title: "Fine" });
      expect(await broken).toMatchObject({ success: false });
      expect(await fine).toMatchObject({ success: true });
      expect(errors.some((event) => String(event.error).includes("The mapping broke"))).toBeTrue();
      db.destroy();
    });

    it("drops a direct write whose mapping throws, without breaking later writes to the row", async () => {
      const { api, db } = setup();
      api.patch("/posts/:postId", ({ params, body }) => ({
        data: createPost(Number(params.postId), body as Partial<Post>),
      }));
      expect(await db.post.update(1, { title: "Throws" })).toMatchObject({ success: false });
      expect(await db.post.update(1, { title: "Next" })).toMatchObject({ success: true });
      db.destroy();
    });

    it("keeps an outbox it cannot read instead of writing an empty one over it", async () => {
      const corrupt = createMemoryStorage({ "hf-db:default:outbox": "{not json" });
      const newer = createMemoryStorage({
        "hf-db:default:outbox": JSON.stringify({ format: 99, entries: [{ id: "x" }] }),
      });
      const first = setup({ persistence: { storage: corrupt }, offline: true, tabs: false });
      const second = setup({ persistence: { storage: newer }, offline: true, tabs: false });
      await Promise.all([first.db.ready, second.db.ready]);
      await flush();
      expect(corrupt.items.get("hf-db:default:outbox")).toBe("{not json");
      expect(JSON.parse(newer.items.get("hf-db:default:outbox")!)).toMatchObject({ format: 99 });
      expect(first.errors.some((event) => event.type === "persistence")).toBeTrue();
      expect(second.errors.some((event) => event.type === "outbox")).toBeTrue();
      [first, second].forEach(({ db }) => db.destroy());
    });
  });

  describe("sign-out", () => {
    it("discards a load and a write response that arrive after the db was cleared", async () => {
      const { api, db } = setup();
      const release = deferred();
      api.get("/teams/:teamId/full-posts", async () => {
        await release.promise;
        return { data: { items: [createPost(1, { title: "Previous user" })] } };
      });
      api.post("/posts", async ({ body }) => {
        await release.promise;
        return { data: body };
      });
      const query = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      const write = db.post.insert(createPost(2, { title: "Previous user's insert" }));
      await flush();
      await db.clear();
      release.resolve();
      expect(await write).toMatchObject({ success: false });
      await flush();
      expect(db.post.findOne(1).local().getSnapshot().data).toBeUndefined();
      expect(db.post.findOne(2).local().getSnapshot().data).toBeUndefined();
      unsubscribe();
      db.destroy();
    });
  });

  describe("loads racing writes", () => {
    it("keeps a row inserted while the list's load was in flight, which the load could not know", async () => {
      const { api, db } = setup();
      const release = deferred();
      api.get("/teams/:teamId/full-posts", async () => {
        await release.promise;
        return { data: { items: [createPost(1)] } };
      });
      api.post("/posts", ({ body }) => ({ data: body }));
      const query = db.post.where((post) => eq(post.teamId, 1)).orderBy((post) => post.id);
      const unsubscribe = query.subscribe(() => {});
      await flush();
      expect(await db.post.insert(createPost(2))).toMatchObject({ success: true });
      release.resolve();
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2]);
      unsubscribe();
      db.destroy();
    });

    it("refetches from the first page when asked while the next page loads", async () => {
      const { api, db } = setup();
      const release = deferred();
      let version = 1;
      api.get("/all-posts", async ({ url }) => {
        const cursor = url.searchParams.get("cursor");
        if (cursor) {
          await release.promise;
          return { data: { items: [createPost(3)], next: null } };
        }
        return { data: { items: [createPost(1, { title: `v${version}` }), createPost(2)], next: "page-2" } };
      });
      const query = db.post.orderBy((post) => post.createdAt);
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      const next = query.fetchNextPage();
      version = 2;
      const refetch = query.refetch();
      release.resolve();
      await Promise.all([next, refetch]);
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 3]);
      expect(query.getSnapshot().data?.[0].title).toBe("v2");
      unsubscribe();
      db.destroy();
    });
  });

  describe("reads", () => {
    it("does not re-emit a selected result when only fields it does not select change", async () => {
      const { api, db } = setup();
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      api.patch("/posts/:postId", ({ params, body }) => ({
        data: createPost(Number(params.postId), body as Partial<Post>),
      }));
      const query = db.post.where((post) => eq(post.teamId, 1)).select((post) => ({ title: post.title }));
      const listener = vi.fn();
      const unsubscribe = query.subscribe(listener);
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      const before = query.getSnapshot().data;
      listener.mockClear();
      await db.post.update(1, { body: "Only the body" });
      expect(query.getSnapshot().data).toBe(before);
      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
      db.destroy();
    });

    it("keeps a field an update carries as undefined, and clears one it carries as null", async () => {
      const { api, db } = setup();
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const query = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      api.patch("/posts/:postId", () => ({ data: null }));
      const pending = db.post.update(1, { title: undefined, body: null as unknown as string });
      expect(query.getSnapshot().data?.[0]).toMatchObject({ title: "Post 1", body: null });
      await pending;
      unsubscribe();
      db.destroy();
    });

    it("keeps updating every listener when one of them throws", async () => {
      const { api, db, errors } = setup();
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      api.patch("/posts/:postId", ({ params, body }) => ({
        data: createPost(Number(params.postId), body as Partial<Post>),
      }));
      const query = db.post.where((post) => eq(post.teamId, 1));
      const failing = query.subscribe(() => {
        throw new Error("A broken component");
      });
      const healthy = vi.fn();
      const unsubscribe = query.subscribe(healthy);
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      healthy.mockClear();
      await db.post.update(1, { title: "Still live" });
      expect(healthy).toHaveBeenCalled();
      expect(db.post.findOne(1).local().getSnapshot().data?.title).toBe("Still live");
      expect(errors.some((event) => event.type === "subscriber")).toBeTrue();
      failing();
      unsubscribe();
      db.destroy();
    });
  });

  describe("writes", () => {
    const createWriteDb = () => {
      const client = createHttpClient();
      const requests = createRequests(client);
      const base = collection(rowType<Post>(), { key: "id" }).load(requests.getTeamFullPosts, {
        rows: (response) => response.items,
        where: byTeam,
      });
      const post = base.mutate({
        insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
        update: {
          request: requests.updatePostRequest,
          map: (key, changes) => ({ params: { postId: key }, payload: changes }),
          onSuccess: "refetch",
        },
        delete: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
      });
      const summary = collection(rowType<Post>(), { key: "id" })
        .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
        .mutate({
          delete: {
            request: requests.deletePostRequest,
            map: (key) => ({ params: { postId: key } }),
            onSuccess: "keep",
          },
        });
      const db = createDb({ post, summary }, { links: [["post", "summary"]] });
      const errors: DbErrorEvent[] = [];
      db.onError((event) => errors.push(event));
      return { api: createApi(server), db, requests, errors };
    };

    it("settles two writes to one row when the first refetches on success", async () => {
      const { api, db } = createWriteDb();
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      api.patch("/posts/:postId", () => ({ data: null }));
      const query = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      const results = await Promise.all([db.post.update(1, { title: "A" }), db.post.update(1, { title: "B" })]);
      expect(results.map((result) => result.success)).toStrictEqual([true, true]);
      unsubscribe();
      db.destroy();
    });

    it("drops a direct write whose dependency was rejected, before or while it waits", async () => {
      const { api, db } = createWriteDb();
      api.post("/posts", () => ({ status: 400, data: { message: "No" } }));
      api.delete("/posts/:postId", () => ({ data: null }));
      const parent = db.post.insert(createPost(1));
      const child = db.post.delete(2, { dependsOn: [parent] });
      expect(await parent).toMatchObject({ success: false });
      expect(await child).toMatchObject({ success: false });
      const late = await db.post.delete(3, { dependsOn: [parent.id] });
      expect(late).toMatchObject({ success: false });
      expect(api.callsTo("/posts/2", "delete")).toHaveLength(0);
      expect(api.callsTo("/posts/3", "delete")).toHaveLength(0);
      db.destroy();
    });

    it("keeps linked collections working while a delete is pending in one of them", async () => {
      const { api, db, errors } = createWriteDb();
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const release = deferred();
      api.delete("/posts/:postId", async () => {
        await release.promise;
        return { data: null };
      });
      const query = db.post.where((post) => eq(post.teamId, 1));
      const summaries = db.summary.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      const unsubscribeSummaries = summaries.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      await vi.waitFor(() => expect(summaries.getSnapshot().status).toBe("ready"));
      const write = db.summary.delete(1);
      await expect(query.refetch()).resolves.toBeUndefined();
      expect(query.getSnapshot().status).toBe("ready");
      expect(errors).toStrictEqual([]);
      release.resolve();
      expect(await write).toMatchObject({ success: true });
      unsubscribe();
      unsubscribeSummaries();
      db.destroy();
    });
  });

  describe("temporary keys", () => {
    const createKeylessDb = () => {
      const requests = createRequests(createHttpClient());
      const post = collection(rowType<Post>(), { key: "id" })
        .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
        .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) })
        .mutate({
          insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
          update: {
            request: requests.updatePostRequest,
            map: (key, changes) => ({ params: { postId: key }, payload: changes }),
          },
        });
      return { api: createApi(server), db: createDb({ post }) };
    };

    /** The insert's response is empty, so the db learns the new row's key only from the lists */
    const createRefetchingDb = () => {
      const requests = createRequests(createHttpClient());
      const post = collection(rowType<Post>(), { key: "id" })
        .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
        .mutate({
          insert: { request: requests.deletePostRequest, map: () => ({ params: { postId: 0 } }), onSuccess: "refetch" },
        });
      return { api: createApi(server), db: createDb({ post }) };
    };

    it("applies writes made with the temporary key to the row the server keyed", async () => {
      const { api, db } = createKeylessDb();
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [] } }));
      api.post("/posts", ({ body }) => ({ data: { ...(body as Post), id: 100 } }));
      const release = deferred();
      api.patch("/posts/:postId", async ({ params, body }) => {
        await release.promise;
        return { data: createPost(Number(params.postId), body as Partial<Post>) };
      });
      const query = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      const { id: _id, ...row } = createPost(1);
      const insert = db.post.insert(row as Post);
      const temporary = query.getSnapshot().data![0].id;
      await insert;
      const update = db.post.update(temporary, { title: "By the old key" });
      expect(query.getSnapshot().data?.map((post) => [post.id, post.title])).toStrictEqual([[100, "By the old key"]]);
      expect(db.post.findOne(temporary).local().getSnapshot().data?.id).toBe(100);
      release.resolve();
      await update;
      expect(api.callsTo("/posts/100", "patch")).toHaveLength(1);
      unsubscribe();
      db.destroy();
    });

    it("gives a keyless insert that adds no layer the server's key", async () => {
      const requests = createRequests(createHttpClient());
      const post = collection(rowType<Post>(), { key: "id" })
        .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
        .mutate({
          insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }), optimistic: false },
        });
      const db = createDb({ post });
      const api = createApi(server);
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [] } }));
      api.post("/posts", ({ body }) => ({ data: { ...(body as Post), id: 100 } }));
      const query = db.post.where((row) => eq(row.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      const { id: _id, ...row } = createPost(1);
      expect(await db.post.insert(row as Post)).toMatchObject({ success: true });
      expect(query.getSnapshot().data?.map((item) => item.id)).toStrictEqual([100]);
      unsubscribe();
      db.destroy();
    });

    it("refetches the lists an insert belongs to when its response does not carry the new row", async () => {
      const { api, db } = createRefetchingDb();
      let items: Post[] = [];
      api.get("/teams/:teamId/full-posts", () => ({ data: { items } }));
      api.delete("/posts/:postId", () => {
        items = [createPost(42)];
        return { data: null };
      });
      const query = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      const { id: _id, ...row } = createPost(42);
      expect(await db.post.insert(row as Post)).toMatchObject({ success: true });
      await vi.waitFor(() => expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([42]));
      unsubscribe();
      db.destroy();
    });
  });

  describe("lifecycle", () => {
    it("stops filling an infinite query once it has no subscriber", async () => {
      const { api, db } = setup();
      let calls = 0;
      const release = deferred();
      api.get("/all-posts", async ({ url }) => {
        calls += 1;
        const start = Number(url.searchParams.get("cursor") ?? 0);
        if (start > 0) {
          await release.promise;
        }
        return { data: { items: [createPost(start + 1)], next: String(start + 1) } };
      });
      const feed = db.post.orderBy((post) => post.createdAt).infinite({ pageSize: 3 });
      const unsubscribe = feed.subscribe(() => {});
      await vi.waitFor(() => expect(calls).toBe(2));
      unsubscribe();
      release.resolve();
      await flush(20);
      expect(calls).toBeLessThan(4);
      db.destroy();
    });

    it("shows hydrated rows on the first render of a db that also persists", async () => {
      const server1 = setup();
      server1.api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      await server1.db.post.where((post) => eq(post.teamId, 1)).get();
      const state = server1.db.dehydrate();
      server1.db.destroy();
      const client = setup({ state, persistence: { storage: createMemoryStorage() }, tabs: false });
      expect(client.db.post.where((post) => eq(post.teamId, 1)).getSnapshot()).toMatchObject({ status: "ready" });
      client.db.destroy();
    });

    it("identifies queries by values JSON cannot tell apart", () => {
      const { db } = setup();
      const big = db.post.where((post) => eq(post.likes, 10n as unknown as number));
      const nan = db.post.where((post) => eq(post.likes, Number.NaN));
      const empty = db.post.where((post) => eq(post.likes, null as unknown as number));
      expect(new Set([big.key, nan.key, empty.key]).size).toBe(3);
      db.destroy();
    });
  });

  describe("memory and teardown", () => {
    it("forgets live queries nobody subscribes to after gcTime, and serves them again when read", async () => {
      const { api, db } = setup({ gcTime: 10 });
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const query = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      db.post.where((post) => eq(post.teamId, 7)).getSnapshot();
      expect(db.inspect().queries).toHaveLength(2);
      unsubscribe();
      await vi.waitFor(() => expect(db.inspect().queries).toHaveLength(0));
      const feed = db.post
        .where((post) => eq(post.teamId, 1))
        .orderBy((post) => post.id)
        .infinite({ pageSize: 1 });
      feed.getSnapshot();
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });
      // A window whose live query was forgotten attaches to a live one again
      api.post("/posts", ({ body }) => ({ data: body }));
      const stop = feed.subscribe(() => {});
      await vi.waitFor(() => expect(feed.getSnapshot().status).toBe("ready"));
      await db.post.insert(createPost(0));
      expect(feed.getSnapshot().data?.[0].id).toBe(0);
      stop();
      db.destroy();
    });

    it("leaves no timer behind once destroyed", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      try {
        const { api, db } = setup({ offline: { retryDelay: () => 60_000 } });
        api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
        api.patch("/posts/:postId", () => ({ status: 503, data: { message: "Later" } }));
        const query = db.post.where((post) => eq(post.teamId, 1));
        const unsubscribe = query.subscribe(() => {});
        await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
        db.post.update(1, { title: "Retried later" });
        await vi.waitFor(() => expect(api.callsTo("/posts/1", "patch")).toHaveLength(1));
        unsubscribe();
        expect(vi.getTimerCount()).toBeGreaterThan(0);
        db.destroy();
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
