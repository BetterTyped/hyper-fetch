/**
 * @vitest-environment node
 */
import { Client, Plugin, createNDJSONParser, createSSEParser } from "@hyper-fetch/core";
import type { ServerSentEventType } from "@hyper-fetch/core";
import zlib from "zlib";

import {
  byteLength,
  createChunkRecorder,
  createSignal,
  createStreamServer,
  hex,
  sameBytes,
} from "../utils/streaming.utils";

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

/** Collects raw chunks without copying them into number arrays - for bodies of a few megabytes. */
const createByteCollector = () => {
  const signal = createSignal();
  const parts: Uint8Array[] = [];
  const texts: string[] = [];
  let loaded = 0;
  let indexes = 0;
  let ordered = true;

  return {
    record: (event: { chunk: Uint8Array; text: string; index: number; loaded: number }) => {
      ordered = ordered && event.index === indexes && event.loaded === loaded + event.chunk.byteLength;
      indexes += 1;
      loaded = event.loaded;
      parts.push(event.chunk);
      texts.push(event.text);
      signal.notify();
    },
    bytes: () => Buffer.concat(parts),
    text: () => texts.join(""),
    count: () => parts.length,
    loaded: () => loaded,
    /** True when every chunk had the next index and a loaded value grown by exactly its size */
    isOrdered: () => ordered,
    untilLoaded: (bytes: number) => signal.until(() => loaded >= bytes),
  };
};

