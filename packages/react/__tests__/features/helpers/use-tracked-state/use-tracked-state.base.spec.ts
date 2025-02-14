import { createClient, xhrExtra } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { initialState } from "helpers";
import { renderUseTrackedState } from "../../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useTrackingState [ Events ]", () => {
  let client = createClient({ url: "http://localhost:3000" });
  let request = client.createRequest<{ response: any }>()({
    endpoint: "/test",
  });

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
    jest.resetModules();
    client = createClient({ url: "http://localhost:3000" });
    request = client.createRequest<{ response: any }>()({
      endpoint: "/test",
    });
  });

  describe("given state is initialized", () => {
    describe("when cache is empty", () => {
      it("should init with default data", async () => {
        const { result } = renderUseTrackedState(request);

        expect(result.current[0].data).toBe(initialState.data);
        expect(result.current[0].error).toBe(initialState.error);
        expect(result.current[0].status).toBe(initialState.status);
        expect(result.current[0].success).toBe(initialState.success);
        expect(result.current[0].extra).toStrictEqual(request.client.defaultExtra);
        expect(result.current[0].retries).toBe(0);
        expect(result.current[0].loading).toBe(initialState.loading);
      });
    });
  });
  describe("given dependency tracking is active", () => {
    describe("when updating the state values and dependency tracking is on", () => {
      it("should not rerender hook when deep equal values are the same", async () => {
        const { result } = renderUseTrackedState(request, { dependencyTracking: true });
        const renderCount = { value: 0 };

        // Track data changes
        act(() => {
          result.current[2].setRenderKey("data");
        });

        // Set same data twice
        act(() => {
          result.current[2].setCacheData({
            data: { test: "value" },
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        const firstRenderData = result.current[0].data;
        renderCount.value += 1;

        act(() => {
          result.current[2].setCacheData({
            data: { test: "value" },
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(result.current[0].data).toEqual(firstRenderData);
      });
      it("should rerender component when attribute is used", async () => {
        const { result } = renderUseTrackedState(request, { dependencyTracking: true });

        // Track data changes
        act(() => {
          result.current[2].setRenderKey("data");
        });

        const initialData = result.current[0].data;

        act(() => {
          result.current[2].setCacheData({
            data: "new-data",
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(result.current[0].data).not.toEqual(initialData);
        expect(result.current[0].data).toBe("new-data");
      });
      it("should not rerender component when attribute is not used", async () => {
        const { result } = renderUseTrackedState(request, { dependencyTracking: true });

        // Only track error changes
        act(() => {
          result.current[2].setRenderKey("error");
        });

        const initialData = result.current[0].data;

        act(() => {
          result.current[2].setCacheData({
            data: "new-data",
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        // Data should not change since we're only tracking error
        expect(result.current[0].data).toEqual(initialData);
      });
    });
  });
  describe("given dependency tracking is off", () => {
    describe("when updating the state values", () => {
      it("should rerender on any attribute change", async () => {
        const { result } = renderUseTrackedState(request, { dependencyTracking: false });

        const initialData = result.current[0].data;

        act(() => {
          result.current[2].setCacheData({
            data: "new-data",
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(result.current[0].data).not.toEqual(initialData);
        expect(result.current[0].data).toBe("new-data");
      });
    });
  });
  describe("given request is mapping response", () => {
    describe("when receiving data", () => {
      it("should map the data", async () => {
        const { result } = renderUseTrackedState(
          request.setResponseMapper((response) => {
            return { ...response, data: "new-data" };
          }),
        );

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: true as any,
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(result.current[0].data).toBe("new-data");
        expect(result.current[0].error).toBe(null);
      });

      it("should map the cache data", async () => {
        mockRequest(request);

        await act(async () => {
          await request.send({});
        });

        const { result, rerender } = renderUseTrackedState(
          request.setResponseMapper((response) => {
            return { ...response, data: "new-data" };
          }),
        );

        act(() => {
          rerender();
        });

        expect(result.current[0].data).toBe("new-data");
        expect(result.current[0].error).toBe(null);
      });

      it("should map the async data", async () => {
        const { result } = renderUseTrackedState(
          request.setResponseMapper(async (response) => {
            return Promise.resolve({ ...response, data: "new-data" });
          }),
        );

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: true as any,
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(result.current[0]).toStrictEqual(expect.objectContaining({ ...initialState, extra: xhrExtra }));

        await waitFor(() => {
          expect(result.current[0].data).toBe("new-data");
          expect(result.current[0].error).toBe(null);
        });
      });
    });
    describe("when deepCompare is function", () => {
      it("should trigger with two values", async () => {
        const customDeepCompare = jest.fn().mockImplementation(() => true);
        const { result } = renderUseTrackedState(request, { deepCompare: customDeepCompare });

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: "test-data",
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(customDeepCompare).toHaveBeenCalledWith(null, "test-data");
      });
    });
    describe("when handling async response mapping", () => {
      it("should handle async response mapper rejection", async () => {
        const { result } = renderUseTrackedState(
          request.setResponseMapper(async (response) => {
            await sleep(1000);
            return response;
          }),
        );

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: true as any,
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        // Initial state should be maintained while processing
        expect(result.current[0]).toStrictEqual(expect.objectContaining({ ...initialState, extra: xhrExtra }));

        // Wait for the error to be processed
        await expect(async () => {
          await waitFor(() => {
            expect(result.current[0].data).toBe(true);
          });
        }).not.toThrow();
      });

      it("should handle concurrent async response mapping", async () => {
        let resolveFirst: (value: any) => void;
        let resolveSecond: (value: any) => void;

        const firstPromise = new Promise((resolve) => {
          resolveFirst = resolve;
        });
        const secondPromise = new Promise((resolve) => {
          resolveSecond = resolve;
        });

        let mapperCallCount = 0;
        const { result } = renderUseTrackedState(
          request.setResponseMapper(async (response) => {
            mapperCallCount += 1;
            if (mapperCallCount === 1) {
              return firstPromise.then(() => ({ ...response, data: "first-data" }));
            }
            return secondPromise.then(() => ({ ...response, data: "second-data" }));
          }),
        );

        // Set first data
        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: "initial" as any,
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        // Set second data before first resolves
        act(() => {
          result.current[2].setCacheData({
            data: "newer" as any,
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        // Resolve promises in reverse order
        act(() => {
          resolveSecond({});
        });

        await waitFor(() => {
          expect(result.current[0].data).toBe("second-data");
        });

        act(() => {
          resolveFirst({});
        });

        // Should still show second data since it was the last update
        await waitFor(() => {
          expect(result.current[0].data).toBe("second-data");
        });
      });
    });
  });
  describe("given custom deepCompare option is passed", () => {
    describe("when deepCompare is function", () => {
      it("should allow to use custom deepCompare", async () => {
        const deepCompare = jest.fn().mockImplementation(() => false);
        const { result } = renderUseTrackedState(request, { deepCompare, dependencyTracking: true });

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: true,
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(deepCompare).toHaveBeenCalled();
        expect(result.current[0].data).toBeTrue();
      });
    });
    describe("when deepCompare is false", () => {
      it("should not compare values", async () => {
        const { result } = renderUseTrackedState(request, { deepCompare: false, dependencyTracking: true });

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: true,
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(result.current[0].data).toBeTrue();
      });
    });
  });
  describe("given cache updates", () => {
    describe("when using setData action", () => {
      it("should update cache with direct value when emitToHooks is true", async () => {
        mockRequest(request);
        await request.send();
        const { result } = renderUseTrackedState(request);

        act(() => {
          result.current[1].setData("new-value", true);
        });

        // Get the actual cache value
        const cacheData = request.client.cache.get(request.cacheKey);
        expect(cacheData?.data).toBe("new-value");
      });

      it("should update cache with function value when emitToHooks is true", async () => {
        mockRequest(request);
        await request.send();
        const { result } = renderUseTrackedState(request);

        // First set some initial data
        act(() => {
          result.current[1].setData("initial-value", true);
        });

        // Then update with function
        act(() => {
          result.current[1].setData((prev: any) => `${prev}-updated`, true);
        });

        // Get the actual cache value
        const cacheData = request.client.cache.get(request.cacheKey);
        expect(cacheData?.data).toBe("initial-value-updated");
      });

      it("should not update cache when emitToHooks is false", async () => {
        mockRequest(request);
        await request.send();
        const { result } = renderUseTrackedState(request);

        // First set some initial data in cache
        act(() => {
          result.current[1].setData("initial-value", true);
        });

        // Then update state without emitting to hooks
        act(() => {
          result.current[1].setData("new-value", false);
        });

        // Cache should retain the initial value
        const cacheData = request.client.cache.get(request.cacheKey);
        expect(cacheData?.data).toBe("initial-value");
        // Local state should have the new value
        expect(result.current[0].data).toBe("new-value");
      });

      it("should handle null previous data in function updates", async () => {
        const { result } = renderUseTrackedState(request);

        act(() => {
          result.current[1].setData((prev: any) => {
            expect(prev).toBe(null);
            return "new-value";
          }, true);
        });

        const cacheData = request.client.cache.get(request.cacheKey);
        expect(cacheData?.data).toBeUndefined();
        expect(result.current[0].data).toBe("new-value");
      });
    });
  });
});
