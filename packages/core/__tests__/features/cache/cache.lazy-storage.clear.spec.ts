import type { CacheAsyncStorageType, CacheValueType } from "cache";
import { Cache } from "cache";
import { Client } from "client";

import {
  createCacheResponse,
  createCacheValue,
  createLazyStorage,
  flushPromises,
  getUnhandledRejections,
} from "../../utils/fixtures.utils";

const version = "test-version";

const createLazyClient = (lazyStorage: CacheAsyncStorageType) => {
  const client = new Client({ url: "shared-base-url", cache: () => new Cache({ lazyStorage, version }) });
  const request = client.createRequest<{ response: { owner: string } }>()({ endpoint: "/profile" });

  return { client, request };
};

/**
 * Clearing the cache is how an application forgets its data, for example on logout. Data left in the lazy
 * (persistent) storage would be loaded back by the next read - for the next user.
 */
describe("Cache [ Lazy Storage Clear ]", () => {
  describe("When the cache is cleared", () => {
    it("should remove every element from the lazy storage", async () => {
      const { storage, source } = createLazyStorage();
      const { client, request } = createLazyClient(storage);
      client.cache.set(request, createCacheResponse({ owner: "first user" }));
      client.cache.set(request.setScope("other"), createCacheResponse({ owner: "second user" }));
      await flushPromises();
      expect(source.size).toBe(2);

      await client.cache.clear();

      expect(source.size).toBe(0);
    });

    it("should not load the cleared data back on the next read", async () => {
      const { storage } = createLazyStorage();
      const { client, request } = createLazyClient(storage);
      const received = vi.fn();
      client.cache.set(request, createCacheResponse({ owner: "first user" }));
      await flushPromises();

      await client.cache.clear();
      client.cache.events.onDataByKey(request.cacheKey, received);
      const value = client.cache.get(request.cacheKey);
      await flushPromises();

      expect(value).toBeUndefined();
      expect(received).not.toHaveBeenCalled();
      expect(await client.cache.getLazyResource(request.cacheKey)).toBeUndefined();
    });

    it("should remove the elements that were only in the lazy storage", async () => {
      const source = new Map<string, CacheValueType>([
        ["persisted-a", createCacheValue({ cacheKey: "persisted-a", version, data: { owner: "a" } })],
        ["persisted-b", createCacheValue({ cacheKey: "persisted-b", version, data: { owner: "b" } })],
      ]);
      const { storage } = createLazyStorage(source);
      const { client } = createLazyClient(storage);

      await client.cache.clear();

      expect([...source.keys()]).toStrictEqual([]);
    });

    it("should accept a lazy storage that returns its keys as an iterator", async () => {
      const { storage, source, spies } = createLazyStorage();
      spies.keys.mockImplementation((async () => source.keys()) as never);
      const { client, request } = createLazyClient(storage);
      client.cache.set(request, createCacheResponse({ owner: "first user" }));
      await flushPromises();

      await client.cache.clear();

      expect(source.size).toBe(0);
    });

    it("should clear the memory also when there is no lazy storage", async () => {
      const client = new Client({ url: "shared-base-url" });
      const request = client.createRequest<{ response: { owner: string } }>()({ endpoint: "/profile" });
      client.cache.set(request, createCacheResponse({ owner: "first user" }));

      await client.cache.clear();

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });
  });

  describe("When the client is cleared", () => {
    it("should remove the data from the lazy storage", async () => {
      const { storage, source } = createLazyStorage();
      const { client, request } = createLazyClient(storage);
      client.cache.set(request, createCacheResponse({ owner: "first user" }));
      await flushPromises();

      client.clear();
      await flushPromises();

      expect(source.size).toBe(0);
      expect(await client.cache.getLazyResource(request.cacheKey)).toBeUndefined();
    });
  });

  describe("When the lazy storage fails", () => {
    it.each([
      ["reading the keys", "keys"],
      ["deleting an element", "delete"],
    ] as const)("should still clear the memory when %s rejects", async (_name, method) => {
      const { storage, spies } = createLazyStorage();
      const { client, request } = createLazyClient(storage);
      client.cache.set(request, createCacheResponse({ owner: "first user" }));
      await flushPromises();
      spies[method].mockRejectedValue(new Error("Storage is not available"));

      const rejections = await getUnhandledRejections(() => client.cache.clear());

      expect(rejections).toStrictEqual([]);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should remove the other elements when deleting one of them rejects", async () => {
      const source = new Map<string, CacheValueType>([
        ["broken", createCacheValue({ cacheKey: "broken", version, data: { owner: "a" } })],
        ["fine", createCacheValue({ cacheKey: "fine", version, data: { owner: "b" } })],
      ]);
      const { storage, spies } = createLazyStorage(source);
      spies.delete.mockImplementation(async (key: string) => {
        if (key === "broken") {
          throw new Error("Storage is not available");
        }
        source.delete(key);
      });
      const { client } = createLazyClient(storage);

      await client.cache.clear();

      expect([...source.keys()]).toStrictEqual(["broken"]);
    });
  });
});
