import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import type { DbErrorEvent } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import { createApi, createHttpClient, createPost, createRequests, deferred } from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

const setup = () => {
  const requests = createRequests(createHttpClient());
  const Post = collection(rowType<Post>(), { key: "id" })
    .load(requests.getTeamFullPosts, { rows: (response) => response.items, where: byTeam })
    .mutate({
      insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
      delete: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
    });
  const db = createDb({ post: Post });
  const errors: DbErrorEvent[] = [];
  db.onError((event) => errors.push(event));
  return { api: createApi(server), db, errors };
};

const titles = (posts: Post[] | undefined) => posts?.map((post) => post.title);

describe("db [ Races between writes and loads ]", () => {
  let context = setup();
  let serverRows: Post[] = [];

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
    serverRows = [createPost(1), createPost(2)];
    context.api.get("/teams/:teamId/full-posts", () => ({ data: { items: serverRows } }));
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  const loadTeam = async () => {
    const query = context.db.post.where((post) => eq(post.teamId, 1)).orderBy((post) => post.id);
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    return { query, unsubscribe };
  };

  it("waits for writes in flight before a refetch replaces the list, and shows them until then", async () => {
    const { api, db } = context;
    const { query, unsubscribe } = await loadTeam();
    const release = deferred();
    const hold = async ({ body }: { body: unknown }) => {
      await release.promise;
      return { data: body ?? null };
    };
    api.post("/posts", hold);
    api.patch("/posts/:postId", hold);
    api.delete("/posts/:postId", hold);
    const writes = [
      db.post.insert(createPost(3, { title: "Pending insert" })),
      db.post.update(1, { title: "Pending update" }),
      db.post.delete(2),
    ];
    const fetches = api.callsTo("/teams/1/full-posts").length;
    const refetch = query.refetch();
    await vi.waitFor(() => expect(query.getSnapshot().isFetching).toBeTrue());
    expect(api.callsTo("/teams/1/full-posts")).toHaveLength(fetches);
    expect(titles(query.getSnapshot().data)).toStrictEqual(["Pending update", "Pending insert"]);

    serverRows = [createPost(1, { title: "Pending update" }), createPost(3, { title: "Pending insert" })];
    release.resolve();
    await Promise.all(writes);
    await refetch;
    expect(api.callsTo("/teams/1/full-posts")).toHaveLength(fetches + 1);
    expect(titles(query.getSnapshot().data)).toStrictEqual(["Pending update", "Pending insert"]);
    unsubscribe();
  });

  it("drops a confirmed insert that a later refetch of its list no longer returns", async () => {
    const { api, db } = context;
    const { query, unsubscribe } = await loadTeam();
    api.post("/posts", ({ body }) => ({ data: body }));
    await db.post.insert(createPost(3));
    expect(query.getSnapshot().data).toHaveLength(3);
    // Deleted on the server by someone else, with no event
    await query.refetch();
    expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2]);
    unsubscribe();
  });

  it("brings back no row when the db is cleared during a write that then fails", async () => {
    const { api, db } = context;
    const { unsubscribe } = await loadTeam();
    const release = deferred();
    api.patch("/posts/:postId", async () => {
      await release.promise;
      return { status: 500, data: { message: "Down" } };
    });
    const write = db.post.update(1, { title: "Lost" });
    await db.clear();
    release.resolve();
    expect(await write).toMatchObject({ success: false });
    expect(db.post.findOne(1).local().getSnapshot().data).toBeUndefined();
    unsubscribe();
  });

  it("rejects an insert of a key the db holds and an update that changes the key", async () => {
    const { api, db, errors } = context;
    const { unsubscribe } = await loadTeam();
    api.post("/posts", ({ body }) => ({ data: body }));
    api.patch("/posts/:postId", ({ body }) => ({ data: body }));
    const duplicate = await db.post.insert(createPost(1));
    expect(duplicate).toMatchObject({ success: false });
    expect(String(duplicate.error)).toContain("already holds");
    const rekey = await db.post.update(1, { id: 9 });
    expect(String(rekey.error)).toContain("cannot change the key");
    expect(api.callsTo("/posts", "post")).toHaveLength(0);
    expect(api.callsTo("/posts/1", "patch")).toHaveLength(0);
    expect(errors.filter((event) => event.type === "mutation")).toHaveLength(2);
    unsubscribe();
  });
});
