import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, waitFor } from "@testing-library/react";

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
    vi.resetModules();
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
          startTimestamp: Date.now(),
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
            ...progress,
            requestId,
            request,
          });
        });
        await waitFor(() => {
          expect(result.current.requests[0].downloading).toStrictEqual(progress);
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
          startTimestamp: Date.now(),
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
            ...progress,
            requestId,
            request,
          });
        });
        await waitFor(() => {
          expect(result.current.requests[0].uploading).toStrictEqual(progress);
        });
      });
    });
  });
  describe("given keepFinishedRequests is true", () => {
    describe("when requests finish", () => {
      it("should keep finished requests in the list", async () => {
        mockRequest(request);
        addQueueElement(request, { stop: true });
        const { result } = renderUseQueue(request, { keepFinishedRequests: true });

        expect(result.current.requests).toHaveLength(1);

        addQueueElement(request, { stop: true });

        await waitFor(() => {
          expect(result.current.requests.length).toBeGreaterThanOrEqual(1);
        });
      });
    });
  });
  describe("given queue events fire", () => {
    describe("when a request succeeds", () => {
      it("should mark the request as success", async () => {
        mockRequest(request);
        let requestId = "";
        const { result } = renderUseQueue(request);

        act(() => {
          requestId = addQueueElement(request, { stop: true });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });

        act(() => {
          client.requestManager.events.emitResponse({
            requestId,
            response: {
              data: "ok",
              error: null,
              status: 200,
              success: true,
              extra: {},
              responseTimestamp: Date.now(),
              requestTimestamp: Date.now(),
            },
            request,
          } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.success).toBe(true);
        });
      });
    });
    describe("when a request fails", () => {
      it("should mark the request as failed", async () => {
        mockRequest(request);
        let requestId = "";
        const { result } = renderUseQueue(request);

        act(() => {
          requestId = addQueueElement(request, { stop: true });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });

        act(() => {
          client.requestManager.events.emitResponse({
            requestId,
            response: {
              data: null,
              error: { message: "fail" },
              status: 500,
              success: false,
              extra: {},
              responseTimestamp: Date.now(),
              requestTimestamp: Date.now(),
            },
            request,
          } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.failed).toBe(true);
        });
      });
    });
    describe("when a request is aborted", () => {
      it("should mark the request as canceled", async () => {
        mockRequest(request);
        let requestId = "";
        const { result } = renderUseQueue(request);

        act(() => {
          requestId = addQueueElement(request, { stop: true });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });

        act(() => {
          client.requestManager.events.emitAbort({ requestId, request } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.canceled).toBe(true);
        });
      });
    });
    describe("when a request is removed", () => {
      it("should mark the request as removed", async () => {
        mockRequest(request);
        let requestId = "";
        const { result } = renderUseQueue(request);

        act(() => {
          requestId = addQueueElement(request, { stop: true });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });

        act(() => {
          client.requestManager.events.emitRemove({ requestId, request } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.removed).toBe(true);
        });
      });

      it("should not mark non-matching requests when event fires", async () => {
        mockRequest(request);
        let requestId = "";
        const { result } = renderUseQueue(request);

        act(() => {
          requestId = addQueueElement(request, { stop: true });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });

        act(() => {
          client.requestManager.events.emitResponse({
            requestId: "non-matching-id",
            response: {
              data: null,
              error: { message: "fail" },
              status: 500,
              success: false,
              extra: {},
              responseTimestamp: Date.now(),
              requestTimestamp: Date.now(),
            },
            request,
          } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.failed).toBe(false);
          expect(req?.success).toBe(false);
        });

        act(() => {
          client.requestManager.events.emitResponse({
            requestId: "non-matching-id-2",
            response: {
              data: "ok",
              error: null,
              status: 200,
              success: true,
              extra: {},
              responseTimestamp: Date.now(),
              requestTimestamp: Date.now(),
            },
            request,
          } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.success).toBe(false);
        });

        act(() => {
          client.requestManager.events.emitAbort({ requestId: "non-matching-id-3", request } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.canceled).toBe(false);
        });

        act(() => {
          client.requestManager.events.emitRemove({ requestId: "non-matching-id-4", request } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.removed).toBe(false);
        });
      });

      it("should not mark as removed if already succeeded", async () => {
        mockRequest(request);
        let requestId = "";
        const { result } = renderUseQueue(request);

        act(() => {
          requestId = addQueueElement(request, { stop: true });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });

        act(() => {
          client.requestManager.events.emitResponse({
            requestId,
            response: {
              data: "ok",
              error: null,
              status: 200,
              success: true,
              extra: {},
              responseTimestamp: Date.now(),
              requestTimestamp: Date.now(),
            },
            request,
          } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.success).toBe(true);
        });

        act(() => {
          client.requestManager.events.emitRemove({ requestId, request } as any);
        });

        await waitFor(() => {
          const req = result.current.requests.find((r: any) => r.requestId === requestId);
          expect(req?.removed).toBe(false);
        });
      });
    });
  });
});
