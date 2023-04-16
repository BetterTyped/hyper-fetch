import { waitFor } from "@testing-library/dom";

import { ResponseReturnType, getErrorMessage, BaseAdapterType } from "adapter";
import { ResponseDetailsType } from "managers";
import { createDispatcher, createAdapter, sleep } from "../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";
import { Client } from "client";

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
    resetInterceptors();
    jest.resetAllMocks();
    adapter = createAdapter({ callback: adapterSpy });
    client = new Client({ url: "shared-base-url" }).setAdapter(() => adapter);
    request = client.createRequest()({ endpoint: "shared-base-endpoint" });
    dispatcher = createDispatcher(client);
    createRequestInterceptor(request);
  });

  afterAll(() => {
    stopServer();
  });

  describe("When using dispatcher events", () => {
    it("should emit loading event", async () => {
      const spy = jest.fn();
      const unmount = client.requestManager.events.onLoading(request.queueKey, spy);
      dispatcher.add(request);
      expect(spy).toBeCalledTimes(1);
      unmount();
      dispatcher.add(request);
      expect(spy).toBeCalledTimes(1);
    });
    it("should emit drained event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onDrained(request.queueKey, spy);
      dispatcher.add(request.setQueued(true));
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
      unmount();
      dispatcher.add(request.setQueued(true));
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
    it("should emit queue status change event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onQueueStatus(request.queueKey, spy);
      dispatcher.stop(request.queueKey);
      expect(spy).toBeCalledTimes(1);
      unmount();
      dispatcher.stop(request.queueKey);
      expect(spy).toBeCalledTimes(1);
    });
    it("should emit queue change event", async () => {
      const spy = jest.fn();
      const unmount = dispatcher.events.onQueueChange(request.queueKey, spy);
      dispatcher.add(request);
      expect(spy).toBeCalledTimes(1);
      unmount();
      dispatcher.add(request);
      expect(spy).toBeCalledTimes(1);
    });
    it("should emit proper data response", async () => {
      let response: [ResponseReturnType<unknown, unknown, BaseAdapterType>, ResponseDetailsType];
      const mock = createRequestInterceptor(request);

      client.requestManager.events.onResponse(request.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(request);

      const adapterResponse: ResponseReturnType<unknown, unknown, BaseAdapterType> = {
        data: mock,
        error: null,
        status: 200,
        isSuccess: true,
        additionalData: {},
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isSuccess: true,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper failed response", async () => {
      let response: [ResponseReturnType<unknown, unknown, BaseAdapterType>, ResponseDetailsType];
      const mock = createRequestInterceptor(request, { status: 400 });

      client.requestManager.events.onResponse(request.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(request);

      const adapterResponse: ResponseReturnType<unknown, unknown, BaseAdapterType> = {
        data: null,
        error: mock,
        status: 400,
        isSuccess: false,
        additionalData: {},
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isSuccess: false,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper retry response", async () => {
      let response: [ResponseReturnType<unknown, unknown, BaseAdapterType>, ResponseDetailsType];
      const requestWithRetry = request.setRetry(1).setRetryTime(50);
      createRequestInterceptor(requestWithRetry, { status: 400, delay: 0 });

      client.requestManager.events.onResponse(requestWithRetry.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(requestWithRetry);

      await waitFor(() => {
        expect(response).toBeDefined();
      });

      const mock = createRequestInterceptor(requestWithRetry);

      const adapterResponse: ResponseReturnType<unknown, unknown, BaseAdapterType> = {
        data: mock,
        error: null,
        status: 200,
        isSuccess: true,
        additionalData: {},
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 1,
        isSuccess: true,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper cancel response", async () => {
      let response: [ResponseReturnType<unknown, unknown, BaseAdapterType>, ResponseDetailsType];
      createRequestInterceptor(request, { status: 400 });

      client.requestManager.events.onResponse(request.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(request);
      await sleep(1);
      client.requestManager.abortAll();

      const adapterResponse: ResponseReturnType<unknown, unknown, BaseAdapterType> = {
        data: null,
        error: getErrorMessage("abort"),
        status: 0,
        isSuccess: false,
        additionalData: {},
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isSuccess: false,
        isCanceled: true,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
  });
});
