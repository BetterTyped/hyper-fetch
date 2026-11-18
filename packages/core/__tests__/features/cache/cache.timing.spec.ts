import { Cache } from "cache";
import { Client } from "client";
import { Time } from "constants/time.constants";
import { Plugin } from "plugin";
import { scopeKey } from "request";

import { createCacheResponse, createCacheValue } from "../../utils/fixtures.utils";

describe("Cache [ Timing ]", () => {
  const cacheTime = 1000;

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "/users", cacheTime });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: any }>()({ endpoint: "/users", cacheTime });
  });

  afterEach(() => {
    client.cache.clear();
    vi.useRealTimers();
  });

  describe("When cache time passes", () => {
    it("should keep the element just before the cache time passes", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(cacheTime - 1);

      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ id: 1 });
    });

    it("should remove the element exactly when the cache time passes", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(cacheTime);

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
      expect(client.cache.keys()).toHaveLength(0);
    });

    it("should notify the listeners and plugins about the collected element", () => {
      const deleteSpy = vi.fn();
      const deleteByKeySpy = vi.fn();
      const pluginSpy = vi.fn();
      client.addPlugin(new Plugin({ name: "delete" }).onCacheItemDelete(pluginSpy));
      client.cache.events.onDelete(deleteSpy);
      client.cache.events.onDeleteByKey(request.cacheKey, deleteByKeySpy);
      client.cache.set(request, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(cacheTime);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith(request.cacheKey);
      expect(deleteByKeySpy).toHaveBeenCalledTimes(1);
      expect(pluginSpy).toHaveBeenCalledTimes(1);
      expect(pluginSpy).toHaveBeenCalledWith({ cache: client.cache, cacheKey: request.cacheKey });
    });

    it("should collect the element even when it has active listeners", () => {
      const dataSpy = vi.fn();
      client.cache.events.onDataByKey(request.cacheKey, dataSpy);
      client.cache.set(request, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(cacheTime);

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
      expect(dataSpy).toHaveBeenCalledTimes(1);
    });

    it("should count the cache time from the response timestamp", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }, { responseTimestamp: Date.now() - 400 }));

      vi.advanceTimersByTime(cacheTime - 401);
      expect(client.cache.get(request.cacheKey)).toBeDefined();

      vi.advanceTimersByTime(1);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should remove the element right away when the response is already outdated", () => {
      const spy = vi.fn();
      client.cache.events.onDataByKey(request.cacheKey, spy);

      client.cache.set(request, createCacheResponse({ id: 1 }, { responseTimestamp: Date.now() - cacheTime - 1 }));

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
      expect(client.cache.garbageCollectors.size).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should keep the element with the response as old as the cache time until the timers run", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }, { responseTimestamp: Date.now() - cacheTime }));

      expect(client.cache.get(request.cacheKey)).toBeDefined();

      vi.advanceTimersByTime(0);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should emit the data and remove the element with the next timers run when the cache time is zero", () => {
      const spy = vi.fn();
      const zeroRequest = request.setCacheTime(0);
      client.cache.events.onDataByKey(zeroRequest.cacheKey, spy);

      client.cache.set(zeroRequest, createCacheResponse({ id: 1 }));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].data).toStrictEqual({ id: 1 });

      vi.advanceTimersByTime(0);
      expect(client.cache.get(zeroRequest.cacheKey)).toBeUndefined();
    });

    it("should collect the elements independently", () => {
      const short = request.setCacheKey("short").setCacheTime(100);
      const long = request.setCacheKey("long").setCacheTime(200);
      client.cache.set(short, createCacheResponse("short"));
      client.cache.set(long, createCacheResponse("long"));

      vi.advanceTimersByTime(100);
      expect(short.read()).toBeUndefined();
      expect(long.read()?.data).toBe("long");

      vi.advanceTimersByTime(100);
      expect(long.read()).toBeUndefined();
    });

    it("should collect the scoped element", () => {
      const scoped = request.setScope("user-1");
      const storageKey = scopeKey(scoped.cacheKey, "user-1");
      const spy = vi.fn();
      client.cache.events.onDelete(spy);
      client.cache.set(scoped, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(cacheTime);

      expect(client.cache.get(storageKey)).toBeUndefined();
      expect(spy).toHaveBeenCalledWith(storageKey);
    });

    it("should forget the collector once the element is collected", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      expect(client.cache.garbageCollectors.size).toBe(1);

      vi.advanceTimersByTime(cacheTime);

      expect(client.cache.garbageCollectors.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("When the element changes before it is collected", () => {
    it("should count the cache time from the latest response", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      vi.advanceTimersByTime(600);
      client.cache.set(request, createCacheResponse({ id: 2 }));

      vi.advanceTimersByTime(cacheTime - 1);
      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ id: 2 });

      vi.advanceTimersByTime(1);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should keep a single collector for the element", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.set(request, createCacheResponse({ id: 2 }));
      client.cache.set(request, createCacheResponse({ id: 3 }));

      expect(client.cache.garbageCollectors.size).toBe(1);
      expect(vi.getTimerCount()).toBe(1);
    });

    it("should use the cache time of the latest request", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.set(request.setCacheTime(5000), createCacheResponse({ id: 2 }));

      vi.advanceTimersByTime(4999);
      expect(client.cache.get(request.cacheKey)).toBeDefined();

      vi.advanceTimersByTime(1);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should not extend the cache time with the update which keeps the response timestamp", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      vi.advanceTimersByTime(600);
      client.cache.update(request, { data: { id: 2 } });

      vi.advanceTimersByTime(399);
      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ id: 2 });

      vi.advanceTimersByTime(1);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should not extend the cache time with the invalidation", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      vi.advanceTimersByTime(600);
      client.cache.invalidate(request.cacheKey);

      vi.advanceTimersByTime(400);

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should not emit the deletion again when the element was deleted manually", () => {
      const spy = vi.fn();
      client.cache.events.onDelete(spy);
      client.cache.set(request, createCacheResponse({ id: 1 }));

      client.cache.delete(request.cacheKey);
      vi.advanceTimersByTime(cacheTime * 2);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should stop the collector of the element deleted manually", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));

      client.cache.delete(request.cacheKey);

      expect(client.cache.garbageCollectors.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should collect the element set again after the manual deletion with its own time", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      vi.advanceTimersByTime(600);
      client.cache.delete(request.cacheKey);
      client.cache.set(request, createCacheResponse({ id: 2 }));

      vi.advanceTimersByTime(cacheTime - 1);
      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ id: 2 });

      vi.advanceTimersByTime(1);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });
  });

  describe("When cache time is infinite or very long", () => {
    it("should never collect the element with the infinite cache time", () => {
      const infinite = request.setCacheTime(Infinity);
      client.cache.set(infinite, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(Time.YEAR);

      expect(client.cache.get(infinite.cacheKey)?.data).toStrictEqual({ id: 1 });
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should never collect the element with the cache time serialized to null", () => {
      const storage = new Map<any, any>([
        ["serialized", createCacheValue({ cacheKey: "serialized", cacheTime: null as any })],
      ]);
      const cache = new Cache({ storage }).initialize(client);

      vi.advanceTimersByTime(Time.YEAR);

      expect(cache.get("serialized")).toBeDefined();
      expect(cache.garbageCollectors.size).toBe(0);
    });

    it.each([
      { name: "30 days", time: Time.MONTH_30 },
      { name: "a year", time: Time.YEAR },
    ])("should not collect the element with the cache time of $name right away", ({ time }) => {
      const longRequest = request.setCacheTime(time);
      client.cache.set(longRequest, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(Time.DAY);

      expect(client.cache.get(longRequest.cacheKey)?.data).toStrictEqual({ id: 1 });
    });

    it("should collect the element with the cache time longer than the timers limit exactly on time", () => {
      const longRequest = request.setCacheTime(Time.MONTH_30);
      client.cache.set(longRequest, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(Time.MONTH_30 - 1);
      expect(client.cache.get(longRequest.cacheKey)).toBeDefined();

      vi.advanceTimersByTime(1);
      expect(client.cache.get(longRequest.cacheKey)).toBeUndefined();
    });

    it("should keep a single collector while it waits for the very long cache time", () => {
      const longRequest = request.setCacheTime(Time.YEAR);
      client.cache.set(longRequest, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(Time.MONTH_31 * 3);

      expect(client.cache.garbageCollectors.size).toBe(1);
      expect(vi.getTimerCount()).toBe(1);
    });

    it("should collect the element with the cache time equal to the timers limit", () => {
      const limit = 2 ** 31 - 1;
      const limitRequest = request.setCacheTime(limit);
      client.cache.set(limitRequest, createCacheResponse({ id: 1 }));

      vi.advanceTimersByTime(limit - 1);
      expect(client.cache.get(limitRequest.cacheKey)).toBeDefined();

      vi.advanceTimersByTime(1);
      expect(client.cache.get(limitRequest.cacheKey)).toBeUndefined();
    });
  });

  describe("When application is offline", () => {
    it("should keep the outdated element while offline", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.appManager.setOnline(false);

      vi.advanceTimersByTime(cacheTime * 10);

      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ id: 1 });
    });

    it("should collect the outdated element once the application is back online", () => {
      const spy = vi.fn();
      client.cache.events.onDelete(spy);
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.appManager.setOnline(false);
      vi.advanceTimersByTime(cacheTime * 10);

      client.appManager.setOnline(true);

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should keep the element set while offline even if it is already outdated", () => {
      client.appManager.setOnline(false);

      client.cache.set(request, createCacheResponse({ id: 1 }, { responseTimestamp: Date.now() - cacheTime * 2 }));

      expect(client.cache.get(request.cacheKey)).toBeDefined();
    });

    it("should keep counting the cache time of the elements which are still valid after going back online", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.appManager.setOnline(false);
      vi.advanceTimersByTime(400);

      client.appManager.setOnline(true);
      expect(client.cache.get(request.cacheKey)).toBeDefined();
      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(599);
      expect(client.cache.get(request.cacheKey)).toBeDefined();

      vi.advanceTimersByTime(1);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should not schedule the collectors twice when the online event repeats", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));

      client.appManager.setOnline(true);
      client.appManager.setOnline(true);
      client.appManager.setOnline(true);

      expect(vi.getTimerCount()).toBe(1);
    });
  });

  describe("When cache is initialized with the stored elements", () => {
    it("should schedule the collection of the stored elements", () => {
      const storage = new Map<any, any>([
        ["stored", createCacheValue({ cacheKey: "stored", cacheTime, responseTimestamp: Date.now() - 300 })],
      ]);
      const cache = new Cache({ storage }).initialize(client);

      vi.advanceTimersByTime(699);
      expect(cache.get("stored")).toBeDefined();

      vi.advanceTimersByTime(1);
      expect(cache.get("stored")).toBeUndefined();
    });

    it("should remove the outdated stored elements right away", () => {
      const storage = new Map<any, any>([
        [
          "outdated",
          createCacheValue({ cacheKey: "outdated", cacheTime, responseTimestamp: Date.now() - cacheTime - 1 }),
        ],
        ["valid", createCacheValue({ cacheKey: "valid", cacheTime, responseTimestamp: Date.now() })],
      ]);

      const cache = new Cache({ storage }).initialize(client);

      expect(cache.keys()).toStrictEqual(["valid"]);
    });

    it("should remove the stored elements without the cache time", () => {
      const storage = new Map<any, any>([
        ["broken", createCacheValue({ cacheKey: "broken", cacheTime: undefined as any })],
      ]);

      const cache = new Cache({ storage }).initialize(client);

      expect(cache.keys()).toHaveLength(0);
    });
  });

  describe("When cache gets cleared", () => {
    it("should stop every collector", async () => {
      client.cache.set(request.setCacheKey("first"), createCacheResponse(1));
      client.cache.set(request.setCacheKey("second"), createCacheResponse(2));
      expect(vi.getTimerCount()).toBe(2);

      await client.cache.clear();

      expect(vi.getTimerCount()).toBe(0);
      expect(client.cache.garbageCollectors.size).toBe(0);
    });

    it("should not emit the deletions of the cleared elements later", async () => {
      const spy = vi.fn();
      client.cache.events.onDelete(spy);
      client.cache.set(request, createCacheResponse(1));

      await client.cache.clear();
      vi.advanceTimersByTime(cacheTime * 2);

      expect(spy).not.toHaveBeenCalled();
    });

    it("should stop the collectors when the client is cleared", () => {
      const previousCache = client.cache;
      const spy = vi.fn();
      previousCache.events.onDelete(spy);
      client.cache.set(request, createCacheResponse(1));

      client.clear();
      vi.advanceTimersByTime(cacheTime * 2);

      expect(previousCache.garbageCollectors.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
