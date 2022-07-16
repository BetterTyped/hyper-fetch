import { CacheValueType } from "cache";
import { createBuilder, createCache, createCommand, createLazyCacheAdapter, sleep } from "../../utils";

describe("Cache [ Events ]", () => {
  const cacheKey = "test";

  let builder = createBuilder();
  let command = createCommand(builder, { cacheKey, cache: true });
  let cache = createCache(builder);
  const spy = jest.fn();

  const cacheData: CacheValueType = {
    data: [null, null, 200],
    details: {
      retries: 0,
      timestamp: +new Date(),
      isFailed: false,
      isCanceled: false,
      isOffline: false,
    },
    cacheTime: command.cacheTime,
    clearKey: cache.clearKey,
  };

  beforeEach(() => {
    builder = createBuilder();
    command = createCommand(builder, { cacheKey, cache: true });
    cache = createCache(builder);
    jest.resetAllMocks();
  });

  describe("when options events are triggered", () => {
    it("should trigger onInitialization callback", async () => {
      const newCache = createCache(builder, { onInitialization: spy });

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(newCache);
    });
    it("should trigger onChange event when data is set", async () => {
      const newCache = createCache(builder, { onChange: spy });

      newCache.set(command, cacheData.data, cacheData.details);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(command.cacheKey, cacheData);
    });
    it("should trigger onDelete event when data is deleted", async () => {
      const newCache = createCache(builder, { onDelete: spy });

      newCache.delete(command.cacheKey);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(command.cacheKey);
    });
  });
  describe("when revalidate event is triggered", () => {
    it("should revalidate cache using cache key", async () => {
      cache.set(command, [{}, null, 200], {
        retries: 0,
        timestamp: +new Date(),
        isFailed: false,
        isCanceled: false,
        isOffline: false,
      });
      cache.events.onRevalidate(cacheKey, spy);
      await cache.revalidate(cacheKey);
      await sleep(1);
      expect(spy).toBeCalledTimes(1);
    });
    it("should revalidate cache using regex", async () => {
      cache.set(command, [null, null, 200], {
        retries: 0,
        timestamp: +new Date(),
        isFailed: false,
        isCanceled: false,
        isOffline: false,
      });
      cache.events.onRevalidate(cacheKey, spy);
      await cache.revalidate(new RegExp(cacheKey));
      await sleep(1);
      expect(spy).toBeCalledTimes(1);
    });
    it("should revalidate cache using lazyStorage regex", async () => {
      const lazyStorage = new Map();
      lazyStorage.set(command.cacheKey, cacheData);
      cache = createCache(builder, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
      });
      cache.events.onRevalidate(cacheKey, spy);
      await cache.revalidate(new RegExp(cacheKey));
      await sleep(1);
      expect(spy).toBeCalledTimes(1);
    });
  });
});
