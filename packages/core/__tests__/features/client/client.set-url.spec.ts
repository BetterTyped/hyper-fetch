import { createHttpMockingServer } from "@hyper-fetch/testing";
import type { ResponseSuccessType } from "adapter";
import { getErrorMessage } from "adapter";
import { Client } from "client";
import type { HttpAdapterType } from "http-adapter";
import { xhrExtra } from "http-adapter";
import type { ResponseDetailsType } from "managers";
import { http, HttpResponse } from "msw";

const { server, resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Client [ setUrl ]", () => {
  const response: ResponseSuccessType<any, HttpAdapterType> = {
    data: 123,
    error: null,
    status: 200,
    success: true,
    extra: xhrExtra,
    requestTimestamp: Date.now(),
    responseTimestamp: Date.now(),
  };
  const details: ResponseDetailsType = {
    retries: 0,
    requestTimestamp: Date.now(),
    responseTimestamp: Date.now(),
    addedTimestamp: Date.now(),
    triggerTimestamp: Date.now(),
    isCanceled: false,
    isOffline: false,
    willRetry: false,
  };

  let client = new Client({ url: "http://first.test" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "http://first.test" });
    resetMocks();
    vi.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should send next requests to the new url", async () => {
    server.use(
      http.get("http://first.test/users", () => HttpResponse.json({ host: "first" })),
      http.get("http://second.test/users", () => HttpResponse.json({ host: "second" })),
    );
    const request = client.createRequest<{ response: { host: string } }>()({
      endpoint: "/users",
    });

    const first = await request.send();
    client.setUrl("http://second.test");
    const second = await request.send();

    expect(client.url).toBe("http://second.test");
    expect(first.data).toStrictEqual({ host: "first" });
    expect(second.data).toStrictEqual({ host: "second" });
  });

  it("should be chainable", () => {
    expect(client.setUrl("http://second.test")).toBe(client);
  });

  it("should do nothing when the url did not change", () => {
    const abortSpy = vi.spyOn(client.requestManager, "abortAll");
    const invalidateSpy = vi.spyOn(client.cache, "invalidate");

    client.setUrl("http://first.test", { abort: true, invalidate: true });

    expect(client.url).toBe("http://first.test");
    expect(abortSpy).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("should not abort requests nor touch the cache by default", async () => {
    const request = client.createRequest<{ response: { value: number } }>()({
      endpoint: "/users",
    });
    const data = mockRequest(request, { data: { value: 1 }, delay: 30 });
    client.cache.set(request, { ...response, ...details });
    const staleTime = client.cache.get(request.cacheKey)?.staleTime;
    const abortSpy = vi.spyOn(client.requestManager, "abortAll");

    const pending = request.send();
    client.setUrl("http://second.test");
    const result = await pending;

    expect(abortSpy).not.toHaveBeenCalled();
    expect(result.data).toStrictEqual(data);
    expect(client.cache.get(request.cacheKey)?.staleTime).toBe(staleTime);
  });

  it("should abort ongoing requests when abort is enabled", async () => {
    const request = client.createRequest<{ response: { value: number } }>()({
      endpoint: "/users",
    });
    mockRequest(request, { data: { value: 1 }, delay: 30 });

    const pending = request.send();
    client.setUrl("http://second.test", { abort: true });
    const result = await pending;

    expect(result.data).toBeNull();
    expect(result.error).toStrictEqual(getErrorMessage("abort"));
    expect(result.status).toBe(0);
  });

  it("should invalidate the whole cache when invalidate is enabled", () => {
    const usersRequest = client.createRequest()({ endpoint: "/users" });
    const postsRequest = client.createRequest()({ endpoint: "/posts" });
    const trigger = vi.fn();
    const unmount = client.cache.events.onInvalidate(trigger);

    client.cache.set(usersRequest, { ...response, ...details });
    client.cache.set(postsRequest, { ...response, ...details });
    client.setUrl("http://second.test", { invalidate: true });
    unmount();

    expect(client.cache.get(usersRequest.cacheKey)?.staleTime).toBe(0);
    expect(client.cache.get(postsRequest.cacheKey)?.staleTime).toBe(0);
    expect(trigger).toHaveBeenCalledWith(usersRequest.cacheKey);
    expect(trigger).toHaveBeenCalledWith(postsRequest.cacheKey);
  });

  it("should notify consumers of aborted requests when abort and invalidate are enabled", async () => {
    const request = client.createRequest<{ response: { value: number } }>()({
      endpoint: "/users",
    });
    mockRequest(request, { data: { value: 1 }, delay: 30 });
    const trigger = vi.fn();
    const unmount = client.cache.events.onInvalidateByKey(request.cacheKey, trigger);

    const pending = request.send();
    client.setUrl("http://second.test", { abort: true, invalidate: true });
    await pending;
    unmount();

    // Nothing was cached yet - the aborted request is reached only by the explicit invalidation
    expect(client.cache.get(request.cacheKey)).toBeUndefined();
    expect(trigger).toHaveBeenCalledTimes(1);
  });
});
