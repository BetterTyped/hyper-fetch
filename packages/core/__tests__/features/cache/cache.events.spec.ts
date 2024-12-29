import { sleep } from "@hyper-fetch/testing";

import { CacheValueType } from "cache";
import { createCache, createLazyCacheAdapter } from "../../utils";
import { Client } from "client";
import { xhrExtra } from "adapter";
import { Plugin } from "plugin";

describe("Cache [ Events ]", () => {
  const cacheKey = "test";

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey, cache: true });
  let cache = createCache(client);
  const spy = jest.fn();

  const cacheData: CacheValueType = {
    data: null,
    error: null,
    status: 200,
    success: true,
    extra: xhrExtra,
    retries: 0,
    requestTimestamp: +new Date(),
    responseTimestamp: +new Date(),
    addedTimestamp: +new Date(),
    triggerTimestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    cacheKey: request.cacheKey,
    staleTime: request.staleTime,
    version: cache.version,
    cacheTime: 300000,
  };

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-endpoint", cacheKey, cache: true });
    cache = createCache(client);
    jest.resetAllMocks();
  });

  describe("when options events are triggered", () => {
    it("should trigger onChange event when data is set", async () => {
      const plugin = new Plugin({ name: "change" }).onCacheItemChange(spy);
      const newCache = createCache(client.addPlugin(plugin));

      newCache.set(request, cacheData);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        cache: newCache,
        cacheKey: request.cacheKey,
        newData: cacheData,
        prevData: null,
      });
    });
    it("should trigger onDelete event when data is deleted", async () => {
      const plugin = new Plugin({ name: "delete" }).onCacheItemDelete(spy);
      const newCache = createCache(client.addPlugin(plugin));

      newCache.delete(request.cacheKey);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ cache: newCache, cacheKey: request.cacheKey });
    });
  });
  describe("when invalidate event is triggered", () => {
    it("should invalidate cache using cache key", async () => {
      cache.set(request, {
        data: {},
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        requestTimestamp: +new Date(),
        responseTimestamp: +new Date(),
        addedTimestamp: +new Date(),
        triggerTimestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      });
      cache.events.onInvalidateByKey(cacheKey, spy);
      await cache.invalidate(cacheKey);
      await sleep(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should invalidate cache using regex", async () => {
      cache.set(request, {
        data: null,
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        requestTimestamp: +new Date(),
        responseTimestamp: +new Date(),
        addedTimestamp: +new Date(),
        triggerTimestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      });
      cache.events.onInvalidateByKey(cacheKey, spy);
      await cache.invalidate(new RegExp(cacheKey));
      await sleep(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should invalidate cache using lazyStorage regex", async () => {
      const lazyStorage = new Map();
      lazyStorage.set(request.cacheKey, cacheData);
      cache = createCache(client, {
        lazyStorage: createLazyCacheAdapter(lazyStorage),
      });
      cache.events.onInvalidateByKey(cacheKey, spy);
      await cache.invalidate(new RegExp(cacheKey));
      await sleep(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
