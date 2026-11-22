import { createSdk } from "@hyper-fetch/core";
import type { RequestModel } from "@hyper-fetch/core";
import { collection, createDb, eq } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import { PostSchema, createApi, createHttpClient, createPost, createRequests, flush } from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const setup = () => {
  const client = createHttpClient();
  const requests = createRequests(client);
  const api = createApi(server);
  const Batched = collection(PostSchema, { key: "id", validate: "all" }).load(requests.getPostsByIds, {
    byKeys: (ids) => ({ queryParams: { ids } }),
  });
  const Single = collection(PostSchema, { key: "id" })
    .load(requests.getTeamFullPosts, {
      rows: (response) => response.items,
      where: { teamId: { eq: (teamId) => ({ params: { teamId } }), required: true } },
    })
    .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) })
    .ingest(requests.searchPosts, { rows: (response) => response.results })
    .ingest(requests.updatePostRequest, { type: "update" });
  const db = createDb({ batched: Batched, single: Single });
  const errors: unknown[] = [];
  db.onError((event) => errors.push(event));
  return { api, db, requests, errors };
};

type Context = ReturnType<typeof setup>;

describe("db [ Key loaders and ingest ]", () => {
  let context: Context;

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  it("batches keys requested in one tick into one byKeys request", async () => {
    const { api, db } = context;
    api.get("/posts-by-ids", ({ url }) => ({
      data: [...url.searchParams.getAll("ids[]"), ...url.searchParams.getAll("ids")]
        .flatMap((value) => value.split(","))
        .filter((value) => value !== "3")
        .map((value) => createPost(Number(value))),
    }));
    const one = db.batched.findOne(1);
    const two = db.batched.findOne(2);
    const three = db.batched.findOne(3);
    const unsubscribes = [one, two, three].map((query) => query.subscribe(() => {}));
    await vi.waitFor(() => expect(three.getSnapshot().status).toBe("ready"));
    expect(api.callsTo("/posts-by-ids")).toHaveLength(1);
    expect(one.getSnapshot().data?.id).toBe(1);
    expect(two.getSnapshot().data?.id).toBe(2);
    expect(three.getSnapshot().data).toBeUndefined();
    expect(one.explain()).toMatchObject({ kind: "one", loader: 0, answeredLocally: false });
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  });

  it("reports a failed key request and keeps a row it holds", async () => {
    const { api, db } = context;
    api.get("/posts/:postId", () => ({ status: 404, data: { message: "Missing" } }));
    const missing = db.single.findOne(5);
    const unsubscribeMissing = missing.subscribe(() => {});
    await vi.waitFor(() => expect(missing.getSnapshot().status).toBe("error"));
    expect(missing.getSnapshot().error).toStrictEqual({ message: "Missing" });

    api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
    const team = db.single.where((post) => eq(post.teamId, 1));
    const unsubscribeTeam = team.subscribe(() => {});
    await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));
    const held = db.single.findOne(1);
    const unsubscribeHeld = held.subscribe(() => {});
    expect(held.getSnapshot()).toMatchObject({ status: "ready", data: { id: 1 }, isFetching: true });
    await vi.waitFor(() => expect(held.getSnapshot().isFetching).toBeFalse());
    expect(held.getSnapshot()).toMatchObject({ status: "ready", error: { message: "Missing" }, data: { id: 1 } });
    await held.refetch();
    unsubscribeMissing();
    unsubscribeTeam();
    unsubscribeHeld();
  });

  it("validates server rows when the collection validates all data", async () => {
    const { api, db, errors } = context;
    api.get("/posts-by-ids", () => ({ data: [createPost(1, { title: "" }), createPost(2)] }));
    const one = db.batched.findOne(1);
    const two = db.batched.findOne(2);
    const unsubscribeOne = one.subscribe(() => {});
    const unsubscribeTwo = two.subscribe(() => {});
    await vi.waitFor(() => expect(two.getSnapshot().data?.id).toBe(2));
    expect(one.getSnapshot()).toMatchObject({ status: "ready", data: undefined });
    expect(errors).toMatchObject([{ type: "validation", collection: "batched" }]);
    unsubscribeOne();
    unsubscribeTwo();
  });

  it("writes the rows of ingested responses, and only of matching successful ones", async () => {
    const { api, db, requests } = context;
    api.get("/search", () => ({ data: { results: [createPost(1), createPost(2)] } }));
    api.patch("/posts/:postId", ({ params }) => ({ data: { id: Number(params.postId), title: "Patched" } }));
    await requests.searchPosts.send();
    expect(
      db.single
        .local()
        .getSnapshot()
        .data?.map((post) => post.id),
    ).toStrictEqual([1, 2]);

    await requests.updatePostRequest.setParams({ postId: 1 }).setPayload({ title: "Patched" }).send();
    await requests.updatePostRequest.setParams({ postId: 7 }).setPayload({ title: "Unknown" }).send();
    expect(db.single.findOne(1).local().getSnapshot().data?.title).toBe("Patched");
    expect(db.single.findOne(7).local().getSnapshot().data).toBeUndefined();

    api.get("/search", () => ({ status: 500 }));
    await requests.searchPosts.send();
    await requests.getPost.setParams({ postId: 3 }).send();
    await flush();
    expect(db.single.local().getSnapshot().data).toHaveLength(2);
  });
});

