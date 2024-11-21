import { waitFor } from "@testing-library/dom";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { sleep } from "../../../utils";
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
        expect(spy3).toHaveBeenCalledTimes(2);
        expect(spy4).toHaveBeenCalledTimes(3);
        expect(spy5).toHaveBeenCalledTimes(1);
        expect(spy6).toHaveBeenCalledTimes(1);
      });
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
