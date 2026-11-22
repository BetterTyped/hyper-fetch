import { DependencyError, collection, createDb, eq, rowType } from "@hyper-fetch/db";
import type { DbErrorEvent, StandardSchemaV1 } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import {
  PostSchema,
  createApi,
  createHttpClient,
  createPost,
  createRequests,
  deferred,
  flush,
} from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

const setup = () => {
  const client = createHttpClient();
  const requests = createRequests(client);
  const api = createApi(server);
  const base = collection(PostSchema, { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) });
  const Post = base.mutate({
    insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
    update: {
      request: requests.updatePostRequest,
      map: (key, changes, { id }) => ({ params: { postId: key }, payload: { ...changes, updatedAt: id.length } }),
    },
    delete: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
  });
  const Kept = base.mutate({
    update: {
      request: requests.updatePostRequest,
      map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      onSuccess: "keep",
    },
  });
  const Refetched = base.mutate({
    update: {
      request: requests.deletePostRequest,
      map: (key) => ({ params: { postId: key } }),
      onSuccess: "refetch",
    },
    insert: {
      request: requests.createPostRequest,
      map: (row) => ({ payload: row }),
      row: (response) => ({ ...response, title: `${response.title}!` }),
    },
  });
  const Plain = collection(PostSchema, { key: "id" }).mutate({
    update: {
      request: requests.updatePostRequest,
      map: (key, changes) => ({ params: { postId: key }, payload: changes }),
    },
  });
  const Loose = collection(rowType<Post>(), { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .mutate({
      insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
    });
  const errors: DbErrorEvent[] = [];
  const db = createDb({ post: Post, kept: Kept, refetched: Refetched, plain: Plain, loose: Loose });
  db.onError((event) => errors.push(event));
  return { api, db, errors, requests };
};

type Context = ReturnType<typeof setup>;

type LiveQueryLike<State> = {
  subscribe(listener: () => void): () => void;
  getSnapshot(): State;
  refetch(): Promise<void>;
};

const loadTeam = async <State extends { status: string }>(query: LiveQueryLike<State>) => {
  const unsubscribe = query.subscribe(() => {});
  await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
  return { query, unsubscribe };
};

const titles = (state: { data: Post[] | undefined }) => state.data?.map((post) => post.title);

describe("db [ Mutations ]", () => {
  let context: Context;

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
    context.api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  describe("when an update succeeds", () => {
    it("shows the change at once and writes the response", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam(context.db.post.where((post) => eq(post.teamId, 1)));
      api.patch("/posts/:postId", ({ body }) => ({ data: createPost(1, { ...(body as Partial<Post>), likes: 50 }) }));
      const write = db.post.update(1, { title: "Optimistic" });
      expect(write.id).toBeString();
      expect(titles(query.getSnapshot())).toStrictEqual(["Optimistic", "Post 2"]);
      const result = await write;
      expect(result).toMatchObject({ success: true, error: null });
      expect(query.getSnapshot().data?.[0]).toMatchObject({ title: "Optimistic", likes: 50 });
      expect(api.callsTo("/posts/1", "patch")[0].body).toMatchObject({ title: "Optimistic", updatedAt: 36 });
      unsubscribe();
    });

    it("keeps the optimistic change as the server state with onSuccess keep", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam(context.db.kept.where((post) => eq(post.teamId, 1)));
      api.patch("/posts/:postId", () => ({ data: null }));
      await db.kept.update(2, { title: "Kept" });
      expect(titles(query.getSnapshot())).toStrictEqual(["Post 1", "Kept"]);
      unsubscribe();
    });

    it("keeps the layer until the refetch wrote its rows with onSuccess refetch", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam(context.db.refetched.where((post) => eq(post.teamId, 1)));
      const seen: (string | undefined)[] = [];
      const stopWatching = query.subscribe(() => seen.push(query.getSnapshot().data?.[0].title));
      api.delete("/posts/:postId", () => ({ data: null }));
      api.get("/teams/:teamId/full-posts", () => ({
        data: { items: [createPost(1, { title: "From server" }), createPost(2)] },
      }));
      await db.refetched.update(1, { title: "Optimistic" });
      expect(titles(query.getSnapshot())).toStrictEqual(["From server", "Post 2"]);
      expect(seen.filter(Boolean)).not.toContain("Post 1");
      stopWatching();
      unsubscribe();
    });

    it("writes a kept change when no subset holds the row to refetch", async () => {
      const { api, db } = context;
      api.delete("/posts/:postId", () => ({ data: null }));
      api.post("/posts", ({ body }) => ({ data: { ...(body as Post), id: 3 } }));
      await db.refetched.insert(createPost(3));
      const result = await db.refetched.update(3, { title: "Alone" });
      expect(result.success).toBeTrue();
      expect(db.refetched.findOne(3).local().getSnapshot().data?.title).toBe("Alone");
    });

    it("ignores a response that is not an object", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam(context.db.post.where((post) => eq(post.teamId, 1)));
      api.patch("/posts/:postId", () => ({ data: "ok" }));
      await db.post.update(1, { title: "Changed" });
      expect(titles(query.getSnapshot())).toStrictEqual(["Post 1", "Post 2"]);
      unsubscribe();
    });
  });

  describe("when a write fails", () => {
    it("reverts the change and reports the error", async () => {
      const { api, db, errors } = context;
      const { query, unsubscribe } = await loadTeam(context.db.post.where((post) => eq(post.teamId, 1)));
      api.patch("/posts/:postId", () => ({ status: 400, data: { message: "Invalid" } }));
      const result = await db.post.update(1, { title: "Rejected" });
      expect(result).toMatchObject({ success: false, error: { message: "Invalid" } });
      expect(titles(query.getSnapshot())).toStrictEqual(["Post 1", "Post 2"]);
      expect(errors).toMatchObject([{ type: "mutation", collection: "post" }]);
      unsubscribe();
    });

    it("sends writes to one row in order and drops the ones built on a failed write", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam(context.db.post.where((post) => eq(post.teamId, 1)));
      const release = deferred();
      api.patch("/posts/:postId", async () => {
        await release.promise;
        return { status: 400, data: { message: "Invalid" } };
      });
      const first = db.post.update(1, { title: "First" });
      const second = db.post.update(1, { likes: 99 });
      const other = db.post.update(2, { title: "Other row" });
      expect(query.getSnapshot().data?.[0]).toMatchObject({ title: "First", likes: 99 });
      await flush();
      expect(api.callsTo("/posts/1", "patch")).toHaveLength(1);
      release.resolve();
      expect(await first).toMatchObject({ success: false });
      const dropped = await second;
      expect(dropped.error).toBeInstanceOf(DependencyError);
      await other;
      expect(api.callsTo("/posts/1", "patch")).toHaveLength(1);
      expect(query.getSnapshot().data?.[0]).toMatchObject({ title: "Post 1", likes: 1 });
      unsubscribe();
    });

    it("fails a write the collection declares no mutation for", async () => {
      const { db } = context;
      const writable = db.kept as unknown as { delete: (key: number) => PromiseLike<{ error: unknown }> };
      const result = await writable.delete(1);
      expect(String(result.error)).toContain("declares no delete mutation");
    });
  });

  describe("when rows are inserted and deleted", () => {
    it("shows an inserted row in matching lists and writes the server's row", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam(context.db.post.where((post) => eq(post.teamId, 1)));
      api.post("/posts", ({ body }) => ({ data: { ...(body as Post), likes: 7 } }));
      const write = db.post.insert(createPost(3));
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 3]);
      await write;
      expect(query.getSnapshot().data?.[2].likes).toBe(7);
      unsubscribe();
    });

    it("swaps a temporary key for the server's in one step and keeps the render key", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam(context.db.loose.where((post) => eq(post.teamId, 1)));
      const release = deferred();
      api.post("/posts", async ({ body }) => {
        await release.promise;
        return { data: { ...(body as Post), id: 42 } };
      });
      api.patch("/posts/:postId", ({ params, body }) => ({
        data: createPost(Number(params.postId), body as Partial<Post>),
      }));
      const { id: _id, ...withoutKey } = createPost(0);
      const insert = db.loose.insert(withoutKey as Post);
      const temporary = query.getSnapshot().data![2];
      expect(String(temporary.id)).toStartWith("tmp:");
      const renderKey = db.loose.renderKey(temporary.id);
      const update = db.loose.update(temporary.id, { title: "After insert" });

      release.resolve();
      await insert;
      await update;
      expect(api.callsTo("/posts", "post")[0].body).not.toHaveProperty("id");
      expect(api.callsTo("/posts/42", "patch")).toHaveLength(1);
      expect(query.getSnapshot().data?.[2]).toMatchObject({ id: 42, title: "After insert" });
      expect(db.loose.renderKey(42)).toBe(renderKey);
      expect(db.loose.findOne(temporary.id).local().getSnapshot().data?.id).toBe(42);
      unsubscribe();
    });

    it("maps an insert response through row", async () => {
      const { api, db } = context;
      api.post("/posts", ({ body }) => ({ data: body }));
      await db.refetched.insert(createPost(5));
      expect(db.refetched.findOne(5).local().getSnapshot().data?.title).toBe("Post 5!");
    });

    it("removes a deleted row at once and brings it back when the delete fails", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam(context.db.post.where((post) => eq(post.teamId, 1)));
      api.delete("/posts/:postId", () => ({ status: 409, data: { message: "Conflict" } }));
      const write = db.post.delete(1);
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([2]);
      await write;
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2]);

      api.delete("/posts/:postId", () => ({ data: null }));
      await db.post.delete(2);
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1]);
      unsubscribe();
    });

    it("waits for writes in flight before a refetch of the collection starts", async () => {
      const { api, db } = context;
      const { query, unsubscribe } = await loadTeam(context.db.post.where((post) => eq(post.teamId, 1)));
      const release = deferred();
      api.patch("/posts/:postId", async () => {
        await release.promise;
        return { data: createPost(1, { title: "Saved" }) };
      });
      const write = db.post.update(1, { title: "Saved" });
      const refetch = query.refetch();
      await flush();
      expect(api.callsTo("/teams/1/full-posts")).toHaveLength(1);
      release.resolve();
      await write;
      await refetch;
      expect(api.callsTo("/teams/1/full-posts")).toHaveLength(2);
      unsubscribe();
    });
  });

  describe("when writes are validated", () => {
    it("rejects an invalid insert and update without sending them", async () => {
      const { api, db, errors } = context;
      const { query, unsubscribe } = await loadTeam(context.db.post.where((post) => eq(post.teamId, 1)));
      const insert = await db.post.insert(createPost(3, { title: "" }));
      const update = await db.post.update(1, { title: "" });
      expect(insert.success).toBeFalse();
      expect(update.success).toBeFalse();
      expect(errors.map((event) => event.type)).toStrictEqual(["validation", "validation"]);
      expect(api.calls.filter((call) => call.method !== "get")).toHaveLength(0);
      expect(titles(query.getSnapshot())).toStrictEqual(["Post 1", "Post 2"]);
      unsubscribe();
    });

    it("sends an update for a row the db does not hold without validating it", async () => {
      const { api, db } = context;
      api.patch("/posts/:postId", () => ({ data: createPost(9) }));
      const result = await db.plain.update(9, { title: "" });
      expect(result.success).toBeTrue();
    });

    it("waits for an async schema before applying the write", async () => {
      const client = createHttpClient();
      const requests = createRequests(client);
      const AsyncSchema: StandardSchemaV1<Post, Post> = {
        "~standard": {
          version: 1,
          vendor: "test",
          validate: async (value) => {
            const row = value as Post;
            return row.title ? { value: { ...row, title: row.title.trim() } } : { issues: [{ message: "Required" }] };
          },
        },
      };
      const AsyncPost = collection(AsyncSchema, { key: "id" }).mutate({
        insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      });
      const db = createDb({ post: AsyncPost });
      context.api.post("/posts", ({ body }) => ({ data: body }));
      const accepted = await db.post.insert(createPost(4, { title: "  Trimmed  " }));
      const rejected = await db.post.insert(createPost(5, { title: "" }));
      expect(accepted.success).toBeTrue();
      expect(rejected.success).toBeFalse();
      expect(db.post.findOne(4).local().getSnapshot().data?.title).toBe("Trimmed");
      db.destroy();
    });
  });
});
