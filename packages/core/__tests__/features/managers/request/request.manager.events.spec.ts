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
