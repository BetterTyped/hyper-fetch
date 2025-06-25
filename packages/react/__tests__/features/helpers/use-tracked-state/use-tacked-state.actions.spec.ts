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
        result.current[1].setData(value);
      });

      expect(result.current[0].data).toBe(value);
    });
    it("should allow to set error", async () => {
      const value = { test: 1 };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setError(value as unknown as Error);
      });

      expect(result.current[0].error).toBe(value);
    });
    it("should allow to set loading", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setLoading(true);
      });

      expect(result.current[0].loading).toBeTrue();
    });
    it("should allow to set status", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setStatus(900);
      });

      expect(result.current[0].status).toBe(900);
    });
    it("should allow to set success", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setSuccess(false);
      });

      await waitFor(() => {
        expect(result.current[0].success).toBe(false);
      });
    });
    it("should allow to set extra", async () => {
      const extra = { headers: { test: "1" } };
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setExtra(extra);
      });

      await waitFor(() => {
        expect(result.current[0].extra).toBe(extra);
      });
    });
    it("should allow to set response timestamp", async () => {
      const value = new Date();
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setResponseTimestamp(value);
      });

      expect(result.current[0].responseTimestamp).toBe(value);
    });
    it("should allow to set request timestamp", async () => {
      const value = new Date();
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRequestTimestamp(value);
      });

      expect(result.current[0].requestTimestamp).toBe(value);
    });
    it("should allow to set retries", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRetries(999);
      });

      expect(result.current[0].retries).toBe(999);
    });
  });
  describe("when using setData action", () => {
    it("should not update cache", async () => {
      await request.send();
      const { result } = renderUseTrackedState(request);

      // Then update state without emitting to hooks
      act(() => {
        result.current[1].setData("new-value");
      });

      // Cache should retain the initial value
      const cacheData = request.client.cache.get(request.cacheKey);
      expect(cacheData?.data).toBe(123);
      // Local state should have the new value
      expect(result.current[0].data).toBe("new-value");
    });

    it("should handle null previous data in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setData((prev: any) => {
          expect(prev).toBe(null);
          return "new-value";
        });
      });

      const cacheData = request.client.cache.get(request.cacheKey);
      expect(cacheData?.data).toBeUndefined();
      expect(result.current[0].data).toBe("new-value");
    });
  });
  describe("when using setError action", () => {
    it("should handle null previous error in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setError((prev: Error | null) => {
          expect(prev).toBe(null);
          return new Error("new error");
        });
      });

      expect(result.current[0].error).toBeInstanceOf(Error);
      expect(result.current[0].success).toBe(false);
    });

    it("should not update cache when emitToCache is false", async () => {
      const { result } = renderUseTrackedState(request);
      const initialError = new Error("initial error");

      // Set initial error in cache
      act(() => {
        result.current[1].setError(initialError);
      });

      // Update local state only
      const newError = new Error("new error");
      act(() => {
        result.current[1].setError(newError);
      });

      // Cache should retain initial error
      const cacheData = request.client.cache.get(request.cacheKey);
      expect(cacheData).toBe(undefined);
      // Local state should have new error
      expect(result.current[0].error).toBe(newError);
    });
  });
  describe("when using setLoading action", () => {
    it("should not emit loading event when emitToHooks is false", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.requestManager.events, "emitLoading");

      act(() => {
        result.current[1].setLoading(true);
      });

      expect(result.current[0].loading).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });
  });
  describe("when using setStatus action", () => {
    it("should handle null previous status in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setStatus((prev: number | null) => {
          expect(prev).toBe(null);
          return 404;
        });
      });

      expect(result.current[0].status).toBe(404);
    });

    it("should not update cache", async () => {
      const { result } = renderUseTrackedState(request);
      const spy = jest.spyOn(request.client.cache, "update");

      // Then update state without emitting to cache
      act(() => {
        result.current[1].setStatus(404);
      });

      expect(spy).toHaveBeenCalledTimes(0);
      // Local state should have the new value
      expect(result.current[0].status).toBe(404);
    });
  });
  describe("when using setSuccess action", () => {
    it("should handle null previous success in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setSuccess((prev) => {
          expect(prev).toBe(false);
          return true;
        });
      });

      expect(result.current[0].success).toBe(true);
    });
  });
  describe("when using setExtra action", () => {
    it("should handle null previous extra in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setExtra((prev: null | Record<string, any>) => {
          expect(prev).not.toStrictEqual({ count: 1 });
          return { count: 1 };
        });
      });

      expect(result.current[0].extra).toEqual({ count: 1 });
    });
  });
  describe("when using setRetries action", () => {
    it("should handle initial retries value in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setRetries((prev) => {
          expect(prev).toBe(0);
          return 5;
        });
      });

      expect(result.current[0].retries).toBe(5);
    });
  });
  describe("when using setResponseTimestamp action", () => {
    it("should handle null previous responseTimestamp in function updates", async () => {
      const { result } = renderUseTrackedState(request);
      const newDate = new Date();

      act(() => {
        result.current[1].setResponseTimestamp((prev: Date | null) => {
          expect(prev).toBe(null);
          return newDate;
        });
      });

      expect(result.current[0].responseTimestamp).toBe(newDate);
    });

    it("should handle undefined responseTimestamp in function updates", async () => {
      const { result } = renderUseTrackedState(request);

      act(() => {
        result.current[1].setResponseTimestamp((prev: Date | null) => {
          expect(prev).toBe(null);
          return undefined as any;
        });
      });

      expect(result.current[0].responseTimestamp).toBe(undefined);
    });

    it("should handle string date conversion in function updates", async () => {
      const { result } = renderUseTrackedState(request);
      const dateStr = "2024-01-01T00:00:00.000Z";
      const expectedDate = new Date(dateStr);

      act(() => {
        result.current[1].setResponseTimestamp(expectedDate);
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
        result.current[1].setResponseTimestamp(expectedInitialDate);
      });

      await waitFor(() => {
        expect(result.current[0].responseTimestamp).toBe(expectedInitialDate);
      });

      // Then update with function that receives the converted date
      act(() => {
        result.current[1].setResponseTimestamp((prev: Date | null) => {
          expect(+prev!).toBe(+expectedInitialDate);
          return laterDate;
        });
      });

      expect(+result.current[0].responseTimestamp!).toBe(+laterDate);
    });
  });
  describe("when using setRequestTimestamp action", () => {
    it("should handle null previous requestTimestamp in function updates", async () => {
      const { result } = renderUseTrackedState(request);
      const newDate = new Date();

      act(() => {
        result.current[1].setRequestTimestamp((prev: Date | null) => {
          expect(prev).toBe(null);
          return newDate;
        });
      });

      expect(result.current[0].requestTimestamp).toBe(newDate);
    });

    it("should use true as default value for emitToCache parameter", async () => {
      const reqNoGarbageCollection = request.setCacheTime(Infinity);
      await reqNoGarbageCollection.send();
      const { result } = renderUseTrackedState(reqNoGarbageCollection);
      const newDate = new Date();

      act(() => {
        // Call setRequestTimestamp without the emitToCache parameter
        result.current[1].setRequestTimestamp(newDate);
      });

      await waitFor(() => {
        expect(result.current[0].requestTimestamp).toBeDefined();
      });
    });
  });
});
