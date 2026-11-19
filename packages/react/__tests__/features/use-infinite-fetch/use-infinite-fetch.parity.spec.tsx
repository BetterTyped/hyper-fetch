/* eslint-disable react/state-in-constructor, react/no-set-state */
import { Client } from "@hyper-fetch/core";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";
import React, { StrictMode, Suspense, useState } from "react";
import { renderToString } from "react-dom/server";

import { countListeners } from "../../utils/gate.utils";
import {
  baseUrl,
  createDeferred,
  createListServer,
  failure,
  pageItems,
  settleRequests,
} from "../../utils/use-infinite-fetch.utils";

/**
 * Scenarios known from the infinite queries of TanStack Query and SWR, checked against useInfiniteFetch.
 * Only the behaviors are shared - the API and the tests are written for HyperFetch.
 */

const { startServer, stopServer, resetMocks, mockList, calls, resetCalls } = createListServer();

type Post = { id: number; version?: number };
type Feed = { data: Post[]; next: string | null };

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

describe("useInfiniteFetch [ Parity ]", () => {
  let client: Client;

  const createPosts = () =>
    client.createRequest<{ response: Post[]; queryParams: { page?: number; search?: string } }>()({
      endpoint: "/posts",
    });

  const createFeed = () =>
    client.createRequest<{ response: Feed; queryParams: { cursor?: string } }>()({ endpoint: "/feed" });

  const createUsers = () =>
    client.createRequest<{
      response: { users: Post[]; total: number };
      queryParams: { offset?: number; limit?: number };
    }>()({ endpoint: "/users" });

  const pagination = { page: "page" } as const;
  const feedPagination = { cursor: "cursor", next: "next", items: "data" } as const;

  const pagesOf = (page: string) => calls.filter((call) => call.query.page === page);

  /** Resolves once every stored page is older than its stale time of zero */
  const waitForStalePages = async (request: ReturnType<typeof createPosts>) => {
    const { cacheKey } = request.setQueryParams({ page: 2 });
    await waitFor(() => expect(client.cache.get(cacheKey)?.responseTimestamp).toBeLessThan(Date.now()));
  };

  const renderPosts = async (pages = 1) => {
    const view = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));
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

  describe("states", () => {
    it("should return the correct states for a successful list", async () => {
      const gates = new Map([
        ["1", createDeferred()],
        ["2", createDeferred()],
      ]);
      mockList("/posts", async ({ query }) => {
        await gates.get(query.page)?.promise;
        return pageItems(Number(query.page));
      });

      const { result } = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));

      expect(result.current.items).toEqual([]);
      expect(result.current.pages).toEqual([]);
      expect(result.current.pageParams).toEqual([]);
      expect(result.current.total).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.isRefetching).toBe(false);
      expect(result.current.isFetchingNextPage).toBe(false);
      expect(result.current.isFetchingPreviousPage).toBe(false);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.isPreviousData).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBeNull();

      gates.get("1")?.resolve();
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.items).toEqual(pageItems(1));
      expect(result.current.pages).toEqual([pageItems(1)]);
      expect(result.current.pageParams).toEqual([1]);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.success).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe(200);

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current.fetchNextPage();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.isFetchingNextPage).toBe(true);
      expect(result.current.isRefetching).toBe(false);
      expect(result.current.items).toEqual(pageItems(1));

      gates.get("2")?.resolve();
      await act(async () => {
        await pending;
      });

      expect(result.current.pages).toEqual([pageItems(1), pageItems(2)]);
      expect(result.current.pageParams).toEqual([1, 2]);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isFetchingNextPage).toBe(false);
      expect(result.current.success).toBe(true);
    });

    it("should resolve with the error response when the next page fails", async () => {
      mockList("/posts", ({ query }) => (query.page === "2" ? failure() : pageItems(Number(query.page))));
      const { result } = await renderPosts();

      let response: Awaited<ReturnType<typeof result.current.fetchNextPage>> = null;
      await act(async () => {
        response = await result.current.fetchNextPage();
      });

      expect(response).toMatchObject({ success: false, status: 500, data: null });
      expect(result.current.status).toBe(500);
      expect(result.current.success).toBe(false);
      expect(result.current.pages).toEqual([pageItems(1)]);
    });

    it("should return the correct states when a refetch fails", async () => {
      const { result } = await renderPosts(2);
      const gate = createDeferred();
      mockList("/posts", async ({ query }) => {
        await gate.promise;
        return query.page === "2" ? failure() : pageItems(Number(query.page));
      });

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current.refetch();
      });

      expect(result.current.isRefetching).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.isFetchingNextPage).toBe(false);
      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);

      gate.resolve();
      await act(async () => {
        await pending;
      });

      expect(result.current.isRefetching).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.success).toBe(false);
      expect(result.current.isFetchNextPageError).toBe(false);
      expect(result.current.isFetchPreviousPageError).toBe(false);
      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
    });

    it("should not call the pagination callbacks before a page is loaded", async () => {
      const gate = createDeferred();
      mockList("/feed", async () => {
        await gate.promise;
        return { data: pageItems(1), next: null };
      });
      const next = vi.fn(({ data }: { data: Feed }) => data.next);
      const items = vi.fn(({ data }: { data: Feed }) => data.data);

      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: { cursor: "cursor", next, items }, dependencyTracking: false }),
      );

      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
      expect(next).not.toHaveBeenCalled();
      expect(items).not.toHaveBeenCalled();

      gate.resolve();
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      expect(next).toHaveBeenCalled();
    });
  });

  describe("end of the list", () => {
    it("should continue after a cursor of zero", async () => {
      mockList("/numbers", ({ query }) => {
        return query.cursor === undefined ? { data: pageItems(1), next: 0 } : { data: pageItems(2), next: null };
      });
      const createNumbers = () =>
        client.createRequest<{ response: { data: Post[]; next: number | null }; queryParams: { cursor?: number } }>()({
          endpoint: "/numbers",
        });

      const { result } = renderHook(() =>
        useInfiniteFetch(createNumbers(), { pagination: feedPagination, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      expect(result.current.hasNextPage).toBe(true);
      await act(() => result.current.fetchNextPage());

      expect(calls.at(-1)?.query.cursor).toBe("0");
      expect(result.current.pageParams).toEqual([undefined, 0]);
      expect(result.current.hasNextPage).toBe(false);
    });

    it("should compute hasNextPage from the pages, not from the selected value", async () => {
      mockList("/feed", ({ query }) => ({
        data: pageItems(Number(query.cursor ?? 1)),
        next: query.cursor ? null : "2",
      }));

      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), {
          pagination: feedPagination,
          select: () => "nothing",
          dependencyTracking: false,
        }),
      );
      await waitFor(() => expect(result.current.pageParams).toHaveLength(1));

      expect(result.current.items).toBe("nothing");
      expect(result.current.hasNextPage).toBe(true);
      await act(() => result.current.fetchNextPage());
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.pageParams).toEqual([undefined, "2"]);
    });
  });

  describe("refetching", () => {
    it("should drop the pages after the new end of a list that became shorter", async () => {
      let lastPage = 3;
      mockList("/posts", ({ query }) => (Number(query.page) > lastPage ? [] : pageItems(Number(query.page))));
      const { result } = await renderPosts(3);
      expect(result.current.pageParams).toEqual([1, 2, 3]);

      lastPage = 1;
      await act(() => result.current.refetch());

      // The same list as when loaded from scratch: the empty page is the one that ended it
      expect(result.current.pages).toEqual([pageItems(1), []]);
      expect(result.current.pageParams).toEqual([1, 2]);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should not keep a page that failed to refetch past the new end of the list", async () => {
      let total = 6;
      mockList("/users", ({ query }) => {
        const offset = Number(query.offset);
        if (offset >= total) {
          return failure(404);
        }
        const users = pageItems(offset / 2 + 1).filter((user) => user.id <= total);
        return { users, total };
      });
      const { result } = renderHook(() =>
        useInfiniteFetch(createUsers().setQueryParams({ limit: 2 }), {
          pagination: { offset: "offset", limit: "limit", items: "users", total: "total" },
          dependencyTracking: false,
        }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      await act(() => result.current.fetchNextPage());
      await act(() => result.current.fetchNextPage());
      expect(ids(result.current.items)).toEqual([1, 2, 3, 4, 5, 6]);

      total = 3;
      await act(() => result.current.refetch());

      expect(ids(result.current.items)).toEqual([1, 2, 3]);
      expect(result.current.pageParams).toEqual([0, 2]);
      expect(result.current.total).toBe(3);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(true);
    });

    it("should load the next page after a running refetch, from its fresh cursor", async () => {
      let version = "a";
      const gate = createDeferred();
      mockList("/feed", async ({ query }) => {
        if (version === "b") {
          await gate.promise;
        }
        const page = query.cursor ? Number(query.cursor.slice(1)) : 1;
        return { data: pageItems(page), next: page < 3 ? `${version}${page + 1}` : null };
      });
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: feedPagination, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      version = "b";

      let refetch: Promise<unknown> = Promise.resolve();
      let next: Promise<unknown> = Promise.resolve();
      act(() => {
        refetch = result.current.refetch();
        next = result.current.fetchNextPage();
      });

      expect(result.current.isRefetching).toBe(true);
      expect(result.current.isFetchingNextPage).toBe(true);

      gate.resolve();
      await act(async () => {
        await Promise.all([refetch, next]);
      });

      expect(calls.map((call) => call.query.cursor)).toEqual([undefined, undefined, "b2"]);
      expect(result.current.pageParams).toEqual([undefined, "b2"]);
      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.isFetching).toBe(false);
    });

    it("should keep the restored pages visible when their refetch fails", async () => {
      const stale = () => createPosts().setStaleTime(0);
      const first = renderHook(() => useInfiniteFetch(stale(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      await act(() => first.result.current.fetchNextPage());
      first.unmount();
      await waitForStalePages(stale());
      mockList("/posts", () => failure());

      const { result } = renderHook(() => useInfiniteFetch(stale(), { pagination, dependencyTracking: false }));

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.loading).toBe(false);
      await waitFor(() => expect(result.current.error).toBeTruthy());

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
    });

    it("should refetch the pages invalidated while the list was not mounted", async () => {
      const first = await renderPosts(2);
      first.unmount();
      resetCalls();
      mockList("/posts", ({ query }) => pageItems(Number(query.page)).map((post) => ({ ...post, version: 2 })));

      client.cache.invalidate();
      const { result } = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.loading).toBe(false);
      await waitFor(() => expect(result.current.items.map((post) => post.version)).toEqual([2, 2, 2, 2]));
      expect(calls.map((call) => call.query.page).toSorted()).toEqual(["1", "2"]);
    });

    it("should follow a cursor changed by a cache update", async () => {
      mockList("/feed", ({ query }) => ({
        data: pageItems(Number(query.cursor ?? 1)),
        next: query.cursor ? null : "2",
      }));
      const { result } = renderHook(() =>
        useInfiniteFetch(createFeed(), { pagination: feedPagination, dependencyTracking: false }),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      act(() => {
        client.cache.update(createFeed(), (previous) => ({
          data: previous?.data ? { ...previous.data, next: "5" } : null,
        }));
      });
      await act(() => result.current.fetchNextPage());

      expect(calls.at(-1)?.query.cursor).toBe("5");
      expect(result.current.pageParams).toEqual([undefined, "5"]);
      expect(ids(result.current.items)).toEqual([1, 2, 9, 10]);
    });
  });

  describe("retries", () => {
    const retried = () => createPosts().setRetry(2).setRetryTime(1);

    it("should retry a failing page without reporting the attempts or repeating other pages", async () => {
      const gate = createDeferred();
      mockList("/posts", async ({ query }) => {
        if (query.page !== "2") {
          return pageItems(Number(query.page));
        }
        if (pagesOf("2").length === 1) {
          return failure();
        }
        await gate.promise;
        return pageItems(2);
      });
      const { result } = renderHook(() => useInfiniteFetch(retried(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current.fetchNextPage();
      });
      await waitFor(() => expect(pagesOf("2")).toHaveLength(2));

      expect(result.current.error).toBeNull();
      expect(result.current.isFetchNextPageError).toBe(false);
      expect(result.current.isFetchingNextPage).toBe(true);

      gate.resolve();
      await act(async () => {
        await pending;
      });

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.error).toBeNull();
      expect(pagesOf("1")).toHaveLength(1);
      expect(pagesOf("2")).toHaveLength(2);
    });

    it("should stop when the retries run out", async () => {
      mockList("/posts", ({ query }) => (query.page === "2" ? failure() : pageItems(Number(query.page))));
      const { result } = renderHook(() => useInfiniteFetch(retried(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      await act(() => result.current.fetchNextPage());

      expect(pagesOf("2")).toHaveLength(3);
      expect(result.current.isFetchNextPageError).toBe(true);
      expect(result.current.isFetching).toBe(false);
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(ids(result.current.items)).toEqual([1, 2]);
    });
  });

  describe("select", () => {
    it("should not rerender endlessly with a select returning a new value", async () => {
      let renders = 0;

      const Component = () => {
        renders += 1;
        const { items } = useInfiniteFetch(createPosts(), {
          pagination,
          select: ({ items: posts }) => ({ ids: posts.map((post) => post.id) }),
        });
        return <span>{items.ids.join(",")}</span>;
      };

      render(<Component />);
      await screen.findByText("1,2");
      const rendersAfterLoad = renders;

      await act(async () => {
        await Promise.resolve();
      });

      expect(renders).toBe(rendersAfterLoad);
    });

    it("should keep the loaded pages when select throws", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => null);
      let pending: Promise<unknown> = Promise.resolve();

      const Component = ({ limit }: { limit: number }) => {
        const { items, fetchNextPage } = useInfiniteFetch(createPosts(), {
          pagination,
          select: ({ items: posts }) => {
            if (posts.length > limit) {
              throw new Error("Too many posts");
            }
            return posts.length;
          },
        });
        return (
          <button
            type="button"
            onClick={() => {
              pending = fetchNextPage();
            }}
          >
            {items}
          </button>
        );
      };

      const first = render(
        <Boundary>
          <Component limit={2} />
        </Boundary>,
      );
      await screen.findByText("2");
      act(() => screen.getByRole("button").click());
      await act(async () => {
        await pending;
      });
      await screen.findByText("boundary");
      first.unmount();
      resetCalls();

      render(<Component limit={10} />);

      await screen.findByText("4");
      expect(calls).toHaveLength(0);
      spy.mockRestore();
    });
  });

  describe("rendering", () => {
    it("should show the current value of a field read for the first time in a later render", async () => {
      mockList("/posts", ({ query }) => (query.page === "2" ? failure() : pageItems(Number(query.page))));
      let renders = 0;
      let pending: Promise<unknown> = Promise.resolve();

      const Component = () => {
        renders += 1;
        const [hasDetails, setHasDetails] = useState(false);
        const list = useInfiniteFetch(createPosts(), { pagination });
        return (
          <div>
            <span>{`items: ${list.items.length}`}</span>
            {hasDetails && <span>{list.isFetchNextPageError ? "failed" : "fine"}</span>}
            <button
              type="button"
              onClick={() => {
                pending = list.fetchNextPage();
              }}
            >
              more
            </button>
            <button type="button" onClick={() => setHasDetails(true)}>
              details
            </button>
          </div>
        );
      };

      render(<Component />);
      await screen.findByText("items: 2");
      const rendersAfterLoad = renders;

      act(() => screen.getByText("more").click());
      await act(async () => {
        await pending;
      });

      // The failed page changed only the values this component does not read
      expect(renders).toBe(rendersAfterLoad);

      act(() => screen.getByText("details").click());

      expect(screen.getByText("failed")).toBeInTheDocument();
    });
  });

  describe("boundaries", () => {
    it("should suspend on mount and keep the previous list on screen for the next one", async () => {
      const gate = createDeferred();
      mockList("/posts", async ({ query }) => {
        if (query.search === "b") {
          await gate.promise;
        }
        return pageItems(Number(query.page));
      });
      const List = ({ search }: { search: string }) => {
        const { items, isPreviousData } = useInfiniteFetch(createPosts().setQueryParams({ search }), {
          pagination,
          suspense: true,
          keepPreviousData: "preserve",
        });
        return <div>{`items:${items.length} previous:${String(isPreviousData)}`}</div>;
      };
      const App = ({ search }: { search: string }) => (
        <Suspense fallback="loading">
          <List search={search} />
        </Suspense>
      );

      const { rerender } = render(<App search="a" />);

      expect(screen.getByText("loading")).toBeInTheDocument();
      await screen.findByText("items:2 previous:false");

      rerender(<App search="b" />);

      expect(screen.queryByText("loading")).not.toBeInTheDocument();
      expect(screen.getByText("items:2 previous:true")).toBeInTheDocument();

      gate.resolve();
      await screen.findByText("items:2 previous:false");
      expect(calls.map((call) => call.query.search)).toEqual(["a", "b"]);
    });

    it("should render the loading state on the server without sending requests", () => {
      const server = new Client({ url: baseUrl, mode: "server" });
      const add = vi.spyOn(server.fetchDispatcher, "add");
      const List = ({ suspense }: { suspense: boolean }) => {
        const { items, loading, hasNextPage } = useInfiniteFetch(
          server.createRequest<{ response: Post[]; queryParams: { page?: number } }>()({ endpoint: "/posts" }),
          { pagination, suspense },
        );
        return <div>{loading ? "loading" : `items:${items.length} next:${String(hasNextPage)}`}</div>;
      };

      expect(renderToString(<List suspense={false} />)).toContain("loading");
      expect(renderToString(<List suspense />)).toContain("loading");
      expect(add).not.toHaveBeenCalled();
    });
  });

  describe("network", () => {
    it("should load a page asked for while offline once the network is back", async () => {
      const { result } = await renderPosts();

      act(() => client.appManager.setOnline(false));
      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current.fetchNextPage();
      });

      expect(result.current.isFetchingNextPage).toBe(true);
      expect(result.current.error).toBeNull();

      act(() => client.appManager.setOnline(true));
      await act(async () => {
        await pending;
      });

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.error).toBeNull();
      expect(result.current.isFetchNextPageError).toBe(false);
      expect(pagesOf("2")).toHaveLength(1);
    });
  });

  describe("disabled lists", () => {
    // Invalidation is handled in a microtask, so many keys end up in one refetch
    const invalidate = async () => {
      await act(async () => {
        client.cache.invalidate();
        await Promise.resolve();
      });
    };

    const loadPages = async () => {
      const first = await renderPosts(2);
      first.unmount();
      return vi.spyOn(client.fetchDispatcher, "add");
    };

    it("should not refetch a disabled list when its pages are invalidated", async () => {
      const add = await loadPages();
      const { result } = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination, disabled: true, dependencyTracking: false }),
      );
      expect(result.current.pageParams).toEqual([1, 2]);

      await invalidate();

      expect(add).not.toHaveBeenCalled();
      expect(result.current.isFetching).toBe(false);
    });

    it("should not refetch a list disabled after loading when its pages are invalidated", async () => {
      const { result, rerender } = renderHook(
        ({ disabled }) => useInfiniteFetch(createPosts(), { pagination, disabled, dependencyTracking: false }),
        { initialProps: { disabled: false } },
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      const add = vi.spyOn(client.fetchDispatcher, "add");

      rerender({ disabled: true });
      await invalidate();

      expect(add).not.toHaveBeenCalled();
      expect(result.current.isFetching).toBe(false);

      rerender({ disabled: false });

      expect(result.current.isRefetching).toBe(true);
      await waitFor(() => expect(result.current.isRefetching).toBe(false));
      expect(add).toHaveBeenCalledTimes(1);
    });

    it("should refetch invalidated pages for the enabled hook of a list shared with a disabled one", async () => {
      const add = await loadPages();
      const disabled = renderHook(() =>
        useInfiniteFetch(createPosts(), { pagination, disabled: true, dependencyTracking: false }),
      );
      const enabled = renderHook(() => useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false }));
      mockList("/posts", ({ query }) => pageItems(Number(query.page)).map((post) => ({ ...post, version: 2 })));

      await invalidate();

      await waitFor(() => expect(enabled.result.current.items.map((post) => post.version)).toEqual([2, 2, 2, 2]));
      expect(disabled.result.current.items.map((post) => post.version)).toEqual([2, 2, 2, 2]);
      expect(add).toHaveBeenCalledTimes(2);

      enabled.unmount();
      await invalidate();

      expect(add).toHaveBeenCalledTimes(2);
    });
  });

  describe("lifecycle", () => {
    it("should leave no listeners behind after unmounting mid-fetch", async () => {
      const listeners = countListeners(client);
      const { result, unmount } = await renderPosts();
      const gate = createDeferred();
      mockList("/posts", async ({ query }) => {
        await gate.promise;
        return pageItems(Number(query.page));
      });

      act(() => {
        result.current.fetchNextPage();
        result.current.refetch();
      });
      await waitFor(() => expect(calls).toHaveLength(2));
      unmount();
      gate.resolve();

      await waitFor(() => expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0));
      await waitFor(() => expect(countListeners(client)).toEqual(listeners));
    });

    it("should send every page once in StrictMode", async () => {
      const listeners = countListeners(client);
      const onSuccess = vi.fn();
      const { result, unmount } = renderHook(
        () => {
          const list = useInfiniteFetch(createPosts(), { pagination, dependencyTracking: false });
          list.onSuccess(onSuccess);
          return list;
        },
        { wrapper: StrictMode },
      );
      await waitFor(() => expect(result.current.pageParams).toEqual([1]));
      expect(calls).toHaveLength(1);

      await act(() => result.current.fetchNextPage());
      expect(calls).toHaveLength(2);

      await act(() => result.current.refetch());
      expect(calls).toHaveLength(4);

      act(() => {
        client.cache.invalidate(createPosts().setQueryParams({ page: 1 }));
      });
      await waitFor(() => expect(calls).toHaveLength(6));
      await waitFor(() => expect(result.current.isFetching).toBe(false));

      expect(calls).toHaveLength(6);
      expect(onSuccess).toHaveBeenCalledTimes(6);
      expect(result.current.pageParams).toEqual([1, 2]);

      unmount();
      expect(countListeners(client)).toEqual(listeners);
    });

    it("should fetch once when enabled, disabled and enabled again", async () => {
      const add = vi.spyOn(client.fetchDispatcher, "add");
      const { result, rerender } = renderHook(
        ({ disabled }) => useInfiniteFetch(createPosts(), { pagination, disabled, dependencyTracking: false }),
        { initialProps: { disabled: false } },
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      rerender({ disabled: true });
      expect(ids(result.current.items)).toEqual([1, 2]);
      expect(result.current.loading).toBe(false);
      rerender({ disabled: false });

      expect(result.current.isFetching).toBe(false);
      expect(add).toHaveBeenCalledTimes(1);
    });

    it("should show the cached pages of a disabled list without refetching them", async () => {
      const stale = () => createPosts().setStaleTime(0);
      const first = renderHook(() => useInfiniteFetch(stale(), { pagination, dependencyTracking: false }));
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      await act(() => first.result.current.fetchNextPage());
      first.unmount();
      await waitForStalePages(stale());
      const add = vi.spyOn(client.fetchDispatcher, "add");

      const { result, rerender } = renderHook(
        ({ disabled }) => useInfiniteFetch(stale(), { pagination, disabled, dependencyTracking: false }),
        { initialProps: { disabled: true } },
      );

      expect(ids(result.current.items)).toEqual([1, 2, 3, 4]);
      expect(result.current.loading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(add).not.toHaveBeenCalled();

      rerender({ disabled: false });

      expect(result.current.isRefetching).toBe(true);
      await waitFor(() => expect(result.current.isRefetching).toBe(false));
      expect(add).toHaveBeenCalledTimes(2);
    });

    it("should not fetch a filter left for a loaded one while it was bounced", async () => {
      const { result, rerender } = renderHook(
        ({ search }) =>
          useInfiniteFetch(createPosts().setQueryParams({ search }), {
            pagination,
            bounce: true,
            bounceTime: 30,
            dependencyTracking: false,
          }),
        { initialProps: { search: "a" } },
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      const add = vi.spyOn(client.fetchDispatcher, "add");

      rerender({ search: "ab" });
      rerender({ search: "a" });

      expect(result.current.bounce.active).toBe(true);
      expect(ids(result.current.items)).toEqual([1, 2]);
      await waitFor(() => expect(result.current.bounce.active).toBe(false));

      expect(add).not.toHaveBeenCalled();
      expect(result.current.isFetching).toBe(false);
    });

    it("should not fetch a bounced filter of a list disabled in the meantime", async () => {
      const { result, rerender } = renderHook(
        ({ search, disabled }) =>
          useInfiniteFetch(createPosts().setQueryParams({ search }), {
            pagination,
            disabled,
            bounce: true,
            bounceTime: 30,
            dependencyTracking: false,
          }),
        { initialProps: { search: "a", disabled: false } },
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      const add = vi.spyOn(client.fetchDispatcher, "add");

      rerender({ search: "ab", disabled: false });
      rerender({ search: "ab", disabled: true });

      expect(result.current.bounce.active).toBe(true);
      await waitFor(() => expect(result.current.bounce.active).toBe(false));

      expect(add).not.toHaveBeenCalled();
      expect(result.current.isFetching).toBe(false);

      rerender({ search: "ab", disabled: false });

      await waitFor(() => expect(result.current.isPreviousData).toBe(false));
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      expect(add).toHaveBeenCalledTimes(1);
    });
  });
});
