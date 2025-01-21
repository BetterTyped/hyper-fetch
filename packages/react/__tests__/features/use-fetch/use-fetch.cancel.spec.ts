import { getErrorMessage } from "@hyper-fetch/core";
import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testErrorState } from "../../shared";
import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Cancel ]", () => {
  let request = createRequest({ cacheKey: "test", queryKey: "testQueue", cancelable: true });

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
    request = createRequest({ cacheKey: "test", queryKey: "testQueue", cancelable: true });
    client.clear();
  });

  describe("given request is cancelable", () => {
    describe("when aborting request", () => {
      it("should allow to cancel the ongoing request", async () => {
        mockRequest(request, { delay: 40 });
        const response = renderUseFetch(request);

        await waitForRender();

        act(() => {
          response.result.current.abort();
        });

        await testErrorState(getErrorMessage("abort"), response);
      });

      it("should allow to cancel deduplicated request", async () => {
        mockRequest(request, { delay: 100 });
        const response = renderUseFetch(request);
        await waitForRender();
        const dedupeResponse = renderUseFetch(request);
        await waitForRender();

        await act(() => {
          dedupeResponse.result.current.abort();
        });

        await testErrorState(getErrorMessage("abort"), response);
        await testErrorState(getErrorMessage("abort"), dedupeResponse);
      });
      it("should cancel previous requests when dependencies change", async () => {
        const spy = jest.fn();

        mockRequest(request, { delay: 50 });
        const response = renderUseFetch(request, { dependencies: [{}] });
        await waitForRender(1);

        act(() => {
          const params = { page: 1 };
          response.result.current.onAbort(spy);
          response.rerender({ request, dependencies: [params] });
        });
        await waitForRender();

        await waitFor(() => {
          expect(spy).toHaveBeenCalledTimes(1);
        });
      });
    });
    it("should clear request from dispatcher's queue on abort", async () => {
      // TODO
    });
  });
});
