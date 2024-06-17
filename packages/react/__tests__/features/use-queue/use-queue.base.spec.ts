import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { addQueueElement, client, createRequest, renderUseQueue } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useQueue [ Base ]", () => {
  let request = createRequest({ method: "POST" });

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

  describe("given hook is mounting", () => {
    describe("when queue is processing requests", () => {
      it("should initialize with all processed requests", async () => {
        mockRequest(request);
        addQueueElement(request, { stop: true });
        const { result } = renderUseQueue(request);
        expect(result.current.requests).toHaveLength(1);
      });
      it("should remove finished requests from queue", async () => {
        mockRequest(request);
        addQueueElement(request);
        const { result } = renderUseQueue(request);
        await waitFor(() => {
          expect(result.current.requests).toHaveLength(0);
        });
      });
    });
  });
  describe("given queue is empty", () => {
    describe("when request is added to queue", () => {
      it("should update the requests values", async () => {
        mockRequest(request);
        let requestId = "";
        const progress = {
          total: 200,
          loaded: 100,
          progress: 0.5,
          timeLeft: 2000,
          sizeLeft: 100,
          startTimestamp: +new Date(),
        };
        const { result } = renderUseQueue(request);
        act(() => {
          requestId = addQueueElement(request, { stop: true });
        });
        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });
        act(() => {
          client.requestManager.events.emitDownloadProgress({
            progress,
            requestId,
            request,
          });
        });
        await waitFor(() => {
          expect(result.current.requests[0].downloading).toBe(progress);
        });
      });
      it("should update upload progress of requests", async () => {
        mockRequest(request);
        let requestId = "";
        const progress = {
          total: 200,
          loaded: 100,
          progress: 0.5,
          timeLeft: 2000,
          sizeLeft: 100,
          startTimestamp: +new Date(),
        };
        const { result } = renderUseQueue(request);
        act(() => {
          requestId = addQueueElement(request, { stop: true });
        });
        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });
        act(() => {
          client.requestManager.events.emitUploadProgress({
            progress,
            requestId,
            request,
          });
        });
        await waitFor(() => {
          expect(result.current.requests[0].uploading).toBe(progress);
        });
      });
    });
  });
});
