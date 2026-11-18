import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, waitFor } from "@testing-library/react";

import { client, createRequest, renderUseSubmit } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Retry ]", () => {
  let request = createRequest<{ response: null; payload: null }>({ method: "POST" });

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
    vi.resetModules();
    client.clear();
    request = createRequest({ method: "POST" });
  });

  describe("when request retry attribute is set to false", () => {
    it("should not retry request on failure", async () => {
      const spy = vi.fn();
      mockRequest(request, { status: 400, delay: 5 });
      const response = renderUseSubmit(request.setRetry(0).setRetryTime(0));

      act(() => {
        response.result.current.onSubmitRequestStart(spy);
        response.result.current.submit();
      });

      // Wait for the outcome instead of a fixed time - once the request left the queue, no retry can follow
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  describe("when request retry attribute is set to true", () => {
    it("should retry request once", async () => {
      const spy = vi.fn();
      mockRequest(request, { status: 400, delay: 5 });
      const response = renderUseSubmit(request.setRetry(1).setRetryTime(10));

      act(() => {
        response.result.current.onSubmitRequestStart(spy);
        response.result.current.submit();
      });

      // Wait for the outcome instead of a fixed time - the retries can take longer on a busy machine
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
      });
      await waitFor(() => {
        expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });

      expect(spy).toHaveBeenCalledTimes(2);
    });
    it("should retry request twice", async () => {
      const spy = vi.fn();
      mockRequest(request, { status: 400, delay: 5 });
      const response = renderUseSubmit(request.setRetry(2).setRetryTime(10));

      act(() => {
        response.result.current.onSubmitRequestStart(spy);
        response.result.current.submit();
      });

      // Wait for the outcome instead of a fixed time - the retries can take longer on a busy machine
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(3);
      });
      await waitFor(() => {
        expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      });

      expect(spy).toHaveBeenCalledTimes(3);
    });
    it("should trigger retries with the config interval", async () => {
      const time: number[] = [];
      mockRequest(request, { status: 400, delay: 0 });
      const response = renderUseSubmit(request.setRetry(1).setRetryTime(100));

      act(() => {
        response.result.current.onSubmitRequestStart(() => {
          time.push(Date.now());
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
