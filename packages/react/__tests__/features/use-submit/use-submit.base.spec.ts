import { act, waitFor } from "@testing-library/react";

import { builder, createCommand, renderUseSubmit, waitForRender } from "../../utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testInitialState, testSuccessState } from "../../shared";

describe("useSubmit [ Base ]", () => {
  let command = createCommand<any, null>({ method: "POST" });

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

  describe("when submit method gets triggered", () => {
    it("should not trigger request on mount", async () => {
      createRequestInterceptor(command);
      const response = renderUseSubmit(command);

      await waitForRender(100);
      await testInitialState(response);
    });
    it("should trigger request with submit method", async () => {
      const mock = createRequestInterceptor(command);
      const response = renderUseSubmit(command);

      act(() => {
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
    });
    it("should listen to the data of last submitted request", async () => {
      let count = 0;
      let shouldThrow = false;
      createRequestInterceptor(command, { fixture: count });
      const response = renderUseSubmit(command.setRetry(1).setRetryTime(100));

      act(() => {
        response.result.current.onSubmitRequestStart(() => {
          count += 1;
          createRequestInterceptor(command, { fixture: count });
        });
        response.result.current.submit();
        response.result.current.submit();
        response.result.current.submit();
        response.result.current.submit();
      });

      await waitFor(() => {
        expect(shouldThrow).toBeFalse();
        const { data } = response.result.current;
        if (data && data !== 4) {
          shouldThrow = true;
        }

        expect(data).toBe(4);
      });
    });
  });
});
