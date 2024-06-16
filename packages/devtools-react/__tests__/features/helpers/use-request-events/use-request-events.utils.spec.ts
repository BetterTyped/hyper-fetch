import { act } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { createRequest, renderUseRequestEvents } from "../../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useRequestEvents [ Utils ]", () => {
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

  describe("When handling lifecycle events", () => {
    it("should not throw when removing non existing event", async () => {
      const response = renderUseRequestEvents(request);

      expect(response.result.current[1].removeLifecycleListener).not.toThrow();
    });
    it("should unmount lifecycle events when handling requests by queue/cache keys", async () => {
      const spy = jest.fn();
      mockRequest(request);
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
      mockRequest(request);
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
