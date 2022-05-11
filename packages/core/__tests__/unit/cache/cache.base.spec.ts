import { ClientResponseSuccessType } from "client";
import { CommandResponseDetails } from "managers";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCache, createCommand } from "../../utils";

describe("Cache [ Base ]", () => {
  const response: ClientResponseSuccessType<unknown> = [{ data: 123 }, null, 200];
  const details: CommandResponseDetails = {
    retries: 0,
    timestamp: new Date(),
    isFailed: false,
    isCanceled: false,
    isRefreshed: false,
    isOffline: false,
    isStopped: false,
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
      expect(await cache.get(command.cacheKey)).not.toBeDefined();

      await cache.set(command.cacheKey, response, details, true);

      expect(await cache.get(command.cacheKey)).toBeDefined();
    });

    it("should trigger onInitialization callback", async () => {
      const spy = jest.fn();
      const newCache = createCache(builder, { onInitialization: spy });

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(newCache);
    });
  });
  describe("When managing cache data", () => {
    it("should add element to cache and emit set event", async () => {
      const trigger = jest.fn();

      const unmount = cache.events.get(command.cacheKey, () => {
        trigger();
      });

      await cache.set(command.cacheKey, response, details, true);
      unmount();

      expect(trigger).toBeCalledTimes(1);
      expect(await cache.get(command.cacheKey)).toBeDefined();
    });

    it("should delete cache and send revalidate event", async () => {
      const trigger = jest.fn();

      const unmount = cache.events.onRevalidate(command.cacheKey, () => {
        trigger();
      });

      await cache.set(command.cacheKey, response, details, true);
      await cache.delete(command.cacheKey);
      unmount();

      expect(trigger).toBeCalledTimes(1);
      expect(await cache.get(command.cacheKey)).not.toBeDefined();
    });

    it("should not add to cache when useCache is set to false", async () => {
      const trigger = jest.fn();

      const unmount = cache.events.get(command.cacheKey, () => {
        trigger();
      });

      await cache.set(command.cacheKey, response, details, false);
      unmount();

      expect(trigger).toBeCalledTimes(1);
      expect(await cache.get(command.cacheKey)).not.toBeDefined();
    });
  });
});
