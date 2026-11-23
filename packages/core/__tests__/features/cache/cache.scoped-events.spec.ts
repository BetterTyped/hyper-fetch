import { Client } from "client";
import { httpExtra } from "http-adapter";
import { scopeKey } from "request";

const createResponse = (data: unknown) => ({
  data,
  error: null,
  status: 200,
  success: true as const,
  extra: httpExtra,
  retries: 0,
  isCanceled: false,
  isOffline: false,
  willRetry: false,
  addedTimestamp: Date.now(),
  triggerTimestamp: Date.now(),
  requestTimestamp: Date.now(),
  responseTimestamp: Date.now(),
});

/**
 * Cache events are emitted by the logical `cacheKey` of the request. Scopes share that key, so every event carries
 * what a listener needs to tell the scopes apart: the data event has the `scope`, the invalidation and deletion
 * events have the key of the stored element (`scopeKey(cacheKey, scope)`).
 */
describe("Cache [ Scoped events ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: unknown }>()({ endpoint: "/profile" });
  let userA = request.setScope("user-a");
  let userB = request.setScope("user-b");

  const storageKeyOf = (scoped: typeof userA) => scopeKey(scoped.cacheKey, scoped.scope);

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: unknown }>()({ endpoint: "/profile" });
    userA = request.setScope("user-a");
    userB = request.setScope("user-b");
  });

  afterEach(() => {
    vi.useRealTimers();
    client.clear();
  });

  describe("When the data of a scoped request is set", () => {
    it("should emit it by the cache key of the request with the scope it belongs to", () => {
      const scopes: (string | null | undefined)[] = [];
      client.cache.events.onDataByKey(userA.cacheKey, (data) => scopes.push(data.scope));

      client.cache.set(userA, createResponse("data of user A"));
      client.cache.set(userB, createResponse("data of user B"));

      expect(scopes).toStrictEqual(["user-a", "user-b"]);
    });
  });

  describe("When a scoped element is deleted", () => {
    it("should notify the listeners of the request cache key", () => {
      const spy = vi.fn();
      client.cache.set(userA, createResponse("data"));
      client.cache.events.onDeleteByKey(userA.cacheKey, spy);

      client.cache.delete(storageKeyOf(userA));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should pass the key of the deleted element, so listeners can tell the scopes apart", () => {
      const deleted: string[] = [];
      client.cache.set(userA, createResponse("a"));
      client.cache.set(userB, createResponse("b"));
      client.cache.events.onDeleteByKey(request.cacheKey, (key) => deleted.push(key));

      client.cache.delete(storageKeyOf(userB));

      expect(deleted).toStrictEqual([storageKeyOf(userB)]);
      expect(client.cache.get(storageKeyOf(userA))?.data).toBe("a");
    });

    it("should notify the listeners of the request cache key when the element is garbage collected", async () => {
      vi.useFakeTimers();
      const collected: string[] = [];
      const shortLived = userA.setCacheTime(50).setStaleTime(10);
      client.cache.set(shortLived, createResponse("data"));
      client.cache.events.onDeleteByKey(shortLived.cacheKey, (key) => collected.push(key));

      await vi.advanceTimersByTimeAsync(100);

      expect(collected).toStrictEqual([storageKeyOf(shortLived)]);
      expect(client.cache.get(storageKeyOf(shortLived))).toBeUndefined();
    });

    it("should report the deleted key to the listeners of all keys", () => {
      const deleted: string[] = [];
      client.cache.set(userA, createResponse("a"));
      client.cache.events.onDelete((key) => deleted.push(key));

      client.cache.delete(storageKeyOf(userA));

      expect(deleted).toStrictEqual([storageKeyOf(userA)]);
    });

    it("should still notify by the given key when there is no such element", () => {
      const spy = vi.fn();
      client.cache.events.onDeleteByKey("unknown-key", spy);

      client.cache.delete("unknown-key");

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("unknown-key");
    });
  });

  describe("When scoped elements are invalidated", () => {
    it.each([
      ["the whole cache", () => client.cache.invalidate()],
      ["a regular expression", () => client.cache.invalidate(/profile/)],
      ["the key of the stored element", () => client.cache.invalidate(storageKeyOf(userA))],
      ["the request", () => client.cache.invalidate(userA)],
      ["a list of requests", () => client.cache.invalidate([userA])],
    ])("should notify the listeners of the request cache key when invalidating %s", (_name, invalidate) => {
      const invalidated: string[] = [];
      client.cache.set(userA, createResponse("data"));
      client.cache.events.onInvalidateByKey(userA.cacheKey, (key) => invalidated.push(key));

      invalidate();

      expect(invalidated).toStrictEqual([storageKeyOf(userA)]);
      expect(client.cache.get(storageKeyOf(userA))?.staleTime).toBe(0);
    });

    it("should pass the key of every invalidated element, so listeners can tell the scopes apart", () => {
      const invalidated: string[] = [];
      client.cache.set(userA, createResponse("a"));
      client.cache.set(userB, createResponse("b"));
      client.cache.events.onInvalidateByKey(request.cacheKey, (key) => invalidated.push(key));

      client.cache.invalidate(userB);

      expect(invalidated).toStrictEqual([storageKeyOf(userB)]);
      expect(client.cache.get(storageKeyOf(userA))?.staleTime).not.toBe(0);
    });

    it("should notify once per scope when the whole cache is invalidated", () => {
      const invalidated: string[] = [];
      client.cache.set(userA, createResponse("a"));
      client.cache.set(userB, createResponse("b"));
      client.cache.events.onInvalidateByKey(request.cacheKey, (key) => invalidated.push(key));

      client.cache.invalidate();

      expect(invalidated.toSorted()).toStrictEqual([storageKeyOf(userA), storageKeyOf(userB)].toSorted());
    });

    it("should notify the listeners of a request that has nothing cached yet", () => {
      const invalidated: string[] = [];
      client.cache.events.onInvalidateByKey(userA.cacheKey, (key) => invalidated.push(key));

      client.cache.invalidate(userA);

      expect(invalidated).toStrictEqual([storageKeyOf(userA)]);
    });
  });

  describe("When the request has no scope", () => {
    it("should emit the deletion and the invalidation by the cache key, with the cache key", () => {
      const onDelete = vi.fn();
      const onInvalidate = vi.fn();
      client.cache.set(request, createResponse("data"));
      client.cache.events.onInvalidateByKey(request.cacheKey, onInvalidate);
      client.cache.events.onDeleteByKey(request.cacheKey, onDelete);

      client.cache.invalidate(request);
      client.cache.delete(request.cacheKey);

      expect(onInvalidate).toHaveBeenCalledTimes(1);
      expect(onInvalidate).toHaveBeenCalledWith(request.cacheKey);
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(request.cacheKey);
    });
  });
});
