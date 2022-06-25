import { getErrorMessage } from "@better-typed/hyper-fetch";
import { act } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState } from "../../shared";
import { builder, createCommand, renderUseSubmit } from "../../utils";

describe("useSubmit [ Cancel ]", () => {
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

  describe("when aborting request", () => {
    it("should allow to cancel the ongoing request", async () => {
      createRequestInterceptor(command);
      const response = renderUseSubmit(command);

      act(() => {
        response.result.current.onSubmitRequestStart(() => {
          response.result.current.abort();
        });
        response.result.current.submit();
      });

      await testErrorState(getErrorMessage("abort"), response);
    });
  });
});
