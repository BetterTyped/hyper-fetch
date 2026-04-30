import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
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
    vi.resetAllMocks();
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "shared-base-endpoint" });
  });

  afterAll(() => {
    stopServer();
  });

  describe("When request manager events get triggered", () => {
    it("should trigger request lifecycle events", async () => {
      mockRequest(request);

      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const spy3 = vi.fn();
      const spy4 = vi.fn();
      const spy5 = vi.fn();
      const spy6 = vi.fn();

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
        expect(spy3.mock.calls.length).toBeGreaterThanOrEqual(1);
        expect(spy4.mock.calls.length).toBeGreaterThanOrEqual(1);
        expect(spy5).toHaveBeenCalledTimes(1);
        expect(spy6).toHaveBeenCalledTimes(1);
      });
    });

    it("should trigger global event handlers", async () => {
      mockRequest(request);

      const loadingSpy = vi.fn();
      const requestStartSpy = vi.fn();
      const responseStartSpy = vi.fn();
      const uploadProgressSpy = vi.fn();
      const downloadProgressSpy = vi.fn();
      const responseSpy = vi.fn();
      const abortSpy = vi.fn();
      const removeSpy = vi.fn();

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
        expect(loadingSpy).toHaveBeenCalledTimes(2);
        expect(requestStartSpy).toHaveBeenCalledTimes(1);
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
      const spy = vi.fn();

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
        loading: vi.fn(),
        loadingByQueue: vi.fn(),
        loadingByCache: vi.fn(),
        loadingById: vi.fn(),
        requestStart: vi.fn(),
        requestStartByQueue: vi.fn(),
        requestStartById: vi.fn(),
        responseStart: vi.fn(),
        responseStartByQueue: vi.fn(),
        responseStartById: vi.fn(),
        uploadProgress: vi.fn(),
        uploadProgressByQueue: vi.fn(),
        uploadProgressById: vi.fn(),
        downloadProgress: vi.fn(),
        downloadProgressByQueue: vi.fn(),
        downloadProgressById: vi.fn(),
        response: vi.fn(),
        responseByCache: vi.fn(),
        responseById: vi.fn(),
        abort: vi.fn(),
        abortByKey: vi.fn(),
        abortById: vi.fn(),
        remove: vi.fn(),
        removeByQueue: vi.fn(),
        removeById: vi.fn(),
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
  describe("When using deduplicated event listeners", () => {
    it("should trigger onDeduplicated callback when emitDeduplicated fires", () => {
      const spy = vi.fn();
      client.requestManager.events.onDeduplicated(spy);

      const eventData = { request, requestId: "test-id", deduplicatedRequest: request };
      client.requestManager.events.emitDeduplicated(eventData);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(eventData);
    });

    it("should trigger onDeduplicatedByQueue callback for matching queryKey", () => {
      const spy = vi.fn();
      client.requestManager.events.onDeduplicatedByQueue(request.queryKey, spy);

      const eventData = { request, requestId: "test-id", deduplicatedRequest: request };
      client.requestManager.events.emitDeduplicated(eventData);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(eventData);
    });

    it("should trigger onDeduplicatedByCache callback for matching cacheKey", () => {
      const spy = vi.fn();
      client.requestManager.events.onDeduplicatedByCache(request.cacheKey, spy);

      const eventData = { request, requestId: "test-id", deduplicatedRequest: request };
      client.requestManager.events.emitDeduplicated(eventData);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(eventData);
    });

    it("should trigger onDeduplicatedById callback for matching requestId", () => {
      const spy = vi.fn();
      const requestId = "specific-request-id";
      client.requestManager.events.onDeduplicatedById(requestId, spy);

      const eventData = { request, requestId, deduplicatedRequest: request };
      client.requestManager.events.emitDeduplicated(eventData);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(eventData);
    });

    it("should cleanup onDeduplicated listener", () => {
      const spy = vi.fn();
      const cleanup = client.requestManager.events.onDeduplicated(spy);
      cleanup();

      client.requestManager.events.emitDeduplicated({ request, requestId: "test-id", deduplicatedRequest: request });

      expect(spy).not.toHaveBeenCalled();
    });

    it("should cleanup onDeduplicatedByQueue listener", () => {
      const spy = vi.fn();
      const cleanup = client.requestManager.events.onDeduplicatedByQueue(request.queryKey, spy);
      cleanup();

      client.requestManager.events.emitDeduplicated({ request, requestId: "test-id", deduplicatedRequest: request });

      expect(spy).not.toHaveBeenCalled();
    });

    it("should cleanup onDeduplicatedByCache listener", () => {
      const spy = vi.fn();
      const cleanup = client.requestManager.events.onDeduplicatedByCache(request.cacheKey, spy);
      cleanup();

      client.requestManager.events.emitDeduplicated({ request, requestId: "test-id", deduplicatedRequest: request });

      expect(spy).not.toHaveBeenCalled();
    });

    it("should cleanup onDeduplicatedById listener", () => {
      const spy = vi.fn();
      const requestId = "specific-request-id";
      const cleanup = client.requestManager.events.onDeduplicatedById(requestId, spy);
      cleanup();

      client.requestManager.events.emitDeduplicated({ request, requestId, deduplicatedRequest: request });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("When request manager aborts the request", () => {
    it("should allow to abort request by id", async () => {
      mockRequest(request);
      const spy1 = vi.fn();
      const spy2 = vi.fn();

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
      const spy1 = vi.fn();
      const spy2 = vi.fn();

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
      const spy1 = vi.fn();

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
