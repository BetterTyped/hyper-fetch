import { Client } from "@hyper-fetch/core";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";
import React, { Activity, StrictMode } from "react";

import {
  baseUrl,
  createDeferred,
  createListServer,
  pageItems,
  settleRequests,
} from "../../utils/use-infinite-fetch.utils";

const { startServer, stopServer, resetMocks, mockList, calls, resetCalls } = createListServer();

type Post = { id: number; version?: number };

const versions = (items: Post[]) => items.map((item) => item.version);

/**
 * Effects of a mounted hook run again in StrictMode and when a hidden `Activity` is shown.
 * The list must behave like it was mounted once: no repeated requests, and nothing missed while it was away.
 */
describe("useInfiniteFetch [ Resubscribe ]", () => {
  let client: Client;
  let version = 1;

  const createPosts = () =>
    client.createRequest<{ response: Post[]; queryParams: { page?: number } }>()({ endpoint: "/posts" });

  const pagination = { page: "page" } as const;

  /** Resolves once the stored page is older than its stale time of zero */
  const waitForStalePage = async (request: ReturnType<typeof createPosts>) => {
    const { cacheKey } = request.setQueryParams({ page: 1 });
    await waitFor(() => expect(client.cache.get(cacheKey)?.responseTimestamp).toBeLessThan(Date.now()));
  };

  const List = ({ request = createPosts() }: { request?: ReturnType<typeof createPosts> }) => {
    const { items, fetchNextPage } = useInfiniteFetch(request, { pagination });
    return (
      <button type="button" onClick={() => fetchNextPage()}>
        {`versions: ${versions(items).join(",")}`}
      </button>
    );
  };

  const App = ({ isVisible, request }: { isVisible: boolean; request?: ReturnType<typeof createPosts> }) => (
    <Activity mode={isVisible ? "visible" : "hidden"}>
      <List request={request} />
    </Activity>
  );

  const renderTwoPages = async (request?: ReturnType<typeof createPosts>) => {
    const view = render(<App isVisible request={request} />);
    await screen.findByText("versions: 1,1");
    act(() => screen.getByRole("button").click());
    await screen.findByText("versions: 1,1,1,1");
    return view;
  };

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: baseUrl });
    version = 1;
    resetCalls();
    mockList("/posts", ({ query }) => pageItems(Number(query.page)).map((post) => ({ ...post, version })));
  });

  afterEach(async () => {
    await settleRequests(client);
    resetMocks();
  });

  describe("hidden lists", () => {
    it("should show a fresh list again without requests", async () => {
      const { rerender } = await renderTwoPages();
      const add = vi.spyOn(client.fetchDispatcher, "add");

      rerender(<App isVisible={false} />);
      rerender(<App isVisible />);

      expect(screen.getByText("versions: 1,1,1,1")).toBeInTheDocument();
      expect(add).not.toHaveBeenCalled();
    });

    it("should refetch the pages invalidated while the list was hidden", async () => {
      const { rerender } = await renderTwoPages();

      rerender(<App isVisible={false} />);
      version = 2;
      act(() => client.cache.invalidate());
      const add = vi.spyOn(client.fetchDispatcher, "add");

      rerender(<App isVisible />);

      await screen.findByText("versions: 2,2,2,2");
      expect(add).toHaveBeenCalledTimes(2);
    });

    it("should refetch the pages that became stale while the list was hidden", async () => {
      const request = createPosts().setStaleTime(0);
      const { rerender } = await renderTwoPages(request);

      rerender(<App isVisible={false} request={request} />);
      await waitForStalePage(request);
      version = 2;
      const add = vi.spyOn(client.fetchDispatcher, "add");

      rerender(<App isVisible request={request} />);

      await screen.findByText("versions: 2,2,2,2");
      expect(add).toHaveBeenCalledTimes(2);
    });

    it("should show a page that arrived while the list was hidden", async () => {
      const gate = createDeferred();
      mockList("/posts", async ({ query }) => {
        if (query.page === "2") {
          await gate.promise;
        }
        return pageItems(Number(query.page)).map((post) => ({ ...post, version }));
      });
      const { rerender } = render(<App isVisible />);
      await screen.findByText("versions: 1,1");
      act(() => screen.getByRole("button").click());
      await waitFor(() => expect(calls).toHaveLength(2));

      rerender(<App isVisible={false} />);
      gate.resolve();
      await waitFor(() => expect(client.cache.keys()).toHaveLength(2));
      await waitFor(() => expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0));

      rerender(<App isVisible />);

      await screen.findByText("versions: 1,1,1,1");
      expect(calls).toHaveLength(2);
    });

    it("should show a cache change made while the list was hidden", async () => {
      const { rerender } = await renderTwoPages();

      rerender(<App isVisible={false} />);
      act(() => {
        client.cache.update(createPosts().setQueryParams({ page: 2 }), (previous) => ({
          data: previous?.data?.map((post) => ({ ...post, version: 7 })) ?? null,
        }));
      });
      rerender(<App isVisible />);

      await screen.findByText("versions: 1,1,7,7");
      expect(calls).toHaveLength(2);
    });
  });

  describe("StrictMode", () => {
    const renderLoaded = async () => {
      const first = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      await act(() => first.result.current.fetchNextPage());
      first.unmount();
      return vi.spyOn(client.fetchDispatcher, "add");
    };

    it("should restore fresh pages without requests", async () => {
      const add = await renderLoaded();

      const { result } = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }), {
        wrapper: StrictMode,
      });

      expect(result.current.pageParams).toEqual([1, 2]);
      expect(result.current.isFetching).toBe(false);
      expect(add).not.toHaveBeenCalled();
    });

    it("should refetch the restored pages once with the revalidate option", async () => {
      const add = await renderLoaded();
      version = 2;

      const { result } = renderHook(
        () => useInfiniteFetch(createPosts(), { pagination, revalidate: true, dependencyTracking: false }),
        { wrapper: StrictMode },
      );

      await waitFor(() => expect(versions(result.current.items)).toEqual([2, 2, 2, 2]));
      expect(result.current.isFetching).toBe(false);
      expect(add).toHaveBeenCalledTimes(2);
    });

    it("should refetch once for every change of the dependencies", async () => {
      const add = await renderLoaded();

      const { result, rerender } = renderHook(
        ({ value }) =>
          useInfiniteFetch(createPosts(), { pagination, dependencies: [value], dependencyTracking: false }),
        { wrapper: StrictMode, initialProps: { value: 1 } },
      );
      expect(add).not.toHaveBeenCalled();

      rerender({ value: 1 });
      expect(add).not.toHaveBeenCalled();

      version = 2;
      rerender({ value: 2 });

      await waitFor(() => expect(versions(result.current.items)).toEqual([2, 2, 2, 2]));
      expect(add).toHaveBeenCalledTimes(2);
    });
  });

  describe("hooks joining a list on screen", () => {
    it("should refetch a stale list when another hook mounts on it", async () => {
      const stale = createPosts().setStaleTime(0);
      const first = renderHook(() => useInfiniteFetch(stale, { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      await waitForStalePage(stale);
      version = 2;
      const add = vi.spyOn(client.fetchDispatcher, "add");

      const second = renderHook(() => useInfiniteFetch(stale, { pagination, dependencyTracking: false }));

      expect(versions(second.result.current.items)).toEqual([1, 1]);
      expect(second.result.current.loading).toBe(false);
      await waitFor(() => expect(versions(second.result.current.items)).toEqual([2, 2]));
      expect(versions(first.result.current.items)).toEqual([2, 2]);
      expect(add).toHaveBeenCalledTimes(1);
    });

    it("should not refetch a fresh list when another hook mounts on it", async () => {
      const first = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      const add = vi.spyOn(client.fetchDispatcher, "add");

      const second = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));

      expect(second.result.current.items).toHaveLength(2);
      expect(second.result.current.isFetching).toBe(false);
      expect(add).not.toHaveBeenCalled();
    });

    it("should not refetch a fresh list without cache when another hook mounts on it", async () => {
      const uncached = createPosts().setCache(false);
      const first = renderHook(() => useInfiniteFetch(uncached, { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      const add = vi.spyOn(client.fetchDispatcher, "add");

      const second = renderHook(() => useInfiniteFetch(uncached, { pagination, dependencyTracking: false }));

      expect(second.result.current.items).toHaveLength(2);
      expect(second.result.current.isFetching).toBe(false);
      expect(add).not.toHaveBeenCalled();
    });

    it("should join the fetch of a list that is still loading", async () => {
      const first = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));
      const second = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));

      await waitFor(() => expect(second.result.current.items).toHaveLength(2));

      expect(first.result.current.items).toHaveLength(2);
      expect(calls).toHaveLength(1);
    });
  });
});
