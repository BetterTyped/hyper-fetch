import { resetInterceptors, startServer, stopServer } from "../../server";
import { Client, Time } from "../../../src";

describe("Request [ Setters ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "/users/:userId" });
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "/users/:userId" });
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should allow for setting headers", async () => {
    const headers = { "Content-Type": "application/json" };
    expect(request.headers).not.toBeDefined();
    const updatedRequest = request.setHeaders(headers);
    expect(updatedRequest.headers).toBe(headers);
  });
  it("should allow for setting auth", async () => {
    expect(request.auth).toBeTrue();
    const updatedRequest = request.setAuth(false);
    expect(updatedRequest.auth).toBeFalse();
  });
  it("should allow for setting params", async () => {
    const params = { userId: 1 };
    expect(request.params).not.toBeDefined();
    expect(request.endpoint).toBe("/users/:userId");
    const updatedRequest = request.setParams(params);
    expect(updatedRequest.params).toBe(params);
    expect(updatedRequest.endpoint).toBe("/users/1");
  });
  it("should allow for setting ", async () => {
    const req = client.createRequest<{ payload: { test: number } }>()({ endpoint: "/users/:userId" });
    const data = { test: 123 };
    expect(request.data).not.toBeDefined();
    const updatedRequest = req.setData(data);
    expect(updatedRequest.data).toBe(data);
  });
  it("should allow for setting query params", async () => {
    expect(request.endpoint).toBe("/users/:userId");
    const updatedRequest = request.setQueryParams("?test=123");
    expect(updatedRequest.endpoint).toBe("/users/:userId?test=123");
  });
  it("should allow for setting options", async () => {
    const options = { timeout: 123 };
    expect(request.options).not.toBeDefined();
    const updatedRequest = request.setOptions(options);
    expect(updatedRequest.options).toBe(options);
  });
  it("should allow for setting cancelable", async () => {
    expect(request.cancelable).toBeFalse();
    const updatedRequest = request.setCancelable(true);
    expect(updatedRequest.cancelable).toBeTrue();
  });
  it("should allow for setting retry", async () => {
    expect(request.retry).toBe(0);
    const updatedRequest = request.setRetry(1);
    expect(updatedRequest.retry).toBe(1);
  });
  it("should allow for setting retry time", async () => {
    expect(request.retryTime).toBe(500);
    const updatedRequest = request.setRetryTime(1000);
    expect(updatedRequest.retryTime).toBe(1000);
  });
  it("should allow for setting cache", async () => {
    expect(request.cache).toBeTrue();
    const updatedRequest = request.setCache(false);
    expect(updatedRequest.cache).toBeFalse();
  });
  it("should allow for setting cache time", async () => {
    expect(request.cacheTime).toBe(Time.MIN * 5);
    const updatedRequest = request.setCacheTime(1000);
    expect(updatedRequest.cacheTime).toBe(1000);
  });
  it("should allow for setting queued", async () => {
    expect(request.queued).toBeFalse();
    const updatedRequest = request.setQueued(true);
    expect(updatedRequest.queued).toBeTrue();
  });
  it("should allow for setting abort key", async () => {
    expect(request.abortKey).toBe("GET_/users/:userId_false");
    const updatedRequest = request.setAbortKey("test");
    expect(updatedRequest.abortKey).toBe("test");
  });
  it("should allow for setting cache key", async () => {
    expect(request.cacheKey).toBe("GET_/users/:userId");
    const updatedRequest = request.setCacheKey("test");
    expect(updatedRequest.cacheKey).toBe("test");
  });
  it("should allow for setting queue key", async () => {
    expect(request.queueKey).toBe("GET_/users/:userId");
    const updatedRequest = request.setQueueKey("test");
    expect(updatedRequest.queueKey).toBe("test");
  });
  it("should allow for setting effect key", async () => {
    expect(request.effectKey).toBe("GET_/users/:userId_false");
    const updatedRequest = request.setEffectKey("test");
    expect(updatedRequest.effectKey).toBe("test");
  });
  it("should allow for setting deduplicate", async () => {
    expect(request.deduplicate).toBeFalse();
    const updatedRequest = request.setDeduplicate(true);
    expect(updatedRequest.deduplicate).toBeTrue();
  });
  it("should allow for setting deduplicate time", async () => {
    expect(request.deduplicateTime).toBe(10);
    const updatedRequest = request.setDeduplicateTime(1000);
    expect(updatedRequest.deduplicateTime).toBe(1000);
  });
  it("should allow for setting used", async () => {
    expect(request.used).toBeFalse();
    const updatedRequest = request.setUsed(true);
    expect(updatedRequest.used).toBeTrue();
  });
  it("should allow for setting offline", async () => {
    expect(request.offline).toBeTrue();
    const updatedRequest = request.setOffline(false);
    expect(updatedRequest.offline).toBeFalse();
  });
  it("should allow for setting garbageCollection", async () => {
    expect(request.garbageCollection).toBe(Time.MIN * 5);
    const updatedRequest = request.setGarbageCollection(Time.MIN);
    expect(updatedRequest.garbageCollection).toBe(Time.MIN);
  });
  it("should allow for setting data mapper", async () => {
    const mapper = (data: { name: string; email: string }) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      return formData;
    };
    const mapperRequest = client.createRequest<{ payload: { name: string; email: string } }>()({ endpoint: "test" });
    expect(mapperRequest.dataMapper).not.toBeDefined();
    const updatedRequest = mapperRequest.setDataMapper(mapper);
    expect(updatedRequest.dataMapper).toBe(mapper);
  });
  it("should allow for setting response mapper", async () => {
    const mapper = (res) => ({ ...res });
    const mapperRequest = client.createRequest<{ payload: { name: string; email: string } }>()({ endpoint: "test" });
    expect(mapperRequest.responseMapper).not.toBeDefined();
    const updatedRequest = mapperRequest.setResponseMapper(mapper);
    expect(updatedRequest.responseMapper).toBe(mapper);
  });
  it("should allow for setting request mapper", async () => {
    const mapper = (req) => req;
    const mapperRequest = client.createRequest<{ payload: { name: string; email: string } }>()({ endpoint: "test" });
    expect(mapperRequest.requestMapper).not.toBeDefined();
    const updatedRequest = mapperRequest.setRequestMapper(mapper);
    expect(updatedRequest.requestMapper).toBe(mapper);
  });
});
