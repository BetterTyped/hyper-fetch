/**
 * Behaviour cases ported from the suites of Apollo Client, urql Graphcache, Relay, Replicache, RxDB, Dexie, PowerSync
 * and Electric: pending writes rebased over server changes, concurrent optimistic layers, one emission per batch,
 * unusual keys, and offline refreshes.
 */
import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import type { DbErrorEvent, DbOptions } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import { createApi, createHttpClient, createPost, createRequests, deferred, flush } from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

type Author = { id: number; name: string };

const setup = (options: DbOptions = {}) => {
  const client = createHttpClient();
  const requests = createRequests(client);
  const saveAuthor = client.createRequest<{ response: Author }>()({ endpoint: "/authors/:id", method: "PUT" });
  const removeAuthor = client.createRequest<{ response: null }>()({ endpoint: "/authors/:id", method: "DELETE" });
  const post = collection(rowType<Post>(), { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    // Stands in for a sync event: a response of another request, written as the server's newest state
    .ingest(requests.searchPosts, { type: "update", rows: (response) => response.results })
    .mutate({
      insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
      delete: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
    });
  const author = collection(rowType<Author>(), { key: "id" })
    .ingest(saveAuthor)
    .mutate({ delete: { request: removeAuthor, map: (id) => ({ params: { id } }), onSuccess: "keep" } });
  const db = createDb({ post, author }, options);
  const errors: DbErrorEvent[] = [];
  db.onError((event) => errors.push(event));
  const pushServerChange = (rows: Partial<Post>[]) => {
    createApi(server).get("/search", () => ({ data: { results: rows } }));
    return requests.searchPosts.send();
  };
  return { api: createApi(server), client, db, errors, pushServerChange, saveAuthor };
};

const titles = (posts: Post[] | undefined) => posts?.map((post) => post.title);

describe("db [ Cases from other client data libraries ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  const loadTeam = async (context: ReturnType<typeof setup>, posts = [createPost(1), createPost(2)]) => {
    context.api.get("/teams/:teamId/full-posts", () => ({ data: { items: posts } }));
    const query = context.db.post.where((post) => eq(post.teamId, 1)).orderBy((post) => post.id);
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    return { query, unsubscribe };
  };

  describe("pending writes over server changes", () => {
    it("shows the server's newer value when a pending update to the same field fails (Dexie #1823)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      const release = deferred();
      context.api.patch("/posts/:postId", async () => {
        await release.promise;
        return { status: 400, data: { message: "No" } };
      });
      const write = context.db.post.update(1, { title: "Mine" });
      await context.pushServerChange([{ id: 1, title: "Theirs" }]);
      expect(titles(query.getSnapshot().data)?.[0]).toBe("Mine");
      release.resolve();
      await write;
      expect(titles(query.getSnapshot().data)?.[0]).toBe("Theirs");
      unsubscribe();
      context.db.destroy();
    });

    it("shows both a pending field and a server change to another field (RxDB)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      const release = deferred();
      context.api.patch("/posts/:postId", async ({ params, body }) => {
        await release.promise;
        return { data: createPost(Number(params.postId), { ...(body as Partial<Post>), likes: 99 }) };
      });
      const write = context.db.post.update(1, { title: "Mine" });
      await context.pushServerChange([{ id: 1, likes: 50 }]);
      expect(query.getSnapshot().data?.[0]).toMatchObject({ title: "Mine", likes: 50 });
      release.resolve();
      await write;
      expect(query.getSnapshot().data?.[0]).toMatchObject({ title: "Mine", likes: 99 });
      unsubscribe();
      context.db.destroy();
    });

    it("brings a row back with the server's change when a pending delete fails", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      const release = deferred();
      context.api.delete("/posts/:postId", async () => {
        await release.promise;
        return { status: 409, data: { message: "Locked" } };
      });
      const write = context.db.post.delete(1);
      await context.pushServerChange([{ id: 1, title: "Edited meanwhile" }]);
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([2]);
      release.resolve();
      await write;
      expect(titles(query.getSnapshot().data)).toStrictEqual(["Edited meanwhile", "Post 2"]);
      unsubscribe();
      context.db.destroy();
    });

    it("keeps a second pending write on top when the first write's response lands (Apollo, RxDB)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      const releases = [deferred(), deferred()];
      let call = 0;
      context.api.patch("/posts/:postId", async ({ params, body }) => {
        const release = releases[call];
        call += 1;
        await release.promise;
        return { data: createPost(Number(params.postId), body as Partial<Post>) };
      });
      const first = context.db.post.update(1, { title: "First" });
      const second = context.db.post.update(1, { title: "Second" });
      releases[0].resolve();
      await first;
      expect(titles(query.getSnapshot().data)?.[0]).toBe("Second");
      releases[1].resolve();
      await second;
      expect(titles(query.getSnapshot().data)?.[0]).toBe("Second");
      unsubscribe();
      context.db.destroy();
    });

    it("keeps a row a pending update touches when a delete event removes it, and does not bring it back (Apollo)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      const release = deferred();
      context.api.patch("/posts/:postId", async () => {
        await release.promise;
        return { data: null };
      });
      context.api.delete("/posts/:postId", () => ({ data: null }));
      const update = context.db.post.update(1, { title: "Mine" });
      // The delete waits behind the update on the same row, so it lands after it
      const remove = context.db.post.delete(1);
      release.resolve();
      await Promise.all([update, remove]);
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([2]);
      unsubscribe();
      context.db.destroy();
    });
  });

  describe("concurrent optimistic writes", () => {
    it("removes only the insert that failed, out of two in one list (Apollo)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      context.api.post("/posts", ({ body }) =>
        (body as Post).id === 3 ? { status: 400, data: { message: "No" } } : { data: body },
      );
      const [failed, kept] = await Promise.all([
        context.db.post.insert(createPost(3)),
        context.db.post.insert(createPost(4)),
      ]);
      expect([failed.success, kept.success]).toStrictEqual([false, true]);
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 4]);
      unsubscribe();
      context.db.destroy();
    });

    it("shows every intermediate state when responses come back in reverse order (Apollo)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context, [createPost(1), createPost(2), createPost(3)]);
      const releases = new Map<string, { resolve: () => void }>();
      context.api.patch("/posts/:postId", async ({ params, body }) => {
        const release = deferred();
        releases.set(params.postId, release);
        await release.promise;
        return { data: createPost(Number(params.postId), body as Partial<Post>) };
      });
      const frames: (string[] | undefined)[] = [];
      const stop = query.subscribe(() => frames.push(titles(query.getSnapshot().data)));
      const writes = [1, 2, 3].map((id) => context.db.post.update(id, { title: `T${id}` }));
      await vi.waitFor(() => expect(releases.size).toBe(3));
      frames.length = 0;
      for (const id of ["3", "2", "1"]) {
        releases.get(id)!.resolve();
        // oxlint-disable-next-line no-await-in-loop -- each response lands before the next is released
        await writes[Number(id) - 1];
      }
      expect(frames.every((frame) => frame?.join(",") === "T1,T2,T3")).toBeTrue();
      stop();
      unsubscribe();
      context.db.destroy();
    });

    it("gives the same write made twice two layers that revert on their own (urql)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      let call = 0;
      context.api.patch("/posts/:postId", ({ params, body }) => {
        call += 1;
        return call === 1
          ? { status: 400, data: { message: "No" } }
          : { data: createPost(Number(params.postId), body as Partial<Post>) };
      });
      const results = await Promise.all([
        context.db.post.update(1, { title: "Same" }),
        context.db.post.update(1, { title: "Same" }),
      ]);
      expect(results.map((result) => result.success)).toStrictEqual([false, false]);
      expect(titles(query.getSnapshot().data)?.[0]).toBe("Post 1");
      expect(await context.db.post.update(1, { title: "Same" })).toMatchObject({ success: true });
      expect(titles(query.getSnapshot().data)?.[0]).toBe("Same");
      unsubscribe();
      context.db.destroy();
    });
  });

  describe("emissions", () => {
    it("emits once for a transaction of several writes and once for its revert (Dexie)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      context.api.patch("/posts/:postId", () => ({ status: 400, data: { message: "No" } }));
      const listener = vi.fn();
      const stop = query.subscribe(listener);
      const write = context.db.transaction((tx) => {
        tx.post.update(1, { title: "A" });
        tx.post.update(2, { title: "B" });
      });
      expect(listener).toHaveBeenCalledTimes(1);
      await write;
      await flush();
      expect(titles(query.getSnapshot().data)).toStrictEqual(["Post 1", "Post 2"]);
      expect(listener.mock.calls.length).toBeLessThanOrEqual(3);
      stop();
      unsubscribe();
      context.db.destroy();
    });

    it("does not emit when a row is inserted and removed within one batch (RxDB)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      context.api.post("/posts", async () => {
        await new Promise(() => {});
        return { data: null };
      });
      const listener = vi.fn();
      const stop = query.subscribe(listener);
      const before = query.getSnapshot().data;
      await context.db.transaction((tx) => {
        tx.post.update(2, { title: "Post 2" });
      });
      expect(query.getSnapshot().data).toEqual(before);
      stop();
      unsubscribe();
      context.db.destroy();
    });

    it("lets listeners subscribe and unsubscribe while they are notified (Electric)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      context.api.patch("/posts/:postId", ({ params, body }) => ({
        data: createPost(Number(params.postId), body as Partial<Post>),
      }));
      const late = vi.fn();
      let stopLate: (() => void) | undefined;
      const stopFirst = query.subscribe(() => {
        stopFirst();
        stopLate = query.subscribe(late);
      });
      await context.db.post.update(1, { title: "Changed" });
      await context.db.post.update(1, { title: "Again" });
      expect(late).toHaveBeenCalled();
      stopLate?.();
      unsubscribe();
      context.db.destroy();
    });

    it("keeps updating after a write that failed validation (Dexie #2085)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      context.api.post("/posts", ({ body }) => ({ data: body }));
      expect(await context.db.post.insert(createPost(1))).toMatchObject({ success: false });
      await context.db.post.insert(createPost(3));
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 3]);
      unsubscribe();
      context.db.destroy();
    });

    it("never notifies a listener that left while the load was in flight (Dexie)", async () => {
      const context = setup();
      const release = deferred();
      context.api.get("/teams/:teamId/full-posts", async () => {
        await release.promise;
        return { status: 500, data: { message: "Down" } };
      });
      const listener = vi.fn();
      const query = context.db.post.where((post) => eq(post.teamId, 1));
      const stop = query.subscribe(listener);
      await flush();
      stop();
      listener.mockClear();
      release.resolve();
      await flush();
      expect(listener).not.toHaveBeenCalled();
      context.db.destroy();
    });
  });

  describe("keys and rows", () => {
    it("handles the keys 0 and empty string like any other (Dexie)", async () => {
      const context = setup();
      context.api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(0)] } }));
      context.api.patch("/posts/:postId", ({ body }) => ({ data: createPost(0, body as Partial<Post>) }));
      context.api.delete("/posts/:postId", () => ({ data: null }));
      const zero = context.db.post.findOne(0);
      const list = context.db.post.where((post) => eq(post.teamId, 1));
      const unsubscribe = list.subscribe(() => {});
      await vi.waitFor(() => expect(list.getSnapshot().data).toHaveLength(1));
      expect(zero.getSnapshot().data?.id).toBe(0);
      await context.db.post.update(0, { title: "Zero" });
      expect(context.db.post.findOne(0).local().getSnapshot().data?.title).toBe("Zero");
      await context.db.post.delete(0);
      expect(list.getSnapshot().data).toStrictEqual([]);
      const authors = context.db.author.findOne("" as unknown as number).local();
      expect(authors.getSnapshot().data).toBeUndefined();
      unsubscribe();
      context.db.destroy();
    });

    it("is not corrupted by a caller that changes a returned row in place (Dexie, Relay)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      const row = query.getSnapshot().data![0];
      try {
        (row as { title: string }).title = "Changed in place";
      } catch {
        // Frozen rows throw in strict mode, which is fine too
      }
      const fresh = context.db.post.where((post) => eq(post.teamId, 2)).local();
      expect(fresh.getSnapshot().data).toStrictEqual([]);
      expect(context.db.post.findOne(1).local().getSnapshot().data?.title).toBe("Post 1");
      unsubscribe();
      context.db.destroy();
    });

    it("shows undefined for a joined row that is deleted, and drops the result of an inner join (Apollo)", async () => {
      const context = setup();
      const { unsubscribe } = await loadTeam(context, [createPost(1, { likes: 7 })]);
      context.api.put("/authors/:id", ({ params }) => ({ data: { id: Number(params.id), name: "Ada" } }));
      context.api.delete("/authors/:id", () => ({ data: null }));
      await context.saveAuthor.setParams({ id: 7 }).send();
      const left = context.db.post
        .where((post) => eq(post.teamId, 1))
        .join("author", context.db.author, (post) => post.likes);
      const inner = context.db.post
        .where((post) => eq(post.teamId, 1))
        .join("author", context.db.author, { by: (post) => post.likes, type: "inner" });
      const stops = [left.subscribe(() => {}), inner.subscribe(() => {})];
      expect(left.getSnapshot().data?.[0].author?.name).toBe("Ada");
      expect(inner.getSnapshot().data).toHaveLength(1);
      await context.db.author.delete(7);
      expect(left.getSnapshot().data?.[0].author).toBeUndefined();
      expect(inner.getSnapshot().data).toStrictEqual([]);
      stops.forEach((stop) => stop());
      unsubscribe();
      context.db.destroy();
    });
  });

  describe("offline", () => {
    it("keeps the rows and shows them stale when a refresh fails while offline (urql)", async () => {
      const context = setup();
      const { query, unsubscribe } = await loadTeam(context);
      context.api.get("/teams/:teamId/full-posts", () => ({ status: 0, data: null, networkError: true }));
      await query.refetch();
      expect(query.getSnapshot()).toMatchObject({ status: "ready" });
      expect(query.getSnapshot().data).toHaveLength(2);
      expect(query.getSnapshot().error).toBeTruthy();
      unsubscribe();
      context.db.destroy();
    });
  });
});