type SdkSchema = {
  posts: {
    $get: RequestModel<{ endpoint: "/posts"; response: Post[]; queryParams?: { teamId?: number } }>;
    $post: RequestModel<{ endpoint: "/posts"; response: Post; payload: Post }>;
    $postId: {
      $get: RequestModel<{ endpoint: "/posts/:postId"; response: Post }>;
      $put: RequestModel<{ endpoint: "/posts/:postId"; response: Post; payload: Partial<Post> }>;
      $delete: RequestModel<{ endpoint: "/posts/:postId"; response: null }>;
    };
  };
  teams: {
    $teamId: {
      posts: {
        $get: RequestModel<{ endpoint: "/teams/:teamId/posts"; response: { items: Post[] } }>;
        $postId: { $get: RequestModel<{ endpoint: "/teams/:teamId/posts/:postId"; response: Post }> };
      };
    };
  };
};

describe("db [ Resources ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  it("derives loaders and writes from REST conventions", async () => {
    const api = createApi(server);
    const sdk = createSdk<ReturnType<typeof createHttpClient>, SdkSchema>(createHttpClient());
    const Post = collection(PostSchema, { key: "id" }).resource(sdk.posts, {
      item: "$postId",
      list: { where: ["teamId"] },
      update: { method: "$put" },
    });
    const TeamPost = collection(PostSchema, { key: "id" }).resource(sdk.teams.$teamId.posts, {
      item: "$postId",
      list: { rows: (response) => response.items },
    });
    const Detail = collection(PostSchema, { key: "id" }).resource(sdk.posts, { item: "$postId", list: false });
    const Default = collection(PostSchema, { key: "id" }).resource(sdk.posts, { item: "$postId" });
    const db = createDb({ post: Post, teamPost: TeamPost, detail: Detail, defaults: Default });
    expect(db.defaults.where((post) => eq(post.id, 1)).explain()).toMatchObject({ kind: "list", sent: [] });

    api.get("/posts", ({ url }) => ({ data: [createPost(1, { teamId: Number(url.searchParams.get("teamId")) })] }));
    api.get("/teams/:teamId/posts", () => ({ data: { items: [createPost(2)] } }));
    api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
    api.post("/posts", ({ body }) => ({ data: body }));
    api.put("/posts/:postId", ({ params, body }) => ({
      data: { ...createPost(Number(params.postId)), ...(body as object) },
    }));
    api.delete("/posts/:postId", () => ({ data: null }));

    const list = db.post.where((post) => eq(post.teamId, 4));
    const team = db.teamPost.where((post) => eq(post.teamId, 1));
    const detail = db.detail.findOne(3);
    const unsubscribes = [list.subscribe(() => {}), team.subscribe(() => {}), detail.subscribe(() => {})];
    await vi.waitFor(() => expect(list.getSnapshot().data?.[0].teamId).toBe(4));
    await vi.waitFor(() => expect(team.getSnapshot().data?.[0].id).toBe(2));
    await vi.waitFor(() => expect(detail.getSnapshot().data?.id).toBe(3));
    expect(api.callsTo("/teams/1/posts")).toHaveLength(1);

    await db.post.insert(createPost(5));
    await db.post.update(5, { title: "Put" });
    expect(api.callsTo("/posts/5", "put")[0].body).toStrictEqual({ title: "Put" });
    await db.post.delete(5);
    expect(api.callsTo("/posts/5", "delete")).toHaveLength(1);
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    db.destroy();
  });
});
