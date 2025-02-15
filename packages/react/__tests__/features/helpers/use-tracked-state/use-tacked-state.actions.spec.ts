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
});
