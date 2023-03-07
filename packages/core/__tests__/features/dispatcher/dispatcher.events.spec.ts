import { waitFor } from "@testing-library/dom";

import { ResponseType, getErrorMessage } from "adapter";
import { ResponseDetailsType } from "managers";
import { createDispatcher, createClient, createAdapter, createRequest, sleep } from "../../utils";
import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";

describe("Dispatcher [ Events ]", () => {
  const adapterSpy = jest.fn();

  let adapter = createAdapter({ callback: adapterSpy });
  let client = createClient().setAdapter(() => adapter);
  let request = createRequest(client);
  let dispatcher = createDispatcher(client);

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    adapter = createAdapter({ callback: adapterSpy });
    client = createClient().setAdapter(() => adapter);
    request = createRequest(client);
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
      let response: [ResponseType<unknown, unknown, unknown>, ResponseDetailsType];
      const mock = createRequestInterceptor(request);

      client.requestManager.events.onResponse(request.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(request);

      const adapterResponse: ResponseType<unknown, unknown, unknown> = {
        data: mock,
        error: null,
        additionalData: { status: 200 },
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isFailed: false,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper failed response", async () => {
      let response: [ResponseType<unknown, unknown, unknown>, ResponseDetailsType];
      const mock = createRequestInterceptor(request, { status: 400 });

      client.requestManager.events.onResponse(request.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(request);

      const adapterResponse: ResponseType<unknown, unknown, unknown> = {
        data: null,
        error: mock,
        additionalData: { status: 400 },
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isFailed: true,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper retry response", async () => {
      let response: [ResponseType<unknown, unknown, unknown>, ResponseDetailsType];
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

      const adapterResponse: ResponseType<unknown, unknown, unknown> = {
        data: mock,
        error: null,
        additionalData: { status: 200 },
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 1,
        isFailed: false,
        isCanceled: false,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
    it("should emit proper cancel response", async () => {
      let response: [ResponseType<unknown, unknown, unknown>, ResponseDetailsType];
      createRequestInterceptor(request, { status: 400 });

      client.requestManager.events.onResponse(request.cacheKey, (...rest) => {
        response = rest;
        delete (response[1] as Partial<ResponseDetailsType>).timestamp;
      });
      dispatcher.add(request);
      await sleep(1);
      client.requestManager.abortAll();

      const adapterResponse: ResponseType<unknown, unknown, unknown> = {
        data: null,
        error: getErrorMessage("abort"),
        additionalData: { status: 0 },
      };
      const responseDetails: Omit<ResponseDetailsType, "timestamp"> = {
        retries: 0,
        isFailed: true,
        isCanceled: true,
        isOffline: false,
      };

      await waitFor(() => {
        expect(response).toStrictEqual([adapterResponse, responseDetails]);
      });
    });
  });
});
