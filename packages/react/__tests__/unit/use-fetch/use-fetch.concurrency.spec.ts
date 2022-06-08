import { act } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testSuccessState } from "../../shared";
import { builder, createCommand, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Concurrency ]", () => {
  let command = createCommand();

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
    command = createCommand();
    await builder.clear();
  });

  describe("given multiple rendered hooks", () => {
    describe("when used the same non-dedupe commands", () => {
      it("should allow to trigger request for each hook", async () => {
        const spyOne = jest.fn();
        const spyTwo = jest.fn();

        const mock = createRequestInterceptor(command);
        const responseOne = renderUseFetch(command.setQueueKey("1"));
        const responseTwo = renderUseFetch(command.setQueueKey("2"));

        act(() => {
          responseOne.result.current.onRequestStart(spyOne);
          responseTwo.result.current.onRequestStart(spyTwo);
        });

        await waitForRender();
        await testSuccessState(mock, responseOne);
        await testSuccessState(mock, responseTwo);

        expect(spyOne).toBeCalledTimes(1);
        expect(spyTwo).toBeCalledTimes(1);
      });
      it("should start in loading mode when request is already handled by the queue", async () => {
        createRequestInterceptor(command);
        act(() => {
          builder.fetchDispatcher.add(command);
        });
        const { result } = renderUseFetch(command);
        expect(result.current.loading).toBeTrue();
        await waitForRender();
        expect(result.current.loading).toBeTrue();
      });
      it("should not start in loading mode when request in queue is paused", async () => {
        act(() => {
          const queueElement = builder.fetchDispatcher.createStorageElement(command);
          builder.fetchDispatcher.addQueueElement(command.queueKey, queueElement);
          builder.fetchDispatcher.stopRequest(command.queueKey, queueElement.requestId);
        });
        createRequestInterceptor(command);
        const { result } = renderUseFetch(command);
        expect(result.current.loading).toBeFalse();
        await waitForRender();
        expect(result.current.loading).toBeFalse();
      });
      it("should not start in loading mode when queue is paused", async () => {
        act(() => {
          const queueElement = builder.fetchDispatcher.createStorageElement(command);
          builder.fetchDispatcher.addQueueElement(command.queueKey, queueElement);
          builder.fetchDispatcher.stop(command.queueKey);
        });
        createRequestInterceptor(command);
        const { result } = renderUseFetch(command);
        expect(result.current.loading).toBeFalse();
        await waitForRender();
        expect(result.current.loading).toBeFalse();
      });
    });
  });
});
