import { AdapterType, ResponseReturnSuccessType } from "adapter";
import { ResponseDetailsType } from "managers";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createCache, sleep } from "../../utils";
import { Client, xhrExtra } from "client";

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
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When lifecycle events get triggered", () => {
    it("should initialize cache", async () => {
      expect(cache.get(request.cacheKey)).not.toBeDefined();

      cache.set(request.setCache(true), { ...response, ...details });

      expect(cache.get(request.cacheKey)).toBeDefined();
    });
  });
  describe("When managing cache data", () => {
    it("should add element to cache and emit set event", async () => {
      const trigger = jest.fn();
      const unmount = cache.events.onData(request.cacheKey, trigger);

      cache.set(request.setCache(true), { ...response, ...details });
      unmount();

      expect(trigger).toBeCalledTimes(1);
      expect(cache.get(request.cacheKey)).toBeDefined();
    });

    it("should delete cache", async () => {
      cache.set(request.setCache(true), { ...response, ...details });
      cache.delete(request.cacheKey);
      await sleep(1);

      expect(cache.get(request.cacheKey)).not.toBeDefined();
    });

    it("should revalidate and remove cache", async () => {
      const trigger = jest.fn();
      const unmount = cache.events.onRevalidate(request.cacheKey, trigger);

      cache.set(request.setCache(true), { ...response, ...details });
      await cache.revalidate(request.cacheKey);
      await sleep(1);

      expect(cache.get(request.cacheKey)).not.toBeDefined();
      expect(trigger).toBeCalledTimes(1);
      unmount();
    });

    it("should not add to cache when useCache is set to false", async () => {
      const trigger = jest.fn();
      const unmount = cache.events.onData(request.cacheKey, trigger);

      cache.set(request.setCache(false), { ...response, ...details });
      unmount();

      expect(trigger).toBeCalledTimes(1);
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

      cache.events.onRevalidate(request.cacheKey, trigger);

      cache.set(request.setCache(false), { ...response, ...details });
      cache.clear();

      expect(trigger).toBeCalledTimes(0);
      expect(cache.get(request.cacheKey)).not.toBeDefined();
    });
  });
});
