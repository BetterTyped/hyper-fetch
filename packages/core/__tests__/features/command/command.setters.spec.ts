import { createBuilder, createCommand } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { DateInterval } from "../../../src";

describe("Command [ Setters ]", () => {
  let builder = createBuilder();
  let command = createCommand(builder, { endpoint: "/users/:userId" });
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    builder = createBuilder();
    command = createCommand(builder, { endpoint: "/users/:userId" });
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should allow for setting headers", async () => {
    const headers = { "Content-Type": "application/json" };
    expect(command.headers).not.toBeDefined();
    const updatedCommand = command.setHeaders(headers);
    expect(updatedCommand.headers).toBe(headers);
  });
  it("should allow for setting auth", async () => {
    expect(command.auth).toBeTrue();
    const updatedCommand = command.setAuth(false);
    expect(updatedCommand.auth).toBeFalse();
  });
  it("should allow for setting params", async () => {
    const params = { userId: 1 };
    expect(command.params).not.toBeDefined();
    expect(command.endpoint).toBe("/users/:userId");
    const updatedCommand = command.setParams(params as null);
    expect(updatedCommand.params).toBe(params);
    expect(updatedCommand.endpoint).toBe("/users/1");
  });
  it("should allow for setting ", async () => {
    const data = { test: 123 };
    expect(command.data).not.toBeDefined();
    const updatedCommand = command.setData(data);
    expect(updatedCommand.data).toBe(data);
  });
  it("should allow for setting query params", async () => {
    expect(command.endpoint).toBe("/users/:userId");
    const updatedCommand = command.setQueryParams("?test=123");
    expect(updatedCommand.endpoint).toBe("/users/:userId?test=123");
  });
  it("should allow for setting options", async () => {
    const options = { timeout: 123 };
    expect(command.options).not.toBeDefined();
    const updatedCommand = command.setOptions(options);
    expect(updatedCommand.options).toBe(options);
  });
  it("should allow for setting cancelable", async () => {
    expect(command.cancelable).toBeFalse();
    const updatedCommand = command.setCancelable(true);
    expect(updatedCommand.cancelable).toBeTrue();
  });
  it("should allow for setting retry", async () => {
    expect(command.retry).toBe(0);
    const updatedCommand = command.setRetry(1);
    expect(updatedCommand.retry).toBe(1);
  });
  it("should allow for setting retry time", async () => {
    expect(command.retryTime).toBe(500);
    const updatedCommand = command.setRetryTime(1000);
    expect(updatedCommand.retryTime).toBe(1000);
  });
  it("should allow for setting cache", async () => {
    expect(command.cache).toBeTrue();
    const updatedCommand = command.setCache(false);
    expect(updatedCommand.cache).toBeFalse();
  });
  it("should allow for setting cache time", async () => {
    expect(command.cacheTime).toBe(DateInterval.minute * 5);
    const updatedCommand = command.setCacheTime(1000);
    expect(updatedCommand.cacheTime).toBe(1000);
  });
  it("should allow for setting queued", async () => {
    expect(command.queued).toBeFalse();
    const updatedCommand = command.setQueued(true);
    expect(updatedCommand.queued).toBeTrue();
  });
  it("should allow for setting abort key", async () => {
    expect(command.abortKey).toBe("GET_/users/:userId_false");
    const updatedCommand = command.setAbortKey("test");
    expect(updatedCommand.abortKey).toBe("test");
  });
  it("should allow for setting cache key", async () => {
    expect(command.cacheKey).toBe("GET_/users/:userId");
    const updatedCommand = command.setCacheKey("test");
    expect(updatedCommand.cacheKey).toBe("test");
  });
  it("should allow for setting queue key", async () => {
    expect(command.queueKey).toBe("GET_/users/:userId_false");
    const updatedCommand = command.setQueueKey("test");
    expect(updatedCommand.queueKey).toBe("test");
  });
  it("should allow for setting effect key", async () => {
    expect(command.effectKey).toBe("GET_/users/:userId_false");
    const updatedCommand = command.setEffectKey("test");
    expect(updatedCommand.effectKey).toBe("test");
  });
  it("should allow for setting deduplicate", async () => {
    expect(command.deduplicate).toBeFalse();
    const updatedCommand = command.setDeduplicate(true);
    expect(updatedCommand.deduplicate).toBeTrue();
  });
  it("should allow for setting deduplicate time", async () => {
    expect(command.deduplicateTime).toBe(10);
    const updatedCommand = command.setDeduplicateTime(1000);
    expect(updatedCommand.deduplicateTime).toBe(1000);
  });
  it("should allow for setting used", async () => {
    expect(command.used).toBeFalse();
    const updatedCommand = command.setUsed(true);
    expect(updatedCommand.used).toBeTrue();
  });
  it("should allow for setting offline", async () => {
    expect(command.offline).toBeTrue();
    const updatedCommand = command.setOffline(false);
    expect(updatedCommand.offline).toBeFalse();
  });
  it("should allow for setting garbageCollection", async () => {
    expect(command.garbageCollection).toBe(DateInterval.minute * 5);
    const updatedCommand = command.setGarbageCollection(DateInterval.minute);
    expect(updatedCommand.garbageCollection).toBe(DateInterval.minute);
  });
  it("should allow for setting data mapper", async () => {
    const mapper = (data: { name: string; email: string }) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      return formData;
    };
    const mapperCommand = builder.createCommand<null, { name: string; email: string }>()({ endpoint: "test" });
    expect(mapperCommand.dataMapper).not.toBeDefined();
    const updatedCommand = mapperCommand.setDataMapper(mapper);
    expect(updatedCommand.dataMapper).toBe(mapper);
  });
});
