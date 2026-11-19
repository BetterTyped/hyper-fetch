import type { RequestInstance } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, waitFor } from "@testing-library/react";

import { client, createRequest, renderUseSubmit } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Retry ]", () => {
  let request = createRequest<{ response: null; payload: null }>({ method: "POST" });

  /**
   * Submits and resolves once the last attempt has responded, so the attempt count is final.
   * Waiting for a fixed time instead loses attempts on a slow machine.
   */
  const submitUntilSettled = async (retryRequest: RequestInstance) => {
    const onStart = vi.fn();
    const onFinished = vi.fn();
    const response = renderUseSubmit(retryRequest);

    act(() => {
      response.result.current.onSubmitRequestStart(onStart);
      response.result.current.onSubmitFinished(({ details }) => onFinished(details.willRetry));
      response.result.current.submit();
    });

    await waitFor(() => {
      expect(onFinished).toHaveBeenLastCalledWith(false);
    });

    return { onStart, onFinished };
  };

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    vi.useRealTimers();
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
      mockRequest(request, { status: 400, delay: 5 });

      const { onStart, onFinished } = await submitUntilSettled(request.setRetry(0).setRetryTime(0));

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onFinished).toHaveBeenCalledTimes(1);
    });
  });
  describe("when request retry attribute is set to true", () => {
    it("should retry request once", async () => {
      mockRequest(request, { status: 400, delay: 5 });

      const { onStart, onFinished } = await submitUntilSettled(request.setRetry(1).setRetryTime(10));

      expect(onStart).toHaveBeenCalledTimes(2);
      expect(onFinished.mock.calls).toStrictEqual([[true], [false]]);
    });
    it("should retry request twice", async () => {
      mockRequest(request, { status: 400, delay: 5 });

      const { onStart, onFinished } = await submitUntilSettled(request.setRetry(2).setRetryTime(10));

      expect(onStart).toHaveBeenCalledTimes(3);
      expect(onFinished.mock.calls).toStrictEqual([[true], [true], [false]]);
    });
    it("should trigger retries with the config interval", async () => {
      // Node can fire a real timer earlier than Date.now() says, so the interval is measured on a fake clock
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
      const retryTime = 100;
      const startTimes: number[] = [];
      const finishTimes: number[] = [];
      mockRequest(request, { status: 400, delay: 5 });
      const response = renderUseSubmit(request.setRetry(1).setRetryTime(retryTime));

      act(() => {
        response.result.current.onSubmitRequestStart(() => {
          startTimes.push(Date.now());
        });
        response.result.current.onSubmitFinished(() => {
          finishTimes.push(Date.now());
        });
        response.result.current.submit();
      });

      // vi.waitFor polls on real timers - the RTL waitFor would wait on the faked setTimeout forever
      await vi.waitFor(async () => {
        await act(() => vi.advanceTimersByTimeAsync(20));
        expect(startTimes).toHaveLength(2);
      });

      expect(startTimes[1] - finishTimes[0]).toBeGreaterThanOrEqual(retryTime);
    });
  });
});
