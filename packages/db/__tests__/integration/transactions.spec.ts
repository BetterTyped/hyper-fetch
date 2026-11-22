import { DependencyError, collection, createDb, eq } from "@hyper-fetch/db";
import type { DbErrorEvent, DbOptions, StandardSchemaV1, TransactionWrite } from "@hyper-fetch/db";
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

const createCollections = () => {
  const client = createHttpClient();
  const requests = createRequests(client);
  const publish = client.createRequest<{
    response: { ok: boolean };
    payload: { mutations: TransactionWrite[]; idempotencyKey: string };
  }>()({ endpoint: "/publish", method: "POST" });
  const post = collection(PostSchema, { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .mutate({
      insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
      delete: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
    });
  // A backend that applies writes on its own, so writes add no optimistic layer
  const remote = collection(PostSchema, { key: "id" })
    .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) })
    .mutate({
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
        optimistic: false,
        onSuccess: "keep",
      },
    });
  // Written only through named transactions, so it declares no mutations
  const draft = collection(PostSchema, { key: "id" }).load(requests.getPost, {
    byKey: (id) => ({ params: { postId: id } }),
  });
  const transactions = {
    publish: {
      mutationFn: ({ id, mutations }: { id: string; mutations: TransactionWrite[] }) =>
        publish.setPayload({ mutations, idempotencyKey: id }),
    },
    publishAndReload: {
      mutationFn: ({ id, mutations }: { id: string; mutations: TransactionWrite[] }) =>
        publish.setPayload({ mutations, idempotencyKey: id }),
      onSuccess: "refetch" as const,
    },
  };
  return { collections: { post, draft, remote }, transactions, client };
};

const setup = (options: DbOptions = {}) => {
  const { collections, transactions, client } = createCollections();
  const db = createDb(collections, { ...options, transactions });
  const errors: DbErrorEvent[] = [];
  db.onError((event) => errors.push(event));
  return { api: createApi(server), db, errors, client };
};

const titles = (posts: Post[] | undefined) => posts?.map((post) => post.title);

