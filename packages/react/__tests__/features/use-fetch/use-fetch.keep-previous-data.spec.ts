import { createHttpMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/react";

import { createRequest, renderUseFetch, client } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ keepPreviousData ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    vi.resetModules();
    client.clear();
  });

  describe('when keepPreviousData is "auto" (default)', () => {
    it("should clear state when URL params change (different resource)", async () => {
      const request = createRequest({ endpoint: "/users/:userId" });

      const requestA = request.setParams({ userId: "1" });
      mockRequest(requestA, { data: { name: "Alice" } });

      const view = renderUseFetch(requestA, { keepPreviousData: "auto" });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ name: "Alice" });
      });

      const requestB = request.setParams({ userId: "2" });
      mockRequest(requestB, { data: { name: "Bob" }, delay: 100 });

      view.rerender({ request: requestB });

      await waitFor(() => {
        expect(view.result.current.data).toBeNull();
        expect(view.result.current.loading).toBe(true);
      });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ name: "Bob" });
      });
    });

    it("should preserve state when only query params change (pagination)", async () => {
      const request = createRequest({ endpoint: "/items" });

      const requestPage1 = request.setQueryParams({ page: "1" } as any);
      mockRequest(requestPage1, { data: { items: [1, 2, 3] } });

      const view = renderUseFetch(requestPage1, { keepPreviousData: "auto" });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ items: [1, 2, 3] });
      });

      const requestPage2 = request.setQueryParams({ page: "2" } as any);
      mockRequest(requestPage2, { data: { items: [4, 5, 6] }, delay: 100 });

      view.rerender({ request: requestPage2 });

      // Should preserve previous data while loading
      expect(view.result.current.data).toStrictEqual({ items: [1, 2, 3] });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ items: [4, 5, 6] });
      });
    });
  });

  describe('when keepPreviousData is "preserve"', () => {
    it("should keep previous data even when URL params change", async () => {
      const request = createRequest({ endpoint: "/users/:userId" });

      const requestA = request.setParams({ userId: "1" });
      mockRequest(requestA, { data: { name: "Alice" } });

      const view = renderUseFetch(requestA, { keepPreviousData: "preserve" });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ name: "Alice" });
      });

      const requestB = request.setParams({ userId: "2" });
      mockRequest(requestB, { data: { name: "Bob" }, delay: 100 });

      view.rerender({ request: requestB });

      // Should preserve previous data
      expect(view.result.current.data).toStrictEqual({ name: "Alice" });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ name: "Bob" });
      });
    });

    it("should keep previous data when query params change", async () => {
      const request = createRequest({ endpoint: "/items" });

      const requestPage1 = request.setQueryParams({ page: "1" } as any);
      mockRequest(requestPage1, { data: { items: [1] } });

      const view = renderUseFetch(requestPage1, { keepPreviousData: "preserve" });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ items: [1] });
      });

      const requestPage2 = request.setQueryParams({ page: "2" } as any);
      mockRequest(requestPage2, { data: { items: [2] }, delay: 100 });

      view.rerender({ request: requestPage2 });

      expect(view.result.current.data).toStrictEqual({ items: [1] });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ items: [2] });
      });
    });
  });

  describe('when keepPreviousData is "clean"', () => {
    it("should clear state when URL params change", async () => {
      const request = createRequest({ endpoint: "/users/:userId" });

      const requestA = request.setParams({ userId: "1" });
      mockRequest(requestA, { data: { name: "Alice" } });

      const view = renderUseFetch(requestA, { keepPreviousData: "clean" });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ name: "Alice" });
      });

      const requestB = request.setParams({ userId: "2" });
      mockRequest(requestB, { data: { name: "Bob" }, delay: 100 });

      view.rerender({ request: requestB });

      await waitFor(() => {
        expect(view.result.current.data).toBeNull();
        expect(view.result.current.loading).toBe(true);
      });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ name: "Bob" });
      });
    });

    it("should clear state when query params change", async () => {
      const request = createRequest({ endpoint: "/items" });

      const requestPage1 = request.setQueryParams({ page: "1" } as any);
      mockRequest(requestPage1, { data: { items: [1] } });

      const view = renderUseFetch(requestPage1, { keepPreviousData: "clean" });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ items: [1] });
      });

      const requestPage2 = request.setQueryParams({ page: "2" } as any);
      mockRequest(requestPage2, { data: { items: [2] }, delay: 100 });

      view.rerender({ request: requestPage2 });

      await waitFor(() => {
        expect(view.result.current.data).toBeNull();
        expect(view.result.current.loading).toBe(true);
      });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ items: [2] });
      });
    });
  });

  describe("default behavior (no option specified)", () => {
    it('should default to "auto" mode', async () => {
      const request = createRequest({ endpoint: "/users/:userId" });

      const requestA = request.setParams({ userId: "1" });
      mockRequest(requestA, { data: { name: "Alice" } });

      const view = renderUseFetch(requestA);

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ name: "Alice" });
      });

      const requestB = request.setParams({ userId: "2" });
      mockRequest(requestB, { data: { name: "Bob" }, delay: 100 });

      view.rerender({ request: requestB });

      // Auto mode should clear for param changes
      await waitFor(() => {
        expect(view.result.current.data).toBeNull();
      });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ name: "Bob" });
      });
    });
  });
});
