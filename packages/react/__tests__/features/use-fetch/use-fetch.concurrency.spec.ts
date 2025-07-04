import { act } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Concurrency ]", () => {
  let request = createRequest();

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
    request = createRequest();
    client.clear();
  });

  describe("given multiple rendered hooks", () => {
    describe("when used the same non-dedupe requests", () => {
      it("should allow to trigger request for each hook", async () => {
        const spyOne = jest.fn();
        const spyTwo = jest.fn();

        const mock = mockRequest(request);
        const responseOne = renderUseFetch(request.setQueryKey("1"));
        const responseTwo = renderUseFetch(request.setQueryKey("2"));

        act(() => {
          responseOne.result.current.onRequestStart(spyOne);
          responseTwo.result.current.onRequestStart(spyTwo);
        });

        await testSuccessState(mock, responseOne);
        await testSuccessState(mock, responseTwo);

        expect(spyOne).toHaveBeenCalledTimes(1);
        expect(spyTwo).toHaveBeenCalledTimes(1);
      });
      it("should start in loading mode when request is already handled by the queue", async () => {
        mockRequest(request);
        act(() => {
          client.fetchDispatcher.add(request);
        });
        const { result } = renderUseFetch(request);
        expect(result.current.loading).toBeTrue();
        await waitForRender();
        expect(result.current.loading).toBeTrue();
      });
      it("should not start in loading mode when queue is paused", async () => {
        act(() => {
          const queueElement = client.fetchDispatcher.createStorageItem(request);
          client.fetchDispatcher.addQueueItem(request.queryKey, queueElement);
          client.fetchDispatcher.stop(request.queryKey);
        });
        mockRequest(request);
        const { result } = renderUseFetch(request);
        expect(result.current.loading).toBeFalse();
        await waitForRender();
        expect(result.current.loading).toBeFalse();
      });
      it("should share data between hooks", async () => {
        const mock = mockRequest(request);
        const responseOne = renderUseFetch(request);
        await testSuccessState(mock, responseOne);

        const responseTwo = renderUseFetch(request, { revalidate: false });
        await testSuccessState(mock, responseTwo);
      });
      it("should share data with disabled hook", async () => {
        const mock = mockRequest(request);
        const responseOne = renderUseFetch(request);
        const responseTwo = renderUseFetch(request, { disabled: true });

        await testSuccessState(mock, responseOne);
        await testSuccessState(mock, responseTwo);
      });
    });
  });
});
