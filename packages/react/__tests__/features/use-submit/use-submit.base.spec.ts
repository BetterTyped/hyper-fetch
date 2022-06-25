import { act } from "@testing-library/react";

import { builder, createCommand, renderUseSubmit, waitForRender } from "../../utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testInitialState, testSuccessState } from "../../shared";

describe("useSubmit [ Base ]", () => {
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
  });
});
