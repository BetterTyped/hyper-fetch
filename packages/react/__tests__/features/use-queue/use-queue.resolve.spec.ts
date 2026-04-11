import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { getRequestDispatcher, scopeKey } from "@hyper-fetch/core";

import { addQueueElement, client, createRequest, renderUseQueue } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useQueue [ Resolve Queue Items ]", () => {
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

  describe("given queue event contains class instances", () => {
    describe("when the queue change event fires", () => {
      it("should pass them through without transformation", async () => {
        mockRequest(request);
        const { result } = renderUseQueue(request);

        act(() => {
          addQueueElement(request, { stop: true });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
          expect(result.current.requests[0].request).toBe(request);
        });
      });
    });
  });

  describe("given queue event contains JSON-serialized requests", () => {
    describe("when the queue change event fires", () => {
      it("should reconstruct JSON items into Request class instances", async () => {
        mockRequest(request);
        const [dispatcher] = getRequestDispatcher(request, "auto");
        const queryKey = scopeKey(request.queryKey, request.scope);

        dispatcher.stop(queryKey);
        const { result } = renderUseQueue(request);

        const json = request.toJSON();

        act(() => {
          dispatcher.events.emitQueueChanged({
            queryKey,
            stopped: true,
            requests: [
              {
                requestId: "json-request-1",
                request: json as any,
                retries: 0,
                timestamp: +new Date(),
                stopped: false,
                resolved: false,
              },
            ],
          });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
          expect(result.current.requests[0].requestId).toBe("json-request-1");
          expect(result.current.requests[0].request).not.toBe(json);
          expect(result.current.requests[0].request.endpoint).toBe(request.endpoint);
          expect(result.current.requests[0].request.method).toBe(request.method);
        });
      });

      it("should reconstruct JSON items from status change events", async () => {
        mockRequest(request);
        const [dispatcher] = getRequestDispatcher(request, "auto");
        const queryKey = scopeKey(request.queryKey, request.scope);

        dispatcher.stop(queryKey);
        const { result } = renderUseQueue(request);

        const json = request.toJSON();

        act(() => {
          dispatcher.events.emitQueueStatusChanged({
            queryKey,
            stopped: false,
            requests: [
              {
                requestId: "json-status-1",
                request: json as any,
                retries: 0,
                timestamp: +new Date(),
                stopped: false,
                resolved: false,
              },
            ],
          });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
          expect(result.current.requests[0].requestId).toBe("json-status-1");
          expect(result.current.requests[0].request.endpoint).toBe(request.endpoint);
        });
      });
    });
  });

  describe("given queue event contains a mix of class instances and JSON", () => {
    describe("when the queue change event fires", () => {
      it("should resolve JSON items while keeping class instances intact", async () => {
        mockRequest(request);
        const [dispatcher] = getRequestDispatcher(request, "auto");
        const queryKey = scopeKey(request.queryKey, request.scope);

        dispatcher.stop(queryKey);
        const { result } = renderUseQueue(request);

        const json = request.toJSON();

        act(() => {
          dispatcher.events.emitQueueChanged({
            queryKey,
            stopped: true,
            requests: [
              {
                requestId: "class-instance-1",
                request,
                retries: 0,
                timestamp: +new Date(),
                stopped: false,
                resolved: false,
              },
              {
                requestId: "json-item-1",
                request: json as any,
                retries: 0,
                timestamp: +new Date(),
                stopped: false,
                resolved: false,
              },
            ],
          });
        });

        await waitFor(() => {
          expect(result.current.requests).toHaveLength(2);

          const classItem = result.current.requests.find((r: any) => r.requestId === "class-instance-1");
          const jsonItem = result.current.requests.find((r: any) => r.requestId === "json-item-1");

          expect(classItem?.request).toBe(request);
          expect(jsonItem?.request).not.toBe(json);
          expect(jsonItem?.request.endpoint).toBe(request.endpoint);
          expect(jsonItem?.request.method).toBe(request.method);
        });
      });
    });
  });
});
