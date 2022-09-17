import { waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Bounce ]", () => {
  const hookDebounceOptions = { bounce: true, bounceType: "debounce", bounceTime: 50 } as const;
  const hookThrottleOptions = { bounce: true, bounceType: "throttle", bounceTime: 50 } as const;
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
    builder.clear();
  });

  describe("given debounce is active", () => {
    describe("when command is about to change", () => {
      it("should not debounce initial request", async () => {
        const spy = jest.fn();
        createRequestInterceptor(command);
        const response = renderUseFetch(command, hookDebounceOptions);

        act(() => {
          response.result.current.onRequestStart(spy);
        });

        await waitForRender(0);
        expect(spy).toBeCalledTimes(1);
      });
      it("should debounce multiple request triggers by 100ms", async () => {
        const spy = jest.fn();
        createRequestInterceptor(command, { delay: 0 });
        const response = renderUseFetch(command, { ...hookDebounceOptions, dependencies: [{ test: 10 }] });

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
        await waitForRender(10);

        await waitFor(() => {
          expect(spy).toBeCalledTimes(3);
        });
      });
    });

    describe("given throttle is active", () => {
      describe("when command is about to change", () => {
        it("should not throttle initial request", async () => {
          const spy = jest.fn();
          createRequestInterceptor(command);
          const response = renderUseFetch(command, hookThrottleOptions);

          act(() => {
            response.result.current.onRequestStart(spy);
          });

          await waitForRender(0);
          expect(spy).toBeCalledTimes(1);
        });
        it("should throttle multiple request triggers by 100ms", async () => {
          const spy = jest.fn();
          createRequestInterceptor(command, { delay: 0 });
          const response = renderUseFetch(command, { ...hookThrottleOptions, dependencies: [{ test: 10 }] });

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
          await waitForRender(10);

          await waitFor(() => {
            expect(spy).toBeCalledTimes(3);
          });
        });
      });
    });
  });
});
