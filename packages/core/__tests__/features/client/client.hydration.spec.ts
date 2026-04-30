import type { CacheValueType } from "cache";
import { Client } from "client";
import { xhrExtra } from "http-adapter";
import { scopeKey } from "request";

describe("Client [ Hydration ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" });
  });

  describe("When using hydrate", () => {
    it("should not dehydrate from empty cache", async () => {
      const dehydratedResponse = request.dehydrate();

      expect(dehydratedResponse).toBeUndefined();
    });
    it("should dehydrate from cache", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      const response = await mockedRequest.send();

      const dehydratedResponse = mockedRequest.dehydrate();

      expect(dehydratedResponse).toStrictEqual(expect.objectContaining({ cacheKey: request.cacheKey, response }));

      const newClient = new Client({ url: "shared-base-url" });

      expect(newClient.cache.get(mockedRequest.cacheKey)).not.toBeDefined();

      newClient.hydrate([dehydratedResponse]);

      expect(newClient.cache.get(mockedRequest.cacheKey)).toStrictEqual(
        expect.objectContaining({ ...response, cacheKey: request.cacheKey, staleTime: request.staleTime }),
      );
    });
    it("should dehydrate from response", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      const response = await mockedRequest.send();

      const dehydratedResponse = mockedRequest.dehydrate({ response });

      expect(dehydratedResponse).toStrictEqual(expect.objectContaining({ cacheKey: request.cacheKey, response }));

      const newClient = new Client({ url: "shared-base-url" });

      expect(newClient.cache.get(mockedRequest.cacheKey)).not.toBeDefined();

      newClient.hydrate([dehydratedResponse]);

      expect(newClient.cache.get(mockedRequest.cacheKey)).toStrictEqual(
        expect.objectContaining({ ...response, cacheKey: request.cacheKey, staleTime: request.staleTime }),
      );
    });
    it("should not override cache data", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      const response = await mockedRequest.send();

      const dehydratedResponse = mockedRequest.dehydrate({ response, override: false });

      expect(dehydratedResponse).toStrictEqual(expect.objectContaining({ cacheKey: request.cacheKey, response }));

      const newClient = new Client({ url: "shared-base-url" });
      const cacheData = {
        data: "123456789",
        status: 200,
        error: null,
        success: true,
        extra: {},
        responseTimestamp: Date.now(),
        requestTimestamp: Date.now(),
        addedTimestamp: Date.now(),
        triggerTimestamp: Date.now(),
        retries: 0,
        isCanceled: false,
        isOffline: false,
        hydrated: false,
        cached: true,
      } as CacheValueType;

      newClient.cache.set(mockedRequest, cacheData);

      expect(newClient.cache.get(mockedRequest.cacheKey)).toStrictEqual({
        ...cacheData,
        cacheKey: mockedRequest.cacheKey,
        cacheTime: mockedRequest.cacheTime,
        staleTime: mockedRequest.staleTime,
        version: newClient.cache.version,
        scope: null,
      });

      newClient.hydrate([dehydratedResponse]);

      expect(newClient.cache.get(mockedRequest.cacheKey)).toStrictEqual({
        ...cacheData,
        cacheKey: mockedRequest.cacheKey,
        cacheTime: mockedRequest.cacheTime,
        staleTime: mockedRequest.staleTime,
        version: newClient.cache.version,
        scope: null,
      });
    });
    it("should handle null/undefined items in hydration data", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      await mockedRequest.send();
      const dehydratedResponse = mockedRequest.dehydrate();

      const newClient = new Client({ url: "shared-base-url" });
      // Should not throw when processing null/undefined items
      newClient.hydrate([dehydratedResponse, null, undefined]);

      expect(newClient.cache.get(mockedRequest.cacheKey)).toBeDefined();
    });
    it("should apply function-based options", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      await mockedRequest.send();
      const dehydratedResponse = mockedRequest.dehydrate();

      const newClient = new Client({ url: "shared-base-url" });
      const optionsFn = vi.fn().mockReturnValue({ cache: false });

      newClient.hydrate([dehydratedResponse], optionsFn);

      expect(optionsFn).toHaveBeenCalledWith(dehydratedResponse);
      // Since cache is false, data should not be in cache
      expect(newClient.cache.get(mockedRequest.cacheKey)).toBeUndefined();
    });
    it("should merge options correctly", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      const response = await mockedRequest.send();
      // Test with fallback options in dehydrated response
      const dehydratedResponse = mockedRequest.dehydrate({
        response,
      });

      const newClient = new Client({ url: "shared-base-url" });

      // Add global options
      newClient.hydrate([dehydratedResponse], {
        staleTime: 3000,
        cacheTime: 2000,
        override: true,
      });

      const cachedData = newClient.cache.get(mockedRequest.cacheKey);
      expect(cachedData).toBeDefined();
      expect(cachedData?.staleTime).toBe(3000);
      expect(cachedData?.cacheTime).toBe(2000);
    });
    it("should respect cache option", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      await mockedRequest.send();
      const dehydratedResponse = mockedRequest.dehydrate();

      const newClient = new Client({ url: "shared-base-url" });

      newClient.hydrate([dehydratedResponse], { cache: false });

      expect(newClient.cache.get(mockedRequest.cacheKey)).toBeUndefined();
    });
    it("should override if override is false and cache is not set", async () => {
      const mockedRequest = request.setMock(() => ({ data: "test", status: 200 }));
      await mockedRequest.send();
      const dehydratedResponse = mockedRequest.dehydrate();

      client.cache.clear();

      const spy = vi.spyOn(client.cache, "set");
      client.hydrate([dehydratedResponse], { override: false });

      expect(spy).toHaveBeenCalled();
    });

    it("should hydrate and read scoped cache via scopeKey", async () => {
      const scoped = request.setScope("hydr-scope").setMock(() => ({ data: "scoped-val", status: 200 }));
      const response = await scoped.send();
      const dehydratedResponse = scoped.dehydrate();
      expect(dehydratedResponse).toEqual(expect.objectContaining({ scope: "hydr-scope", cacheKey: scoped.cacheKey }));

      const newClient = new Client({ url: "shared-base-url" });
      const sk = scopeKey(scoped.cacheKey, "hydr-scope");
      expect(newClient.cache.get(scoped.cacheKey)).not.toBeDefined();

      newClient.hydrate([dehydratedResponse]);

      expect(newClient.cache.get(sk)).toStrictEqual(
        expect.objectContaining({ ...response, cacheKey: scoped.cacheKey, staleTime: scoped.staleTime }),
      );
    });

    it("should skip hydrate when override is false and scoped slot already has data", async () => {
      const scoped = request.setScope("no-over").setMock(() => ({ data: "a", status: 200 }));
      await scoped.send();
      const ts = Date.now();
      const dehydratedResponse = scoped.dehydrate({
        response: {
          data: "b",
          status: 200,
          success: true,
          error: null,
          extra: xhrExtra,
          requestTimestamp: ts,
          responseTimestamp: ts,
        },
      });

      const newClient = new Client({ url: "shared-base-url" });
      const existingReq = newClient
        .createRequest<{ response: any }>()({ endpoint: "shared-base-endpoint" })
        .setScope("no-over");
      const sk = scopeKey(existingReq.cacheKey, "no-over");

      newClient.cache.set(existingReq.setCache(true), {
        data: "existing",
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        requestTimestamp: Date.now(),
        responseTimestamp: Date.now(),
        addedTimestamp: Date.now(),
        triggerTimestamp: Date.now(),
        isCanceled: false,
        isOffline: false,
        willRetry: false,
      });

      newClient.hydrate([dehydratedResponse], { override: false });

      expect(newClient.cache.get(sk)?.data).toBe("existing");
    });
  });
});
