import { RequestInstance, ExtractAdapterResolvedType } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { client, createRequest, renderUseSubmit, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Bounce ]", () => {
  const hookDebounceOptions = { bounce: true, bounceType: "debounce", bounceTime: 50 } as const;
  const hookThrottleOptions = { bounce: true, bounceType: "throttle", bounceTime: 50, bounceTimeout: 50 } as const;

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

  describe("given debounce is active", () => {
    describe("when request is about to change", () => {
      it("should debounce single request", async () => {
        let submitTime: number | null = null;
        let startTime: number | null = null;
        mockRequest(request);
        const response = renderUseSubmit(request, hookDebounceOptions);

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

        expect((startTime || 0) - (submitTime || 0)).toBeGreaterThanOrEqual(hookDebounceOptions.bounceTime);
      });
      it("should debounce multiple request triggers by bounceTime", async () => {
        const spy = jest.fn();
        let submitTime: number | null = null;
        let startTime: number | null = null;
        mockRequest(request);
        const response = renderUseSubmit(request, hookDebounceOptions);

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

        expect((startTime || 0) - (submitTime || 0)).toBeGreaterThanOrEqual(hookDebounceOptions.bounceTime);
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
        const newBounceTime = 200;
        const spy = jest.fn();
        let submitTime: number | null = null;
        let startTime: number | null = null;
        mockRequest(request);
        const response = renderUseSubmit(request, hookDebounceOptions);

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

        expect((startTime || 0) - (submitTime || 0)).toBeGreaterThanOrEqual(newBounceTime);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("given debounce is off", () => {
    describe("when request is about to change", () => {
      it("should not debounce multiple request triggers", async () => {
        const spy = jest.fn();
        let startTime: number | null = null;
        mockRequest(request, { delay: 0 });
        const response = renderUseSubmit(request);

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

        expect(spy).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe("given throttle is active", () => {
    describe("when request is about to change", () => {
      it("should throttle single request", async () => {
        let submitTime: number | null = null;
        let startTime: number | null = null;
        mockRequest(request);
        const response = renderUseSubmit(request, hookThrottleOptions);

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
          expect((startTime || 0) - (submitTime || 0)).toBeGreaterThanOrEqual(hookThrottleOptions.bounceTime);
        });
      });
      it("should throttle multiple request triggers by bounceTime", async () => {
        const spy = jest.fn();
        let submitTime: number | null = null;
        let startTime: number | null = null;
        mockRequest(request);
        const response = renderUseSubmit(request, hookThrottleOptions);

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
          expect((startTime || 0) - (submitTime || 0)).toBeGreaterThanOrEqual(hookThrottleOptions.bounceTime);
          expect(spy).toHaveBeenCalledTimes(2);
        });
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
        const newBounceTime = 200;
        const spy = jest.fn();
        let submitTime: number | null = null;
        let startTime: number | null = null;
        mockRequest(request);
        const response = renderUseSubmit(request, hookThrottleOptions);

        await act(async () => {
          await response.rerender({ bounceTime: newBounceTime, bounceTimeout: newBounceTime });
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
          expect((startTime || 0) - (submitTime || 0)).toBeGreaterThanOrEqual(newBounceTime);
          expect(spy).toHaveBeenCalledTimes(2);
        });
      });
    });
  });

  describe("given throttle is off", () => {
    describe("when request is about to change", () => {
      it("should not throttle multiple request triggers", async () => {
        const spy = jest.fn();
        let startTime: number | null = null;
        mockRequest(request, { delay: 0 });
        const response = renderUseSubmit(request);

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

        expect(spy).toHaveBeenCalledTimes(4);
      });
    });
  });
});
