import { createHttpMockingServer } from "@hyper-fetch/testing";

import {
  canRetryRequest,
  QueueItemType,
  DispatcherRequestType,
  getDispatcherChangeByKey,
  getDispatcherDrainedByKey,
  getDispatcherStatusByKey,
  getIsEqualTimestamp,
  getRequestType,
} from "dispatcher";
import { createDispatcher, createAdapter } from "../../utils";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Dispatcher [ Utils ]", () => {
  const adapterSpy = jest.fn();

  let adapter = createAdapter({ callback: adapterSpy });
  let client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
  let dispatcher = createDispatcher(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    adapter = createAdapter({ callback: adapterSpy });
    client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
    dispatcher = createDispatcher(client);
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using request counting methods", () => {
    it("should increment request count", async () => {
      const queryKey = "test";
      expect(dispatcher.getQueueRequestCount(queryKey)).toBe(0);
      dispatcher.incrementQueueRequestCount(queryKey);
      expect(dispatcher.getQueueRequestCount(queryKey)).toBe(1);
    });
  });
  describe("When using getRequest method", () => {
    it("should give stored request", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const requestId = dispatcher.add(request);
      const storedRequest = dispatcher.getRequest(request.queryKey, requestId);
      expect(storedRequest).toBeDefined();
    });
    it("should not return request from empty store", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const storedRequest = dispatcher.getRequest(request.queryKey, "test");
      expect(storedRequest).not.toBeDefined();
    });
  });
  describe("When using clear methods", () => {
    it("should clear request from queue", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      dispatcher.stop(request.queryKey);
      dispatcher.add(request);

      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(1);

      dispatcher.clearQueue(request.queryKey);

      expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
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
      expect(getDispatcherDrainedByKey("test")).toBe(`test-drained-event`);
      expect(getDispatcherStatusByKey("test")).toBe(`test-status-event`);
      expect(getDispatcherChangeByKey("test")).toBe(`test-change-event`);
    });
  });
  describe("When using getRequestType util", () => {
    it("should return deduplicated type", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", deduplicate: true });
      const duplicated: QueueItemType<typeof request> = dispatcher.createStorageItem(request);
      const type = getRequestType(request, duplicated);
      expect(type).toBe(DispatcherRequestType.DEDUPLICATED);
    });
    it("should return cancelable type", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", cancelable: true });
      const duplicated: QueueItemType<typeof request> = dispatcher.createStorageItem(request);
      const type = getRequestType(request, duplicated);
      expect(type).toBe(DispatcherRequestType.PREVIOUS_CANCELED);
    });
  });
});
