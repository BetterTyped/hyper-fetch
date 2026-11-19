import type { CacheAsyncStorageType, CacheValueType } from "cache";
import { Cache } from "cache";
import { Client } from "client";
import { LoggerManager } from "managers";
import { scopeKey } from "request";

import {
  createCacheErrorResponse,
  createCacheResponse,
  createCacheValue,
  createDeferred,
  createLazyStorage,
  flushPromises,
  getUnhandledRejections,
} from "../../utils/fixtures.utils";

const cacheKey = "lazy-key";
const version = "test-version";

const createLazyClient = (source = new Map<string, CacheValueType>()) => {
  const lazy = createLazyStorage(source);
  const client = new Client({
    url: "shared-base-url",
    cache: () => new Cache({ lazyStorage: lazy.storage, version }),
  });
  const request = client.createRequest<{ response: any }>()({ endpoint: "/users", cacheKey });

  return { client, request, ...lazy };
};

const createFailingClient = (lazyStorage: CacheAsyncStorageType) => {
  const logger = vi.fn();
  const client = new Client({ url: "shared-base-url", cache: () => new Cache({ lazyStorage, version }) })
    .setDebug(true)
    .setLogger(() => new LoggerManager({ logger }));
  const request = client.createRequest<{ response: any }>()({ endpoint: "/users", cacheKey });

  return { client, request, logger };
};

