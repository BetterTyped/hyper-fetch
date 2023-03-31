import { waitFor } from "@testing-library/dom";

import { Dispatcher } from "dispatcher";
import { createDispatcher, createClient, createRequest, createAdapter, sleep } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createRequestInterceptor } from "../../server/server";

describe("Dispatcher [ Queue ]", () => {
  const adapterSpy = jest.fn();

  let adapter = createAdapter({ callback: adapterSpy });
  let client = createClient().setAdapter(() => adapter);
  let dispatcher = createDispatcher(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    resetInterceptors();
    client.clear();
    adapter = createAdapter({ callback: adapterSpy });
    client = createClient().setAdapter(() => adapter);
    dispatcher = createDispatcher(client);
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using dispatcher add method", () => {
    it("should add request to the dispatcher storage and trigger it", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request);

      const loadingSpy = jest.fn();
      client.requestManager.events.onLoading(request.queueKey, loadingSpy);
      const requestId = dispatcher.add(request);

      expect(requestId).toBeString();
      expect(adapterSpy).toBeCalledTimes(1);
      expect(loadingSpy).toBeCalledTimes(1);
      expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeTrue();
      expect(dispatcher.getQueueRequestCount(request.queueKey)).toBe(1);
    });
    it("should add running request and delete it once data is fetched", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request, { delay: 1 });

      dispatcher.add(request);

      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
      await waitFor(() => {
        expect(dispatcher.getAllRunningRequest()).toHaveLength(0);
        expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(0);
      });
    });
    it("should deduplicate requests and return ongoing requestId", async () => {
      const request = createRequest(client, { deduplicate: true });
      createRequestInterceptor(request);

      const spy = jest.spyOn(dispatcher, "performRequest");

      const requestId = dispatcher.add(request);
      const deduplicatedId = dispatcher.add(request);

      expect(requestId).toBe(deduplicatedId);
      expect(spy).toBeCalledTimes(1);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
    });
    it("should queue the queued request", async () => {
      const request = createRequest(client, { queued: true });
      createRequestInterceptor(request);

      const spy = jest.spyOn(dispatcher, "flushQueue");

      dispatcher.add(request);
      dispatcher.add(request);

      expect(spy).toBeCalledTimes(2);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(1);
    });
    it("should send all concurrent request", async () => {
      const request = createRequest(client, { queued: false });
      createRequestInterceptor(request);

      const spy = jest.spyOn(dispatcher, "performRequest");

      dispatcher.add(request);
      dispatcher.add(request);

      expect(spy).toBeCalledTimes(2);
      expect(dispatcher.getAllRunningRequest()).toHaveLength(2);
    });
  });
  describe("When using dispatcher performRequest method", () => {
    it("should trigger fetch adapter", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request);

      const spy = jest.spyOn(client, "adapter");
      const storageElement = dispatcher.createStorageElement(request);
      dispatcher.performRequest(storageElement);

      expect(spy).toBeCalledTimes(1);
    });
    it("should not trigger fetch adapter when app is offline", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request);

      client.appManager.setOnline(false);
      const spy = jest.spyOn(client, "adapter");
      const storageElement = dispatcher.createStorageElement(request);
      await dispatcher.performRequest(storageElement);

      expect(spy).toBeCalledTimes(0);
    });
    it("should trigger all requests when going back from offline", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request);

      const spy = jest.spyOn(client, "adapter");
      client.appManager.setOnline(false);
      dispatcher.add(request.setQueueKey("test1"));
      dispatcher.add(request.setQueueKey("test2"));
      dispatcher.add(request.setQueueKey("test3"));

      await sleep(5);

      expect(spy).toBeCalledTimes(0);
      client.appManager.setOnline(true);

      await sleep(5);

      expect(spy).toBeCalledTimes(3);
    });
    it("should not trigger one storage element two times at the same time", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request);

      const spy = jest.spyOn(client, "adapter");
      const storageElement = dispatcher.createStorageElement(request);
      dispatcher.performRequest(storageElement);
      dispatcher.performRequest(storageElement);

      expect(spy).toBeCalledTimes(1);
    });
  });
  describe("When retrying requests", () => {
    it("should retry failed request", async () => {
      const spy = jest.fn();
      const spyDelete = jest.fn();
      const customClient = createClient({
        fetchDispatcher: (instance) => new Dispatcher(instance, { onDeleteFromStorage: spyDelete }),
      });
      const request = createRequest(customClient, { retry: 1, retryTime: 0 });
      createRequestInterceptor(request, { status: 400, delay: 0 });

      customClient.onRequest((cmd) => {
        spy();
        return cmd;
      });
      customClient.fetchDispatcher.add(request);

      await waitFor(() => {
        expect(spyDelete).toBeCalledTimes(1);
        expect(spy).toBeCalledTimes(2);
      });
    });
    it("should retry multiple times", async () => {
      const request = createRequest(client, { retry: 2, retryTime: 0 });
      createRequestInterceptor(request, { status: 400, delay: 0 });

      const spy = jest.spyOn(client, "adapter");
      dispatcher.add(request);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(3);
      });
    });
    it("should not retry failed request when request 'retry' option is disabled", async () => {
      const request = createRequest(client, { retry: 0 });
      createRequestInterceptor(request, { status: 400, delay: 0 });

      const spy = jest.spyOn(client, "adapter");
      dispatcher.add(request);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
    it("should not retry failed request in offline mode", async () => {
      const request = createRequest(client, { retry: 0 });
      createRequestInterceptor(request, { status: 400, delay: 5 });

      const spy = jest.spyOn(client, "adapter");
      dispatcher.add(request);
      await sleep(5);
      client.appManager.setOnline(false);
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
  });
  describe("When flushing requests", () => {
    it("should flush all queues request", async () => {
      const firstRequest = createRequest(client, { queueKey: "1" });
      const secondRequest = createRequest(client, { queueKey: "2" });
      createRequestInterceptor(firstRequest);
      createRequestInterceptor(secondRequest);

      const spy = jest.spyOn(client, "adapter");
      client.appManager.setOnline(false);

      dispatcher.add(firstRequest);
      dispatcher.add(firstRequest);
      dispatcher.add(secondRequest);
      dispatcher.add(secondRequest);

      await sleep(5);
      expect(spy).toBeCalledTimes(0);
      client.appManager.setOnline(true);
      dispatcher.flush();
      await waitFor(() => {
        expect(spy).toBeCalledTimes(4);
      });
    });
    it("should not trigger flush methods when queue is empty", async () => {
      const spy = jest.spyOn(dispatcher, "performRequest");
      dispatcher.flushQueue("fake-queue");
      expect(spy).not.toBeCalled();
    });
    it("should not trigger flushQueue when queue is processing", async () => {
      const request = createRequest(client, { queued: true });
      createRequestInterceptor(request, { delay: 1 });

      const spy = jest.spyOn(dispatcher, "performRequest");
      dispatcher.add(request);
      dispatcher.add(request);

      dispatcher.flushQueue(request.queueKey);
      dispatcher.flushQueue(request.queueKey);
      dispatcher.flushQueue(request.queueKey);

      expect(spy).toBeCalledTimes(1);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(2);
      });
    });
    it("should not trigger flushQueue when having ongoing request", async () => {
      const request = createRequest(client, { queued: true });
      createRequestInterceptor(request, { delay: 1 });

      const spy = jest.spyOn(dispatcher, "performRequest");
      const jsonRequest = dispatcher.createStorageElement(request);
      dispatcher.addQueueElement(request.queueKey, jsonRequest);
      dispatcher.addRunningRequest(request.queueKey, jsonRequest.requestId, request);

      dispatcher.flushQueue(request.queueKey);

      expect(spy).toBeCalledTimes(0);
    });

    it("should not trigger flushQueue on stopped requests", async () => {
      const request = createRequest(client, { queued: true });
      createRequestInterceptor(request, { delay: 1 });

      const spy = jest.spyOn(client, "adapter");
      const jsonRequest = dispatcher.createStorageElement(request);
      dispatcher.addQueueElement(request.queueKey, jsonRequest);
      dispatcher.stopRequest(request.queueKey, jsonRequest.requestId);

      dispatcher.flushQueue(request.queueKey);

      expect(spy).toBeCalledTimes(0);
    });
    it("should not duplicate ongoing requests using flushQueue", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request, { delay: 30 });

      const spy = jest.spyOn(dispatcher, "performRequest");
      dispatcher.add(request);
      dispatcher.add(request);

      await sleep(5);

      dispatcher.add(request);

      await sleep(5);

      expect(spy).toBeCalledTimes(3);
    });
  });
  describe("When starting and stopping queue", () => {
    it("should stop queue from being send", async () => {
      const request = createRequest(client, { queueKey: "1" });
      createRequestInterceptor(request);

      const spy = jest.spyOn(client, "adapter");
      dispatcher.stop(request.queueKey);
      dispatcher.add(request);
      dispatcher.add(request);

      await waitFor(() => {
        expect(spy).toBeCalledTimes(0);
        expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeFalse();
      });
    });
    it("should stop queue and cancel ongoing requests", async () => {
      const request = createRequest(client, { queueKey: "1" });
      createRequestInterceptor(request);

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
        expect(spy).toBeCalledTimes(2);
        expect(firstSpy).toBeCalledTimes(1);
        expect(secondSpy).toBeCalledTimes(1);
        expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeFalse();
      });
    });
    it("should start previously stopped queue", async () => {
      const request = createRequest(client, { queueKey: "1" });
      createRequestInterceptor(request);

      const spy = jest.spyOn(client, "adapter");
      dispatcher.stop(request.queueKey);
      dispatcher.add(request);
      dispatcher.add(request);
      dispatcher.start(request.queueKey);
      expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeTrue();

      await waitFor(() => {
        expect(spy).toBeCalledTimes(2);
      });
    });
    it("should pause queue and finish ongoing requests", async () => {
      const request = createRequest(client, { queueKey: "1" });
      createRequestInterceptor(request);

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
        expect(spy).toBeCalledTimes(2);
        expect(firstSpy).toBeCalledTimes(0);
        expect(secondSpy).toBeCalledTimes(0);
        expect(dispatcher.getIsActiveQueue(request.queueKey)).toBeFalse();
      });
    });
    it("should not remove requests from queue storage on stop", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request);

      dispatcher.add(request);
      await sleep(2);
      dispatcher.stop(request.queueKey);

      expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(1);
    });
    it("should not remove request from queue storage on stopRequest", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request);

      const requestId = dispatcher.add(request);
      await sleep(2);
      dispatcher.stopRequest(request.queueKey, requestId);

      expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(1);
    });
  });

  describe("When request is canceled", () => {
    it("should remove request from queue", async () => {
      const request = createRequest(client);
      createRequestInterceptor(request);

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
      const request = createRequest(client, { offline: false });
      createRequestInterceptor(request, { status: 400 });

      dispatcher.add(request);
      await sleep(1);
      client.appManager.setOnline(false);
      await waitFor(() => {
        expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(0);
      });
    });
  });
});
