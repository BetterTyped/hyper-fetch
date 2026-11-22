import { DependencyError, collection, createDb, eq, rowType } from "@hyper-fetch/db";
import type { DbChannel, DbErrorEvent, DbLockManager, DbOptions, TransactionRecord } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import {
  PostSchema,
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

const createCollections = (client = createHttpClient()) => {
  const requests = createRequests(client);
  const post = collection(rowType<Post>(), { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .mutate({
      insert: { request: requests.createPostRequest, map: (row, { id }) => ({ payload: { ...row, title: id } }) },
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
      delete: {
        request: requests.deletePostRequest,
        map: (key) => ({ params: { postId: key } }),
        onSuccess: "keep",
      },
    });
  const validated = collection(PostSchema, { key: "id" }).load(requests.getPost, {
    byKey: (id) => ({ params: { postId: id } }),
  });
  return { client, requests, collections: { post, validated } };
};

const setup = (options: DbOptions = {}) => {
  const { client, requests, collections } = createCollections();
  const db = createDb(collections, { offline: { retryDelay: () => 0 }, ...options });
  const errors: DbErrorEvent[] = [];
  db.onError((event) => errors.push(event));
  return { client, requests, db, errors, api: createApi(server) };
};

const loadTeam = async (db: ReturnType<typeof setup>["db"]) => {
  const query = db.post.where((post) => eq(post.teamId, 1));
  const unsubscribe = query.subscribe(() => {});
  await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
  return { query, unsubscribe };
};

/** Channels that deliver every message to the other channels of the hub, like a `BroadcastChannel` */
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

/** A lock manager that grants a lock to one holder at a time, like Web Locks */
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

describe("db [ Offline ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  describe("when writes go through the outbox", () => {
    it("replays writes in their original order across rows", async () => {
      const { api, db } = setup();
      const release = deferred();
      api.patch("/posts/:postId", async ({ params }) => {
        if (params.postId === "1") {
          await release.promise;
        }
        return { data: createPost(Number(params.postId)) };
      });
      const first = db.post.update(1, { title: "First" });
      const second = db.post.update(2, { title: "Second" });
      await flush();
      expect(api.calls.map((call) => call.path)).toStrictEqual(["/posts/1"]);
      release.resolve();
      await first;
      await second;
      expect(api.calls.map((call) => call.path)).toStrictEqual(["/posts/1", "/posts/2"]);
      db.destroy();
    });

    it("waits while offline and replays when the connection returns", async () => {
      const { api, db, client } = setup();
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      api.patch("/posts/:postId", ({ params, body }) => ({
        data: { ...createPost(Number(params.postId)), ...(body as object) },
      }));
      const { query, unsubscribe } = await loadTeam(db);
      client.appManager.setOnline(false);
      const write = db.post.update(1, { title: "Offline edit" });
      await flush();
      expect(api.callsTo("/posts/1", "patch")).toHaveLength(0);
      expect(query.getSnapshot().data?.[0].title).toBe("Offline edit");
      client.appManager.setOnline(true);
      expect(await write).toMatchObject({ success: true });
      unsubscribe();
      db.destroy();
    });

    it("retries a temporary failure and keeps the writes behind it waiting", async () => {
      const { api, db } = setup();
      let attempts = 0;
      api.patch("/posts/:postId", ({ params }) => {
        if (params.postId === "1") {
          attempts += 1;
          return attempts < 3 ? { status: 503 } : { data: createPost(1) };
        }
        return { data: createPost(2) };
      });
      const first = db.post.update(1, { title: "Retried" });
      const second = db.post.update(2, { title: "Behind" });
      expect(await first).toMatchObject({ success: true });
      await second;
      expect(api.calls.map((call) => call.path)).toStrictEqual(["/posts/1", "/posts/1", "/posts/1", "/posts/2"]);
      db.destroy();
    });

    it("drops a rejected write with the writes on its row and the writes that depend on it", async () => {
      const { api, db, errors } = setup();
      api.post("/posts", () => ({ status: 422, data: { message: "Invalid" } }));
      api.patch("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
      const insert = db.post.insert(createPost(3));
      const sameRow = db.post.update(3, { likes: 1 });
      const dependent = db.post.update(4, { title: "Depends" }, { dependsOn: [insert] });
      const dependentById = db.post.update(6, { title: "Depends" }, { dependsOn: [insert.id] });
      const unrelated = db.post.update(5, { title: "Unrelated" });
      expect(await insert).toMatchObject({ success: false, error: { message: "Invalid" } });
      const dropped = await Promise.all([sameRow, dependent, dependentById]);
      dropped.forEach((result) => expect(result.error).toBeInstanceOf(DependencyError));
      expect(await unrelated).toMatchObject({ success: true });
      expect(api.calls.map((call) => call.path)).toStrictEqual(["/posts", "/posts/5"]);
      expect(errors.filter((event) => event.type === "mutation")).toHaveLength(4);
      db.destroy();
    });

    it("uses a custom rule for which failures are retried", async () => {
      const { api, db } = setup({ offline: { retryable: () => false } });
      api.patch("/posts/:postId", () => ({ status: 503 }));
      expect(await db.post.update(1, { title: "Once" })).toMatchObject({ success: false });
      expect(api.calls).toHaveLength(1);
      db.destroy();
    });

    it("retries with the default delay", async () => {
      const { api, db } = setup({ offline: true });
      let attempts = 0;
      api.patch("/posts/:postId", () => {
        attempts += 1;
        return attempts === 1 ? { networkError: true } : { data: createPost(1) };
      });
      const started = Date.now();
      expect(await db.post.update(1, { title: "Later" })).toMatchObject({ success: true });
      expect(attempts).toBe(2);
      expect(Date.now() - started).toBeGreaterThanOrEqual(900);
      db.destroy();
    });

    it("rejects an insert that leaves the key to the server while offline", async () => {
      const { db, client } = setup();
      client.appManager.setOnline(false);
      const { id: _id, ...withoutKey } = createPost(1);
      const result = await db.post.insert(withoutKey as Post);
      expect(String(result.error)).toContain("cannot be made offline");
      client.appManager.setOnline(true);
      db.destroy();
    });

    it("resolves pending writes with an error when the db is cleared", async () => {
      const { db, client } = setup();
      client.appManager.setOnline(false);
      const write = db.post.update(1, { title: "Gone" });
      await flush();
      await db.clear();
      expect(await write).toMatchObject({ success: false });
      client.appManager.setOnline(true);
      db.destroy();
    });
  });

  describe("when the db persists", () => {
    it("restores rows and subsets, shows them stale and refetches", async () => {
      const storage = createMemoryStorage();
      const first = setup({ persistence: { storage }, tabs: false });
      first.api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
      const { unsubscribe } = await loadTeam(first.db);
      await flush();
      expect(storage.items.has("hf-db:default:rows:post")).toBeTrue();
      unsubscribe();
      first.db.destroy();

      const release = deferred();
      const second = setup({ persistence: { storage }, tabs: false });
      second.api.get("/teams/:teamId/full-posts", async () => {
        await release.promise;
        return { data: { items: [createPost(1, { title: "Fresh" })] } };
      });
      const query = second.db.post.where((post) => eq(post.teamId, 1));
      const stop = query.subscribe(() => {});
      expect(query.getSnapshot().status).toBe("loading");
      await second.db.ready;
      await vi.waitFor(() => expect(query.getSnapshot()).toMatchObject({ status: "ready", stale: true }));
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2]);
      release.resolve();
      await vi.waitFor(() => expect(query.getSnapshot().data?.[0].title).toBe("Fresh"));
      expect(query.getSnapshot().data).toHaveLength(1);
      stop();
      second.db.destroy();
    });

    it("restores values JSON loses, such as dates, as they were", async () => {
      const storage = createMemoryStorage();
      const create = () => {
        const requests = createRequests(createHttpClient());
        const Event = collection(rowType<{ id: number; at: Date; tags: Set<string> }>(), { key: "id" }).load(
          requests.getPost,
          {
            byKey: (id) => ({ params: { postId: id } }),
            rows: (post) => [{ id: post.id, at: new Date(post.createdAt), tags: new Set(["a"]) }],
          },
        );
        return createDb({ event: Event }, { persistence: { storage }, tabs: false });
      };
      const api = createApi(server);
      api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
      const first = create();
      const one = first.event.findOne(3);
      const stop = one.subscribe(() => {});
      await vi.waitFor(() => expect(one.getSnapshot().data?.id).toBe(3));
      await flush();
      stop();
      first.destroy();

      const second = create();
      await second.ready;
      const restored = second.event.findOne(3).local().getSnapshot().data;
      expect(restored?.at).toBeInstanceOf(Date);
      expect(restored?.at.toISOString()).toBe(new Date("2026-01-03").toISOString());
      expect(restored?.tags).toStrictEqual(new Set(["a"]));
      second.destroy();
    });

    it("clears rows of another version and keeps the outbox", async () => {
      const storage = createMemoryStorage();
      const first = setup({ persistence: { storage, version: 1 }, tabs: false });
      first.api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const { unsubscribe } = await loadTeam(first.db);
      first.client.appManager.setOnline(false);
      first.db.post.update(1, { title: "Unsent" });
      await flush();
      unsubscribe();
      first.db.destroy();

      const second = setup({ persistence: { storage, version: 2 }, tabs: false });
      second.client.appManager.setOnline(false);
      await second.db.ready;
      expect(storage.items.has("hf-db:default:rows:post")).toBeFalse();
      const outbox = JSON.parse(storage.items.get("hf-db:default:outbox")!) as { entries: TransactionRecord[] };
      expect(outbox.entries).toHaveLength(1);
      second.client.appManager.setOnline(true);
      second.db.destroy();
    });

    it("rebuilds offline edits from the outbox after a restart and replays them with their id", async () => {
      const storage = createMemoryStorage();
      const first = setup({ persistence: { storage }, tabs: false });
      first.client.appManager.setOnline(false);
      const write = first.db.post.insert(createPost(7));
      await flush();
      first.db.destroy();
      const [entry] = (JSON.parse(storage.items.get("hf-db:default:outbox")!) as { entries: TransactionRecord[] })
        .entries;
      expect(entry).toMatchObject({ id: write.id, op: "insert", sent: false });

      const second = setup({ persistence: { storage }, tabs: false });
      const release = deferred();
      second.api.post("/posts", async ({ body }) => {
        await release.promise;
        return { data: body };
      });
      await second.db.ready;
      expect(second.db.post.findOne(7).local().getSnapshot().data?.id).toBe(7);
      await vi.waitFor(() => expect(second.api.calls).toHaveLength(1));
      const sent = JSON.parse(storage.items.get("hf-db:default:outbox")!) as { entries: TransactionRecord[] };
      expect(sent.entries[0].sent).toBeTrue();
      release.resolve();
      await vi.waitFor(() => expect(second.db.post.findOne(7).local().getSnapshot().data?.title).toBe(write.id));
      second.db.destroy();
    });

    it("reports outbox entries it cannot replay and outboxes of another format", async () => {
      const unknown: TransactionRecord = {
        id: "1",
        collection: "missing",
        op: "update",
        key: 1,
        values: {},
        dependsOn: [],
        sent: false,
        createdAt: 0,
      };
      const storage = createMemoryStorage({
        "hf-db:default:outbox": JSON.stringify({ format: 1, entries: [unknown] }),
      });
      const { db, errors } = setup({ persistence: { storage }, tabs: false });
      await db.ready;
      expect(errors).toMatchObject([{ type: "outbox", transaction: unknown }]);
      db.destroy();

      const future = createMemoryStorage({ "hf-db:default:outbox": JSON.stringify({ format: 99, entries: [] }) });
      const other = setup({ persistence: { storage: future }, tabs: false });
      await other.db.ready;
      expect(other.errors).toMatchObject([{ type: "outbox" }]);
      other.db.destroy();
    });

    it("keeps working when storage fails", async () => {
      const failing = {
        getItem: () => {
          throw new Error("Read failed");
        },
        setItem: () => {
          throw new Error("Write failed");
        },
        removeItem: () => {
          throw new Error("Remove failed");
        },
      };
      const { db, api, errors } = setup({ persistence: { storage: failing }, tabs: false });
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const { query, unsubscribe } = await loadTeam(db);
      await flush();
      await db.clear();
      expect(query.getSnapshot().status).not.toBe("error");
      expect(errors.map((event) => event.type)).toContain("persistence");
      unsubscribe();
      db.destroy();
    });

    it("shows an empty result once the network takes longer than the timeout", async () => {
      const storage = createMemoryStorage();
      const { db, api } = setup({ persistence: { storage, networkTimeout: 20 }, tabs: false });
      const release = deferred();
      api.get("/teams/:teamId/full-posts", async () => {
        await release.promise;
        return { data: { items: [createPost(1)] } };
      });
      const query = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot()).toMatchObject({ status: "ready", data: [], stale: true }));
      release.resolve();
      await vi.waitFor(() => expect(query.getSnapshot().data).toHaveLength(1));
      unsubscribe();
      db.destroy();
    });

    it("keeps scopes apart and clears the current scope", async () => {
      const storage = createMemoryStorage();
      const alice = setup({ persistence: { storage, scope: "alice" }, tabs: false });
      alice.api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const { unsubscribe } = await loadTeam(alice.db);
      await flush();
      unsubscribe();
      expect(storage.items.has("hf-db:alice:rows:post")).toBeTrue();
      const bob = setup({ persistence: { storage, scope: "bob" }, tabs: false });
      await bob.db.ready;
      expect(bob.db.post.local().getSnapshot().data).toStrictEqual([]);
      await alice.db.clear();
      expect(storage.items.has("hf-db:alice:rows:post")).toBeFalse();
      alice.db.destroy();
      bob.db.destroy();
    });

    it("works with asynchronous storage", async () => {
      const memory = createMemoryStorage();
      const storage = {
        getItem: async (key: string) => memory.getItem(key),
        setItem: async (key: string, value: string) => memory.setItem(key, value),
        removeItem: async (key: string) => memory.removeItem(key),
      };
      const { db, api } = setup({ persistence: { storage }, tabs: false });
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const { unsubscribe } = await loadTeam(db);
      await flush();
      expect(memory.items.has("hf-db:default:rows:post")).toBeTrue();
      unsubscribe();
      db.destroy();
    });
  });

  describe("when several tabs share the storage", () => {
    it("lets one tab replay the outbox and tells the others the outcome", async () => {
      const storage = createMemoryStorage();
      const hub = createChannelHub();
      const locks = createLocks();
      const leader = setup({ persistence: { storage }, tabs: { locks, channel: hub.create() } });
      const follower = setup({ persistence: { storage }, tabs: { locks, channel: hub.create() } });
      await leader.db.ready;
      await follower.db.ready;
      follower.api.get("/teams/:teamId/full-posts", () => ({
        data: { items: [createPost(1), createPost(2), createPost(5)] },
      }));
      const { unsubscribe } = await loadTeam(follower.db);
      leader.api.patch("/posts/:postId", ({ params }) =>
        params.postId === "1" ? { data: createPost(1, { title: "Saved" }) } : { status: 400, data: { message: "No" } },
      );
      const saved = await follower.db.post.update(1, { title: "Saved" });
      expect(saved).toMatchObject({ success: true });
      expect(follower.db.post.findOne(1).local().getSnapshot().data?.title).toBe("Saved");
      const rejected = await follower.db.post.update(2, { title: "Rejected" });
      expect(rejected).toMatchObject({ success: false });
      expect(follower.db.post.findOne(2).local().getSnapshot().data?.title).toBe("Post 2");
      expect(leader.api.calls.filter((call) => call.method === "patch")).toHaveLength(2);
      await vi.waitFor(() => expect(leader.db.post.findOne(5).local().getSnapshot().data?.id).toBe(5));
      unsubscribe();

      leader.db.destroy();
      follower.client.appManager.setOnline(false);
      follower.db.post.update(9, { title: "After the leader left" });
      follower.client.appManager.setOnline(true);
      await vi.waitFor(() => expect(leader.api.callsTo("/posts/9", "patch")).toHaveLength(1));
      follower.db.destroy();
    });

    it("lets every tab replay without Web Locks, and uses the default channel", async () => {
      const { db, api } = setup({ persistence: { storage: createMemoryStorage() } });
      api.patch("/posts/:postId", () => ({ data: createPost(1) }));
      expect(await db.post.update(1, { title: "Leader" })).toMatchObject({ success: true });
      db.destroy();
    });
  });
});
