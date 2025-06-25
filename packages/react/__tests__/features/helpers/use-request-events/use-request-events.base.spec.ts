import { act } from "@testing-library/react";
import { createClient } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { renderUseRequestEvents } from "../../../utils";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("useRequestEvents [ Base ]", () => {
  let client = createClient({
    url: "http://localhost:3000",
  });

  let request = client.createRequest()({
    endpoint: "/shared-endpoint",
  });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    client = createClient({
      url: "http://localhost:3000",
    });
    request = client.createRequest()({
      endpoint: "/shared-endpoint",
    });

    jest.resetModules();
  });

  describe("When using the useRequestEvents", () => {
    it("should initialize with default state", async () => {
      const { result } = renderUseRequestEvents(request);
      expect(result.current).toBeDefined();
    });

    it("should not change loading state during cache processing", async () => {
      const { result, rerender } = renderUseRequestEvents(request, {
        getIsDataProcessing: () => false,
      });

      const spy = jest.spyOn(request.client.fetchDispatcher, "hasRunningRequests");

      act(() => {
        result.current[1].addCacheDataListener(request);
        request.client.requestManager.events.emitLoading({
          request,
          requestId: "1",
          loading: true,
          isRetry: false,
          isOffline: false,
        });
      });

      expect(spy).toHaveBeenCalledTimes(1);

      rerender({
        getIsDataProcessing: () => true,
      });

      act(() => {
        result.current[1].addCacheDataListener(request);
        request.client.requestManager.events.emitLoading({
          request,
          requestId: "1",
          loading: true,
          isRetry: false,
          isOffline: false,
        });
      });

      // No record of the new call
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should abort requests with matching abort key", async () => {
      const { result } = renderUseRequestEvents(request);

      // Create a spy on the dispatcher's delete method
      const deleteSpy = jest.spyOn(request.client.fetchDispatcher, "delete");

      act(() => {
        request.client.fetchDispatcher.addRunningRequest(request.queryKey, "1", request);
        result.current[0].abort();
      });

      expect(deleteSpy).toHaveBeenCalled();
    });

    it("should not abort requests if abort key does not match", async () => {
      const { result } = renderUseRequestEvents(request);

      // Create a spy on the dispatcher's delete method
      const deleteSpy = jest.spyOn(request.client.fetchDispatcher, "delete");
      const clone = request.clone().setAbortKey("completely-different-key");

      act(() => {
        request.client.fetchDispatcher.addRunningRequest(clone.queryKey, "1234", clone);
        result.current[0].abort();
      });

      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});
