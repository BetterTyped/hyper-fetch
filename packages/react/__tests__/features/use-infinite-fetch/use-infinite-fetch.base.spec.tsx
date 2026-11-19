import { Client } from "@hyper-fetch/core";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";
import React, { StrictMode } from "react";

import {
  baseUrl,
  createDeferred,
  createListServer,
  failure,
  pageItems,
  settleRequests,
} from "../../utils/use-infinite-fetch.utils";

const { startServer, stopServer, resetMocks, mockList, mockListPost, calls, resetCalls } = createListServer();

type Post = { id: number };

const ids = (items: Post[]) => items.map((item) => item.id);

describe("useInfiniteFetch [ Base ]", () => {
  let client: Client;

  const createPosts = () =>
    client.createRequest<{ response: Post[]; queryParams: { page?: number; limit?: number } }>()({
      endpoint: "/posts",
    });

  const createFeed = () =>
    client.createRequest<{
      response: { data: Post[]; nextCursor: string | null; previousCursor?: string | null };
      queryParams: { cursor?: string; topic?: string };
    }>()({ endpoint: "/feed" });

  const createUsers = () =>
    client.createRequest<{
      response: { users: Post[]; total: number };
      queryParams: { offset?: number; limit?: number };
    }>()({ endpoint: "/users" });

  const mockPosts = (lastPage = 3, size = 2) => {
    mockList("/posts", ({ query }) => {
      const page = Number(query.page);
      return page > lastPage ? [] : pageItems(page, size);
    });
  };

  const mockFeed = () => {
    mockList("/feed", ({ query }) => {
      const page = Number(query.cursor ?? 1);
      return {
        data: pageItems(page),
        nextCursor: page < 3 ? String(page + 1) : null,
        previousCursor: page > 1 ? String(page - 1) : null,
      };
    });
  };

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: baseUrl });
    resetCalls();
  });

  afterEach(async () => {
    await settleRequests(client);
    resetMocks();
  });

  describe("page numbers", () => {
    it("should start from the first page and glue the next ones together", async () => {
      mockPosts();
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );

      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(ids(result.current.items)).toEqual([1, 2]));
      expect(result.current.loading).toBe(false);
      expect(calls.map((call) => call.query.page)).toEqual(["1"]);

      await act(() => result.current.fetchNextPage());

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.pages).toHaveLength(2);
      expect(result.current.pageParams).toEqual([1, 2]);
      expect(calls.map((call) => call.query.page)).toEqual(["1", "2"]);
    });

    it("should finish on an empty page when the page size is unknown", async () => {
      mockPosts(1);
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );

      await waitFor(() => expect(result.current.items).toHaveLength(2));
      expect(result.current.hasNextPage).toBe(true);

      await act(() => result.current.fetchNextPage());

      expect(result.current.hasNextPage).toBe(false);
      expect(ids(result.current.items)).toEqual([1, 2]);
    });

    it("should finish on a page shorter than the limit without another request", async () => {
      mockList("/posts", () => [{ id: 1 }]);
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts().setQueryParams({ limit: 2 }), {
          pagination: { page: "page", limit: "limit" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.items).toHaveLength(1));

      expect(result.current.hasNextPage).toBe(false);
      await act(() => result.current.fetchNextPage());
      expect(calls).toHaveLength(1);
    });

    it("should start from the page set on the request and go back from it", async () => {
      mockPosts(9);
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts().setQueryParams({ page: 3 }), {
          pagination: { page: "page" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(ids(result.current.items)).toEqual([5, 6]));
      expect(result.current.hasPreviousPage).toBe(true);

      await act(() => result.current.fetchPreviousPage());
      expect(ids(result.current.items)).toEqual([3, 4, 5, 6]);

      await act(() => result.current.fetchPreviousPage());
      expect(ids(result.current.items)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(result.current.hasPreviousPage).toBe(false);
    });

    it("should treat a list starting at zero as numbered from zero", async () => {
      mockList("/posts", () => [{ id: 1 }]);
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts().setQueryParams({ page: 0 }), {
          pagination: { page: "page" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.items).toHaveLength(1));

      expect(calls[0].query.page).toBe("0");
      expect(result.current.hasPreviousPage).toBe(false);
    });

    it("should use the hasNext override", async () => {
      mockPosts();
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), {
          pagination: { page: "page", hasNext: ({ param }) => Number(param) < 2 },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.hasNextPage).toBe(true));
      await act(() => result.current.fetchNextPage());

      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe("offsets", () => {
    it("should move by the limit and stop at the total", async () => {
      mockList("/users", ({ query }) => {
        const offset = Number(query.offset);
        return { users: [{ id: offset + 1 }, { id: offset + 2 }], total: 4 };
      });
      const { result } = renderHook(() =>
        useInfiniteFetch(createUsers().setQueryParams({ limit: 2 }), {
          pagination: { offset: "offset", limit: "limit", items: "users", total: "total" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(ids(result.current.items)).toEqual([1, 2]));
      expect(result.current.total).toBe(4);
      expect(result.current.hasNextPage).toBe(true);

      await act(() => result.current.fetchNextPage());

      expect(calls.map((call) => call.query.offset)).toEqual(["0", "2"]);
      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.hasNextPage).toBe(false);
    });

    it("should go back by the limit without passing zero", async () => {
      mockList("/users", ({ query }) => ({ users: [{ id: Number(query.offset) }], total: 100 }));
      const { result } = renderHook(() =>
        useInfiniteFetch(createUsers().setQueryParams({ offset: 1, limit: 2 }), {
          pagination: { offset: "offset", limit: "limit", items: "users", total: "total" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.hasPreviousPage).toBe(true));
      await act(() => result.current.fetchPreviousPage());

      expect(calls[1].query.offset).toBe("0");
      expect(result.current.hasPreviousPage).toBe(false);
    });
  });

  describe("cursors", () => {
    it("should follow the cursor named by a response field", async () => {
      mockFeed();
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed().setQueryParams({ topic: "a" }), {
          pagination: { cursor: "cursor", next: "nextCursor", items: "data" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(ids(result.current.items)).toEqual([1, 2]));
      expect(calls[0].query).toEqual({ topic: "a" });

      await act(() => result.current.fetchNextPage());
      await act(() => result.current.fetchNextPage());

      expect(calls.map((call) => call.query.cursor)).toEqual([undefined, "2", "3"]);
      expect(ids(result.current.items)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(result.current.hasNextPage).toBe(false);
    });

    it("should accept functions for the cursor, items and total", async () => {
      mockFeed();
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), {
          pagination: {
            cursor: "cursor",
            next: ({ data }) => data.nextCursor,
            items: ({ data }) => data.data.filter((post) => post.id % 2 === 0),
            total: ({ pages }) => pages.length * 10,
          },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(ids(result.current.items)).toEqual([2]));
      expect(result.current.total).toBe(10);
    });

    it("should page backwards with the previous cursor", async () => {
      mockFeed();
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed().setQueryParams({ cursor: "2" }), {
          pagination: { cursor: "cursor", next: "nextCursor", previous: "previousCursor", items: "data" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.hasPreviousPage).toBe(true));
      await act(() => result.current.fetchPreviousPage());

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.hasPreviousPage).toBe(false);
    });
  });

  describe("paging outside of the query params", () => {
    it("should page through URL params", async () => {
      mockList("/archive/:page", ({ path }) => [{ id: Number(path.split("/").pop()) }]);
      const request = client.createRequest<{ response: Post[] }>()({ endpoint: "/archive/:page" });

      const { result } = renderHook(() =>
        useInfiniteFetch(request.setParams({ page: 1 }), {
          pagination: { page: "page", in: "params" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(ids(result.current.items)).toEqual([1]));
      await act(() => result.current.fetchNextPage());

      expect(calls.map((call) => call.path)).toEqual(["/archive/1", "/archive/2"]);
      expect(ids(result.current.items)).toEqual([1, 2]);
    });

    it("should keep pages paged through the payload apart in the cache", async () => {
      mockListPost("/search", ({ body }) => [{ id: body.page }]);
      const request = client.createRequest<{ response: Post[]; payload: { page: number } }>()({
        endpoint: "/search",
        method: "POST",
      });

      const { result } = renderHook(() =>
        useInfiniteFetch(request.setPayload({ page: 1 }), {
          pagination: { page: "page", in: "payload" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(ids(result.current.items)).toEqual([1]));
      await act(() => result.current.fetchNextPage());

      expect(calls.map((call) => call.body.page)).toEqual([1, 2]);
      expect(ids(result.current.items)).toEqual([1, 2]);
      expect(client.cache.keys()).toHaveLength(2);
    });

    it("should keep pages of a request with a custom cache key apart", async () => {
      mockPosts();
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts().setCacheKey("posts"), {
          pagination: { page: "page" },
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.items).toHaveLength(2));
      await act(() => result.current.fetchNextPage());

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(client.cache.keys()).toHaveLength(2);
    });
  });

  describe("list options", () => {
    it("should keep only maxPages going forwards", async () => {
      mockPosts(9);
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, maxPages: 2, dependencyTracking: false }),
      );

      await waitFor(() => expect(result.current.items).toHaveLength(2));
      await act(() => result.current.fetchNextPage());
      await act(() => result.current.fetchNextPage());

      expect(result.current.pageParams).toEqual([2, 3]);
      expect(result.current.hasPreviousPage).toBe(true);
    });

    it("should keep only maxPages going backwards", async () => {
      mockPosts(9);
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts().setQueryParams({ page: 5 }), {
          pagination: { page: "page" },
          maxPages: 2,
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.items).toHaveLength(2));
      await act(() => result.current.fetchPreviousPage());
      await act(() => result.current.fetchPreviousPage());

      expect(result.current.pageParams).toEqual([3, 4]);
      expect(result.current.hasNextPage).toBe(true);
    });

    it("should go back to cursor pages dropped by maxPages without a previous cursor", async () => {
      mockFeed();
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), {
          pagination: { cursor: "cursor", next: "nextCursor", items: "data" },
          maxPages: 1,
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.items).toHaveLength(2));
      expect(result.current.hasPreviousPage).toBe(false);

      await act(() => result.current.fetchNextPage());
      expect(ids(result.current.items)).toEqual([3, 4]);
      expect(result.current.hasPreviousPage).toBe(true);

      await act(() => result.current.fetchPreviousPage());
      expect(ids(result.current.items)).toEqual([1, 2]);
    });

    it("should drop repeated items by a field and by a function", async () => {
      mockList("/posts", ({ query }) => (query.page === "1" ? [{ id: 1 }, { id: 2 }] : [{ id: 2 }, { id: 3 }]));

      const byField = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, uniqueBy: "id", dependencyTracking: false }),
      );
      await waitFor(() => expect(byField.result.current.items).toHaveLength(2));
      await act(() => byField.result.current.fetchNextPage());
      expect(ids(byField.result.current.items)).toEqual([1, 2, 3]);

      const byFunction = renderHook(() =>
        useInfiniteFetch(createPosts(), {
          pagination: { page: "page" },
          uniqueBy: ({ item }) => item.id,
          dependencyTracking: false,
        }),
      );
      expect(ids(byFunction.result.current.items)).toEqual([1, 2, 3]);
    });

    it("should transform the list with select", async () => {
      mockPosts();
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), {
          pagination: { page: "page" },
          select: ({ items, pages }) => ({ count: items.length, pages: pages.length }),
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.items).toEqual({ count: 2, pages: 1 }));
    });

    it("should keep the selected reference when the result did not change", async () => {
      mockPosts();
      const { result, rerender } = renderHook(() =>
        useInfiniteFetch(createPosts(), {
          pagination: { page: "page" },
          select: ({ items }) => items.map((item) => ({ ...item })),
          dependencyTracking: false,
        }),
      );

      await waitFor(() => expect(result.current.items).toHaveLength(2));
      const { items } = result.current;
      rerender();

      expect(result.current.items).toBe(items);
    });

    it("should throw a clear error without the pagination", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => null);

      expect(() => renderHook(() => useInfiniteFetch(createPosts(), {} as any))).toThrow('"pagination" option');

      spy.mockRestore();
    });
  });

  describe("fetching", () => {
    it("should share one request between calls made while a page loads", async () => {
      mockPosts();
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      let first: Promise<unknown> = Promise.resolve();
      let second: Promise<unknown> = Promise.resolve();
      act(() => {
        first = result.current.fetchNextPage();
        second = result.current.fetchNextPage();
      });

      expect(first).toBe(second);
      expect(result.current.isFetchingNextPage).toBe(true);
      await act(async () => {
        await first;
      });

      expect(calls.filter((call) => call.query.page === "2")).toHaveLength(1);
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    it("should keep the list and report the direction of a failed page", async () => {
      mockList("/posts", ({ query }) => (query.page === "2" ? failure() : pageItems(Number(query.page))));
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      await act(() => result.current.fetchNextPage());

      expect(result.current.isFetchNextPageError).toBe(true);
      expect(result.current.isFetchPreviousPageError).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(ids(result.current.items)).toEqual([1, 2]);
      expect(result.current.hasNextPage).toBe(true);

      mockPosts();
      await act(() => result.current.fetchNextPage());

      expect(result.current.isFetchNextPageError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
    });

    it("should report a failed first page and retry it on refetch", async () => {
      mockList("/posts", () => failure());
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );

      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect(result.current.loading).toBe(false);
      expect(result.current.items).toEqual([]);
      expect(result.current.hasNextPage).toBe(false);

      mockPosts();
      await act(() => result.current.refetch());

      expect(result.current.error).toBeNull();
      expect(ids(result.current.items)).toEqual([1, 2]);
    });

    it("should not fetch while disabled", async () => {
      mockPosts();
      const { result, rerender } = renderHook(
        ({ disabled }) =>
          useInfiniteFetch(createPosts(), { pagination: { page: "page" }, disabled, dependencyTracking: false }),
        { initialProps: { disabled: true } },
      );

      expect(result.current.loading).toBe(false);
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });
      expect(calls).toHaveLength(0);

      rerender({ disabled: false });

      await waitFor(() => expect(result.current.items).toHaveLength(2));
    });

    it("should send one request in StrictMode", async () => {
      mockPosts();
      const { result } = renderHook(
        () => useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
        { wrapper: StrictMode },
      );

      await waitFor(() => expect(result.current.items).toHaveLength(2));

      expect(calls).toHaveLength(1);
    });

    it("should cancel the pages being fetched with abort", async () => {
      const gate = createDeferred();
      mockList("/posts", async ({ query }) => {
        if (query.page === "2") {
          await gate.promise;
        }
        return pageItems(Number(query.page));
      });
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current.fetchNextPage();
      });
      await waitFor(() => expect(calls).toHaveLength(2));

      act(() => result.current.abort());
      expect(result.current.isFetchingNextPage).toBe(false);

      await expect(pending).resolves.toBeNull();
      gate.resolve();

      expect(ids(result.current.items)).toEqual([1, 2]);
      expect(result.current.error).toBeNull();
    });

    it("should keep working after unmounting mid-fetch", async () => {
      const gate = createDeferred();
      mockList("/posts", async () => {
        await gate.promise;
        return pageItems(1);
      });
      const spy = vi.spyOn(console, "error");
      const { unmount } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );

      await waitFor(() => expect(calls).toHaveLength(1));
      unmount();
      gate.resolve();

      await waitFor(() => expect(client.cache.keys()).toHaveLength(1));
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("should report every page through the callbacks", async () => {
      mockList("/posts", ({ query }) => (query.page === "2" ? failure() : pageItems(1)));
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onFinished = vi.fn();

      const { result } = renderHook(() => {
        const list = useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false });
        list.onSuccess(onSuccess);
        list.onError(onError);
        list.onFinished(onFinished);
        return list;
      });

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(onSuccess.mock.calls[0][0].param).toBe(1);

      await act(() => result.current.fetchNextPage());

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0].param).toBe(2);
      expect(onFinished).toHaveBeenCalledTimes(2);
    });
  });

  describe("shared data", () => {
    it("should keep two hooks on one list in sync with one request per page", async () => {
      mockPosts();
      const pagination = { page: "page" } as const;
      const { result } = renderHook(() => ({
        first: useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }),
        second: useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }),
      }));

      await waitFor(() => expect(result.current.second.items).toHaveLength(2));
      await act(() => result.current.first.fetchNextPage());

      expect(ids(result.current.second.items)).toEqual([1, 2, 3, 4]);
      expect(calls).toHaveLength(2);
    });

    it("should share the page cache with a plain useFetch", async () => {
      mockPosts();
      const list = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );
      await waitFor(() => expect(list.result.current.items).toHaveLength(2));

      const single = renderHook(() =>
        useFetch(createPosts().setQueryParams({ page: 1 }), { revalidate: false, dependencyTracking: false }),
      );

      expect(single.result.current.data).toEqual(pageItems(1));
      expect(calls).toHaveLength(1);
    });

    it("should reuse a page already being fetched by another hook", async () => {
      const gate = createDeferred();
      mockList("/posts", async () => {
        await gate.promise;
        return pageItems(1);
      });
      // Without the deduplication of the dispatcher, joining the running request is up to the hook
      const request = createPosts().setDeduplicate(false);
      renderHook(() => useFetch(request.setQueryParams({ page: 1 })));
      await waitFor(() => expect(calls).toHaveLength(1));

      const { result } = renderHook(() =>
        useInfiniteFetch(request, { pagination: { page: "page" }, dependencyTracking: false }),
      );
      gate.resolve();

      await waitFor(() => expect(result.current.items).toHaveLength(2));
      expect(calls).toHaveLength(1);
    });

    it("should update a loaded page in place when its cache changes", async () => {
      mockPosts();
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      await act(() => result.current.fetchNextPage());

      const untouched = result.current.items[0];

      act(() => {
        client.cache.update(createPosts().setQueryParams({ page: 2 }), (previous) => ({
          data: previous?.data?.map((post) => ({ ...post, id: post.id * 10 })),
        }));
      });

      expect(ids(result.current.items)).toEqual([1, 2, 30, 40]);
      expect(result.current.items[0]).toBe(untouched);
      expect(calls).toHaveLength(2);
    });

    it("should keep references of unchanged items after a refetch", async () => {
      mockPosts();
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      const { items, pages } = result.current;

      await act(() => result.current.refetch());

      expect(result.current.items).toBe(items);
      expect(result.current.pages).toBe(pages);
    });

    it("should not mix up scopes of the same list", async () => {
      mockPosts();
      const pagination = { page: "page" } as const;
      const { result } = renderHook(() => ({
        a: useInfiniteFetch(createPosts().setScope("a"), { pagination, dependencyTracking: false }),
        b: useInfiniteFetch(createPosts().setScope("b"), { pagination, dependencyTracking: false }),
      }));
      await waitFor(() => expect(result.current.a.items).toHaveLength(2));
      await waitFor(() => expect(result.current.b.items).toHaveLength(2));

      act(() => {
        client.cache.update(createPosts().setQueryParams({ page: 1 }).setScope("a"), () => ({ data: [{ id: 99 }] }));
      });

      expect(ids(result.current.a.items)).toEqual([99]);
      expect(ids(result.current.b.items)).toEqual([1, 2]);
    });
  });

  describe("rendering", () => {
    it("should rerender only for the values used by the component", async () => {
      mockPosts();
      let renders = 0;

      const Component = () => {
        renders += 1;
        const { items, fetchNextPage } = useInfiniteFetch(createPosts(), { pagination: { page: "page" } });
        return (
          <button type="button" onClick={() => fetchNextPage()}>
            {items.length}
          </button>
        );
      };

      render(<Component />);
      await screen.findByText("2");
      const rendersAfterLoad = renders;

      act(() => screen.getByRole("button").click());
      await screen.findByText("4");

      // Only the arrival of new items matters, the fetching flags are not read
      expect(renders).toBe(rendersAfterLoad + 1);
    });
  });
});
