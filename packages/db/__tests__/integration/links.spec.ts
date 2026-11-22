import { collection, createDb, eq } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { Post } from "../utils/fixtures";
import {
  PostSchema,
  PostSummarySchema,
  createApi,
  createHttpClient,
  createPost,
  createRequests,
  deferred,
  toSummary,
} from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

const setup = () => {
  const requests = createRequests(createHttpClient());
  const api = createApi(server);
  const PostDetail = collection(PostSchema, { key: "id" })
    .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) })
    .ingest(requests.searchPosts, { rows: (response) => response.results })
    .mutate({
      insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
      update: {
        request: requests.updatePostRequest,
        map: (key, changes) => ({ params: { postId: key }, payload: changes }),
      },
      delete: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
    });
  const Summary = collection(PostSummarySchema, { key: "id" }).load(requests.getTeamPosts, { where: byTeam });
  const db = createDb({ post: PostDetail, postSummary: Summary }, { links: [["post", "postSummary"]] });
  return { api, db, requests };
};

describe("db [ Linked collections ]", () => {
  let context = setup();

  beforeAll(() => startServer());
  beforeEach(async () => {
    resetMocks();
    context = setup();
    const { api, db } = context;
    api.get("/teams/:teamId/posts", () => ({ data: [createPost(1), createPost(2)].map(toSummary) }));
    api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));
    const summary = db.postSummary.where((post) => eq(post.teamId, 1));
    const detail = db.post.findOne(1);
    summary.subscribe(() => {});
    detail.subscribe(() => {});
    await vi.waitFor(() => expect(summary.getSnapshot().status).toBe("ready"));
    await vi.waitFor(() => expect(detail.getSnapshot().data?.id).toBe(1));
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  const summaryTitles = () =>
    context.db.postSummary
      .where((post) => eq(post.teamId, 1))
      .getSnapshot()
      .data?.map((post) => post.title);

  it("shows an optimistic update in the linked collection and keeps the server's answer", async () => {
    const { api, db } = context;
    const release = deferred();
    api.patch("/posts/:postId", async ({ body }) => {
      await release.promise;
      return { data: createPost(1, { ...(body as Partial<Post>), likes: 40 }) };
    });
    const write = db.post.update(1, { title: "Renamed", body: "New body" });
    expect(summaryTitles()).toStrictEqual(["Renamed", "Post 2"]);
    release.resolve();
    await write;
    expect(summaryTitles()).toStrictEqual(["Renamed", "Post 2"]);
    expect(db.postSummary.findOne(1).local().getSnapshot().data).toMatchObject({ likes: 40 });
    expect(db.postSummary.findOne(1).local().getSnapshot().data).not.toHaveProperty("body");
  });

  it("reverts both collections when the write fails", async () => {
    const { api, db } = context;
    api.patch("/posts/:postId", () => ({ status: 400, data: { message: "No" } }));
    await db.post.update(1, { title: "Rejected" });
    expect(summaryTitles()).toStrictEqual(["Post 1", "Post 2"]);
  });

  it("removes deleted rows from both collections and leaves inserts and rows it does not hold alone", async () => {
    const { api, db, requests } = context;
    api.delete("/posts/:postId", () => ({ data: null }));
    api.post("/posts", ({ body }) => ({ data: body }));
    api.get("/search", () => ({ data: { results: [createPost(2, { title: "Ingested" }), createPost(7)] } }));
    const write = db.post.delete(1);
    expect(summaryTitles()).toStrictEqual(["Post 2"]);
    await write;
    expect(summaryTitles()).toStrictEqual(["Post 2"]);

    await db.post.insert(createPost(3));
    expect(db.postSummary.findOne(3).local().getSnapshot().data).toBeUndefined();

    await requests.searchPosts.send();
    expect(summaryTitles()).toStrictEqual(["Ingested"]);
    expect(db.postSummary.findOne(7).local().getSnapshot().data).toBeUndefined();
  });
});
