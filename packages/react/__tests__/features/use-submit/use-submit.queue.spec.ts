import { act } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testData, testLoading } from "../../shared";
import { client, createRequest, renderUseSubmit, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useSubmit [ Queue ]", () => {
  let request = createRequest<any, null>({ method: "POST", queued: true });

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
    request = createRequest({ method: "POST", queued: true });
  });

  describe("given request is able to be queued", () => {
    describe("when submitting request", () => {
      it("should send requests one by one", async () => {
        let count = 1;
        const spy = jest.fn();
        mockRequest(request, { data: count });
        const response = renderUseSubmit(request);

        act(() => {
          response.result.current.onSubmitFinished(() => {
            spy();
            count += 1;
            mockRequest(request, { data: count, delay: 50 });
          });
          response.result.current.submit();
          response.result.current.submit();
          response.result.current.submit();
          response.result.current.submit();
        });

        await testData(1, response);
        await testData(2, response);
        await testData(3, response);
        await testData(4, response);

        expect(spy).toBeCalledTimes(4);
      });
      it("should start in loading mode when request in queue is ongoing", async () => {
        mockRequest(request);
        const previouslyRenderedHook = renderUseSubmit(request);

        act(() => {
          previouslyRenderedHook.result.current.submit();
        });

        await waitForRender();
        const response = renderUseSubmit(request);
        await testLoading(true, response);
      });
      it("should not start in loading mode when queue is paused", async () => {
        mockRequest(request);
        const previouslyRenderedHook = renderUseSubmit(request);

        act(() => {
          previouslyRenderedHook.result.current.submit();
          client.submitDispatcher.stop(request.queryKey);
        });

        await waitForRender();
        const response = renderUseSubmit(request);
        await testLoading(false, response);
      });
    });
  });
});
