import { act, waitFor } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import {
  addQueueElement,
  client,
  createRequest,
  emitDownloadProgress,
  emitUploadProgress,
  renderUseQueue,
  sleep,
  waitForRender,
} from "../../utils";

describe("useQueue [ Actions ]", () => {
  let request = createRequest({ method: "POST" });

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
    request = createRequest({ method: "POST" });
    client.clear();
  });

  describe("given queue is running", () => {
    describe("when stop gets triggered", () => {
      it("should change stopped value", async () => {
        const { result } = renderUseQueue(request);
        act(() => {
          result.current.stop();
        });
        await waitFor(() => {
          expect(result.current.stopped).toBeTrue();
        });
      });
    });
    describe("when pause gets triggered", () => {
      it("should change stopped value", async () => {
        const { result } = renderUseQueue(request);
        act(() => {
          result.current.pause();
        });
        await waitFor(() => {
          expect(result.current.stopped).toBeTrue();
        });
      });
    });
    describe("when stopping request", () => {
      it("should cancel request and mark it as stopped", async () => {
        createRequestInterceptor(request);
        addQueueElement(request, { stop: true });
        const { result } = renderUseQueue(request);

        act(() => {
          result.current.requests[0].stopRequest();
        });

        await waitFor(() => {
          expect(result.current.requests[0].stopped).toBeTrue();
        });
      });
    });
    describe("when deleting request", () => {
      it("should remove request from array", async () => {
        createRequestInterceptor(request);
        addQueueElement(request, { stop: true });
        const { result } = renderUseQueue(request);

        act(() => {
          result.current.requests[0].deleteRequest();
        });

        await waitFor(() => {
          expect(result.current.requests[0]).toBeUndefined();
        });
      });
    });
  });

  describe("given queue is stopped", () => {
    describe("when start gets triggered", () => {
      it("should change start status", async () => {
        const { result } = renderUseQueue(request);
        act(() => {
          result.current.stop();
        });
        await waitForRender();
        act(() => {
          result.current.start();
        });

        expect(result.current.stopped).toBeFalse();
      });
    });
    describe("when starting request", () => {
      it("should allow to change request stopped status", async () => {
        createRequestInterceptor(request);
        addQueueElement(request, { stop: true });
        const { result } = renderUseQueue(request);

        act(() => {
          result.current.requests[0].stopRequest();
        });
        await waitForRender();
        act(() => {
          result.current.requests[0].startRequest();
        });

        await waitFor(() => {
          expect(result.current.requests[0].stopped).toBeFalse();
        });
      });
    });
  });

  describe("given queue is getting progress updates", () => {
    describe("when upload progress get received", () => {
      it("should update request upload progress state", async () => {
        let timestamp = 0;
        createRequestInterceptor(request);
        addQueueElement(request, { stop: true });
        const { result } = renderUseQueue(request);
        expect(result.current.requests[0].uploading).toBeUndefined();
        act(() => {
          timestamp = +emitUploadProgress(result.current.requests[0].requestId, request)[0];
        });
        await waitFor(() => {
          expect(result.current.requests[0].uploading).toStrictEqual({
            loaded: 25,
            progress: 50,
            sizeLeft: 25,
            startTimestamp: +timestamp,
            timeLeft: 20000,
            total: 50,
          });
        });
      });
      it("should not throw when emitting wrong requestId", async () => {
        createRequestInterceptor(request);
        addQueueElement(request, { stop: true });
        const { result } = renderUseQueue(request);
        expect(result.current.requests[0].downloading).toBeUndefined();
        act(() => {
          emitUploadProgress("wrong", request);
        });
        await sleep(5);
        expect(result.current.requests[0].downloading).toBeUndefined();
      });
    });
    describe("when download progress get received", () => {
      it("should update request download progress state", async () => {
        let timestamp = 0;
        createRequestInterceptor(request);
        addQueueElement(request, { stop: true });
        const { result } = renderUseQueue(request);
        expect(result.current.requests[0].downloading).toBeUndefined();
        act(() => {
          timestamp = +emitDownloadProgress(result.current.requests[0].requestId, request)[0];
        });
        await waitFor(() => {
          expect(result.current.requests[0].downloading).toStrictEqual({
            loaded: 25,
            progress: 50,
            sizeLeft: 25,
            startTimestamp: +timestamp,
            timeLeft: 20000,
            total: 50,
          });
        });
      });
      it("should not throw when emitting wrong requestId", async () => {
        createRequestInterceptor(request);
        addQueueElement(request, { stop: true });
        const { result } = renderUseQueue(request);
        expect(result.current.requests[0].downloading).toBeUndefined();
        act(() => {
          emitDownloadProgress("wrong", request);
        });
        await sleep(5);
        expect(result.current.requests[0].downloading).toBeUndefined();
      });
    });
  });
});
