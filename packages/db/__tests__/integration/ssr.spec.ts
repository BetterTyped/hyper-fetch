import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import type { DehydratedDb } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import { createApi, createHttpClient, createPost, createRequests, deferred } from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

type Event = { id: number; at: Date };

/** The same collection definitions serve every request, and each request creates its own db */
const createCollections = () => {
  const requests = createRequests(createHttpClient());
  const post = collection(rowType<Post>(), { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .mutate({
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
    });
  const event = collection(rowType<Event>(), { key: "id" }).load(requests.getPost, {
    byKey: (id) => ({ params: { postId: id } }),
    rows: (row) => [{ id: row.id, at: new Date(row.createdAt) }],
  });
  const unused = collection(rowType<Post>(), { key: "id" });
  return { post, event, unused };
};

const titles = (posts: Post[] | undefined) => posts?.map((post) => post.title);

/** What a framework does with the state: JSON over the wire */
// oxlint-disable-next-line unicorn/prefer-structured-clone -- the point is a JSON round trip, which structuredClone is not
const overTheWire = (state: DehydratedDb) => JSON.parse(JSON.stringify(state)) as DehydratedDb;

describe("db [ Server rendering ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  const renderOnServer = async () => {
    const api = createApi(server);
    api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
    api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
    const db = createDb(createCollections());
    await db.post.where((post) => eq(post.teamId, 1)).get();
    await db.event.findOne(3).get();
    return { api, db };
  };

  it("shows the server's rows at once on the client, then refetches them as stale", async () => {
    const { api, db: serverDb } = await renderOnServer();
    const state = overTheWire(serverDb.dehydrate());
    serverDb.destroy();

    const release = deferred();
    api.get("/teams/:teamId/full-posts", async () => {
      await release.promise;
      return { data: { items: [createPost(1, { title: "Fresh" })] } };
    });
    const client = createDb(createCollections(), { state });
    const query = client.post.where((post) => eq(post.teamId, 1));
    // The first render matches the server's, before anything loads
    expect(query.getSnapshot()).toMatchObject({ status: "ready", stale: true });
    expect(titles(query.getSnapshot().data)).toStrictEqual(["Post 1", "Post 2"]);

    const unsubscribe = query.subscribe(() => {});
    expect(query.getSnapshot().isFetching).toBeTrue();
    release.resolve();
    // The client's load replaces the hydrated rows, so a row the server no longer returns leaves
    await vi.waitFor(() => expect(titles(query.getSnapshot().data)).toStrictEqual(["Fresh"]));
    unsubscribe();
    client.destroy();
  });

  it("keeps dates, leaves out unused collections and pending writes, and keeps dbs apart", async () => {
    const { api, db: serverDb } = await renderOnServer();
    const release = deferred();
    api.patch("/posts/:postId", async () => {
      await release.promise;
      return { data: createPost(1) };
    });
    const write = serverDb.post.update(1, { title: "Pending" });
    const state = overTheWire(serverDb.dehydrate());
    expect(Object.keys(state.collections as object)).toStrictEqual(["post", "event"]);

    const client = createDb(createCollections(), { state });
    expect(client.event.findOne(3).local().getSnapshot().data?.at).toBeInstanceOf(Date);
    expect(client.post.findOne(1).local().getSnapshot().data?.title).toBe("Post 1");
    const other = createDb(createCollections());
    expect(other.post.findOne(1).local().getSnapshot().data).toBeUndefined();

    release.resolve();
    await write;
    expect(client.post.findOne(1).local().getSnapshot().data?.title).toBe("Post 1");
    [serverDb, client, other].forEach((db) => db.destroy());
  });

  it("ignores state for collections the client db does not hold", async () => {
    const { db: serverDb } = await renderOnServer();
    const state = overTheWire(serverDb.dehydrate());
    serverDb.destroy();
    const { post } = createCollections();
    const client = createDb({ post }, { state });
    expect(client.post.findOne(2).local().getSnapshot().data?.id).toBe(2);
    client.destroy();
  });
});
