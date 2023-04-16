import { waitFor } from "@testing-library/dom";

import { CacheValueType } from "cache";
import { Client, DateInterval } from "index";
import { createCache, createLazyCacheAdapter } from "../../utils";

describe("Cache [ Garbage Collector ]", () => {
  const cacheKey = "test";
  const cacheTime = 30;
  const clearKey = "test";
  const garbageCollection = 10;
  const cacheData: CacheValueType = {
    data: { data: null, error: null, status: 200, isSuccess: true, additionalData: {} },
    details: {
      retries: 0,
      timestamp: +new Date(),
      isSuccess: true,
      isCanceled: false,
      isOffline: false,
    },
    cacheTime,
    clearKey,
    garbageCollection,
  };

  let lazyStorage = new Map<string, CacheValueType>();

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey, cacheTime, garbageCollection });
  let cache = createCache(client, {
    lazyStorage: createLazyCacheAdapter(lazyStorage),
    clearKey,
  });

  beforeEach(async () => {
    lazyStorage.clear();
    lazyStorage = new Map<string, CacheValueType>();
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey, cacheTime, garbageCollection });
    cache = createCache(client, {
      lazyStorage: createLazyCacheAdapter(lazyStorage),
      clearKey,
    });
    jest.resetAllMocks();
    jest.clearAllMocks();
    cacheData.details.timestamp = +new Date();
  });

  describe("when garbage collector is triggered", () => {
    it("should garbage collect data from sync storage", async () => {
      cache.set(request, cacheData.data, cacheData.details);
      await waitFor(() => {
        expect(cache.get(cacheKey)).not.toBeDefined();
      });
    });
    it("should garbage collect data from lazy storage", async () => {
      cache.set(request, cacheData.data, cacheData.details);
      cache.scheduleGarbageCollector(request.cacheKey);

      await waitFor(async () => {
        expect(await cache.options.lazyStorage.get(cacheKey)).not.toBeDefined();
      });
    });
    it("should schedule garbage collection on mount", async () => {
      const storage = new Map();
      storage.set(cacheKey, cacheData);
      const cacheInstance = createCache(client, {
        storage,
        clearKey,
      });

      await waitFor(() => {
        expect(Array.from(cacheInstance.garbageCollectors.keys())).toHaveLength(1);
      });
    });
    it("should schedule lazy storage garbage collection on mount", async () => {
      lazyStorage.set(cacheKey, cacheData);
      const cacheInstance = createCache(client, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
        clearKey,
      });

      await waitFor(() => {
        expect(Array.from(cacheInstance.garbageCollectors.keys())).toHaveLength(1);
      });
    });
    it("should schedule garbage collection when resource is added", async () => {
      const spy = jest.spyOn(cache, "scheduleGarbageCollector");
      cache.set(request, cacheData.data, cacheData.details);
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
    it("should remove resource with not matching lazy clearKey", async () => {
      const data = { ...cacheData, garbageCollection: DateInterval.minute };
      lazyStorage.set(request.cacheKey, data);
      createCache(client, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
        clearKey: "new-clear-key",
      });
      const spy = jest.spyOn(lazyStorage, "delete");

      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(cacheKey);
      });
    });
    it("should remove resource with not matching sync clearKey", async () => {
      const data = { ...cacheData, garbageCollection: DateInterval.minute };
      lazyStorage.set(request.cacheKey, data);
      createCache(client, {
        storage: lazyStorage,
        clearKey: "new-clear-key",
      });
      const spy = jest.spyOn(lazyStorage, "delete");

      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(cacheKey);
      });
    });
  });
});
