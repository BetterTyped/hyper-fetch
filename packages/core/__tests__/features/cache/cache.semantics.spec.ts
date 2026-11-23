import type { CacheValueType } from "cache";
import { Client } from "client";
import { Plugin } from "plugin";
import { scopeKey } from "request";

import { createCacheErrorResponse, createCacheResponse } from "../../utils/fixtures.utils";

type User = { id: number; name: string };

describe("Cache [ Semantics ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: any; error: { message: string } }>()({ endpoint: "/users" });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: any; error: { message: string } }>()({ endpoint: "/users" });
  });

  afterEach(() => {
    client.cache.clear();
    vi.useRealTimers();
  });

  describe("When reading the data", () => {
    it("should return undefined for a key that was never set", () => {
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
      expect(request.read()).toBeUndefined();
    });

    it("should return the same reference on consecutive reads", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(client.cache.get(request.cacheKey)).toBe(client.cache.get(request.cacheKey));
    });

    it("should read the response through the request instance", () => {
      const response = createCacheResponse<User>({ id: 1, name: "Kate" });
      client.cache.set(request, response);

      expect(request.read()).toStrictEqual({
        data: { id: 1, name: "Kate" },
        error: null,
        status: 200,
        success: true,
        extra: response.extra,
        requestTimestamp: response.requestTimestamp,
        responseTimestamp: response.responseTimestamp,
      });
    });

    it("should list only the keys of the stored elements", () => {
      client.cache.set(request.setCacheKey("first"), createCacheResponse(1));
      client.cache.set(request.setCacheKey("second"), createCacheResponse(2));
      client.cache.set(request.setCacheKey("skipped").setCache(false), createCacheResponse(3));

      expect(client.cache.keys()).toStrictEqual(["first", "second"]);
    });
  });

  describe("When setting the data", () => {
    it.each([
      { name: "zero", value: 0 },
      { name: "false", value: false },
      { name: "empty string", value: "" },
      { name: "empty array", value: [] },
      { name: "empty object", value: {} },
    ])("should store the falsy response data - $name", ({ value }) => {
      client.cache.set(request, createCacheResponse(value));

      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual(value);
      expect(request.read()?.data).toStrictEqual(value);
    });

    it("should emit the falsy response data to the listeners", () => {
      const spy = vi.fn();
      client.cache.events.onDataByKey(request.cacheKey, spy);

      client.cache.set(request, createCacheResponse(0));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].data).toBe(0);
    });

    it("should store null when the successful response has no data", () => {
      const response: Partial<ReturnType<typeof createCacheResponse>> = createCacheResponse(1);
      delete response.data;

      client.cache.set(request, response as ReturnType<typeof createCacheResponse>);

      expect(client.cache.get(request.cacheKey)?.data).toBeNull();
    });

    it("should store the request settings together with the response", () => {
      const configured = request.setStaleTime(1234).setCacheTime(5678);
      client.cache.set(configured, createCacheResponse({ id: 1 }));

      expect(client.cache.get(configured.cacheKey)).toStrictEqual(
        expect.objectContaining({
          cacheKey: configured.cacheKey,
          scope: null,
          staleTime: 1234,
          cacheTime: 5678,
          version: client.cache.version,
          cached: true,
        }),
      );
    });

    it("should replace the element with the latest response", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.set(request, createCacheResponse({ id: 2 }, { status: 201 }));

      expect(client.cache.get(request.cacheKey)).toStrictEqual(
        expect.objectContaining({ data: { id: 2 }, status: 201 }),
      );
      expect(client.cache.keys()).toHaveLength(1);
    });

    it("should pass null to the setter function when there is no cached element", () => {
      const setter = vi.fn(() => createCacheResponse({ id: 1 }));

      client.cache.set(request, setter);

      expect(setter).toHaveBeenCalledTimes(1);
      expect(setter).toHaveBeenCalledWith(null);
      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ id: 1 });
    });

    it("should pass the cached element to the setter function", () => {
      client.cache.set(request, createCacheResponse({ count: 1 }));
      const previous = client.cache.get(request.cacheKey);
      const setter = vi.fn((prev: { data: { count: number } | null } | null) =>
        createCacheResponse({ count: (prev?.data?.count ?? 0) + 1 }),
      );

      client.cache.set(request, setter);

      expect(setter).toHaveBeenCalledWith(previous);
      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ count: 2 });
    });

    it("should keep the elements of different cache keys apart", () => {
      const listRequest = client.createRequest<{ response: any; queryParams: { page: number } }>()({
        endpoint: "/users",
      });
      const first = listRequest.setQueryParams({ page: 1 });
      const second = listRequest.setQueryParams({ page: 2 });

      client.cache.set(first, createCacheResponse("first"));
      client.cache.set(second, createCacheResponse("second"));

      expect(first.cacheKey).not.toBe(second.cacheKey);
      expect(first.read()?.data).toBe("first");
      expect(second.read()?.data).toBe("second");
    });

    it("should share the element between requests with the same cache key", () => {
      const first = request.setCacheKey("shared");
      const second = client.createRequest<{ response: any }>()({ endpoint: "/other", cacheKey: "shared" });

      client.cache.set(first, createCacheResponse("value"));

      expect(second.read()?.data).toBe("value");
    });

    it("should not store the response of a request with the cache disabled", () => {
      const spy = vi.fn();
      const uncached = request.setCache(false);
      client.cache.events.onDataByKey(uncached.cacheKey, spy);

      client.cache.set(uncached, createCacheResponse({ id: 1 }));

      expect(client.cache.get(uncached.cacheKey)).toBeUndefined();
      expect(client.cache.keys()).toHaveLength(0);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toStrictEqual(expect.objectContaining({ data: { id: 1 }, cached: false }));
    });

    it("should not schedule the garbage collection for a response which was not stored", () => {
      client.cache.set(request.setCache(false), createCacheResponse({ id: 1 }));

      expect(client.cache.garbageCollectors.size).toBe(0);
    });
  });

  describe("When the error response arrives", () => {
    it("should not store the error response when nothing is cached", () => {
      client.cache.set(request, createCacheErrorResponse({ message: "Failed" }));

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });

    it("should emit the error response when nothing is cached", () => {
      const spy = vi.fn();
      client.cache.events.onDataByKey(request.cacheKey, spy);

      client.cache.set(request, createCacheErrorResponse({ message: "Failed" }));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toStrictEqual(
        expect.objectContaining({ data: null, error: { message: "Failed" }, success: false }),
      );
    });

    it("should keep the cached data untouched", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      const cached = client.cache.get(request.cacheKey);

      client.cache.set(request, createCacheErrorResponse({ message: "Failed" }));

      expect(client.cache.get(request.cacheKey)).toBe(cached);
      expect(request.read()).toStrictEqual(expect.objectContaining({ data: { id: 1 }, error: null, success: true }));
    });

    it("should emit the error together with the previously cached data", () => {
      const spy = vi.fn();
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.events.onDataByKey(request.cacheKey, spy);

      client.cache.set(request, createCacheErrorResponse({ message: "Failed" }));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toStrictEqual(
        expect.objectContaining({ data: { id: 1 }, error: { message: "Failed" }, success: false, status: 400 }),
      );
    });

    it("should keep the falsy cached data in the emitted error response", () => {
      const spy = vi.fn();
      client.cache.set(request, createCacheResponse(0));
      client.cache.events.onDataByKey(request.cacheKey, spy);

      client.cache.set(request, createCacheErrorResponse({ message: "Failed" }));

      expect(spy.mock.calls[0][0].data).toBe(0);
    });

    it("should recover with the next successful response", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.set(request, createCacheErrorResponse({ message: "Failed" }));
      client.cache.set(request, createCacheResponse({ id: 2 }));

      expect(request.read()).toStrictEqual(expect.objectContaining({ data: { id: 2 }, error: null, success: true }));
    });
  });

  describe("When updating the data", () => {
    it("should not create the element when nothing is cached", () => {
      const spy = vi.fn();
      client.cache.events.onData(spy);

      client.cache.update(request, { data: { id: 1 } });

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should merge the partial response with the cached element", () => {
      // The update stamps its own time, so the clock is pinned: set and update must not share a millisecond by luck
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(1_000);
      const response = createCacheResponse<User>({ id: 1, name: "Kate" }, { status: 201 });
      client.cache.set(request, response);
      vi.setSystemTime(2_000);

      client.cache.update(request, { data: { id: 1, name: "Maya" } });

      expect(client.cache.get(request.cacheKey)).toStrictEqual(
        expect.objectContaining({
          data: { id: 1, name: "Maya" },
          status: 201,
          success: true,
          responseTimestamp: 2_000,
          requestTimestamp: response.requestTimestamp,
        }),
      );
    });

    it("should update the data to a falsy value", () => {
      client.cache.set(request, createCacheResponse(5));

      client.cache.update(request, { data: 0 });

      expect(client.cache.get(request.cacheKey)?.data).toBe(0);
    });

    it("should pass the cached element to the update function", () => {
      client.cache.set(request, createCacheResponse({ items: [1, 2] }));

      client.cache.update(request, (previous) => ({ data: { items: [...(previous?.data?.items ?? []), 3] } }));

      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual({ items: [1, 2, 3] });
    });

    it("should emit the updated element", () => {
      const spy = vi.fn();
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.events.onDataByKey(request.cacheKey, spy);

      client.cache.update(request, { data: { id: 2 } });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].data).toStrictEqual({ id: 2 });
    });

    it("should update only the element of the given request", () => {
      const other = request.setCacheKey("other");
      client.cache.set(request, createCacheResponse("first"));
      client.cache.set(other, createCacheResponse("second"));

      client.cache.update(request, { data: "changed" });

      expect(request.read()?.data).toBe("changed");
      expect(other.read()?.data).toBe("second");
    });
  });

  describe("When deleting the data", () => {
    it("should remove the element and notify the listeners", () => {
      const globalSpy = vi.fn();
      const keySpy = vi.fn();
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.events.onDelete(globalSpy);
      client.cache.events.onDeleteByKey(request.cacheKey, keySpy);

      client.cache.delete(request.cacheKey);

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
      expect(client.cache.keys()).toHaveLength(0);
      expect(globalSpy).toHaveBeenCalledTimes(1);
      expect(globalSpy).toHaveBeenCalledWith(request.cacheKey);
      expect(keySpy).toHaveBeenCalledTimes(1);
    });

    it("should remove only the given element", () => {
      const other = request.setCacheKey("other");
      const otherSpy = vi.fn();
      client.cache.set(request, createCacheResponse("first"));
      client.cache.set(other, createCacheResponse("second"));
      client.cache.events.onDeleteByKey(other.cacheKey, otherSpy);

      client.cache.delete(request.cacheKey);

      expect(other.read()?.data).toBe("second");
      expect(otherSpy).not.toHaveBeenCalled();
    });

    it("should allow to set the element again after it was deleted", () => {
      client.cache.set(request, createCacheResponse("first"));
      client.cache.delete(request.cacheKey);
      client.cache.set(request, createCacheResponse("second"));

      expect(request.read()?.data).toBe("second");
    });

    it("should not pass the deleted element to the setter function", () => {
      const setter = vi.fn(() => createCacheResponse("second"));
      client.cache.set(request, createCacheResponse("first"));
      client.cache.delete(request.cacheKey);

      client.cache.set(request, setter);

      expect(setter).toHaveBeenCalledWith(null);
    });
  });

  describe("When invalidating the data", () => {
    it("should mark the element as stale and keep its data", () => {
      client.cache.set(request.setStaleTime(60_000), createCacheResponse({ id: 1 }));

      client.cache.invalidate(request.cacheKey);

      expect(client.cache.get(request.cacheKey)).toStrictEqual(
        expect.objectContaining({ data: { id: 1 }, staleTime: 0, success: true }),
      );
    });

    it("should notify the listeners about a key without the cached data", () => {
      const globalSpy = vi.fn();
      const keySpy = vi.fn();
      client.cache.events.onInvalidate(globalSpy);
      client.cache.events.onInvalidateByKey("missing", keySpy);

      client.cache.invalidate("missing");

      expect(globalSpy).toHaveBeenCalledWith("missing");
      expect(keySpy).toHaveBeenCalledTimes(1);
      expect(client.cache.get("missing")).toBeUndefined();
    });

    it("should invalidate only the elements matching the expression", () => {
      client.cache.set(request.setCacheKey("users-1").setStaleTime(1000), createCacheResponse(1));
      client.cache.set(request.setCacheKey("users-2").setStaleTime(1000), createCacheResponse(2));
      client.cache.set(request.setCacheKey("posts-1").setStaleTime(1000), createCacheResponse(3));

      client.cache.invalidate(/^users-/);

      expect(client.cache.get("users-1")?.staleTime).toBe(0);
      expect(client.cache.get("users-2")?.staleTime).toBe(0);
      expect(client.cache.get("posts-1")?.staleTime).toBe(1000);
    });

    it.each([
      { name: "global", expression: /users/g },
      { name: "sticky", expression: /users/y },
      { name: "global and sticky", expression: /users/gy },
    ])("should invalidate every matching element with the $name expression", ({ expression }) => {
      const spy = vi.fn();
      const keys = ["users-1", "users-2", "users-3", "users-4"];
      keys.forEach((key) => client.cache.set(request.setCacheKey(key).setStaleTime(1000), createCacheResponse(key)));
      client.cache.events.onInvalidate(spy);

      client.cache.invalidate(expression);

      expect(spy.mock.calls.map(([key]) => key)).toStrictEqual(keys);
      keys.forEach((key) => expect(client.cache.get(key)?.staleTime).toBe(0));
    });

    it("should not change the state of the passed expression", () => {
      const expression = /users/g;
      client.cache.set(request.setCacheKey("users-1"), createCacheResponse(1));
      client.cache.set(request.setCacheKey("users-2"), createCacheResponse(2));

      client.cache.invalidate(expression);

      expect(expression.lastIndex).toBe(0);
    });

    it("should respect the case insensitive expression", () => {
      client.cache.set(request.setCacheKey("USERS").setStaleTime(1000), createCacheResponse(1));

      client.cache.invalidate(/users/i);

      expect(client.cache.get("USERS")?.staleTime).toBe(0);
    });

    it("should invalidate every element when called without arguments", () => {
      const spy = vi.fn();
      client.cache.set(request.setCacheKey("first").setStaleTime(1000), createCacheResponse(1));
      client.cache.set(request.setCacheKey("second").setStaleTime(1000), createCacheResponse(2));
      client.cache.events.onInvalidate(spy);

      client.cache.invalidate();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(client.cache.get("first")?.staleTime).toBe(0);
      expect(client.cache.get("second")?.staleTime).toBe(0);
    });

    it("should not notify anyone when the cache is empty and the expression is used", () => {
      const spy = vi.fn();
      client.cache.events.onInvalidate(spy);

      client.cache.invalidate(/.*/);
      client.cache.invalidate();

      expect(spy).not.toHaveBeenCalled();
    });

    it("should invalidate the list of keys, requests and expressions", () => {
      const byRequest = request.setCacheKey("by-request").setStaleTime(1000);
      client.cache.set(byRequest, createCacheResponse(1));
      client.cache.set(request.setCacheKey("by-key").setStaleTime(1000), createCacheResponse(2));
      client.cache.set(request.setCacheKey("by-expression").setStaleTime(1000), createCacheResponse(3));
      client.cache.set(request.setCacheKey("untouched").setStaleTime(1000), createCacheResponse(4));

      client.cache.invalidate([byRequest, "by-key", /expression$/]);

      expect(client.cache.get("by-request")?.staleTime).toBe(0);
      expect(client.cache.get("by-key")?.staleTime).toBe(0);
      expect(client.cache.get("by-expression")?.staleTime).toBe(0);
      expect(client.cache.get("untouched")?.staleTime).toBe(1000);
    });

    it("should make the element fresh again with the next response", () => {
      const configured = request.setStaleTime(60_000);
      client.cache.set(configured, createCacheResponse({ id: 1 }));
      client.cache.invalidate(configured);

      client.cache.set(configured, createCacheResponse({ id: 2 }));

      expect(client.cache.get(configured.cacheKey)).toStrictEqual(
        expect.objectContaining({ data: { id: 2 }, staleTime: 60_000 }),
      );
    });

    it("should not emit the data event", () => {
      const spy = vi.fn();
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.events.onData(spy);

      client.cache.invalidate(request.cacheKey);

      expect(spy).not.toHaveBeenCalled();
    });

    it("should not reschedule the garbage collection", () => {
      client.cache.set(request, createCacheResponse({ id: 1 }));
      const collector = client.cache.garbageCollectors.get(request.cacheKey);

      client.cache.invalidate(request.cacheKey);

      expect(client.cache.garbageCollectors.get(request.cacheKey)).toBe(collector);
    });
  });

  describe("When requests are scoped", () => {
    it("should keep the same cache key apart for different scopes", () => {
      const first = request.setScope("user-1");
      const second = request.setScope("user-2");

      client.cache.set(first, createCacheResponse("first"));
      client.cache.set(second, createCacheResponse("second"));

      expect(first.cacheKey).toBe(second.cacheKey);
      expect(first.read()?.data).toBe("first");
      expect(second.read()?.data).toBe("second");
      expect(request.read()).toBeUndefined();
    });

    it("should store the scope and the logical cache key in the element", () => {
      const scoped = request.setScope("user-1");

      client.cache.set(scoped, createCacheResponse("value"));

      expect(client.cache.keys()).toStrictEqual([scopeKey(scoped.cacheKey, "user-1")]);
      expect(client.cache.get(scopeKey(scoped.cacheKey, "user-1"))).toStrictEqual(
        expect.objectContaining({ cacheKey: scoped.cacheKey, scope: "user-1" }),
      );
    });

    it("should update only the element of the given scope", () => {
      const first = request.setScope("user-1");
      const second = request.setScope("user-2");
      client.cache.set(first, createCacheResponse("first"));
      client.cache.set(second, createCacheResponse("second"));

      client.cache.update(first, { data: "changed" });

      expect(first.read()?.data).toBe("changed");
      expect(second.read()?.data).toBe("second");
    });

    it("should invalidate only the element of the given scope", () => {
      const first = request.setScope("user-1").setStaleTime(1000);
      const second = request.setScope("user-2").setStaleTime(1000);
      client.cache.set(first, createCacheResponse("first"));
      client.cache.set(second, createCacheResponse("second"));

      client.cache.invalidate(first);

      expect(client.cache.get(scopeKey(first.cacheKey, "user-1"))?.staleTime).toBe(0);
      expect(client.cache.get(scopeKey(second.cacheKey, "user-2"))?.staleTime).toBe(1000);
    });

    it("should pass only the element of the same scope to the setter function", () => {
      const first = request.setScope("user-1");
      const setter = vi.fn(() => createCacheResponse("second"));
      client.cache.set(first, createCacheResponse("first"));

      client.cache.set(request.setScope("user-2"), setter);

      expect(setter).toHaveBeenCalledWith(null);
    });
  });

  describe("When cache events are emitted", () => {
    it("should store the element before the listeners are notified", () => {
      let readInListener: CacheValueType | undefined;
      client.cache.events.onDataByKey(request.cacheKey, () => {
        readInListener = client.cache.get(request.cacheKey);
      });

      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(readInListener?.data).toStrictEqual({ id: 1 });
    });

    it("should remove the element before the listeners are notified", () => {
      let readInListener: CacheValueType | undefined = undefined as CacheValueType | undefined;
      const spy = vi.fn(() => {
        readInListener = client.cache.get(request.cacheKey);
      });
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.events.onDeleteByKey(request.cacheKey, spy);

      client.cache.delete(request.cacheKey);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(readInListener).toBeUndefined();
    });

    it("should mark the element as stale before the listeners are notified", () => {
      let staleTimeInListener: number | undefined;
      client.cache.set(request.setStaleTime(1000), createCacheResponse({ id: 1 }));
      client.cache.events.onInvalidateByKey(request.cacheKey, () => {
        staleTimeInListener = client.cache.get(request.cacheKey)?.staleTime;
      });

      client.cache.invalidate(request.cacheKey);

      expect(staleTimeInListener).toBe(0);
    });

    it("should notify the general listeners before the listeners of the key", () => {
      const order: string[] = [];
      client.cache.events.onDataByKey(request.cacheKey, () => order.push("key"));
      client.cache.events.onData(() => order.push("general"));

      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(order).toStrictEqual(["general", "key"]);
    });

    it("should trigger the plugins before the listeners", () => {
      const order: string[] = [];
      client.addPlugin(new Plugin({ name: "order" }).onCacheItemChange(() => order.push("plugin")));
      client.cache.events.onData(() => order.push("listener"));

      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(order).toStrictEqual(["plugin", "listener"]);
    });

    it("should pass the previous and the new element to the plugins", () => {
      const spy = vi.fn();
      client.addPlugin(new Plugin({ name: "change" }).onCacheItemChange(spy));

      client.cache.set(request, createCacheResponse({ id: 1 }));
      const first = client.cache.get(request.cacheKey);
      client.cache.set(request, createCacheResponse({ id: 2 }));
      const second = client.cache.get(request.cacheKey);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toStrictEqual({
        cache: client.cache,
        cacheKey: request.cacheKey,
        prevData: null,
        newData: first,
      });
      expect(spy.mock.calls[1][0]).toStrictEqual({
        cache: client.cache,
        cacheKey: request.cacheKey,
        prevData: first,
        newData: second,
      });
    });

    it("should not trigger the change plugins for a response which was not stored", () => {
      const spy = vi.fn();
      client.addPlugin(new Plugin({ name: "change" }).onCacheItemChange(spy));

      client.cache.set(request.setCache(false), createCacheResponse({ id: 1 }));
      client.cache.set(request, createCacheErrorResponse({ message: "Failed" }));

      expect(spy).not.toHaveBeenCalled();
    });

    it("should notify the remaining listeners when one of them unsubscribes during the emit", () => {
      const second = vi.fn();
      const unsubscribeFirst = client.cache.events.onData(() => unsubscribeFirst());
      client.cache.events.onData(second);

      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.set(request, createCacheResponse({ id: 2 }));

      expect(second).toHaveBeenCalledTimes(2);
      expect(client.cache.emitter.listenerCount("cache")).toBe(1);
    });

    it("should notify a listener which gets removed by an earlier listener during the same emit", () => {
      const second = vi.fn();
      let unsubscribeSecond: VoidFunction = () => {};
      client.cache.events.onData(() => unsubscribeSecond());
      unsubscribeSecond = client.cache.events.onData(second);

      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.set(request, createCacheResponse({ id: 2 }));

      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should not notify a listener added during the emit about the current change", () => {
      const late = vi.fn();
      const unsubscribe = client.cache.events.onData(() => {
        unsubscribe();
        client.cache.events.onData(late);
      });

      client.cache.set(request, createCacheResponse({ id: 1 }));
      expect(late).not.toHaveBeenCalled();

      client.cache.set(request, createCacheResponse({ id: 2 }));
      expect(late).toHaveBeenCalledTimes(1);
    });

    it("should allow to set another element from the listener", () => {
      const other = request.setCacheKey("other");
      client.cache.events.onDataByKey(request.cacheKey, (data) => {
        client.cache.set(other, createCacheResponse({ copy: data.data }));
      });

      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(other.read()?.data).toStrictEqual({ copy: { id: 1 } });
    });

    it("should not notify the listeners of other keys", () => {
      const spy = vi.fn();
      client.cache.events.onDataByKey("other", spy);
      client.cache.events.onDeleteByKey("other", spy);
      client.cache.events.onInvalidateByKey("other", spy);

      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.invalidate(request.cacheKey);
      client.cache.delete(request.cacheKey);

      expect(spy).not.toHaveBeenCalled();
    });

    it("should stop notifying the listener after it unsubscribes", () => {
      const spy = vi.fn();
      const unsubscribe = client.cache.events.onData(spy);

      client.cache.set(request, createCacheResponse({ id: 1 }));
      unsubscribe();
      unsubscribe();
      client.cache.set(request, createCacheResponse({ id: 2 }));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should leave no listeners behind after every subscription is removed", () => {
      const unsubscribes = [
        client.cache.events.onData(() => {}),
        client.cache.events.onDataByKey(request.cacheKey, () => {}),
        client.cache.events.onInvalidate(() => {}),
        client.cache.events.onInvalidateByKey(request.cacheKey, () => {}),
        client.cache.events.onDelete(() => {}),
        client.cache.events.onDeleteByKey(request.cacheKey, () => {}),
      ];
      const listenersCount = () =>
        client.cache.emitter.eventNames().reduce((sum, name) => sum + client.cache.emitter.listenerCount(name), 0);

      expect(listenersCount()).toBe(6);
      unsubscribes.forEach((unsubscribe) => unsubscribe());

      expect(listenersCount()).toBe(0);
    });

    it("should pass the external trigger flag to the emit observers", () => {
      const spy = vi.fn();
      client.cache.emitter.onEmit(spy);
      client.cache.set(request, createCacheResponse({ id: 1 }));
      const element = client.cache.get(request.cacheKey) as CacheValueType;
      spy.mockClear();

      client.cache.events.emitCacheData(element, true);
      client.cache.events.emitInvalidation(request.cacheKey, true);
      client.cache.events.emitDelete(request.cacheKey, true);

      expect(spy.mock.calls.every((call) => call[2] === true)).toBeTrue();
      expect(spy).toHaveBeenCalledTimes(6);
    });
  });

  describe("When cache gets cleared", () => {
    it("should remove every element from the storage", async () => {
      client.cache.set(request.setCacheKey("first"), createCacheResponse(1));
      client.cache.set(request.setCacheKey("second"), createCacheResponse(2));

      await client.cache.clear();

      expect(client.cache.keys()).toHaveLength(0);
      expect(client.cache.get("first")).toBeUndefined();
    });

    it("should keep working after it was cleared", async () => {
      const spy = vi.fn();
      client.cache.events.onData(spy);
      client.cache.set(request, createCacheResponse(1));

      await client.cache.clear();
      client.cache.set(request, createCacheResponse(2));

      expect(request.read()?.data).toBe(2);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});
