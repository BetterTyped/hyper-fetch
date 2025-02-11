import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { AdapterInstance, ResponseType, getErrorMessage } from "adapter";
import { ResponseDetailsType } from "managers";
import { createDispatcher, createAdapter } from "../../utils";
import { Client } from "client";
import { xhrExtra } from "http-adapter";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Dispatcher [ Events ]", () => {
  const adapterSpy = jest.fn();

  let adapter = createAdapter({ callback: adapterSpy });
  let client = new Client({ url: "shared-base-url" }).setAdapter(adapter);
  let request = client.createRequest()({ endpoint: "shared-base-endpoint" });
  let dispatcher = createDispatcher(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    jest.resetAllMocks();
    adapter = createAdapter({ callback: adapterSpy });
    client = new Client({ url: "shared-base-url" }).setAdapter(adapter);
    request = client.createRequest()({ endpoint: "shared-base-endpoint" });
    dispatcher = createDispatcher(client);
    mockRequest(request, { status: 200, delay: 0 });
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using dispatcher events", () => {
    it("should emit loading event", async () => {
      const spy = jest.fn();
      const unmount = client.requestManager.events.onLoadingByQueue(request.queryKey, spy);
      dispatcher.add(request);
      expect(spy).toHaveBeenCalledTimes(1);
      unmount();
      dispatcher.add(request);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should emit drained event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onDrainedByKey(request.queryKey, spy);
      const requestId = dispatcher.add(request.setQueued(true));
      dispatcher.delete(request.queryKey, requestId, request.abortKey);
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
      unmount();
      const requestId2 = dispatcher.add(request.setQueued(true));
      dispatcher.delete(request.queryKey, requestId2, request.abortKey);
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should emit queue status change event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onQueueStatusChangeByKey(request.queryKey, spy);
      dispatcher.stop(request.queryKey);
      expect(spy).toHaveBeenCalledTimes(1);
      unmount();
      dispatcher.stop(request.queryKey);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should emit queue change event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onQueueChangeByKey(request.queryKey, spy);
      dispatcher.add(request);
      expect(spy).toHaveBeenCalledTimes(1);
      unmount();
      dispatcher.add(request);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should handle listen change events correctly", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.emitter.onListener(request.queryKey, spy);

      const listener = () => {};
      // Should be called when a new listener is added
      dispatcher.emitter.on(request.queryKey, listener);
      expect(dispatcher.emitter.listeners(request.queryKey).length).toBe(1);
      expect(spy).toHaveBeenCalledWith(1);

      dispatcher.emitter.off(request.queryKey, listener);

      expect(dispatcher.emitter.listeners(request.queryKey).length).toBe(0);
      expect(spy).toHaveBeenCalledWith(0);

      // Should be called when a listener is removed
      unmount();

      dispatcher.emitter.addListener(request.queryKey, listener);
      expect(dispatcher.emitter.listeners(request.queryKey).length).toBe(1);
      expect(spy).toHaveBeenCalledTimes(2);
    });
    it("should emit proper data response", async () => {
      let response: [ResponseType<unknown, unknown, AdapterInstance>, ResponseDetailsType];
      const mock = mockRequest(request);

      client.requestManager.events.onResponseByCache(request.cacheKey, (data) => {
        response = [data.response, data.details];
      });
      dispatcher.add(request);

      const adapterResponse: ResponseType<unknown, unknown, AdapterInstance> = {
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "2" } },
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isCanceled: false,
        isOffline: false,
        triggerTimestamp: expect.toBeNumber(),
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
        addedTimestamp: expect.toBeNumber(),
      };

      await waitFor(() => {
        expect(response).toEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper failed response", async () => {
      let response: [ResponseType<unknown, unknown, AdapterInstance>, ResponseDetailsType];
      const mock = mockRequest(request, { status: 400 });

      client.requestManager.events.onResponseByCache(request.cacheKey, (data) => {
        response = [data.response, data.details];
      });
      dispatcher.add(request);

      const adapterResponse: ResponseType<unknown, unknown, AdapterInstance> = {
        data: null,
        error: mock,
        status: 400,
        success: false,
        extra: { headers: { "content-type": "application/json", "content-length": "19" } },
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isCanceled: false,
        isOffline: false,
        triggerTimestamp: expect.toBeNumber(),
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
        addedTimestamp: expect.toBeNumber(),
      };

      await waitFor(() => {
        expect(response).toEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper retry response", async () => {
      let response: [ResponseType<unknown, unknown, AdapterInstance>, ResponseDetailsType];
      const requestWithRetry = request.setRetry(1).setRetryTime(50);
      mockRequest(requestWithRetry, { status: 400, delay: 0 });

      client.requestManager.events.onResponseByCache(requestWithRetry.cacheKey, (data) => {
        response = [data.response, data.details];
      });
      dispatcher.add(requestWithRetry);

      await waitFor(() => {
        expect(response).toBeDefined();
      });

      const mock = mockRequest(requestWithRetry);

      const adapterResponse: ResponseType<unknown, unknown, AdapterInstance> = {
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "2" } },
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 1,
        isCanceled: false,
        isOffline: false,
        triggerTimestamp: expect.toBeNumber(),
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
        addedTimestamp: expect.toBeNumber(),
      };

      await waitFor(() => {
        expect(response).toEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper cancel response", async () => {
      let response: [ResponseType<unknown, unknown, AdapterInstance>, ResponseDetailsType];
      mockRequest(request, { status: 400 });

      client.requestManager.events.onResponseByCache(request.cacheKey, (data) => {
        response = [data.response, data.details];
      });
      dispatcher.add(request);
      await sleep(1);
      client.requestManager.abortAll();

      const adapterResponse: ResponseType<unknown, unknown, AdapterInstance> = {
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        success: false,
        extra: xhrExtra,
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isCanceled: true,
        isOffline: false,
        addedTimestamp: expect.toBeNumber(),
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
        triggerTimestamp: expect.toBeNumber(),
      };

      await waitFor(() => {
        expect(response).toEqual([adapterResponse, responseDetails]);
      });
    });
  });
});
