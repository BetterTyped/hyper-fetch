import { waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Bounce ]", () => {
  const hookDebounceOptions = { bounce: true, bounceType: "debounce", bounceTime: 50 } as const;
  const hookThrottleOptions = { bounce: true, bounceType: "throttle", bounceTime: 50 } as const;
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
    client.clear();
  });

  describe("given debounce is active", () => {
    describe("when request is about to change", () => {
      it("should not debounce initial request", async () => {
        const spy = jest.fn();
        mockRequest(request);
        const response = renderUseFetch(request, hookDebounceOptions);

        act(() => {
          response.result.current.onRequestStart(spy);
        });

        await waitForRender(0);
        expect(spy).toBeCalledTimes(1);
      });
      it("should debounce multiple request triggers by 100ms", async () => {
        const spy = jest.fn();
        mockRequest(request, { delay: 0 });
        const response = renderUseFetch(request, { ...hookDebounceOptions, dependencies: [{ test: 10 }] });

        act(() => {
          response.result.current.onRequestStart(spy);
        });

        const rerender = () => {
          response.rerender({ dependencies: [{ test: Math.random() }] });
        };

        await waitForRender();

        expect(spy).toBeCalledTimes(1);

        act(() => {
          rerender();
        });
        await waitForRender();

        act(() => {
          rerender();
        });
        await waitForRender();

        await waitFor(() => {
          expect(spy).toBeCalledTimes(2);
        });

        act(() => {
          rerender();
        });
        await waitForRender();

        act(() => {
          rerender();
        });
        await waitForRender();

        await waitFor(() => {
          expect(spy).toBeCalledTimes(3);
        });
      });
    });

    describe("given throttle is active", () => {
      describe("when request is about to change", () => {
        it("should not throttle initial request", async () => {
          const spy = jest.fn();
          mockRequest(request);
          const response = renderUseFetch(request, hookThrottleOptions);

          act(() => {
            response.result.current.onRequestStart(spy);
          });

          await waitForRender(0);
          expect(spy).toBeCalledTimes(1);
        });
        it("should throttle multiple request triggers by 100ms", async () => {
          const spy = jest.fn();
          mockRequest(request, { delay: 0 });
          const response = renderUseFetch(request, { ...hookThrottleOptions, dependencies: [{ test: 10 }] });

          act(() => {
            response.result.current.onRequestStart(spy);
          });

          const rerender = () => {
            response.rerender({ dependencies: [{ test: Math.random() }] });
          };

          await waitForRender();

          expect(spy).toBeCalledTimes(1);

          act(() => {
            rerender();
          });
          await waitForRender();

          act(() => {
            rerender();
          });
          await waitForRender();

          await waitFor(() => {
            expect(spy).toBeCalledTimes(2);
          });

          act(() => {
            rerender();
          });
          await waitForRender();

          act(() => {
            rerender();
          });
          await waitForRender();

          await waitFor(() => {
            expect(spy).toBeCalledTimes(3);
          });
        });
      });
    });
  });
});
