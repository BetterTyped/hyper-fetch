import { createClient } from "@hyper-fetch/core";
import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useLiveInfiniteQuery } from "hooks/use-live-infinite-query";
import { HttpResponse, http } from "msw";
import { StrictMode } from "react";
import { expectTypeOf } from "vitest";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

type Post = { id: number; teamId: number; title: string };

const URL = "http://localhost:3000";
/** The backend's page size, which differs from the UI's on purpose */
const BACKEND_PAGE = 2;

const createSetup = () => {
  const client = createClient({ url: URL });
  const getFeed = client.createRequest<{
    response: { items: Post[]; next: string | null };
    queryParams?: { cursor?: string; sort?: string };
  }>()({ endpoint: "/feed" });
  const createPost = client.createRequest<{ response: Post; payload: Post }>()({ endpoint: "/posts", method: "POST" });
  const Feed = collection(rowType<Post>(), { key: "id" })
    .load(getFeed, {
      rows: (response) => response.items,
      cursor: (response) => response.next,
      page: (cursor) => ({ queryParams: { cursor } }),
      orderBy: { id: (direction) => ({ queryParams: { sort: direction } }) },
    })
    .mutate({ insert: { request: createPost, map: (row) => ({ payload: row }) } });
  const db = createDb({ feed: Feed }, { gcTime: 10 });
  return { db };
};

const post = (id: number, teamId = 1): Post => ({ id, teamId, title: `Post ${id}` });

/** A cursor backend over `rows()`, sorted by id, `BACKEND_PAGE` rows per page */
const serveFeed = (rows: () => Post[], calls: string[] = []) => {
  server.use(
    http.get(`${URL}/feed`, ({ request }) => {
      const cursor = new globalThis.URL(request.url).searchParams.get("cursor");
      calls.push(cursor ?? "first");
      const start = Number(cursor ?? 0);
      const sorted = rows().toSorted((left, right) => left.id - right.id);
      const end = start + BACKEND_PAGE;
      return HttpResponse.json({ items: sorted.slice(start, end), next: end < sorted.length ? String(end) : null });
    }),
    http.post(`${URL}/posts`, async ({ request }) => HttpResponse.json(await request.json())),
  );
  return calls;
};

const ids = (items: Post[] | undefined) => items?.map((item) => item.id);

describe("useLiveInfiniteQuery [ Base ]", () => {
  let setup = createSetup();

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    setup = createSetup();
  });
  afterEach(() => setup.db.destroy());
  afterAll(() => stopServer());

  it("renders pages, grows them through the last partial page, and does nothing at the end", async () => {
    const { db } = setup;
    const calls = serveFeed(() => [1, 2, 3, 4, 5].map((id) => post(id)));
    const { result } = renderHook(() =>
      useLiveInfiniteQuery(
        db.feed.orderBy((row) => row.id),
        { pageSize: 3 },
      ),
    );
    expect(result.current).toMatchObject({ status: "loading", data: undefined, pages: [] });
    await waitFor(() => expect(result.current.data).toHaveLength(3));
    await waitFor(() => expect(result.current.isFetchingNextPage).toBeFalse());
    expect(result.current.hasNextPage).toBeTrue();
    expectTypeOf(result.current.pages).toEqualTypeOf<Post[][]>();

    await act(() => result.current.fetchNextPage());
    expect(result.current.pages.map(ids)).toStrictEqual([
      [1, 2, 3],
      [4, 5],
    ]);
    expect(result.current.hasNextPage).toBeFalse();
    const count = calls.length;
    await act(() => result.current.fetchNextPage());
    expect(calls).toHaveLength(count);

    await act(() => result.current.refetch());
    expect(calls.slice(count)).toStrictEqual(["first", "2", "4"]);
  });

  it("keeps the loaded pages for the same query across renders, and starts again for another query", async () => {
    const { db } = setup;
    serveFeed(() => [1, 2, 3, 4, 5, 6].map((id) => post(id)));
    const { result, rerender } = renderHook(
      ({ pageSize }: { pageSize: number }) =>
        useLiveInfiniteQuery(
          db.feed.orderBy((row) => row.id),
          { pageSize },
        ),
      { initialProps: { pageSize: 2 } },
    );
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    await waitFor(() => expect(result.current.isFetchingNextPage).toBeFalse());
    await act(() => result.current.fetchNextPage());
    expect(result.current.data).toHaveLength(4);

    rerender({ pageSize: 2 });
    expect(result.current.data).toHaveLength(4);

    rerender({ pageSize: 3 });
    expect(result.current.pages.map(ids)).toStrictEqual([[1, 2, 3]]);
  });

  it("shifts rows across pages when a row is inserted", async () => {
    const { db } = setup;
    serveFeed(() => [2, 3, 4, 5, 6].map((id) => post(id)));
    const { result } = renderHook(() =>
      useLiveInfiniteQuery(
        db.feed.orderBy((row) => row.id),
        { pageSize: 2 },
      ),
    );
    await waitFor(() => expect(result.current.isFetchingNextPage).toBeFalse());
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    await act(() => result.current.fetchNextPage());
    await act(async () => {
      await db.feed.insert(post(1));
    });
    expect(result.current.pages.map(ids)).toStrictEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("survives the double mount of StrictMode and releases the query on unmount", async () => {
    const { db } = setup;
    serveFeed(() => [1, 2, 3].map((id) => post(id)));
    const { result, unmount } = renderHook(
      () =>
        useLiveInfiniteQuery(
          db.feed.orderBy((row) => row.id),
          { pageSize: 2 },
        ),
      { wrapper: StrictMode },
    );
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    await waitFor(() => expect(result.current.isFetchingNextPage).toBeFalse());
    expect(ids(result.current.data)).toStrictEqual([1, 2]);
    unmount();
  });

  it("does not compile for a query without an order", () => {
    const { db } = setup;
    const useUnordered = () => {
      useLiveInfiniteQuery(
        // @ts-expect-error pages need `orderBy`
        db.feed.where((row) => eq(row.teamId, 1)),
        { pageSize: 2 },
      );
    };
    expect(useUnordered).toBeFunction();
  });
});
