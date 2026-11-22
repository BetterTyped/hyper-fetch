import { collection, createDb, eq, gt, op } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import { PostSchema, createApi, createHttpClient, createPost, createRequests } from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const setup = () => {
  const client = createHttpClient();
  const requests = createRequests(client);
  const Post = collection(PostSchema, { key: "id" })
    .load(requests.searchPosts, {
      rows: (response) => response.results,
      where: { title: { search: (text: string) => ({ queryParams: { q: text } }) } },
    })
    .load(requests.getTeamFullPosts, {
      rows: (response) => response.items,
      where: { teamId: { eq: (teamId) => ({ params: { teamId } }) } },
    })
    .mutate({ insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) } });
  const db = createDb({ post: Post });
  return { api: createApi(server), db };
};

const ids = (posts: Post[] | undefined) => posts?.map((post) => post.id);

describe("db [ Server-only operators ]", () => {
  let context = setup();

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
    context.api.get("/search", ({ url }) => ({
      data: { results: url.searchParams.get("q") === "tea" ? [createPost(1), createPost(2, { likes: 9 })] : [] },
    }));
    context.api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(3)] } }));
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  it("sends the operator through the loader that maps it and shows what the server matched", async () => {
    const { api, db } = context;
    const query = db.post.where((post) => op("search", post.title, "tea"));
    expect(query.explain()).toMatchObject({
      kind: "list",
      loader: 0,
      sent: [{ op: "server", name: "search", field: "title", value: "tea" }],
    });
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(ids(query.getSnapshot().data)).toStrictEqual([1, 2]));
    expect(api.callsTo("/search")[0].url.searchParams.get("q")).toBe("tea");

    // Rows the db holds from elsewhere never join it, because only the server can tell whether they match
    const team = db.post.where((post) => eq(post.teamId, 1));
    const stopTeam = team.subscribe(() => {});
    await vi.waitFor(() => expect(ids(team.getSnapshot().data)).toStrictEqual([1, 3, 2]));
    expect(ids(query.getSnapshot().data)).toStrictEqual([1, 2]);
    stopTeam();
    unsubscribe();
  });

  it("shares its subset with queries that send the same operator, and runs their other conditions locally", async () => {
    const { api, db } = context;
    const search = db.post.where((post) => op("search", post.title, "tea"));
    const stopSearch = search.subscribe(() => {});
    await vi.waitFor(() => expect(search.getSnapshot().status).toBe("ready"));

    const narrowed = db.post.where((post) => op("search", post.title, "tea")).where((post) => gt(post.likes, 5));
    const stopNarrowed = narrowed.subscribe(() => {});
    await vi.waitFor(() => expect(ids(narrowed.getSnapshot().data)).toStrictEqual([2]));
    expect(api.callsTo("/search")).toHaveLength(1);
    stopNarrowed();
    stopSearch();
  });

  it("is never answered from a fresh subset of its other conditions", async () => {
    const { api, db } = context;
    const team = db.post.where((post) => eq(post.teamId, 1));
    const stopTeam = team.subscribe(() => {});
    await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));
    const searched = db.post.where((post) => eq(post.teamId, 1)).where((post) => op("search", post.title, "tea"));
    expect(searched.explain()).toMatchObject({ loader: 0, answeredLocally: false });
    const stop = searched.subscribe(() => {});
    await vi.waitFor(() => expect(ids(searched.getSnapshot().data)).toStrictEqual([1, 2]));
    expect(api.callsTo("/search")).toHaveLength(1);
    stop();
    stopTeam();
  });

  it("marks its subset stale when a row is inserted, instead of placing it", async () => {
    const { api, db } = context;
    api.post("/posts", ({ body }) => ({ data: body }));
    const search = db.post.where((post) => op("search", post.title, "tea"));
    const stop = search.subscribe(() => {});
    await vi.waitFor(() => expect(search.getSnapshot()).toMatchObject({ status: "ready", stale: false }));
    await db.post.insert(createPost(7, { title: "Green tea" }));
    expect(ids(search.getSnapshot().data)).toStrictEqual([1, 2]);
    expect(search.getSnapshot().stale).toBeTrue();
    stop();
  });

  it("does not serve a local query or a loader that cannot send the operator", async () => {
    const { db } = context;
    expect(
      db.post
        .local()
        .where((post) => op("search", post.title, "tea"))
        .explain(),
    ).toMatchObject({
      kind: "error",
    });
    const unmapped = db.post.where((post) => op("match", post.title, "tea"));
    // @ts-expect-error no loader maps `match` on `title`
    const stop = unmapped.subscribe(() => {});
    expect(unmapped.getSnapshot().status).toBe("error");
    stop();
    const mapped = db.post.where((post) => op("search", post.title, "tea"));
    const stopMapped = mapped.subscribe(() => {});
    stopMapped();
  });
});
