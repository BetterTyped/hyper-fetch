import { and, collection, createDb, eq, gt, gte, inArray, lt, lte, not, or } from "@hyper-fetch/db";
import type { DbOptions } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import type { HttpClient, Post } from "../utils/fixtures";
import {
  PostSchema,
  PostSummarySchema,
  createApi,
  createHttpClient,
  createPost,
  createRequests,
  deferred,
  flush,
  toSummary,
} from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

const setup = (options: DbOptions = {}) => {
  const client: HttpClient = createHttpClient();
  const requests = createRequests(client);
  const api = createApi(server);
  const Summary = collection(PostSummarySchema, { key: "id" }).load(requests.getTeamPosts, {
    where: {
      ...byTeam,
      likes: { gt: (likes) => ({ queryParams: { likes_gt: likes } }) },
      title: { eq: true },
    },
    orderBy: { createdAt: (direction) => ({ queryParams: { sort: `createdAt:${direction}` } }), likes: true },
    serverOnly: ["title"],
  });
  const Full = collection(PostSchema, { key: "id" })
    .load(requests.getTeamFullPosts, {
      rows: (response) => response.items,
      where: byTeam,
      fixed: { archived: false },
    })
    .load(requests.getPost, { byKey: (id) => ({ params: { postId: id } }) });
  const Limited = collection(PostSchema, { key: "id" }).load(requests.getTeamFullPosts, {
    rows: (response) => response.items,
    where: byTeam,
    limit: (limit) => ({ queryParams: { limit } }),
  });
  const Paged = collection(PostSchema, { key: "id" }).load(requests.getAllPosts, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    orderBy: { createdAt: (direction) => ({ queryParams: { sort: `createdAt:${direction}` } }) },
  });
  const db = createDb({ summary: Summary, full: Full, limited: Limited, paged: Paged }, options);
  return { client, requests, api, db };
};

type Setup = ReturnType<typeof setup>;

const serveTeam = (api: Setup["api"], posts: Post[]) => {
  api.get("/teams/:teamId/posts", ({ params }) => ({
    data: posts.filter((post) => post.teamId === Number(params.teamId)).map(toSummary),
  }));
};

