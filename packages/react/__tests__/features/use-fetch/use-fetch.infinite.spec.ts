import { renderHook } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useRef } from "react";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type Page = { page: number; items: number[] };

const pageData = (page: number): Page => ({ page, items: [page * 10, page * 10 + 1] });

describe("useFetch [ Infinite ]", () => {
  // All pages share one queue, so switching the page cancels the request of the previous one
  const createPagesRequest = () =>
    createRequest<Page, any, "/feed">({ endpoint: "/feed", cancelable: true, queryKey: "feed" });

  let request = createPagesRequest();
  let calls = gateRequest(request);

  const callFor = (page: number) => {
    const call = calls.findLast((item) => item.request.queryParams?.page === page);
    if (!call) {
      throw new Error(`Request for page ${page} was not sent`);
    }
    return call;
  };

  /** Infinite list built on top of useFetch - every loaded page is appended to the list */
  const renderInfinite = (options?: { revalidate?: boolean }) => {
    return renderHook(
      ({ page }) => {
        const pages = useRef(new Map<number, Page>());
        const { data, loading, error } = useFetch(request.setQueryParams({ page }), {
          keepPreviousData: "preserve",
          ...options,
        });
        if (data) {
          pages.current.set(data.page, data);
        }
        const items = [...pages.current.values()].toSorted((a, b) => a.page - b.page).flatMap((item) => item.items);
        return { items, loading, error };
      },
      { initialProps: { page: 1 } },
    );
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createPagesRequest();
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when request query params are changed", () => {
    it("should allow to cancel previous request on switching pages during requests", async () => {
      const { rerender, result } = renderInfinite();
      await advance();
      rerender({ page: 2 });
      await advance();

      // Late answer of the canceled request
      callFor(1).succeed(pageData(1));
      await settle();

      expect(result.current.items).toStrictEqual([]);
      expect(client.cache.get(request.setQueryParams({ page: 1 }).cacheKey)).toBeUndefined();

      callFor(2).succeed(pageData(2));
      await settle();

      expect(result.current.items).toStrictEqual(pageData(2).items);
      expect(result.current.loading).toBeFalse();
    });
    it("should use cached pages on mounting", async () => {
      setCacheResponse(request.setQueryParams({ page: 1 }), pageData(1));

      const { result } = renderInfinite({ revalidate: false });
      await advance();

      expect(result.current.items).toStrictEqual(pageData(1).items);
      expect(result.current.loading).toBeFalse();
      expect(calls).toHaveLength(0);
    });
    it("should automatically generate request cacheKey for paginated views", async () => {
      const keys = [1, 2, 3].map((page) => request.setQueryParams({ page }).cacheKey);
      const queueKeys = [1, 2, 3].map((page) => request.setQueryParams({ page }).queryKey);

      expect(new Set(keys).size).toBe(3);
      expect(new Set(queueKeys)).toStrictEqual(new Set(["feed"]));
    });
    it("should not remove previous page data until current is fetched", async () => {
      const { rerender, result } = renderInfinite();
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();

      rerender({ page: 2 });
      await advance();

      expect(result.current.items).toStrictEqual(pageData(1).items);
      expect(result.current.loading).toBeTrue();

      callFor(2).succeed(pageData(2));
      await settle();

      expect(result.current.items).toStrictEqual([...pageData(1).items, ...pageData(2).items]);
      expect(result.current.loading).toBeFalse();
    });
    it("should append every loaded page in order", async () => {
      const { rerender, result } = renderInfinite();
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();

      for (const page of [2, 3, 4]) {
        rerender({ page });
        // eslint-disable-next-line no-await-in-loop
        await advance();
        callFor(page).succeed(pageData(page));
        // eslint-disable-next-line no-await-in-loop
        await settle();
      }

      expect(result.current.items).toStrictEqual([1, 2, 3, 4].flatMap((page) => pageData(page).items));
    });
    it("should keep the loaded pages when the next page fails", async () => {
      const { rerender, result } = renderInfinite();
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();

      rerender({ page: 2 });
      await advance();
      callFor(2).fail(new Error("Page failed"));
      await settle();

      expect(result.current.items).toStrictEqual(pageData(1).items);
      expect(result.current.error?.message).toBe("Page failed");
      expect(result.current.loading).toBeFalse();
    });
  });
});
