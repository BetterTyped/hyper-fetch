import { ClientResponseSuccessType } from "client";
import { CommandResponseDetails } from "managers";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCache, createCommand, sleep } from "../../utils";

describe("Cache [ Base ]", () => {
  const response: ClientResponseSuccessType<unknown> = [{ data: 123 }, null, 200];
  const details: CommandResponseDetails = {
    retries: 0,
    timestamp: +new Date(),
    isFailed: false,
    isCanceled: false,
    isOffline: false,
  };

  let builder = createBuilder();
  let command = createCommand(builder);
  let cache = createCache(builder);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    cache = createCache(builder);
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When lifecycle events get triggered", () => {
    it("should initialize cache", async () => {
      expect(cache.get(command.cacheKey)).not.toBeDefined();

      cache.set(command.setCache(true), response, details);

      expect(cache.get(command.cacheKey)).toBeDefined();
    });
  });
  describe("When managing cache data", () => {
    it("should add element to cache and emit set event", async () => {
      const trigger = jest.fn();
      const unmount = cache.events.onData(command.cacheKey, trigger);

      cache.set(command.setCache(true), response, details);
      unmount();

      expect(trigger).toBeCalledTimes(1);
      expect(cache.get(command.cacheKey)).toBeDefined();
    });

    it("should delete cache", async () => {
      cache.set(command.setCache(true), response, details);
      cache.delete(command.cacheKey);
      await sleep(1);

      expect(cache.get(command.cacheKey)).not.toBeDefined();
    });

    it("should revalidate and remove cache", async () => {
      const trigger = jest.fn();
      const unmount = cache.events.onRevalidate(command.cacheKey, trigger);

      cache.set(command.setCache(true), response, details);
      await cache.revalidate(command.cacheKey);
      await sleep(1);

      expect(cache.get(command.cacheKey)).not.toBeDefined();
      expect(trigger).toBeCalledTimes(1);
      unmount();
    });

    it("should not add to cache when useCache is set to false", async () => {
      const trigger = jest.fn();
      const unmount = cache.events.onData(command.cacheKey, trigger);

      cache.set(command.setCache(false), response, details);
      unmount();

      expect(trigger).toBeCalledTimes(1);
      expect(cache.get(command.cacheKey)).not.toBeDefined();
    });

    it("should allow to get cache keys", async () => {
      cache.set(command.setCacheKey("1"), response, details);
      cache.set(command.setCacheKey("2"), response, details);
      cache.set(command.setCacheKey("3"), response, details);

      expect(cache.keys()).toHaveLength(3);
      expect(cache.keys()).toStrictEqual(["1", "2", "3"]);
    });
  });

  describe("When CacheStore gets cleared before triggering cache actions", () => {
    it("should return undefined when removed cache entity", async () => {
      const trigger = jest.fn();

      cache.events.onRevalidate(command.cacheKey, trigger);

      cache.set(command.setCache(false), response, details);
      cache.clear();

      expect(trigger).toBeCalledTimes(0);
      expect(cache.get(command.cacheKey)).not.toBeDefined();
    });
  });
});
