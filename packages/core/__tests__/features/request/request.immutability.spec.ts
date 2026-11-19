import { Client } from "client";
import type { RequestInstance } from "request";

describe("Request [ Immutability ]", () => {
  const client = new Client({ url: "http://immutable" });
  const createRequest = () =>
    client.createRequest<{ response: { id: number }; payload: any; queryParams: any }>()({
      endpoint: "/users/:userId/posts/:postId",
      method: "POST",
    });

  const mapper = (value: any) => value;
  const callback = () => true;

  const setters: [name: string, apply: (request: RequestInstance) => RequestInstance, field: string, value: unknown][] =
    [
      ["setHeaders", (request) => request.setHeaders({ "X-Test": "1" }), "headers", { "X-Test": "1" }],
      ["setAuth", (request) => request.setAuth(false), "auth", false],
      [
        "setParams",
        (request) => request.setParams({ userId: 1, postId: 2 } as never),
        "params",
        { userId: 1, postId: 2 },
      ],
      ["setPayload", (request) => request.setPayload({ title: "Post" }), "payload", { title: "Post" }],
      ["setQueryParams", (request) => request.setQueryParams({ page: 2 }), "queryParams", { page: 2 }],
      ["setOptions", (request) => request.setOptions({ timeout: 100 }), "options", { timeout: 100 }],
      ["setScope", (request) => request.setScope("session"), "scope", "session"],
      ["setCancelable", (request) => request.setCancelable(true), "cancelable", true],
      ["setRetry", (request) => request.setRetry(3), "retry", 3],
      ["setRetryTime", (request) => request.setRetryTime(1500), "retryTime", 1500],
      ["setRetryOnError", (request) => request.setRetryOnError(callback), "retryOnError", callback],
      ["setOptimistic", (request) => request.setOptimistic(mapper), "optimistic", mapper],
      ["setCacheTime", (request) => request.setCacheTime(1), "cacheTime", 1],
      ["setCache", (request) => request.setCache(false), "cache", false],
      ["setStaleTime", (request) => request.setStaleTime(2), "staleTime", 2],
      ["setQueued", (request) => request.setQueued(true), "queued", true],
      ["setAbortKey", (request) => request.setAbortKey("abort"), "abortKey", "abort"],
      ["setCacheKey", (request) => request.setCacheKey("cache"), "cacheKey", "cache"],
      ["setQueryKey", (request) => request.setQueryKey("query"), "queryKey", "query"],
      ["setDeduplicate", (request) => request.setDeduplicate(true), "deduplicate", true],
      ["setDeduplicateTime", (request) => request.setDeduplicateTime(300), "deduplicateTime", 300],
      ["setStructuralSharing", (request) => request.setStructuralSharing(false), "structuralSharing", false],
      ["setUsed", (request) => request.setUsed(true), "used", true],
      ["setOffline", (request) => request.setOffline(false), "offline", false],
      ["setPayloadMapper", (request) => request.setPayloadMapper(mapper), "unstable_payloadMapper", mapper],
      ["setRequestMapper", (request) => request.setRequestMapper(mapper), "unstable_requestMapper", mapper],
      ["setResponseMapper", (request) => request.setResponseMapper(mapper), "unstable_responseMapper", mapper],
    ];

  /** Everything the request holds, including the functions which are not part of the JSON dump */
  const getSnapshot = (request: RequestInstance) => ({
    ...request.toJSON(),
    retryOnError: request.retryOnError,
    optimistic: request.optimistic,
    payloadMapper: request.unstable_payloadMapper,
    requestMapper: request.unstable_requestMapper,
    responseMapper: request.unstable_responseMapper,
    mock: request.unstable_mock,
  });

  describe.each(setters)("When using %s", (...[, apply, field, value]) => {
    it("should return a new request with the value", () => {
      const request = createRequest();

      const updated = apply(request);

      expect(updated).not.toBe(request);
      expect((updated as Record<string, any>)[field]).toEqual(value);
    });

    it("should not change the original request", () => {
      const request = createRequest();
      const before = getSnapshot(request);

      apply(request);

      expect(getSnapshot(request)).toEqual(before);
    });

    it("should keep the values set before", () => {
      const configured = setters
        .filter(([, , otherField]) => otherField !== field)
        .reduce<RequestInstance>((request, [, applyOther]) => applyOther(request), createRequest());

      const updated = apply(configured);

      setters
        .filter(([, , otherField]) => otherField !== field)
        .forEach(([, , otherField, otherValue]) => {
          expect((updated as Record<string, any>)[otherField]).toEqual(otherValue);
        });
    });
  });

  describe("When keys are set by hand", () => {
    it.each([
      ["setCacheKey", "cacheKey"],
      ["setQueryKey", "queryKey"],
      ["setAbortKey", "abortKey"],
    ] as const)("should keep generating the %s result for the original request", (setter, key) => {
      const request = client.createRequest()({ endpoint: "/keys/:id", cancelable: false });
      const generated = request.setParams({ id: 1 }).setCancelable(true)[key];

      request[setter]("custom");

      // Using the setter on a template must not freeze the keys of the requests made from it later
      expect(request.setParams({ id: 1 }).setCancelable(true)[key]).toBe(generated);
      expect(request.setParams({ id: 1 })[key]).not.toBe(request.setParams({ id: 2 }).setCancelable(true)[key]);
    });

    it("should not make requests created from one template share a cache key", () => {
      const getUser = client.createRequest()({ endpoint: "/users/:userId" });

      getUser.setCacheKey("current-user");
      const first = getUser.setParams({ userId: 1 });
      const second = getUser.setParams({ userId: 2 });

      expect(first.cacheKey).not.toBe(second.cacheKey);
      expect(first.queryKey).not.toBe(second.queryKey);
    });

    it.each([
      ["setCacheKey", "cacheKey"],
      ["setQueryKey", "queryKey"],
      ["setAbortKey", "abortKey"],
    ] as const)("should keep the key from %s in all the next clones", (setter, key) => {
      const request = client.createRequest<{ queryParams: any; payload: any }>()({ endpoint: "/keys/:id" });

      const custom = request[setter]("custom");
      const cloned = custom
        .setParams({ id: 1 })
        .setQueryParams({ page: 1 })
        .setPayload({ a: 1 })
        .setCancelable(true)
        .clone();

      expect(cloned[key]).toBe("custom");
    });

    it("should use the keys passed to the clone method", () => {
      const request = client.createRequest()({ endpoint: "/keys/:id" });

      const cloned = request.clone({ cacheKey: "cache", queryKey: "query", abortKey: "abort" });

      expect([cloned.cacheKey, cloned.queryKey, cloned.abortKey]).toEqual(["cache", "query", "abort"]);
      expect(cloned.setParams({ id: 1 }).cacheKey).toBe("cache");
    });

    it("should keep the keys given with the request options", () => {
      const request = client.createRequest()({
        endpoint: "/keys/:id",
        cacheKey: "cache",
        queryKey: "query",
        abortKey: "abort",
      });

      const cloned = request.setParams({ id: 1 }).setRetry(1);

      expect([cloned.cacheKey, cloned.queryKey, cloned.abortKey]).toEqual(["cache", "query", "abort"]);
    });
  });

  describe("When cloning", () => {
    it("should give an equal request for a clone without changes", () => {
      const request = setters.reduce<RequestInstance>((current, [, apply]) => apply(current), createRequest());

      const cloned = request.clone();

      expect(cloned).not.toBe(request);
      expect(getSnapshot(cloned)).toEqual(getSnapshot(request));
    });

    it("should keep the mock and its enabled state", () => {
      const request = createRequest().setMock(() => ({ data: { id: 1 }, status: 200 }));
      request.setMockingEnabled(false);

      const cloned = request.setRetry(1);

      expect(cloned.unstable_mock).toBe(request.unstable_mock);
      expect(cloned.isMockerEnabled).toBe(false);
    });

    it("should copy the hooks without sharing later subscriptions", () => {
      const request = createRequest();
      const inherited = vi.fn();
      const added = vi.fn();
      request.$hooks.onBeforeSent(inherited);

      const cloned = request.clone();
      cloned.$hooks.onBeforeSent(added);
      request.$hooks.__emit("onBeforeSent", {});

      expect(inherited).toHaveBeenCalledTimes(1);
      expect(added).not.toHaveBeenCalled();
    });

    it("should share the client", () => {
      const request = createRequest();

      expect(request.clone().client).toBe(client);
    });

    it("should not change the request when it is sent with other values", async () => {
      const request = createRequest().setMock(() => ({ data: { id: 1 }, status: 200 }), {
        requestTime: 0,
        responseTime: 0,
      });
      const before = getSnapshot(request);

      await request.send({
        params: { userId: 1, postId: 2 },
        payload: { title: "Post" },
        queryParams: { page: 1 },
        headers: { "X-Test": "1" },
        retry: 2,
      });

      expect(getSnapshot(request)).toEqual(before);
    });

    it("should not change the request when it is aborted", () => {
      const request = createRequest();
      const before = getSnapshot(request);

      const aborted = request.abort();

      expect(aborted).not.toBe(request);
      expect(getSnapshot(request)).toEqual(before);
    });
  });

  describe("When using the mock methods", () => {
    it("should set the mock on the same request - the only documented exception", () => {
      const request = createRequest();

      expect(request.setMock(() => ({ data: { id: 1 }, status: 200 }))).toBe(request);
      expect(request.isMockerEnabled).toBe(true);
      expect(request.toJSON().hasMock).toBe(true);
    });

    it("should clear the mock on the same request", () => {
      const request = createRequest().setMock(() => ({ data: { id: 1 }, status: 200 }));

      expect(request.clearMock()).toBe(request);
      expect(request.unstable_mock).toBeUndefined();
      expect(request.isMockerEnabled).toBe(false);
    });

    it("should not add the mock to the requests cloned before", () => {
      const request = createRequest();
      const clonedBefore = request.clone();

      request.setMock(() => ({ data: { id: 1 }, status: 200 }));

      expect(clonedBefore.unstable_mock).toBeUndefined();
    });
  });
});
