import type { ResponseSuccessType } from "adapter";
import type { ResponseDetailsType } from "managers";
import { createCache } from "../../utils";
import { Client } from "client";
import type { HttpAdapterType } from "http-adapter";
import { xhrExtra } from "http-adapter";

const createServerClient = (url: string) => new Client({ url, mode: "server" });

describe("Cache [ Modes ]", () => {
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

  describe("client mode (browser — auto-detected)", () => {
    it("should auto-detect client mode in browser environment", () => {
      const client = new Client({ url: "http://test.com" });
      expect(client.mode).toBe("client");
    });

    it("should treat explicit mode auto like omitted (client in jsdom)", () => {
      const client = new Client({ url: "http://test.com", mode: "auto" });
      expect(client.mode).toBe("client");
    });

    it("should force client mode when option is client", () => {
      const client = new Client({ url: "http://test.com", mode: "client" });
      expect(client.mode).toBe("client");
      const request = client.createRequest<{ response: any }>()({ endpoint: "/users" });
      const cache = createCache(client);
      cache.set(request, { ...response, ...details });
      expect(cache.get(request.cacheKey)).toBeDefined();
    });

    it("should cache responses by default", () => {
      const client = new Client({ url: "http://test.com" });
      const request = client.createRequest<{ response: any }>()({ endpoint: "/users" });
      const cache = createCache(client);

      cache.set(request, { ...response, ...details });

      const cached = cache.get(request.cacheKey);
      expect(cached).toBeDefined();
      expect(cached!.data).toStrictEqual({ id: 1 });
    });

    it("should support scope for cache partitioning", () => {
      const client = new Client({ url: "http://test.com" });
      const request = client.createRequest<{ response: any }>()({ endpoint: "/users" });
      const scopedRequest = request.setScope("session-1");
      const cache = createCache(client);

      cache.set(scopedRequest, { ...response, ...details });

      const unscopedCached = cache.get(request.cacheKey);
      expect(unscopedCached).toBeUndefined();

      const scopedCached = cache.get(`session-1__${request.cacheKey}`);
      expect(scopedCached).toBeDefined();
      expect(scopedCached!.data).toStrictEqual({ id: 1 });
    });
  });

  describe("server mode", () => {
    it("should force server mode in browser-like environment when option is server", () => {
      const client = new Client({ url: "http://test.com", mode: "server" });
      expect(client.mode).toBe("server");
    });

    it("should NOT cache responses by default", () => {
      const client = createServerClient("http://test.com");
      const request = client.createRequest<{ response: any }>()({ endpoint: "/users" });
      const cache = createCache(client);

      cache.set(request, { ...response, ...details });

      const cached = cache.get(request.cacheKey);
      expect(cached).toBeUndefined();
    });

    it("should cache responses when scope is set", () => {
      const client = createServerClient("http://test.com");
      const request = client.createRequest<{ response: any }>()({ endpoint: "/users" }).setScope("req-123");
      const cache = createCache(client);

      cache.set(request, { ...response, ...details });

      const cached = cache.get(`req-123__${request.cacheKey}`);
      expect(cached).toBeDefined();
      expect(cached!.data).toStrictEqual({ id: 1 });
    });

    it("should isolate cache between different scopes", () => {
      const client = createServerClient("http://test.com");
      const baseRequest = client.createRequest<{ response: any }>()({ endpoint: "/users" });
      const cache = createCache(client);

      const req1 = baseRequest.setScope("scope-a");
      const req2 = baseRequest.setScope("scope-b");

      const response2: ResponseSuccessType<unknown, HttpAdapterType> = {
        ...response,
        data: { id: 2 },
      };

      cache.set(req1, { ...response, ...details });
      cache.set(req2, { ...response2, ...details });

      const cached1 = cache.get(`scope-a__${baseRequest.cacheKey}`);
      const cached2 = cache.get(`scope-b__${baseRequest.cacheKey}`);

      expect(cached1!.data).toStrictEqual({ id: 1 });
      expect(cached2!.data).toStrictEqual({ id: 2 });
    });
  });

  describe("setScope on Request", () => {
    it("should return a new request with the scope set", () => {
      const client = new Client({ url: "http://test.com" });
      const request = client.createRequest<{ response: any }>()({ endpoint: "/users" });

      expect(request.scope).toBeNull();

      const scoped = request.setScope("my-scope");
      expect(scoped.scope).toBe("my-scope");
      expect(request.scope).toBeNull();
    });
  });
});
