import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act } from "@testing-library/react";

import { client, createRequest, renderUseFetch } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

/**
 * Bouncing is decided by elapsed time, so these specs run on a fake clock. With real timers a stall between two
 * triggers moves them into separate bounce windows and the request count changes.
 */
describe("useFetch [ Bounce ]", () => {
  const hookDebounceOptions = { bounce: true, bounceType: "debounce", bounceTime: 50 } as const;
  const hookThrottleOptions = { bounce: true, bounceType: "throttle", bounceTime: 50, bounceTimeout: 100 } as const;
  const mockDelay = 5;
  let request = createRequest();

  const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

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
    request = createRequest();
    client.clear();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  });

  const renderWithDependencies = (options: typeof hookDebounceOptions | typeof hookThrottleOptions) => {
    const spy = vi.fn();
    mockRequest(request, { delay: mockDelay });
    const response = renderUseFetch(request, { ...options, dependencies: [{ test: 10 }] });

    act(() => {
      response.result.current.onRequestStart(spy);
    });

    const trigger = () => {
      act(() => {
        response.rerender({ dependencies: [{ test: Math.random() }] });
      });
    };

    return { spy, trigger };
  };

  describe("given debounce is active", () => {
    describe("when request is about to change", () => {
      it("should not debounce initial request", async () => {
        const spy = vi.fn();
        mockRequest(request);
        const response = renderUseFetch(request, hookDebounceOptions);

        act(() => {
          response.result.current.onRequestStart(spy);
        });

        await advance(0);
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should debounce multiple request triggers by bounceTime", async () => {
        const { spy, trigger } = renderWithDependencies(hookDebounceOptions);

        await advance(0);
        expect(spy).toHaveBeenCalledTimes(1);
        await advance(mockDelay);

        trigger();
        await advance(10);
        trigger();
        await advance(hookDebounceOptions.bounceTime - 1);
        expect(spy).toHaveBeenCalledTimes(1);

        await advance(1);
        expect(spy).toHaveBeenCalledTimes(2);

        trigger();
        await advance(10);
        trigger();
        await advance(hookDebounceOptions.bounceTime - 1);
        expect(spy).toHaveBeenCalledTimes(2);

        await advance(1);
        expect(spy).toHaveBeenCalledTimes(3);

        await advance(1000);
        expect(spy).toHaveBeenCalledTimes(3);
      });
    });

    describe("given throttle is active", () => {
      describe("when request is about to change", () => {
        it("should not throttle initial request", async () => {
          const spy = vi.fn();
          mockRequest(request);
          const response = renderUseFetch(request, hookThrottleOptions);

          act(() => {
            response.result.current.onRequestStart(spy);
          });

          await advance(0);
          expect(spy).toHaveBeenCalledTimes(1);
        });
        it("should throttle multiple request triggers by bounceTime", async () => {
          const { spy, trigger } = renderWithDependencies(hookThrottleOptions);

          await advance(0);
          expect(spy).toHaveBeenCalledTimes(1);
          await advance(mockDelay);

          // Nothing was throttled yet, so the first change fetches right away
          trigger();
          await advance(0);
          expect(spy).toHaveBeenCalledTimes(2);

          // Changes inside the interval are held back and only the last one is sent after the timeout
          await advance(10);
          trigger();
          await advance(10);
          trigger();
          await advance(hookThrottleOptions.bounceTimeout - 1);
          expect(spy).toHaveBeenCalledTimes(2);

          await advance(1);
          expect(spy).toHaveBeenCalledTimes(3);

          await advance(1000);
          expect(spy).toHaveBeenCalledTimes(3);
        });
      });
    });
  });
});
