import EventEmitter from "events";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { getRequestManagerEvents, RequestProgressEventType } from "managers";
import { Client } from "client";
import { RequestInstance } from "request";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("RequestManager [ Base ]", () => {
  const abortKey = "abort-key";
  const queryKey = "query-key";
  const cacheKey = "cache-key";
  const requestId = "some-id";
  let client = new Client({ url: "shared-base-url" });
  let events = getRequestManagerEvents(new EventEmitter());

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    jest.resetAllMocks();
    client = new Client({ url: "shared-base-url" });
    events = getRequestManagerEvents(new EventEmitter());
  });

  afterAll(() => {
    stopServer();
  });

  describe("When app manager is initialized", () => {
    it("should allow to add abort controller", async () => {
      expect(client.requestManager.getAbortController(abortKey, requestId)).toBeUndefined();
      client.requestManager.addAbortController(abortKey, requestId);
      expect(client.requestManager.getAbortController(abortKey, requestId)).toBeDefined();
    });
    it("should allow to remove abort controller", async () => {
      client.requestManager.addAbortController(abortKey, requestId);
      client.requestManager.removeAbortController(abortKey, requestId);
      expect(client.requestManager.getAbortController(abortKey, requestId)).toBeUndefined();
    });
    it("should not throw when removing non-existing controller", async () => {
      expect(() => client.requestManager.removeAbortController(abortKey, requestId)).not.toThrow();
    });
  });

  describe("When request is being aborted", () => {
    it("should remove it from dispatcher's queue storage", async () => {
      const spy = jest.fn();
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);
      client.onResponse((response) => {
        spy();
        return response;
      });
      client.fetchDispatcher.add(request);
      await sleep(5);
      client.requestManager.abortAll();
      await sleep(1);
      const queue = client.fetchDispatcher.getQueue(request.queryKey);
      expect(queue.requests).toHaveLength(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("When events get emitted", () => {
    it("should propagate the loading events", async () => {
      const spy = jest.fn();
      const spyQueue = jest.fn();
      const spyById = jest.fn();
      events.onLoadingByCache(cacheKey, spy);
      events.onLoadingByQueue(queryKey, spyQueue);
      events.onLoadingById(requestId, spyById);

      const data = {
        request: client.createRequest()({ endpoint: "shared-base-endpoint", cacheKey, queryKey }),
        requestId,
        loading: false,
        isRetry: false,
        isOffline: false,
      };

      events.emitLoading(data);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spyQueue).toHaveBeenCalledTimes(1);
      expect(spyById).toHaveBeenCalledTimes(1);
    });
    it("should propagate the request start events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onRequestStartByQueue(queryKey, spy);
      events.onRequestStartById(requestId, spyById);
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", cacheKey, queryKey });

      events.emitRequestStart({ request, requestId });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spyById).toHaveBeenCalledTimes(1);
    });
    it("should propagate the response start events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onResponseStartByQueue(queryKey, spy);
      events.onResponseStartById(requestId, spyById);
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", cacheKey, queryKey });

      events.emitResponseStart({ request, requestId });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spyById).toHaveBeenCalledTimes(1);
    });
    it("should propagate the upload events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onUploadProgressByQueue(queryKey, spy);
      events.onUploadProgressById(requestId, spyById);
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", cacheKey, queryKey });

      const details: RequestProgressEventType<RequestInstance> = {
        requestId,
        request,
        progress: 0,
        timeLeft: 0,
        sizeLeft: 0,
        total: 0,
        loaded: 0,
        startTimestamp: 0,
      };

      events.emitUploadProgress(details);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spyById).toHaveBeenCalledTimes(1);
    });
    it("should propagate the download events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onDownloadProgressByQueue(queryKey, spy);
      events.onDownloadProgressById(requestId, spyById);
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", cacheKey, queryKey });

      const details: RequestProgressEventType<RequestInstance> = {
        requestId,
        request,
        progress: 0,
        timeLeft: 0,
        sizeLeft: 0,
        total: 0,
        loaded: 0,
        startTimestamp: 0,
      };

      events.emitDownloadProgress(details);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spyById).toHaveBeenCalledTimes(1);
    });
  });
  describe("When events get emitted", () => {
    it("should propagate the response events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onResponseByCache(cacheKey, spy);
      events.onResponseById(requestId, spyById);

      events.emitResponse({
        request: client.createRequest()({ endpoint: "shared-base-endpoint", queryKey, cacheKey }),
        requestId,
        response: {
          data: null,
          error: null,
          status: 200,
          success: true,
          extra: null,
          requestTimestamp: +new Date(),
          responseTimestamp: +new Date(),
        },
        details: {
          retries: 0,
          isCanceled: false,
          isOffline: false,
          requestTimestamp: +new Date(),
          responseTimestamp: +new Date(),
          triggerTimestamp: +new Date(),
          addedTimestamp: +new Date(),
        },
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spyById).toHaveBeenCalledTimes(1);
    });
    it("should propagate the remove events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onRemoveByQueue(queryKey, spy);
      events.onRemoveById(requestId, spyById);
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queryKey, cacheKey });

      events.emitRemove({
        requestId,
        request,
        resolved: true,
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spyById).toHaveBeenCalledTimes(1);
    });
    it("should not throw on not existing controller", async () => {
      client.requestManager.addAbortController("test2", "test2");
      const emptyAbortController = client.requestManager.getAbortController("test", "test");
      const emptyAbortController2 = client.requestManager.getAbortController("test2", "test");

      expect(emptyAbortController).not.toBeDefined();
      expect(emptyAbortController2).not.toBeDefined();
      expect(() => client.requestManager.useAbortController("test", "test")).not.toThrow();
      expect(() => client.requestManager.useAbortController("test2", "test")).not.toThrow();
    });
  });
});
