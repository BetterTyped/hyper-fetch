import { AbortError, Client } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useStream } from "hooks/use-stream";
import { StrictMode, useEffect } from "react";

import { createStreamServer, hex } from "../../utils/streaming.utils";

const server = createStreamServer();
let baseUrl: string;

beforeAll(async () => {
  baseUrl = await server.start();
});

afterEach(() => {
  server.reset();
});

afterAll(async () => {
  await server.stop();
});

/** Answer the next request with the whole body at once. */
const respond = async (body: string) => {
  const exchange = await server.next();
  await exchange.end(body);
  return exchange;
};

describe("useStream [ Connection ]", () => {
  const createRequest = (client: Client, method: "GET" | "POST" = "POST") =>
    client.createRequest<{ response: string; error: { message: string } }>()({ endpoint: "/stream", method });

  describe("when the stream runs against a real server", () => {
    it("should render the text as the chunks arrive and finish with the full body", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      expect(result.current.streaming).toBe(true);
      const exchange = await server.next();
      await exchange.write("Hello ");
      await waitFor(() => expect(result.current.text).toBe("Hello "));
      expect(result.current.streaming).toBe(true);
      expect(result.current.done).toBe(false);
      expect(result.current.data).toBeNull();

      await exchange.write("zażółć ");
      await waitFor(() => expect(result.current.text).toBe("Hello zażółć "));
      await exchange.end("🚀");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("Hello zażółć 🚀");
      expect(result.current.data).toBe("Hello zażółć 🚀");
      expect(result.current.streaming).toBe(false);
      expect(result.current.status).toBe(200);
      expect(result.current.error).toBeNull();
      expect(result.current.chunks).toHaveLength(3);
      expect(Buffer.concat(result.current.chunks).toString()).toBe("Hello zażółć 🚀");
    });

    it("should send the request with the streaming option and its payload", async () => {
      const client = new Client({ url: baseUrl });
      const request = client
        .createRequest<{ response: string; payload: { prompt: string } }>()({ endpoint: "/chat", method: "POST" })
        .setPayload({ prompt: "hi" });
      const options: unknown[] = [];
      client.requestManager.events.onRequestStart(({ request: sent }) => options.push(sent.options));
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.end("ok");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(exchange.path).toBe("/chat");
      expect(JSON.parse(exchange.body.toString())).toEqual({ prompt: "hi" });
      expect(options).toEqual([{ streaming: true }]);
      expect(request.options).toBeUndefined();
    });

    it("should expose the response headers and status once the stream is done", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      exchange.head(201, { "Content-Type": "text/plain", "X-Stream": "yes" });
      await exchange.end("created");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.status).toBe(201);
      expect(result.current.extra?.headers).toMatchObject({ "x-stream": "yes" });
    });

    it("should keep the text equal to the data when the body ends in the middle of a character", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.write("cut ");
      await waitFor(() => expect(result.current.text).toBe("cut "));
      await exchange.end(hex("f0 9f"));
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("cut �");
      expect(result.current.text).toBe(result.current.data);
    });
  });

  describe("when the response is an error", () => {
    it("should expose the parsed error and status without text", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const onChunk = vi.fn();
      const { result } = renderHook(() => useStream(request, { onChunk }));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      exchange.head(422, { "Content-Type": "application/json" });
      await exchange.end(JSON.stringify({ message: "invalid prompt" }));
      await waitFor(() => expect(result.current.error).toEqual({ message: "invalid prompt" }));

      expect(result.current.status).toBe(422);
      expect(result.current.streaming).toBe(false);
      expect(result.current.done).toBe(false);
      expect(result.current.aborted).toBe(false);
      expect(result.current.text).toBe("");
      expect(result.current.data).toBeNull();
      expect(onChunk).not.toHaveBeenCalled();
    });

    it("should keep the partial text and expose the error when the connection breaks", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.write("partial");
      await waitFor(() => expect(result.current.text).toBe("partial"));
      exchange.destroy();
      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));

      expect(result.current.text).toBe("partial");
      expect(result.current.status).toBe(0);
      expect(result.current.streaming).toBe(false);
      expect(result.current.done).toBe(false);
    });

    it("should clear the error and stream again on the next start", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const failed = await server.next();
      failed.head(500, { "Content-Type": "application/json" });
      await failed.end(JSON.stringify({ message: "broken" }));
      await waitFor(() => expect(result.current.error).toEqual({ message: "broken" }));

      act(() => {
        result.current.start();
      });
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBeNull();
      const exchange = await server.next();
      await exchange.end("works now");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("works now");
      expect(result.current.error).toBeNull();
    });
  });

  describe("when abort is called", () => {
    it("should close the connection and keep the text received so far", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.write("partial");
      await waitFor(() => expect(result.current.text).toBe("partial"));

      act(() => {
        result.current.abort();
      });
      expect(result.current.aborted).toBe(true);
      expect(result.current.streaming).toBe(false);
      await exchange.closed;

      expect(exchange.wasDropped()).toBe(true);
      expect(result.current.text).toBe("partial");
      expect(result.current.done).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should close the connection when aborted before the first chunk", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      act(() => {
        result.current.abort();
      });
      await exchange.closed;

      expect(exchange.wasDropped()).toBe(true);
      expect(result.current).toMatchObject({ aborted: true, streaming: false, done: false, text: "", error: null });
    });

    it("should only close its own connection when two hooks stream the same request", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const stopped = renderHook(() => useStream(request));
      const running = renderHook(() => useStream(request));

      act(() => {
        stopped.result.current.start();
      });
      const stoppedExchange = await server.next();
      act(() => {
        running.result.current.start();
      });
      const runningExchange = await server.next();
      await stoppedExchange.write("a");
      await runningExchange.write("b");
      await waitFor(() => expect(stopped.result.current.text).toBe("a"));
      await waitFor(() => expect(running.result.current.text).toBe("b"));

      act(() => {
        stopped.result.current.abort();
      });
      await stoppedExchange.closed;
      await runningExchange.end("c");
      await waitFor(() => expect(running.result.current.done).toBe(true));

      expect(stoppedExchange.wasDropped()).toBe(true);
      expect(runningExchange.wasDropped()).toBe(false);
      expect(stopped.result.current).toMatchObject({ aborted: true, text: "a", done: false });
      expect(running.result.current).toMatchObject({ aborted: false, text: "bc", done: true, error: null });
    });

    it("should allow a fresh stream after the abort", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const abortedExchange = await server.next();
      await abortedExchange.write("old");
      await waitFor(() => expect(result.current.text).toBe("old"));
      act(() => {
        result.current.abort();
      });
      act(() => {
        result.current.start();
      });
      expect(result.current).toMatchObject({ aborted: false, streaming: true, text: "" });
      const exchange = await server.next();
      await exchange.end("new");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("new");
      expect(result.current.aborted).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should expose the abort error when the request is aborted from outside the hook", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.write("partial");
      await waitFor(() => expect(result.current.text).toBe("partial"));
      act(() => {
        client.requestManager.abortAll();
      });
      await waitFor(() => expect(result.current.error).toBeInstanceOf(AbortError));

      expect(result.current.aborted).toBe(false);
      expect(result.current.streaming).toBe(false);
      expect(result.current.text).toBe("partial");
    });
  });

  describe("when reset is called", () => {
    it("should close the connection, clear the state and allow a fresh stream", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const onChunk = vi.fn();
      const { result } = renderHook(() => useStream(request, { onChunk }));

      act(() => {
        result.current.start();
      });
      const oldExchange = await server.next();
      await oldExchange.write("old");
      await waitFor(() => expect(result.current.text).toBe("old"));

      act(() => {
        result.current.reset();
      });
      expect(result.current).toMatchObject({
        text: "",
        chunks: [],
        events: [],
        data: null,
        streaming: false,
        done: false,
        aborted: false,
        error: null,
        status: null,
      });
      await oldExchange.closed;
      expect(oldExchange.wasDropped()).toBe(true);

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.end("new");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("new");
      expect(result.current.error).toBeNull();
      expect(onChunk.mock.calls.map(([{ text }]) => text)).toEqual(["old", "new"]);
    });

    it("should clear the state of a finished stream", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      await respond("finished");
      await waitFor(() => expect(result.current.done).toBe(true));
      act(() => {
        result.current.reset();
      });

      expect(result.current).toMatchObject({ text: "", data: null, done: false, status: null, extra: null });
    });
  });

  describe("when start is called while streaming", () => {
    it("should keep the running stream and not open a second connection", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.write("a");
      await waitFor(() => expect(result.current.text).toBe("a"));
      act(() => {
        result.current.start();
        result.current.start();
      });
      await exchange.end("b");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(server.exchanges).toHaveLength(1);
      expect(exchange.wasDropped()).toBe(false);
      expect(result.current.text).toBe("ab");
    });

    it("should start a new stream with a clean state once the previous one is done", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      await respond("first");
      await waitFor(() => expect(result.current.done).toBe(true));
      act(() => {
        result.current.start();
      });
      expect(result.current).toMatchObject({ text: "", done: false, streaming: true, data: null });
      await respond("second");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("second");
      expect(result.current.chunks).toHaveLength(1);
    });
  });

  describe("when the component unmounts", () => {
    it("should close the connection in the middle of the stream", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const onChunk = vi.fn();
      const { result, unmount } = renderHook(() => useStream(request, { onChunk }));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.write("partial");
      await waitFor(() => expect(result.current.text).toBe("partial"));
      unmount();
      await exchange.closed;

      expect(exchange.wasDropped()).toBe(true);
      expect(onChunk).toHaveBeenCalledTimes(1);
    });

    it("should leave the connection alone when the stream already finished", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const onAbort = vi.fn();
      client.requestManager.events.onAbort(onAbort);
      const { result, unmount } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.end("finished");
      await waitFor(() => expect(result.current.done).toBe(true));
      unmount();
      await exchange.closed;

      expect(exchange.wasDropped()).toBe(false);
      expect(onAbort).not.toHaveBeenCalled();
    });

    it("should not touch the stream of another hook using the same request", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const leaving = renderHook(() => useStream(request));
      const staying = renderHook(() => useStream(request));

      act(() => {
        leaving.result.current.start();
      });
      const leavingExchange = await server.next();
      act(() => {
        staying.result.current.start();
      });
      const stayingExchange = await server.next();
      leaving.unmount();
      await leavingExchange.closed;
      await stayingExchange.end("still here");
      await waitFor(() => expect(staying.result.current.done).toBe(true));

      expect(leavingExchange.wasDropped()).toBe(true);
      expect(staying.result.current.text).toBe("still here");
    });
  });

  describe("when autoStart is used", () => {
    it("should open one connection on mount", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result } = renderHook(() => useStream(request, { autoStart: true }));

      expect(result.current.streaming).toBe(true);
      const exchange = await server.next();
      await exchange.end("auto");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(server.exchanges).toHaveLength(1);
      expect(result.current.text).toBe("auto");
    });

    it("should really mount, unmount and mount again under StrictMode", () => {
      // Guards the tests below: only StrictMode passed directly as the wrapper replays the effects
      const effects: string[] = [];
      renderHook(
        () =>
          useEffect(() => {
            effects.push("mount");
            return () => {
              effects.push("unmount");
            };
          }, []),
        { wrapper: StrictMode },
      );

      expect(effects).toEqual(["mount", "unmount", "mount"]);
    });

    it.each(["POST", "GET"] as const)(
      "should finish a %s stream under StrictMode double mounting with a single connection",
      async (method) => {
        const client = new Client({ url: baseUrl });
        const request = createRequest(client, method);
        const { result } = renderHook(() => useStream(request, { autoStart: true }), { wrapper: StrictMode });

        const exchange = await server.next();
        await exchange.write("strict ");
        await waitFor(() => expect(result.current.text).toBe("strict "));
        await exchange.end("mode");
        await waitFor(() => expect(result.current.done).toBe(true));

        expect(result.current.text).toBe("strict mode");
        expect(result.current.error).toBeNull();
        expect(result.current.aborted).toBe(false);
        // The stream of the first, discarded mount never reached the server
        expect(server.exchanges).toHaveLength(1);
        expect(exchange.wasDropped()).toBe(false);
      },
    );

    it("should close the connection when a StrictMode component unmounts for good", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result, unmount } = renderHook(() => useStream(request, { autoStart: true }), { wrapper: StrictMode });

      const exchange = await server.next();
      await exchange.write("partial");
      await waitFor(() => expect(result.current.text).toBe("partial"));
      unmount();
      await exchange.closed;

      expect(exchange.wasDropped()).toBe(true);
      expect(server.exchanges).toHaveLength(1);
    });

    it("should start when autoStart turns true after the mount", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result, rerender } = renderHook(({ autoStart }) => useStream(request, { autoStart }), {
        initialProps: { autoStart: false },
      });

      expect(result.current.streaming).toBe(false);
      rerender({ autoStart: true });
      expect(result.current.streaming).toBe(true);
      await respond("late start");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("late start");
    });

    it("should not start again on re-renders after the stream finished", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client);
      const { result, rerender } = renderHook(() => useStream(request, { autoStart: true }));

      await respond("once");
      await waitFor(() => expect(result.current.done).toBe(true));
      rerender();
      rerender();

      expect(result.current.done).toBe(true);
      expect(server.exchanges).toHaveLength(1);
    });
  });

  describe("when the request is created during render", () => {
    it("should keep the stream running across re-renders with a new request instance", async () => {
      const client = new Client({ url: baseUrl });
      const base = createRequest(client);
      // A new, equal request instance on every render - like `useStream(request.setParams(...))`
      const { result } = renderHook(() => useStream(base.setHeaders({ "X-Inline": "1" })));

      act(() => {
        result.current.start();
      });
      const exchange = await server.next();
      await exchange.write("a");
      await waitFor(() => expect(result.current.text).toBe("a"));
      await exchange.write("b");
      await waitFor(() => expect(result.current.text).toBe("ab"));
      await exchange.end("c");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("abc");
      expect(result.current.error).toBeNull();
      expect(exchange.wasDropped()).toBe(false);
      expect(server.exchanges).toHaveLength(1);
    });

    it("should open one connection with autoStart and a new request instance on every render", async () => {
      const client = new Client({ url: baseUrl });
      const base = createRequest(client);
      const { result } = renderHook(() => useStream(base.setHeaders({ "X-Inline": "1" }), { autoStart: true }));

      const exchange = await server.next();
      await exchange.write("a");
      await waitFor(() => expect(result.current.text).toBe("a"));
      await exchange.end("b");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("ab");
      expect(server.exchanges).toHaveLength(1);
      expect(exchange.wasDropped()).toBe(false);
    });
  });

  describe("when two hooks stream the same deduplicated request", () => {
    it("should give both hooks the whole text even when the second one starts later", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client, "GET");
      const first = renderHook(() => useStream(request));
      const second = renderHook(() => useStream(request));

      act(() => {
        first.result.current.start();
      });
      const firstExchange = await server.next();
      await firstExchange.write("early|");
      await waitFor(() => expect(first.result.current.text).toBe("early|"));
      act(() => {
        second.result.current.start();
      });
      // Joining the running request would lose "early|", so the second hook gets a stream of its own
      const secondExchange = await server.next();
      await firstExchange.end("late");
      await secondExchange.end("early|late");
      await waitFor(() => expect(first.result.current.done).toBe(true));
      await waitFor(() => expect(second.result.current.done).toBe(true));

      expect(first.result.current.text).toBe("early|late");
      expect(second.result.current.text).toBe("early|late");
      expect(second.result.current.text).toBe(second.result.current.data);
    });
  });

  describe("when the request is retried", () => {
    it("should drop the text of the failed attempt and show only the retried stream", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client).setRetry(1).setRetryTime(0);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const broken = await server.next();
      await broken.write("broken answer");
      await waitFor(() => expect(result.current.text).toBe("broken answer"));
      const chunksRef = result.current.chunks;
      broken.destroy();
      const retried = await server.next();
      await retried.write("fresh ");
      await waitFor(() => expect(result.current.text).toBe("fresh "));
      expect(result.current.streaming).toBe(true);
      expect(result.current.error).toBeNull();
      await retried.end("answer");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.text).toBe("fresh answer");
      expect(result.current.data).toBe("fresh answer");
      expect(result.current.chunks).toBe(chunksRef);
      expect(Buffer.concat(result.current.chunks).toString()).toBe("fresh answer");
      expect(result.current.error).toBeNull();
    });

    it("should drop the events of the failed attempt and parse the retried stream from a clean state", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client).setRetry(1).setRetryTime(0);
      const { result } = renderHook(() => useStream(request, { format: "sse" }));

      act(() => {
        result.current.start();
      });
      const broken = await server.next();
      // One whole event and the beginning of the next one
      await broken.write("data: old\n\ndata: unfini");
      await waitFor(() => expect(result.current.events).toHaveLength(1));
      broken.destroy();
      const retried = await server.next();
      await retried.end("data: new\n\n");
      await waitFor(() => expect(result.current.done).toBe(true));

      expect(result.current.events).toEqual([{ event: "message", data: "new", id: "" }]);
      expect(result.current.text).toBe("data: new\n\n");
    });

    it("should expose the error of the last attempt when the retries run out", async () => {
      const client = new Client({ url: baseUrl });
      const request = createRequest(client).setRetry(1).setRetryTime(0);
      const { result } = renderHook(() => useStream(request));

      act(() => {
        result.current.start();
      });
      const first = await server.next();
      first.head(503, { "Content-Type": "application/json" });
      await first.end(JSON.stringify({ message: "busy" }));
      const second = await server.next();
      second.head(500, { "Content-Type": "application/json" });
      await second.end(JSON.stringify({ message: "broken" }));
      await waitFor(() => expect(result.current.error).toEqual({ message: "broken" }));

      expect(result.current.status).toBe(500);
      expect(result.current.streaming).toBe(false);
      expect(server.exchanges).toHaveLength(2);
    });
  });
});
