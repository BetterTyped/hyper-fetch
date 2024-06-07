import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { ResponseType, getErrorMessage, AdapterType, xhrExtra } from "adapter";
import { ResponseDetailsType } from "managers";
import { createDispatcher, createAdapter, sleep } from "../../utils";
import { Client } from "client";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("Dispatcher [ Events ]", () => {
  const adapterSpy = jest.fn();

  let adapter = createAdapter({ callback: adapterSpy });
  let client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
  let request = client.createRequest()({ endpoint: "shared-base-endpoint" });
  let dispatcher = createDispatcher(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetMocks();
    jest.resetAllMocks();
    adapter = createAdapter({ callback: adapterSpy });
    client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
    request = client.createRequest()({ endpoint: "shared-base-endpoint" });
    dispatcher = createDispatcher(client);
    mockRequest(request);
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using dispatcher events", () => {
    it("should emit loading event", async () => {
      const spy = jest.fn();
      const unmount = client.requestManager.events.onLoading(request.queueKey, spy);
      dispatcher.add(request);
      expect(spy).toHaveBeenCalledTimes(1);
      unmount();
      dispatcher.add(request);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should emit drained event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onDrained(request.queueKey, spy);
      dispatcher.add(request.setQueued(true));
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
      unmount();
      dispatcher.add(request.setQueued(true));
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
    it("should emit queue status change event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onQueueStatus(request.queueKey, spy);
      dispatcher.stop(request.queueKey);
      expect(spy).toHaveBeenCalledTimes(1);
      unmount();
      dispatcher.stop(request.queueKey);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should emit queue change event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onQueueChange(request.queueKey, spy);
      dispatcher.add(request);
      expect(spy).toHaveBeenCalledTimes(1);
      unmount();
      dispatcher.add(request);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should emit proper data response", async () => {
      let response: [ResponseType<unknown, unknown, AdapterType>, ResponseDetailsType];
      const mock = mockRequest(request);

      client.requestManager.events.onResponse(request.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(request);

      const adapterResponse: ResponseType<unknown, unknown, AdapterType> = {
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "2" } },
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper failed response", async () => {
      let response: [ResponseType<unknown, unknown, AdapterType>, ResponseDetailsType];
      const mock = mockRequest(request, { status: 400 });

      client.requestManager.events.onResponse(request.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(request);

      const adapterResponse: ResponseType<unknown, unknown, AdapterType> = {
        data: null,
        error: mock,
        status: 400,
        success: false,
        extra: { headers: { "content-type": "application/json", "content-length": "19" } },
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper retry response", async () => {
      let response: [ResponseType<unknown, unknown, AdapterType>, ResponseDetailsType];
      const requestWithRetry = request.setRetry(1).setRetryTime(50);
      mockRequest(requestWithRetry, { status: 400, delay: 0 });

      client.requestManager.events.onResponse(requestWithRetry.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(requestWithRetry);

      await waitFor(() => {
        expect(response).toBeDefined();
      });

      const mock = mockRequest(requestWithRetry);

      const adapterResponse: ResponseType<unknown, unknown, AdapterType> = {
        data: mock,
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "content-length": "2" } },
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 1,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper cancel response", async () => {
      let response: [ResponseType<unknown, unknown, AdapterType>, ResponseDetailsType];
      mockRequest(request, { status: 400 });

      client.requestManager.events.onResponse(request.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(request);
      await sleep(1);
      client.requestManager.abortAll();

      const adapterResponse: ResponseType<unknown, unknown, AdapterType> = {
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        success: false,
        extra: xhrExtra,
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isCanceled: true,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
  });
});
