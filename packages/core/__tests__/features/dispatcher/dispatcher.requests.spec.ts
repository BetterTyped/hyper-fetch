import { waitFor } from "@testing-library/dom";

import { createDispatcher, createClient, createRequest, createAdapter, sleep } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { createRequestInterceptor } from "../../server/server";

describe("Dispatcher [ Requests ]", () => {
  const adapterSpy = jest.fn();

  let adapter = createAdapter({ callback: adapterSpy });
  let client = createClient().setAdapter(() => adapter);
  let dispatcher = createDispatcher(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    adapter = createAdapter({ callback: adapterSpy });
    client = createClient().setAdapter(() => adapter);
    dispatcher = createDispatcher(client);
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("Given request gets triggered", () => {
    it("should allow to add request to running requests", async () => {
      const requestId = "test";
      const request = createRequest(client);
      expect(dispatcher.hasRunningRequest(request.queueKey, requestId)).toBeFalse();
      dispatcher.addRunningRequest(request.queueKey, requestId, request);
      expect(dispatcher.hasRunningRequest(request.queueKey, requestId)).toBeTrue();
    });

    it("should get all running requests", async () => {
      const firstRequest = createRequest(client, { queueKey: "test1" });
      const secondRequest = createRequest(client, { queueKey: "test2" });
      createRequestInterceptor(firstRequest, { delay: 5 });
      createRequestInterceptor(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);
      const runningRequests = dispatcher.getAllRunningRequest();

      expect(runningRequests).toHaveLength(2);
      expect(runningRequests).toPartiallyContain({ requestId: firstRequestId });
      expect(runningRequests).toPartiallyContain({ requestId: secondRequestId });
    });
    it("should get queueKey running requests", async () => {
      const firstRequest = createRequest(client, { queueKey: "test1" });
      const secondRequest = createRequest(client, { queueKey: "test2" });
      createRequestInterceptor(firstRequest, { delay: 5 });
      createRequestInterceptor(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);
      const runningRequests = dispatcher.getRunningRequests(firstRequest.queueKey);

      expect(runningRequests).toHaveLength(1);
      expect(runningRequests).toPartiallyContain({ requestId: firstRequestId });
      expect(runningRequests).not.toPartiallyContain({ requestId: secondRequestId });
    });
    it("should get queueKey running requests when queue name space doesn't exist", async () => {
      const runningRequests = dispatcher.getRunningRequests("fake-namespace");

      expect(runningRequests).toBeArray();
    });
    it("should not throw when getting running requests within non existing namespace", async () => {
      expect(dispatcher.getRunningRequest("fake-namespace", "fake-request-id")).toBeUndefined();
    });
    it("should get single running request", async () => {
      const firstRequest = createRequest(client, { queueKey: "test1" });
      const secondRequest = createRequest(client, { queueKey: "test2" });
      createRequestInterceptor(firstRequest, { delay: 5 });
      createRequestInterceptor(secondRequest, { delay: 5 });

      dispatcher.add(secondRequest);
      const firstRequestId = dispatcher.add(firstRequest);
      const request = dispatcher.getRunningRequest(firstRequest.queueKey, firstRequestId);

      expect(request?.requestId).toBe(firstRequestId);
    });
    it("should allow to cancel all running requests", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const thirdSpy = jest.fn();
      const firstRequest = createRequest(client);
      const secondRequest = createRequest(client);
      createRequestInterceptor(firstRequest, { delay: 5 });
      createRequestInterceptor(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);

      await sleep(1);

      client.requestManager.events.onAbortById(firstRequestId, firstSpy);
      client.requestManager.events.onAbortById(secondRequestId, secondSpy);
      client.requestManager.events.onAbort(firstRequest.abortKey, thirdSpy);

      dispatcher.cancelRunningRequests(firstRequest.queueKey);

      expect(dispatcher.getRunningRequests(firstRequest.queueKey)).toHaveLength(0);
      expect(firstSpy).toBeCalledTimes(1);
      expect(secondSpy).toBeCalledTimes(1);
      expect(thirdSpy).toBeCalledTimes(2);
    });
    it("should allow to cancel single running requests", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const firstRequest = createRequest(client);
      const secondRequest = createRequest(client);
      createRequestInterceptor(firstRequest, { delay: 5 });
      createRequestInterceptor(secondRequest, { delay: 5 });

      dispatcher.add(secondRequest);
      const requestId = dispatcher.add(firstRequest);
      client.requestManager.events.onAbortById(requestId, firstSpy);
      client.requestManager.events.onAbort(firstRequest.abortKey, secondSpy);

      await sleep(5);

      dispatcher.cancelRunningRequest(firstRequest.queueKey, requestId);

      expect(dispatcher.getRunningRequests(firstRequest.queueKey)).toHaveLength(1);
      expect(firstSpy).toBeCalledTimes(1);
      expect(secondSpy).toBeCalledTimes(1);
    });
    it("should allow to delete running requests", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const thirdSpy = jest.fn();
      const firstRequest = createRequest(client);
      const secondRequest = createRequest(client);
      createRequestInterceptor(firstRequest, { delay: 5 });
      createRequestInterceptor(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);

      await sleep(5);

      client.requestManager.events.onAbortById(firstRequestId, firstSpy);
      client.requestManager.events.onAbortById(secondRequestId, secondSpy);
      client.requestManager.events.onAbort(firstRequest.abortKey, thirdSpy);

      dispatcher.deleteRunningRequests(firstRequest.queueKey);

      expect(dispatcher.getRunningRequests(firstRequest.queueKey)).toHaveLength(0);
      expect(firstSpy).toBeCalledTimes(0);
      expect(secondSpy).toBeCalledTimes(0);
      expect(thirdSpy).toBeCalledTimes(0);
    });
    it("should allow to delete running request", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const thirdSpy = jest.fn();
      const firstRequest = createRequest(client);
      const secondRequest = createRequest(client);
      createRequestInterceptor(firstRequest, { delay: 5 });
      createRequestInterceptor(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);

      await sleep(5);

      client.requestManager.events.onAbortById(firstRequestId, firstSpy);
      client.requestManager.events.onAbortById(secondRequestId, secondSpy);
      client.requestManager.events.onAbort(firstRequest.queueKey, thirdSpy);

      dispatcher.deleteRunningRequest(firstRequest.queueKey, firstRequestId);

      expect(dispatcher.getRunningRequests(firstRequest.queueKey)).toHaveLength(1);
      expect(firstSpy).toBeCalledTimes(0);
      expect(secondSpy).toBeCalledTimes(0);
      expect(thirdSpy).toBeCalledTimes(0);
    });
    describe("When using running request helper methods", () => {
      it("should return false when there is no running requests", async () => {
        expect(dispatcher.hasRunningRequests("test")).toBeFalse();
      });
    });
    describe("When stoping and starting particular requests", () => {
      it("should allow to stop request", async () => {
        const request = createRequest(client);
        createRequestInterceptor(request, { delay: 5 });

        const requestId = dispatcher.add(request);
        await sleep(1);
        expect(dispatcher.getRunningRequest(request.queueKey, requestId)).toBeDefined();

        dispatcher.stopRequest(request.queueKey, requestId);
        const queue = dispatcher.getQueue(request.queueKey);

        expect(dispatcher.getRunningRequest(request.queueKey, requestId)).not.toBeDefined();
        expect(queue.requests[0].stopped).toBeTrue();

        await waitFor(() => {
          const cacheValue = client.cache.get(request.cacheKey);
          expect(cacheValue).not.toBeDefined();
        });
      });
      it("should allow to start previously stopped request", async () => {
        const request = createRequest(client);
        createRequestInterceptor(request, { delay: 1 });

        const spy = jest.spyOn(client.cache, "set");

        const requestId = dispatcher.add(request);
        dispatcher.stopRequest(request.queueKey, requestId);

        await sleep(30);

        dispatcher.startRequest(request.queueKey, requestId);

        await waitFor(() => {
          const cacheValue = client.cache.get(request.cacheKey);
          expect(dispatcher.getQueue(request.queueKey).requests).toHaveLength(0);
          expect(spy).toBeCalledTimes(2);
          expect(cacheValue).toBeDefined();
          expect(cacheValue?.details.isCanceled).toBeFalse();
        });
      });

      it("should not emit changes when started requests is not found in storage", async () => {
        const spy = jest.fn();
        dispatcher.events.onQueueChange("fake-key", spy);
        dispatcher.startRequest("fake-key", "fake-request-id");

        expect(spy).not.toBeCalled();
      });
    });
  });
});
