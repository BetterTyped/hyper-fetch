import { createHttpMockingServer } from "@hyper-fetch/testing";

import { xhrExtra, AdapterType, ResponseReturnSuccessType } from "adapter";
import { ResponseDetailsType } from "managers";
import { createCache, sleep } from "../../utils";
import { Client } from "client";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Cache [ Base ]", () => {
  const response: ResponseReturnSuccessType<unknown, AdapterType> = {
    data: 123,
    error: null,
    status: 200,
    success: true,
    extra: xhrExtra,
  };
  const details: ResponseDetailsType = {
    retries: 0,
    timestamp: +new Date(),
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
      expect(cache.get(request.cacheKey).data).toBe("TEST!");

      cache.set(request.setCache(true), (previous) => ({ ...response, ...details, data: `${previous.data} WOW!` }));

      expect(cache.get(request.cacheKey).data).toBe("TEST! WOW!");
    });
    it("should update cache", async () => {
      cache.set(request.setCache(true), { ...response, ...details });
      cache.update(request.setCache(true), { ...response, ...details, data: "SUPER TEST!" });

      expect(cache.get(request.cacheKey)?.data).toBe("SUPER TEST!");

      cache.update(request.setCache(true), (previous) => ({ ...response, ...details, data: `${previous.data} WOW!` }));

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

      expect(cache.get(request.cacheKey)).not.toBeDefined();
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
});