describe("Cache [ Lazy Storage Resilience ]", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("When the data is loaded from the lazy storage", () => {
    it("should return nothing right away and emit the data once it is loaded", async () => {
      const { client, source } = createLazyClient();
      const value = createCacheValue({ cacheKey, version, data: { id: 1 } });
      const spy = vi.fn();
      source.set(cacheKey, value);
      client.cache.events.onDataByKey(cacheKey, spy);

      expect(client.cache.get(cacheKey)).toBeUndefined();
      await flushPromises();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toStrictEqual({ ...value, cached: true });
      expect(client.cache.get(cacheKey)).toStrictEqual(value);
    });

    it("should resolve the lazy resource with the loaded data", async () => {
      const { client, source } = createLazyClient();
      const value = createCacheValue({ cacheKey, version, data: { id: 1 } });
      source.set(cacheKey, value);

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toStrictEqual(value);
    });

    it("should resolve with nothing when no storage holds the data", async () => {
      const { client } = createLazyClient();
      const spy = vi.fn();
      client.cache.events.onData(spy);

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should resolve with the sync data when there is no lazy storage", async () => {
      const client = new Client({ url: "shared-base-url" });
      const request = client.createRequest<{ response: any }>()({ endpoint: "/users", cacheKey });
      client.cache.set(request, createCacheResponse({ id: 1 }));

      const resource = await client.cache.getLazyResource(cacheKey);

      expect(resource?.data).toStrictEqual({ id: 1 });
    });

    it("should collect the loaded data when its cache time passes", async () => {
      const { client, source } = createLazyClient();
      source.set(
        cacheKey,
        createCacheValue({ cacheKey, version, cacheTime: 1000, responseTimestamp: Date.now() - 400 }),
      );
      await client.cache.getLazyResource(cacheKey);

      vi.advanceTimersByTime(599);
      expect(client.cache.storage.get(cacheKey)).toBeDefined();

      vi.advanceTimersByTime(1);
      expect(client.cache.storage.get(cacheKey)).toBeUndefined();
      expect(source.has(cacheKey)).toBeFalse();
    });

    it("should emit the scoped data with the cache key of the request", async () => {
      const { client, source, request } = createLazyClient();
      const scoped = request.setScope("user-1");
      const storageKey = scopeKey(scoped.cacheKey, "user-1");
      const spy = vi.fn();
      source.set(storageKey, createCacheValue({ cacheKey: scoped.cacheKey, scope: "user-1", version, data: "scoped" }));
      client.cache.events.onDataByKey(scoped.cacheKey, spy);

      await client.cache.getLazyResource(storageKey);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(scoped.read()?.data).toBe("scoped");
    });
  });

  describe("When the lazy data gets stale", () => {
    const staleTime = 5000;

    it("should load the data just before the stale time passes", async () => {
      const { client, source } = createLazyClient();
      source.set(
        cacheKey,
        createCacheValue({ cacheKey, version, staleTime, responseTimestamp: Date.now() - staleTime + 1 }),
      );

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeDefined();
      expect(client.cache.storage.get(cacheKey)).toBeDefined();
    });

    it("should not load the data exactly when the stale time passes", async () => {
      const { client, source } = createLazyClient();
      const spy = vi.fn();
      source.set(
        cacheKey,
        createCacheValue({ cacheKey, version, staleTime, responseTimestamp: Date.now() - staleTime }),
      );
      client.cache.events.onData(spy);

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeUndefined();
      expect(client.cache.storage.get(cacheKey)).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should not load the data after the stale time passed", async () => {
      const { client, source } = createLazyClient();
      source.set(
        cacheKey,
        createCacheValue({ cacheKey, version, staleTime, responseTimestamp: Date.now() - staleTime - 1 }),
      );

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeUndefined();
    });

    it("should keep the stale data in the lazy storage until its cache time passes", async () => {
      const { client, source } = createLazyClient();
      source.set(
        cacheKey,
        createCacheValue({
          cacheKey,
          version,
          staleTime,
          cacheTime: 60_000,
          responseTimestamp: Date.now() - staleTime,
        }),
      );

      await client.cache.getLazyResource(cacheKey);

      expect(source.has(cacheKey)).toBeTrue();
    });

    it.each([
      { name: "infinite", value: Infinity },
      { name: "serialized to null", value: null as unknown as number },
    ])("should load the data with the $name stale time", async ({ value }) => {
      const { client, source } = createLazyClient();
      source.set(
        cacheKey,
        createCacheValue({ cacheKey, version, staleTime: value, cacheTime: Infinity, responseTimestamp: 1 }),
      );

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeDefined();
      expect(client.cache.storage.get(cacheKey)).toBeDefined();
    });
  });

  describe("When the lazy data is outdated", () => {
    it("should remove the data older than its cache time from the lazy storage", async () => {
      const { client, source, spies } = createLazyClient();
      const spy = vi.fn();
      source.set(
        cacheKey,
        createCacheValue({
          cacheKey,
          version,
          staleTime: 60_000,
          cacheTime: 1000,
          responseTimestamp: Date.now() - 1001,
        }),
      );
      client.cache.events.onData(spy);

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeUndefined();

      expect(spies.delete).toHaveBeenCalledWith(cacheKey);
      expect(source.has(cacheKey)).toBeFalse();
      expect(client.cache.storage.get(cacheKey)).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should keep the data as old as its cache time", async () => {
      const { client, source } = createLazyClient();
      source.set(
        cacheKey,
        createCacheValue({
          cacheKey,
          version,
          staleTime: 60_000,
          cacheTime: 1000,
          responseTimestamp: Date.now() - 1000,
        }),
      );

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeDefined();
      expect(source.has(cacheKey)).toBeTrue();
    });

    it("should keep the outdated data in the lazy storage while offline", async () => {
      const { client, source } = createLazyClient();
      source.set(
        cacheKey,
        createCacheValue({ cacheKey, version, staleTime: 500, cacheTime: 1000, responseTimestamp: Date.now() - 5000 }),
      );
      client.appManager.setOnline(false);

      await client.cache.getLazyResource(cacheKey);

      expect(source.has(cacheKey)).toBeTrue();
    });

    it.each([
      { name: "infinite", value: Infinity },
      { name: "serialized to null", value: null as unknown as number },
    ])("should never remove the data with the $name cache time", async ({ value }) => {
      const { client, source } = createLazyClient();
      source.set(
        cacheKey,
        createCacheValue({ cacheKey, version, staleTime: 500, cacheTime: value, responseTimestamp: 1 }),
      );

      await client.cache.getLazyResource(cacheKey);

      expect(source.has(cacheKey)).toBeTrue();
    });
  });

  describe("When both storages hold the data", () => {
    it("should keep the sync data when it is newer", async () => {
      const { client, source, request } = createLazyClient();
      const spy = vi.fn();
      source.set(cacheKey, createCacheValue({ cacheKey, version, data: "lazy", responseTimestamp: Date.now() - 100 }));
      client.cache.storage.set(cacheKey, createCacheValue({ cacheKey, version, data: "sync" }));
      client.cache.events.onData(spy);

      const resource = await client.cache.getLazyResource(cacheKey);

      expect(resource?.data).toBe("sync");
      expect(request.read()?.data).toBe("sync");
      expect(spy).not.toHaveBeenCalled();
    });

    it("should keep the sync data when both are equally old", async () => {
      const { client, source, request } = createLazyClient();
      source.set(cacheKey, createCacheValue({ cacheKey, version, data: "lazy" }));
      client.cache.storage.set(cacheKey, createCacheValue({ cacheKey, version, data: "sync" }));

      await client.cache.getLazyResource(cacheKey);

      expect(request.read()?.data).toBe("sync");
    });

    it("should replace the sync data when the lazy data is newer", async () => {
      const { client, source, request } = createLazyClient();
      const spy = vi.fn();
      source.set(cacheKey, createCacheValue({ cacheKey, version, data: "lazy" }));
      client.cache.storage.set(
        cacheKey,
        createCacheValue({ cacheKey, version, data: "sync", responseTimestamp: Date.now() - 100 }),
      );
      client.cache.events.onDataByKey(cacheKey, spy);

      await client.cache.getLazyResource(cacheKey);

      expect(request.read()?.data).toBe("lazy");
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should end up with the newest data when the lazy reads resolve out of order", async () => {
      const older = createDeferred<CacheValueType>();
      const newer = createDeferred<CacheValueType>();
      const get = vi.fn().mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
      const { client, request } = createFailingClient({
        get,
        set: async () => {},
        delete: async () => {},
        keys: async () => [],
      });

      const firstRead = client.cache.getLazyResource(cacheKey);
      const secondRead = client.cache.getLazyResource(cacheKey);

      newer.resolve(createCacheValue({ cacheKey, version, data: "newer" }));
      await secondRead;
      older.resolve(createCacheValue({ cacheKey, version, data: "older", responseTimestamp: Date.now() - 100 }));
      await firstRead;

      expect(request.read()?.data).toBe("newer");
    });

    it("should not override the response which arrived while the lazy storage was read", async () => {
      const lazyRead = createDeferred<CacheValueType>();
      const { client, request } = createFailingClient({
        get: () => lazyRead.promise as Promise<any>,
        set: async () => {},
        delete: async () => {},
        keys: async () => [],
      });
      const persisted = createCacheValue({ cacheKey, version, data: "persisted", responseTimestamp: Date.now() - 100 });

      const pendingRead = client.cache.getLazyResource(cacheKey);
      client.cache.set(request, createCacheResponse("fresh"));
      lazyRead.resolve(persisted);
      await pendingRead;

      expect(request.read()?.data).toBe("fresh");
    });
  });

  describe("When the version does not match", () => {
    it("should remove the lazy data saved by another version", async () => {
      const { client, source, spies } = createLazyClient();
      const spy = vi.fn();
      source.set(cacheKey, createCacheValue({ cacheKey, version: "previous-version" }));
      client.cache.events.onData(spy);

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeUndefined();

      expect(spies.delete).toHaveBeenCalledTimes(1);
      expect(source.has(cacheKey)).toBeFalse();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should never return the sync data saved by another version", async () => {
      const { client } = createLazyClient();
      client.cache.storage.set(cacheKey, createCacheValue({ cacheKey, version: "previous-version" }));

      expect(client.cache.get(cacheKey)).toBeUndefined();
      await flushPromises();

      expect(client.cache.get(cacheKey)).toBeUndefined();
      expect(client.cache.storage.get(cacheKey)).toBeUndefined();
    });

    it("should notify the listeners about the removed sync data only once", async () => {
      const { client } = createLazyClient();
      const spy = vi.fn();
      client.cache.storage.set(cacheKey, createCacheValue({ cacheKey, version: "previous-version" }));
      client.cache.events.onDelete(spy);

      client.cache.get(cacheKey);
      client.cache.get(cacheKey);
      await flushPromises();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should not resolve the lazy resource with the sync data saved by another version", async () => {
      const { client } = createLazyClient();
      client.cache.storage.set(cacheKey, createCacheValue({ cacheKey, version: "previous-version" }));

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeUndefined();
    });

    it("should use the default version when none is provided", () => {
      expect(new Cache().version).toBe("0.0.1");
      expect(new Cache({ version: "2.0.0" }).version).toBe("2.0.0");
    });
  });

  describe("When the data is written", () => {
    it("should save the stored response in the lazy storage", () => {
      const { client, request, source } = createLazyClient();

      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(source.get(cacheKey)).toBe(client.cache.storage.get(cacheKey));
    });

    it("should save the scoped response under the storage key", () => {
      const { client, request, source } = createLazyClient();
      const scoped = request.setScope("user-1");

      client.cache.set(scoped, createCacheResponse({ id: 1 }));

      expect([...source.keys()]).toStrictEqual([scopeKey(cacheKey, "user-1")]);
    });

    it("should not save the responses which are not stored", () => {
      const { client, request, spies } = createLazyClient();

      client.cache.set(request.setCache(false), createCacheResponse({ id: 1 }));
      client.cache.set(request, createCacheErrorResponse(new Error("Failed")));

      expect(spies.set).not.toHaveBeenCalled();
    });

    it("should save the updated element in the lazy storage", () => {
      const { client, request, source } = createLazyClient();
      client.cache.set(request, createCacheResponse({ id: 1 }));

      client.cache.update(request, { data: { id: 2 } });

      expect(source.get(cacheKey)?.data).toStrictEqual({ id: 2 });
    });

    it("should remove the deleted element from the lazy storage", () => {
      const { client, request, source } = createLazyClient();
      client.cache.set(request, createCacheResponse({ id: 1 }));

      client.cache.delete(cacheKey);

      expect(source.has(cacheKey)).toBeFalse();
    });

    it("should remove the collected element from the lazy storage", () => {
      const { client, request, source } = createLazyClient();
      client.cache.set(request.setCacheTime(1000), createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(1000);

      expect(source.has(cacheKey)).toBeFalse();
    });

    it("should not read the lazy storage when the data is set", () => {
      const { client, request, spies } = createLazyClient();

      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(spies.get).not.toHaveBeenCalled();
    });
  });

  describe("When listing the keys", () => {
    it("should return the lazy keys without the duplicates", async () => {
      const { client } = createFailingClient({
        ...createLazyStorage().storage,
        keys: async () => ["first", "second", "first"],
      });

      await expect(client.cache.getLazyKeys()).resolves.toStrictEqual(["first", "second"]);
    });

    it("should accept the iterator of the lazy keys", async () => {
      const { client, source } = createLazyClient();
      source.set("first", createCacheValue());
      const iteratorClient = createFailingClient({
        ...createLazyStorage().storage,
        keys: async () => source.keys(),
      }).client;

      await expect(iteratorClient.cache.getLazyKeys()).resolves.toStrictEqual(["first"]);
      await expect(client.cache.getLazyKeys()).resolves.toStrictEqual(["first"]);
    });

    it("should merge the keys of both storages without the duplicates", async () => {
      const { client, request, source } = createLazyClient();
      source.set("only-lazy", createCacheValue({ cacheKey: "only-lazy", version }));
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.storage.set("only-sync", createCacheValue({ cacheKey: "only-sync", version }));

      const keys = await client.cache.getAllKeys();

      expect(keys).toIncludeSameMembers([cacheKey, "only-lazy", "only-sync"]);
    });

    it("should return only the sync keys from the keys method", () => {
      const { client, request, source } = createLazyClient();
      source.set("only-lazy", createCacheValue({ cacheKey: "only-lazy", version }));
      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(client.cache.keys()).toStrictEqual([cacheKey]);
    });

    it("should pass the failure of the lazy keys to the caller", async () => {
      const { client } = createFailingClient({
        ...createLazyStorage().storage,
        keys: async () => {
          throw new Error("Keys failed");
        },
      });

      await expect(client.cache.getLazyKeys()).rejects.toThrow("Keys failed");
      await expect(client.cache.getAllKeys()).rejects.toThrow("Keys failed");
    });
  });

  describe("When the lazy storage fails", () => {
    const rejectingStorage = (): CacheAsyncStorageType => ({
      get: () => Promise.reject(new Error("Get failed")),
      set: () => Promise.reject(new Error("Set failed")),
      delete: () => Promise.reject(new Error("Delete failed")),
      keys: () => Promise.reject(new Error("Keys failed")),
    });

    const throwingStorage = (): CacheAsyncStorageType => ({
      get: () => {
        throw new Error("Get failed");
      },
      set: () => {
        throw new Error("Set failed");
      },
      delete: () => {
        throw new Error("Delete failed");
      },
      keys: () => {
        throw new Error("Keys failed");
      },
    });

    it.each([
      { name: "rejects", createStorage: rejectingStorage },
      { name: "throws", createStorage: throwingStorage },
    ])("should store and emit the response when the lazy write $name", async ({ createStorage }) => {
      const { client, request } = createFailingClient(createStorage());
      const spy = vi.fn();
      client.cache.events.onDataByKey(cacheKey, spy);

      const rejections = await getUnhandledRejections(() => {
        client.cache.set(request, createCacheResponse({ id: 1 }));
      });

      expect(rejections).toHaveLength(0);
      expect(client.cache.storage.get(cacheKey)?.data).toStrictEqual({ id: 1 });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(client.cache.garbageCollectors.size).toBe(1);
    });

    it.each([
      { name: "rejects", createStorage: rejectingStorage },
      { name: "throws", createStorage: throwingStorage },
    ])("should return the sync data when the lazy read $name", async ({ createStorage }) => {
      const { client, request } = createFailingClient(createStorage());
      client.cache.set(request, createCacheResponse({ id: 1 }));

      let read: CacheValueType | undefined;
      const rejections = await getUnhandledRejections(() => {
        read = client.cache.get(cacheKey);
      });

      expect(rejections).toHaveLength(0);
      expect(read?.data).toStrictEqual({ id: 1 });
      await expect(client.cache.getLazyResource(cacheKey)).resolves.toStrictEqual(read);
    });

    it.each([
      { name: "rejects", createStorage: rejectingStorage },
      { name: "throws", createStorage: throwingStorage },
    ])("should delete the element and notify the listeners when the lazy delete $name", async ({ createStorage }) => {
      const { client, request } = createFailingClient(createStorage());
      const spy = vi.fn();
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.events.onDeleteByKey(cacheKey, spy);

      const rejections = await getUnhandledRejections(() => {
        client.cache.delete(cacheKey);
      });

      expect(rejections).toHaveLength(0);
      expect(client.cache.storage.get(cacheKey)).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should log the failures of the lazy storage", async () => {
      const { client, request, logger } = createFailingClient(rejectingStorage());

      client.cache.set(request, createCacheResponse({ id: 1 }));
      await client.cache.getLazyResource(cacheKey);
      client.cache.delete(cacheKey);
      await flushPromises();

      const titles = logger.mock.calls.map(([log]) => log.title);
      expect(titles).toStrictEqual([
        'Lazy storage "set" failed',
        'Lazy storage "get" failed',
        'Lazy storage "delete" failed',
      ]);
      expect(logger.mock.calls.every(([log]) => log.level === "error" && log.module === "Cache")).toBeTrue();
    });

    it("should return the sync data without waiting for the lazy storage which never answers", () => {
      const { client, request } = createFailingClient({
        get: () => new Promise(() => {}),
        set: () => new Promise(() => {}),
        delete: () => new Promise(() => {}),
        keys: () => new Promise(() => {}),
      });

      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(client.cache.get(cacheKey)?.data).toStrictEqual({ id: 1 });
    });

    it.each([
      { name: "null", value: null },
      { name: "undefined", value: undefined },
      { name: "empty string", value: "" },
      { name: "zero", value: 0 },
      { name: "text", value: "not a cache value" },
      { name: "number", value: 123 },
      { name: "array", value: [1, 2, 3] },
      { name: "empty object", value: {} },
      { name: "object without the version", value: { data: "value", staleTime: 1000, cacheTime: 1000 } },
    ])("should not load the garbage returned by the lazy storage - $name", async ({ value }) => {
      const { client } = createFailingClient({
        get: async () => value as any,
        set: async () => {},
        delete: async () => {},
        keys: async () => [],
      });
      const spy = vi.fn();
      client.cache.events.onData(spy);

      const rejections = await getUnhandledRejections(async () => {
        await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeUndefined();
      });

      expect(rejections).toHaveLength(0);
      expect(client.cache.storage.get(cacheKey)).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove the element without the timestamps from the lazy storage", async () => {
      const deleteSpy = vi.fn(async () => {});
      const { client } = createFailingClient({
        get: async () => ({ version, data: "value" }) as any,
        set: async () => {},
        delete: deleteSpy,
        keys: async () => [],
      });

      await expect(client.cache.getLazyResource(cacheKey)).resolves.toBeUndefined();

      expect(deleteSpy).toHaveBeenCalledWith(cacheKey);
      expect(client.cache.storage.get(cacheKey)).toBeUndefined();
    });
  });
});
