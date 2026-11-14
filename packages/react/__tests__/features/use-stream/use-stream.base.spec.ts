import { AbortError, Client } from "@hyper-fetch/core";
import type { ServerSentEventType } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useStream } from "hooks/use-stream";
import { StrictMode, createElement } from "react";
import type { ReactNode } from "react";

const fast = { requestTime: 0, responseTime: 0 };

describe("useStream [ Base ]", () => {
  let client = new Client({ url: "http://stream-test" });

  const createRequest = () => client.createRequest<{ response: any }>()({ endpoint: "/stream", method: "POST" });

  beforeEach(() => {
    client = new Client({ url: "http://stream-test" });
  });

  describe("when hook is initialized", () => {
    it("should have initial state and not send anything", () => {
      const request = createRequest().setMock(() => ({ chunks: ["a"], status: 200 }), fast);
      const spy = vi.spyOn(client.submitDispatcher, "add");
      const { result } = renderHook(() => useStream(request));

      expect(result.current).toMatchObject({
        text: "",
        chunks: [],
        events: [],
        data: null,
        streaming: false,
        done: false,
        aborted: false,
        error: null,
        extra: null,
        status: null,
      });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("when start is called", () => {
    it("should accumulate text and chunks and finish with data", async () => {
      const request = createRequest().setMock(
        async () => ({ chunks: ["Hello ", "World", "!"], status: 200, extra: { headers: { a: "1" } } }),
        fast,
      );
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      expect(result.current.streaming).toBe(true);

      await waitFor(() => {
        expect(result.current.done).toBe(true);
      });

      expect(result.current.text).toBe("Hello World!");
      expect(result.current.chunks).toHaveLength(3);
      expect(ArrayBuffer.isView(result.current.chunks[0])).toBe(true);
      expect(result.current.data).toBe("Hello World!");
      expect(result.current.streaming).toBe(false);
      expect(result.current.status).toBe(200);
      expect(result.current.extra).toEqual({ headers: { a: "1" } });
      expect(result.current.error).toBe(null);
    });

    it("should re-render with partial text while streaming", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["one ", "two ", "three"], status: 200 }), {
        ...fast,
        chunkTime: 10,
      });
      const seen: string[] = [];
      const { result } = renderHook(() => {
        const stream = useStream(request);
        seen.push(stream.text);
        return stream;
      });

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(seen).toContain("one ");
      expect(seen).toContain("one two ");
      expect(seen.at(-1)).toBe("one two three");
    });

    it("should append chunks in place instead of copying the array for every chunk", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), fast);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const chunksRef = result.current.chunks;
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.chunks).toBe(chunksRef);
      expect(chunksRef).toHaveLength(3);
    });

    it("should send the request with the streaming option without mutating the original request", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["a"], status: 200 }), fast);
      const options: unknown[] = [];
      const unmount = client.requestManager.events.onRequestStart(({ request: sent }) => {
        options.push(sent.options);
      });
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.done).toBe(true));
      unmount();

      expect(options).toEqual([expect.objectContaining({ streaming: true })]);
      expect(request.options).toBeUndefined();
    });

    it("should ignore start while already streaming", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["a", "b"], status: 200 }), { ...fast, chunkTime: 10 });
      const spy = vi.spyOn(client.submitDispatcher, "add");
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
        result.current.start();
      });
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result.current.text).toBe("ab");
    });

    it("should call onChunk for every chunk", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["x", "y"], status: 200 }), fast);
      const onChunk = vi.fn();
      const { result } = renderHook(() => useStream(request, { onChunk }));

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(onChunk.mock.calls.map(([{ text, index }]) => [text, index])).toEqual([
        ["x", 0],
        ["y", 1],
      ]);
    });

    it("should fall back to the resolved data when the adapter does not emit chunks", async () => {
      const request = createRequest().setMock(() => ({ data: { whole: true }, status: 200 }), fast);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe(JSON.stringify({ whole: true }));
      expect(result.current.data).toEqual({ whole: true });
    });
  });

  describe("when the format option is used", () => {
    it("should parse server-sent events split across chunks", async () => {
      const request = createRequest().setMock(
        () => ({ chunks: ["event: delta\nda", 'ta: {"t":"Hi"}\n', "\ndata: [DONE]\n\n"], status: 200 }),
        fast,
      );
      const onEvent = vi.fn();
      const { result } = renderHook(() => useStream(request, { format: "sse", onEvent }));

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.done).toBe(true));

      const expected: ServerSentEventType[] = [
        { event: "delta", data: '{"t":"Hi"}', id: "" },
        { event: "message", data: "[DONE]", id: "" },
      ];
      expect(result.current.events).toEqual(expected);
      expect(onEvent).toHaveBeenCalledTimes(2);
    });

    it("should parse NDJSON with typed values", async () => {
      const request = createRequest().setMock(() => ({ chunks: ['{"n":1}\n{"n"', ":2}\n"], status: 200 }), fast);
      const { result } = renderHook(() =>
        useStream<typeof request, "ndjson", { n: number }>(request, { format: "ndjson" }),
      );

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.done).toBe(true));

      const values: number[] = result.current.events.map(({ n }) => n);
      expect(values).toEqual([1, 2]);
    });

    it("should flush a trailing NDJSON line without a newline at the end", async () => {
      const request = createRequest().setMock(() => ({ chunks: ['{"n":1}\n{"n":2}'], status: 200 }), fast);
      const { result } = renderHook(() => useStream(request, { format: "ndjson" }));

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.events).toEqual([{ n: 1 }, { n: 2 }]);
    });

    it("should fail and stop the stream on invalid NDJSON", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["not json\n", '{"n":2}\n'], status: 200 }), {
        ...fast,
        chunkTime: 10,
      });
      const { result } = renderHook(() => useStream(request, { format: "ndjson" }));

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));

      expect((result.current.error as Error).message).toContain("Invalid NDJSON line");
      expect(result.current.streaming).toBe(false);
      expect(result.current.done).toBe(false);
    });
  });

  describe("when the response is an error", () => {
    it("should set error state", async () => {
      const request = client
        .createRequest<{ response: string; error: { message: string } }>()({ endpoint: "/stream", method: "POST" })
        .setMock(() => ({ error: { message: "bad" }, status: 400 }), fast);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.error).toEqual({ message: "bad" }));

      expect(result.current.status).toBe(400);
      expect(result.current.streaming).toBe(false);
      expect(result.current.done).toBe(false);
    });
  });

  describe("when abort is called", () => {
    it("should abort the underlying request and stop receiving chunks", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["a", "b", "c", "d"], status: 200 }), {
        ...fast,
        chunkTime: 5,
      });
      const aborts = vi.fn();
      const unmount = client.requestManager.events.onAbort(aborts);
      const settled = vi.fn();
      const unmountResponse = client.requestManager.events.onResponse(settled);
      const controls: { abort?: () => void } = {};
      const { result } = renderHook(() => {
        const stream = useStream(request, { onChunk: ({ index }) => index === 0 && controls.abort?.() });
        controls.abort = stream.abort;
        return stream;
      });

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(settled).toHaveBeenCalled());
      unmount();
      unmountResponse();

      expect(aborts).toHaveBeenCalledTimes(1);
      expect(result.current.text).toBe("a");
      expect(result.current.streaming).toBe(false);
      expect(result.current.aborted).toBe(true);
      expect(result.current.done).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should only abort its own request, not other requests sharing the abort key", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), {
        ...fast,
        chunkTime: 5,
      });
      const other = createRequest().setMock(() => ({ data: "other", status: 200 }), {
        requestTime: 30,
        responseTime: 30,
      });
      const controls: { abort?: () => void } = {};
      const { result } = renderHook(() => {
        const stream = useStream(request, { onChunk: ({ index }) => index === 0 && controls.abort?.() });
        controls.abort = stream.abort;
        return stream;
      });

      const otherResponse = other.send();
      act(() => {
        result.current.start();
      });

      const { data, error } = await otherResponse;
      expect(result.current.aborted).toBe(true);
      expect(error).toBe(null);
      expect(data).toBe("other");
    });

    it("should do nothing when not streaming", () => {
      const request = createRequest().setMock(() => ({ chunks: ["a"], status: 200 }), fast);
      const aborts = vi.fn();
      const unmount = client.requestManager.events.onAbort(aborts);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.abort();
      });
      unmount();

      expect(aborts).not.toHaveBeenCalled();
      expect(result.current.aborted).toBe(false);
    });
  });

  describe("when reset is called", () => {
    it("should abort the stream, ignore late chunks and allow a fresh start", async () => {
      let call = 0;
      const request = createRequest().setMock(
        () => {
          call += 1;
          return { chunks: call === 1 ? ["old-1", "old-2", "old-3"] : ["new"], status: 200 };
        },
        { ...fast, chunkTime: 5 },
      );
      const aborted = vi.fn();
      const unmount = client.requestManager.events.onAbort(aborted);
      const controls: { reset?: () => void } = {};
      const { result } = renderHook(() => {
        const stream = useStream(request, { onChunk: ({ text }) => text === "old-1" && controls.reset?.() });
        controls.reset = stream.reset;
        return stream;
      });

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(aborted).toHaveBeenCalled());
      unmount();
      expect(result.current).toMatchObject({ text: "", chunks: [], streaming: false, done: false, aborted: false });

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("new");
      expect(result.current.error).toBe(null);
    });
  });

  describe("when the component unmounts", () => {
    it("should abort the ongoing stream", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), {
        ...fast,
        chunkTime: 5,
      });
      const aborts = vi.fn();
      const unmountListener = client.requestManager.events.onAbort(aborts);
      const controls: { unmount?: () => void } = {};
      const { result, unmount } = renderHook(() =>
        useStream(request, { onChunk: ({ index }) => index === 0 && controls.unmount?.() }),
      );
      controls.unmount = unmount;

      act(() => {
        result.current.start();
      });
      await waitFor(() => expect(aborts).toHaveBeenCalledTimes(1));
      unmountListener();
    });
  });

  describe("when autoStart is true", () => {
    it("should start streaming automatically on mount", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["auto"], status: 200 }), fast);
      const { result } = renderHook(() => useStream(request, { autoStart: true }));

      await waitFor(() => expect(result.current.done).toBe(true));
      expect(result.current.text).toBe("auto");
    });

    it("should finish the stream under StrictMode double mounting", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["strict ", "mode"], status: 200 }), {
        ...fast,
        chunkTime: 5,
      });
      const wrapper = ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children);
      const { result } = renderHook(() => useStream(request, { autoStart: true }), { wrapper });

      await waitFor(() => expect(result.current.done).toBe(true));
      expect(result.current.text).toBe("strict mode");
    });
  });

  describe("when the request is aborted from outside", () => {
    it("should expose the abort error", async () => {
      const request = createRequest().setMock(() => ({ chunks: ["a", "b"], status: 200 }), { ...fast, chunkTime: 5 });
      const { result } = renderHook(() =>
        useStream(request, { onChunk: ({ index }) => index === 0 && client.requestManager.abortAll() }),
      );

      act(() => {
        result.current.start();
      });

      await waitFor(() => expect(result.current.error).toBeInstanceOf(AbortError));
      expect(result.current.text).toBe("a");
      expect(result.current.streaming).toBe(false);
      expect(result.current.aborted).toBe(false);
    });
  });
});
