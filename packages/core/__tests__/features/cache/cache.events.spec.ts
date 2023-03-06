import { CacheValueType } from "cache";
import { createClient, createCache, createRequest, createLazyCacheAdapter, sleep } from "../../utils";

describe("Cache [ Events ]", () => {
  const cacheKey = "test";

  let client = createClient();
  let request = createRequest(client, { cacheKey, cache: true });
  let cache = createCache(client);
  const spy = jest.fn();

  const cacheData: CacheValueType = {
    data: { data: null, error: null, status: 200 },
    details: {
      retries: 0,
      timestamp: +new Date(),
      isFailed: false,
      isCanceled: false,
      isOffline: false,
    },
    cacheTime: request.cacheTime,
    clearKey: cache.clearKey,
    garbageCollection: 300000,
  };

  beforeEach(() => {
    client = createClient();
    request = createRequest(client, { cacheKey, cache: true });
    cache = createCache(client);
    jest.resetAllMocks();
  });

  describe("when options events are triggered", () => {
    it("should trigger onInitialization callback", async () => {
      const newCache = createCache(client, { onInitialization: spy });

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(newCache);
    });
    it("should trigger onChange event when data is set", async () => {
      const newCache = createCache(client, { onChange: spy });

      newCache.set(request, cacheData.data, cacheData.details);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(request.cacheKey, cacheData);
    });
    it("should trigger onDelete event when data is deleted", async () => {
      const newCache = createCache(client, { onDelete: spy });

      newCache.delete(request.cacheKey);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(request.cacheKey);
    });
  });
  describe("when revalidate event is triggered", () => {
    it("should revalidate cache using cache key", async () => {
      cache.set(
        request,
        { data: {}, error: null, status: 200 },
        {
          retries: 0,
          timestamp: +new Date(),
          isFailed: false,
          isCanceled: false,
          isOffline: false,
        },
      );
      cache.events.onRevalidate(cacheKey, spy);
      await cache.revalidate(cacheKey);
      await sleep(1);
      expect(spy).toBeCalledTimes(1);
    });
    it("should revalidate cache using regex", async () => {
      cache.set(
        request,
        { data: null, error: null, status: 200 },
        {
          retries: 0,
          timestamp: +new Date(),
          isFailed: false,
          isCanceled: false,
          isOffline: false,
        },
      );
      cache.events.onRevalidate(cacheKey, spy);
      await cache.revalidate(new RegExp(cacheKey));
      await sleep(1);
      expect(spy).toBeCalledTimes(1);
    });
    it("should revalidate cache using lazyStorage regex", async () => {
      const lazyStorage = new Map();
      lazyStorage.set(request.cacheKey, cacheData);
      cache = createCache(client, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
      });
      cache.events.onRevalidate(cacheKey, spy);
      await cache.revalidate(new RegExp(cacheKey));
      await sleep(1);
      expect(spy).toBeCalledTimes(1);
    });
  });
});
