import { Client } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";
import { useLayoutEffect } from "react";

import {
  baseUrl,
  createDeferred,
  createListServer,
  failure,
  pageItems,
  settleRequests,
} from "../../utils/use-infinite-fetch.utils";

const { startServer, stopServer, resetMocks, mockList, calls, resetCalls } = createListServer();

type Post = { id: number; version?: number };

const ids = (items: Post[]) => items.map((item) => item.id);

const sleep = (time: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });

describe("useInfiniteFetch [ Refetch ]", () => {
  let client: Client;

  const createPosts = () =>
    client.createRequest<{ response: Post[]; queryParams: { page?: number } }>()({ endpoint: "/posts" });

  const createFeed = () =>
    client.createRequest<{
      response: { data: Post[]; nextCursor: string | null };
      queryParams: { cursor?: string };
    }>()({ endpoint: "/feed" });

  const pagination = { page: "page" } as const;
  const feedPagination = { cursor: "cursor", next: "nextCursor", items: "data" } as const;

  const renderPosts = async (pages = 2, options: Record<string, unknown> = {}) => {
    const view = renderHook(() =>
      useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false, ...options }),
    );
    await waitFor(() => expect(view.result.current.pageParams).toHaveLength(1));
    for (let page = 1; page < pages; page += 1) {
      // Pages depend on the previous ones
      // eslint-disable-next-line no-await-in-loop
      await act(() => view.result.current.fetchNextPage());
    }
    return view;
  };

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: baseUrl });
    resetCalls();
    mockList("/posts", ({ query }) => pageItems(Number(query.page)));
  });

  afterEach(async () => {
    await settleRequests(client);
    resetMocks();
  });

  describe("page numbers", () => {
    it("should refetch all the pages at the same time", async () => {
      const { result } = await renderPosts(3);
      resetCalls();

      let running = 0;
      let mostRunning = 0;
      mockList("/posts", async ({ query }) => {
        running += 1;
        mostRunning = Math.max(mostRunning, running);
        await sleep(20);
        running -= 1;
        return pageItems(Number(query.page));
      });

      await act(() => result.current.refetch());

      expect(calls.map((call) => call.query.page).toSorted()).toEqual(["1", "2", "3"]);
      expect(mostRunning).toBe(3);
    });

    it("should show the old pages until all of them arrive", async () => {
      const { result } = await renderPosts(2);
      const gate = createDeferred();

      mockList("/posts", async ({ query }) => {
        if (query.page === "2") {
          await gate.promise;
        }
        return pageItems(Number(query.page)).map((post) => ({ ...post, version: 2 }));
      });

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current.refetch();
      });
      expect(result.current.isRefetching).toBe(true);

      await waitFor(() => expect(createPosts().setQueryParams({ page: 1 }).read()?.data?.[0].version).toBe(2));
      expect(result.current.items.map((item) => item.version)).toEqual([undefined, undefined, undefined, undefined]);

      gate.resolve();
      await act(async () => {
        await pending;
      });

      expect(result.current.items.map((item) => item.version)).toEqual([2, 2, 2, 2]);
      expect(result.current.isRefetching).toBe(false);
    });

    it("should keep the old data of a page that failed to refetch", async () => {
      const { result } = await renderPosts(2);

      mockList("/posts", ({ query }) => {
        return query.page === "2" ? failure() : pageItems(1).map((post) => ({ ...post, version: 2 }));
      });
      await act(() => result.current.refetch());

      expect(result.current.items.map((item) => item.version)).toEqual([2, 2, undefined, undefined]);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("cursors", () => {
    it("should refetch in order, following the fresh cursors", async () => {
      mockList("/feed", ({ query }) => {
        const page = Number(query.cursor ?? 1);
        return { data: pageItems(page), nextCursor: page < 3 ? String(page + 1) : null };
      });
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: feedPagination, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      await act(() => result.current.fetchNextPage());
      resetCalls();

      mockList("/feed", ({ query }) => {
        if (!query.cursor) {
          return { data: [{ id: 100 }], nextCursor: "fresh" };
        }
        return { data: [{ id: 200 }], nextCursor: null };
      });
      await act(() => result.current.refetch());

      expect(calls.map((call) => call.query.cursor)).toEqual([undefined, "fresh"]);
      expect(ids(result.current.items)).toEqual([100, 200]);
      expect(result.current.hasNextPage).toBe(false);
    });

    it("should stop at a list that became shorter", async () => {
      mockList("/feed", ({ query }) => {
        return { data: pageItems(Number(query.cursor ?? 1)), nextCursor: query.cursor ? null : "2" };
      });
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: feedPagination, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      await act(() => result.current.fetchNextPage());

      mockList("/feed", () => ({ data: [{ id: 1 }], nextCursor: null }));
      await act(() => result.current.refetch());

      expect(ids(result.current.items)).toEqual([1]);
    });

    it("should leave the list alone when a page of the chain fails", async () => {
      mockList("/feed", ({ query }) => {
        return { data: pageItems(Number(query.cursor ?? 1)), nextCursor: query.cursor ? null : "2" };
      });
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: feedPagination, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      await act(() => result.current.fetchNextPage());

      mockList("/feed", ({ query }) => {
        return query.cursor ? failure() : { data: [{ id: 100 }], nextCursor: "2" };
      });
      await act(() => result.current.refetch());

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("triggers", () => {
    it("should refetch the chain when one page is invalidated", async () => {
      await renderPosts(2);
      resetCalls();

      act(() => {
        client.cache.invalidate(createPosts().setQueryParams({ page: 2 }));
      });

      await waitFor(() => expect(calls).toHaveLength(2));
    });

    it("should handle invalidating many pages with one refetch", async () => {
      await renderPosts(3);
      resetCalls();
      const add = vi.spyOn(client.fetchDispatcher, "add");

      act(() => {
        client.cache.invalidate(/posts/);
      });

      await waitFor(() => expect(calls).toHaveLength(3));
      await sleep(30);
      expect(calls).toHaveLength(3);
      expect(add).toHaveBeenCalledTimes(3);
    });

    it("should fetch again when a page is invalidated during a refetch", async () => {
      const { result } = await renderPosts(1);
      const gate = createDeferred();
      let version = 0;

      mockList("/posts", async () => {
        version += 1;
        const current = version;
        if (current === 1) {
          await gate.promise;
        }
        return [{ id: 1, version: current }];
      });

      act(() => {
        result.current.refetch();
      });
      await waitFor(() => expect(version).toBe(1));

      await act(async () => {
        client.cache.invalidate(createPosts().setQueryParams({ page: 1 }));
      });

      await waitFor(() => expect(result.current.items.map((item) => item.version)).toEqual([2]));
      gate.resolve();
      await sleep(20);
      expect(result.current.items.map((item) => item.version)).toEqual([2]);
    });

    it("should refetch when a loaded page is deleted", async () => {
      await renderPosts(1);
      resetCalls();

      act(() => {
        client.cache.delete(createPosts().setQueryParams({ page: 1 }).cacheKey);
      });

      await waitFor(() => expect(calls).toHaveLength(1));
    });

    it("should ignore changes of pages outside of the list", async () => {
      await renderPosts(1);
      resetCalls();

      act(() => {
        client.cache.invalidate(createPosts().setQueryParams({ page: 7 }));
      });

      await sleep(30);
      expect(calls).toHaveLength(0);
    });

    it("should refetch on focus and on reconnect when asked to", async () => {
      await renderPosts(1, { refetchOnFocus: true, refetchOnReconnect: true });
      resetCalls();

      act(() => client.appManager.events.emitFocus());
      await waitFor(() => expect(calls).toHaveLength(1));
      await sleep(20);

      act(() => client.appManager.events.emitOnline());
      await waitFor(() => expect(calls).toHaveLength(2));
    });

    it("should not refetch on focus by default", async () => {
      await renderPosts(1);
      resetCalls();

      act(() => client.appManager.events.emitFocus());

      await sleep(30);
      expect(calls).toHaveLength(0);
    });

    it("should refetch on the refresh interval", async () => {
      await renderPosts(1, { refresh: true, refreshTime: 20 });
      resetCalls();

      await waitFor(() => expect(calls.length).toBeGreaterThanOrEqual(2));
    });

    it("should refetch when the dependencies change", async () => {
      const { result, rerender } = renderHook(
        ({ version }) =>
          useInfiniteFetch(createPosts(), { pagination, dependencies: [version], dependencyTracking: false }),
        { initialProps: { version: 1 } },
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      resetCalls();

      rerender({ version: 2 });

      await waitFor(() => expect(calls).toHaveLength(1));
    });
  });

  describe("mounting", () => {
    it("should restore every cached page without requests", async () => {
      const first = await renderPosts(3);
      first.unmount();
      resetCalls();

      const { result } = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));

      expect(result.current.pageParams).toEqual([1, 2, 3]);
      expect(result.current.loading).toBe(false);
      await sleep(30);
      expect(calls).toHaveLength(0);
    });

    it("should refetch the restored pages when they are stale", async () => {
      const stale = () => createPosts().setStaleTime(0);
      const first = renderHook(() => useInfiniteFetch(stale(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      await act(() => first.result.current.fetchNextPage());
      first.unmount();
      await sleep(5);
      resetCalls();

      const { result } = renderHook(() => useInfiniteFetch(stale(), { pagination, dependencyTracking: false }));

      expect(result.current.pageParams).toEqual([1, 2]);
      await waitFor(() => expect(calls).toHaveLength(2));
    });

    it("should refetch fresh pages with the revalidate option", async () => {
      const first = await renderPosts(1);
      first.unmount();
      resetCalls();

      renderHook(() => useInfiniteFetch(createPosts(), { pagination, revalidate: true, dependencyTracking: false }));

      await waitFor(() => expect(calls).toHaveLength(1));
    });

    it("should not show pages after the cache was cleared", async () => {
      const first = await renderPosts(2);
      first.unmount();
      await client.cache.clear();

      const { result } = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));

      expect(result.current.items).toEqual([]);
      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.items).toHaveLength(2));
    });

    it("should pick up pages written between rendering and mounting", async () => {
      const response = {
        data: pageItems(1),
        error: null,
        status: 200,
        success: true,
        extra: {},
        requestTimestamp: Date.now(),
        responseTimestamp: Date.now(),
      } as any;

      const { result } = renderHook(() => {
        useLayoutEffect(() => {
          client.cache.set(createPosts().setQueryParams({ page: 1 }), response);
        }, []);
        return useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false, disabled: true });
      });

      await waitFor(() => expect(ids(result.current.items)).toEqual([1, 2]));
      expect(calls).toHaveLength(0);
    });

    it("should stop restoring at the first missing page", async () => {
      const first = await renderPosts(3);
      first.unmount();
      client.cache.delete(createPosts().setQueryParams({ page: 2 }).cacheKey);

      const { result } = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));

      expect(result.current.pageParams).toEqual([1]);
    });
  });

  describe("overlapping fetches", () => {
    it("should finish loading the next page before refetching", async () => {
      const { result } = await renderPosts(1);
      const gate = createDeferred();
      resetCalls();

      mockList("/posts", async ({ query }) => {
        if (query.page === "2" && !calls.some((call) => call.query.page === "1")) {
          await gate.promise;
        }
        return pageItems(Number(query.page));
      });

      let next: Promise<unknown> = Promise.resolve();
      let refetch: Promise<unknown> = Promise.resolve();
      act(() => {
        next = result.current.fetchNextPage();
        refetch = result.current.refetch();
      });

      await waitFor(() => expect(calls).toHaveLength(1));
      expect(calls[0].query.page).toBe("2");

      gate.resolve();
      await act(async () => {
        await Promise.all([next, refetch]);
      });

      expect(
        calls
          .map((call) => call.query.page)
          .slice(1)
          .toSorted(),
      ).toEqual(["1", "2"]);
      expect(result.current.pageParams).toEqual([1, 2]);
    });

    it("should replace a running refetch with a newer one", async () => {
      const { result } = await renderPosts(1);
      const gate = createDeferred();
      let version = 0;

      mockList("/posts", async () => {
        version += 1;
        const current = version;
        if (current === 1) {
          await gate.promise;
        }
        return [{ id: 1, version: current }];
      });

      let first: Promise<unknown> = Promise.resolve();
      act(() => {
        first = result.current.refetch();
      });
      await waitFor(() => expect(version).toBe(1));

      await act(() => result.current.refetch());
      gate.resolve();

      await expect(first).resolves.toBeNull();
      expect(result.current.items.map((item) => item.version)).toEqual([2]);
    });

    it("should join an automatic refetch instead of repeating it", async () => {
      const { result } = await renderPosts(1, { refetchOnFocus: true });
      const gate = createDeferred();
      resetCalls();

      mockList("/posts", async () => {
        await gate.promise;
        return pageItems(1);
      });

      act(() => {
        result.current.refetch();
      });
      await waitFor(() => expect(calls).toHaveLength(1));

      act(() => client.appManager.events.emitFocus());
      await sleep(20);
      expect(calls).toHaveLength(1);

      await act(async () => {
        gate.resolve();
      });
    });

    it("should keep a change made to a page while the others are still refetching", async () => {
      const { result } = await renderPosts(2);
      const gate = createDeferred();

      mockList("/posts", async ({ query }) => {
        if (query.page === "2") {
          await gate.promise;
        }
        return pageItems(Number(query.page));
      });

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current.refetch();
      });
      const firstPage = createPosts().setQueryParams({ page: 1 });
      const refetchedAt = firstPage.read()?.responseTimestamp;
      await waitFor(() => expect(firstPage.read()?.responseTimestamp).not.toBe(refetchedAt));

      act(() => {
        client.cache.update(firstPage, () => ({ data: [{ id: 42 }] }));
      });
      gate.resolve();
      await act(async () => {
        await pending;
      });

      expect(ids(result.current.items)).toEqual([42, 3, 4]);
    });

    it("should not reuse an older running request for a manual refetch", async () => {
      const gate = createDeferred();
      const { result } = await renderPosts(1);
      resetCalls();

      mockList("/posts", async () => {
        if (calls.length === 1) {
          await gate.promise;
        }
        return pageItems(1);
      });
      renderHook(() => useFetch(createPosts().setQueryParams({ page: 1 }).setDeduplicate(true)));
      await waitFor(() => expect(calls).toHaveLength(1));

      await act(() => result.current.refetch());

      expect(calls).toHaveLength(2);
      gate.resolve();
    });

    it("should not report a page cancelled from the outside as an error", async () => {
      const { result } = await renderPosts(1);
      const gate = createDeferred();

      mockList("/posts", async () => {
        await gate.promise;
        return pageItems(2);
      });

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current.fetchNextPage();
      });
      await waitFor(() => expect(calls.length).toBeGreaterThan(1));

      act(() => {
        createPosts().setQueryParams({ page: 2 }).abort();
      });
      await act(async () => {
        await pending;
      });
      gate.resolve();

      expect(result.current.error).toBeNull();
      expect(result.current.isFetchNextPageError).toBe(false);
      expect(result.current.pageParams).toEqual([1]);
    });
  });
});
