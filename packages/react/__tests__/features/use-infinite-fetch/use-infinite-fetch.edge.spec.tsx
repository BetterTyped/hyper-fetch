/* eslint-disable react/state-in-constructor, react/no-set-state */
import { Client } from "@hyper-fetch/core";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";
import React, { Suspense, useLayoutEffect } from "react";

import {
  baseUrl,
  createDeferred,
  createListServer,
  failure,
  pageItems,
  settleRequests,
  sleep,
} from "../../utils/use-infinite-fetch.utils";

const { startServer, stopServer, resetMocks, mockList, calls, resetCalls } = createListServer();

type Post = { id: number; version?: number };
type Feed = { data: Post[]; next: string | null; previous?: string | null };

const ids = (items: Post[]) => items.map((item) => item.id);

class Boundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? <div>boundary</div> : this.props.children;
  }
}

describe("useInfiniteFetch [ Edge cases ]", () => {
  let client: Client;

  const createPosts = () =>
    client.createRequest<{ response: Post[]; queryParams: { page?: number; search?: string } }>()({
      endpoint: "/posts",
    });

  const createFeed = () =>
    client.createRequest<{ response: Feed; queryParams: { cursor?: string } }>()({ endpoint: "/feed" });

  const pagination = { page: "page" } as const;
  const feedPagination = { cursor: "cursor", next: "next", previous: "previous", items: "data" } as const;

  const renderPosts = async (options: Record<string, unknown> = {}) => {
    const view = renderHook(() =>
      useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false, ...options }),
    );
    await waitFor(() => expect(view.result.current.pageParams).toHaveLength(1));
    return view;
  };

  const mockFeed = () => {
    mockList("/feed", ({ query }) => {
      const page = Number(query.cursor ?? 1);
      return {
        data: pageItems(page),
        next: page < 3 ? String(page + 1) : null,
        previous: page > 1 ? String(page - 1) : null,
      };
    });
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

  describe("joining requests of other hooks", () => {
    const joined = () => createPosts().setDeduplicate(false);

    const renderJoined = async () => {
      // Without tracking, the value does not depend on being read before the response arrives
      const owner = renderHook(() => useFetch(joined().setQueryParams({ page: 1 }), { dependencyTracking: false }));
      await waitFor(() => expect(calls).toHaveLength(1));
      const list = renderHook(() => useInfiniteFetch(joined(), { pagination, dependencyTracking: false }));
      return { owner, list };
    };

    it("should only stop waiting when aborted, the request belongs to the other hook", async () => {
      const gate = createDeferred();
      mockList("/posts", async () => {
        await gate.promise;
        return pageItems(1);
      });
      const { owner, list } = await renderJoined();

      act(() => list.result.current.abort());
      expect(list.result.current.isFetching).toBe(false);

      await act(async () => {
        gate.resolve();
      });

      await waitFor(() => expect(owner.result.current.data).toEqual(pageItems(1)));
      expect(calls).toHaveLength(1);
      expect(list.result.current.error).toBeNull();
    });

    it("should send its own request when the other one is removed", async () => {
      const gate = createDeferred();
      mockList("/posts", async () => {
        if (calls.length === 1) {
          await gate.promise;
        }
        return pageItems(1);
      });
      const { list } = await renderJoined();

      const queryKey = joined().setQueryParams({ page: 1 }).queryKey;
      const [running] = client.fetchDispatcher.getRunningRequests(queryKey);
      act(() => {
        client.fetchDispatcher.delete(queryKey, running.requestId, joined().setQueryParams({ page: 1 }).abortKey);
      });

      await waitFor(() => expect(list.result.current.items).toHaveLength(2));
      expect(calls).toHaveLength(2);
      gate.resolve();
    });

    it("should report the failure of the joined request without repeating it", async () => {
      const gate = createDeferred();
      mockList("/posts", async () => {
        await gate.promise;
        return failure();
      });
      const { list } = await renderJoined();

      await act(async () => {
        gate.resolve();
      });

      await waitFor(() => expect(list.result.current.error).toBeTruthy());
      expect(calls).toHaveLength(1);
      expect(list.result.current.items).toEqual([]);
    });

    it("should wait through the retries of the joined request", async () => {
      let attempt = 0;
      const gate = createDeferred();
      mockList("/posts", async () => {
        attempt += 1;
        await gate.promise;
        return attempt === 1 ? failure() : pageItems(1);
      });
      const retried = () => joined().setRetry(1).setRetryTime(5);
      renderHook(() => useFetch(retried().setQueryParams({ page: 1 })));
      await waitFor(() => expect(calls).toHaveLength(1));

      const list = renderHook(() => useInfiniteFetch(retried(), { pagination, dependencyTracking: false }));
      await act(async () => {
        gate.resolve();
      });

      await waitFor(() => expect(list.result.current.items).toHaveLength(2));
      expect(list.result.current.error).toBeNull();
      expect(calls).toHaveLength(2);
    });

    it("should keep waiting for a joined request postponed by going offline", async () => {
      const gate = createDeferred();
      let attempt = 0;
      mockList("/posts", async () => {
        attempt += 1;
        if (attempt === 1) {
          await gate.promise;
          return failure();
        }
        return pageItems(1);
      });
      const { list } = await renderJoined();

      act(() => client.appManager.setOnline(false));
      await act(async () => {
        gate.resolve();
        await sleep(30);
      });

      expect(list.result.current.error).toBeNull();
      expect(list.result.current.isFetching).toBe(true);

      act(() => client.appManager.setOnline(true));

      await waitFor(() => expect(list.result.current.items).toHaveLength(2));
    });
  });

  describe("calling actions at the wrong time", () => {
    it("should share the first request when asking for the next page too early", async () => {
      const view = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));

      let early: Promise<unknown> = Promise.resolve();
      act(() => {
        early = view.result.current.fetchNextPage();
      });
      await act(async () => {
        await early;
      });

      expect(view.result.current.pageParams).toEqual([1]);
      expect(calls).toHaveLength(1);
    });

    it("should do nothing when asking for pages of a failed list", async () => {
      mockList("/posts", () => failure());
      const view = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(view.result.current.error).toBeTruthy());
      resetCalls();

      await expect(view.result.current.fetchNextPage()).resolves.toBeNull();
      await expect(view.result.current.fetchPreviousPage()).resolves.toBeNull();

      expect(calls).toHaveLength(0);
    });

    it("should do nothing when there is no page in that direction", async () => {
      mockList("/posts", () => []);
      const { result } = await renderPosts();
      resetCalls();

      await expect(result.current.fetchNextPage()).resolves.toBeNull();
      await expect(result.current.fetchPreviousPage()).resolves.toBeNull();

      expect(calls).toHaveLength(0);
    });

    it("should load the first page again on reset of a failed list", async () => {
      mockList("/posts", () => failure());
      const view = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(view.result.current.error).toBeTruthy());

      mockList("/posts", ({ query }) => pageItems(Number(query.page)));
      await act(() => view.result.current.reset());

      expect(view.result.current.error).toBeNull();
      expect(ids(view.result.current.items)).toEqual([1, 2]);
    });

    it("should ignore a refetch of a disabled list on changed dependencies", async () => {
      const { rerender } = renderHook(
        ({ version }) =>
          useInfiniteFetch(createPosts(), {
            pagination,
            disabled: true,
            dependencies: [version],
            dependencyTracking: false,
          }),
        { initialProps: { version: 1 } },
      );

      rerender({ version: 2 });

      await sleep(30);
      expect(calls).toHaveLength(0);
    });

    it("should return the same actions between renders", async () => {
      const { result, rerender } = await renderPosts();
      const { fetchNextPage, refetch, reset, abort } = result.current;

      rerender();

      expect(result.current.fetchNextPage).toBe(fetchNextPage);
      expect(result.current.refetch).toBe(refetch);
      expect(result.current.reset).toBe(reset);
      expect(result.current.abort).toBe(abort);
    });
  });

  describe("queued fetches", () => {
    it("should cancel fetches waiting in line on abort", async () => {
      const { result } = await renderPosts();
      const gate = createDeferred();
      resetCalls();
      mockList("/posts", async () => {
        await gate.promise;
        return pageItems(2);
      });

      let next: Promise<unknown> = Promise.resolve();
      let refetch: Promise<unknown> = Promise.resolve();
      act(() => {
        next = result.current.fetchNextPage();
        refetch = result.current.refetch();
      });
      await waitFor(() => expect(calls).toHaveLength(1));

      act(() => result.current.abort());
      gate.resolve();

      await expect(next).resolves.toBeNull();
      await expect(refetch).resolves.toBeNull();
      await sleep(20);
      expect(calls).toHaveLength(1);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.pageParams).toEqual([1]);
    });

    it("should skip the next page when a refetch ended the list in the meantime", async () => {
      const { result } = await renderPosts();
      const gate = createDeferred();
      resetCalls();
      mockList("/posts", async () => {
        await gate.promise;
        return [];
      });

      let refetch: Promise<unknown> = Promise.resolve();
      let next: Promise<unknown> = Promise.resolve();
      act(() => {
        refetch = result.current.refetch();
        next = result.current.fetchNextPage();
      });
      await waitFor(() => expect(calls).toHaveLength(1));

      gate.resolve();
      await act(async () => {
        await refetch;
      });

      await expect(next).resolves.toBeNull();
      expect(calls).toHaveLength(1);
      expect(result.current.hasNextPage).toBe(false);
    });

    it("should skip the previous page when a refetch removed it in the meantime", async () => {
      mockFeed();
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed().setQueryParams({ cursor: "2" }), {
          pagination: feedPagination,
          dependencyTracking: false,
        }),
      );
      await waitFor(() => expect(result.current.hasPreviousPage).toBe(true));
      const gate = createDeferred();
      resetCalls();
      mockList("/feed", async () => {
        await gate.promise;
        return { data: pageItems(2), next: null, previous: null };
      });

      let refetch: Promise<unknown> = Promise.resolve();
      let previous: Promise<unknown> = Promise.resolve();
      act(() => {
        refetch = result.current.refetch();
        previous = result.current.fetchPreviousPage();
      });
      await waitFor(() => expect(calls).toHaveLength(1));

      gate.resolve();
      await act(async () => {
        await refetch;
      });

      await expect(previous).resolves.toBeNull();
      expect(calls).toHaveLength(1);
      expect(result.current.hasPreviousPage).toBe(false);
    });

    it("should run fetches in the order they were asked for", async () => {
      const { result } = await renderPosts();
      resetCalls();

      await act(async () => {
        await Promise.all([result.current.fetchNextPage(), result.current.fetchPreviousPage()]);
      });

      expect(calls.map((call) => call.query.page)).toEqual(["2"]);
      expect(result.current.pageParams).toEqual([1, 2]);
    });
  });

  describe("cancelling", () => {
    it("should keep the list when the previous page is aborted", async () => {
      mockFeed();
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed().setQueryParams({ cursor: "2" }), {
          pagination: feedPagination,
          dependencyTracking: false,
        }),
      );
      await waitFor(() => expect(result.current.hasPreviousPage).toBe(true));
      const gate = createDeferred();
      mockList("/feed", async () => {
        await gate.promise;
        return { data: pageItems(1), next: "2", previous: null };
      });

      let previous: Promise<unknown> = Promise.resolve();
      act(() => {
        previous = result.current.fetchPreviousPage();
      });
      expect(result.current.isFetchingPreviousPage).toBe(true);

      act(() => result.current.abort());
      gate.resolve();

      await expect(previous).resolves.toBeNull();
      expect(ids(result.current.items)).toEqual([3, 4]);
      expect(result.current.isFetchPreviousPageError).toBe(false);
    });

    it("should keep the list when every page of a refetch is cancelled from the outside", async () => {
      const { result } = await renderPosts();
      const gate = createDeferred();
      mockList("/posts", async () => {
        await gate.promise;
        return [{ id: 99 }];
      });

      let refetch: Promise<unknown> = Promise.resolve();
      act(() => {
        refetch = result.current.refetch();
      });
      await waitFor(() => expect(result.current.isRefetching).toBe(true));
      await sleep(10);

      act(() => {
        createPosts().setQueryParams({ page: 1 }).abort();
      });
      await act(async () => {
        await refetch;
      });
      gate.resolve();

      expect(ids(result.current.items)).toEqual([1, 2]);
      expect(result.current.error).toBeNull();
      expect(result.current.isRefetching).toBe(false);
    });

    it("should keep the list when a cursor refetch is aborted", async () => {
      mockFeed();
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: feedPagination, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      const gate = createDeferred();
      mockList("/feed", async () => {
        await gate.promise;
        return { data: [{ id: 99 }], next: null };
      });

      let refetch: Promise<unknown> = Promise.resolve();
      act(() => {
        refetch = result.current.refetch();
      });
      act(() => result.current.abort());
      gate.resolve();

      await expect(refetch).resolves.toBeNull();
      expect(ids(result.current.items)).toEqual([1, 2]);
    });

    it("should load the first page again after aborting it", async () => {
      const gate = createDeferred();
      mockList("/posts", async () => {
        await gate.promise;
        return pageItems(1);
      });
      const { result } = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));

      act(() => result.current.abort());
      gate.resolve();

      expect(result.current.loading).toBe(false);
      expect(result.current.isFetching).toBe(false);

      mockList("/posts", ({ query }) => pageItems(Number(query.page)));
      await act(() => result.current.refetch());

      expect(ids(result.current.items)).toEqual([1, 2]);
    });
  });

  describe("failures in a direction", () => {
    it("should report a failed previous page and clear it on the next attempt", async () => {
      mockFeed();
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed().setQueryParams({ cursor: "2" }), {
          pagination: feedPagination,
          dependencyTracking: false,
        }),
      );
      await waitFor(() => expect(result.current.hasPreviousPage).toBe(true));

      mockList("/feed", () => failure());
      await act(() => result.current.fetchPreviousPage());

      expect(result.current.isFetchPreviousPageError).toBe(true);
      expect(result.current.isFetchNextPageError).toBe(false);
      expect(ids(result.current.items)).toEqual([3, 4]);

      mockFeed();
      await act(() => result.current.fetchPreviousPage());

      expect(result.current.isFetchPreviousPageError).toBe(false);
      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
    });

    it("should clear direction errors on reset", async () => {
      const { result } = await renderPosts();
      mockList("/posts", () => failure());
      await act(() => result.current.fetchNextPage());
      expect(result.current.isFetchNextPageError).toBe(true);

      mockList("/posts", ({ query }) => pageItems(Number(query.page)));
      await act(() => result.current.reset());

      expect(result.current.isFetchNextPageError).toBe(false);
    });
  });

  describe("response mappers", () => {
    const mapped = () =>
      createPosts().setResponseMapper(((response: any) => ({
        ...response,
        data: response.data?.map((post: Post) => ({ ...post, version: 7 })) ?? null,
      })) as any) as unknown as ReturnType<typeof createPosts>;

    it("should show mapped pages after fetching and after restoring", async () => {
      const first = renderHook(() => useInfiniteFetch(mapped(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      expect(first.result.current.items[0].version).toBe(7);
      first.unmount();
      resetCalls();

      const second = renderHook(() => useInfiniteFetch(mapped(), { pagination, dependencyTracking: false }));

      expect(second.result.current.items[0].version).toBe(7);
      await sleep(20);
      expect(calls).toHaveLength(0);
    });

    it("should map cache changes of a loaded page", async () => {
      const { result } = renderHook(() => useInfiniteFetch(mapped(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      act(() => {
        client.cache.update(createPosts().setQueryParams({ page: 1 }), () => ({ data: [{ id: 50 }] }));
      });

      expect(result.current.items).toEqual([{ id: 50, version: 7 }]);
    });

    it("should fetch again when an asynchronous mapper cannot be read from the cache", async () => {
      const asynchronous = () =>
        createPosts().setResponseMapper((async (response: any) => ({
          ...response,
          data: response.data?.map((post: Post) => ({ ...post, version: 8 })) ?? null,
        })) as any) as unknown as ReturnType<typeof createPosts>;
      const first = renderHook(() => useInfiniteFetch(asynchronous(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      expect(first.result.current.items[0].version).toBe(8);
      first.unmount();
      resetCalls();

      const second = renderHook(() => useInfiniteFetch(asynchronous(), { pagination, dependencyTracking: false }));

      expect(second.result.current.loading).toBe(true);
      await waitFor(() => expect(second.result.current.items).toHaveLength(2));
      expect(calls).toHaveLength(1);
    });
  });

  describe("requests without cache", () => {
    const uncached = () => createPosts().setCache(false);

    it("should show the responses and fetch them again after remounting", async () => {
      const first = renderHook(() => useInfiniteFetch(uncached(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      await act(() => first.result.current.fetchNextPage());

      expect(ids(first.result.current.items)).toEqual([1, 2, 3, 4]);
      expect(client.cache.keys()).toHaveLength(0);
      first.unmount();
      resetCalls();

      const second = renderHook(() => useInfiniteFetch(uncached(), { pagination, dependencyTracking: false }));

      expect(second.result.current.items).toEqual([]);
      await waitFor(() => expect(second.result.current.items).toHaveLength(2));
      expect(calls).toHaveLength(1);
    });

    it("should not refetch a page it keeps in memory only because the cache is empty", async () => {
      const { result } = renderHook(() => useInfiniteFetch(uncached(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      resetCalls();

      await sleep(30);

      expect(calls).toHaveLength(0);
    });
  });

  describe("cache changing around mounting", () => {
    const response = (data: Post[]) =>
      ({
        data,
        error: null,
        status: 200,
        success: true,
        extra: {},
        requestTimestamp: Date.now(),
        responseTimestamp: Date.now(),
      }) as any;

    it("should keep a rendered page when its cache entry disappears before mounting", () => {
      client.cache.set(createPosts().setQueryParams({ page: 1 }), response(pageItems(1)));

      const { result } = renderHook(() => {
        useLayoutEffect(() => {
          client.cache.delete(createPosts().setQueryParams({ page: 1 }).cacheKey);
        }, []);
        return useInfiniteFetch(createPosts(), { pagination, disabled: true, dependencyTracking: false });
      });

      expect(ids(result.current.items)).toEqual([1, 2]);
    });

    it("should show a value written to a rendered page before mounting", () => {
      client.cache.set(createPosts().setQueryParams({ page: 1 }), response(pageItems(1)));

      const { result } = renderHook(() => {
        useLayoutEffect(() => {
          client.cache.set(createPosts().setQueryParams({ page: 1 }), response([{ id: 70 }]));
        }, []);
        return useInfiniteFetch(createPosts(), { pagination, disabled: true, dependencyTracking: false });
      });

      expect(ids(result.current.items)).toEqual([70]);
    });

    it("should ignore failed cache events of loaded pages", async () => {
      const { result } = await renderPosts();

      act(() => {
        client.cache.events.emitCacheData({
          ...createPosts().setQueryParams({ page: 1 }).read(),
          cacheKey: createPosts().setQueryParams({ page: 1 }).cacheKey,
          scope: null,
          success: false,
          data: [{ id: 5 }],
        } as any);
      });

      expect(ids(result.current.items)).toEqual([1, 2]);
    });

    it("should not refetch after unmounting right after an invalidation", async () => {
      const { unmount } = await renderPosts();
      resetCalls();

      act(() => {
        client.cache.invalidate(createPosts().setQueryParams({ page: 1 }));
        unmount();
      });

      await sleep(30);
      expect(calls).toHaveLength(0);
    });

    it("should stop listening to the cache after unmounting", async () => {
      const { result, unmount } = await renderPosts();
      const { items } = result.current;
      unmount();

      client.cache.update(createPosts().setQueryParams({ page: 1 }), () => ({ data: [{ id: 80 }] }));

      expect(result.current.items).toBe(items);
    });
  });

  describe("pagination callbacks that throw", () => {
    const throwingNext = () => ({
      cursor: "cursor",
      items: "data",
      next: ({ data }: { data: Feed }) => {
        if (data.next === "broken") {
          throw new Error("Broken cursor");
        }
        return data.next;
      },
    });

    it("should report the error and keep the list valid", async () => {
      mockList("/feed", ({ query }) => {
        return query.cursor ? { data: [{ id: 2 }], next: "broken" } : { data: [{ id: 1 }], next: "second" };
      });
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: throwingNext() as any, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      await act(() => result.current.fetchNextPage());

      expect(result.current.error).toEqual(new Error("Broken cursor"));
      expect(result.current.success).toBe(false);
      expect(ids(result.current.items as Post[])).toEqual([1]);
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    it("should keep working after the error", async () => {
      mockList("/feed", ({ query }) => {
        return query.cursor ? { data: [{ id: 2 }], next: "broken" } : { data: [{ id: 1 }], next: "second" };
      });
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: throwingNext() as any, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));
      await act(() => result.current.fetchNextPage());

      mockList("/feed", ({ query }) => {
        return query.cursor ? { data: [{ id: 2 }], next: null } : { data: [{ id: 1 }], next: "second" };
      });
      await act(() => result.current.fetchNextPage());

      expect(ids(result.current.items as Post[])).toEqual([1, 2]);
    });

    it("should report the error of a cursor refetch and keep the old pages", async () => {
      mockList("/feed", () => ({ data: [{ id: 1 }], next: null }));
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: throwingNext() as any, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      mockList("/feed", () => ({ data: [{ id: 9 }], next: "broken" }));
      await act(() => result.current.refetch());

      expect(result.current.error).toEqual(new Error("Broken cursor"));
      expect(ids(result.current.items as Post[])).toEqual([1]);
      expect(result.current.isRefetching).toBe(false);
    });

    it("should reject a cache update the callbacks cannot read", async () => {
      mockList("/feed", () => ({ data: [{ id: 1 }], next: null }));
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: throwingNext() as any, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => {
        client.cache.update(createFeed(), () => ({ data: { data: [{ id: 2 }], next: "broken" } }));
      });

      expect(result.current.error).toEqual(new Error("Broken cursor"));
      expect(ids(result.current.items as Post[])).toEqual([1]);
    });
  });

  describe("options", () => {
    it("should bounce new lists with the throttle strategy", async () => {
      const { result, rerender } = renderHook(
        ({ search }) =>
          useInfiniteFetch(createPosts().setQueryParams({ search }), {
            pagination,
            bounce: true,
            bounceType: "throttle",
            bounceTime: 20,
            dependencyTracking: false,
          }),
        { initialProps: { search: "a" } },
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      resetCalls();

      rerender({ search: "b" });

      await waitFor(() => expect(calls.at(-1)?.query.search).toBe("b"));
      expect(result.current.bounce.reset).toBeFunction();
    });

    it("should not refresh a blurred tab with refetchBlurred turned off", async () => {
      await renderPosts({ refresh: true, refreshTime: 10, refetchBlurred: false });
      act(() => client.appManager.setFocused(false));
      await sleep(30);
      resetCalls();

      await sleep(50);

      expect(calls).toHaveLength(0);
    });

    it("should refresh a blurred tab by default", async () => {
      await renderPosts({ refresh: true, refreshTime: 10 });
      act(() => client.appManager.setFocused(false));
      resetCalls();

      await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    });

    it("should stop refreshing after unmounting", async () => {
      const { unmount } = await renderPosts({ refresh: true, refreshTime: 10 });
      unmount();
      await sleep(30);
      resetCalls();

      await sleep(50);

      expect(calls).toHaveLength(0);
    });

    it("should not refresh while disabled", async () => {
      renderHook(() =>
        useInfiniteFetch(createPosts(), {
          pagination,
          disabled: true,
          refresh: true,
          refreshTime: 10,
          dependencyTracking: false,
        }),
      );

      await sleep(50);

      expect(calls).toHaveLength(0);
    });

    it("should refetch on blur when asked to", async () => {
      await renderPosts({ refetchOnBlur: true });
      resetCalls();

      act(() => client.appManager.events.emitBlur());

      await waitFor(() => expect(calls).toHaveLength(1));
    });

    it("should not refetch on window events while disabled", async () => {
      renderHook(() =>
        useInfiniteFetch(createPosts(), {
          pagination,
          disabled: true,
          refetchOnFocus: true,
          dependencyTracking: false,
        }),
      );

      act(() => client.appManager.events.emitFocus());

      await sleep(30);
      expect(calls).toHaveLength(0);
    });

    it("should return a new selected value without structural sharing", async () => {
      const { result, rerender } = await renderPosts({
        select: ({ items }: { items: Post[] }) => items.map((item) => ({ ...item })),
        structuralSharing: false,
      });
      const { items } = result.current;

      rerender();

      expect(result.current.items).not.toBe(items);
      expect(result.current.items).toEqual(items);
    });

    it("should replace unchanged references without structural sharing", async () => {
      const { result } = await renderPosts({ structuralSharing: false });
      const { items } = result.current;

      await act(() => result.current.refetch());

      expect(result.current.items).not.toBe(items);
      expect(result.current.items).toEqual(items);
    });

    it("should apply a changed uniqueBy", async () => {
      mockList("/posts", () => [
        { id: 1, version: 1 },
        { id: 2, version: 1 },
      ]);
      const { result, rerender } = renderHook(
        ({ uniqueBy }: { uniqueBy: "id" | "version" }) =>
          useInfiniteFetch(createPosts(), { pagination, uniqueBy, dependencyTracking: false }),
        { initialProps: { uniqueBy: "id" as "id" | "version" } },
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      rerender({ uniqueBy: "version" });

      expect(result.current.items).toHaveLength(1);
    });

    it("should use the callbacks of the latest render", async () => {
      const first = vi.fn();
      const second = vi.fn();
      const { result, rerender } = renderHook(
        ({ callback }) => {
          const list = useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false });
          list.onSuccess(callback);
          return list;
        },
        { initialProps: { callback: first } },
      );
      await waitFor(() => expect(first).toHaveBeenCalledTimes(1));

      rerender({ callback: second });
      await act(() => result.current.fetchNextPage());

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe("shared stores", () => {
    it("should keep the list of a hook that stays after another one threw", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => null);
      mockList("/posts", () => failure());

      const Throwing = () => {
        const { items } = useInfiniteFetch(createPosts(), { pagination, throwOnError: true });
        return <div>throwing:{items.length}</div>;
      };
      const Staying = () => {
        const { error, refetch, items } = useInfiniteFetch(createPosts(), { pagination });
        return (
          <button type="button" onClick={() => refetch()}>
            staying:{error ? "failed" : items.length}
          </button>
        );
      };

      render(
        <>
          <Boundary>
            <Throwing />
          </Boundary>
          <Staying />
        </>,
      );

      await screen.findByText("boundary");
      await screen.findByText("staying:failed");
      await sleep(5);

      mockList("/posts", ({ query }) => pageItems(Number(query.page)));
      act(() => screen.getByRole("button").click());

      await screen.findByText("staying:2");
      consoleError.mockRestore();
    });

    it("should not fetch twice when a slow first page outlives the unused store check", async () => {
      const gate = createDeferred();
      mockList("/posts", async () => {
        await gate.promise;
        return pageItems(1);
      });
      const List = () => {
        // Without the cache, only the store that sent the request knows its response
        const { items } = useInfiniteFetch(createPosts().setCache(false), { pagination, suspense: true });
        return <div>items:{items.length}</div>;
      };

      render(
        <Suspense fallback="loading">
          <List />
        </Suspense>,
      );
      await sleep(1200);
      gate.resolve();

      await screen.findByText("items:2");
      expect(calls).toHaveLength(1);
    });

    it("should forget a list whose component never mounted", async () => {
      const List = () => {
        const { items } = useInfiniteFetch(createPosts(), { pagination, suspense: true });
        return <div>items:{items.length}</div>;
      };

      const view = render(
        <Suspense fallback="loading">
          <List />
        </Suspense>,
      );
      view.unmount();
      await waitFor(() => expect(client.cache.keys()).toHaveLength(1));
      await sleep(1100);
      await client.cache.clear();
      resetCalls();

      render(
        <Suspense fallback="loading">
          <List />
        </Suspense>,
      );

      await screen.findByText("items:2");
      expect(calls).toHaveLength(1);
    });

    it("should keep lists of different clients apart", async () => {
      const other = new Client({ url: baseUrl });
      const request = other.createRequest<{ response: Post[]; queryParams: { page?: number } }>()({
        endpoint: "/posts",
      });
      const { result } = await renderPosts();
      const second = renderHook(() => useInfiniteFetch(request, { pagination, dependencyTracking: false }));
      await waitFor(() => expect(second.result.current.items).toHaveLength(2));

      await act(() => result.current.fetchNextPage());

      expect(result.current.pageParams).toEqual([1, 2]);
      expect(second.result.current.pageParams).toEqual([1]);
    });

    it("should follow a change of the client", async () => {
      const other = new Client({ url: baseUrl });
      const create = (testClient: Client) =>
        testClient.createRequest<{ response: Post[]; queryParams: { page?: number } }>()({ endpoint: "/posts" });

      const { result, rerender } = renderHook(
        ({ testClient }) => useInfiniteFetch(create(testClient), { pagination, dependencyTracking: false }),
        { initialProps: { testClient: client } },
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      resetCalls();

      rerender({ testClient: other });

      await waitFor(() => expect(calls).toHaveLength(1));
      await waitFor(() => expect(other.cache.keys()).toHaveLength(1));
    });
  });
});
