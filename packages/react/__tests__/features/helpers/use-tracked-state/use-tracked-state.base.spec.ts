import { xhrAdditionalData } from "@hyper-fetch/core";
import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer } from "../../../server";
import { createRequest, renderUseTrackedState } from "../../../utils";

describe("useTrackingState [ Events ]", () => {
  let request = createRequest();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    request = createRequest();
  });

  describe("given dependency tracking is active", () => {
    describe("when updating the state values and dependency tracking is on", () => {
      it("should not rerender hook when deep equal values are the same", async () => {
        // Todo
      });
      it("should rerender component when attribute is used", async () => {
        // Todo
      });
      it("should not rerender component when attribute is not used", async () => {
        // Todo
      });
    });
  });
  describe("given dependency tracking is off", () => {
    describe("when updating the state values", () => {
      it("should rerender on any attribute change", async () => {
        // Todo
      });
    });
  });
  describe("given request is mapping response", () => {
    describe("when receiving data", () => {
      it("should map the data", async () => {
        const { result } = renderUseTrackedState(
          request.setResponseMapper((response) => {
            return { ...response, data: "new-data" };
          }),
        );

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: true as any,
            error: null,
            status: 200,
            isSuccess: true,
            additionalData: xhrAdditionalData,
            retries: 0,
            timestamp: +new Date(),
            isCanceled: false,
            isOffline: false,
            cacheTime: request.cacheTime,
            clearKey: request.client.cache.clearKey,
            garbageCollection: Infinity,
          });
        });

        expect(result.current[0].data).toBe("new-data");
        // Todo
      });
    });
  });
  describe("given custom deepCompare option is passed", () => {
    describe("when deepCompare is function", () => {
      it("should trigger with two values", async () => {
        // Todo
      });
      it("should allow to use custom deepCompare", async () => {
        const deepCompare = jest.fn().mockImplementation(() => false);
        const { result } = renderUseTrackedState(request, { deepCompare, dependencyTracking: true });

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: true,
            error: null,
            status: 200,
            isSuccess: true,
            additionalData: xhrAdditionalData,
            retries: 0,
            timestamp: +new Date(),
            isCanceled: false,
            isOffline: false,
            cacheTime: request.cacheTime,
            clearKey: request.client.cache.clearKey,
            garbageCollection: Infinity,
          });
        });

        expect(deepCompare).toBeCalled();
        expect(result.current[0].data).toBeTrue();
      });
    });
    describe("when deepCompare is false", () => {
      it("should not compare values", async () => {
        const { result } = renderUseTrackedState(request, { deepCompare: false, dependencyTracking: true });

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: true,
            error: null,
            status: 200,
            isSuccess: true,
            additionalData: xhrAdditionalData,
            retries: 0,
            timestamp: null,
            isCanceled: false,
            isOffline: false,
            cacheTime: request.cacheTime,
            clearKey: request.client.cache.clearKey,
            garbageCollection: Infinity,
          });
        });

        expect(result.current[0].data).toBeTrue();
      });
    });
  });
});
