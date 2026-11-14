/**
 * @vitest-environment node
 */
import { AbortError, Client, Plugin, createSSEParser } from "@hyper-fetch/core";
import type { ServerSentEventType } from "@hyper-fetch/core";
import { createE2EServer } from "@hyper-fetch/testing";
import type http from "http";

const { route, startServer, stopServer } = createE2EServer();

let baseUrl: string;

/** Gate the server waits on, so tests decide exactly when the next chunk is written (no timing assumptions). */
const createGate = () => {
  let open: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
};

let gate = createGate();
let serverClosedConnection = createGate();

const writeHead = (res: http.ServerResponse, contentType = "text/plain; charset=utf-8") => {
  res.writeHead(200, { "Content-Type": contentType, "Transfer-Encoding": "chunked" });
};

beforeAll(async () => {
  // Writes the first chunk, then waits for the test to open the gate before finishing.
  route("GET", "/gated", async (_req, res) => {
    writeHead(res);
    res.write("first|");
    await gate.promise;
    res.write("second|");
    res.end("third");
  });

  // Writes one chunk and keeps the connection open until the client goes away.
  route("GET", "/hanging", (req, res) => {
    writeHead(res);
    res.write("partial");
    req.on("close", () => serverClosedConnection.open());
    res.on("close", () => serverClosedConnection.open());
  });

  // "zażółć 🚀" split in the middle of multi-byte characters.
  route("GET", "/utf8", async (_req, res) => {
    writeHead(res);
    const bytes = Buffer.from("zażółć 🚀", "utf8");
    res.write(bytes.subarray(0, 3));
    await gate.promise;
    res.write(bytes.subarray(3, 12));
    res.end(bytes.subarray(12));
  });

  // SSE answer to a POST, echoing the posted prompt word by word.
  route("POST", "/sse", (_req, res, body) => {
    const { prompt } = JSON.parse(body.toString()) as { prompt: string };
    writeHead(res, "text/event-stream");
    res.write(": keep-alive\n\n");
    prompt.split(" ").forEach((word, index) => {
      res.write(`event: delta\nid: ${index}\ndata: ${JSON.stringify({ word })}\n\n`);
    });
    res.end("data: [DONE]\n\n");
  });

  route("GET", "/json-error", (_req, res) => {
    const body = JSON.stringify({ message: "nope" });
    res.writeHead(422, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body).toString() });
    res.end(body);
  });

  route("GET", "/json", (_req, res) => {
    writeHead(res, "application/json");
    res.write('{"items":[1,');
    res.end("2,3]}");
  });

  baseUrl = await startServer();
});

beforeEach(() => {
  gate = createGate();
  serverClosedConnection = createGate();
});

afterAll(async () => {
  await stopServer();
});

