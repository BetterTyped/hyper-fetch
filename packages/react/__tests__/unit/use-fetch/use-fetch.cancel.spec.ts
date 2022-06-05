import { getErrorMessage } from "@better-typed/hyper-fetch";
import { act } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState } from "../../shared";
import { builder, createCommand, renderUseFetch, waitForRender } from "../../utils";

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

  beforeEach(async () => {
    jest.resetModules();
    command = createCommand({ cancelable: true, deduplicate: true });
    await builder.clear();
  });

  describe("given command is cancelable", () => {
    describe("when aborting request", () => {
      it("should allow to cancel the ongoing request", async () => {
        createRequestInterceptor(command);
        const response = renderUseFetch(command);

        await waitForRender();
        await act(() => {
          response.result.current.abort();
        });
        await testErrorState(getErrorMessage("abort"), response);
      });
      // it("should allow to cancel deduplicated request", async () => {
      //   createRequestInterceptor(command);
      //   const response = renderUseFetch(command);
      //   await waitForRender();
      //   const dedupeResponse = renderUseFetch(command);
      //   await waitForRender();

      //   await act(() => {
      //     dedupeResponse.result.current.abort();
      //   });

      //   await testErrorState(getErrorMessage("abort"), response);
      //   await testErrorState(getErrorMessage("abort"), dedupeResponse);
      // });
      // it("should cancel previous requests when dependencies change", async () => {
      //   const params: Record<string, string> = { page: "1" };
      //   const dependencies = [params];
      //   const spy = jest.fn();
      //   let cmd: CommandInstance = command;

      //   createRequestInterceptor(cmd);
      //   const response = renderUseFetch(cmd, { dependencies });
      //   await waitForRender();

      //   response.result.current.onAbort(spy);

      //   act(() => {
      //     params.page = "2";
      //     cmd = cmd.setQueryParams(params);
      //     response.rerender();
      //   });

      //   await waitFor(() => {
      //     expect(spy).toBeCalledTimes(1);
      //   });
      // });
    });
  });
});
