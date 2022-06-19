import {
  canRetryRequest,
  getDispatcherChangeEventKey,
  getDispatcherDrainedEventKey,
  getDispatcherLoadingEventKey,
  getDispatcherStatusEventKey,
  getIsEqualTimestamp,
  isFailedRequest,
} from "dispatcher";
import { createDispatcher, createBuilder, createClient, createCommand } from "../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Dispatcher [ Utils ]", () => {
  const clientSpy = jest.fn();

  let client = createClient({ callback: clientSpy });
  let builder = createBuilder().setClient(() => client);
  let dispatcher = createDispatcher(builder);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = createClient({ callback: clientSpy });
    builder = createBuilder().setClient(() => client);
    dispatcher = createDispatcher(builder);
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using request counting methods", () => {
    it("should increment request count", async () => {
      const queueKey = "test";
      expect(dispatcher.getQueueRequestCount(queueKey)).toBe(0);
      dispatcher.incrementQueueRequestCount(queueKey);
      expect(dispatcher.getQueueRequestCount(queueKey)).toBe(1);
    });
  });
  describe("When using clear methods", () => {
    it("should clear request from queue", async () => {
      const command = createCommand(builder);
      createRequestInterceptor(command);

      dispatcher.stop(command.queueKey);
      dispatcher.add(command);

      expect(dispatcher.getQueue(command.queueKey).requests).toHaveLength(1);

      dispatcher.clearQueue(command.queueKey);

      expect(dispatcher.getQueue(command.queueKey).requests).toHaveLength(0);
    });
  });
  describe("When using getIsEqualTimestamp util", () => {
    it("should return true when timestamps are equal", async () => {
      expect(getIsEqualTimestamp(+new Date(), 0, +new Date())).toBeTrue();
      expect(getIsEqualTimestamp(+new Date(), 10, +new Date() + 5)).toBeTrue();
    });
    it("should return false when timestamps aren't equal", async () => {
      expect(getIsEqualTimestamp(+new Date(), 0, +new Date() + 5)).toBeFalse();
      expect(getIsEqualTimestamp(+new Date(), 10, +new Date() + 15)).toBeFalse();
      expect(getIsEqualTimestamp(+new Date(), 10)).toBeFalse();
    });
  });
  describe("When using isFailedRequest util", () => {
    it("should return true on error statuses", async () => {
      expect(isFailedRequest([null, null, 400])).toBeTrue();
      expect(isFailedRequest([null, null, 0])).toBeTrue();
      expect(isFailedRequest([null, null, 500])).toBeTrue();
      expect(isFailedRequest([null, null, 404])).toBeTrue();
    });
    it("should return false on success statuses", async () => {
      expect(isFailedRequest([null, null, 304])).toBeFalse();
      expect(isFailedRequest([null, null, 200])).toBeFalse();
      expect(isFailedRequest([null, null, 202])).toBeFalse();
      expect(isFailedRequest([null, null, 201])).toBeFalse();
    });
  });
  describe("When using canRetryRequest util", () => {
    it("should return true if retry is possible", async () => {
      expect(canRetryRequest(0, 1)).toBeTrue();
      expect(canRetryRequest(0, 2)).toBeTrue();
      expect(canRetryRequest(5, 10)).toBeTrue();
    });
    it("should return false on success statuses", async () => {
      expect(canRetryRequest(1, 0)).toBeFalse();
      expect(canRetryRequest(2, 1)).toBeFalse();
      expect(canRetryRequest(5, 5)).toBeFalse();
    });
  });
  describe("When using event get key utils", () => {
    it("should return true if retry is possible", async () => {
      expect(getDispatcherLoadingEventKey("test")).toBe(`test-loading-event`);
      expect(getDispatcherDrainedEventKey("test")).toBe(`test-drained-event`);
      expect(getDispatcherStatusEventKey("test")).toBe(`test-status-event`);
      expect(getDispatcherChangeEventKey("test")).toBe(`test-change-event`);
    });
  });
});
