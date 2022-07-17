import { CommandInstance, ExtractClientReturnType } from "@better-typed/hyper-fetch";
import { act, waitFor } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand, renderUseSubmit, waitForRender } from "../../utils";

describe("useSubmit [ Debounce ]", () => {
  const options = { debounce: true, debounceTime: 50 };
  const maxDelay = 20;

  let command = createCommand({ method: "POST" });

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
        const response = renderUseSubmit(command, options);

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

        expect(startTime - submitTime).toBeGreaterThanOrEqual(options.debounceTime);
        expect(startTime - submitTime).toBeLessThan(options.debounceTime + maxDelay);
      });
      it("should debounce multiple request triggers by debounceTime", async () => {
        const spy = jest.fn();
        let submitTime = null;
        let startTime = null;
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, options);

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

        expect(startTime - submitTime).toBeGreaterThanOrEqual(options.debounceTime + 30);
        expect(startTime - submitTime).toBeLessThan(options.debounceTime + maxDelay + 30);
        expect(spy).toBeCalledTimes(1);
      });
      it("should resolve debounced methods", async () => {
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, options);

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
        const newDebounceTime = 200;
        const spy = jest.fn();
        let submitTime = null;
        let startTime = null;
        createRequestInterceptor(command);
        const response = renderUseSubmit(command, options);

        await act(async () => {
          await response.rerender({ debounceTime: newDebounceTime });
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

        expect(startTime - submitTime).toBeGreaterThanOrEqual(newDebounceTime + 30);
        expect(startTime - submitTime).toBeLessThan(newDebounceTime + maxDelay + 30);
        expect(spy).toBeCalledTimes(1);
      });
    });
  });

  describe("given debounce is off", () => {
    describe("when command is about to change", () => {
      it("should not debounce multiple request triggers", async () => {
        const spy = jest.fn();
        let submitTime = null;
        let startTime = null;
        createRequestInterceptor(command, { delay: 0 });
        const response = renderUseSubmit(command);

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

        expect(startTime - submitTime).toBeLessThan(options.debounceTime + 30);
        expect(spy).toBeCalledTimes(4);
      });
    });
  });
});
