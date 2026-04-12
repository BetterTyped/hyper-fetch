import { waitFor } from "@testing-library/dom";

import type { ResponseSuccessType } from "adapter";
import type { ResponseDetailsType } from "managers";
import { createCache, createLazyCacheAdapter } from "../../utils";
import { Client } from "client";
import type { HttpAdapterType } from "http-adapter";
import { xhrExtra } from "http-adapter";
import { scopeKey } from "request";

describe("Cache [ Scoping ]", () => {
  const response: ResponseSuccessType<unknown, HttpAdapterType> = {
    data: { id: 1 },
    error: null,
    status: 200,
    success: true,
    extra: xhrExtra,
    requestTimestamp: Date.now(),
    responseTimestamp: Date.now(),
  };
  const details: ResponseDetailsType = {
    retries: 0,
    requestTimestamp: +new Date(),
    responseTimestamp: +new Date(),
    addedTimestamp: +new Date(),
    triggerTimestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    willRetry: false,
  };

  describe("cache.set / cache.get", () => {
    it("merges functional updates only within the same scope", () => {
      const client = new Client({ url: "http://test.com" });
      const base = client.createRequest<{ response: { id: number } }>()({ endpoint: "/users" });
      const cache = createCache(client);

      const a = base.setScope("a");
      const b = base.setScope("b");

      cache.set(a, { ...response, ...details, data: { id: 1 } });
      cache.set(b, { ...response, ...details, data: { id: 2 } });

      cache.set(a, (prev) => ({ ...response, ...details, data: { id: (prev?.data as { id: number }).id + 10 } }));

      expect(cache.get(scopeKey(base.cacheKey, "a"))?.data).toStrictEqual({ id: 11 });
      expect(cache.get(scopeKey(base.cacheKey, "b"))?.data).toStrictEqual({ id: 2 });
    });

    it("writes lazy storage under scoped keys", async () => {
      const lazyMap = new Map<string, unknown>();
      const client = new Client({ url: "http://test.com" });
      const request = client.createRequest<{ response: unknown }>()({ endpoint: "/lazy" }).setScope("sess");
      const cache = createCache(client, { lazyStorage: createLazyCacheAdapter(lazyMap) });

      cache.set(request, { ...response, ...details });
      const sk = scopeKey(request.cacheKey, "sess");

      await waitFor(() => {
        expect(lazyMap.has(sk)).toBe(true);
      });
      expect(cache.get(sk)).toBeDefined();
    });
  });

  describe("cache.update", () => {
    it("updates the scoped slot, not the unscoped key", () => {
      const client = new Client({ url: "http://test.com" });
      const base = client.createRequest<{ response: string }>()({ endpoint: "/x" });
      const scoped = base.setScope("u1");
      const cache = createCache(client);

      cache.set(scoped.setCache(true), { ...response, ...details, data: "first" });
      cache.update(scoped.setCache(true), { data: "second" });

      expect(cache.get(base.cacheKey)).toBeUndefined();
      expect(cache.get(scopeKey(base.cacheKey, "u1"))?.data).toBe("second");
    });
  });

  describe("cache.delete", () => {
    it("removes only the scoped storage entry", () => {
      const client = new Client({ url: "http://test.com" });
      const base = client.createRequest<{ response: unknown }>()({ endpoint: "/d" });
      const cache = createCache(client);

      cache.set(base.setScope("s1").setCache(true), { ...response, ...details });
      cache.set(base.setScope("s2").setCache(true), { ...response, ...details, data: { id: 2 } });

      cache.delete(scopeKey(base.cacheKey, "s1"));

      expect(cache.get(scopeKey(base.cacheKey, "s1"))).toBeUndefined();
      expect(cache.get(scopeKey(base.cacheKey, "s2"))).toBeDefined();
    });
  });

  describe("cache.invalidate(Request)", () => {
    it("targets scoped storage but emits invalidation by logical cacheKey", async () => {
      const client = new Client({ url: "http://test.com" });
      const scoped = client.createRequest<{ response: unknown }>()({ endpoint: "/inv" }).setScope("z");
      const cache = createCache(client);

      cache.set(scoped.setCache(true).setStaleTime(5000), { ...response, ...details });

      const spy = vi.fn();
      const unmount = cache.events.onInvalidateByKey(scoped.cacheKey, spy);

      await cache.invalidate(scoped);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(cache.get(scopeKey(scoped.cacheKey, "z"))?.staleTime).toBe(0);
      unmount();
    });
  });

  describe("garbage collection", () => {
    it("expires scoped entries by storage key", async () => {
      const client = new Client({ url: "http://test.com" });
      const scoped = client.createRequest<{ response: unknown }>()({ endpoint: "/gc" }).setScope("g");
      const cache = createCache(client);

      cache.set(scoped.setCache(true).setCacheTime(10), { ...response, ...details });

      await waitFor(() => {
        expect(cache.get(scopeKey(scoped.cacheKey, "g"))).toBeUndefined();
      });
    });
  });

  describe("dispatcher → cache.set", () => {
    it("persists under scopeKey when request has scope", async () => {
      const client = new Client({ url: "http://test.com" });
      const req = client
        .createRequest<{ response: { ok: boolean } }>()({ endpoint: "/disp-scope" })
        .setScope("tenant-1")
        .setMock(() => ({ data: { ok: true }, status: 200 }));

      await req.send();

      const sk = scopeKey(req.cacheKey, "tenant-1");
      expect(client.cache.keys()).toContain(sk);
      expect(client.cache.get(req.cacheKey)).toBeUndefined();
      expect(client.cache.get(sk)?.data).toStrictEqual({ ok: true });
    });
  });

  describe("Request.read / dehydrate", () => {
    it("read() uses scoped cache slot", async () => {
      const client = new Client({ url: "http://test.com" });
      const req = client
        .createRequest<{ response: string }>()({ endpoint: "/read-scope" })
        .setScope("r1")
        .setMock(() => ({ data: "cached", status: 200 }));

      await req.send();
      expect(req.read()?.data).toBe("cached");
    });

    it("dehydrate() reads from scoped cache slot", async () => {
      const client = new Client({ url: "http://test.com" });
      const req = client
        .createRequest<{ response: number }>()({ endpoint: "/dehyd-scope" })
        .setScope("d1")
        .setMock(() => ({ data: 42, status: 200 }));

      await req.send();
      const dehydrated = req.dehydrate();
      expect(dehydrated).toEqual(expect.objectContaining({ scope: "d1", cacheKey: req.cacheKey }));
    });
  });
});
