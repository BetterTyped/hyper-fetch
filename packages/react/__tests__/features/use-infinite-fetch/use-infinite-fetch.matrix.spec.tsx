import { Client, fetchInfinite, getPageRequest } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";
import { Hydrate } from "hydrate";
import React, { StrictMode } from "react";

import type { ListBackend } from "../../utils/use-infinite-fetch.modes";
import { createListBackend, pagingModes } from "../../utils/use-infinite-fetch.modes";
import { baseUrl, createDeferred, createListServer, settleRequests, sleep } from "../../utils/use-infinite-fetch.utils";

const server = createListServer();
const { startServer, stopServer, resetMocks, calls, resetCalls } = server;

const ids = (items: any[]) => items.map((item) => item.id);
const versions = (items: any[]) => items.map((item) => item.version);

describe.each(pagingModes)("useInfiniteFetch [ Matrix ] $name", (mode) => {
  let client: Client;
  let backend: ListBackend;

  const options = { pagination: mode.pagination, dependencyTracking: false };
  const starts = () => calls.map(mode.startOf);

  const renderList = async (request = mode.create(client), extra: Record<string, unknown> = {}) => {
    const view = renderHook(() => useInfiniteFetch(request, { ...options, ...extra }) as any);
    await waitFor(() => expect(view.result.current.loading).toBe(false));
    return view;
  };

  const loadAll = async (view: Awaited<ReturnType<typeof renderList>>) => {
    while (view.result.current.hasNextPage) {
      // Every page depends on the one before it
      // eslint-disable-next-line no-await-in-loop
      await act(() => view.result.current.fetchNextPage());
    }
  };

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: baseUrl });
    backend = createListBackend();
    resetCalls();
    mode.mock(server, backend);
  });

  afterEach(async () => {
    await settleRequests(client);
    resetMocks();
  });

  describe("loading", () => {
    it("should load every page once and in order", async () => {
      const view = await renderList();

      await loadAll(view);

      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(starts()).toEqual([0, 2, 4]);
      expect(view.result.current.pages).toHaveLength(3);
      expect(view.result.current.total).toBe(6);
      expect(view.result.current.hasNextPage).toBe(false);
      expect(view.result.current.isFetching).toBe(false);
    });

    it("should store every page under its own key", async () => {
      const view = await renderList();

      await loadAll(view);

      expect(client.cache.keys()).toHaveLength(3);
    });

    it("should not request anything past the end", async () => {
      const view = await renderList();
      await loadAll(view);
      resetCalls();

      await expect(view.result.current.fetchNextPage()).resolves.toBeNull();

      expect(calls).toHaveLength(0);
    });

    it("should share one request between repeated calls", async () => {
      const view = await renderList();
      resetCalls();

      await act(async () => {
        await Promise.all([1, 2, 3, 4, 5].map(() => view.result.current.fetchNextPage()));
      });

      expect(starts()).toEqual([2]);
      expect(view.result.current.pages).toHaveLength(2);
    });

    it("should handle an empty list", async () => {
      backend.total = 0;

      const view = await renderList();

      expect(view.result.current.items).toEqual([]);
      expect(view.result.current.hasNextPage).toBe(false);
      expect(view.result.current.error).toBeNull();
    });

    it("should handle a list of one page", async () => {
      backend.total = 2;

      const view = await renderList();

      expect(view.result.current.hasNextPage).toBe(false);
      expect(calls).toHaveLength(1);
    });

    it("should handle a shorter last page", async () => {
      backend.total = 5;
      const view = await renderList();

      await loadAll(view);

      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4, 5]);
      expect(calls).toHaveLength(3);
    });

    it("should send one request in StrictMode", async () => {
      const view = renderHook(() => useInfiniteFetch(mode.create(client), options) as any, { wrapper: StrictMode });

      await waitFor(() => expect(view.result.current.items).toHaveLength(2));

      expect(calls).toHaveLength(1);
    });

    it("should wait for the list to be enabled", async () => {
      const view = renderHook(
        ({ disabled }) => useInfiniteFetch(mode.create(client), { ...options, disabled }) as any,
        { initialProps: { disabled: true } },
      );
      await sleep(20);
      expect(calls).toHaveLength(0);

      view.rerender({ disabled: false });

      await waitFor(() => expect(view.result.current.items).toHaveLength(2));
    });

    it("should transform the list with select", async () => {
      const view = await renderList(undefined, {
        select: ({ items, pages }: { items: unknown[]; pages: unknown[] }) => `${items.length}/${pages.length}`,
      });

      await act(() => view.result.current.fetchNextPage());

      expect(view.result.current.items).toBe("4/2");
    });
  });

  describe("directions", () => {
    it("should reach both ends from the middle", async () => {
      const view = await renderList(mode.at(client, 2));
      expect(ids(view.result.current.items)).toEqual([3, 4]);
      expect(view.result.current.hasPreviousPage).toBe(true);
      expect(view.result.current.hasNextPage).toBe(true);

      await act(() => view.result.current.fetchPreviousPage());
      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4]);
      expect(view.result.current.hasPreviousPage).toBe(false);

      await act(() => view.result.current.fetchNextPage());
      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(view.result.current.hasNextPage).toBe(false);
    });

    it("should move a window of pages in both directions", async () => {
      const view = await renderList(undefined, { maxPages: 2 });

      await loadAll(view);
      expect(ids(view.result.current.items)).toEqual([3, 4, 5, 6]);
      expect(view.result.current.hasPreviousPage).toBe(true);

      await act(() => view.result.current.fetchPreviousPage());
      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4]);
      expect(view.result.current.hasNextPage).toBe(true);

      await act(() => view.result.current.fetchNextPage());
      expect(ids(view.result.current.items)).toEqual([3, 4, 5, 6]);
    });
  });

  describe("refetching", () => {
    it("should replace every page with fresh data", async () => {
      const view = await renderList();
      await loadAll(view);
      backend.version = 2;
      resetCalls();

      await act(() => view.result.current.refetch());

      expect(versions(view.result.current.items)).toEqual([2, 2, 2, 2, 2, 2]);
      expect([...starts()].toSorted()).toEqual([0, 2, 4]);
    });

    it("should show the old pages until the fresh ones arrive", async () => {
      const view = await renderList();
      backend.version = 2;
      backend.gate = createDeferred();

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = view.result.current.refetch();
      });

      expect(view.result.current.isRefetching).toBe(true);
      expect(versions(view.result.current.items)).toEqual([1, 1]);

      backend.gate.resolve();
      await act(async () => {
        await pending;
      });

      expect(versions(view.result.current.items)).toEqual([2, 2]);
    });

    it("should keep every item when a page fails to refetch", async () => {
      const view = await renderList();
      await loadAll(view);
      backend.failing.add(2);

      await act(() => view.result.current.refetch());

      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(view.result.current.error).toBeTruthy();
    });

    it("should refetch the list when one of the pages is invalidated", async () => {
      const view = await renderList();
      await loadAll(view);
      backend.version = 2;

      const [, param] = view.result.current.pageParams;
      act(() => {
        client.cache.invalidate(getPageRequest(mode.create(client), mode.pagination, param));
      });

      await waitFor(() => expect(versions(view.result.current.items)).toEqual([2, 2, 2, 2, 2, 2]));
    });

    it("should refetch when the dependencies change", async () => {
      const view = renderHook(
        ({ value }) => useInfiniteFetch(mode.create(client), { ...options, dependencies: [value] }) as any,
        { initialProps: { value: 1 } },
      );
      await waitFor(() => expect(view.result.current.items).toHaveLength(2));
      backend.version = 2;

      view.rerender({ value: 2 });

      await waitFor(() => expect(versions(view.result.current.items)).toEqual([2, 2]));
    });

    it("should update one page in place when its cache changes", async () => {
      const request = mode.create(client);
      const view = await renderList(request);
      await loadAll(view);
      const [first] = view.result.current.items;
      resetCalls();

      const param = view.result.current.pageParams.at(-1);
      act(() => {
        client.cache.update(getPageRequest(request, mode.pagination, param), (previous: any) => ({
          data: { ...previous.data, items: [{ id: 100 }, { id: 101 }] },
        }));
      });

      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4, 100, 101]);
      expect(view.result.current.items[0]).toBe(first);
      expect(calls).toHaveLength(0);
    });
  });

  describe("restoring", () => {
    it("should restore every loaded page after remounting", async () => {
      const first = await renderList();
      await loadAll(first);
      first.unmount();
      resetCalls();

      const view = renderHook(() => useInfiniteFetch(mode.create(client), options) as any);

      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(view.result.current.loading).toBe(false);
      await sleep(20);
      expect(calls).toHaveLength(0);
    });

    it("should keep a page that arrived after unmounting", async () => {
      const first = await renderList();
      backend.gate = createDeferred();
      act(() => {
        first.result.current.fetchNextPage();
      });
      await waitFor(() => expect(calls).toHaveLength(2));

      first.unmount();
      backend.gate.resolve();
      await waitFor(() => expect(client.cache.keys()).toHaveLength(2));

      const view = renderHook(() => useInfiniteFetch(mode.create(client), options) as any);

      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4]);
    });

    it("should render prefetched pages and continue after them", async () => {
      const { dehydrated } = await fetchInfinite(mode.create(client), { pagination: mode.pagination, pages: 2 });
      resetCalls();

      const view = renderHook(() => useInfiniteFetch(mode.create(client), options) as any, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Hydrate client={client} data={dehydrated}>
            {children}
          </Hydrate>
        ),
      });

      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4]);
      await sleep(20);
      expect(calls).toHaveLength(0);

      await act(() => view.result.current.fetchNextPage());

      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(starts()).toEqual([4]);
    });
  });

  describe("recovering", () => {
    it("should drop to the first page on reset", async () => {
      const view = await renderList();
      await loadAll(view);
      resetCalls();

      await act(() => view.result.current.reset());

      expect(ids(view.result.current.items)).toEqual([1, 2]);
      expect(starts()).toEqual([0]);
      expect(view.result.current.hasNextPage).toBe(true);
    });

    it("should continue after an aborted page", async () => {
      const view = await renderList();
      backend.gate = createDeferred();

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = view.result.current.fetchNextPage();
      });
      act(() => view.result.current.abort());
      backend.gate.resolve();
      backend.gate = null;

      await expect(pending).resolves.toBeNull();
      expect(ids(view.result.current.items)).toEqual([1, 2]);

      await act(() => view.result.current.fetchNextPage());

      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4]);
    });

    it("should retry a failed page", async () => {
      const view = await renderList();
      backend.failing.add(2);

      await act(() => view.result.current.fetchNextPage());
      expect(view.result.current.isFetchNextPageError).toBe(true);
      expect(ids(view.result.current.items)).toEqual([1, 2]);

      backend.failing.clear();
      await act(() => view.result.current.fetchNextPage());

      expect(view.result.current.isFetchNextPageError).toBe(false);
      expect(view.result.current.error).toBeNull();
      expect(ids(view.result.current.items)).toEqual([1, 2, 3, 4]);
    });

    it("should recover from a failed first page", async () => {
      backend.failing.add(0);
      const view = await renderList();
      expect(view.result.current.error).toBeTruthy();

      backend.failing.clear();
      await act(() => view.result.current.refetch());

      expect(view.result.current.error).toBeNull();
      expect(ids(view.result.current.items)).toEqual([1, 2]);
    });
  });

  describe("sharing", () => {
    it("should keep hooks of one list in sync", async () => {
      const view = renderHook(() => ({
        first: useInfiniteFetch(mode.create(client), options) as any,
        second: useInfiniteFetch(mode.create(client), options) as any,
      }));
      await waitFor(() => expect(view.result.current.second.items).toHaveLength(2));

      await act(() => view.result.current.first.fetchNextPage());

      expect(ids(view.result.current.second.items)).toEqual([1, 2, 3, 4]);
      expect(calls).toHaveLength(2);
    });

    it("should keep scopes apart", async () => {
      const view = renderHook(() => ({
        a: useInfiniteFetch(mode.create(client).setScope("a"), options) as any,
        b: useInfiniteFetch(mode.create(client).setScope("b"), options) as any,
      }));
      await waitFor(() => expect(view.result.current.a.items).toHaveLength(2));
      await waitFor(() => expect(view.result.current.b.items).toHaveLength(2));

      await act(() => view.result.current.a.fetchNextPage());

      expect(view.result.current.a.pages).toHaveLength(2);
      expect(view.result.current.b.pages).toHaveLength(1);
      expect(calls).toHaveLength(3);
    });

    it("should start over when the scope changes", async () => {
      const view = renderHook(({ scope }) => useInfiniteFetch(mode.create(client).setScope(scope), options) as any, {
        initialProps: { scope: "a" },
      });
      await waitFor(() => expect(view.result.current.items).toHaveLength(2));
      await act(() => view.result.current.fetchNextPage());

      view.rerender({ scope: "b" });

      await waitFor(() => expect(view.result.current.pages).toHaveLength(1));
      await waitFor(() => expect(view.result.current.isPreviousData).toBe(false));
      expect(ids(view.result.current.items)).toEqual([1, 2]);
    });
  });
});
