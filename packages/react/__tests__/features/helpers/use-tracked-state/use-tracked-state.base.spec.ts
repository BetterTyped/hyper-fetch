import { xhrExtra } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { initialState } from "helpers";
import { createRequest, renderUseTrackedState } from "../../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useTrackingState [ Events ]", () => {
  let request = createRequest();

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
    jest.resetModules();
    request = createRequest();
  });

  describe("given state is initialized", () => {
    describe("when cache is empty", () => {
      it("should init with default data", async () => {
        const { result } = renderUseTrackedState(request);

        expect(result.current[0].data).toBe(initialState.data);
        expect(result.current[0].error).toBe(initialState.error);
        expect(result.current[0].status).toBe(initialState.status);
        expect(result.current[0].success).toBe(initialState.success);
        expect(result.current[0].extra).toStrictEqual(request.client.defaultExtra);
        expect(result.current[0].retries).toBe(0);
        expect(result.current[0].loading).toBe(initialState.loading);
      });
    });
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
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(result.current[0].data).toBe("new-data");
        expect(result.current[0].error).toBe(null);
      });

      it("should map the cache data", async () => {
        mockRequest(request);

        await act(async () => {
          await request.send({});
        });

        const { result, rerender } = renderUseTrackedState(
          request.setResponseMapper((response) => {
            return { ...response, data: "new-data" };
          }),
        );

        act(() => {
          rerender();
        });

        expect(result.current[0].data).toBe("new-data");
        expect(result.current[0].error).toBe(null);
      });

      it("should map the async data", async () => {
        const { result } = renderUseTrackedState(
          request.setResponseMapper(async (response) => {
            return Promise.resolve({ ...response, data: "new-data" });
          }),
        );

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: true as any,
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(result.current).toPartiallyContain(initialState);

        await waitFor(() => {
          expect(result.current[0].data).toBe("new-data");
          expect(result.current[0].error).toBe(null);
        });
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
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(deepCompare).toHaveBeenCalled();
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
            success: true,
            extra: xhrExtra,
            retries: 0,
            requestTimestamp: +new Date(),
            responseTimestamp: +new Date(),
            addedTimestamp: +new Date(),
            triggerTimestamp: +new Date(),
            cacheKey: request.cacheKey,
            isCanceled: false,
            isOffline: false,
            staleTime: request.staleTime,
            version: request.client.cache.version,
            cacheTime: Infinity,
          });
        });

        expect(result.current[0].data).toBeTrue();
      });
    });
  });
});
