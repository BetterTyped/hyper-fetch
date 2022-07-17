import { act } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer } from "../../../server";
import { createCommand, renderUseTrackedState } from "../../../utils";

describe("useTrackingState [ Events ]", () => {
  let command = createCommand();

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
    command = createCommand();
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
  describe("given custom deepCompare option is passed", () => {
    describe("when deepCompare is function", () => {
      it("should trigger with two values", async () => {
        // Todo
      });
      it("should allow to use custom deepCompare", async () => {
        const deepCompare = jest.fn().mockImplementation(() => false);
        const { result } = renderUseTrackedState(command, { deepCompare, dependencyTracking: true });

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: [true, null, 200],
            details: {
              retries: 0,
              timestamp: +new Date(),
              isFailed: false,
              isCanceled: false,
              isOffline: false,
            },
            cacheTime: command.cacheTime,
            clearKey: command.builder.cache.clearKey,
          });
        });

        expect(deepCompare).toBeCalled();
        expect(result.current[0].data).toBeTrue();
      });
    });
    describe("when deepCompare is false", () => {
      it("should not compare values", async () => {
        const { result } = renderUseTrackedState(command, { deepCompare: false, dependencyTracking: true });

        act(() => {
          result.current[2].setRenderKey("data");
          result.current[2].setCacheData({
            data: [true, null, 200],
            details: {
              retries: 0,
              timestamp: null,
              isFailed: false,
              isCanceled: false,
              isOffline: false,
            },
            cacheTime: command.cacheTime,
            clearKey: command.builder.cache.clearKey,
          });
        });

        expect(result.current[0].data).toBeTrue();
      });
    });
  });
});
