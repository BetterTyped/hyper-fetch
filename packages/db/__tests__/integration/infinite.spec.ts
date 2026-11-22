import { collection, createDb } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import { PostSchema, createApi, createHttpClient, createPost, deferred } from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

/** The backend's page size, which differs from the UI's on purpose */
const BACKEND_PAGE = 2;

const setup = () => {
  const client = createHttpClient();
  const api = createApi(server);
  const getFeed = client.createRequest<{
    response: { items: Post[]; next: string | null };
    queryParams?: { cursor?: string; sort?: string };
  }>()({ endpoint: "/feed" });
  const getTop = client.createRequest<{ response: Post[]; queryParams?: { limit?: number; sort?: string } }>()({
    endpoint: "/top",
  });
  const getAll = client.createRequest<{ response: Post[] }>()({ endpoint: "/everything" });
  const createPostRequest = client.createRequest<{ response: Post; payload: Post }>()({
    endpoint: "/posts",
    method: "POST",
  });
  const deletePostRequest = client.createRequest<{ response: null }>()({
    endpoint: "/posts/:postId",
    method: "DELETE",
  });
  const sort = { createdAt: (direction: "asc" | "desc") => ({ queryParams: { sort: direction } }) };

  const Feed = collection(PostSchema, { key: "id" })
    .load(getFeed, {
      rows: (response) => response.items,
      cursor: (response) => response.next,
      page: (cursor) => ({ queryParams: { cursor } }),
      orderBy: sort,
    })
    .mutate({
      insert: { request: createPostRequest, map: (row) => ({ payload: row }) },
      delete: { request: deletePostRequest, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
    });
  const Top = collection(PostSchema, { key: "id" }).load(getTop, {
    limit: (limit) => ({ queryParams: { limit } }),
    orderBy: sort,
  });
  const All = collection(PostSchema, { key: "id" }).load(getAll);
  const db = createDb({ feed: Feed, top: Top, all: All });
  return { api, db };
};

const byDate = (left: Post, right: Post) => left.createdAt.localeCompare(right.createdAt);

/** A cursor backend over `rows`, sorted by `createdAt`, `BACKEND_PAGE` rows per page */
const serveFeed = (api: ReturnType<typeof setup>["api"], rows: () => Post[]) => {
  api.get("/feed", ({ url }) => {
    const start = Number(url.searchParams.get("cursor") ?? 0);
    const sorted = rows().toSorted(byDate);
    const end = start + BACKEND_PAGE;
    return { data: { items: sorted.slice(start, end), next: end < sorted.length ? String(end) : null } };
  });
};

const ids = (items: Post[] | undefined) => items?.map((post) => post.id);

describe("db [ Infinite queries ]", () => {
  let context = setup();

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  it("loads backend pages until the window has one row past it, through a partial last page", async () => {
    const { api, db } = context;
    serveFeed(api, () => [1, 2, 3, 4, 5].map((id) => createPost(id)));
    const feed = db.feed.orderBy((post) => post.createdAt).infinite({ pageSize: 3 });
    const unsubscribe = feed.subscribe(() => {});
    await vi.waitFor(() => expect(feed.getSnapshot()).toMatchObject({ status: "ready", isFetchingNextPage: false }));
    expect(ids(feed.getSnapshot().data)).toStrictEqual([1, 2, 3]);
    expect(feed.getSnapshot().hasNextPage).toBeTrue();
    expect(api.callsTo("/feed")).toHaveLength(2);

    await feed.fetchNextPage();
    expect(feed.getSnapshot().pages.map(ids)).toStrictEqual([
      [1, 2, 3],
      [4, 5],
    ]);
    expect(feed.getSnapshot().hasNextPage).toBeFalse();
    expect(api.callsTo("/feed")).toHaveLength(3);

    await feed.fetchNextPage();
    expect(api.callsTo("/feed")).toHaveLength(3);
    expect(ids(feed.getSnapshot().data)).toStrictEqual([1, 2, 3, 4, 5]);
    unsubscribe();
  });

  it("shows an exact last page without another page and an empty result as no pages", async () => {
    const { api, db } = context;
    serveFeed(api, () => [1, 2, 3, 4].map((id) => createPost(id)));
    api.get("/everything", () => ({ data: [] }));
    const feed = db.feed.orderBy((post) => post.createdAt).infinite({ pageSize: 2 });
    const empty = db.all.orderBy((post) => post.id).infinite({ pageSize: 2 });
    const unsubscribes = [feed.subscribe(() => {}), empty.subscribe(() => {})];
    await vi.waitFor(() => expect(feed.getSnapshot().isFetchingNextPage).toBeFalse());
    await vi.waitFor(() => expect(feed.getSnapshot().data).toHaveLength(2));
    await feed.fetchNextPage();
    expect(feed.getSnapshot()).toMatchObject({ hasNextPage: false });
    expect(feed.getSnapshot().pages).toHaveLength(2);
    await vi.waitFor(() => expect(empty.getSnapshot().status).toBe("ready"));
    expect(empty.getSnapshot()).toMatchObject({ data: [], pages: [], hasNextPage: false });
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  });

  it("widens the window over rows the db holds without a request", async () => {
    const { api, db } = context;
    api.get("/everything", () => ({ data: [5, 4, 3, 2, 1].map((id) => createPost(id)) }));
    const all = db.all.orderBy((post) => post.id).infinite({ pageSize: 2 });
    const unsubscribe = all.subscribe(() => {});
    await vi.waitFor(() => expect(all.getSnapshot().status).toBe("ready"));
    expect(ids(all.getSnapshot().data)).toStrictEqual([1, 2]);
    await all.fetchNextPage();
    expect(ids(all.getSnapshot().data)).toStrictEqual([1, 2, 3, 4]);
    expect(api.callsTo("/everything")).toHaveLength(1);

    expect(() => db.all.orderBy((post) => post.id).infinite({ pageSize: 0 })).toThrow("pageSize");
    expect(() => db.all.orderBy((post) => post.id).infinite({ pageSize: 1.5 })).toThrow("pageSize");

    const local = db.all
      .local()
      .orderBy((post) => post.id, "desc")
      .infinite({ pageSize: 3 });
    const stopLocal = local.subscribe(() => {});
    expect(ids(local.getSnapshot().data)).toStrictEqual([5, 4, 3]);
    await local.fetchNextPage();
    expect(local.getSnapshot().pages.map(ids)).toStrictEqual([
      [5, 4, 3],
      [2, 1],
    ]);
    stopLocal();
    unsubscribe();
  });

  it("sends a growing limit to a loader without a cursor and shows the last window while it loads", async () => {
    const { api, db } = context;
    const release = deferred();
    let gate = false;
    api.get("/top", async ({ url }) => {
      if (gate) {
        await release.promise;
      }
      return { data: [1, 2, 3, 4, 5, 6].map((id) => createPost(id)).slice(0, Number(url.searchParams.get("limit"))) };
    });
    const top = db.top.orderBy((post) => post.createdAt).infinite({ pageSize: 2 });
    const unsubscribe = top.subscribe(() => {});
    await vi.waitFor(() => expect(top.getSnapshot().status).toBe("ready"));
    expect(ids(top.getSnapshot().data)).toStrictEqual([1, 2]);
    expect(top.getSnapshot().hasNextPage).toBeTrue();

    gate = true;
    const next = top.fetchNextPage();
    const again = top.fetchNextPage();
    expect(top.getSnapshot()).toMatchObject({ isFetchingNextPage: true });
    expect(ids(top.getSnapshot().data)).toStrictEqual([1, 2]);
    release.resolve();
    await Promise.all([next, again]);
    await vi.waitFor(() => expect(top.getSnapshot().isFetchingNextPage).toBeFalse());
    expect(ids(top.getSnapshot().data)).toStrictEqual([1, 2, 3, 4]);
    expect(api.callsTo("/top").map((call) => call.url.searchParams.get("limit"))).toStrictEqual(["3", "5"]);
    unsubscribe();

    // Pages load for subscribers only, as queries do
    const reader = db.top.orderBy((post) => post.createdAt).infinite({ pageSize: 3 });
    await reader.fetchNextPage();
    expect(api.callsTo("/top")).toHaveLength(2);
  });

  it("keeps the window live: an insert shifts rows across pages and a delete pulls the next row in", async () => {
    const { api, db } = context;
    const rows = [1, 2, 3, 4, 5, 6].map((id) => createPost(id));
    serveFeed(api, () => rows);
    api.post("/posts", ({ body }) => ({ data: body }));
    api.delete("/posts/:postId", () => ({ data: null }));
    const feed = db.feed.orderBy((post) => post.createdAt).infinite({ pageSize: 2 });
    const unsubscribe = feed.subscribe(() => {});
    await vi.waitFor(() => expect(feed.getSnapshot().isFetchingNextPage).toBeFalse());
    await vi.waitFor(() => expect(feed.getSnapshot().data).toHaveLength(2));
    await feed.fetchNextPage();
    expect(feed.getSnapshot().pages.map(ids)).toStrictEqual([
      [1, 2],
      [3, 4],
    ]);

    await db.feed.insert(createPost(0, { createdAt: "2026-01-00" }));
    expect(feed.getSnapshot().pages.map(ids)).toStrictEqual([
      [0, 1],
      [2, 3],
    ]);

    await db.feed.delete(1);
    await db.feed.delete(2);
    await db.feed.delete(3);
    // The window ran short, so the next backend page loaded
    await vi.waitFor(() => expect(ids(feed.getSnapshot().data)).toStrictEqual([0, 4, 5, 6]));
    unsubscribe();
  });

  it("shows equal sort values that span backend pages once each, in key order", async () => {
    const { api, db } = context;
    const rows = [1, 2, 3, 4, 5].map((id) => createPost(id, { createdAt: "2026-01-01" }));
    serveFeed(api, () => rows);
    const feed = db.feed.orderBy((post) => post.createdAt).infinite({ pageSize: 2 });
    const unsubscribe = feed.subscribe(() => {});
    await vi.waitFor(() => expect(feed.getSnapshot().isFetchingNextPage).toBeFalse());
    await vi.waitFor(() => expect(feed.getSnapshot().data).toHaveLength(2));
    await feed.fetchNextPage();
    await feed.fetchNextPage();
    expect(ids(feed.getSnapshot().data)).toStrictEqual([1, 2, 3, 4, 5]);
    expect(feed.getSnapshot().hasNextPage).toBeFalse();
    unsubscribe();
  });

  it("makes one request for two calls at once and resolves both", async () => {
    const { api, db } = context;
    serveFeed(api, () => [1, 2, 3, 4, 5, 6, 7].map((id) => createPost(id)));
    const feed = db.feed.orderBy((post) => post.createdAt).infinite({ pageSize: 2 });
    const unsubscribe = feed.subscribe(() => {});
    await vi.waitFor(() => expect(feed.getSnapshot().isFetchingNextPage).toBeFalse());
    await vi.waitFor(() => expect(feed.getSnapshot().data).toHaveLength(2));
    const calls = api.callsTo("/feed").length;
    await Promise.all([feed.fetchNextPage(), feed.fetchNextPage()]);
    expect(api.callsTo("/feed")).toHaveLength(calls + 1);
    expect(feed.getSnapshot().pages).toHaveLength(2);
    unsubscribe();
  });

  it("keeps the pages when a page fails, resolves, and continues on the next call", async () => {
    const { api, db } = context;
    let failing = false;
    const rows = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => createPost(id));
    api.get("/feed", ({ url }) => {
      const start = Number(url.searchParams.get("cursor") ?? 0);
      if (failing && start > 0) {
        return { status: 500, data: { message: "Down" } };
      }
      const end = start + BACKEND_PAGE;
      return { data: { items: rows.slice(start, end), next: end < rows.length ? String(end) : null } };
    });
    const feed = db.feed.orderBy((post) => post.createdAt).infinite({ pageSize: 2 });
    const unsubscribe = feed.subscribe(() => {});
    await vi.waitFor(() => expect(feed.getSnapshot().isFetchingNextPage).toBeFalse());
    await vi.waitFor(() => expect(feed.getSnapshot().data).toHaveLength(2));
    await feed.fetchNextPage();
    failing = true;
    await feed.fetchNextPage();
    expect(feed.getSnapshot()).toMatchObject({ status: "ready", isFetchingNextPage: false });
    expect(feed.getSnapshot().error).toBeTruthy();
    expect(ids(feed.getSnapshot().data)).toStrictEqual([1, 2, 3, 4, 5, 6]);

    failing = false;
    await feed.fetchNextPage();
    expect(ids(feed.getSnapshot().data)).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    unsubscribe();
  });

  it("gives each subscriber its own window over one shared query, and refetches from the first page", async () => {
    const { api, db } = context;
    serveFeed(api, () => [1, 2, 3, 4, 5].map((id) => createPost(id)));
    const query = db.feed.orderBy((post) => post.createdAt);
    const first = query.infinite({ pageSize: 2 });
    const second = query.infinite({ pageSize: 2 });
    expect(first.key).toBe(second.key);
    const unsubscribes = [first.subscribe(() => {}), first.subscribe(() => {}), second.subscribe(() => {})];
    await vi.waitFor(() => expect(first.getSnapshot().isFetchingNextPage).toBeFalse());
    await vi.waitFor(() => expect(first.getSnapshot().data).toHaveLength(2));
    await first.fetchNextPage();
    expect(first.getSnapshot().data).toHaveLength(4);
    expect(second.getSnapshot().data).toHaveLength(2);

    const before = api.callsTo("/feed").length;
    await first.refetch();
    expect(api.callsTo("/feed").length - before).toBe(3);
    expect(api.callsTo("/feed")[before].url.searchParams.get("cursor")).toBeNull();
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  });
});
