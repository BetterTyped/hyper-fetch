import { and, collection, createDb, eq, gt, or, rowType } from "@hyper-fetch/db";
import type { DbChannel, DbErrorEvent, StandardSchemaV1 } from "@hyper-fetch/db";
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

const asyncPostSchema: StandardSchemaV1<Post, Post> = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: async (value) => {
      const row = value as Post;
      return row.title ? { value: row } : { issues: [{ message: "Title is required" }] };
    },
  },
};

const setup = () => {
  const client = createHttpClient();
  const requests = createRequests(client);
  const api = createApi(server);
  const errors: DbErrorEvent[] = [];
  const Post = collection(PostSchema, { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .load(requests.getTeamFullPosts, {
      rows: (response) => response.items,
      where: { ...byTeam, likes: { gt: (likes) => ({ queryParams: { likes_gt: likes } }) } },
    })
    .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) })
    .load(requests.getAllPosts, {
      rows: (response) => response.items,
      cursor: (response) => response.next,
      fixed: { archived: false },
    })
    .mutate({
      insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
      delete: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }) },
    });
  const Validated = collection(asyncPostSchema, { key: "id", validate: "all" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .ingest(requests.searchPosts, { rows: (response) => response.results });
  const Unloaded = collection(rowType<Post>(), { key: "id" }).load(requests.getPostsByIds).ingest(requests.getPost);
  const db = createDb({ post: Post, validated: Validated, unloaded: Unloaded }, { gcTime: 5 });
  const stopErrors = db.onError((event) => errors.push(event));
  return { api, db, errors, requests, client, stopErrors };
};

type Context = ReturnType<typeof setup>;

describe("db [ Edge cases ]", () => {
  let context: Context;

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  describe("queries", () => {
    it("starts queries from the handle and combines where calls", async () => {
      const { api, db } = context;
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2), createPost(3)] } }));
      const query = db.post
        .where((post) => eq(post.teamId, 1))
        .where((post) => or(eq(post.id, 1), eq(post.id, 3)))
        .orderBy((post) => post.teamId)
        .limit(1);
      expect(db.post.select((post) => ({ id: post.id })).definition.select).toStrictEqual({ id: "id" });
      expect(db.post.limit(2).definition.limit).toBe(2);
      expect(db.post.orderBy((post) => post.id).definition.orderBy).toStrictEqual([{ field: "id", direction: "asc" }]);
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1]);
      expect(query.explain().local).toHaveLength(1);
      unsubscribe();
    });

    it("picks the loader that sends the most conditions, and the first one on a tie", async () => {
      const { api, db } = context;
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
      expect(db.post.where((post) => eq(post.teamId, 1)).explain().loader).toBe(0);
      expect(
        db.post
          .where((post) => gt(post.likes, 1))
          .where((post) => eq(post.teamId, 1))
          .explain().loader,
      ).toBe(1);
    });

    it("answers a query nobody subscribes to from a loaded subset, as on a component's first render", async () => {
      const { api, db } = context;
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const team = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = team.subscribe(() => {});
      await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));
      const other = db.post.where((post) => and(eq(post.teamId, 1), gt(post.likes, 0)));
      expect(other.getSnapshot()).toMatchObject({ status: "ready" });
      expect(other.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1]);
      const unloaded = db.post.where((post) => eq(post.teamId, 2));
      expect(unloaded.getSnapshot()).toMatchObject({ status: "loading", data: undefined });
      unsubscribe();
    });

    it("shares a pending load and reuses a fresh key subset", async () => {
      const { api, db } = context;
      const release = deferred();
      api.get("/posts/:postId", async () => {
        await release.promise;
        return { data: createPost(1) };
      });
      const first = db.post.findOne(1);
      const second = db.post.findOne(1).select((post) => ({ title: post.title }));
      const unsubscribeFirst = first.subscribe(() => {});
      const refetches = [first.refetch(), first.refetch()];
      release.resolve();
      await Promise.all(refetches);
      await vi.waitFor(() => expect(first.getSnapshot().data?.id).toBe(1));
      const unsubscribeSecond = second.subscribe(() => {});
      expect(second.getSnapshot().data).toStrictEqual({ title: "Post 1" });
      expect(api.callsTo("/posts/1")).toHaveLength(1);
      unsubscribeFirst();
      unsubscribeSecond();
    });

    it("keeps local queries ready through focus and reconnects", async () => {
      const { db, client } = context;
      const local = db.post.local();
      const unsubscribe = local.subscribe(() => {});
      client.appManager.setFocused(false);
      client.appManager.setFocused(true);
      expect(local.getSnapshot().status).toBe("ready");
      unsubscribe();
    });

    it("reports failures whose response has no error body", async () => {
      const { api, db } = context;
      api.get("/teams/:teamId/full-posts", () => ({ status: 500, data: null }));
      api.get("/posts/:postId", () => ({ status: 500, data: null }));
      const list = db.post.where((post) => eq(post.teamId, 1));
      const one = db.post.findOne(1);
      const unsubscribeList = list.subscribe(() => {});
      const unsubscribeOne = one.subscribe(() => {});
      await vi.waitFor(() => expect(list.getSnapshot().status).toBe("error"));
      await vi.waitFor(() => expect(one.getSnapshot().status).toBe("error"));
      expect(list.getSnapshot().error).toMatchObject({ success: false });
      expect(one.getSnapshot().error).toMatchObject({ success: false });
      unsubscribeList();
      unsubscribeOne();
    });

    it("keeps the rows paginated and released subsets still hold when a subset is collected", async () => {
      const { api, db } = context;
      let items = [createPost(1), createPost(2)];
      api.get("/teams/:teamId/full-posts", () => ({ data: { items } }));
      api.get("/all-posts", () => ({
        data: { items: [createPost(5), createPost(6, { archived: true })], next: "more" },
      }));
      const paged = db.post.select((post) => ({ id: post.id }));
      const unsubscribePaged = paged.subscribe(() => {});
      await vi.waitFor(() => expect(paged.getSnapshot().status).toBe("ready"));
      expect(paged.getSnapshot().data?.map((post) => post.id)).toStrictEqual([5]);

      const list = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribeList = list.subscribe(() => {});
      await vi.waitFor(() => expect(list.getSnapshot().status).toBe("ready"));
      api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
      const detail = db.post.findOne(2);
      const unsubscribeLiked = detail.subscribe(() => {});
      await vi.waitFor(() => expect(detail.getSnapshot().isFetching).toBeFalse());
      items = [createPost(1)];
      await list.refetch();
      unsubscribeList();
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      expect(paged.getSnapshot().data?.map((post) => post.id)).toStrictEqual([5]);
      expect(db.post.findOne(2).local().getSnapshot().data?.id).toBe(2);
      unsubscribeLiked();
      unsubscribePaged();
    });

    it("validates server rows with an async schema, in loads and ingested responses", async () => {
      const { api, db, errors, requests } = context;
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2, { title: "" })] } }));
      api.get("/search", () => ({ data: { results: [createPost(3), createPost(4, { title: "" })] } }));
      const query = db.validated.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1]);
      await requests.searchPosts.send();
      await vi.waitFor(() => expect(db.validated.findOne(3).local().getSnapshot().data?.id).toBe(3));
      expect(errors.filter((event) => event.type === "validation")).toHaveLength(2);
      unsubscribe();
    });

    it("uses responses as rows when a loader or ingest has no mapping", async () => {
      const { api, db, requests } = context;
      api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
      await requests.getPost.setParams({ postId: 8 }).send();
      expect(db.unloaded.findOne(8).local().getSnapshot().data?.id).toBe(8);
    });

    it("places inserts in a paginated subset by its fixed filters and keeps rows held through collection", async () => {
      const { api, db } = context;
      api.get("/all-posts", () => ({
        data: { items: [createPost(5, { teamId: 3 }), createPost(9, { teamId: 3 })], next: "more" },
      }));
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      api.post("/posts", ({ body }) => ({ data: body }));
      const paged = db.post.select((post) => ({ id: post.id }));
      const list = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribePaged = paged.subscribe(() => {});
      const unsubscribeList = list.subscribe(() => {});
      await vi.waitFor(() => expect(paged.getSnapshot().status).toBe("ready"));
      await vi.waitFor(() => expect(list.getSnapshot().status).toBe("ready"));

      await db.post.insert(createPost(6, { archived: true }));
      await db.post.insert(createPost(7));
      await db.post.insert(createPost(10));
      // Without an order, the db cannot tell where a new row falls in a range that has more pages
      expect(paged.getSnapshot().data?.map((post) => post.id)).toStrictEqual([5, 9]);
      expect(list.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 6, 7, 10]);

      const other = db.post.where((post) => eq(post.teamId, 2));
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [] } }));
      const unsubscribeOther = other.subscribe(() => {});
      await vi.waitFor(() => expect(other.getSnapshot().status).toBe("ready"));
      unsubscribeOther();
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      expect(list.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 6, 7, 10]);
      unsubscribePaged();
      unsubscribeList();
    });

    it("keeps a row a refetch excluded from a live list only while another subset holds it", async () => {
      const { api, db } = context;
      let items = [createPost(1), createPost(2)];
      api.get("/teams/:teamId/full-posts", ({ params }) => ({ data: { items: params.teamId === "1" ? items : [] } }));
      api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
      const list = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribeList = list.subscribe(() => {});
      await vi.waitFor(() => expect(list.getSnapshot().status).toBe("ready"));
      const detail = db.post.findOne(2);
      const unsubscribeDetail = detail.subscribe(() => {});
      await vi.waitFor(() => expect(detail.getSnapshot().isFetching).toBeFalse());
      items = [createPost(1)];
      await list.refetch();

      const other = db.post.where((post) => eq(post.teamId, 2));
      const unsubscribeOther = other.subscribe(() => {});
      await vi.waitFor(() => expect(other.getSnapshot().status).toBe("ready"));
      unsubscribeOther();
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      expect(detail.getSnapshot().data?.id).toBe(2);
      expect(list.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1]);
      unsubscribeDetail();
      unsubscribeList();
    });

    it("resets key subsets when the db is cleared", async () => {
      const { api, db } = context;
      api.get("/posts/:postId", () => ({ data: createPost(1) }));
      const one = db.post.findOne(1);
      const unsubscribe = one.subscribe(() => {});
      await vi.waitFor(() => expect(one.getSnapshot().data?.id).toBe(1));
      await db.clear();
      await vi.waitFor(() => expect(api.callsTo("/posts/1")).toHaveLength(2));
      unsubscribe();
    });
  });

  describe("writes", () => {
    it("writes a delete response and an insert response without a key", async () => {
      const { api, db } = context;
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const query = db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      api.delete("/posts/:postId", () => ({ data: null }));
      api.post("/posts", ({ body }) => {
        const { id: _id, ...rest } = body as Post;
        return { data: rest };
      });
      await db.post.delete(1);
      expect(query.getSnapshot().data).toStrictEqual([]);
      await db.post.insert(createPost(4));
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([4]);
      unsubscribe();
    });

    it("reports a failed write without an error body", async () => {
      const { api, db } = context;
      api.patch("/posts/:postId", () => ({ status: 500, data: null }));
      const result = await db.post.update(1, { title: "Lost" });
      expect(result.error).toMatchObject({ success: false });
    });

    it("stops reporting to an error listener that unsubscribed", async () => {
      const { api, db, errors, stopErrors } = context;
      stopErrors();
      api.patch("/posts/:postId", () => ({ status: 400, data: { message: "No" } }));
      await db.post.update(1, { title: "Unheard" });
      expect(errors).toStrictEqual([]);
    });
  });

  describe("outbox", () => {
    it("retries network errors, reports writes it cannot replay and ignores outcomes it does not know", async () => {
      const client = createHttpClient();
      const requests = createRequests(client);
      const api = createApi(server);
      const Post = collection(rowType<Post>(), { key: "id" }).mutate({
        update: {
          request: requests.updatePostRequest,
          map: (key, changes) => ({ params: { postId: key }, payload: changes }),
        },
      });
      const messages: unknown[] = [];
      let deliver: ((event: { data: unknown }) => void) | undefined;
      const channel: DbChannel = {
        postMessage: (message) => messages.push(message),
        addEventListener: (_type, listener) => {
          deliver = listener;
        },
        removeEventListener: () => {},
        close: () => {},
      };
      const storage = createMemoryStorage();
      const db = createDb(
        { post: Post },
        { offline: { retryDelay: () => 0 }, persistence: { storage }, tabs: { channel } },
      );
      const errors: DbErrorEvent[] = [];
      db.onError((event) => errors.push(event));
      await db.ready;

      let attempts = 0;
      api.patch("/posts/:postId", () => {
        attempts += 1;
        return attempts === 1 ? { networkError: true } : { data: createPost(1) };
      });
      expect(await db.post.update(1, { title: "Retried" })).toMatchObject({ success: true });

      client.appManager.setOnline(false);
      const queued = db.post.update(2, { title: "Queued" });
      await flush();
      await flush();
      client.appManager.setOnline(true);
      expect(await queued).toMatchObject({ success: true });
      expect(api.callsTo("/posts/2", "patch")).toHaveLength(1);

      const undeclared = db.post as unknown as { delete: (key: number) => PromiseLike<{ error: unknown }> };
      const undeclaredResult = await undeclared.delete(1);
      expect(String(undeclaredResult.error)).toContain("declares no delete mutation");

      const foreign = { id: "f", collection: "missing", op: "update", key: 1, values: {}, dependsOn: [], sent: false };
      deliver!({ data: { type: "enqueue", records: [foreign, foreign] } });
      deliver!({ data: { type: "outcome", id: "unknown", success: true } });
      deliver!({ data: { type: "rows", collection: "missing", rows: [] } });
      await flush();
      expect(errors.filter((event) => event.type === "outbox")).toHaveLength(2);
      // The tab that leads asks the others for the writes they wait for
      expect(messages).toContainEqual({ type: "leader" });
      db.destroy();
    });

    it("lets the replaying tab ignore its own outbox announcements and keep known records once", async () => {
      const client = createHttpClient();
      const requests = createRequests(client);
      const api = createApi(server);
      const Post = collection(rowType<Post>(), { key: "id" }).mutate({
        update: {
          request: requests.updatePostRequest,
          map: (key, changes) => ({ params: { postId: key }, payload: changes }),
        },
      });
      let deliver: ((event: { data: unknown }) => void) | undefined;
      const channel: DbChannel = {
        postMessage: () => {},
        addEventListener: (_type, listener) => {
          deliver = listener;
        },
        removeEventListener: () => {},
        close: () => {},
      };
      const locks = { request: () => Promise.resolve() };
      const storage = createMemoryStorage();
      const follower = createDb({ post: Post }, { offline: true, persistence: { storage }, tabs: { channel, locks } });
      await follower.ready;
      client.appManager.setOnline(false);
      const write = follower.post.update(1, { title: "Queued" });
      await flush();
      deliver!({ data: { type: "enqueue", records: [] } });
      deliver!({ data: { type: "leader" } });
      deliver!({ data: { type: "rows", collection: "post", rows: [[1, createPost(1)]] } });
      await flush();
      expect(follower.post.findOne(1).local().getSnapshot().data).toBeUndefined();
      expect(api.calls).toHaveLength(0);
      deliver!({ data: { type: "outcome", id: write.id, success: true } });
      await flush();
      client.appManager.setOnline(true);
      follower.destroy();
    });

    it("shows restored rows when the network outlasts the timeout", async () => {
      const storage = createMemoryStorage();
      const client = createHttpClient();
      const requests = createRequests(client);
      const api = createApi(server);
      const Post = collection(rowType<Post>(), { key: "id" }).load(requests.getTeamFullPosts, {
        rows: (response) => response.items,
        where: byTeam,
      });
      const first = createDb({ post: Post }, { persistence: { storage }, tabs: false });
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      const query = first.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      await flush();
      unsubscribe();
      first.destroy();

      const release = deferred();
      api.get("/teams/:teamId/full-posts", async () => {
        await release.promise;
        return { data: { items: [createPost(1)] } };
      });
      const second = createDb({ post: Post }, { persistence: { storage, networkTimeout: 10 }, tabs: false });
      const restored = second.post.where((post) => eq(post.teamId, 1));
      const stop = restored.subscribe(() => {});
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });
      expect(restored.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1]);
      release.resolve();
      await vi.waitFor(() => expect(restored.getSnapshot().stale).toBeFalse());
      stop();
      second.destroy();
    });
  });
});
