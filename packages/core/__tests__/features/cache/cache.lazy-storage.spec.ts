import { CacheValueType } from "cache";
import { createCache, createLazyCacheAdapter, sleep } from "../../utils";
import { Client, xhrAdditionalData } from "client";

describe("Cache [ Lazy Storage ]", () => {
  const cacheKey = "test";
  const cacheTime = 10000;
  const clearKey = "test";
  const cacheData: CacheValueType = {
    data: null,
    error: null,
    status: 200,
    isSuccess: true,
    additionalData: xhrAdditionalData,
    retries: 0,
    timestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    cacheTime,
    clearKey,
    garbageCollection: Infinity,
  };

  const lazyStorage = new Map();
  const spy = jest.fn();

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey });
  let cache = createCache(client, {
    lazyStorage: createLazyCacheAdapter(lazyStorage),
    clearKey,
  });

  beforeEach(() => {
    lazyStorage.clear();
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey });
    cache = createCache(client, {
      lazyStorage: createLazyCacheAdapter(lazyStorage),
      clearKey,
    });
    jest.resetAllMocks();
  });

  describe("when using lazy storage", () => {
    it("should new data to lazy storage", async () => {
      cache.events.onData(cacheKey, spy);
      await cache.set(request, cacheData);
      await sleep(10);
      const data = cache.get(cacheKey);
      await sleep(50);
      expect(data).toBeDefined();
      expect(spy).toBeCalledTimes(1);
    });
    it("should lazy load data", async () => {
      await cache.options.lazyStorage.set(cacheKey, cacheData);
      cache.events.onData(cacheKey, spy);
      const data = cache.get(cacheKey);
      await sleep(50);
      expect(data).not.toBeDefined();
      expect(spy).toBeCalledTimes(1);
    });
    it("should not emit stale data", async () => {
      await cache.options.lazyStorage.set(cacheKey, { ...cacheData, timestamp: +new Date() - cacheTime });
      cache.events.onData(cacheKey, spy);
      const data = cache.get(cacheKey);
      await sleep(50);
      expect(data).not.toBeDefined();
      expect(spy).toBeCalledTimes(0);
    });
    it("should remove data when clearKey change", async () => {
      await cache.options.lazyStorage.set(cacheKey, {
        ...cacheData,
        clearKey: "old-key",
      });
      const deleteSpy = jest.spyOn(cache.options.lazyStorage, "delete");
      cache.events.onData(cacheKey, spy);
      const data = cache.get(cacheKey);
      await sleep(50);
      expect(data).not.toBeDefined();
      expect(spy).toBeCalledTimes(0);
      expect(deleteSpy).toBeCalledTimes(1);
    });
    it("should delete lazy storage data", async () => {
      await cache.options.lazyStorage.set(cacheKey, cacheData);
      await cache.delete(cacheKey);
      await sleep(50);
      expect(await cache.options.lazyStorage.get(cacheKey)).not.toBeDefined();
    });
    it("should get keys from lazy storage and sync storage", async () => {
      const otherKey = "otherKey";
      await cache.options.lazyStorage.set(cacheKey, cacheData);
      await cache.storage.set(otherKey, cacheData);
      const keys = await cache.getLazyKeys();
      await sleep(50);
      expect(keys).toStrictEqual([cacheKey, otherKey]);
    });
  });
});
