import type { RequestInstance, ExtractAdapterResolvedType } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, waitFor } from "@testing-library/react";

import { client, createRequest, renderUseSubmit, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Bounce ]", () => {
  const hookDebounceOptions = { bounce: true, bounceType: "debounce", bounceTime: 50 } as const;
  const hookThrottleOptions = { bounce: true, bounceType: "throttle", bounceTime: 50, bounceTimeout: 50 } as const;

  let request = createRequest<null, null>({ method: "POST" });

  /**
   * Bouncing is decided by elapsed time, so the timing specs run on a fake clock. With real timers a stall between two
   * submits moves them into separate bounce windows and the request count changes.
   */
  const useFakeClock = () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  };
  const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

  /**
   * Submits four times, 10ms apart, all inside one bounce window
   */
  const submitFourTimes = async (submit: () => unknown) => {
    act(() => {
      submit();
    });
    await advance(10);
    act(() => {
      submit();
    });
    await advance(10);
    act(() => {
      submit();
    });
    await advance(10);
    act(() => {
      submit();
    });
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

  describe("given debounce is active", () => {
    describe("when request is about to change", () => {
      it("should debounce single request", async () => {
        useFakeClock();
        const spy = vi.fn();
        mockRequest(request);
        const response = renderUseSubmit(request, hookDebounceOptions);

        act(() => {
          response.result.current.onSubmitRequestStart(spy);
          response.result.current.submit();
        });

        await advance(hookDebounceOptions.bounceTime - 1);
        expect(spy).not.toHaveBeenCalled();

        await advance(1);
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should debounce multiple request triggers by bounceTime", async () => {
        useFakeClock();
        const spy = vi.fn();
        mockRequest(request);
        const response = renderUseSubmit(request, hookDebounceOptions);

        act(() => {
          response.result.current.onSubmitRequestStart(spy);
        });
        await submitFourTimes(response.result.current.submit);

        // The window restarts with every submit, so it closes bounceTime after the last one
        await advance(hookDebounceOptions.bounceTime - 1);
        expect(spy).not.toHaveBeenCalled();

        await advance(1);
        expect(spy).toHaveBeenCalledTimes(1);

        await advance(1000);
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should resolve debounced methods", async () => {
        mockRequest(request);
        const response = renderUseSubmit(request, hookDebounceOptions);

        let value: ExtractAdapterResolvedType<RequestInstance>[] = [];
        await act(async () => {
          const promiseOne = await response.result.current.submit();
          await waitForRender(1);
          const promiseTwo = await response.result.current.submit();
          await waitForRender(1);
          const promiseThree = await response.result.current.submit();
          await waitForRender(1);
          const promiseFour = await response.result.current.submit();

          value = [promiseOne, promiseTwo, promiseThree, promiseFour];
        });

        expect(value).toHaveLength(4);
        const isResponse = (res: ExtractAdapterResolvedType<RequestInstance>) => {
          return Boolean(!!res.data && !res.error && res.status === 200 && res.extra);
        };
        expect(value).toSatisfyAny(isResponse);
        expect(value).toHaveLength(4);
      });
      it("should change debounce time", async () => {
        useFakeClock();
        const newBounceTime = 200;
        const spy = vi.fn();
        mockRequest(request);
        const response = renderUseSubmit(request, hookDebounceOptions);

        act(() => {
          response.rerender({ bounceTime: newBounceTime });
        });
        act(() => {
          response.result.current.onSubmitRequestStart(spy);
        });
        await submitFourTimes(response.result.current.submit);

        await advance(newBounceTime - 1);
        expect(spy).not.toHaveBeenCalled();

        await advance(1);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("given debounce is off", () => {
    describe("when request is about to change", () => {
      it("should not debounce multiple request triggers", async () => {
        const spy = vi.fn();
        mockRequest(request, { delay: 0 });
        const response = renderUseSubmit(request);

        await act(async () => {
          response.result.current.onSubmitRequestStart(spy);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(spy).toHaveBeenCalledTimes(4);
        });
      });
    });
  });

  describe("given throttle is active", () => {
    describe("when request is about to change", () => {
      it("should throttle single request", async () => {
        useFakeClock();
        const spy = vi.fn();
        mockRequest(request);
        const response = renderUseSubmit(request, hookThrottleOptions);

        act(() => {
          response.result.current.onSubmitRequestStart(spy);
          response.result.current.submit();
          response.result.current.submit();
        });

        // Nothing was throttled yet, so the first submit is sent right away and the second waits for the timeout
        await advance(0);
        expect(spy).toHaveBeenCalledTimes(1);

        await advance(hookThrottleOptions.bounceTimeout - 1);
        expect(spy).toHaveBeenCalledTimes(1);

        await advance(1);
        expect(spy).toHaveBeenCalledTimes(2);
      });
      it("should throttle multiple request triggers by bounceTime", async () => {
        useFakeClock();
        const spy = vi.fn();
        mockRequest(request);
        const response = renderUseSubmit(request, hookThrottleOptions);

        act(() => {
          response.result.current.onSubmitRequestStart(spy);
        });
        await submitFourTimes(response.result.current.submit);
        expect(spy).toHaveBeenCalledTimes(1);

        // Only the last throttled submit is sent, bounceTimeout after it
        await advance(hookThrottleOptions.bounceTimeout - 1);
        expect(spy).toHaveBeenCalledTimes(1);

        await advance(1);
        expect(spy).toHaveBeenCalledTimes(2);

        await advance(1000);
        expect(spy).toHaveBeenCalledTimes(2);
      });
      it("should resolve throttled methods", async () => {
        mockRequest(request);
        const response = renderUseSubmit(request, hookThrottleOptions);

        let value: ExtractAdapterResolvedType<RequestInstance>[] = [];
        await act(async () => {
          const promiseOne = await response.result.current.submit();
          await waitForRender(1);
          const promiseTwo = await response.result.current.submit();
          await waitForRender(1);
          const promiseThree = await response.result.current.submit();
          await waitForRender(1);
          const promiseFour = await response.result.current.submit();

          value = [promiseOne, promiseTwo, promiseThree, promiseFour];
        });

        expect(value).toHaveLength(4);
        const isResponse = (res: ExtractAdapterResolvedType<RequestInstance>) => {
          return !!res.data && !res.error && res.status === 200 && !!res.extra;
        };
        expect(value).toSatisfyAny(isResponse);
        expect(value).toHaveLength(4);
      });
      it("should change throttle time", async () => {
        useFakeClock();
        const newBounceTime = 200;
        const spy = vi.fn();
        mockRequest(request);
        const response = renderUseSubmit(request, hookThrottleOptions);

        act(() => {
          response.rerender({ bounceTime: newBounceTime, bounceTimeout: newBounceTime });
        });
        act(() => {
          response.result.current.onSubmitRequestStart(spy);
        });
        await submitFourTimes(response.result.current.submit);
        expect(spy).toHaveBeenCalledTimes(1);

        await advance(newBounceTime - 1);
        expect(spy).toHaveBeenCalledTimes(1);

        await advance(1);
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("given throttle is off", () => {
    describe("when request is about to change", () => {
      it("should not throttle multiple request triggers", async () => {
        const spy = vi.fn();
        mockRequest(request, { delay: 0 });
        const response = renderUseSubmit(request);

        await act(async () => {
          response.result.current.onSubmitRequestStart(spy);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(spy).toHaveBeenCalledTimes(4);
        });
      });
    });
  });
});