describe("db [ Queries ]", () => {
  let context: Setup;

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
  });
  afterEach(() => {
    vi.useRealTimers();
    context.db.destroy();
  });
  afterAll(() => stopServer());

  describe("when a list query loads", () => {
    it("sends declared conditions and runs the rest on the loaded rows", async () => {
      const { api, db } = context;
      serveTeam(api, [createPost(1), createPost(2, { title: "Other" }), createPost(3), createPost(4, { teamId: 2 })]);
      const query = db.summary
        .where((post) => and(eq(post.teamId, 1), gt(post.likes, 1), lt(post.id, 10)))
        .orderBy((post) => post.likes, "desc")
        .select((post) => ({ id: post.id, title: post.title }));

      expect(query.getSnapshot().status).toBe("loading");
      const unsubscribe = query.subscribe(() => {});
      expect(query.getSnapshot().isFetching).toBeTrue();
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));

      const [call] = api.callsTo("/teams/1/posts");
      expect(call.url.searchParams.get("likes_gt")).toBe("1");
      expect(query.getSnapshot()).toMatchObject({
        data: [
          { id: 3, title: "Post 3" },
          { id: 2, title: "Other" },
        ],
        error: null,
        stale: false,
        isFetching: false,
        hasNextPage: false,
      });
      unsubscribe();
    });

    it("applies a local limit and keeps the result identity while nothing changes", async () => {
      const { api, db } = context;
      serveTeam(api, [createPost(1), createPost(2), createPost(3)]);
      const query = db.summary.where((post) => eq(post.teamId, 1)).limit(2);
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      const snapshot = query.getSnapshot();
      expect(snapshot.data?.map((post) => post.id)).toStrictEqual([1, 2]);
      expect(query.getSnapshot()).toBe(snapshot);
      expect(
        db.summary
          .where((post) => eq(post.teamId, 1))
          .limit(2)
          .getSnapshot(),
      ).toBe(snapshot);
      unsubscribe();
    });

    it("shares one request between queries that send the same conditions", async () => {
      const { api, db } = context;
      serveTeam(api, [createPost(1), createPost(2)]);
      const first = db.summary.where((post) => eq(post.teamId, 1));
      const second = db.summary.where((post) => and(eq(post.teamId, 1), gte(post.likes, 2)));
      const unsubscribeFirst = first.subscribe(() => {});
      const unsubscribeSecond = second.subscribe(() => {});
      await vi.waitFor(() => expect(second.getSnapshot().status).toBe("ready"));
      expect(api.callsTo("/teams/1/posts")).toHaveLength(1);
      expect(second.getSnapshot().data?.map((post) => post.id)).toStrictEqual([2]);
      unsubscribeFirst();
      unsubscribeSecond();
    });

    it("sends orders and conditions through the loader and the db-wide notation", async () => {
      context.db.destroy();
      context = setup({
        where: { eq: (field, value) => ({ queryParams: { [field]: value } }) },
        orderBy: (field, direction) => ({ queryParams: { sort: `${field}:${direction}` } }),
      });
      const { api, db } = context;
      serveTeam(api, [createPost(1), createPost(2)]);
      const query = db.summary
        .where((post) => and(eq(post.teamId, 1), eq(post.title, "Post 2")))
        .orderBy((post) => post.likes, "desc");
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      const [call] = api.callsTo("/teams/1/posts");
      expect(call.url.searchParams.get("title")).toBe("Post 2");
      expect(call.url.searchParams.get("sort")).toBe("likes:desc");
      expect(query.explain()).toMatchObject({ kind: "list", loader: 0, answeredLocally: false });
      unsubscribe();
    });

    it("sends the loader's own order mapping and limit", async () => {
      const { api, db } = context;
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
      serveTeam(api, [createPost(1)]);
      const ordered = db.summary.where((post) => eq(post.teamId, 1)).orderBy((post) => post.createdAt, "desc");
      const limited = db.limited.where((post) => eq(post.teamId, 1)).limit(1);
      const unsubscribeOrdered = ordered.subscribe(() => {});
      const unsubscribeLimited = limited.subscribe(() => {});
      await vi.waitFor(() => expect(limited.getSnapshot().status).toBe("ready"));
      await vi.waitFor(() => expect(ordered.getSnapshot().status).toBe("ready"));
      expect(api.callsTo("/teams/1/posts")[0].url.searchParams.get("sort")).toBe("createdAt:desc");
      expect(api.callsTo("/teams/1/full-posts")[0].url.searchParams.get("limit")).toBe("1");
      expect(limited.getSnapshot().data).toHaveLength(2);
      unsubscribeOrdered();
      unsubscribeLimited();
    });
  });

  describe("when rows the db holds can answer a query", () => {
    it("answers it locally without a request", async () => {
      const { api, db } = context;
      serveTeam(api, [createPost(1), createPost(2), createPost(3)]);
      const team = db.summary.where((post) => eq(post.teamId, 1));
      const unsubscribeTeam = team.subscribe(() => {});
      await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));

      const liked = db.summary.where((post) => and(eq(post.teamId, 1), gt(post.likes, 1)));
      expect(liked.explain().answeredLocally).toBeTrue();
      const unsubscribeLiked = liked.subscribe(() => {});
      expect(liked.getSnapshot().data?.map((post) => post.id)).toStrictEqual([2, 3]);
      expect(liked.explain().answeredLocally).toBeTrue();
      expect(api.callsTo("/teams/1/posts")).toHaveLength(1);
      unsubscribeTeam();
      unsubscribeLiked();
    });

    it("never answers locally on a field the backend compares differently", async () => {
      const { api, db } = context;
      serveTeam(api, [createPost(1), createPost(2)]);
      const team = db.summary.where((post) => eq(post.teamId, 1));
      const unsubscribeTeam = team.subscribe(() => {});
      await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));

      context.db.destroy();
      const byTitle = db.summary.where((post) => and(eq(post.teamId, 1), eq(post.title, "Post 1")));
      expect(byTitle.explain().answeredLocally).toBeFalse();
      unsubscribeTeam();
    });

    it("reads only held rows with local()", async () => {
      const { api, db } = context;
      serveTeam(api, [createPost(1), createPost(2)]);
      const local = db.summary.local().where((post) => or(eq(post.id, 2), not(eq(post.likes, 1))));
      expect(local.explain()).toMatchObject({ kind: "local", answeredLocally: true });
      const unsubscribeLocal = local.subscribe(() => {});
      expect(local.getSnapshot()).toMatchObject({ status: "ready", data: [] });

      const team = db.summary.where((post) => eq(post.teamId, 1));
      const unsubscribeTeam = team.subscribe(() => {});
      await vi.waitFor(() => expect(local.getSnapshot().data).toHaveLength(1));
      expect(local.getSnapshot().data?.[0].id).toBe(2);
      expect(db.summary.local().explain().local).toStrictEqual([]);
      unsubscribeLocal();
      unsubscribeTeam();
    });

    it("reads a held row by key with a local findOne", async () => {
      const { api, db } = context;
      serveTeam(api, [createPost(1)]);
      const team = db.summary.where((post) => eq(post.teamId, 1));
      const unsubscribeTeam = team.subscribe(() => {});
      await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));
      const one = db.summary.findOne(1).local();
      const unsubscribeOne = one.subscribe(() => {});
      expect(one.getSnapshot()).toMatchObject({ status: "ready", data: { id: 1 } });
      expect(db.summary.findOne(5).local().getSnapshot().data).toBeUndefined();
      unsubscribeOne();
      unsubscribeTeam();
    });
  });

  it("answers locally from a subset whose loader has fixed filters", async () => {
    const { api, db } = context;
    api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1), createPost(2)] } }));
    const team = db.full.where((post) => eq(post.teamId, 1));
    const unsubscribe = team.subscribe(() => {});
    await vi.waitFor(() => expect(team.getSnapshot().status).toBe("ready"));
    const liked = db.full.where((post) => and(eq(post.teamId, 1), gt(post.likes, 1)));
    expect(liked.explain()).toMatchObject({ kind: "list", loader: 0, answeredLocally: false });
    const stop = liked.subscribe(() => {});
    expect(liked.getSnapshot().data?.map((post) => post.id)).toStrictEqual([2]);
    expect(api.callsTo("/teams/1/full-posts")).toHaveLength(1);
    stop();
    unsubscribe();
  });

  describe("when a request fails", () => {
    it("reports a first load error and recovers on refetch", async () => {
      const { api, db } = context;
      api.get("/teams/:teamId/posts", () => ({ status: 500, data: { message: "Down" } }));
      const query = db.summary.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("error"));
      expect(query.getSnapshot()).toMatchObject({ data: undefined, error: { message: "Down" } });

      serveTeam(api, [createPost(1)]);
      await query.refetch();
      expect(query.getSnapshot()).toMatchObject({ status: "ready", error: null });
      unsubscribe();
    });

    it("keeps the rows and sets the error when a refresh fails", async () => {
      const { api, db } = context;
      serveTeam(api, [createPost(1)]);
      const query = db.summary.where((post) => eq(post.teamId, 1));
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      api.get("/teams/:teamId/posts", () => ({ status: 500, data: { message: "Down" } }));
      await query.refetch();
      expect(query.getSnapshot()).toMatchObject({ status: "ready", error: { message: "Down" } });
      expect(query.getSnapshot().data).toHaveLength(1);
      unsubscribe();
    });

    it("reports a query no loader can serve", async () => {
      const { db } = context;
      const query = db.summary.where((post) => gt(post.likes, 1)) as never as typeof db.summary extends never
        ? never
        : ReturnType<typeof db.summary.local>;
      const unsubscribe = query.subscribe(() => {});
      await query.refetch();
      await query.fetchNextPage();
      expect(query.getSnapshot()).toMatchObject({ status: "error", data: undefined });
      expect(query.explain()).toMatchObject({ kind: "error" });
      unsubscribe();
    });
  });

  describe("when rows change between loads", () => {
    it("shows rows another subset loaded when they match, and hides rows a refetch no longer returned", async () => {
      const { api, db } = context;
      let items = [createPost(1), createPost(2)];
      api.get("/teams/:teamId/full-posts", () => ({ data: { items } }));
      api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));

      const detail = db.full.findOne(3);
      const unsubscribeDetail = detail.subscribe(() => {});
      await vi.waitFor(() => expect(detail.getSnapshot().data?.id).toBe(3));

      const list = db.full.where((post) => eq(post.teamId, 1));
      const unsubscribeList = list.subscribe(() => {});
      await vi.waitFor(() => expect(list.getSnapshot().status).toBe("ready"));
      expect(list.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 3]);

      items = [createPost(1), createPost(4, { archived: true })];
      await list.refetch();
      expect(list.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 3]);

      const two = db.full.findOne(2).local();
      expect(two.getSnapshot().data).toBeUndefined();

      unsubscribeDetail();
      unsubscribeList();
    });

    it("keeps a released row another subset holds, but not in the list that released it", async () => {
      const { api, db } = context;
      let items = [createPost(1), createPost(2)];
      api.get("/teams/:teamId/full-posts", () => ({ data: { items } }));
      api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId)) }));

      const list = db.full.where((post) => eq(post.teamId, 1));
      const unsubscribeList = list.subscribe(() => {});
      await vi.waitFor(() => expect(list.getSnapshot().status).toBe("ready"));
      const detail = db.full.findOne(2);
      const unsubscribeDetail = detail.subscribe(() => {});
      await vi.waitFor(() => expect(detail.getSnapshot().isFetching).toBeFalse());

      items = [createPost(1)];
      await list.refetch();
      expect(list.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1]);
      expect(detail.getSnapshot().data?.id).toBe(2);
      unsubscribeList();
      unsubscribeDetail();
    });
  });

  describe("when a loader is paginated", () => {
    it("loads pages by cursor and only from the backend's order", async () => {
      const { api, db } = context;
      api.get("/all-posts", ({ url }) => {
        const cursor = url.searchParams.get("cursor");
        return cursor
          ? { data: { items: [createPost(3)], next: null } }
          : { data: { items: [createPost(1), createPost(2)], next: "page-2" } };
      });
      const query = db.paged.orderBy((post) => post.createdAt);
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      expect(query.getSnapshot()).toMatchObject({ hasNextPage: true });
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2]);

      await query.fetchNextPage();
      expect(query.getSnapshot()).toMatchObject({ hasNextPage: false });
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 3]);
      expect(api.callsTo("/all-posts")[1].url.searchParams.get("cursor")).toBe("page-2");
      await query.fetchNextPage();
      expect(api.callsTo("/all-posts")).toHaveLength(2);

      await query.refetch();
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 3]);
      unsubscribe();
    });

    it("refetches every loaded page and releases rows the server no longer returns", async () => {
      const { api, db } = context;
      let pages: Record<string, { items: Post[]; next: string | null }> = {
        first: { items: [createPost(1), createPost(2)], next: "page-2" },
        "page-2": { items: [createPost(3), createPost(4)], next: null },
      };
      api.get("/all-posts", ({ url }) => ({ data: pages[url.searchParams.get("cursor") ?? "first"] }));
      const query = db.paged.orderBy((post) => post.createdAt);
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      await query.fetchNextPage();
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 3, 4]);

      pages = {
        first: { items: [createPost(1), createPost(2)], next: "page-2b" },
        "page-2b": { items: [createPost(4, { title: "Renamed" })], next: "page-3" },
      };
      await query.refetch();
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 4]);
      expect(query.getSnapshot().data?.[2].title).toBe("Renamed");
      expect(query.getSnapshot().hasNextPage).toBeTrue();
      expect(api.callsTo("/all-posts").map((call) => call.url.searchParams.get("cursor"))).toStrictEqual([
        null,
        "page-2",
        null,
        "page-2b",
      ]);
      unsubscribe();
    });

    it("keeps the loaded rows and reports the error when a page fails during a refetch", async () => {
      const { api, db } = context;
      let failSecond = false;
      api.get("/all-posts", ({ url }) => {
        const cursor = url.searchParams.get("cursor");
        if (cursor && failSecond) {
          return { status: 500, data: { message: "Down" } };
        }
        return cursor
          ? { data: { items: [createPost(3)], next: null } }
          : { data: { items: [createPost(1), createPost(2)], next: "page-2" } };
      });
      const query = db.paged.orderBy((post) => post.createdAt);
      const unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      await query.fetchNextPage();
      failSecond = true;
      await query.refetch();
      expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 2, 3]);
      expect(query.getSnapshot().error).toBeTruthy();
      unsubscribe();
    });

    it("waits for the page in flight when the next page is requested", async () => {
      const { api, db } = context;
      const release = deferred();
      api.get("/all-posts", async () => {
        await release.promise;
        return { data: { items: [createPost(1)], next: "next" } };
      });
      const query = db.paged.orderBy((post) => post.createdAt);
      const unsubscribe = query.subscribe(() => {});
      const next = query.fetchNextPage();
      release.resolve();
      await next;
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      expect(api.callsTo("/all-posts")).toHaveLength(1);
      unsubscribe();
    });
  });

  describe("when queries come and go", () => {
    it("reuses a fresh subset, and releases its rows after gcTime", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      context.db.destroy();
      context = setup({ gcTime: 1000 });
      const { api, db } = context;
      serveTeam(api, [createPost(1)]);
      const query = db.summary.where((post) => eq(post.teamId, 1));
      let unsubscribe = query.subscribe(() => {});
      await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
      unsubscribe();
      unsubscribe = query.subscribe(() => {});
      expect(query.getSnapshot().status).toBe("ready");
      expect(api.callsTo("/teams/1/posts")).toHaveLength(1);
      unsubscribe();

      vi.advanceTimersByTime(999);
      expect(db.summary.findOne(1).local().getSnapshot().data?.id).toBe(1);
      vi.advanceTimersByTime(1);
      expect(db.summary.findOne(1).local().getSnapshot().data).toBeUndefined();
    });

    it("refetches stale subsets on focus and when the connection returns, and leaves fresh ones", async () => {
      const { api, db, client, requests } = context;
      api.get("/teams/:teamId/full-posts", () => ({ data: { items: [createPost(1)] } }));
      serveTeam(api, [createPost(1)]);
      requests.getTeamFullPosts.staleTime = 0;
      const stale = db.full.where((post) => eq(post.teamId, 1));
      const fresh = db.summary.where((post) => eq(post.teamId, 1));
      const unsubscribeStale = stale.subscribe(() => {});
      const unsubscribeFresh = fresh.subscribe(() => {});
      await vi.waitFor(() => expect(stale.getSnapshot().status).toBe("ready"));
      await vi.waitFor(() => expect(fresh.getSnapshot().status).toBe("ready"));
      expect(stale.getSnapshot().stale).toBeTrue();

      client.appManager.setFocused(false);
      client.appManager.setFocused(true);
      await vi.waitFor(() => expect(api.callsTo("/teams/1/full-posts")).toHaveLength(2));
      client.appManager.setOnline(false);
      client.appManager.setOnline(true);
      await vi.waitFor(() => expect(api.callsTo("/teams/1/full-posts")).toHaveLength(3));
      await flush();
      expect(api.callsTo("/teams/1/posts")).toHaveLength(1);
      unsubscribeStale();
      unsubscribeFresh();
    });

    it("reads a query once with get()", async () => {
      const { api, db } = context;
      serveTeam(api, [createPost(1)]);
      const state = await db.summary.where((post) => eq(post.teamId, 1)).get();
      expect(state.data?.[0].id).toBe(1);
      const local = await db.summary.local().get();
      expect(local.status).toBe("ready");
    });
  });

  it("supports every comparison operator", async () => {
    const { api, db } = context;
    serveTeam(api, [createPost(1), createPost(2), createPost(3)]);
    const query = db.summary.where((post) =>
      and(eq(post.teamId, 1), gte(post.likes, 1), lte(post.likes, 3), inArray(post.id, [1, 3])),
    );
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1, 3]);
    unsubscribe();
  });
});
