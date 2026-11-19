import { renderHook } from "@testing-library/react";
import type { UseFetchOptionsType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type Page = { page: number; items: string[] };

const pageData = (page: number): Page => ({ page, items: [`item-${page}-a`, `item-${page}-b`] });

describe("useFetch [ Pagination ]", () => {
  let request = createRequest<Page, any, "/posts">({ endpoint: "/posts" });
  let calls = gateRequest(request);

  const callFor = (page: number) => {
    const call = calls.findLast((item) => item.request.queryParams?.page === page);
    if (!call) {
      throw new Error(`Request for page ${page} was not sent`);
    }
    return call;
  };

  const renderPage = (options?: UseFetchOptionsType<ReturnType<(typeof request)["setQueryParams"]>>) => {
    const renders: { page: number; data: Page | null; loading: boolean }[] = [];
    const view = renderHook(
      ({ page }) => {
        const { data, loading } = useFetch(request.setQueryParams({ page }), options);
        renders.push({ page, data, loading });
        return { data, loading };
      },
      { initialProps: { page: 1 } },
    );
    return { ...view, renders };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<Page, any, "/posts">({ endpoint: "/posts" });
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when request query params are changed", () => {
    it("should allow to see previous results until new page is loaded", async () => {
      const { rerender, result } = renderPage();
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();

      rerender({ page: 2 });
      await advance();

      expect(result.current).toStrictEqual({ data: pageData(1), loading: true });

      callFor(2).succeed(pageData(2));
      await settle();

      expect(result.current).toStrictEqual({ data: pageData(2), loading: false });
    });
    it("should never render an empty page between the pages", async () => {
      const { rerender, renders } = renderPage();
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();

      for (const page of [2, 3]) {
        rerender({ page });
        // eslint-disable-next-line no-await-in-loop
        await advance();
        callFor(page).succeed(pageData(page));
        // eslint-disable-next-line no-await-in-loop
        await settle();
      }

      expect(renders.slice(1).every((render) => render.data !== null)).toBeTrue();
    });
    it("should not override previous results by initialData", async () => {
      const initialResponse = { data: { page: 0, items: ["initial"] } };
      const { rerender, result } = renderPage({ initialResponse });
      expect(result.current.data).toStrictEqual(initialResponse.data);
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();

      rerender({ page: 2 });
      await advance();

      expect(result.current.data).toStrictEqual(pageData(1));

      callFor(2).succeed(pageData(2));
      await settle();

      expect(result.current.data).toStrictEqual(pageData(2));
    });
    it("should cache pages on change", async () => {
      const { rerender } = renderPage();
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();
      rerender({ page: 2 });
      await advance();
      callFor(2).succeed(pageData(2));
      await settle();

      expect(client.cache.get(request.setQueryParams({ page: 1 }).cacheKey)?.data).toStrictEqual(pageData(1));
      expect(client.cache.get(request.setQueryParams({ page: 2 }).cacheKey)?.data).toStrictEqual(pageData(2));
    });
    it("should show the cached page right away when going back", async () => {
      const { rerender, renders } = renderPage({ revalidate: false });
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();
      rerender({ page: 2 });
      await advance();
      callFor(2).succeed(pageData(2));
      await settle();

      rerender({ page: 1 });
      await advance();

      expect(renders.findLast((render) => render.page === 1)).toStrictEqual({
        page: 1,
        data: pageData(1),
        loading: false,
      });
      expect(calls).toHaveLength(2);
    });
    it("should replace the previous page with the error state when the new page fails", async () => {
      const { rerender } = renderPage();
      const errors = renderHook(
        ({ page }) => {
          const { data, error } = useFetch(request.setQueryParams({ page }));
          return { data, error: error?.message ?? null };
        },
        { initialProps: { page: 1 } },
      );
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();

      rerender({ page: 2 });
      errors.rerender({ page: 2 });
      await advance();
      callFor(2).fail(new Error("Page failed"));
      await settle();

      expect(errors.result.current).toStrictEqual({ data: null, error: "Page failed" });
    });
    it('should clear the previous page in the "clean" mode', async () => {
      const { rerender, result } = renderPage({ keepPreviousData: "clean" });
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();

      rerender({ page: 2 });

      expect(result.current).toStrictEqual({ data: null, loading: true });
    });
    it("should use the page prefetched before the change", async () => {
      setCacheResponse(request.setQueryParams({ page: 2 }), pageData(2));
      const { rerender, result } = renderPage({ revalidate: false });
      await advance();
      callFor(1).succeed(pageData(1));
      await settle();

      rerender({ page: 2 });

      expect(result.current).toStrictEqual({ data: pageData(2), loading: false });
      expect(calls).toHaveLength(1);
    });
  });
});
