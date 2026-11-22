import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { expectTypeOf } from "vitest";

import type { PostSummary } from "../utils/fixtures";
import {
  PostSummarySchema,
  createApi,
  createHttpClient,
  createPost,
  createRequests,
  toSummary,
} from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

type Comment = { id: number; postId: number; text: string };
type Author = { id: number; name: string };

/** A result type as the db builds it: one flat object */
type Flat<T> = { [Field in keyof T]: T[Field] };

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

const setup = () => {
  const client = createHttpClient();
  const requests = createRequests(client);
  const getComments = client.createRequest<{ response: Comment[]; queryParams?: { postIds?: number[] } }>()({
    endpoint: "/comments",
  });
  const saveComment = client.createRequest<{ response: Comment }>()({ endpoint: "/comments/:id", method: "PUT" });
  const removeComment = client.createRequest<{ response: null }>()({ endpoint: "/comments/:id", method: "DELETE" });
  const saveAuthor = client.createRequest<{ response: Author }>()({ endpoint: "/authors/:id", method: "PUT" });
  const Summary = collection(PostSummarySchema, { key: "id" }).load(requests.getTeamPosts, { where: byTeam });
  const CommentCollection = collection(rowType<Comment>(), { key: "id" })
    .load(getComments, { where: { postId: { inArray: (postIds) => ({ queryParams: { postIds } }) } } })
    .ingest(saveComment)
    .mutate({ delete: { request: removeComment, map: (id) => ({ params: { id } }), onSuccess: "keep" } });
  const Note = collection(rowType<Comment>(), { key: "id" }).ingest(saveComment);
  const AuthorCollection = collection(rowType<Author>(), { key: "id" }).ingest(saveAuthor);
  const db = createDb({ postSummary: Summary, comment: CommentCollection, note: Note, author: AuthorCollection });
  return { api: createApi(server), db, saveComment, saveAuthor };
};

const postIds = (url: URL) =>
  [...url.searchParams.getAll("postIds[]"), ...url.searchParams.getAll("postIds")].flatMap((value) => value.split(","));

