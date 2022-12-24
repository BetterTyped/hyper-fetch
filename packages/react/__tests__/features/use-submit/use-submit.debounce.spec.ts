import { CommandInstance, ExtractClientReturnType } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand, renderUseSubmit, waitForRender } from "../../utils";

describe("useSubmit [ Bounce ]", () => {
  const hookDebounceOptions = { bounce: true, bounceType: "debounce", bounceTime: 50 } as const;
  const hookThrottleOptions = { bounce: true, bounceType: "throttle", bounceTime: 50 } as const;

  let command = createCommand<null, null>({ method: "POST" });

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
    builder.clear();
    command = createCommand({ method: "POST" });
  });

  describe("given debounce is active", () => {
    describe("when command is about to change", () => {
      it("should debounce single request", async () => {
        let submitTime = null;
        let startTime = null;
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, hookDebounceOptions);

        act(() => {
          response.result.current.onSubmitRequestStart(() => {
            startTime = +new Date();
          });
          submitTime = +new Date();
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(startTime).not.toBeNull();
        });

        expect(startTime - submitTime).toBeGreaterThanOrEqual(hookDebounceOptions.bounceTime);
      });
      it("should debounce multiple request triggers by bounceTime", async () => {
        const spy = jest.fn();
        let submitTime = null;
        let startTime = null;
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, hookDebounceOptions);

        await act(async () => {
          response.result.current.onSubmitRequestStart(() => {
            spy();
            startTime = +new Date();
          });
          submitTime = +new Date();
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(startTime).not.toBeNull();
        });

        expect(startTime - submitTime).toBeGreaterThanOrEqual(hookDebounceOptions.bounceTime);
        expect(spy).toBeCalledTimes(1);
      });
      it("should resolve debounced methods", async () => {
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, hookDebounceOptions);

        let value: ExtractClientReturnType<CommandInstance>[] = [];
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
        const isResponse = (res: ExtractClientReturnType<CommandInstance>) => {
          return !!res[0] && !res[1] && res[2] === 200;
        };
        expect(value).toSatisfyAny(isResponse);
        expect(value).toHaveLength(4);
      });
      it("should change debounce time", async () => {
        const newBounceTime = 200;
        const spy = jest.fn();
        let submitTime = null;
        let startTime = null;
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, hookDebounceOptions);

        await act(async () => {
          await response.rerender({ bounceTime: newBounceTime });
        });

        await waitForRender(1);

        await act(async () => {
          response.result.current.onSubmitRequestStart(() => {
            spy();
            startTime = +new Date();
          });
          submitTime = +new Date();
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(startTime).not.toBeNull();
        });

        expect(startTime - submitTime).toBeGreaterThanOrEqual(newBounceTime);
        expect(spy).toBeCalledTimes(1);
      });
    });
  });

  describe("given debounce is off", () => {
    describe("when command is about to change", () => {
      it("should not debounce multiple request triggers", async () => {
        const spy = jest.fn();
        let startTime = null;
        createRequestInterceptor(command, { delay: 0 });
        const response = renderUseSubmit(command);

        await act(async () => {
          response.result.current.onSubmitRequestStart(() => {
            spy();
            startTime = +new Date();
          });
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(startTime).not.toBeNull();
        });

        expect(spy).toBeCalledTimes(4);
      });
    });
  });

  describe("given throttle is active", () => {
    describe("when command is about to change", () => {
      it("should throttle single request", async () => {
        let submitTime = null;
        let startTime = null;
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, hookThrottleOptions);

        act(() => {
          response.result.current.onSubmitRequestStart(() => {
            startTime = +new Date();
          });
          submitTime = +new Date();
          response.result.current.submit();
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(startTime).not.toBeNull();
          expect(startTime - submitTime).toBeGreaterThanOrEqual(hookThrottleOptions.bounceTime);
        });
      });
      it("should throttle multiple request triggers by bounceTime", async () => {
        const spy = jest.fn();
        let submitTime = null;
        let startTime = null;
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, hookThrottleOptions);

        await act(async () => {
          response.result.current.onSubmitRequestStart(() => {
            spy();
            startTime = +new Date();
          });
          submitTime = +new Date();
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(startTime).not.toBeNull();
          expect(startTime - submitTime).toBeGreaterThanOrEqual(hookThrottleOptions.bounceTime);
          expect(spy).toBeCalledTimes(2);
        });
      });
      it("should resolve throttled methods", async () => {
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, hookThrottleOptions);

        let value: ExtractClientReturnType<CommandInstance>[] = [];
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
        const isResponse = (res: ExtractClientReturnType<CommandInstance>) => {
          return !!res[0] && !res[1] && res[2] === 200;
        };
        expect(value).toSatisfyAny(isResponse);
        expect(value).toHaveLength(4);
      });
      it("should change throttle time", async () => {
        const newBounceTime = 200;
        const spy = jest.fn();
        let submitTime = null;
        let startTime = null;
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, hookThrottleOptions);

        await act(async () => {
          await response.rerender({ bounceTime: newBounceTime });
        });

        await waitForRender(1);

        await act(async () => {
          response.result.current.onSubmitRequestStart(() => {
            spy();
            startTime = +new Date();
          });
          submitTime = +new Date();
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(startTime).not.toBeNull();
          expect(startTime - submitTime).toBeGreaterThanOrEqual(newBounceTime);
          expect(spy).toBeCalledTimes(2);
        });
      });
    });
  });

  describe("given throttle is off", () => {
    describe("when command is about to change", () => {
      it("should not throttle multiple request triggers", async () => {
        const spy = jest.fn();
        let startTime = null;
        createRequestInterceptor(command, { delay: 0 });
        const response = renderUseSubmit(command);

        await act(async () => {
          response.result.current.onSubmitRequestStart(() => {
            spy();
            startTime = +new Date();
          });
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
          await waitForRender(10);
          response.result.current.submit();
        });

        await waitFor(() => {
          expect(startTime).not.toBeNull();
        });

        expect(spy).toBeCalledTimes(4);
      });
    });
  });
});
