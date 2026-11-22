/**
 * What happens when user code or storage throws: a mapping that breaks on an unexpected response, a broken store, or
 * a dependency that is still pending. Nothing may stay pending for good, and every failure is reported.
 */
import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import type { DbErrorEvent, DbOptions } from "@hyper-fetch/db";
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

const setup = (options: DbOptions = {}) => {
  const requests = createRequests(createHttpClient());
  const post = collection(rowType<Post>(), { key: "id" })
    // A response without `items` breaks the mapping, as an API that answers 200 with an error body would
    .load(requests.getTeamFullPosts, { rows: (response) => response.items.map((item) => item), where: byTeam })
    .load(requests.getPost, {
      byKey: (id) => ({ params: { postId: id } }),
      rows: (response) => {
        if (!response.id) {
          throw new Error("Not a post");
        }
        return [response];
      },
    })
    .mutate({
      insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
        onSuccess: "refetch",
      },
      delete: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
    });
  const db = createDb({ post }, options);
  const errors: DbErrorEvent[] = [];
  db.onError((event) => errors.push(event));
  return { api: createApi(server), db, errors };
};

describe("db [ Errors in user code and storage ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  it("fails a list load whose mapping throws, reports it, and loads again later", async () => {
    const { api, db, errors } = setup();
    api.get("/teams/:teamId/full-posts", () => ({ data: { error: "Maintenance" } }));
    const query = db.post.where((post) => eq(post.teamId, 1));
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("error"));
    expect(errors.some((event) => event.type === "load")).toBeTrue();
    expect(query.getSnapshot().isFetching).toBeFalse();
    api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
    await query.refetch();
    expect(query.getSnapshot()).toMatchObject({ status: "ready", error: null });
    unsubscribe();
    db.destroy();
  });

  it("fails a key load whose mapping throws, and settles every key of the batch", async () => {
    const { api, db, errors } = setup();
    api.get("/posts/:postId", () => ({ data: {} }));
    const one = db.post.findOne(1);
    const unsubscribe = one.subscribe(() => {});
    await vi.waitFor(() => expect(one.getSnapshot().status).toBe("error"));
    expect(errors.some((event) => event.type === "load")).toBeTrue();
    unsubscribe();
    db.destroy();
  });

  it("drops a key load that answers after the db was cleared", async () => {
    const { api, db } = setup();
    const release = deferred();
    api.get("/posts/:postId", async ({ params }) => {
      await release.promise;
      return { data: createPost(Number(params.postId)) };
    });
    const one = db.post.findOne(1);
    const unsubscribe = one.subscribe(() => {});
    await flush();
    await db.clear();
    release.resolve();
    await flush();
    expect(db.post.findOne(1).local().getSnapshot().data).toBeUndefined();
    unsubscribe();
    db.destroy();
  });

  it("refetches a row read by key after a write that refetches, without waiting for itself", async () => {
    const { api, db } = setup();
    let title = "Before";
    api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId), { title }) }));
    api.patch("/posts/:postId", () => {
      title = "After";
      return { data: null };
    });
    const one = db.post.findOne(1);
    const unsubscribe = one.subscribe(() => {});
    await vi.waitFor(() => expect(one.getSnapshot().data?.title).toBe("Before"));
    expect(await db.post.update(1, { title: "After" })).toMatchObject({ success: true });
    expect(one.getSnapshot().data?.title).toBe("After");
    unsubscribe();
    db.destroy();
  });

  it("starts with what the network brings when the persisted rows are broken", async () => {
    const storage = createMemoryStorage({
      "hf-db:default:rows:post": JSON.stringify({ version: 1, rows: 5, subsets: [] }),
    });
    const { api, db, errors } = setup({ persistence: { storage }, tabs: false });
    await db.ready;
    expect(errors.some((event) => event.type === "persistence")).toBeTrue();
    api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
    const state = await db.post.where((post) => eq(post.teamId, 1)).get();
    expect(state.data).toHaveLength(1);
    db.destroy();
  });

  it("waits for a pending dependency, and treats one it never saw as done", async () => {
    const { api, db } = setup();
    const release = deferred();
    api.post("/posts", async () => {
      await release.promise;
      return { status: 400, data: { message: "No" } };
    });
    api.delete("/posts/:postId", () => ({ data: null }));
    const parent = db.post.insert(createPost(1));
    const child = db.post.delete(2, { dependsOn: [parent] });
    const unrelated = db.post.delete(3, { dependsOn: ["written-in-another-session"] });
    expect(await unrelated).toMatchObject({ success: true });
    release.resolve();
    expect(await parent).toMatchObject({ success: false });
    expect(await child).toMatchObject({ success: false });
    expect(api.callsTo("/posts/2", "delete")).toHaveLength(0);
    db.destroy();
  });

  it("drops a queued write whose dependency already failed, without sending it", async () => {
    const { api, db } = setup({ offline: { retryDelay: () => 0 } });
    api.post("/posts", () => ({ status: 400, data: { message: "No" } }));
    api.delete("/posts/:postId", () => ({ data: null }));
    const parent = db.post.insert(createPost(1));
    expect(await parent).toMatchObject({ success: false });
    expect(await db.post.delete(2, { dependsOn: [parent] })).toMatchObject({ success: false });
    expect(api.callsTo("/posts/2", "delete")).toHaveLength(0);
    db.destroy();
  });

  it("reports nothing for a write that fails after the db was cleared", async () => {
    const { api, db, errors } = setup();
    const release = deferred();
    api.delete("/posts/:postId", async () => {
      await release.promise;
      return { status: 500, data: { message: "Down" } };
    });
    const write = db.post.delete(1);
    await flush();
    await db.clear();
    release.resolve();
    expect(await write).toMatchObject({ success: false, error: new Error("Cleared") });
    await flush();
    expect(errors.filter((event) => event.type === "mutation")).toStrictEqual([]);
    db.destroy();
  });
});
