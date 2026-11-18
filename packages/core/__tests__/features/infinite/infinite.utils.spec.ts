/* eslint-disable max-params */
import type { PaginationConfig, RequestInstance } from "@hyper-fetch/core";
import {
  Client,
  getCachedPages,
  getHasNextPage,
  getHasPreviousPage,
  getInitialPageParam,
  getNextPageParam,
  getPageItems,
  getPageRequest,
  getPageTotal,
  getPaginationMode,
  getPreviousPageParam,
} from "@hyper-fetch/core";

describe("Infinite [ Utils ]", () => {
  const client = new Client({ url: "http://localhost:3000" });
  const request = client.createRequest<{ response: any; queryParams: any }>()({
    endpoint: "/posts",
  }) as RequestInstance;

  const context = (pagination: PaginationConfig, data: any, param: unknown, target: RequestInstance = request) => ({
    request: target,
    pagination,
    data,
    param,
    pages: [data],
  });

  describe("getPaginationMode", () => {
    it("should recognize every mode", () => {
      expect(getPaginationMode({ page: "page" })).toBe("page");
      expect(getPaginationMode({ offset: "offset", limit: "limit" })).toBe("offset");
      expect(getPaginationMode({ cursor: "cursor", next: "next" })).toBe("cursor");
    });

    it("should explain a missing or incomplete pagination", () => {
      expect(() => getPaginationMode(undefined as any)).toThrow('"pagination" option');
      expect(() => getPaginationMode({})).toThrow('"pagination" option');
      expect(() => getPaginationMode({ cursor: "cursor" })).toThrow('"next"');
    });
  });

  describe("getInitialPageParam", () => {
    it("should default to the start of the list", () => {
      expect(getInitialPageParam(request, { page: "page" })).toBe(1);
      expect(getInitialPageParam(request, { offset: "offset" })).toBe(0);
      expect(getInitialPageParam(request, { cursor: "cursor", next: "next" })).toBeUndefined();
    });

    it("should start from the value of the request", () => {
      expect(getInitialPageParam(request.setQueryParams({ page: 5 }), { page: "page" })).toBe(5);
      expect(getInitialPageParam(request.setQueryParams({ page: 0 }), { page: "page" })).toBe(0);
      expect(getInitialPageParam(request.setQueryParams({ page: "7" }), { page: "page" })).toBe(7);
      expect(getInitialPageParam(request.setQueryParams({ offset: 40 }), { offset: "offset" })).toBe(40);
      expect(getInitialPageParam(request.setQueryParams({ c: "abc" }), { cursor: "c", next: "next" })).toBe("abc");
    });

    it("should treat an empty cursor as the start", () => {
      expect(getInitialPageParam(request.setQueryParams({ c: "" }), { cursor: "c", next: "next" })).toBeUndefined();
    });
  });

  describe("getPageRequest", () => {
    it("should set the paging field and keep the other query params", () => {
      const page = getPageRequest(request.setQueryParams({ search: "a" }), { page: "page" }, 2);

      expect(page.queryParams).toEqual({ search: "a", page: 2 });
    });

    it("should give every page its own generated keys", () => {
      const first = getPageRequest(request, { page: "page" }, 1);
      const second = getPageRequest(request, { page: "page" }, 2);

      expect(first.cacheKey).not.toBe(second.cacheKey);
      expect(first.cacheKey).toBe(request.setQueryParams({ page: 1 }).cacheKey);
    });

    it("should return the request itself for the first cursor page", () => {
      // oxlint-disable-next-line unicorn/no-useless-undefined
      expect(getPageRequest(request, { cursor: "cursor", next: "next" }, undefined)).toBe(request);
    });

    it("should page through URL params", () => {
      const target = client.createRequest<{ response: any }>()({ endpoint: "/posts/:page" }) as RequestInstance;

      expect(getPageRequest(target, { page: "page", in: "params" }, 3).endpoint).toBe("/posts/3");
    });

    it("should separate the keys of pages sharing a custom cache key", () => {
      const target = request.setCacheKey("posts");

      const first = getPageRequest(target, { page: "page" }, 1);
      const second = getPageRequest(target, { page: "page" }, 2);

      expect(first.cacheKey).not.toBe(second.cacheKey);
      expect(first.cacheKey.startsWith("posts")).toBe(true);
    });

    it("should separate the keys of pages inside the payload", () => {
      const target = client.createRequest<{ response: any; payload: any }>()({
        endpoint: "/search",
        method: "POST",
      }) as RequestInstance;

      const first = getPageRequest(target, { page: "page", in: "payload" }, 1);
      const second = getPageRequest(target, { page: "page", in: "payload" }, 2);

      expect(first.payload).toEqual({ page: 1 });
      expect(first.cacheKey).not.toBe(second.cacheKey);
      expect(first.queryKey).not.toBe(second.queryKey);
    });
  });

  describe("getPageItems and getPageTotal", () => {
    it("should read an array response", () => {
      expect(getPageItems(context({ page: "page" }, [1, 2], 1))).toEqual([1, 2]);
    });

    it("should read a field and a function", () => {
      expect(getPageItems(context({ page: "page", items: "list" }, { list: [1] }, 1))).toEqual([1]);
      expect(getPageItems(context({ page: "page", items: ({ data }) => data.list }, { list: [2] }, 1))).toEqual([2]);
    });

    it("should not fail on data that is not a list", () => {
      expect(getPageItems(context({ page: "page" }, { nope: true }, 1))).toEqual([]);
      expect(getPageItems(context({ page: "page", items: "list" }, null, 1))).toEqual([]);
    });

    it("should read the total only when declared", () => {
      expect(getPageTotal(context({ page: "page" }, { total: 3 }, 1))).toBeNull();
      expect(getPageTotal(context({ page: "page", total: "total" }, { total: 3 }, 1))).toBe(3);
      expect(getPageTotal(context({ page: "page", total: () => 8 }, {}, 1))).toBe(8);
      expect(getPageTotal(context({ page: "page", total: "total" }, { total: "many" }, 1))).toBeNull();
    });
  });

  describe("next page", () => {
    const limited = request.setQueryParams({ limit: 2 });

    it("should increase page numbers", () => {
      expect(getNextPageParam(context({ page: "page" }, [1], 4))).toBe(5);
    });

    it("should move offsets by the limit, or by the items without one", () => {
      expect(getNextPageParam(context({ offset: "o", limit: "limit" }, [1], 4, limited))).toBe(6);
      expect(getNextPageParam(context({ offset: "o" }, [1, 2, 3], 4))).toBe(7);
    });

    it.each([null, undefined, ""])("should end a cursor list on %s", (cursor) => {
      const pagination = { cursor: "c", next: "next" };

      expect(getNextPageParam(context(pagination, { next: cursor }, "a"))).toBeUndefined();
      expect(getHasNextPage(context(pagination, { next: cursor }, "a"))).toBe(false);
    });

    it("should keep a cursor of zero", () => {
      expect(getHasNextPage(context({ cursor: "c", next: "next" }, { next: 0 }, "a"))).toBe(true);
    });

    it.each<[string, PaginationConfig, any, number, RequestInstance, boolean]>([
      ["an empty page", { page: "page" }, [], 1, request, false],
      ["a page without a known size", { page: "page" }, [1], 1, request, true],
      ["a full page", { page: "page", limit: "limit" }, [1, 2], 1, limited, true],
      ["a short page", { page: "page", limit: "limit" }, [1], 1, limited, false],
      ["pages below the total", { page: "page", limit: "limit", total: () => 5 }, [1, 2], 2, limited, true],
      ["the total reached", { page: "page", limit: "limit", total: () => 4 }, [1, 2], 2, limited, false],
      ["an offset below the total", { offset: "o", limit: "limit", total: () => 5 }, [1, 2], 2, limited, true],
      ["an offset at the total", { offset: "o", limit: "limit", total: () => 4 }, [1, 2], 2, limited, false],
    ])("should detect the end for %s", (_name, pagination, data, param, target, expected) => {
      expect(getHasNextPage(context(pagination, data, param, target))).toBe(expected);
    });

    it("should count the total from zero for lists numbered from zero", () => {
      const zero = request.setQueryParams({ page: 0, limit: 2 });
      const pagination = { page: "page", limit: "limit", total: () => 4 };

      expect(getHasNextPage(context(pagination, [1, 2], 0, zero))).toBe(true);
      expect(getHasNextPage(context(pagination, [1, 2], 1, zero))).toBe(false);
    });

    it("should prefer the hasNext override", () => {
      expect(getHasNextPage(context({ page: "page", hasNext: () => true }, [], 1))).toBe(true);
      expect(getHasNextPage(context({ page: "page", hasNext: () => false }, [1], 1))).toBe(false);
    });

    it("should not let hasNext continue a list without a next cursor", () => {
      const pagination = { cursor: "c", next: "next", hasNext: () => true };

      expect(getHasNextPage(context(pagination, { next: null }, "a"))).toBe(false);
    });
  });

  describe("previous page", () => {
    it("should stop at the first page", () => {
      expect(getPreviousPageParam(context({ page: "page" }, [], 3))).toBe(2);
      expect(getPreviousPageParam(context({ page: "page" }, [], 1))).toBeUndefined();
      expect(getHasPreviousPage(context({ page: "page" }, [], 1))).toBe(false);
    });

    it("should reach page zero only in lists numbered from zero", () => {
      const zero = request.setQueryParams({ page: 0 });

      expect(getPreviousPageParam(context({ page: "page" }, [], 1, zero))).toBe(0);
      expect(getPreviousPageParam(context({ page: "page" }, [], 0, zero))).toBeUndefined();
    });

    it("should not move offsets below zero", () => {
      const limited = request.setQueryParams({ limit: 10 });

      expect(getPreviousPageParam(context({ offset: "o", limit: "limit" }, [], 4, limited))).toBe(0);
      expect(getPreviousPageParam(context({ offset: "o", limit: "limit" }, [], 0, limited))).toBeUndefined();
    });

    it("should read the previous cursor", () => {
      const pagination = { cursor: "c", next: "next", previous: "before" };

      expect(getPreviousPageParam(context(pagination, { before: "a" }, "b"))).toBe("a");
      expect(getHasPreviousPage(context(pagination, { before: null }, "b"))).toBe(false);
      expect(getHasPreviousPage(context({ cursor: "c", next: "next" }, {}, "b"))).toBe(false);
    });

    it("should prefer the hasPrevious override", () => {
      expect(getHasPreviousPage(context({ page: "page", hasPrevious: () => false }, [], 3))).toBe(false);
    });
  });

  describe("getCachedPages", () => {
    const stored = (pages: Record<string, any>) => (pageRequest: RequestInstance) => {
      const value = pages[String((pageRequest.queryParams as any)?.page ?? (pageRequest.queryParams as any)?.c)];
      return value ? { data: value } : undefined;
    };

    it("should return nothing without the first page", () => {
      expect(getCachedPages({ request, pagination: { page: "page" }, read: () => null })).toEqual([]);
    });

    it("should walk forwards until a page is missing", () => {
      const pages = getCachedPages({
        request,
        pagination: { page: "page" },
        read: stored({ 1: [1], 2: [2], 4: [4] }),
      });

      expect(pages.map((page) => page.param)).toEqual([1, 2]);
    });

    it("should walk in both directions from the starting page", () => {
      const pages = getCachedPages({
        request: request.setQueryParams({ page: 3 }),
        pagination: { page: "page" },
        read: stored({ 2: [2], 3: [3], 4: [4] }),
      });

      expect(pages.map((page) => page.param)).toEqual([2, 3, 4]);
    });

    it("should stop at the end of the list", () => {
      const pages = getCachedPages({
        request,
        pagination: { page: "page" },
        read: stored({ 1: [1], 2: [], 3: [3] }),
      });

      expect(pages.map((page) => page.param)).toEqual([1, 2]);
    });

    it("should respect maxPages", () => {
      const pages = getCachedPages({
        request,
        pagination: { page: "page" },
        maxPages: 2,
        read: stored({ 1: [1], 2: [2], 3: [3] }),
      });

      expect(pages).toHaveLength(2);
    });

    it("should not loop over cursors pointing back at each other", () => {
      const pages = getCachedPages({
        request: request.setQueryParams({ c: "a" }),
        pagination: { cursor: "c", next: "next", previous: "before" },
        read: stored({ a: { next: "b", before: "b" }, b: { next: "a", before: "a" } }),
      });

      expect(pages.map((page) => page.param)).toEqual(["a", "b"]);
    });
  });
});