describe("E2E [ Streaming lifecycle ]", () => {
  it("should deliver chunks progressively and resolve only after the body is fully read", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{ response: string }>()({ endpoint: "/gated" })
      .setOptions({ streaming: true });

    const order: string[] = [];
    let resolved = false;

    const promise = request
      .send({
        onResponseChunk: ({ text }) => {
          order.push(`chunk:${text}`);
          // The request must still be pending while chunks arrive
          expect(resolved).toBe(false);
          if (text.startsWith("first")) {
            gate.open();
          }
        },
        onResponse: () => {
          order.push("response");
        },
      })
      .then((response) => {
        resolved = true;
        return response;
      });

    const { data, error, status } = await promise;

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toBe("first|second|third");
    expect(order[0]).toBe("chunk:first|");
    expect(order.at(-1)).toBe("response");
    expect(
      order
        .filter((entry) => entry.startsWith("chunk:"))
        .map((entry) => entry.slice("chunk:".length))
        .join(""),
    ).toBe("first|second|third");
  });

  it("should fire plugin success and finished hooks after the last chunk", async () => {
    const order: string[] = [];
    const plugin = new Plugin({ name: "stream-observer" })
      .onResponseChunk(({ text }) => {
        order.push(`chunk:${text}`);
        if (text.startsWith("first")) {
          gate.open();
        }
      })
      .onRequestSuccess(() => {
        order.push("success");
      })
      .onRequestFinished(() => {
        order.push("finished");
      });
    const client = new Client({ url: baseUrl }).addPlugin(plugin);
    const request = client
      .createRequest<{ response: string }>()({ endpoint: "/gated" })
      .setOptions({ streaming: true });

    await request.send();

    const lastChunkIndex = order.findLastIndex((entry) => entry.startsWith("chunk:"));
    expect(lastChunkIndex).toBeGreaterThanOrEqual(0);
    expect(order.slice(lastChunkIndex + 1)).toEqual(["success", "finished"]);
  });

  it("should expose chunks through request hooks and request manager events with increasing index and loaded", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{ response: string }>()({ endpoint: "/gated" })
      .setOptions({ streaming: true });

    const fromHooks: number[] = [];
    const fromManager: { index: number; loaded: number; size: number }[] = [];

    request.$hooks.onResponseChunk(({ index }) => {
      fromHooks.push(index);
    });
    const unmount = client.requestManager.events.onResponseChunk(({ index, loaded, chunk }) => {
      fromManager.push({ index, loaded, size: chunk.byteLength });
      if (index === 0) {
        gate.open();
      }
    });

    await request.send();
    unmount();

    expect(fromHooks).toEqual(fromManager.map(({ index }) => index));
    expect(fromManager.map(({ index }) => index)).toEqual(fromManager.map((_, i) => i));
    let total = 0;
    fromManager.forEach(({ loaded, size }) => {
      total += size;
      expect(loaded).toBe(total);
    });
    expect(total).toBe(Buffer.byteLength("first|second|third"));
  });

  it("should decode multi-byte characters split across chunks", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: string }>()({ endpoint: "/utf8" }).setOptions({ streaming: true });

    const texts: string[] = [];
    const { data } = await request.send({
      onResponseChunk: ({ text, index }) => {
        texts.push(text);
        if (index === 0) {
          gate.open();
        }
      },
    });

    expect(texts.join("")).toBe("zażółć 🚀");
    expect(texts.join("")).not.toContain("�");
    expect(data).toBe("zażółć 🚀");
  });

  it("should parse JSON bodies after streaming them", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{ response: { items: number[] } }>()({ endpoint: "/json" })
      .setOptions({ streaming: true });

    const texts: string[] = [];
    const { data } = await request.send({ onResponseChunk: ({ text }) => texts.push(text) });

    expect(texts.join("")).toBe('{"items":[1,2,3]}');
    expect(data).toEqual({ items: [1, 2, 3] });
  });

  it("should abort mid-stream, stop emitting chunks and resolve with an abort error", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{ response: string }>()({ endpoint: "/hanging" })
      .setOptions({ streaming: true });

    const texts: string[] = [];
    const onSuccess = vi.fn();
    client.addPlugin(new Plugin({ name: "success-spy" }).onRequestSuccess(onSuccess));

    const { data, error } = await request.send({
      onResponseChunk: ({ text }) => {
        texts.push(text);
        request.abort();
      },
    });

    expect(texts).toEqual(["partial"]);
    expect(error).toBeInstanceOf(AbortError);
    expect(data).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
    // The underlying connection must be released, not left hanging
    await serverClosedConnection.promise;
  });

  it("should not emit chunks for error responses and should parse the error body", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{ response: string; error: { message: string } }>()({ endpoint: "/json-error" })
      .setOptions({ streaming: true });

    const onResponseChunk = vi.fn();
    const { error, status } = await request.send({ onResponseChunk });

    expect(status).toBe(422);
    expect(error).toEqual({ message: "nope" });
    expect(onResponseChunk).not.toHaveBeenCalled();
  });

  it("should not emit chunks when streaming is disabled", async () => {
    const client = new Client({ url: baseUrl });
    const request = client.createRequest<{ response: { items: number[] } }>()({ endpoint: "/json" });

    const onResponseChunk = vi.fn();
    const { data } = await request.send({ onResponseChunk });

    expect(data).toEqual({ items: [1, 2, 3] });
    expect(onResponseChunk).not.toHaveBeenCalled();
  });

  it("should stream and parse server-sent events sent in response to a POST request", async () => {
    const client = new Client({ url: baseUrl });
    const request = client
      .createRequest<{ response: string; payload: { prompt: string } }>()({ endpoint: "/sse", method: "POST" })
      .setOptions({ streaming: true });

    const events: ServerSentEventType[] = [];
    const comments: string[] = [];
    const parser = createSSEParser({
      onEvent: (event) => events.push(event),
      onComment: (comment) => comments.push(comment),
    });

    const { error } = await request.send({
      payload: { prompt: "hello streaming world" },
      onResponseChunk: ({ text }) => parser.feed(text),
    });
    parser.flush();

    expect(error).toBeNull();
    expect(comments).toEqual(["keep-alive"]);
    expect(events.slice(0, 3)).toEqual([
      { event: "delta", id: "0", data: JSON.stringify({ word: "hello" }) },
      { event: "delta", id: "1", data: JSON.stringify({ word: "streaming" }) },
      { event: "delta", id: "2", data: JSON.stringify({ word: "world" }) },
    ]);
    // id persists like in EventSource
    expect(events[3]).toEqual({ event: "message", id: "2", data: "[DONE]" });
  });
});