describe("E2E [ Streaming bodies ]", () => {
  const createStream = <Response = string>(client: Client, method: "GET" | "POST" = "POST") =>
    client
      .createRequest<{ response: Response; error: { message: string } | string }>()({ endpoint: "/stream", method })
      .setOptions({ streaming: true });

  describe("when the response has an error status", () => {
    it.each([400, 401, 404, 422, 500, 503])(
      "should not emit chunks for status %i and parse the error",
      async (code) => {
        const client = new Client({ url: baseUrl });
        const onPluginChunk = vi.fn();
        client.addPlugin(new Plugin({ name: "error" }).onResponseChunk(onPluginChunk));
        const onManagerChunk = vi.fn();
        client.requestManager.events.onResponseChunk(onManagerChunk);
        const request = createStream(client);
        const onHookChunk = vi.fn();
        request.$hooks.onResponseChunk(onHookChunk);
        const onResponseChunk = vi.fn();

        const response = request.send({ onResponseChunk });
        const exchange = await server.next();
        exchange.head(code, { "Content-Type": "application/json" });
        await exchange.end(JSON.stringify({ message: `failed with ${code}` }));
        const { data, error, status, success } = await response;

        expect(success).toBe(false);
        expect(status).toBe(code);
        expect(data).toBeNull();
        expect(error).toEqual({ message: `failed with ${code}` });
        expect(onResponseChunk).not.toHaveBeenCalled();
        expect(onHookChunk).not.toHaveBeenCalled();
        expect(onManagerChunk).not.toHaveBeenCalled();
        expect(onPluginChunk).not.toHaveBeenCalled();
      },
    );

    it("should read an error body that arrives in several pieces", async () => {
      const client = new Client({ url: baseUrl });
      const onResponseChunk = vi.fn();
      const progress = createSignal();
      let downloaded = 0;

      const response = createStream(client).send({
        onResponseChunk,
        onDownloadProgress: ({ loaded }) => {
          downloaded = loaded;
          progress.notify();
        },
      });
      const exchange = await server.next();
      exchange.head(500, { "Content-Type": "application/json" });
      await exchange.write('{"message":');
      await progress.until(() => downloaded >= 11);
      await exchange.end('"split error"}');
      const { error, status } = await response;

      expect(status).toBe(500);
      expect(error).toEqual({ message: "split error" });
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should keep a plain text error body as text", async () => {
      const client = new Client({ url: baseUrl });
      const onResponseChunk = vi.fn();

      const response = createStream(client).send({ onResponseChunk });
      const exchange = await server.next();
      exchange.head(502);
      await exchange.end("Bad Gateway");
      const { error, status } = await response;

      expect(status).toBe(502);
      expect(error).toBe("Bad Gateway");
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should resolve with an error for an error status without a body", async () => {
      const client = new Client({ url: baseUrl });
      const onResponseChunk = vi.fn();

      const response = createStream(client).send({ onResponseChunk });
      const exchange = await server.next();
      exchange.head(500);
      await exchange.end();
      const { data, error, status, success } = await response;

      expect(success).toBe(false);
      expect(status).toBe(500);
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });
  });

  describe("when the body is empty", () => {
    it("should resolve a 200 response without emitting chunks", async () => {
      const client = new Client({ url: baseUrl });
      const onResponseChunk = vi.fn();
      const onResponseStart = vi.fn();

      const response = createStream(client).send({ onResponseChunk, onResponseStart });
      const exchange = await server.next();
      await exchange.end();
      const { data, error, status, success } = await response;

      expect(success).toBe(true);
      expect(status).toBe(200);
      expect(error).toBeNull();
      expect(data).toBe("");
      expect(onResponseStart).toHaveBeenCalledTimes(1);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should resolve a 200 response with a zero content length without emitting chunks", async () => {
      const client = new Client({ url: baseUrl });
      const onResponseChunk = vi.fn();

      const response = createStream(client).send({ onResponseChunk });
      const exchange = await server.next();
      exchange.head(200, { "Content-Length": "0" });
      await exchange.end();
      const { data, success } = await response;

      expect(success).toBe(true);
      expect(data).toBe("");
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should resolve a 204 response without emitting chunks", async () => {
      const client = new Client({ url: baseUrl });
      const onResponseChunk = vi.fn();

      const response = createStream(client).send({ onResponseChunk });
      const exchange = await server.next();
      exchange.head(204, {});
      await exchange.end();
      const { data, error, status, success } = await response;

      expect(success).toBe(true);
      expect(status).toBe(204);
      expect(error).toBeNull();
      expect(data).toBe("");
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should still report the download as finished", async () => {
      const client = new Client({ url: baseUrl });
      const progress: number[] = [];

      const response = createStream(client).send({ onDownloadProgress: (event) => progress.push(event.progress) });
      const exchange = await server.next();
      await exchange.end();
      await response;

      expect(progress.at(-1)).toBe(100);
    });
  });

  describe("when the body has a content length", () => {
    it("should emit chunks for a body sent in one piece", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const body = JSON.stringify({ items: [1, 2, 3] });

      const response = createStream<{ items: number[] }>(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      exchange.head(200, { "Content-Type": "application/json", "Content-Length": String(byteLength(body)) });
      await exchange.end(body);
      const { data } = await response;

      expect(recorder.text()).toBe(body);
      expect(recorder.loaded()).toBe(byteLength(body));
      expect(data).toEqual({ items: [1, 2, 3] });
    });

    it("should emit chunks for a body sent in several pieces", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      exchange.head(200, { "Content-Type": "text/plain", "Content-Length": "9" });
      await exchange.write("abc");
      await recorder.untilLoaded(3);
      await exchange.write("def");
      await recorder.untilLoaded(6);
      await exchange.end("ghi");
      const { data } = await response;

      expect(recorder.chunks.map(({ text, loaded }) => [text, loaded])).toEqual([
        ["abc", 3],
        ["def", 6],
        ["ghi", 9],
      ]);
      expect(data).toBe("abcdefghi");
    });
  });

  describe("when the body is JSON", () => {
    it("should emit the raw text and resolve with the parsed document", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();

      const response = createStream<{ user: { name: string } }>(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      exchange.head(200, { "Content-Type": "application/json" });
      await exchange.write('{"user":{"na');
      await recorder.untilLoaded(12);
      await exchange.end('me":"Zażółć"}}');
      const { data } = await response;

      expect(recorder.chunks[0].text).toBe('{"user":{"na');
      expect(recorder.text()).toBe('{"user":{"name":"Zażółć"}}');
      expect(data).toEqual({ user: { name: "Zażółć" } });
    });
  });

  describe("when the body is delivered byte by byte", () => {
    it("should emit one chunk per byte and still decode the text", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const text = "zażółć 🚀 €";
      const bytes = Buffer.from(text, "utf8");

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      for (let position = 0; position < bytes.length; position += 1) {
        // eslint-disable-next-line no-await-in-loop
        await exchange.write(bytes.subarray(position, position + 1));
        // eslint-disable-next-line no-await-in-loop
        await recorder.untilLoaded(position + 1);
      }
      await exchange.end();
      const { data } = await response;

      expect(recorder.chunks).toHaveLength(bytes.length);
      expect(recorder.chunks.every(({ bytes: chunk }) => chunk.length === 1)).toBe(true);
      expect(recorder.chunks.map(({ loaded }) => loaded)).toEqual(recorder.chunks.map((_, position) => position + 1));
      expect(recorder.text()).toBe(text);
      expect(recorder.text()).not.toContain("�");
      expect(data).toBe(text);
    });
  });

  describe("when multi-byte characters are split between chunks", () => {
    const samples = [
      ["polish diacritics", "Zażółć gęślą jaźń"],
      ["a three-byte character", "10 € only"],
      ["an emoji", "launch 🚀 now"],
      ["a joined emoji sequence", "family 👨‍👩‍👧‍👦 here"],
      ["a surrogate pair outside the emoji range", "clef 𝄞 sign"],
    ] as const;

    it.each(samples)("should decode %s split at every byte position", async (_name, sample) => {
      const client = new Client({ url: baseUrl });
      const bytes = Buffer.from(sample, "utf8");

      for (let position = 1; position < bytes.length; position += 1) {
        const recorder = createChunkRecorder();
        const response = createStream(client).send({ onResponseChunk: recorder.record });
        // eslint-disable-next-line no-await-in-loop
        const exchange = await server.next();
        // eslint-disable-next-line no-await-in-loop
        await exchange.write(bytes.subarray(0, position));
        // eslint-disable-next-line no-await-in-loop
        await recorder.untilLoaded(position);
        // eslint-disable-next-line no-await-in-loop
        await exchange.end(bytes.subarray(position));
        // eslint-disable-next-line no-await-in-loop
        const { data } = await response;

        expect(recorder.text()).toBe(sample);
        expect(recorder.text()).not.toContain("�");
        expect(recorder.bytes()).toEqual([...bytes]);
        expect(data).toBe(sample);
      }
    });

    it("should emit an empty text for a chunk that only holds the beginning of a character", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const rocket = Buffer.from("🚀", "utf8");

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write(rocket.subarray(0, 2));
      await recorder.untilLoaded(2);
      await exchange.end(rocket.subarray(2));
      await response;

      expect(recorder.chunks.map(({ text, loaded }) => [text, loaded])).toEqual([
        ["", 2],
        ["🚀", 4],
      ]);
    });

    it("should emit the same text as the resolved data when the body ends in the middle of a character", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("cut ");
      await recorder.untilLoaded(4);
      // The body ends after the first two bytes of a four-byte emoji
      await exchange.end(hex("f0 9f"));
      const { data } = await response;

      expect(data).toBe("cut �");
      expect(recorder.text()).toBe(data);
      expect(recorder.chunks.at(-1)).toEqual({ text: "�", bytes: [], index: 2, loaded: 6 });
    });
  });

  describe("when the body is binary", () => {
    it("should deliver every byte value untouched", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const bytes = Uint8Array.from({ length: 256 }, (_, value) => value);

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      exchange.head(200, { "Content-Type": "application/octet-stream" });
      await exchange.write(bytes.subarray(0, 100));
      await recorder.untilLoaded(100);
      await exchange.end(bytes.subarray(100));
      await response;

      expect(recorder.bytes()).toEqual([...bytes]);
      expect(recorder.loaded()).toBe(256);
    });

    it("should keep the chunk texts equal to the decoded body even when it is not valid UTF-8", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      // PNG signature, invalid sequences and a character cut off at the very end
      const bytes = hex("89 50 4e 47 0d 0a 1a 0a ff fe c3 28 e2 82");

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      exchange.head(200, { "Content-Type": "application/octet-stream" });
      await exchange.write(bytes.subarray(0, 11));
      await recorder.untilLoaded(11);
      await exchange.end(bytes.subarray(11));
      const { data } = await response;

      expect(recorder.bytes()).toEqual([...bytes]);
      expect(recorder.text()).toBe(new TextDecoder().decode(bytes));
      expect(recorder.text()).toBe(data);
    });
  });

  describe("when the body is very large", () => {
    it("should deliver a body of several megabytes in order", async () => {
      const client = new Client({ url: baseUrl });
      const collector = createByteCollector();
      const size = 4 * 1024 * 1024;
      const body = Buffer.alloc(size);
      for (let position = 0; position < size; position += 1) {
        body[position] = 97 + (position % 26);
      }

      const response = createStream(client).send({ onResponseChunk: collector.record });
      const exchange = await server.next();
      await exchange.end(body);
      const { data, success } = await response;

      expect(success).toBe(true);
      expect(collector.loaded()).toBe(size);
      expect(collector.count()).toBeGreaterThan(1);
      expect(collector.isOrdered()).toBe(true);
      expect(sameBytes(collector.bytes(), body)).toBe(true);
      expect((data as string).length).toBe(size);
      expect(data === collector.text()).toBe(true);
    });

    it("should decode a large body full of multi-byte characters wherever the network splits it", async () => {
      const client = new Client({ url: baseUrl });
      const collector = createByteCollector();
      const text = "Zażółć gęślą jaźń 🚀 日本語 👨‍👩‍👧‍👦 € ".repeat(20_000);
      const body = Buffer.from(text, "utf8");

      const response = createStream(client).send({ onResponseChunk: collector.record });
      const exchange = await server.next();
      await exchange.end(body);
      const { data } = await response;

      expect(collector.count()).toBeGreaterThan(1);
      expect(collector.loaded()).toBe(body.length);
      expect(collector.isOrdered()).toBe(true);
      expect(collector.text() === text).toBe(true);
      expect(collector.text().includes("�")).toBe(false);
      expect(data === text).toBe(true);
    });

    it("should deliver many small chunks in order", async () => {
      const client = new Client({ url: baseUrl });
      const collector = createByteCollector();
      const lines = Array.from({ length: 2000 }, (_, line) => `${JSON.stringify({ line, text: "żółw 🐢" })}\n`);
      const values: { line: number }[] = [];
      const parser = createNDJSONParser<{ line: number }>({ onValue: (value) => values.push(value) });

      const response = createStream(client).send({
        onResponseChunk: (event) => {
          collector.record(event);
          parser.feed(event.text);
        },
      });
      const exchange = await server.next();
      for (const line of lines) {
        // Not awaited one by one on purpose: the server pushes as fast as it can
        exchange.write(line);
      }
      await exchange.end();
      await response;
      parser.flush();

      expect(collector.isOrdered()).toBe(true);
      expect(collector.text() === lines.join("")).toBe(true);
      expect(values).toHaveLength(2000);
      expect(values.map(({ line }) => line)).toEqual(lines.map((_, line) => line));
    });
  });

  describe("when the body is compressed", () => {
    it("should emit the decompressed bytes and text", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const text = "compressed zażółć 🚀 ".repeat(50);

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      exchange.head(200, { "Content-Type": "text/plain; charset=utf-8", "Content-Encoding": "gzip" });
      await exchange.end(zlib.gzipSync(text));
      const { data } = await response;

      expect(recorder.text()).toBe(text);
      expect(recorder.loaded()).toBe(byteLength(text));
      expect(data).toBe(text);
    });
  });

  describe("when the body is an event stream", () => {
    it("should parse server-sent events split in the middle of lines and characters", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const events: ServerSentEventType[] = [];
      const parser = createSSEParser({ onEvent: (event) => events.push(event) });
      const body = Buffer.from(
        'event: delta\ndata: {"text":"Zażółć"}\n\nevent: delta\ndata: {"text":"🚀"}\n\ndata: [DONE]\n\n',
        "utf8",
      );
      // In the middle of "event", inside "ż", inside the emoji, inside the last event
      const cuts = [3, body.indexOf("ż") + 1, body.indexOf("🚀") + 2, body.length - 6];

      const response = createStream(client).send({
        onResponseChunk: (event) => {
          parser.feed(event.text);
          recorder.record(event);
        },
      });
      const exchange = await server.next();
      exchange.head(200, { "Content-Type": "text/event-stream" });
      let start = 0;
      for (const cut of cuts) {
        // eslint-disable-next-line no-await-in-loop
        await exchange.write(body.subarray(start, cut));
        // eslint-disable-next-line no-await-in-loop
        await recorder.untilLoaded(cut);
        start = cut;
      }
      await exchange.end(body.subarray(start));
      await response;
      parser.flush();

      expect(events).toEqual([
        { event: "delta", data: '{"text":"Zażółć"}', id: "" },
        { event: "delta", data: '{"text":"🚀"}', id: "" },
        { event: "message", data: "[DONE]", id: "" },
      ]);
    });

    it("should parse newline-delimited JSON split in the middle of values", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const values: unknown[] = [];
      const parser = createNDJSONParser({ onValue: (value) => values.push(value) });

      const response = createStream(client).send({
        onResponseChunk: (event) => {
          parser.feed(event.text);
          recorder.record(event);
        },
      });
      const exchange = await server.next();
      exchange.head(200, { "Content-Type": "application/x-ndjson" });
      await exchange.write('{"n":1}\n{"n"');
      await recorder.untilLoaded(12);
      expect(values).toEqual([{ n: 1 }]);
      await exchange.write(':2}\n{"text":"ż');
      await recorder.untilLoaded(27);
      expect(values).toEqual([{ n: 1 }, { n: 2 }]);
      await exchange.end('ółw"}');
      await response;
      parser.flush();

      expect(values).toEqual([{ n: 1 }, { n: 2 }, { text: "żółw" }]);
    });
  });

  describe("when a GET request is streamed", () => {
    it("should emit chunks the same way as for other methods", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();

      const response = createStream(client, "GET").send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("a");
      await recorder.untilLoaded(1);
      await exchange.end("b");
      const { data } = await response;

      expect(exchange.method).toBe("GET");
      expect(recorder.text()).toBe("ab");
      expect(data).toBe("ab");
    });
  });
});
