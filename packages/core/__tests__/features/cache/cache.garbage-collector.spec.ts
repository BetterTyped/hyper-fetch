import { waitFor } from "@testing-library/dom";

import { CacheValueType } from "cache";
import { createBuilder, createCache, createCommand, createLazyCacheAdapter } from "../../utils";

describe("Cache [ Garbage Collector ]", () => {
  const cacheKey = "test";
  const cacheTime = 30;
  const clearKey = "test";
  const cacheData: CacheValueType = {
    data: [null, null, 200],
    details: {
      retries: 0,
      timestamp: +new Date(),
      isFailed: false,
      isCanceled: false,
      isOffline: false,
    },
    cacheTime,
    clearKey,
  };

  const lazyStorage = new Map();

  let builder = createBuilder();
  let command = createCommand(builder, { cacheKey, cacheTime });
  let cache = createCache(builder, {
    lazyStorage: createLazyCacheAdapter(lazyStorage),
    clearKey,
  });

  beforeEach(async () => {
    lazyStorage.clear();
    builder = createBuilder();
    command = createCommand(builder, { cacheKey, cacheTime });
    cache = createCache(builder, {
      lazyStorage: createLazyCacheAdapter(lazyStorage),
      clearKey,
    });
    jest.resetAllMocks();
    cacheData.details.timestamp = +new Date();
  });

  describe("when garbage collector is triggered", () => {
    it("should garbage collect data from sync storage", async () => {
      cache.set(command, cacheData.data, cacheData.details);
      await waitFor(() => {
        expect(cache.get(cacheKey)).not.toBeDefined();
      });
    });
    it("should garbage collect data from lazy storage", async () => {
      cache.set(command, cacheData.data, cacheData.details);
      cache.scheduleGarbageCollector(command.cacheKey);

      await waitFor(async () => {
        expect(await cache.options.lazyStorage.get(cacheKey)).not.toBeDefined();
      });
    });
    it("should schedule garbage collection on mount", async () => {
      const storage = new Map();
      storage.set(cacheKey, cacheData);
      const cacheInstance = createCache(builder, {
        storage,
        clearKey,
      });

      await waitFor(() => {
        expect(Array.from(cacheInstance.garbageCollectors.keys())).toHaveLength(1);
      });
    });
    it("should schedule lazy storage garbage collection on mount", async () => {
      lazyStorage.set(cacheKey, cacheData);
      const cacheInstance = createCache(builder, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
        clearKey,
      });

      await waitFor(() => {
        expect(Array.from(cacheInstance.garbageCollectors.keys())).toHaveLength(1);
      });
    });
    it("should schedule garbage collection when resource is added", async () => {
      const spy = jest.spyOn(cache, "scheduleGarbageCollector");
      cache.set(command, cacheData.data, cacheData.details);
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
    it("should remove resource with not matching clearKey", async () => {
      lazyStorage.set(command.cacheKey, cacheData);
      const cacheInstance = createCache(builder, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
        clearKey,
      });
      const spy = jest.spyOn(cacheInstance, "delete");
      cacheInstance.scheduleGarbageCollector(cacheKey);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
  });
});
