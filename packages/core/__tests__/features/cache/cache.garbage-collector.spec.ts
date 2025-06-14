import { waitFor } from "@testing-library/dom";

import { CacheValueType } from "cache";
import { Client, Time, xhrExtra } from "index";
import { createCache, createLazyCacheAdapter } from "../../utils";

describe("Cache [ Garbage Collector ]", () => {
  const cacheKey = "test";
  const staleTime = 30000;
  const version = "test";
  const cacheTime = 10000;
  const cacheData: CacheValueType = {
    data: null,
    error: null,
    status: 200,
    success: true,
    extra: xhrExtra,
    retries: 0,
    requestTimestamp: +new Date(),
    responseTimestamp: +new Date(),
    addedTimestamp: +new Date(),
    triggerTimestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    staleTime,
    version,
    cacheTime,
    cacheKey,
  };

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey, staleTime, cacheTime });
  let cache = createCache(client, {
    version,
  });

  beforeEach(async () => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey, staleTime, cacheTime });
    cache = createCache(client, {
      version,
    });
    jest.resetAllMocks();
    jest.clearAllMocks();

    cacheData.requestTimestamp = +new Date();
    cacheData.responseTimestamp = +new Date();
    cacheData.addedTimestamp = +new Date();
    cacheData.triggerTimestamp = +new Date();
  });

  describe("when garbage collector is triggered", () => {
    it("should not schedule garbage collector for non existing key", async () => {
      cache.scheduleGarbageCollector(cacheKey);
      expect(Array.from(cache.garbageCollectors.keys())).toHaveLength(0);
    });
    it("should garbage collect data from sync storage", async () => {
      cache.set(request.setCacheTime(10), cacheData);
      await waitFor(() => {
        expect(cache.get(cacheKey)).not.toBeDefined();
      });
    });
    it("should garbage collect data from lazy storage", async () => {
      cache.set(request, cacheData);
      cache.scheduleGarbageCollector(request.cacheKey);

      await waitFor(async () => {
        expect(await cache.options?.lazyStorage?.get(cacheKey)).not.toBeDefined();
      });
    });
    it("should schedule garbage collection on mount", async () => {
      const storage = new Map().set("cacheKey", cacheData);

      const cacheInstance = createCache(new Client({ url: "shared-base-url" }), {
        storage,
        version,
      });
      expect(Array.from(cacheInstance.garbageCollectors.keys())).toHaveLength(1);
    });
    it("should not schedule lazy storage garbage collection on mount", async () => {
      const lazyStorage = new Map<string, CacheValueType>();
      lazyStorage.set(cacheKey, cacheData);
      const cacheInstance = createCache(client, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
        version,
      });

      await waitFor(() => {
        expect(Array.from(cacheInstance.garbageCollectors.keys())).toHaveLength(0);
      });
    });
    it("should schedule garbage collection when resource is added", async () => {
      const spy = jest.spyOn(cache, "scheduleGarbageCollector");
      cache.set(request, cacheData);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should remove resource with not matching lazy version", async () => {
      const lazyStorage = new Map<string, CacheValueType>();
      const data = { ...cacheData, cacheTime: Time.MIN };
      lazyStorage.set(request.cacheKey, data);
      const newCache = createCache(client, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
        version: "new-clear-key",
      });
      const spy = jest.spyOn(lazyStorage, "delete");

      // get to trigger garbage collector
      newCache.get(request.cacheKey);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(cacheKey);
      });
    });
    it("should remove resource with not matching sync version", async () => {
      const syncStorage = new Map<string, CacheValueType>();
      const data = { ...cacheData, cacheTime: Time.MIN };
      syncStorage.set(request.cacheKey, data);
      const newCache = createCache(client, {
        storage: syncStorage,
        version: "new-clear-key",
      });
      const spy = jest.spyOn(syncStorage, "delete");

      // get to trigger garbage collector
      newCache.get(request.cacheKey);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(cacheKey);
      });
    });
    it("should not schedule garbage collection for Infinity", async () => {
      const storage = new Map();
      storage.set(cacheKey, { ...cacheData, cacheTime: Infinity });
      const cacheInstance = createCache(client, {
        storage,
        version,
      });

      await waitFor(() => {
        expect(Array.from(cacheInstance.garbageCollectors.keys())).toHaveLength(0);
      });
    });
    it("should garbage collect when time left is less than zero", async () => {
      const pastTimestamp = +new Date() - 20000; // 20 seconds ago
      const staleData = {
        ...cacheData,
        responseTimestamp: pastTimestamp,
        cacheTime: 10000, // 10 seconds
      };

      cache.set(request, staleData);

      await waitFor(() => {
        expect(cache.get(cacheKey)).not.toBeDefined();
      });
    });
    it("should not schedule garbage collection for null", async () => {
      const storage = new Map();
      storage.set(cacheKey, { ...cacheData, cacheTime: null });
      const cacheInstance = createCache(client, {
        storage,
        version,
      });

      await waitFor(() => {
        expect(Array.from(cacheInstance.garbageCollectors.keys())).toHaveLength(0);
      });
    });
  });
});
