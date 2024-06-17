import { CacheValueType } from "cache";
import { createCache, createLazyCacheAdapter, sleep } from "../../utils";
import { Client } from "client";
import { xhrExtra } from "adapter";

describe("Cache [ Events ]", () => {
  const cacheKey = "test";

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey, cache: true });
  let cache = createCache(client);
  const spy = jest.fn();

  const cacheData: CacheValueType = {
    data: null,
    error: null,
    status: 200,
    success: true,
    extra: xhrExtra,
    retries: 0,
    timestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    cacheTime: request.cacheTime,
    clearKey: cache.clearKey,
    garbageCollection: 300000,
  };

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey, cache: true });
    cache = createCache(client);
    jest.resetAllMocks();
  });

  describe("when options events are triggered", () => {
    it("should trigger onInitialization callback", async () => {
      const newCache = createCache(client, { onInitialization: spy });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(newCache);
    });
    it("should trigger onChange event when data is set", async () => {
      const newCache = createCache(client, { onChange: spy });

      newCache.set(request, cacheData);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(request.cacheKey, cacheData);
    });
    it("should trigger onDelete event when data is deleted", async () => {
      const newCache = createCache(client, { onDelete: spy });

      newCache.delete(request.cacheKey);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(request.cacheKey);
    });
  });
  describe("when invalidate event is triggered", () => {
    it("should invalidate cache using cache key", async () => {
      cache.set(request, {
        data: {},
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      });
      cache.events.onInvalidateByKey(cacheKey, spy);
      await cache.invalidate(cacheKey);
      await sleep(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should invalidate cache using regex", async () => {
      cache.set(request, {
        data: null,
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      });
      cache.events.onInvalidateByKey(cacheKey, spy);
      await cache.invalidate(new RegExp(cacheKey));
      await sleep(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should invalidate cache using lazyStorage regex", async () => {
      const lazyStorage = new Map();
      lazyStorage.set(request.cacheKey, cacheData);
      cache = createCache(client, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
      });
      cache.events.onInvalidateByKey(cacheKey, spy);
      await cache.invalidate(new RegExp(cacheKey));
      await sleep(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
