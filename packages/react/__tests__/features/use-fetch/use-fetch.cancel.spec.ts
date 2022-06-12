import { getErrorMessage } from "@better-typed/hyper-fetch";
import { act, waitFor } from "@testing-library/react";

import { testErrorState } from "../../shared";
import { builder, createCommand, renderUseFetch, waitForRender } from "../../utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";

describe("useFetch [ Cancel ]", () => {
  let command = createCommand({ cancelable: true, deduplicate: true });

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
    command = createCommand({ cancelable: true, deduplicate: true });
    builder.clear();
  });

  describe("given command is cancelable", () => {
    describe("when aborting request", () => {
      // it("should allow to cancel the ongoing request", async () => {
      //   createRequestInterceptor(command);
      //   const response = renderUseFetch(command);

      //   await waitForRender();
      //   await act(() => {
      //     response.result.current.abort();
      //   });
      //   await testErrorState(getErrorMessage("abort"), response);
      // });

      it("should allow to cancel deduplicated request", async () => {
        createRequestInterceptor(command, { delay: 100 });
        const response = renderUseFetch(command);
        await waitForRender();
        const dedupeResponse = renderUseFetch(command);
        await waitForRender();

        await act(() => {
          dedupeResponse.result.current.abort();
        });

        await testErrorState(getErrorMessage("abort"), response);
        await testErrorState(getErrorMessage("abort"), dedupeResponse);
      });
      it("should cancel previous requests when dependencies change", async () => {
        const spy = jest.fn();

        createRequestInterceptor(command);
        const response = renderUseFetch(command, { dependencies: [{}] });
        await waitForRender();

        act(() => {
          const params = { page: 1 };
          response.result.current.onAbort(spy);
          response.rerender({ command: command.setQueryParams(params), dependencies: [params] });
        });

        await waitFor(() => {
          expect(spy).toBeCalledTimes(1);
        });
      });
    });
    describe("when aborting previous request", () => {
      it("should not trigger the canceled request helper hooks", async () => {
        // TODO
      });
    });
  });
});
