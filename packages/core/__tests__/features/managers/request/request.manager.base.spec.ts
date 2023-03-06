import EventEmitter from "events";

import { getRequestManagerEvents } from "managers";
import { createClient, createRequest, sleep } from "../../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../../server";

describe("RequestManager [ Base ]", () => {
  const abortKey = "abort-key";
  const queueKey = "abort-key";
  const requestId = "some-id";
  let client = createClient();
  let events = getRequestManagerEvents(new EventEmitter());

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    client = createClient();
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
      const request = createRequest(client);
      createRequestInterceptor(request);
      client.onResponse((response) => {
        spy();
        return response;
      });
      client.fetchDispatcher.add(request);
      await sleep(5);
      client.requestManager.abortAll();
      await sleep(1);
      const queue = client.fetchDispatcher.getQueue(request.queueKey);
      expect(queue.requests).toHaveLength(0);
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe("When events get emitted", () => {
    it("should propagate the loading events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onLoading(queueKey, spy);
      events.onLoadingById(requestId, spyById);

      const values = {
        queueKey,
        requestId,
        loading: false,
        isRetry: false,
        isOffline: false,
      };

      events.emitLoading(queueKey, requestId, values);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
    it("should propagate the request start events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onRequestStart(queueKey, spy);
      events.onRequestStartById(requestId, spyById);
      const request = createRequest(client);

      const values = {
        requestId,
        request,
      };

      events.emitRequestStart(queueKey, requestId, values);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
    it("should propagate the response start events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onResponseStart(queueKey, spy);
      events.onResponseStartById(requestId, spyById);
      const request = createRequest(client);

      const values = {
        requestId,
        request,
      };

      events.emitResponseStart(queueKey, requestId, values);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
    it("should propagate the upload events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onUploadProgress(queueKey, spy);
      events.onUploadProgressById(requestId, spyById);
      const request = createRequest(client);

      const values = {
        progress: 0,
        timeLeft: 0,
        sizeLeft: 0,
        total: 0,
        loaded: 0,
        startTimestamp: 0,
      };

      const details = {
        requestId,
        request,
      };

      events.emitUploadProgress(queueKey, requestId, values, details);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
    it("should propagate the download events", async () => {
      const spy = jest.fn();
      const spyById = jest.fn();
      events.onDownloadProgress(queueKey, spy);
      events.onDownloadProgressById(requestId, spyById);
      const request = createRequest(client);

      const values = {
        progress: 0,
        timeLeft: 0,
        sizeLeft: 0,
        total: 0,
        loaded: 0,
        startTimestamp: 0,
      };

      const details = {
        requestId,
        request,
      };

      events.emitDownloadProgress(queueKey, requestId, values, details);

      expect(spy).toBeCalledTimes(1);
      expect(spyById).toBeCalledTimes(1);
    });
  });
  it("should propagate the response events", async () => {
    const spy = jest.fn();
    const spyById = jest.fn();
    events.onResponse(queueKey, spy);
    events.onResponseById(requestId, spyById);

    const details = {
      retries: 0,
      timestamp: +new Date(),
      isFailed: false,
      isCanceled: false,
      isOffline: false,
    };

    events.emitResponse(queueKey, requestId, {data: null, error: null, status: 200}, details);

    expect(spy).toBeCalledTimes(1);
    expect(spyById).toBeCalledTimes(1);
  });
  it("should propagate the remove events", async () => {
    const spy = jest.fn();
    const spyById = jest.fn();
    events.onRemove(queueKey, spy);
    events.onRemoveById(requestId, spyById);
    const request = createRequest(client);

    const values = {
      requestId,
      request,
    };

    events.emitRemove(queueKey, requestId, values);

    expect(spy).toBeCalledTimes(1);
    expect(spyById).toBeCalledTimes(1);
  });
});
