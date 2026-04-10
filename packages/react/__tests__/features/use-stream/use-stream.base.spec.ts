import { renderHook, act, waitFor } from "@testing-library/react";

import { useStream } from "hooks/use-stream";
import { client } from "../../utils";

const createStreamRequest = () => {
  return client.createRequest<{ response: any }>()({
    endpoint: "/stream-endpoint" as any,
    method: "GET",
  });
};

const createReadableStream = (chunks: string[]) => {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index += 1;
      } else {
        controller.close();
      }
    },
  });
};

const createFailingReadableStream = (errorMessage: string) => {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.error(new Error(errorMessage));
    },
  });
};

const renderUseStream = (request: any, options?: { autoStart?: boolean }) => {
  return renderHook(() => useStream(request, options));
};

describe("useStream [ Base ]", () => {
  let request = createStreamRequest();

  beforeEach(() => {
    jest.resetModules();
    client.clear();
    request = createStreamRequest();
  });

  describe("when hook is initialized", () => {
    it("should have initial state", () => {
      const { result } = renderUseStream(request);

      expect(result.current.text).toBe("");
      expect(result.current.chunks).toEqual([]);
      expect(result.current.streaming).toBe(false);
      expect(result.current.done).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.extra).toBe(null);
      expect(result.current.status).toBe(null);
      expect(typeof result.current.start).toBe("function");
      expect(typeof result.current.abort).toBe("function");
      expect(typeof result.current.reset).toBe("function");
    });
  });

  describe("when start is called with a ReadableStream response", () => {
    it("should stream text chunks and set done when complete", async () => {
      const chunks = ["Hello ", "World", "!"];
      const stream = createReadableStream(chunks);

      const sendMock = jest.fn().mockResolvedValue({
        data: stream,
        error: null,
        status: 200,
        extra: { headers: {} },
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({
          send: sendMock,
        }),
        client: request.client,
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest);

      await act(async () => {
        result.current.start();
      });

      await waitFor(() => {
        expect(result.current.done).toBe(true);
      });

      expect(result.current.text).toBe("Hello World!");
      expect(result.current.chunks).toHaveLength(3);
      expect(result.current.streaming).toBe(false);
      expect(result.current.status).toBe(200);
      expect(result.current.extra).toEqual({ headers: {} });
      expect(result.current.error).toBe(null);
    });

    it("should set streaming to true while consuming", async () => {
      let resolvePull: (() => void) | null = null;
      const pullPromise = new Promise<void>((r) => {
        resolvePull = r;
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          controller.enqueue(encoder.encode("data"));
          await pullPromise;
          controller.close();
        },
      });

      const sendMock = jest.fn().mockResolvedValue({
        data: stream,
        error: null,
        status: 200,
        extra: null,
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({ send: sendMock }),
        client: request.client,
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest);

      act(() => {
        result.current.start();
      });

      await waitFor(() => {
        expect(result.current.streaming).toBe(true);
      });

      await act(async () => {
        resolvePull!();
      });

      await waitFor(() => {
        expect(result.current.streaming).toBe(false);
        expect(result.current.done).toBe(true);
      });
    });
  });

  describe("when start is called and response has an error", () => {
    it("should set error state", async () => {
      const errorData = { message: "Server error" };

      const sendMock = jest.fn().mockResolvedValue({
        data: null,
        error: errorData,
        status: 500,
        extra: { headers: {} },
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({ send: sendMock }),
        client: request.client,
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest);

      await act(async () => {
        result.current.start();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(errorData);
      });

      expect(result.current.streaming).toBe(false);
      expect(result.current.status).toBe(500);
      expect(result.current.extra).toEqual({ headers: {} });
    });
  });

  describe("when response data is a plain string (non-stream fallback)", () => {
    it("should set text directly from the string data", async () => {
      const sendMock = jest.fn().mockResolvedValue({
        data: "plain text response",
        error: null,
        status: 200,
        extra: null,
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({ send: sendMock }),
        client: request.client,
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest);

      await act(async () => {
        result.current.start();
      });

      await waitFor(() => {
        expect(result.current.done).toBe(true);
      });

      expect(result.current.text).toBe("plain text response");
      expect(result.current.streaming).toBe(false);
    });
  });

  describe("when response data is a non-string value (JSON.stringify fallback)", () => {
    it("should JSON.stringify the data", async () => {
      const objectData = { key: "value", num: 42 };

      const sendMock = jest.fn().mockResolvedValue({
        data: objectData,
        error: null,
        status: 200,
        extra: null,
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({ send: sendMock }),
        client: request.client,
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest);

      await act(async () => {
        result.current.start();
      });

      await waitFor(() => {
        expect(result.current.done).toBe(true);
      });

      expect(result.current.text).toBe(JSON.stringify(objectData));
      expect(result.current.streaming).toBe(false);
    });
  });

  describe("when stream reader throws an error", () => {
    it("should set error state from the reader exception", async () => {
      const stream = createFailingReadableStream("Stream read error");

      const sendMock = jest.fn().mockResolvedValue({
        data: stream,
        error: null,
        status: 200,
        extra: null,
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({ send: sendMock }),
        client: request.client,
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest);

      await act(async () => {
        result.current.start();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.streaming).toBe(false);
    });
  });

  describe("when abort is called", () => {
    it("should stop streaming", async () => {
      let resolvePull: (() => void) | null = null;
      const pullPromise = new Promise<void>((r) => {
        resolvePull = r;
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          controller.enqueue(encoder.encode("chunk"));
          await pullPromise;
          controller.close();
        },
      });

      const abortSpy = jest.fn();

      const sendMock = jest.fn().mockResolvedValue({
        data: stream,
        error: null,
        status: 200,
        extra: null,
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({ send: sendMock }),
        client: {
          ...request.client,
          requestManager: {
            ...request.client.requestManager,
            abortByKey: abortSpy,
          },
        },
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest);

      act(() => {
        result.current.start();
      });

      await waitFor(() => {
        expect(result.current.streaming).toBe(true);
      });

      act(() => {
        result.current.abort();
      });

      expect(result.current.streaming).toBe(false);
      expect(abortSpy).toHaveBeenCalled();

      await act(async () => {
        resolvePull!();
      });
    });
  });

  describe("when reset is called", () => {
    it("should reset all state to initial values", async () => {
      const sendMock = jest.fn().mockResolvedValue({
        data: "some data",
        error: null,
        status: 200,
        extra: { headers: {} },
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({ send: sendMock }),
        client: request.client,
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest);

      await act(async () => {
        result.current.start();
      });

      await waitFor(() => {
        expect(result.current.done).toBe(true);
      });

      expect(result.current.text).toBe("some data");

      act(() => {
        result.current.reset();
      });

      expect(result.current.text).toBe("");
      expect(result.current.chunks).toEqual([]);
      expect(result.current.streaming).toBe(false);
      expect(result.current.done).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.extra).toBe(null);
      expect(result.current.status).toBe(null);
    });
  });

  describe("when autoStart is true", () => {
    it("should start streaming automatically on mount", async () => {
      const sendMock = jest.fn().mockResolvedValue({
        data: "auto-started",
        error: null,
        status: 200,
        extra: null,
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({ send: sendMock }),
        client: request.client,
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest, { autoStart: true });

      await waitFor(() => {
        expect(result.current.done).toBe(true);
      });

      expect(result.current.text).toBe("auto-started");
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe("when start is called while already streaming", () => {
    it("should not start a second stream", async () => {
      let resolvePull: (() => void) | null = null;
      const pullPromise = new Promise<void>((r) => {
        resolvePull = r;
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          controller.enqueue(encoder.encode("data"));
          await pullPromise;
          controller.close();
        },
      });

      const sendMock = jest.fn().mockResolvedValue({
        data: stream,
        error: null,
        status: 200,
        extra: null,
      });

      const mockRequest = {
        ...request,
        setOptions: jest.fn().mockReturnValue({ send: sendMock }),
        client: request.client,
        abortKey: request.abortKey,
        scope: request.scope,
      };

      const { result } = renderUseStream(mockRequest);

      act(() => {
        result.current.start();
      });

      await waitFor(() => {
        expect(result.current.streaming).toBe(true);
      });

      act(() => {
        result.current.start();
      });

      expect(sendMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolvePull!();
      });

      await waitFor(() => {
        expect(result.current.done).toBe(true);
      });
    });
  });
});
