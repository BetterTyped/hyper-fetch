import { sleep } from "@hyper-fetch/testing";

import { CacheValueType } from "cache";
import { createCache } from "../../utils";
import { Client } from "client";
import { xhrExtra } from "http-adapter";
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
    it("should trigger onData event when data is set", async () => {
      const plugin = new Plugin({ name: "data" });
      const newCache = createCache(client.addPlugin(plugin));

      newCache.events.onData(spy);
      newCache.set(request, cacheData);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: null,
          cacheKey: request.cacheKey,
        }),
      );
    });
    it("should trigger onDelete event when data is deleted", async () => {
      const plugin = new Plugin({ name: "delete" });
      const newCache = createCache(client.addPlugin(plugin));

      newCache.events.onDelete(spy);
      newCache.delete(request.cacheKey);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(request.cacheKey);
    });
    it("should trigger onDeleteByKey event when specific cache key is deleted", async () => {
      const plugin = new Plugin({ name: "deleteByKey" });
      const newCache = createCache(client.addPlugin(plugin));

      newCache.events.onDeleteByKey(request.cacheKey, spy);
      newCache.delete(request.cacheKey);

      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should properly cleanup onData listener when unmount function is called", async () => {
      const plugin = new Plugin({ name: "data" });
      const newCache = createCache(client.addPlugin(plugin));

      const unmount = newCache.events.onData(spy);
      unmount();
      newCache.set(request, cacheData);

      expect(spy).not.toHaveBeenCalled();
    });
    it("should properly cleanup onDataByKey listener when unmount function is called", async () => {
      const plugin = new Plugin({ name: "dataByKey" });
      const newCache = createCache(client.addPlugin(plugin));

      const unmount = newCache.events.onDataByKey(request.cacheKey, spy);
      unmount();
      newCache.set(request, cacheData);

      expect(spy).not.toHaveBeenCalled();
    });
    it("should properly cleanup onDelete listener when unmount function is called", async () => {
      const plugin = new Plugin({ name: "delete" });
      const newCache = createCache(client.addPlugin(plugin));

      const unmount = newCache.events.onDelete(spy);
      unmount();
      newCache.delete(request.cacheKey);

      expect(spy).not.toHaveBeenCalled();
    });
    it("should properly cleanup onDeleteByKey listener when unmount function is called", async () => {
      const plugin = new Plugin({ name: "deleteByKey" });
      const newCache = createCache(client.addPlugin(plugin));

      const unmount = newCache.events.onDeleteByKey(request.cacheKey, spy);
      unmount();
      newCache.delete(request.cacheKey);

      expect(spy).not.toHaveBeenCalled();
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
    it("should trigger onInvalidate event when cache is invalidated", async () => {
      cache.set(request, cacheData);
      cache.events.onInvalidate(spy);

      await cache.invalidate(cacheKey);
      await sleep(1);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(cacheKey);
    });
    it("should properly cleanup onInvalidate listener when unmount function is called", async () => {
      cache.set(request, cacheData);
      const unmount = cache.events.onInvalidate(spy);

      unmount();
      await cache.invalidate(cacheKey);
      await sleep(1);

      expect(spy).not.toHaveBeenCalled();
    });
    it("should properly cleanup onInvalidateByKey listener when unmount function is called", async () => {
      cache.set(request, cacheData);
      const unmount = cache.events.onInvalidateByKey(cacheKey, spy);

      unmount();
      await cache.invalidate(cacheKey);
      await sleep(1);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
