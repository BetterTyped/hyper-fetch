import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Dispatcher } from "dispatcher";
import { createDispatcher, createAdapter, sleep } from "../../utils";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Dispatcher [ Queue ]", () => {
  const adapterSpy = jest.fn();

  let adapter = createAdapter({ callback: adapterSpy });
  let client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
  let dispatcher = createDispatcher(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    resetMocks();
    client.clear();
    adapter = createAdapter({ callback: adapterSpy });
    client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
    dispatcher = createDispatcher(client);
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using dispatcher add method", () => {
    it("should add request to the dispatcher storage and trigger it", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const loadingSpy = jest.fn();
      client.requestManager.events.onLoadingByQueue(request.queueKey, loadingSpy);
      const requestId = dispatcher.add(request);

      expect(requestId).toBeString();
      expect(adapterSpy).toHaveBeenCalledTimes(1);
      expect(loadingSpy).toHaveBeenCalledTimes(1);
      expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeTrue();
      expect(dispatcher.getQueueRequestCount(request.queueKey)).toBe(1);
    });
    it("should add running request and delete it once data is fetched", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request, { delay: 1 });

      dispatcher.add(request);

      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
      await waitFor(() => {
        expect(dispatcher.getAllRunningRequest()).toHaveLength(0);
        expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(0);
      });
    });
    it("should deduplicate requests and return ongoing requestId", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", deduplicate: true });
      mockRequest(request);

      const spy = jest.spyOn(dispatcher, "performRequest");

      const requestId = dispatcher.add(request);
      const deduplicatedId = dispatcher.add(request);

      expect(requestId).toBe(deduplicatedId);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
    });
    it("should queue the queued request", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queued: true });
      mockRequest(request);

      const spy = jest.spyOn(dispatcher, "flushQueue");

      dispatcher.add(request);
      dispatcher.add(request);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
    });
    it("should send all concurrent requests", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queued: false });
      mockRequest(request);

      const spy = jest.spyOn(dispatcher, "performRequest");

      dispatcher.add(request);
      dispatcher.add(request);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(2);
    });
    it("should send all concurrent requests without any duplicates", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queued: false });
      mockRequest(request, { delay: 40 });

      const spy1 = jest.spyOn(dispatcher, "performRequest");
      const spy2 = jest.spyOn(client.requestManager.events, "emitResponse");

      setTimeout(() => {
        dispatcher.add(request);
      }, 0);
      setTimeout(() => {
        dispatcher.add(request);
      }, 10);
      setTimeout(() => {
        dispatcher.add(request);
      }, 20);

      await sleep(100);

      expect(spy1).toHaveBeenCalledTimes(3);
      expect(spy2).toHaveBeenCalledTimes(3);
    });
  });
  describe("When using dispatcher performRequest method", () => {
    it("should trigger fetch adapter", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const spy = jest.spyOn(client, "adapter");
      const storageElement = dispatcher.createStorageElement(request);
      dispatcher.performRequest(storageElement);

      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should not trigger fetch adapter when app is offline", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      client.appManager.setOnline(false);
      const spy = jest.spyOn(client, "adapter");
      const storageElement = dispatcher.createStorageElement(request);
      await dispatcher.performRequest(storageElement);

      expect(spy).toHaveBeenCalledTimes(0);
    });
    it("should trigger all requests when going back from offline", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const spy = jest.spyOn(client, "adapter");
      client.appManager.setOnline(false);
      dispatcher.add(request.setQueueKey("test1"));
      dispatcher.add(request.setQueueKey("test2"));
      dispatcher.add(request.setQueueKey("test3"));

      await sleep(5);

      expect(spy).toHaveBeenCalledTimes(0);
      client.appManager.setOnline(true);

      await sleep(5);

      expect(spy).toHaveBeenCalledTimes(3);
    });
    it("should not trigger one storage element two times at the same time", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const spy = jest.spyOn(client, "adapter");
      const storageElement = dispatcher.createStorageElement(request);
      dispatcher.performRequest(storageElement);
      dispatcher.performRequest(storageElement);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  describe("When retrying requests", () => {
    it("should retry failed request", async () => {
      const spy = jest.fn();
      const spyDelete = jest.fn();
      const customClient = new Client({
        url: "shared-base-url",
        fetchDispatcher: (instance) => new Dispatcher(instance, { onDeleteFromStorage: spyDelete }),
      });
      const request = customClient.createRequest()({ endpoint: "shared-base-endpoint", retry: 1, retryTime: 0 });
      mockRequest(request, { status: 400, delay: 0 });

      customClient.onRequest((cmd) => {
        spy();
        return cmd;
      });
      customClient.fetchDispatcher.add(request);

      await waitFor(() => {
        expect(spyDelete).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
    it("should retry multiple times", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", retry: 2, retryTime: 0 });
      mockRequest(request, { status: 400, delay: 0 });

      const spy = jest.spyOn(client, "adapter");
      dispatcher.add(request);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(3);
      });
    });
    it("should not retry failed request when request 'retry' option is disabled", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", retry: 0 });
      mockRequest(request, { status: 400, delay: 0 });

      const spy = jest.spyOn(client, "adapter");
      dispatcher.add(request);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should not retry failed request in offline mode", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", retry: 0 });
      mockRequest(request, { status: 400, delay: 5 });

      const spy = jest.spyOn(client, "adapter");
      dispatcher.add(request);
      await sleep(5);
      client.appManager.setOnline(false);
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
  describe("When flushing requests", () => {
    it("should flush all queues request", async () => {
      const firstRequest = client.createRequest()({ endpoint: "shared-base-endpoint", queueKey: "1" });
      const secondRequest = client.createRequest()({ endpoint: "shared-base-endpoint", queueKey: "2" });
      mockRequest(firstRequest);
      mockRequest(secondRequest);

      const spy = jest.spyOn(client, "adapter");
      client.appManager.setOnline(false);

      dispatcher.add(firstRequest);
      dispatcher.add(firstRequest);
      dispatcher.add(secondRequest);
      dispatcher.add(secondRequest);

      await sleep(5);
      expect(spy).toHaveBeenCalledTimes(0);
      client.appManager.setOnline(true);
      dispatcher.flush();
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(4);
      });
    });
    it("should not trigger flush methods when queue is empty", async () => {
      const spy = jest.spyOn(dispatcher, "performRequest");
      dispatcher.flushQueue("fake-queue");
      expect(spy).not.toBeCalled();
    });
    it("should not trigger flushQueue when queue is processing", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queued: true });
      mockRequest(request, { delay: 1 });

      const spy = jest.spyOn(dispatcher, "performRequest");
      dispatcher.add(request);
      dispatcher.add(request);

      dispatcher.flushQueue(request.queueKey);
      dispatcher.flushQueue(request.queueKey);
      dispatcher.flushQueue(request.queueKey);

      expect(spy).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
    it("should not trigger flushQueue when having ongoing request", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queued: true });
      mockRequest(request, { delay: 1 });

      const spy = jest.spyOn(dispatcher, "performRequest");
      const jsonRequest = dispatcher.createStorageElement(request);
      dispatcher.addQueueElement(request.queueKey, jsonRequest);
      dispatcher.addRunningRequest(request.queueKey, jsonRequest.requestId, request);

      dispatcher.flushQueue(request.queueKey);

      expect(spy).toHaveBeenCalledTimes(0);
    });

    it("should not trigger flushQueue on stopped requests", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queued: true });
      mockRequest(request, { delay: 1 });

      const spy = jest.spyOn(client, "adapter");
      const jsonRequest = dispatcher.createStorageElement(request);
      dispatcher.addQueueElement(request.queueKey, jsonRequest);
      dispatcher.stopRequest(request.queueKey, jsonRequest.requestId);

      dispatcher.flushQueue(request.queueKey);

      expect(spy).toHaveBeenCalledTimes(0);
    });
    it("should not duplicate ongoing requests using flushQueue", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request, { delay: 30 });

      const spy = jest.spyOn(dispatcher, "performRequest");
      dispatcher.add(request);
      dispatcher.add(request);

      await sleep(5);

      dispatcher.add(request);

      await sleep(5);

      expect(spy).toHaveBeenCalledTimes(3);
    });
  });
  describe("When starting and stopping queue", () => {
    it("should stop queue from being send", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queueKey: "1" });
      mockRequest(request);

      const spy = jest.spyOn(client, "adapter");
      dispatcher.stop(request.queueKey);
      dispatcher.add(request);
      dispatcher.add(request);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(0);
        expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeFalse();
      });
    });
    it("should stop queue and cancel ongoing requests", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queueKey: "1" });
      mockRequest(request);

      const spy = jest.spyOn(client, "adapter");
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();

      const firstRequestId = dispatcher.add(request);
      const secondRequestId = dispatcher.add(request);
      client.requestManager.events.onAbortById(firstRequestId, firstSpy);
      client.requestManager.events.onAbortById(secondRequestId, secondSpy);

      await sleep(1);

      dispatcher.stop(request.queueKey);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
        expect(firstSpy).toHaveBeenCalledTimes(1);
        expect(secondSpy).toHaveBeenCalledTimes(1);
        expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeFalse();
      });
    });
    it("should start previously stopped queue", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queueKey: "1" });
      mockRequest(request);

      const spy = jest.spyOn(client, "adapter");
      dispatcher.stop(request.queueKey);
      dispatcher.add(request);
      dispatcher.add(request);
      dispatcher.start(request.queueKey);
      expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeTrue();

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
    it("should pause queue and finish ongoing requests", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", queueKey: "1" });
      mockRequest(request);

      const spy = jest.spyOn(client, "adapter");
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();

      const firstRequestId = dispatcher.add(request);
      const secondRequestId = dispatcher.add(request);
      client.requestManager.events.onAbortById(firstRequestId, firstSpy);
      client.requestManager.events.onAbortById(secondRequestId, secondSpy);

      await sleep(1);

      dispatcher.pause(request.queueKey);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
        expect(firstSpy).toHaveBeenCalledTimes(0);
        expect(secondSpy).toHaveBeenCalledTimes(0);
        expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeFalse();
      });
    });
    it("should not remove requests from queue storage on stop", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      dispatcher.add(request);
      await sleep(2);
      dispatcher.stop(request.queueKey);

      expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(1);
    });
    it("should not remove request from queue storage on stopRequest", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      const requestId = dispatcher.add(request);
      await sleep(2);
      dispatcher.stopRequest(request.queueKey, requestId);

      expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(1);
    });
  });

  describe("When request is canceled", () => {
    it("should remove request from queue", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(request);

      dispatcher.add(request);
      await sleep(1);
      client.requestManager.abortAll();
      await waitFor(() => {
        expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(0);
      });
    });
  });

  describe("When request is not offline", () => {
    it("should remove request from queue", async () => {
      const request = client.createRequest()({ endpoint: "shared-base-endpoint", offline: false });
      mockRequest(request, { status: 400 });

      dispatcher.add(request);
      await sleep(1);
      client.appManager.setOnline(false);
      await waitFor(() => {
        expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(0);
      });
    });
  });
});
