import { createClient } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { renderUseTrackedState } from "../../../utils";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("useTrackedState [ Actions ]", () => {
  let client = createClient({ url: "http://localhost:3000" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "test" });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
    jest.resetModules();
    jest.resetAllMocks();
    client.clear();
  });

  beforeEach(() => {
    client = createClient({ url: "http://localhost:3000" });
    request = client.createRequest<{ response: any }>()({ endpoint: "test" });
    request.setMock(() => {
      return {
        data: 123,
        status: 200,
      };
    });
  });

  describe("when updating the local state", () => {
    it("should allow to set data", async () => {
      const value = { test: 1 };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setData(value, false);
      });

      expect(result.current[0].data).toBe(value);
    });
    it("should allow to set error", async () => {
      const value = { test: 1 };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setError(value as unknown as Error, false);
      });

      expect(result.current[0].error).toBe(value);
    });
    it("should allow to set loading", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setLoading(true, false);
      });

      expect(result.current[0].loading).toBeTrue();
    });
    it("should allow to set status", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setStatus(900, false);
      });

      expect(result.current[0].status).toBe(900);
    });
    it("should allow to set success", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setSuccess(false, false);
      });

      await waitFor(() => {
        expect(result.current[0].success).toBe(false);
      });
    });
    it("should allow to set extra", async () => {
      const extra = { headers: { test: "1" } };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setExtra(extra, false);
      });

      await waitFor(() => {
        expect(result.current[0].extra).toBe(extra);
      });
    });
    it("should allow to set response timestamp", async () => {
      const value = new Date();
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setResponseTimestamp(value, false);
      });

      expect(result.current[0].responseTimestamp).toBe(value);
    });
    it("should allow to set request timestamp", async () => {
      const value = new Date();
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRequestTimestamp(value, false);
      });

      expect(result.current[0].requestTimestamp).toBe(value);
    });
    it("should allow to set retries", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRetries(999, false);
      });

      expect(result.current[0].retries).toBe(999);
    });
  });
  describe("when updating the cache state", () => {
    it("should allow to set data", async () => {
      const spy = jest.spyOn(request.client.cache, "update");
      const value = { test: 1 };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setData(value, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set error", async () => {
      const spy = jest.spyOn(request.client.cache, "update");
      const value = { test: 1 };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setError(value as unknown as Error, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set loading", async () => {
      const spy = jest.spyOn(request.client.requestManager.events, "emitLoading");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setLoading(true, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set status", async () => {
      const spy = jest.spyOn(request.client.cache, "update");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setStatus(900, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set success", async () => {
      const spy = jest.spyOn(request.client.cache, "update");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setSuccess(false, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set extra", async () => {
      const extra = { headers: { test: "1" } };
      const spy = jest.spyOn(request.client.cache, "update");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setExtra(extra, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set response timestamp", async () => {
      const spy = jest.spyOn(request.client.cache, "update");
      const value = new Date();
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setResponseTimestamp(value, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set request timestamp", async () => {
      const spy = jest.spyOn(request.client.cache, "update");
      const value = new Date();
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRequestTimestamp(value, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should allow to set retries", async () => {
      const spy = jest.spyOn(request.client.cache, "update");
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRetries(999, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
  describe("when using setData action", () => {
    it("should update cache with direct value when emitToHooks is true", async () => {
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
  describe("when using setError action", () => {
    it("should update cache with direct error value when emitToCache is true", async () => {
      const { result } = renderUseTrackedState(request);
      const testError = new Error("test error");

      const spy = jest.spyOn(request.client.cache, "update");

      act(() => {
        result.current[1].setError(testError, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    it("should handle null previous error in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setError((prev: Error | null) => {
          expect(prev).toBe(null);
          return new Error("new error");
        }, true);
      });

      expect(result.current[0].error).toBeInstanceOf(Error);
      expect(result.current[0].success).toBe(false);
    });

    it("should not update cache when emitToCache is false", async () => {
      const { result } = renderUseTrackedState(request);
      const initialError = new Error("initial error");

      // Set initial error in cache
      act(() => {
        result.current[1].setError(initialError, true);
      });

      // Update local state only
      const newError = new Error("new error");
      act(() => {
        result.current[1].setError(newError, false);
      });

      // Cache should retain initial error
      const cacheData = request.client.cache.get(request.cacheKey);
      expect(cacheData).toBe(undefined);
      // Local state should have new error
      expect(result.current[0].error).toBe(newError);
    });
  });
  describe("when using setLoading action", () => {
    it("should update loading state with direct value when emitToHooks is true", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.requestManager.events, "emitLoading");

      act(() => {
        result.current[1].setLoading(true, true);
      });

      expect(result.current[0].loading).toBe(true);
      expect(spy).toHaveBeenCalledWith({
        request,
        requestId: "",
        loading: true,
        isRetry: false,
        isOffline: false,
      });
    });

    it("should update loading state with function value when emitToHooks is true", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.requestManager.events, "emitLoading");

      act(() => {
        result.current[1].setLoading((prev) => !prev, true);
      });

      expect(result.current[0].loading).toBe(true);
      expect(spy).toHaveBeenCalledWith({
        request,
        requestId: "",
        loading: true,
        isRetry: false,
        isOffline: false,
      });
    });

    it("should not emit loading event when emitToHooks is false", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.requestManager.events, "emitLoading");

      act(() => {
        result.current[1].setLoading(true, false);
      });

      expect(result.current[0].loading).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });
  });
  describe("when using setStatus action", () => {
    it("should update cache with direct status value when emitToCache is true", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");

      act(() => {
        result.current[1].setStatus(500, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(result.current[0].status).toBe(500);
      });
    });

    it("should update cache with function status value when emitToCache is true", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");

      act(() => {
        result.current[1].setStatus((prev: number | null) => (prev || 200) + 100, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(result.current[0].status).toBe(300);
      });
    });

    it("should handle null previous status in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setStatus((prev: number | null) => {
          expect(prev).toBe(null);
          return 404;
        }, true);
      });

      expect(result.current[0].status).toBe(404);
    });

    it("should not update cache when emitToCache is false", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");

      // First set initial status in cache
      act(() => {
        result.current[1].setStatus(200, true);
      });

      // Then update state without emitting to cache
      act(() => {
        result.current[1].setStatus(404, false);
      });

      // Cache update should only be called once (for the first update)
      expect(spy).toHaveBeenCalledTimes(1);
      // Local state should have the new value
      expect(result.current[0].status).toBe(404);
    });
  });
  describe("when using setSuccess action", () => {
    it("should update cache with direct success value when emitToCache is true", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");

      act(() => {
        result.current[1].setSuccess(true, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(result.current[0].success).toBe(true);
      });
    });

    it("should update cache with function success value when emitToCache is true", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");

      act(() => {
        result.current[1].setSuccess((prev) => !prev, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(result.current[0].success).toBe(true);
      });
    });

    it("should handle null previous success in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setSuccess((prev) => {
          expect(prev).toBe(false);
          return true;
        }, true);
      });

      expect(result.current[0].success).toBe(true);
    });
  });
  describe("when using setExtra action", () => {
    it("should update cache with direct extra value when emitToCache is true", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");
      const extraValue = { count: 1 };

      act(() => {
        result.current[1].setExtra(extraValue, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(result.current[0].extra).toEqual(extraValue);
      });
    });

    it("should update cache with function extra value when emitToCache is true", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");
      const initialExtra = { count: 1 };

      act(() => {
        result.current[1].setExtra(initialExtra, true);
      });

      act(() => {
        result.current[1].setExtra(() => ({ count: 2 }), true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
        expect(result.current[0].extra).toEqual({ count: 2 });
      });
    });

    it("should handle null previous extra in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setExtra((prev: null | Record<string, any>) => {
          expect(prev).not.toStrictEqual({ count: 1 });
          return { count: 1 };
        }, true);
      });

      expect(result.current[0].extra).toEqual({ count: 1 });
    });
  });
  describe("when using setRetries action", () => {
    it("should update cache with function retries value when emitToCache is true", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");

      act(() => {
        result.current[1].setRetries((prev) => (prev || 0) + 1, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(result.current[0].retries).toBe(1);
      });
    });

    it("should handle initial retries value in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRetries((prev) => {
          expect(prev).toBe(0);
          return 5;
        }, true);
      });

      expect(result.current[0].retries).toBe(5);
    });
  });
  describe("when using setResponseTimestamp action", () => {
    it("should update cache with function value when emitToCache is true", async () => {
      await request.send();
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");
      const initialDate = new Date();
      const laterDate = new Date(initialDate.getTime() + 1000);

      // First set initial timestamp
      act(() => {
        result.current[1].setResponseTimestamp(initialDate, true);
      });

      // Then update with function
      act(() => {
        result.current[1].setResponseTimestamp((prev: Date | null) => {
          expect(prev).toEqual(initialDate);
          return laterDate;
        }, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(+result.current[0].responseTimestamp!).toBe(+laterDate);
      });
    });

    it("should handle null previous responseTimestamp in function updates", async () => {
      const { result } = renderUseTrackedState(request);
      const newDate = new Date();

      act(() => {
        result.current[1].setResponseTimestamp((prev: Date | null) => {
          expect(prev).toBe(null);
          return newDate;
        }, true);
      });

      expect(result.current[0].responseTimestamp).toBe(newDate);
    });

    it("should handle undefined responseTimestamp in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setResponseTimestamp((prev: Date | null) => {
          expect(prev).toBe(null);
          return undefined as any;
        }, true);
      });

      expect(result.current[0].responseTimestamp).toBe(undefined);
    });

    it("should handle string date conversion in function updates", async () => {
      const { result } = renderUseTrackedState(request);
      const dateStr = "2024-01-01T00:00:00.000Z";
      const expectedDate = new Date(dateStr);

      act(() => {
        result.current[1].setResponseTimestamp(expectedDate, true);
      });

      expect(+result.current[0].responseTimestamp!).toBe(+expectedDate);
    });

    it("should handle converting previous string date in function updates", async () => {
      const reqNoGarbageCollection = request.setCacheTime(Infinity);
      await reqNoGarbageCollection.send();
      const { result } = renderUseTrackedState(reqNoGarbageCollection);
      const initialDateStr = "2024-01-01T00:00:00.000Z";
      const expectedInitialDate = new Date(initialDateStr);
      const laterDate = new Date(expectedInitialDate.getTime() + 1000);

      // First set a string date
      act(() => {
        result.current[1].setResponseTimestamp(expectedInitialDate, true);
      });

      await waitFor(() => {
        expect(result.current[0].responseTimestamp).toBe(expectedInitialDate);
      });

      // Then update with function that receives the converted date
      act(() => {
        result.current[1].setResponseTimestamp((prev: Date | null) => {
          expect(+prev!).toBe(+expectedInitialDate);
          return laterDate;
        }, true);
      });

      expect(+result.current[0].responseTimestamp!).toBe(+laterDate);
    });
  });
  describe("when using setRequestTimestamp action", () => {
    it("should update cache with function value when emitToCache is true", async () => {
      const reqNoGarbageCollection = request.setCacheTime(Infinity);
      await reqNoGarbageCollection.send();
      const { result } = renderUseTrackedState(reqNoGarbageCollection);
      const spy = jest.spyOn(request.client.cache, "update");
      const initialDate = new Date();
      const laterDate = new Date(initialDate.getTime() + 1000);

      // First set initial timestamp
      act(() => {
        result.current[1].setRequestTimestamp(initialDate, true);
      });

      // Then update with function
      act(() => {
        result.current[1].setRequestTimestamp((prev: Date | null) => {
          expect(prev).toEqual(initialDate);
          return laterDate;
        }, true);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
        expect(+result.current[0].requestTimestamp!).toBe(+laterDate);
      });
    });

    it("should handle null previous requestTimestamp in function updates", async () => {
      const { result } = renderUseTrackedState(request);
      const newDate = new Date();

      act(() => {
        result.current[1].setRequestTimestamp((prev: Date | null) => {
          expect(prev).toBe(null);
          return newDate;
        }, true);
      });

      expect(result.current[0].requestTimestamp).toBe(newDate);
    });

    it("should use true as default value for emitToCache parameter", async () => {
      const reqNoGarbageCollection = request.setCacheTime(Infinity);
      await reqNoGarbageCollection.send();
      const { result } = renderUseTrackedState(reqNoGarbageCollection);
      const spy = jest.spyOn(request.client.cache, "update");
      const newDate = new Date();

      act(() => {
        // Call setRequestTimestamp without the emitToCache parameter
        result.current[1].setRequestTimestamp(newDate);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        // Verify the cache was updated with the new timestamp
        const cacheData = request.client.cache.get(request.cacheKey);
        expect(cacheData?.requestTimestamp).toBeDefined();
      });
    });
  });
  describe("when using default emit parameters", () => {
    it("should use true as default value for all emit parameters", async () => {
      const { result } = renderUseTrackedState(request);
      const cacheSpy = jest.spyOn(request.client.cache, "update");
      const loadingSpy = jest.spyOn(request.client.requestManager.events, "emitLoading");

      // Test all setters without emit parameters
      act(() => {
        result.current[1].setData({ test: 1 });
        result.current[1].setError(new Error("test"));
        result.current[1].setLoading(true);
        result.current[1].setStatus(200);
        result.current[1].setSuccess(true);
        result.current[1].setExtra({ test: 1 });
        result.current[1].setRetries(1);
        result.current[1].setResponseTimestamp(new Date());
        result.current[1].setRequestTimestamp(new Date());
      });

      await waitFor(() => {
        // Cache update should be called for all setters except setLoading
        expect(cacheSpy).toHaveBeenCalledTimes(8);
        // Loading event should be emitted once
        expect(loadingSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
