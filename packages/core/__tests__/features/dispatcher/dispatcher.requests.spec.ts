import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { createDispatcher, createAdapter } from "../../utils";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Dispatcher [ Requests ]", () => {
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

  describe("Given request gets triggered", () => {
    it("should allow to add request to running requests", async () => {
      const requestId = "test";
      const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
      expect(dispatcher.hasRunningRequest(request.queryKey, requestId)).toBeFalse();
      dispatcher.addRunningRequest(request.queryKey, requestId, request);
      expect(dispatcher.hasRunningRequest(request.queryKey, requestId)).toBeTrue();
    });

    it("should get all running requests", async () => {
      const firstRequest = client.createRequest()({ endpoint: "shared-base-endpoint", queryKey: "test1" });
      const secondRequest = client.createRequest()({ endpoint: "shared-base-endpoint", queryKey: "test2" });
      mockRequest(firstRequest, { delay: 5 });
      mockRequest(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);
      const runningRequests = dispatcher.getAllRunningRequests();

      expect(runningRequests).toHaveLength(2);
      expect(runningRequests).toPartiallyContain({ requestId: firstRequestId });
      expect(runningRequests).toPartiallyContain({ requestId: secondRequestId });
    });
    it("should get queryKey running requests", async () => {
      const firstRequest = client.createRequest()({ endpoint: "shared-base-endpoint", queryKey: "test1" });
      const secondRequest = client.createRequest()({ endpoint: "shared-base-endpoint", queryKey: "test2" });
      mockRequest(firstRequest, { delay: 5 });
      mockRequest(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);
      const runningRequests = dispatcher.getRunningRequests(firstRequest.queryKey);

      expect(runningRequests).toHaveLength(1);
      expect(runningRequests).toPartiallyContain({ requestId: firstRequestId });
      expect(runningRequests).not.toPartiallyContain({ requestId: secondRequestId });
    });
    it("should get queryKey running requests when queue name space doesn't exist", async () => {
      const runningRequests = dispatcher.getRunningRequests("fake-namespace");

      expect(runningRequests).toBeArray();
    });
    it("should not throw when getting running requests within non existing namespace", async () => {
      expect(dispatcher.getRunningRequest("fake-namespace", "fake-request-id")).toBeUndefined();
    });
    it("should get single running request", async () => {
      const firstRequest = client.createRequest()({ endpoint: "shared-base-endpoint", queryKey: "test1" });
      const secondRequest = client.createRequest()({ endpoint: "shared-base-endpoint", queryKey: "test2" });
      mockRequest(firstRequest, { delay: 5 });
      mockRequest(secondRequest, { delay: 5 });

      dispatcher.add(secondRequest);
      const firstRequestId = dispatcher.add(firstRequest);
      const request = dispatcher.getRunningRequest(firstRequest.queryKey, firstRequestId);

      expect(request?.requestId).toBe(firstRequestId);
    });
    it("should allow to cancel all running requests", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const thirdSpy = jest.fn();
      const firstRequest = client.createRequest()({ endpoint: "shared-base-endpoint" });
      const secondRequest = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(firstRequest, { delay: 5 });
      mockRequest(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);

      await sleep(1);

      client.requestManager.events.onAbortById(firstRequestId, firstSpy);
      client.requestManager.events.onAbortById(secondRequestId, secondSpy);
      client.requestManager.events.onAbortByKey(firstRequest.abortKey, thirdSpy);

      dispatcher.cancelRunningRequests(firstRequest.queryKey);

      expect(dispatcher.getRunningRequests(firstRequest.queryKey)).toHaveLength(0);
      expect(firstSpy).toHaveBeenCalledTimes(1);
      expect(secondSpy).toHaveBeenCalledTimes(1);
      expect(thirdSpy).toHaveBeenCalledTimes(2);
    });
    it("should allow to cancel single running requests", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const firstRequest = client.createRequest()({ endpoint: "shared-base-endpoint" });
      const secondRequest = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(firstRequest, { delay: 5 });
      mockRequest(secondRequest, { delay: 5 });

      dispatcher.add(secondRequest);
      const requestId = dispatcher.add(firstRequest);
      client.requestManager.events.onAbortById(requestId, firstSpy);
      client.requestManager.events.onAbortByKey(firstRequest.abortKey, secondSpy);

      await sleep(5);

      dispatcher.cancelRunningRequest(firstRequest.queryKey, requestId);

      expect(dispatcher.getRunningRequests(firstRequest.queryKey)).toHaveLength(1);
      expect(firstSpy).toHaveBeenCalledTimes(1);
      expect(secondSpy).toHaveBeenCalledTimes(1);
    });
    it("should allow to delete running requests", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const thirdSpy = jest.fn();
      const firstRequest = client.createRequest()({ endpoint: "shared-base-endpoint" });
      const secondRequest = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(firstRequest, { delay: 5 });
      mockRequest(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);

      await sleep(5);

      client.requestManager.events.onAbortById(firstRequestId, firstSpy);
      client.requestManager.events.onAbortById(secondRequestId, secondSpy);
      client.requestManager.events.onAbortByKey(firstRequest.abortKey, thirdSpy);

      dispatcher.deleteRunningRequests(firstRequest.queryKey);

      expect(dispatcher.getRunningRequests(firstRequest.queryKey)).toHaveLength(0);
      expect(firstSpy).toHaveBeenCalledTimes(0);
      expect(secondSpy).toHaveBeenCalledTimes(0);
      expect(thirdSpy).toHaveBeenCalledTimes(0);
    });
    it("should allow to delete running request", async () => {
      const firstSpy = jest.fn();
      const secondSpy = jest.fn();
      const thirdSpy = jest.fn();
      const firstRequest = client.createRequest()({ endpoint: "shared-base-endpoint" });
      const secondRequest = client.createRequest()({ endpoint: "shared-base-endpoint" });
      mockRequest(firstRequest, { delay: 5 });
      mockRequest(secondRequest, { delay: 5 });

      const firstRequestId = dispatcher.add(firstRequest);
      const secondRequestId = dispatcher.add(secondRequest);

      await sleep(5);

      client.requestManager.events.onAbortById(firstRequestId, firstSpy);
      client.requestManager.events.onAbortById(secondRequestId, secondSpy);
      client.requestManager.events.onAbortByKey(firstRequest.queryKey, thirdSpy);

      dispatcher.deleteRunningRequest(firstRequest.queryKey, firstRequestId);

      expect(dispatcher.getRunningRequests(firstRequest.queryKey)).toHaveLength(1);
      expect(firstSpy).toHaveBeenCalledTimes(0);
      expect(secondSpy).toHaveBeenCalledTimes(0);
      expect(thirdSpy).toHaveBeenCalledTimes(0);
    });
    describe("When using running request helper methods", () => {
      it("should return false when there is no running requests", async () => {
        expect(dispatcher.hasRunningRequests("test")).toBeFalse();
      });
    });
    describe("When stoping and starting particular requests", () => {
      it("should allow to stop request", async () => {
        const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
        mockRequest(request, { delay: 5 });

        const requestId = dispatcher.add(request);
        await sleep(1);
        expect(dispatcher.getRunningRequest(request.queryKey, requestId)).toBeDefined();

        dispatcher.stopRequest(request.queryKey, requestId);
        const queue = dispatcher.getQueue(request.queryKey);

        expect(dispatcher.getRunningRequest(request.queryKey, requestId)).not.toBeDefined();
        expect(queue.requests[0].stopped).toBeTrue();

        await waitFor(() => {
          const cacheValue = client.cache.get(request.cacheKey);
          expect(cacheValue).not.toBeDefined();
        });
      });
      it("should allow to start previously stopped request", async () => {
        const request = client.createRequest()({ endpoint: "shared-base-endpoint" });
        mockRequest(request, { delay: 1 });

        const spy = jest.spyOn(client.cache, "set");

        const requestId = dispatcher.add(request);
        dispatcher.stopRequest(request.queryKey, requestId);

        await sleep(30);

        dispatcher.startRequest(request.queryKey, requestId);

        await waitFor(() => {
          const cacheValue = client.cache.get(request.cacheKey);
          expect(dispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
          expect(spy).toHaveBeenCalledTimes(2);
          expect(cacheValue).toBeDefined();
          expect(cacheValue?.isCanceled).toBeFalse();
        });
      });

      it("should not emit changes when started requests is not found in storage", async () => {
        const spy = jest.fn();
        dispatcher.events.onQueueChangeByKey("fake-key", spy);
        dispatcher.startRequest("fake-key", "fake-request-id");

        expect(spy).not.toBeCalled();
      });
    });
  });
});
