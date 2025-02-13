import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { ResponseSuccessType } from "adapter";
import { ResponseDetailsType } from "managers";
import { createCache } from "../../utils";
import { Client } from "client";
import { HttpAdapterType, xhrExtra } from "http-adapter";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Cache [ Base ]", () => {
  const response: ResponseSuccessType<unknown, HttpAdapterType> = {
    data: 123,
    error: null,
    status: 200,
    success: true,
    extra: xhrExtra,
    requestTimestamp: Date.now(),
    responseTimestamp: Date.now(),
  };
  const details: ResponseDetailsType = {
    retries: 0,
    requestTimestamp: +new Date(),
    responseTimestamp: +new Date(),
    addedTimestamp: +new Date(),
    triggerTimestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
  };

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "/shared-endpoint" });
  let cache = createCache(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "/shared-endpoint" });
    cache = createCache(client);
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When lifecycle events get triggered", () => {
    it("should initialize cache", async () => {
      expect(cache.get(request.cacheKey)).not.toBeDefined();

      cache.set(request.setCache(true), { ...response, ...details, data: "TEST!" });

      expect(cache.get(request.cacheKey)).toBeDefined();
      expect(cache.get(request.cacheKey)?.data).toBe("TEST!");

      cache.set(request.setCache(true), (previous) => ({ ...response, ...details, data: `${previous?.data} WOW!` }));

      expect(cache.get(request.cacheKey)?.data).toBe("TEST! WOW!");
    });
    it("should update cache", async () => {
      cache.set(request.setCache(true), { ...response, ...details });
      cache.update(request.setCache(true), { ...response, ...details, data: "SUPER TEST!" });

      expect(cache.get(request.cacheKey)?.data).toBe("SUPER TEST!");

      cache.update(request.setCache(true), (previous) => ({ ...response, ...details, data: `${previous?.data} WOW!` }));

      expect(cache.get(request.cacheKey)?.data).toBe("SUPER TEST! WOW!");
    });
  });
  describe("When managing cache data", () => {
    it("should add element to cache and emit set event", async () => {
      const trigger = jest.fn();
      const unmount = cache.events.onDataByKey(request.cacheKey, trigger);

      cache.set(request.setCache(true), { ...response, ...details });
      unmount();

      expect(trigger).toHaveBeenCalledTimes(1);
      expect(cache.get(request.cacheKey)).toBeDefined();
    });

    it("should delete cache", async () => {
      cache.set(request.setCache(true), { ...response, ...details });
      cache.delete(request.cacheKey);
      await sleep(1);

      expect(cache.get(request.cacheKey)).not.toBeDefined();
    });

    it("should invalidate and remove cache", async () => {
      const trigger = jest.fn();
      const unmount = cache.events.onInvalidateByKey(request.cacheKey, trigger);

      cache.set(request.setCache(true), { ...response, ...details });
      await cache.invalidate(request.cacheKey);
      await sleep(1);

      const data = cache.get(request.cacheKey);
      expect(data).toBeDefined();
      expect(data?.staleTime).toBe(0);
      expect(trigger).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("should not add to cache when useCache is set to false", async () => {
      const trigger = jest.fn();
      const unmount = cache.events.onDataByKey(request.cacheKey, trigger);

      cache.set(request.setCache(false), { ...response, ...details });
      unmount();

      expect(trigger).toHaveBeenCalledTimes(1);
      expect(cache.get(request.cacheKey)).not.toBeDefined();
    });

    it("should allow to get cache keys", async () => {
      cache.set(request.setCacheKey("1"), { ...response, ...details });
      cache.set(request.setCacheKey("2"), { ...response, ...details });
      cache.set(request.setCacheKey("3"), { ...response, ...details });

      expect(cache.keys()).toHaveLength(3);
      expect(cache.keys()).toStrictEqual(["1", "2", "3"]);
    });

    it("should handle both function and non-function responses", async () => {
      // Test direct value response
      cache.set(request.setCache(true), { ...response, ...details, data: "DIRECT" });
      expect(cache.get(request.cacheKey)?.data).toBe("DIRECT");

      // Test function response with no previous data
      cache.delete(request.cacheKey); // Clear previous data
      cache.set(request.setCache(true), () => ({ ...response, ...details, data: "FUNCTION NO PREV" }));
      expect(cache.get(request.cacheKey)?.data).toBe("FUNCTION NO PREV");

      // Test function response with previous data
      cache.set(request.setCache(true), (prev) => ({
        ...response,
        ...details,
        data: `${prev?.data} UPDATED`,
      }));
      expect(cache.get(request.cacheKey)?.data).toBe("FUNCTION NO PREV UPDATED");
    });

    it("should properly merge partial responses with existing cache data", async () => {
      // Set initial cache data
      const initialData = {
        ...response,
        ...details,
        data: { field1: "value1", field2: "value2" },
      };
      cache.set(request.setCache(true), initialData);

      // Test direct value partial update
      cache.update(request.setCache(true), { data: { field2: "updated2", field3: "value3" } });

      let result = cache.get(request.cacheKey);
      expect(result?.data).toEqual({
        field2: "updated2",
        field3: "value3",
      });

      cache.delete(request.cacheKey);

      // Cannot update if cache is not set
      cache.update(request.setCache(true), (prev) => {
        expect(prev).toBeNull();
        return {
          ...prev,
          data: {
            ...prev?.data,
            field1: "updated1",
            field4: "value4",
          },
        };
      });

      result = cache.get(request.cacheKey);
      expect(result).toBeUndefined();
    });
  });

  describe("When CacheStore gets cleared before triggering cache actions", () => {
    it("should return undefined when removed cache entity", async () => {
      const trigger = jest.fn();

      cache.events.onInvalidateByKey(request.cacheKey, trigger);

      cache.set(request.setCache(false), { ...response, ...details });
      cache.clear();

      expect(trigger).toHaveBeenCalledTimes(0);
      expect(cache.get(request.cacheKey)).not.toBeDefined();
    });
  });

  describe("invalidate", () => {
    it("should set staleTime to 0 when invalidating with existing cache", async () => {
      // Set initial cache data
      const initialData = {
        ...response,
        ...details,
        data: "initial",
        staleTime: 1000,
      };
      cache.set(request.setCache(true), initialData);

      // Verify initial staleTime
      expect(cache.get(request.cacheKey)?.staleTime).toBeGreaterThan(0);

      // Update the value
      await cache.invalidate(request.cacheKey);

      // Verify staleTime is set to 0
      const updatedCache = cache.get(request.cacheKey);
      expect(updatedCache?.staleTime).toBe(0);
    });
    it("should not set staleTime to 0 when invalidating with non-existing cache", async () => {
      cache.storage.set(request.cacheKey, undefined as any);

      // Update the value
      await cache.invalidate(request.cacheKey);

      // Verify staleTime is set to 0
      const updatedCache = cache.get(request.cacheKey);
      expect(updatedCache).toBeUndefined();
    });
    it("should invalidate cache when given a Request instance", async () => {
      // Create a mock Request instance
      const mockRequest = client.createRequest()({ endpoint: "/shared-endpoint" });

      // Add some data to cache with the request's cacheKey
      const data = {
        data: "test",
        success: true,
        staleTime: 1000,
        version: "0.0.1",
        cacheKey: mockRequest.cacheKey,
        cacheTime: 2000,
        responseTimestamp: Date.now(),
        error: null,
        status: 200,
        extra: xhrExtra,
        requestTimestamp: Date.now(),
        retries: 0,
        isCanceled: false,
        isOffline: false,
        addedTimestamp: Date.now(),
        triggerTimestamp: Date.now(),
      };
      cache.storage.set(mockRequest.cacheKey, data);

      await cache.invalidate(mockRequest);

      const invalidatedData = cache.storage.get(mockRequest.cacheKey);

      expect(invalidatedData?.staleTime).toBe(0);
    });
    it("should not invalidate cache when it is empty", async () => {
      // Create a mock Request instance
      const mockRequest = client
        .createRequest()({ endpoint: "/shared-endpoint" })
        .setMock(() => ({
          data: "test" as any,
          status: 200,
        }));

      cache.invalidate([new RegExp(mockRequest.cacheKey)]);

      const spy = jest.spyOn(cache.events, "emitInvalidation");
      expect(spy).not.toHaveBeenCalled();
    });
    it("should not invalidate cache when app is offline", async () => {
      // Create a mock Request instance
      const mockRequest = client
        .createRequest()({ endpoint: "/shared-endpoint", cacheTime: -100 })
        .setMock(() => ({
          data: "test" as any,
          status: 200,
        }));

      await mockRequest.send({
        onResponse: () => {
          client.appManager.setOnline(false);
        },
      });
      cache.garbageCollectors.clear();
      cache.invalidate([new RegExp(mockRequest.cacheKey)]);

      const spy = jest.spyOn(cache.events, "emitInvalidation");
      expect(spy).not.toHaveBeenCalled();
    });

    it("should not invalidate cache when app goes offline", async () => {
      // Create a mock Request instance
      const mockRequest = client
        .createRequest()({ endpoint: "/shared-endpoint", cacheTime: 100 })
        .setMock(() => ({
          data: "test" as any,
          status: 200,
        }));

      await mockRequest.send();
      cache.invalidate([new RegExp(mockRequest.cacheKey)]);
      client.appManager.setOnline(false);
      await sleep(150);

      const spy = jest.spyOn(cache.events, "emitInvalidation");
      expect(spy).not.toHaveBeenCalled();
    });

    it("should handle array of mixed invalidation keys (Request, string, RegExp)", async () => {
      // Create test data with different keys
      const mockRequest = client.createRequest()({ endpoint: "/shared-endpoint" });

      const testData = {
        [mockRequest.cacheKey]: "request data",
        "string-key": "string data",
        "test-prefix-123": "regex data 1",
        "test-prefix-456": "regex data 2",
      };

      // Set up cache with test data
      Object.entries(testData).forEach(([key, value]) => {
        cache.storage.set(key, {
          data: value,
          success: true,
          staleTime: 1000,
          version: "0.0.1",
          cacheKey: key,
          cacheTime: 2000,
          responseTimestamp: Date.now(),
          error: null,
          status: 200,
          extra: xhrExtra,
          requestTimestamp: Date.now(),
          retries: 0,
          isCanceled: false,
          isOffline: false,
          addedTimestamp: Date.now(),
          triggerTimestamp: Date.now(),
        });
      });

      // Invalidate using array of different key types
      await cache.invalidate([mockRequest, "string-key", /^test-prefix-/]);

      // Verify all matching keys were invalidated
      Object.entries(testData).forEach(([key]) => {
        expect(cache.storage.get(key)?.staleTime).toBe(0);
      });
    });
  });
});
