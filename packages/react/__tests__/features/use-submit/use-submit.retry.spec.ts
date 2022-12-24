import { act, waitFor } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand, renderUseSubmit, waitForRender } from "../../utils";

describe("useSubmit [ Retry ]", () => {
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

  describe("when command retry attribute is set to false", () => {
    it("should not retry request on failure", async () => {
      const spy = jest.fn();
      createRequestInterceptor(command, { status: 400, delay: 5 });
      const response = renderUseSubmit(command.setRetry(0).setRetryTime(0));

      act(() => {
        response.result.current.onSubmitRequestStart(spy);
        response.result.current.submit();
      });

      await waitForRender(150);

      expect(spy).toBeCalledTimes(1);
    });
  });
  describe("when command retry attribute is set to true", () => {
    it("should retry request once", async () => {
      const spy = jest.fn();
      createRequestInterceptor(command, { status: 400, delay: 5 });
      const response = renderUseSubmit(command.setRetry(1).setRetryTime(10));

      act(() => {
        response.result.current.onSubmitRequestStart(spy);
        response.result.current.submit();
      });

      await waitForRender(150);

      expect(spy).toBeCalledTimes(2);
    });
    it("should retry request twice", async () => {
      const spy = jest.fn();
      createRequestInterceptor(command, { status: 400, delay: 5 });
      const response = renderUseSubmit(command.setRetry(2).setRetryTime(10));

      act(() => {
        response.result.current.onSubmitRequestStart(spy);
        response.result.current.submit();
      });

      await waitForRender(150);

      expect(spy).toBeCalledTimes(3);
    });
    it("should trigger retries with the config interval", async () => {
      const time: number[] = [];
      createRequestInterceptor(command, { status: 400, delay: 0 });
      const response = renderUseSubmit(command.setRetry(1).setRetryTime(100));

      act(() => {
        response.result.current.onSubmitRequestStart(() => {
          time.push(+new Date());
        });
        response.result.current.submit();
      });

      await waitFor(() => {
        expect(time[1] - time[0]).toBeLessThan(120);
        expect(time[1] - time[0]).toBeGreaterThan(99);
      });
    });
  });
});
