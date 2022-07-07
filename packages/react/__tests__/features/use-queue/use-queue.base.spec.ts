import { act, waitFor } from "@testing-library/react";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { addQueueElement, builder, createCommand, renderUseQueue } from "../../utils";

describe("useQueue [ Base ]", () => {
  let command = createCommand({ method: "POST" });

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
    command = createCommand({ method: "POST" });
  });

  describe("given hook is mounting", () => {
    describe("when queue is processing requests", () => {
      it("should initialize with all processed requests", async () => {
        createRequestInterceptor(command);
        addQueueElement(command, { stop: true });
        const { result } = renderUseQueue(command);
        expect(result.current.requests).toHaveLength(1);
      });
      it("should remove finished requests from queue", async () => {
        createRequestInterceptor(command);
        addQueueElement(command);
        const { result } = renderUseQueue(command);
        await waitFor(() => {
          expect(result.current.requests).toHaveLength(0);
        });
      });
    });
  });
  describe("given queue is empty", () => {
    describe("when command is added to queue", () => {
      it("should update the requests values", async () => {
        createRequestInterceptor(command);
        let requestId = "";
        const progress = {
          total: 200,
          loaded: 100,
          progress: 0.5,
          timeLeft: 2000,
          sizeLeft: 100,
          startTimestamp: +new Date(),
        };
        const { result } = renderUseQueue(command);
        act(() => {
          requestId = addQueueElement(command, { stop: true });
        });
        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });
        act(() => {
          builder.commandManager.events.emitDownloadProgress(command.queueKey, requestId, progress, {
            requestId,
            command,
          });
        });
        await waitFor(() => {
          expect(result.current.requests[0].downloading).toBe(progress);
        });
      });
      it("should update upload progress of requests", async () => {
        createRequestInterceptor(command);
        let requestId = "";
        const progress = {
          total: 200,
          loaded: 100,
          progress: 0.5,
          timeLeft: 2000,
          sizeLeft: 100,
          startTimestamp: +new Date(),
        };
        const { result } = renderUseQueue(command);
        act(() => {
          requestId = addQueueElement(command, { stop: true });
        });
        await waitFor(() => {
          expect(result.current.requests).toHaveLength(1);
        });
        act(() => {
          builder.commandManager.events.emitUploadProgress(command.queueKey, requestId, progress, {
            requestId,
            command,
          });
        });
        await waitFor(() => {
          expect(result.current.requests[0].uploading).toBe(progress);
        });
      });
    });
  });
});
