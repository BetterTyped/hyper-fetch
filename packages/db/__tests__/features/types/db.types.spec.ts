import { and, collection, createDb, eq, gt, inArray, or, rowType } from "@hyper-fetch/db";
import type {
  ExtractQueryData,
  ExtractQueryResult,
  InfiniteQueryCheck,
  QueryState,
  ServableQuery,
} from "@hyper-fetch/db";
import { expectTypeOf } from "vitest";

import type { Post, PostSummary } from "../../utils/fixtures";
import {
  PostSchema,
  PostSummarySchema,
  createHttpClient,
  createListeners,
  createRequests,
  createSocket,
} from "../../utils/fixtures";

const client = createHttpClient();
const requests = createRequests(client);
const listeners = createListeners(createSocket());

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

describe("db [ Types ]", () => {
  describe("collections", () => {
    it("takes the row type from the schema or a type argument", () => {
      const fromSchema = collection(PostSchema, { key: "id" });
      const fromType = collection(rowType<Post>(), { key: "id" });
      expectTypeOf(fromSchema.__types!.row).toEqualTypeOf<Post>();
      expectTypeOf(fromType.__types!.row).toEqualTypeOf<Post>();
      // @ts-expect-error a key must be a string or number field
      collection(PostSchema, { key: "missing" });
    });

    it("accepts a loader that returns complete rows", () => {
      const summaries = collection(PostSummarySchema, { key: "id" }).load(requests.getTeamPosts, { where: byTeam });
      const posts = collection(PostSchema, { key: "id" }).load(requests.getPost, {
        byKey: (id) => ({ params: { postId: id } }),
      });
      createDb({ summaries, posts });
    });

    it("rejects a loader whose rows lack fields", () => {
      const posts = collection(PostSchema, { key: "id" }).load(requests.getTeamPosts, { where: byTeam });
      expectTypeOf(posts.rowMismatch.received).toEqualTypeOf<PostSummary>();
      // @ts-expect-error the list returns summaries without `body`
      createDb({ posts });
    });

    it("rejects a rows mapping with a missing or extra field", () => {
      const exact = collection(PostSummarySchema, { key: "id" }).load(requests.getAllPosts, {
        rows: (response) => response.items.map(({ body: _body, ...summary }) => summary),
      });
      const extra = collection(PostSummarySchema, { key: "id" }).load(requests.getAllPosts, {
        rows: (response) => response.items.map(({ body: _body, ...summary }) => ({ ...summary, extra: true })),
      });
      const missing = collection(PostSummarySchema, { key: "id" }).load(requests.getAllPosts, {
        rows: (response) => response.items.map(({ body: _body, title: _title, ...summary }) => summary),
      });
      createDb({ exact });
      // @ts-expect-error `extra` is not a row field
      extra.load(requests.getTeamPosts);
      // @ts-expect-error `title` is missing
      createDb({ missing });
    });

    it("types the declared filters by their field", () => {
      collection(PostSummarySchema, { key: "id" }).load(requests.getTeamPosts, {
        where: {
          // @ts-expect-error `teamId` is a number
          teamId: { eq: (teamId: string) => ({ params: { teamId } }) },
        },
      });
    });
  });

  describe("queries", () => {
    const Summary = collection(PostSummarySchema, { key: "id" })
      .load(requests.getTeamPosts, {
        where: { ...byTeam, likes: { gt: (likes) => ({ queryParams: { likes_gt: likes } }) } },
      })
      .load(requests.getAllPosts, {
        rows: (response) => response.items.map(({ body: _body, ...summary }) => summary),
        cursor: (response) => response.next,
        page: (cursor) => ({ queryParams: { cursor } }),
        orderBy: { createdAt: (direction) => ({ queryParams: { sort: `createdAt:${direction}` } }) },
      });
    const Detail = collection(PostSchema, { key: "id" }).load(requests.getPost, {
      byKey: (id) => ({ params: { postId: id } }),
    });
    const db = createDb({ postSummary: Summary, post: Detail });

    it("types the result by the selection", () => {
      const query = db.postSummary
        .where((post) => eq(post.teamId, 1))
        .select((post) => ({ id: post.id, name: post.title }));
      expectTypeOf(query.getSnapshot()).toEqualTypeOf<QueryState<{ id: number; name: string }[]>>();
      expectTypeOf(db.post.findOne(1).getSnapshot().data).toEqualTypeOf<Post | undefined>();
    });

    it("rejects unknown fields and values of the wrong type", () => {
      // @ts-expect-error `body` is not a summary field
      db.postSummary.where((post) => eq(post.body, ""));
      // @ts-expect-error likes is a number
      db.postSummary.where((post) => gt(post.likes, "10"));
      // @ts-expect-error title is a string
      db.postSummary.where((post) => gt(post.title, 10));
      db.postSummary.where((post) => inArray(post.id, [1, 2]));
    });

    it("requires a query to set the required filters of some loader", () => {
      db.postSummary.where((post) => and(eq(post.teamId, 1), gt(post.likes, 3))).subscribe(() => {});
      // @ts-expect-error the team list needs `teamId`, and the full list is paginated and cannot send `likes`
      db.postSummary.where((post) => gt(post.likes, 3)).subscribe(() => {});
      db.postSummary
        .local()
        .where((post) => gt(post.likes, 3))
        .subscribe(() => {});
    });

    it("requires a paginated loader to serve every condition", () => {
      db.postSummary.orderBy((post) => post.createdAt).subscribe(() => {});
      // @ts-expect-error `or` runs on the client, and the only loader without required filters is paginated
      db.postSummary.where((post) => or(eq(post.id, 1), eq(post.id, 2))).subscribe(() => {});
    });

    it("requires a key loader for findOne", () => {
      db.post.findOne(1).subscribe(() => {});
      // @ts-expect-error summaries have no key loader
      db.postSummary.findOne(1).subscribe(() => {});
      // @ts-expect-error a paginated loader cannot sort by `likes` on the client
      db.postSummary.orderBy((post) => post.likes).subscribe(() => {});
      db.postSummary
        .findOne(1)
        .local()
        .subscribe(() => {});
    });
  });

  describe("syncs", () => {
    it("requires complete rows for inserts and the key for updates", () => {
      const Detail = collection(PostSchema, { key: "id" })
        .sync(listeners.onPostCreated, { type: "insert" })
        .sync(listeners.onPostChanged, { type: "update" })
        .sync(listeners.onPostDeleted, { type: "delete" });
      const partialInsert = Detail.sync(listeners.onPostChanged, { type: "insert" });
      const Summary = collection(PostSummarySchema, { key: "id" }).sync(listeners.onPostCreated, {
        type: "insert",
        row: ({ body: _body, ...summary }) => summary,
      });
      createDb({ Detail, Summary });
      // @ts-expect-error a changed post is not a complete row
      createDb({ partialInsert });
    });
  });

  describe("mutations", () => {
    it("types writes by the mutations a collection declares", () => {
      const Detail = collection(PostSchema, { key: "id" }).mutate({
        insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
        update: {
          request: requests.updatePostRequest,
          map: (key, changes) => ({ params: { postId: key }, payload: changes }),
        },
        delete: {
          request: requests.deletePostRequest,
          map: (key) => ({ params: { postId: key } }),
          onSuccess: "keep",
        },
      });
      const db = createDb({ post: Detail, summary: collection(PostSummarySchema, { key: "id" }) });
      db.post.update(1, { title: "New" });
      // @ts-expect-error `title` is a string
      db.post.update(1, { title: 1 });
      db.post.delete(1);
      // @ts-expect-error summaries declare no mutations
      db.summary.update(1, { title: "New" });
      expectTypeOf(db.post.insert).parameter(0).toEqualTypeOf<Post>();
    });

    it("requires onSuccess when the response is not the row", () => {
      const unhandled = collection(PostSchema, { key: "id" }).mutate({
        update: { request: requests.deletePostRequest, map: (key) => ({ params: { postId: key } }) },
      });
      const handled = collection(PostSchema, { key: "id" }).mutate({
        update: {
          request: requests.deletePostRequest,
          map: (key) => ({ params: { postId: key } }),
          onSuccess: "refetch",
        },
      });
      createDb({ handled });
      // @ts-expect-error a null response does not fit an update
      createDb({ unhandled });
    });
  });

  describe("links and normalizing", () => {
    it("checks nested rows against the target collection and links by collection name", () => {
      const Summary = collection(PostSummarySchema, { key: "id" });
      const Detail = collection(PostSchema, { key: "id" });
      const normalized = Detail.normalize(Summary, ({ body: _body, ...summary }) => [summary]);
      const mismatched = Detail.normalize(Summary, (post) => [post]);
      createDb({ summary: Summary, post: normalized }, { links: [["post", "summary"]] });
      // @ts-expect-error a post has a body, which summaries do not
      createDb({ summary: Summary, post: mismatched });
      // @ts-expect-error links name collections of the db
      createDb({ summary: Summary, post: Detail }, { links: [["post", "missing"]] });
    });
  });

  describe("joins", () => {
    it("adds the joined row, which may be missing, and checks the foreign key's type", () => {
      type Team = { id: number; name: string };
      type Tag = { slug: string };
      const db = createDb({
        post: collection(PostSchema, { key: "id" }).load(requests.getPost, {
          byKey: (id) => ({ params: { postId: id } }),
        }),
        team: collection(rowType<Team>(), { key: "id" }),
        tag: collection(rowType<Tag>(), { key: "slug" }),
      });
      const joined = db.post
        .findOne(1)
        .select((post) => ({ title: post.title, teamId: post.teamId }))
        .join("team", db.team, (post) => post.teamId);
      expectTypeOf(joined.getSnapshot().data).toEqualTypeOf<
        { title: string; teamId: number; team: Team | undefined } | undefined
      >();
      const list = db.post.join("team", db.team, (post) => post.teamId).join("owner", db.team, (post) => post.likes);
      expectTypeOf(list.getSnapshot().data).toEqualTypeOf<
        | { [Field in keyof Post | "team" | "owner"]: Field extends keyof Post ? Post[Field] : Team | undefined }[]
        | undefined
      >();
      // @ts-expect-error a number field cannot point at a string key
      db.post.join("tag", db.tag, (post) => post.teamId);
    });
  });

  describe("infinite queries", () => {
    it("needs an ordered list query and types its pages", () => {
      const db = createDb({
        post: collection(PostSchema, { key: "id" }).load(requests.getAllPosts, {
          rows: (response) => response.items,
          cursor: (response) => response.next,
          page: (cursor) => ({ queryParams: { cursor } }),
          orderBy: { createdAt: (direction) => ({ queryParams: { sort: direction } }) },
        }),
      });
      const feed = db.post
        .orderBy((post) => post.createdAt)
        .select((post) => ({ id: post.id }))
        .infinite({ pageSize: 20 });
      expectTypeOf(feed.getSnapshot().pages).toEqualTypeOf<{ id: number }[][]>();
      expectTypeOf(feed.getSnapshot().data).toEqualTypeOf<{ id: number }[] | undefined>();
      // @ts-expect-error pages need an order
      db.post.where((post) => eq(post.likes, 1)).infinite({ pageSize: 20 });
      // @ts-expect-error one row has no pages
      db.post
        .findOne(1)
        .orderBy((post) => post.createdAt)
        .infinite({ pageSize: 20 });
    });
  });

  describe("query extractors used by hooks", () => {
    it("reads the data, result and checks of any query", () => {
      const db = createDb({
        post: collection(PostSchema, { key: "id" }).load(requests.getAllPosts, {
          rows: (response) => response.items,
          cursor: (response) => response.next,
          page: (cursor) => ({ queryParams: { cursor } }),
          orderBy: { createdAt: (direction) => ({ queryParams: { sort: direction } }) },
        }),
      });
      const ordered = db.post.orderBy((post) => post.createdAt).select((post) => ({ id: post.id }));
      const one = db.post.findOne(1).local();
      expectTypeOf<ExtractQueryData<typeof ordered>>().toEqualTypeOf<{ id: number }[]>();
      expectTypeOf<ExtractQueryData<typeof one>>().toEqualTypeOf<Post>();
      expectTypeOf<ExtractQueryResult<typeof ordered>>().toEqualTypeOf<{ id: number }>();
      expectTypeOf<InfiniteQueryCheck<typeof ordered>>().toEqualTypeOf<unknown>();
      expectTypeOf<InfiniteQueryCheck<typeof one>>().not.toEqualTypeOf<unknown>();
      expectTypeOf<InfiniteQueryCheck<ReturnType<typeof db.post.local>>>().toEqualTypeOf<{ orderBy: never }>();
      expectTypeOf<ServableQuery<typeof ordered>>().toEqualTypeOf<unknown>();
      // The list loader is paginated, so a condition it cannot send does not compile
      expectTypeOf<
        ServableQuery<ReturnType<typeof db.post.where<ReturnType<typeof gt<"likes", number>>>>>
      >().toEqualTypeOf<{
        servable: never;
      }>();
    });
  });

  describe("holes found by the audit", () => {
    it("does not let a read by key take list-only parts it would ignore", () => {
      const db = createDb({
        post: collection(PostSchema, { key: "id" }).load(requests.getPost, {
          byKey: (id) => ({ params: { postId: id } }),
        }),
      });
      // @ts-expect-error one row has no filter
      db.post.findOne(1).where((post) => eq(post.teamId, 1));
      // @ts-expect-error one row has no order
      db.post.findOne(1).orderBy((post) => post.createdAt);
      // @ts-expect-error one row has no limit
      db.post.findOne(1).limit(1);
      db.post
        .findOne(1)
        .select((post) => ({ id: post.id }))
        .local();
    });

    it("needs the key of an insert made in a transaction", () => {
      const db = createDb({
        post: collection(PostSchema, { key: "id" }).mutate({
          insert: { request: requests.createPostRequest, map: (row) => ({ payload: row }) },
        }),
      });
      const check = () =>
        db.transaction((tx) => {
          const { id: _id, ...row } = {} as Post;
          // @ts-expect-error the transaction cannot learn a key the server assigns
          tx.post.insert(row);
          tx.post.insert({} as Post);
        });
      expect(check).toBeFunction();
    });
  });

  it("rejects collection names the db uses itself", () => {
    // @ts-expect-error `clear` is a db method
    createDb({ clear: collection(rowType<PostSummary>(), { key: "id" }) });
  });
});
