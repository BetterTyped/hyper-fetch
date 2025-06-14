import { getErrorMessage } from "@hyper-fetch/core";
import { act } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testErrorState } from "../../shared";
import { client, createRequest, renderUseSubmit } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Cancel ]", () => {
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

  describe("when aborting request", () => {
    it("should allow to cancel the ongoing request", async () => {
      mockRequest(request);
      const response = renderUseSubmit(request);

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
