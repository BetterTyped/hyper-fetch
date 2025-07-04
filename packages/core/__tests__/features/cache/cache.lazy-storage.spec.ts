import { sleep } from "@hyper-fetch/testing";

import { CacheAsyncStorageType, CacheValueType } from "cache";
import { createCache, createLazyCacheAdapter } from "../../utils";
import { Client } from "client";
import { xhrExtra } from "http-adapter";

describe("Cache [ Lazy Storage ]", () => {
  const staleTime = 10000;
  const version = "test";
  const cacheKey = "1";
  const cacheData: CacheValueType = {
    data: null,
    error: null,
    status: 200,
    success: true,
    extra: xhrExtra,
    retries: 0,
    addedTimestamp: +new Date(),
    requestTimestamp: +new Date(),
    responseTimestamp: +new Date(),
    triggerTimestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    staleTime,
    version,
    cacheTime: Infinity,
    cacheKey,
  };

  const lazyStorage = new Map();
  const spy = jest.fn();

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey });
  let cache = createCache(client, {
    lazyStorage: createLazyCacheAdapter(lazyStorage),
    version,
  });

  beforeEach(() => {
    lazyStorage.clear();
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey });
    cache = createCache(client, {
      lazyStorage: createLazyCacheAdapter(lazyStorage),
      version,
    });
    jest.resetAllMocks();
  });

  describe("when using lazy storage", () => {
    it("should not crash when lazy storage is not set", async () => {
      const newClient = new Client({ url: "shared-base-url" });

      await expect(newClient.cache.getLazyKeys()).resolves.not.toThrow();
      await expect(newClient.cache.getAllKeys()).resolves.not.toThrow();
    });
  });
  describe("when using lazy storage", () => {
    it("should new data to lazy storage", async () => {
      cache.events.onDataByKey(cacheKey, spy);
      await cache.set(request, cacheData);
      await sleep(10);
      const data = cache.get(cacheKey);
      await sleep(50);
      expect(data).toBeDefined();
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should lazy load data", async () => {
      await cache.options?.lazyStorage?.set(cacheKey, cacheData);
      cache.events.onDataByKey(cacheKey, spy);
      const data = cache.get(cacheKey);
      await sleep(50);
      expect(data).not.toBeDefined();
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should not emit stale data", async () => {
      await cache.options?.lazyStorage?.set(cacheKey, { ...cacheData, responseTimestamp: +new Date() - staleTime });
      cache.events.onDataByKey(cacheKey, spy);
      const data = cache.get(cacheKey);
      await sleep(50);
      expect(data).not.toBeDefined();
      expect(spy).toHaveBeenCalledTimes(0);
    });
    it("should remove data when version change", async () => {
      await cache.options?.lazyStorage?.set(cacheKey, {
        ...cacheData,
        version: "old-key",
      });

      const deleteSpy = jest.spyOn(cache.options?.lazyStorage as CacheAsyncStorageType, "delete");
      cache.events.onDataByKey(cacheKey, spy);
      const data = cache.get(cacheKey);
      await sleep(50);
      expect(data).not.toBeDefined();
      expect(spy).toHaveBeenCalledTimes(0);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it("should delete lazy storage data", async () => {
      await cache.options?.lazyStorage?.set(cacheKey, cacheData);
      await cache.delete(cacheKey);
      await sleep(50);
      expect(await cache.options?.lazyStorage?.get(cacheKey)).not.toBeDefined();
    });
    it("should get keys from lazy storage and sync storage", async () => {
      const otherKey = "otherKey";
      await cache.options?.lazyStorage?.set(cacheKey, cacheData);
      await cache.storage.set(otherKey, cacheData);
      const keys = await cache.getAllKeys();
      await sleep(50);
      expect(keys).toStrictEqual([cacheKey, otherKey]);
    });
    it("should allow to get lazy cache keys", async () => {
      const mockLazyKeys = ["lazy1", "lazy2", "lazy3"];
      cache.lazyStorage = {
        keys: jest.fn().mockResolvedValue(mockLazyKeys),
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
      };

      const lazyKeys = await cache.getLazyKeys();

      expect(cache.lazyStorage.keys).toHaveBeenCalled();
      expect(lazyKeys).toEqual(mockLazyKeys);
    });
  });
});