describe("db [ Transactions ]", () => {
  let context = setup();

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  const loadTeam = async () => {
    context.api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
    const query = context.db.post.where((post) => eq(post.teamId, 1)).orderBy((post) => post.id);
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    return { query, unsubscribe };
  };

  describe("without a name", () => {
    it("shows every write at once and sends them in order through each collection's mutate", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam();
      const order: string[] = [];
      const release = deferred();
      api.patch("/posts/:postId", async ({ params, body }) => {
        order.push(`patch ${params.postId}`);
        await release.promise;
        return { data: createPost(Number(params.postId), body as Partial<Post>) };
      });
      api.post("/posts", ({ body }) => {
        order.push("post");
        return { data: body };
      });
      const transaction = db.transaction((tx) => {
        tx.post.update(1, { title: "One" });
        tx.post.insert(createPost(3, { title: "Three" }));
      });
      expect(titles(query.getSnapshot().data)).toStrictEqual(["One", "Post 2", "Three"]);
      await flush();
      expect(order).toStrictEqual(["patch 1"]);
      release.resolve();
      expect(await transaction).toMatchObject({ success: true, error: null });
      expect(order).toStrictEqual(["patch 1", "post"]);
      expect(titles(query.getSnapshot().data)).toStrictEqual(["One", "Post 2", "Three"]);
      expect(typeof transaction.id).toBe("string");
      unsubscribe();
    });

    it("drops the writes after a failed one and refetches the rows already written", async () => {
      const { api, db, errors } = context;
      const { query, unsubscribe } = await loadTeam();
      api.patch("/posts/:postId", ({ params, body }) =>
        params.postId === "2"
          ? { status: 400, data: { message: "No" } }
          : { data: createPost(Number(params.postId), body as Partial<Post>) },
      );
      const fetches = () => api.callsTo("/teams/1/full-posts").length;
      const before = fetches();
      const result = await db.transaction((tx) => {
        tx.post.update(1, { title: "One" });
        tx.post.update(2, { title: "Two" });
        tx.post.delete(1);
      });
      expect(result.success).toBeFalse();
      expect(result.error).toMatchObject({ message: "No" });
      await vi.waitFor(() => expect(fetches()).toBe(before + 1));
      expect(titles(query.getSnapshot().data)).toStrictEqual(["Post 1", "Post 2"]);
      expect(api.callsTo("/posts/1", "delete")).toHaveLength(0);
      expect(errors.some((event) => event.error instanceof DependencyError)).toBeTrue();
      unsubscribe();
    });

    it("completes at once without writes, and rejects invalid writes and inserts without a key", async () => {
      const { db, errors } = context;
      expect(await db.transaction(() => {})).toStrictEqual({ success: true, data: [], error: null });

      const invalid = await db.transaction((tx) => {
        tx.post.insert(createPost(4, { title: "" }));
      });
      expect(invalid.success).toBeFalse();
      expect(errors.some((event) => event.type === "validation")).toBeTrue();

      const keyless = await db.transaction((tx) => {
        const { id: _id, ...row } = createPost(5);
        tx.post.insert(row as Post);
      });
      expect(keyless).toMatchObject({ success: false });
      expect(String(keyless.error)).toContain("needs its key");
    });

    it("adds no layer for a collection whose writes are not optimistic", async () => {
      const { api, db } = context;
      api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
      api.patch("/posts/:postId", () => ({ data: null }));
      const one = db.remote.findOne(1);
      const stop = one.subscribe(() => {});
      await vi.waitFor(() => expect(one.getSnapshot().data?.id).toBe(1));
      const transaction = db.transaction((tx) => {
        tx.remote.update(1, { title: "Later" });
      });
      expect(one.getSnapshot().data?.title).toBe("Post 1");
      expect(await transaction).toMatchObject({ success: true });
      expect(one.getSnapshot().data?.title).toBe("Later");
      stop();
    });

    it("validates writes with an asynchronous schema", async () => {
      const client = createHttpClient();
      const requests = createRequests(client);
      const asyncSchema: StandardSchemaV1<Post, Post> = {
        "~standard": { version: 1, vendor: "test", validate: async (value) => ({ value: value as Post }) },
      };
      const AsyncPost = collection(asyncSchema, { key: "id" }).mutate({
        insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      });
      const db = createDb({ post: AsyncPost });
      context.api.post("/posts", ({ body }) => ({ data: body }));
      const result = await db.transaction((tx) => {
        tx.post.insert(createPost(6));
      });
      expect(result.success).toBeTrue();
      db.destroy();
    });
  });

  describe("with a name", () => {
    it("sends every write in one request with the transaction id and keeps the changes", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam();
      const release = deferred();
      api.post("/publish", async () => {
        await release.promise;
        return { data: { ok: true } };
      });
      const transaction = db.transaction("publish", (tx) => {
        tx.post.update(1, { title: "Published" });
        tx.draft.insert(createPost(9));
        tx.post.delete(2);
      });
      expect(titles(query.getSnapshot().data)).toStrictEqual(["Published"]);
      expect(db.draft.findOne(9).local().getSnapshot().data?.id).toBe(9);
      release.resolve();
      expect(await transaction).toStrictEqual({ success: true, data: { ok: true }, error: null });
      const [call] = api.callsTo("/publish", "post");
      expect(call.body).toStrictEqual({
        idempotencyKey: transaction.id,
        mutations: [
          { collection: "post", op: "update", key: 1, values: { title: "Published" } },
          { collection: "draft", op: "insert", key: 9, values: createPost(9) },
          { collection: "post", op: "delete", key: 2, values: {} },
        ],
      });
      expect(titles(query.getSnapshot().data)).toStrictEqual(["Published"]);
      expect(api.callsTo("/posts/1", "patch")).toHaveLength(0);
      unsubscribe();
    });

    it("reverts every write when the request fails and keeps the error as the response gave it", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam();
      api.post("/publish", () => ({ status: 409, data: { message: "Conflict" } }));
      const result = await db.transaction("publish", (tx) => {
        tx.post.update(1, { title: "Published" });
        tx.post.update(2, { title: "Also" });
      });
      expect(result).toMatchObject({ success: false, error: { message: "Conflict" } });
      expect(titles(query.getSnapshot().data)).toStrictEqual(["Post 1", "Post 2"]);
      unsubscribe();
    });

    it("refetches the subsets holding the changed rows with onSuccess refetch", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam();
      api.post("/publish", () => ({ data: { ok: true } }));
      api.get("/teams/:teamId/full-posts", () => ({
        data: { items: [createPost(1, { title: "From server" }), createPost(2)] },
      }));
      api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
      const result = await db.transaction("publishAndReload", (tx) => {
        tx.post.update(1, { title: "Mine" });
        tx.draft.update(8, { title: "Not held" });
      });
      expect(result.success).toBeTrue();
      expect(titles(query.getSnapshot().data)).toStrictEqual(["From server", "Post 2"]);
      expect(db.draft.findOne(8).local().getSnapshot().data).toBeUndefined();
      unsubscribe();
    });

    it("keeps a named transaction in the outbox by name and replays it after a restart", async () => {
      const storage = createMemoryStorage();
      const first = setup({ persistence: { storage }, offline: true, tabs: false });
      first.client.appManager.setOnline(false);
      first.db.transaction("publish", (tx) => {
        tx.draft.insert(createPost(7, { title: "Offline" }));
      });
      await flush();
      first.db.destroy();

      const second = setup({ persistence: { storage }, offline: true, tabs: false });
      const release = deferred();
      const calls: unknown[] = [];
      second.api.post("/publish", async ({ body }) => {
        calls.push(body);
        await release.promise;
        return { data: { ok: true } };
      });
      await second.db.ready;
      // The restored outbox shows the write before it is replayed
      expect(second.db.draft.findOne(7).local().getSnapshot().data?.title).toBe("Offline");
      await vi.waitFor(() => expect(calls).toHaveLength(1));
      expect(calls[0]).toMatchObject({ mutations: [{ collection: "draft", op: "insert", key: 7 }] });
      release.resolve();
      await vi.waitFor(() => expect(second.db.draft.findOne(7).local().getSnapshot().data?.title).toBe("Offline"));
      second.db.destroy();
    });

    it("replays an unnamed transaction offline in order and drops the writes after a rejected one", async () => {
      const offline = setup({ offline: { retryDelay: () => 0 }, tabs: false });
      offline.api.patch("/posts/:postId", () => ({ status: 422, data: { message: "Invalid" } }));
      offline.api.post("/posts", ({ body }) => ({ data: body }));
      const result = await offline.db.transaction((tx) => {
        tx.post.update(1, { title: "One" });
        tx.post.insert(createPost(3));
      });
      expect(result).toMatchObject({ success: false, error: { message: "Invalid" } });
      expect(offline.api.callsTo("/posts", "post")).toHaveLength(0);
      offline.db.destroy();
    });

    it("reports an outbox transaction whose name the db no longer declares", async () => {
      const storage = createMemoryStorage();
      const first = setup({ persistence: { storage }, offline: true, tabs: false });
      first.client.appManager.setOnline(false);
      first.db.transaction("publish", (tx) => {
        tx.post.update(1, { title: "Offline" });
      });
      await flush();
      first.db.destroy();

      const { collections } = createCollections();
      const db = createDb(collections, { persistence: { storage }, offline: true, tabs: false });
      const errors: DbErrorEvent[] = [];
      db.onError((event) => errors.push(event));
      await db.ready;
      expect(String(errors[0]?.error)).toContain('the transaction "publish"');
      db.destroy();
    });
  });

  it("types transaction names and the writes each collection allows", () => {
    const { db } = context;
    const check = () => {
      // @ts-expect-error the db declares no transaction of that name
      db.transaction("missing", () => {});
      db.transaction((tx) => {
        // @ts-expect-error `draft` has no mutations, so only named transactions write it
        tx.draft.insert(createPost(1));
      });
      db.transaction("publish", (tx) => {
        tx.draft.update(1, { title: "Any collection" });
        // @ts-expect-error `title` is a string
        tx.post.update(1, { title: 1 });
      });
    };
    expect(check).toBeFunction();
  });
});
