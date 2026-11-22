import { collection, createDb, eq } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { PostSchema, createApi, createHttpClient, createPost, createRequests, deferred } from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const setup = () => {
  const requests = createRequests(createHttpClient());
  const Post = collection(PostSchema, { key: "id" })
    .load(requests.getTeamFullPosts, {
      rows: (response) => response.items,
      where: { teamId: { eq: (teamId) => ({ params: { teamId } }), required: true } },
    })
    .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) })
    .mutate({
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
    });
  return { api: createApi(server), db: createDb({ post: Post }) };
};

describe("db [ Inspection ]", () => {
  let context = setup();

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  it("shows collections, subsets, live queries and pending layers, and reports each change", async () => {
    const { api, db } = context;
    api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
    api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
    const changes = vi.fn();
    const stopChanges = db.onChange(changes);
    const list = db.post.where((post) => eq(post.teamId, 1));
    const one = db.post.findOne(7);
    const unsubscribes = [list.subscribe(() => {}), one.subscribe(() => {})];
    await vi.waitFor(() => expect(one.getSnapshot().data?.id).toBe(7));
    await vi.waitFor(() => expect(list.getSnapshot().status).toBe("ready"));
    expect(changes).toHaveBeenCalled();

    const release = deferred();
    api.patch("/posts/:postId", async () => {
      await release.promise;
      return { data: createPost(1, { title: "Saved" }) };
    });
    const write = db.post.update(1, { title: "Pending" });
    const inspection = db.inspect();
    expect(inspection.collections).toMatchObject([
      {
        name: "post",
        rows: 3,
        layers: [{ key: 1, type: "update" }],
        subsets: [
          { kind: "list", loader: 0, rows: 2, fresh: true, live: false, loading: false, error: null, observers: 1 },
          { kind: "key", id: "7", loader: 1, rows: 1, observers: 1 },
        ],
      },
    ]);
    expect(
      inspection.queries.map(({ subscribers, status, rows, plan }) => ({ subscribers, status, rows, kind: plan.kind })),
    ).toStrictEqual([
      { subscribers: 1, status: "ready", rows: 3, kind: "list" },
      { subscribers: 1, status: "ready", rows: undefined, kind: "one" },
    ]);
    expect(inspection.outbox).toStrictEqual([]);

    const count = changes.mock.calls.length;
    release.resolve();
    await write;
    expect(changes.mock.calls.length).toBeGreaterThan(count);
    expect(db.inspect().collections[0].layers).toStrictEqual([]);

    stopChanges();
    const after = changes.mock.calls.length;
    await db.post.update(2, { title: "Unwatched" });
    expect(changes).toHaveBeenCalledTimes(after);
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  });

  it("shows the outbox of an offline db", async () => {
    const requests = createRequests(createHttpClient());
    const Post = collection(PostSchema, { key: "id" }).mutate({
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
    });
    const db = createDb({ post: Post }, { offline: true, tabs: false });
    requests.updatePostRequest.client.appManager.setOnline(false);
    db.post.update(1, { title: "Offline" });
    await vi.waitFor(() => expect(db.inspect().outbox).toHaveLength(1));
    expect(db.inspect().outbox[0]).toMatchObject({ collection: "post", op: "update", key: 1 });
    db.destroy();
  });
});
