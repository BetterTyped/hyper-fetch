import { Client } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";

import {
  baseUrl,
  createDeferred,
  createListServer,
  pageItems,
  settleRequests,
} from "../../utils/use-infinite-fetch.utils";

const { startServer, stopServer, resetMocks, mockList, calls, resetCalls } = createListServer();

type Post = { id: number; search?: string };
type Query = { page?: number; limit?: number; search?: string; sort?: string };

const ids = (items: Post[]) => items.map((item) => item.id);

describe("useInfiniteFetch [ Start over ]", () => {
  let client: Client;

  const createPosts = () => client.createRequest<{ response: Post[]; queryParams: Query }>()({ endpoint: "/posts" });

  const mockPosts = () => {
    mockList("/posts", ({ query }) => {
      return pageItems(Number(query.page)).map((post) => ({ ...post, search: query.search }));
    });
  };

  const renderList = (initialQuery: Query, options: Record<string, unknown> = {}) => {
    return renderHook(
      ({ query }: { query: Query }) =>
        useInfiniteFetch(createPosts().setQueryParams(query), {
          pagination: { page: "page", limit: "limit" },
          dependencyTracking: false,
          ...options,
        }),
      { initialProps: { query: initialQuery } },
    );
  };

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: baseUrl });
    resetCalls();
    mockPosts();
  });

  afterEach(async () => {
    await settleRequests(client);
    resetMocks();
  });

  it.each<[string, Query, Query]>([
    ["a filter", { search: "a" }, { search: "b" }],
    ["the sort", { sort: "asc" }, { sort: "desc" }],
    ["the page size", { limit: 2 }, { limit: 3 }],
  ])("should start a new list when %s changes", async (_name, before, after) => {
    const { result, rerender } = renderList(before);
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await act(() => result.current.fetchNextPage());
    expect(result.current.pageParams).toEqual([1, 2]);
    resetCalls();

    rerender({ query: after });

    await waitFor(() => expect(result.current.isPreviousData).toBe(false));
    await waitFor(() => expect(result.current.pageParams).toEqual([1]));
    expect(calls).toHaveLength(1);
    expect(calls[0].query.page).toBe("1");
  });

  it("should start a new list when a URL param changes", async () => {
    mockList("/users/:userId/posts", ({ path }) => [{ id: Number(path.split("/")[2]) }]);
    const request = client.createRequest<{ response: Post[]; queryParams: { page?: number } }>()({
      endpoint: "/users/:userId/posts",
    });

    const { result, rerender } = renderHook(
      ({ userId }) =>
        useInfiniteFetch(request.setParams({ userId }), { pagination: { page: "page" }, dependencyTracking: false }),
      { initialProps: { userId: 1 } },
    );
    await waitFor(() => expect(ids(result.current.items)).toEqual([1]));

    rerender({ userId: 2 });

    // Another resource - the list of the previous user is not shown in the meantime
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(ids(result.current.items)).toEqual([2]));
  });

  it("should start at the new page when the parent changes the paging field", async () => {
    const { result, rerender } = renderList({ page: 5 });
    await waitFor(() => expect(result.current.pageParams).toEqual([5]));

    rerender({ query: { page: 9 } });

    await waitFor(() => expect(result.current.pageParams).toEqual([9]));
    expect(calls.map((call) => call.query.page)).toEqual(["5", "9"]);
  });

  it("should restore every page of a filter used before without requests", async () => {
    const { result, rerender } = renderList({ search: "a" });
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await act(() => result.current.fetchNextPage());

    rerender({ query: { search: "b" } });
    await waitFor(() => expect(result.current.items[0]?.search).toBe("b"));
    resetCalls();

    rerender({ query: { search: "a" } });

    expect(result.current.pageParams).toEqual([1, 2]);
    expect(result.current.items.map((item) => item.search)).toEqual(["a", "a", "a", "a"]);
    expect(result.current.isPreviousData).toBe(false);
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
    expect(calls).toHaveLength(0);
  });

  it("should refresh a restored filter once its pages are stale", async () => {
    const request = createPosts().setStaleTime(0);
    const { result, rerender } = renderHook(
      ({ search }) =>
        useInfiniteFetch(request.setQueryParams({ search }), {
          pagination: { page: "page" },
          dependencyTracking: false,
        }),
      { initialProps: { search: "a" } },
    );
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    rerender({ search: "b" });
    await waitFor(() => expect(result.current.items[0]?.search).toBe("b"));
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
    resetCalls();

    rerender({ search: "a" });

    expect(result.current.items[0]?.search).toBe("a");
    await waitFor(() => expect(calls).toHaveLength(1));
  });

  it("should drop to the starting page on reset and fetch it again", async () => {
    const onReset = vi.fn();
    const { result } = renderHook(() => {
      const list = useInfiniteFetch(createPosts(), { pagination: { page: "page" }, dependencyTracking: false });
      list.onReset(onReset);
      return list;
    });
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await act(() => result.current.fetchNextPage());
    resetCalls();

    await act(() => result.current.reset());

    expect(result.current.pageParams).toEqual([1]);
    expect(calls.map((call) => call.query.page)).toEqual(["1"]);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("should report a new list through onReset", async () => {
    const onReset = vi.fn();
    const { result, rerender } = renderHook(
      ({ search }) => {
        const list = useInfiniteFetch(createPosts().setQueryParams({ search }), {
          pagination: { page: "page" },
          dependencyTracking: false,
        });
        list.onReset(onReset);
        return list;
      },
      { initialProps: { search: "a" } },
    );
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(onReset).not.toHaveBeenCalled();

    rerender({ search: "b" });

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  describe("late responses", () => {
    it("should not let a late page of the old filter into the new list", async () => {
      const gate = createDeferred();
      mockList("/posts", async ({ query }) => {
        if (query.search === "old") {
          await gate.promise;
        }
        return pageItems(Number(query.page)).map((post) => ({ ...post, search: query.search }));
      });

      const { result, rerender } = renderList({ search: "old" });
      await waitFor(() => expect(calls).toHaveLength(1));

      rerender({ query: { search: "new" } });
      await waitFor(() => expect(result.current.items[0]?.search).toBe("new"));

      gate.resolve();
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });

      expect(result.current.items.map((item) => item.search)).toEqual(["new", "new"]);
    });

    it("should cancel the page of the old filter", async () => {
      const gate = createDeferred();
      mockList("/posts", async ({ query }) => {
        if (query.search === "old") {
          await gate.promise;
        }
        return pageItems(1);
      });

      const { result, rerender } = renderList({ search: "old" });
      await waitFor(() => expect(calls).toHaveLength(1));

      rerender({ query: { search: "new" } });
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      gate.resolve();
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });

      const oldPage = createPosts().setQueryParams({ search: "old", page: 1 });
      expect(oldPage.read()).toBeUndefined();
    });

    it("should keep fetching a page another hook still needs", async () => {
      const gate = createDeferred();
      mockList("/posts", async () => {
        await gate.promise;
        return pageItems(1);
      });

      const stays = renderList({ search: "shared" });
      const leaves = renderList({ search: "shared" });
      await waitFor(() => expect(calls).toHaveLength(1));

      leaves.rerender({ query: { search: "other" } });
      gate.resolve();

      await waitFor(() => expect(stays.result.current.items).toHaveLength(2));
    });
  });

  describe("previous data", () => {
    it("should keep the previous list on screen until the new one arrives", async () => {
      const gate = createDeferred();
      const { result, rerender } = renderList({ search: "a" });
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      mockList("/posts", async ({ query }) => {
        await gate.promise;
        return pageItems(Number(query.page)).map((post) => ({ ...post, search: query.search }));
      });
      rerender({ query: { search: "b" } });

      expect(result.current.isPreviousData).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.items[0].search).toBe("a");
      expect(result.current.hasNextPage).toBe(false);

      await act(async () => {
        gate.resolve();
      });

      await waitFor(() => expect(result.current.items[0]?.search).toBe("b"));
      expect(result.current.isPreviousData).toBe(false);
    });

    it("should clear the list right away in the clean mode", async () => {
      const { result, rerender } = renderList({ search: "a" }, { keepPreviousData: "clean" });
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      rerender({ query: { search: "b" } });

      expect(result.current.items).toEqual([]);
      expect(result.current.isPreviousData).toBe(false);
      expect(result.current.loading).toBe(true);
    });

    it("should keep the list of another resource in the preserve mode", async () => {
      mockList("/users/:userId/posts", () => [{ id: 1 }]);
      const request = client.createRequest<{ response: Post[]; queryParams: { page?: number } }>()({
        endpoint: "/users/:userId/posts",
      });

      const { result, rerender } = renderHook(
        ({ userId }) =>
          useInfiniteFetch(request.setParams({ userId }), {
            pagination: { page: "page" },
            keepPreviousData: "preserve",
            dependencyTracking: false,
          }),
        { initialProps: { userId: 1 } },
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      rerender({ userId: 2 });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.isPreviousData).toBe(true);
    });

    it("should show the empty state when the new list fails", async () => {
      const { result, rerender } = renderList({ search: "a" });
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      resetMocks();
      mockList("/posts", () => ({ __failure: 500 }));
      rerender({ query: { search: "b" } });

      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect(result.current.items).toEqual([]);
      expect(result.current.isPreviousData).toBe(false);
    });
  });

  describe("bounce", () => {
    it("should fetch only the settled filter", async () => {
      const { result, rerender } = renderList({ search: "a" }, { bounce: true, bounceTime: 30 });
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      resetCalls();
      const add = vi.spyOn(client.fetchDispatcher, "add");

      rerender({ query: { search: "ab" } });
      rerender({ query: { search: "abc" } });
      rerender({ query: { search: "abcd" } });

      expect(add).not.toHaveBeenCalled();
      await waitFor(() => expect(result.current.items[0]?.search).toBe("abcd"));
      expect(add).toHaveBeenCalledTimes(1);
      expect(calls.map((call) => call.query.search)).toEqual(["abcd"]);
    });

    it("should fetch the first page right away on mount", async () => {
      renderList({ search: "a" }, { bounce: true, bounceTime: 5000 });

      await waitFor(() => expect(calls).toHaveLength(1));
    });
  });
});
