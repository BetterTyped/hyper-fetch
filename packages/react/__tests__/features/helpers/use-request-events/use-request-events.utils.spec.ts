import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../../server";
import { createRequest, renderUseRequestEvents } from "../../../utils";

describe("useRequestEvents [ Utils ]", () => {
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

  describe("When handling lifecycle events", () => {
    it("should not throw when removing non existing event", async () => {
      const response = renderUseRequestEvents(request);

      expect(response.result.current[1].removeLifecycleListener).not.toThrow();
    });
    it("should unmount lifecycle events when handling requests by queue/cache keys", async () => {
      const spy = jest.fn();
      createRequestInterceptor(request);
      const response = renderUseRequestEvents(request);

      await act(async () => {
        response.result.current[0].onRequestStart(spy);
        response.result.current[1].addLifecycleListeners(request);
        response.result.current[1].addLifecycleListeners(request);
        response.result.current[1].addLifecycleListeners(request);

        await request.send({});
      });

      expect(spy).toBeCalledTimes(1);
    });
    it("should listen to every request id events", async () => {
      const spy = jest.fn();
      createRequestInterceptor(request);
      const response = renderUseRequestEvents(request);

      await act(async () => {
        await request.send({
          onSettle: (requestId) => {
            response.result.current[0].onRequestStart(spy);
            response.result.current[1].addLifecycleListeners(request, requestId);
            response.result.current[1].addLifecycleListeners(request, requestId);
            response.result.current[1].addLifecycleListeners(request, requestId);
          },
        });
      });

      expect(spy).toBeCalledTimes(3);
    });
  });
});
