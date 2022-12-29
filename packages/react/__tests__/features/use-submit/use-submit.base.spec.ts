import { act, waitFor } from "@testing-library/react";

import { client, createRequest, renderUseSubmit, waitForRender } from "../../utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testInitialState, testSuccessState } from "../../shared";

describe("useSubmit [ Base ]", () => {
  let request = createRequest<any, null>({ method: "POST" });

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
    client.clear();
    request = createRequest({ method: "POST" });
  });

  describe("when submit method gets triggered", () => {
    it("should not trigger request on mount", async () => {
      createRequestInterceptor(request);
      const response = renderUseSubmit(request);

      await waitForRender(100);
      await testInitialState(response);
    });
    it("should trigger request with submit method", async () => {
      const mock = createRequestInterceptor(request);
      const response = renderUseSubmit(request);

      act(() => {
        response.result.current.submit();
      });

      await testSuccessState(mock, response);
    });
    it("should listen to the data of last submitted request", async () => {
      let count = 0;
      let shouldThrow = false;
      createRequestInterceptor(request, { fixture: count });
      const response = renderUseSubmit(request.setRetry(1).setRetryTime(100));

      act(() => {
        response.result.current.onSubmitRequestStart(() => {
          count += 1;
          createRequestInterceptor(request, { fixture: count });
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
