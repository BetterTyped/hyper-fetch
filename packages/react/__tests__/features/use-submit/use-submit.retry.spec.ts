import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { client, createRequest, renderUseSubmit, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Retry ]", () => {
  let request = createRequest<null, null>({ method: "POST" });

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
    client.clear();
    request = createRequest({ method: "POST" });
  });

  describe("when request retry attribute is set to false", () => {
    it("should not retry request on failure", async () => {
      const spy = jest.fn();
      mockRequest(request, { status: 400, delay: 5 });
      const response = renderUseSubmit(request.setRetry(0).setRetryTime(0));

      act(() => {
        response.result.current.onSubmitRequestStart(spy);
        response.result.current.submit();
      });

      await waitForRender(150);

      expect(spy).toBeCalledTimes(1);
    });
  });
  describe("when request retry attribute is set to true", () => {
    it("should retry request once", async () => {
      const spy = jest.fn();
      mockRequest(request, { status: 400, delay: 5 });
      const response = renderUseSubmit(request.setRetry(1).setRetryTime(10));

      act(() => {
        response.result.current.onSubmitRequestStart(spy);
        response.result.current.submit();
      });

      await waitForRender(150);

      expect(spy).toBeCalledTimes(2);
    });
    it("should retry request twice", async () => {
      const spy = jest.fn();
      mockRequest(request, { status: 400, delay: 5 });
      const response = renderUseSubmit(request.setRetry(2).setRetryTime(10));

      act(() => {
        response.result.current.onSubmitRequestStart(spy);
        response.result.current.submit();
      });

      await waitForRender(150);

      expect(spy).toBeCalledTimes(3);
    });
    it("should trigger retries with the config interval", async () => {
      const time: number[] = [];
      mockRequest(request, { status: 400, delay: 0 });
      const response = renderUseSubmit(request.setRetry(1).setRetryTime(100));

      act(() => {
        response.result.current.onSubmitRequestStart(() => {
          time.push(+new Date());
        });
        response.result.current.submit();
      });

      await waitFor(() => {
        expect(time[1] - time[0]);
        expect(time[1] - time[0]).toBeGreaterThan(99);
      });
    });
  });
});