describe("db [ One-to-many and inner joins ]", () => {
  let context = setup();

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
    context.api.get("/teams/:teamId/posts", () => ({
      data: [createPost(1, { likes: 7 }), createPost(2, { likes: 8 }), createPost(3, { likes: 9 })].map(toSummary),
    }));
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  const commentsOf = (posts: { comments: Comment[] }[] | undefined) =>
    posts?.map((post) => post.comments.map((comment) => comment.text));

  it("loads the children of the whole result in one inArray request and gives childless rows an empty array", async () => {
    const { api, db } = context;
    api.get("/comments", ({ url }) => ({
      data: postIds(url)
        .filter((id) => id !== "3")
        .flatMap((id) => [{ id: Number(id) * 10, postId: Number(id), text: `On ${id}` }]),
    }));
    const query = db.postSummary
      .where((post) => eq(post.teamId, 1))
      .orderBy((post) => post.id)
      .join("comments", db.comment, { by: (post) => post.id, on: "postId" });
    expectTypeOf(query.getSnapshot().data).toEqualTypeOf<Flat<PostSummary & { comments: Comment[] }>[] | undefined>();
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(commentsOf(query.getSnapshot().data)).toStrictEqual([["On 1"], ["On 2"], []]));
    expect(api.callsTo("/comments")).toHaveLength(1);
    expect(postIds(api.callsTo("/comments")[0].url)).toStrictEqual(["1", "2", "3"]);
    unsubscribe();
  });

  it("re-emits a parent when a child is added, changed or removed, and keeps the others' identity", async () => {
    const { api, db, saveComment } = context;
    api.get("/comments", () => ({ data: [{ id: 10, postId: 1, text: "First" }] }));
    api.put("/comments/:id", ({ params }) => ({ data: { id: Number(params.id), postId: 2, text: "Added" } }));
    api.delete("/comments/:id", () => ({ data: null }));
    const query = db.postSummary
      .where((post) => eq(post.teamId, 1))
      .orderBy((post) => post.id)
      .join("comments", db.comment, { by: (post) => post.id, on: "postId" });
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(commentsOf(query.getSnapshot().data)).toStrictEqual([["First"], [], []]));
    const [first, , third] = query.getSnapshot().data!;

    await saveComment.setParams({ id: 20 }).send();
    expect(commentsOf(query.getSnapshot().data)).toStrictEqual([["First"], ["Added"], []]);
    expect(query.getSnapshot().data?.[0]).toBe(first);
    expect(query.getSnapshot().data?.[2]).toBe(third);

    await db.comment.delete(10);
    expect(commentsOf(query.getSnapshot().data)).toStrictEqual([[], ["Added"], []]);
    unsubscribe();
  });

  it("joins the rows the db holds when no loader can send the field", async () => {
    const { api, db, saveComment } = context;
    api.put("/comments/:id", () => ({ data: { id: 5, postId: 3, text: "Held" } }));
    await saveComment.setParams({ id: 5 }).send();
    const query = db.postSummary
      .where((post) => eq(post.teamId, 1))
      .orderBy((post) => post.id)
      .join("notes", db.note, { by: (post) => post.id, on: "postId" });
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    expect(query.getSnapshot().data?.map((post) => post.notes.length)).toStrictEqual([0, 0, 1]);
    unsubscribe();
  });

  it("leaves out results without a joined row in an inner join, until the row arrives", async () => {
    const { api, db, saveAuthor } = context;
    api.put("/authors/:id", ({ params }) => ({ data: { id: Number(params.id), name: `Author ${params.id}` } }));
    await saveAuthor.setParams({ id: 8 }).send();
    const query = db.postSummary
      .where((post) => eq(post.teamId, 1))
      .orderBy((post) => post.id)
      .join("author", db.author, { by: (post) => post.likes, type: "inner" })
      .limit(2);
    expectTypeOf(query.getSnapshot().data).toEqualTypeOf<Flat<PostSummary & { author: Author }>[] | undefined>();
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([2]);

    await saveAuthor.setParams({ id: 7 }).send();
    await saveAuthor.setParams({ id: 9 }).send();
    // The limit counts the results that pass the inner join
    expect(query.getSnapshot().data?.map((post) => post.author.name)).toStrictEqual(["Author 7", "Author 8"]);

    const one = db.postSummary
      .findOne(3)
      .local()
      .join("author", db.author, { by: (post) => post.teamId, type: "inner" });
    expect(one.getSnapshot().data).toBeUndefined();
    unsubscribe();
  });

  it("joins on a field and inner at once, and releases the child query when the result empties", async () => {
    const { api, db } = context;
    api.get("/comments", ({ url }) => ({
      data: postIds(url).map((id) => ({ id: Number(id), postId: Number(id), text: `On ${id}` })),
    }));
    const query = db.postSummary
      .where((post) => eq(post.teamId, 1))
      .where((post) => eq(post.archived, false))
      .join("comments", db.comment, { by: (post) => post.id, on: "postId", type: "inner" });
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().data).toHaveLength(3));
    unsubscribe();
    // A local query reads children it holds without loading
    const local = db.postSummary.local().join("comments", db.comment, { by: (post) => post.id, on: "postId" });
    const stopLocal = local.subscribe(() => {});
    expect(local.getSnapshot().data?.every((post) => post.comments.length === 1)).toBeTrue();
    stopLocal();
  });

  it("types the joined field against the field it matches", () => {
    const { db } = context;
    const check = () => {
      // @ts-expect-error `text` is a string, the post id a number
      db.postSummary.join("comments", db.comment, { by: (post) => post.id, on: "text" });
      // @ts-expect-error `missing` is not a comment field
      db.postSummary.join("comments", db.comment, { by: (post) => post.id, on: "missing" });
    };
    expect(check).toBeFunction();
  });
});
