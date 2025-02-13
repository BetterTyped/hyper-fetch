import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("RequestManager [ Events ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "shared-base-endpoint" });

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    jest.resetAllMocks();
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-base-endpoint" });
  });

  afterAll(() => {
    stopServer();
  });

  describe("When request manager events get triggered", () => {
    it("should trigger request lifecycle events", async () => {
      mockRequest(request);

      const spy1 = jest.fn();
      const spy2 = jest.fn();
      const spy3 = jest.fn();
      const spy4 = jest.fn();
      const spy5 = jest.fn();
      const spy6 = jest.fn();

      client.requestManager.events.onRequestStartByQueue(request.queryKey, spy1);
      client.requestManager.events.onResponseStartByQueue(request.queryKey, spy2);
      client.requestManager.events.onUploadProgressByQueue(request.queryKey, spy3);
      client.requestManager.events.onDownloadProgressByQueue(request.queryKey, spy4);
      client.requestManager.events.onResponseByCache(request.cacheKey, spy5);

      const requestId = client.fetchDispatcher.add(request);

      client.requestManager.events.onResponseById(requestId, spy6);

      await waitFor(() => {
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).toHaveBeenCalledTimes(3);
        expect(spy4).toHaveBeenCalledTimes(3);
        expect(spy5).toHaveBeenCalledTimes(1);
        expect(spy6).toHaveBeenCalledTimes(1);
      });
    });

    it("should trigger global event handlers", async () => {
      mockRequest(request);

      const loadingSpy = jest.fn();
      const requestStartSpy = jest.fn();
      const responseStartSpy = jest.fn();
      const uploadProgressSpy = jest.fn();
      const downloadProgressSpy = jest.fn();
      const responseSpy = jest.fn();
      const abortSpy = jest.fn();
      const removeSpy = jest.fn();

      // Set up global event listeners
      client.requestManager.events.onLoading(loadingSpy);
      client.requestManager.events.onRequestStart(requestStartSpy);
      client.requestManager.events.onResponseStart(responseStartSpy);
      client.requestManager.events.onUploadProgress(uploadProgressSpy);
      client.requestManager.events.onDownloadProgress(downloadProgressSpy);
      client.requestManager.events.onResponse(responseSpy);
      client.requestManager.events.onAbort(abortSpy);
      client.requestManager.events.onRemove(removeSpy);

      // Trigger request lifecycle
      const requestId = client.fetchDispatcher.add(request);

      await sleep(5);

      // Trigger abort and remove events
      client.requestManager.abortByKey(request.abortKey);

      await waitFor(() => {
        expect(loadingSpy).toHaveBeenCalledTimes(2); // Called for start and end
        expect(requestStartSpy).toHaveBeenCalledTimes(1);
        expect(responseStartSpy).toHaveBeenCalledTimes(1);
        expect(uploadProgressSpy).toHaveBeenCalledTimes(3);
        expect(downloadProgressSpy).toHaveBeenCalledTimes(3);
        expect(responseSpy).toHaveBeenCalledTimes(1);
        expect(abortSpy).toHaveBeenCalledTimes(1);
        expect(removeSpy).toHaveBeenCalledTimes(1);
      });

      // Verify event data structure
      expect(loadingSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId,
          request,
        }),
      );

      expect(requestStartSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId,
          request,
        }),
      );

      expect(uploadProgressSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId,
          request,
          loaded: expect.toBeNumber(),
          progress: expect.toBeNumber(),
          total: expect.toBeNumber(),
        }),
      );
    });

    it("should properly remove global event listeners", async () => {
      mockRequest(request);
      const spy = jest.fn();

      // Add and immediately remove event listener
      const removeListener = client.requestManager.events.onLoading(spy);
      removeListener();

      // Trigger request
      client.fetchDispatcher.add(request);

      await sleep(50);

      expect(spy).not.toHaveBeenCalled();
    });

    it("should properly cleanup all types of event listeners", async () => {
      mockRequest(request);
      const requestId = "test-request-id";
      const { queryKey } = request;
      const { cacheKey } = request;
      const { abortKey } = request;

      const spies = {
        loading: jest.fn(),
        loadingByQueue: jest.fn(),
        loadingByCache: jest.fn(),
        loadingById: jest.fn(),
        requestStart: jest.fn(),
        requestStartByQueue: jest.fn(),
        requestStartById: jest.fn(),
        responseStart: jest.fn(),
        responseStartByQueue: jest.fn(),
        responseStartById: jest.fn(),
        uploadProgress: jest.fn(),
        uploadProgressByQueue: jest.fn(),
        uploadProgressById: jest.fn(),
        downloadProgress: jest.fn(),
        downloadProgressByQueue: jest.fn(),
        downloadProgressById: jest.fn(),
        response: jest.fn(),
        responseByCache: jest.fn(),
        responseById: jest.fn(),
        abort: jest.fn(),
        abortByKey: jest.fn(),
        abortById: jest.fn(),
        remove: jest.fn(),
        removeByQueue: jest.fn(),
        removeById: jest.fn(),
      };

      // Set up and immediately cleanup all event listeners
      const cleanups = [
        client.requestManager.events.onLoading(spies.loading),
        client.requestManager.events.onLoadingByQueue(queryKey, spies.loadingByQueue),
        client.requestManager.events.onLoadingByCache(cacheKey, spies.loadingByCache),
        client.requestManager.events.onLoadingById(requestId, spies.loadingById),
        client.requestManager.events.onRequestStart(spies.requestStart),
        client.requestManager.events.onRequestStartByQueue(queryKey, spies.requestStartByQueue),
        client.requestManager.events.onRequestStartById(requestId, spies.requestStartById),
        client.requestManager.events.onResponseStart(spies.responseStart),
        client.requestManager.events.onResponseStartByQueue(queryKey, spies.responseStartByQueue),
        client.requestManager.events.onResponseStartById(requestId, spies.responseStartById),
        client.requestManager.events.onUploadProgress(spies.uploadProgress),
        client.requestManager.events.onUploadProgressByQueue(queryKey, spies.uploadProgressByQueue),
        client.requestManager.events.onUploadProgressById(requestId, spies.uploadProgressById),
        client.requestManager.events.onDownloadProgress(spies.downloadProgress),
        client.requestManager.events.onDownloadProgressByQueue(queryKey, spies.downloadProgressByQueue),
        client.requestManager.events.onDownloadProgressById(requestId, spies.downloadProgressById),
        client.requestManager.events.onResponse(spies.response),
        client.requestManager.events.onResponseByCache(cacheKey, spies.responseByCache),
        client.requestManager.events.onResponseById(requestId, spies.responseById),
        client.requestManager.events.onAbort(spies.abort),
        client.requestManager.events.onAbortByKey(abortKey, spies.abortByKey),
        client.requestManager.events.onAbortById(requestId, spies.abortById),
        client.requestManager.events.onRemove(spies.remove),
        client.requestManager.events.onRemoveByQueue(queryKey, spies.removeByQueue),
        client.requestManager.events.onRemoveById(requestId, spies.removeById),
      ];

      // Execute all cleanup functions
      cleanups.forEach((cleanup) => cleanup());

      // Trigger a full request lifecycle
      client.fetchDispatcher.add(request);
      await sleep(5);
      client.requestManager.abortByKey(request.abortKey);

      await sleep(50);

      // Verify no callbacks were called after cleanup
      Object.values(spies).forEach((spy) => {
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });
  describe("When request manager aborts the request", () => {
    it("should allow to abort request by id", async () => {
      mockRequest(request);
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      const requestId = client.fetchDispatcher.add(request);
      client.requestManager.events.onAbortByKey(request.abortKey, spy1);
      client.requestManager.events.onAbortById(requestId, spy2);

      await sleep(5);

      client.requestManager.abortByKey(request.abortKey);
      await waitFor(() => {
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
      });

      expect(client.appManager.isFocused).toBeTrue();
    });
    it("should allow to abort all requests", async () => {
      mockRequest(request);
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      const requestId = client.fetchDispatcher.add(request);
      client.requestManager.events.onAbortByKey(request.abortKey, spy1);
      client.requestManager.events.onAbortById(requestId, spy2);

      await sleep(5);

      client.requestManager.abortAll();
      await waitFor(() => {
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
      });

      expect(client.appManager.isFocused).toBeTrue();
    });
    it("should not throw when removing non-existing controller key", async () => {
      expect(() => client.requestManager.abortByKey("fake-key")).not.toThrow();
    });

    it("should emit abort event once", async () => {
      mockRequest(request);
      const spy1 = jest.fn();

      client.fetchDispatcher.add(request);
      client.requestManager.events.onAbortByKey(request.abortKey, spy1);

      await sleep(5);
      client.requestManager.abortAll();

      await sleep(50);
      expect(spy1).toHaveBeenCalledTimes(1);

      expect(client.appManager.isFocused).toBeTrue();
    });
  });
});
