import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testData, testLoading } from "../../shared";
import { builder, createCommand, renderUseSubmit, waitForRender } from "../../utils";

describe("useSubmit [ Queue ]", () => {
  let command = createCommand({ method: "POST", queued: true });

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
    command = createCommand({ method: "POST", queued: true });
  });

  describe("given command is able to be queued", () => {
    describe("when submitting command", () => {
      it("should send requests one by one", async () => {
        let count = 1;
        const spy = jest.fn();
        createRequestInterceptor(command, { fixture: count });
        const response = renderUseSubmit(command);

        act(() => {
          response.result.current.onSubmitFinished(() => {
            spy();
            count += 1;
            createRequestInterceptor(command, { fixture: count, delay: 50 });
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
        createRequestInterceptor(command);
        const previouslyRenderedHook = renderUseSubmit(command);

        act(() => {
          previouslyRenderedHook.result.current.submit();
        });

        await waitForRender();
        const response = renderUseSubmit(command);
        await testLoading(true, response);
      });
      it("should not start in loading mode when queue is paused", async () => {
        createRequestInterceptor(command);
        const previouslyRenderedHook = renderUseSubmit(command);

        act(() => {
          previouslyRenderedHook.result.current.submit();
          builder.submitDispatcher.stop(command.queueKey);
        });

        await waitForRender();
        const response = renderUseSubmit(command);
        await testLoading(false, response);
      });
    });
  });
});
