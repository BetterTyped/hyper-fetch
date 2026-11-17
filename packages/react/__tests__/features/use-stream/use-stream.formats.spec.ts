import type { ServerSentEventType } from "@hyper-fetch/core";
import { act, renderHook } from "@testing-library/react";
import { useStream } from "hooks/use-stream";
import type { UseStreamOptionsType } from "hooks/use-stream";

import { createControlledClient, createSignal, hex } from "../../utils/streaming.utils";
import type { ControlledCall } from "../../utils/streaming.utils";

const encode = (value: string) => new TextEncoder().encode(value);

/**
 * These tests drive the stream through a controlled adapter: every chunk is delivered exactly when the test
 * says so, which makes "between two chunks" a real place to re-render or change props.
 */
describe("useStream [ Formats and callbacks ]", () => {
  const setup = () => {
    const controlled = createControlledClient();
    const request = controlled.client.createRequest<{ response: unknown }>()({ endpoint: "/stream", method: "POST" });
    return { ...controlled, request };
  };

  /** Start the hook's stream and hand back the adapter call that feeds it. */
  const startStream = async (start: () => void, next: () => Promise<ControlledCall>) => {
    act(() => {
      start();
    });
    const call = await next();
    act(() => {
      call.open();
    });
    return call;
  };

  const pushChunk = (call: ControlledCall, value: string | Uint8Array) => {
    act(() => {
      call.chunk(value);
    });
  };

  /** Finish the stream and wait until the hook rendered the result. */
  const finish = async (call: ControlledCall, signal: ReturnType<typeof createSignal>, isDone: () => boolean) => {
    await act(async () => {
      call.succeed("done");
      await signal.until(isDone);
    });
  };

  const renderStream = <Format extends "text" | "sse" | "ndjson" = "text", Value = unknown>(
    request: ReturnType<typeof setup>["request"],
    initialOptions?: UseStreamOptionsType<Format, Value>,
  ) => {
    const signal = createSignal();
    let renders = 0;
    let done = false;
    const hook = renderHook(
      (options: UseStreamOptionsType<Format, Value> | undefined) => {
        const stream = useStream<typeof request, Format, Value>(request, options);
        renders += 1;
        done = stream.done;
        signal.notify();
        return stream;
      },
      { initialProps: initialOptions },
    );
    return { ...hook, signal, renders: () => renders, isDone: () => done };
  };

  describe("when the format is text", () => {
    it("should not parse events", async () => {
      const { request, next } = setup();
      const onEvent = vi.fn();
      const { result, signal, isDone } = renderStream(request, { onEvent } as UseStreamOptionsType);

      const call = await startStream(result.current.start, next);
      pushChunk(call, "data: looks like an event\n\n");
      await finish(call, signal, isDone);

      expect(result.current.text).toBe("data: looks like an event\n\n");
      expect(result.current.events).toEqual([]);
      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should decode characters split between byte chunks", async () => {
      const { request, next } = setup();
      const { result, signal, isDone } = renderStream(request);
      const bytes = encode("zażółć 🚀");

      const call = await startStream(result.current.start, next);
      pushChunk(call, bytes.slice(0, 3));
      expect(result.current.text).toBe("za");
      pushChunk(call, bytes.slice(3, 12));
      pushChunk(call, bytes.slice(12));
      await finish(call, signal, isDone);

      expect(result.current.text).toBe("zażółć 🚀");
      expect(result.current.chunks).toHaveLength(3);
    });
  });

  describe("when the format is sse", () => {
    it("should parse events as soon as they are complete", async () => {
      const { request, next } = setup();
      const { result, signal, isDone } = renderStream(request, { format: "sse" });

      const call = await startStream(result.current.start, next);
      pushChunk(call, "event: delta\nda");
      expect(result.current.events).toEqual([]);
      pushChunk(call, 'ta: {"text":"Hi"}\n');
      expect(result.current.events).toEqual([]);
      pushChunk(call, "\ndata: [DONE]\n\n");
      expect(result.current.events).toEqual([
        { event: "delta", data: '{"text":"Hi"}', id: "" },
        { event: "message", data: "[DONE]", id: "" },
      ] satisfies ServerSentEventType[]);
      await finish(call, signal, isDone);

      expect(result.current.events).toHaveLength(2);
      expect(result.current.text).toBe('event: delta\ndata: {"text":"Hi"}\n\ndata: [DONE]\n\n');
    });

    it("should parse events whose characters are split between byte chunks", async () => {
      const { request, next } = setup();
      const { result, signal, isDone } = renderStream(request, { format: "sse" });
      const bytes = encode("data: zażółć 🚀\n\n");
      const cut = bytes.indexOf(hex("f0")[0]) + 2;

      const call = await startStream(result.current.start, next);
      pushChunk(call, bytes.slice(0, cut));
      expect(result.current.events).toEqual([]);
      pushChunk(call, bytes.slice(cut));
      await finish(call, signal, isDone);

      expect(result.current.events).toEqual([{ event: "message", data: "zażółć 🚀", id: "" }]);
    });

    it("should call onEvent once per event, in order", async () => {
      const { request, next } = setup();
      const onEvent = vi.fn();
      const { result, signal, isDone } = renderStream(request, { format: "sse", onEvent });

      const call = await startStream(result.current.start, next);
      pushChunk(call, "data: one\n\ndata: two\n\nda");
      expect(onEvent.mock.calls.map(([event]) => event.data)).toEqual(["one", "two"]);
      pushChunk(call, "ta: three\n\n");
      await finish(call, signal, isDone);

      expect(onEvent.mock.calls.map(([event]) => event.data)).toEqual(["one", "two", "three"]);
    });

    it("should append events to the same array", async () => {
      const { request, next } = setup();
      const { result, signal, isDone } = renderStream(request, { format: "sse" });

      const call = await startStream(result.current.start, next);
      const eventsRef = result.current.events;
      pushChunk(call, "data: one\n\n");
      pushChunk(call, "data: two\n\n");
      await finish(call, signal, isDone);

      expect(result.current.events).toBe(eventsRef);
      expect(eventsRef).toHaveLength(2);
    });
  });

  describe("when the format is ndjson", () => {
    it("should parse values as soon as their line is complete", async () => {
      const { request, next } = setup();
      const { result, signal, isDone } = renderStream<"ndjson", { n: number }>(request, { format: "ndjson" });

      const call = await startStream(result.current.start, next);
      pushChunk(call, '{"n":1}\n{"n"');
      expect(result.current.events).toEqual([{ n: 1 }]);
      pushChunk(call, ":2}\n");
      expect(result.current.events).toEqual([{ n: 1 }, { n: 2 }]);
      pushChunk(call, '{"n":3}');
      expect(result.current.events).toEqual([{ n: 1 }, { n: 2 }]);
      await finish(call, signal, isDone);

      // The last line has no line ending - it is parsed when the stream ends
      expect(result.current.events.map(({ n }) => n)).toEqual([1, 2, 3]);
    });

    it("should stop with a parse error and abort the request on an invalid line", async () => {
      const { request, next } = setup();
      const onEvent = vi.fn();
      const { result } = renderStream(request, { format: "ndjson", onEvent });

      const call = await startStream(result.current.start, next);
      pushChunk(call, '{"n":1}\n');
      pushChunk(call, "not json\n");

      expect(call.isAborted()).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.streaming).toBe(false);
      expect(result.current.done).toBe(false);
      expect(result.current.aborted).toBe(false);
      expect(result.current.events).toEqual([{ n: 1 }]);

      // Whatever the adapter still reports is ignored, and the abort result does not replace the parse error
      const parseError = result.current.error;
      pushChunk(call, '{"n":2}\n');
      await act(async () => {
        await call.aborted;
        await Promise.resolve();
      });

      expect(result.current.error).toBe(parseError);
      expect(onEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the options change while streaming", () => {
    it("should call the latest onChunk", async () => {
      const { request, next } = setup();
      const first = vi.fn();
      const second = vi.fn();
      const { result, rerender, signal, isDone } = renderStream(request, { onChunk: first });

      const call = await startStream(result.current.start, next);
      pushChunk(call, "a");
      rerender({ onChunk: second });
      pushChunk(call, "b");
      pushChunk(call, "c");
      await finish(call, signal, isDone);

      expect(first.mock.calls.map(([{ text, index }]) => [text, index])).toEqual([["a", 0]]);
      expect(second.mock.calls.map(([{ text, index }]) => [text, index])).toEqual([
        ["b", 1],
        ["c", 2],
      ]);
    });

    it("should call the latest onEvent", async () => {
      const { request, next } = setup();
      const first = vi.fn();
      const second = vi.fn();
      const { result, rerender, signal, isDone } = renderStream(request, { format: "sse", onEvent: first });

      const call = await startStream(result.current.start, next);
      pushChunk(call, "data: one\n\ndata: tw");
      rerender({ format: "sse", onEvent: second });
      pushChunk(call, "o\n\n");
      await finish(call, signal, isDone);

      expect(first.mock.calls.map(([event]) => event.data)).toEqual(["one"]);
      expect(second.mock.calls.map(([event]) => event.data)).toEqual(["two"]);
    });

    it("should stop calling a callback that was removed", async () => {
      const { request, next } = setup();
      const onChunk = vi.fn();
      const { result, rerender, signal, isDone } = renderStream(request, { onChunk });

      const call = await startStream(result.current.start, next);
      pushChunk(call, "a");
      rerender({});
      pushChunk(call, "b");
      await finish(call, signal, isDone);

      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(result.current.text).toBe("ab");
    });

    it("should keep the format the stream was started with and use the new one for the next stream", async () => {
      const { request, next } = setup();
      const { result, rerender, signal, isDone } = renderStream<"sse" | "ndjson">(request, { format: "sse" });

      const call = await startStream(result.current.start, next);
      pushChunk(call, "data: one\n\n");
      rerender({ format: "ndjson" });
      pushChunk(call, "data: two\n\n");
      await finish(call, signal, isDone);
      expect(result.current.events).toEqual([
        { event: "message", data: "one", id: "" },
        { event: "message", data: "two", id: "" },
      ]);

      const nextCall = await startStream(result.current.start, next);
      pushChunk(nextCall, '{"n":1}\n');
      expect(result.current.events).toEqual([{ n: 1 }]);
      await finish(nextCall, signal, isDone);

      expect(result.current.events).toEqual([{ n: 1 }]);
    });
  });

  describe("when the hook re-renders", () => {
    it("should keep start, abort and reset stable", async () => {
      const { request, next } = setup();
      const { result, rerender, signal, isDone } = renderStream(request);
      const { start, abort, reset } = result.current;

      const call = await startStream(result.current.start, next);
      pushChunk(call, "a");
      rerender({});
      await finish(call, signal, isDone);

      expect(result.current.start).toBe(start);
      expect(result.current.abort).toBe(abort);
      expect(result.current.reset).toBe(reset);
    });

    it("should render once per chunk delivered on its own", async () => {
      const { request, next } = setup();
      const { result, renders, signal, isDone } = renderStream(request);

      const call = await startStream(result.current.start, next);
      const beforeChunks = renders();
      for (let index = 0; index < 20; index += 1) {
        pushChunk(call, `chunk-${index}|`);
      }
      const afterChunks = renders();
      await finish(call, signal, isDone);

      expect(afterChunks - beforeChunks).toBe(20);
      // Mount, start and finish add a constant number of renders on top
      expect(renders()).toBeLessThanOrEqual(20 + 4);
      expect(result.current.chunks).toHaveLength(20);
    });

    it("should render once for a burst of chunks delivered together", async () => {
      const { request, next } = setup();
      const { result, renders, signal, isDone } = renderStream(request);

      const call = await startStream(result.current.start, next);
      const beforeBurst = renders();
      act(() => {
        for (let index = 0; index < 200; index += 1) {
          call.chunk(`chunk-${index}|`);
        }
      });
      const afterBurst = renders();
      await finish(call, signal, isDone);

      expect(afterBurst - beforeBurst).toBe(1);
      expect(result.current.chunks).toHaveLength(200);
      expect(result.current.text.endsWith("chunk-199|")).toBe(true);
    });

    it("should not render again after the stream finished", async () => {
      const { request, next } = setup();
      const { result, renders, signal, isDone } = renderStream(request);

      const call = await startStream(result.current.start, next);
      pushChunk(call, "a");
      await finish(call, signal, isDone);
      const settled = renders();
      act(() => {
        result.current.abort();
        // A chunk for a finished request is not delivered anywhere
        call.chunk("late");
      });

      expect(renders()).toBe(settled);
      expect(result.current.text).toBe("a");
      expect(result.current.aborted).toBe(false);
    });

    it("should not update the state after the component unmounted", async () => {
      const { request, next } = setup();
      const onChunk = vi.fn();
      const { result, renders, unmount } = renderStream(request, { onChunk });

      const call = await startStream(result.current.start, next);
      pushChunk(call, "a");
      const beforeUnmount = renders();
      unmount();
      act(() => {
        call.chunk("late");
      });
      await act(async () => {
        await call.aborted;
      });

      expect(call.isAborted()).toBe(true);
      expect(renders()).toBe(beforeUnmount);
      expect(onChunk).toHaveBeenCalledTimes(1);
    });
  });
});
