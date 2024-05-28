import { waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Bounce ]", () => {
  const hookDebounceOptions = { bounce: true, bounceType: "debounce", bounceTime: 50 } as const;
  const hookThrottleOptions = { bounce: true, bounceType: "throttle", bounceTime: 50 } as const;
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
    client.clear();
  });

  describe("given debounce is active", () => {
    describe("when request is about to change", () => {
      it("should not debounce initial request", async () => {
        const spy = jest.fn();
        createRequestInterceptor(request);
        const response = renderUseFetch(request, hookDebounceOptions);

        act(() => {
          response.result.current.onRequestStart(spy);
        });

        await waitForRender(0);
        expect(spy).toHaveBeenCalledTimes(1);
      });
      it("should debounce multiple request triggers by 100ms", async () => {
        const spy = jest.fn();
        createRequestInterceptor(request, { delay: 0 });
        const response = renderUseFetch(request, { ...hookDebounceOptions, dependencies: [{ test: 10 }] });

        act(() => {
          response.result.current.onRequestStart(spy);
        });

        const rerender = () => {
          response.rerender({ dependencies: [{ test: Math.random() }] });
        };

        await waitForRender();

        expect(spy).toHaveBeenCalledTimes(1);

        act(() => {
          rerender();
        });
        await waitForRender();

        act(() => {
          rerender();
        });
        await waitForRender();

        await waitFor(() => {
          expect(spy).toHaveBeenCalledTimes(2);
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
          expect(spy).toHaveBeenCalledTimes(3);
        });
      });
    });

    describe("given throttle is active", () => {
      describe("when request is about to change", () => {
        it("should not throttle initial request", async () => {
          const spy = jest.fn();
          createRequestInterceptor(request);
          const response = renderUseFetch(request, hookThrottleOptions);

          act(() => {
            response.result.current.onRequestStart(spy);
          });

          await waitForRender(0);
          expect(spy).toHaveBeenCalledTimes(1);
        });
        it("should throttle multiple request triggers by 100ms", async () => {
          const spy = jest.fn();
          createRequestInterceptor(request, { delay: 0 });
          const response = renderUseFetch(request, { ...hookThrottleOptions, dependencies: [{ test: 10 }] });

          act(() => {
            response.result.current.onRequestStart(spy);
          });

          const rerender = () => {
            response.rerender({ dependencies: [{ test: Math.random() }] });
          };

          await waitForRender();

          expect(spy).toHaveBeenCalledTimes(1);

          act(() => {
            rerender();
          });
          await waitForRender();

          act(() => {
            rerender();
          });
          await waitForRender();

          await waitFor(() => {
            expect(spy).toHaveBeenCalledTimes(2);
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
            expect(spy).toHaveBeenCalledTimes(3);
          });
        });
      });
    });
  });
});
