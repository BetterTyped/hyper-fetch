/**
 * @vitest-environment node
 */
import { AbortError, Client, TimeoutError } from "@hyper-fetch/core";

import {
  byteLength,
  createChunkRecorder,
  createDeferred,
  createSignal,
  createStreamServer,
} from "../utils/streaming.utils";

const server = createStreamServer();
let baseUrl: string;

beforeAll(async () => {
  baseUrl = await server.start();
});

afterEach(() => {
  vi.useRealTimers();
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

describe("E2E [ Streaming with core features ]", () => {
  const createStream = (client: Client, method: "GET" | "POST" = "POST") =>
    client
      .createRequest<{ response: string; error: { message: string } }>()({ endpoint: "/stream", method })
      .setOptions({ streaming: true });

  describe("when the streaming option is not enabled", () => {
    it.each([
      ["by default", undefined],
      ["with streaming: false", { streaming: false }],
    ] as const)("should not emit chunks %s", async (_name, options) => {
      const client = new Client({ url: baseUrl });
      const request = client.createRequest<{ response: string }>()({ endpoint: "/stream", method: "POST", options });
      const onResponseChunk = vi.fn();
      const onManagerChunk = vi.fn();
      client.requestManager.events.onResponseChunk(onManagerChunk);
      const progress = createSignal();
      let downloaded = 0;

      const response = request.send({
        onResponseChunk,
        onDownloadProgress: ({ loaded }) => {
          downloaded = loaded;
          progress.notify();
        },
      });
      const exchange = await server.next();
      await exchange.write("first|");
      await progress.until(() => downloaded >= 6);
      await exchange.end("second");
      const { data } = await response;

      expect(data).toBe("first|second");
      expect(onResponseChunk).not.toHaveBeenCalled();
      expect(onManagerChunk).not.toHaveBeenCalled();
    });

    it("should resolve with the same data as the streamed request", async () => {
      const client = new Client({ url: baseUrl });
      const body = JSON.stringify({ items: ["zażółć", "🚀"] });
      const plain = client.createRequest<{ response: unknown }>()({ endpoint: "/stream", method: "POST" });

      const plainResponse = plain.send();
      await respond(body);
      const streamedResponse = plain.setOptions({ streaming: true }).send();
      await respond(body);
      const [plainResult, streamedResult] = await Promise.all([plainResponse, streamedResponse]);

      expect(streamedResult.data).toEqual(plainResult.data);
      expect(streamedResult.status).toBe(plainResult.status);
      expect(streamedResult.success).toBe(plainResult.success);
      expect(streamedResult.extra).toEqual(plainResult.extra);
    });

    it("should emit chunks when the option is set while creating the request", async () => {
      const client = new Client({ url: baseUrl });
      const request = client.createRequest<{ response: string }>()({
        endpoint: "/stream",
        method: "POST",
        options: { streaming: true },
      });
      const recorder = createChunkRecorder();

      const response = request.send({ onResponseChunk: recorder.record });
      await respond("created with the option");
      await response;

      expect(recorder.text()).toBe("created with the option");
    });
  });

  describe("when the response is cached", () => {
    it("should store the full body in the cache only after the stream ended", async () => {
      // These tests run in Node, where the client would default to the server mode that only caches scoped requests
      const client = new Client({ url: baseUrl, mode: "client" });
      const request = createStream(client, "GET");
      const recorder = createChunkRecorder();

      const response = request.send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("first|");
      await recorder.untilLoaded(6);

      expect(client.cache.get(request.cacheKey)).toBeUndefined();

      await exchange.end("second");
      await response;

      expect(client.cache.get(request.cacheKey)?.data).toBe("first|second");
      expect(request.read()?.data).toBe("first|second");
    });

    it("should store the parsed JSON document in the cache", async () => {
      const client = new Client({ url: baseUrl, mode: "client" });
      const request = createStream(client, "GET");
      const recorder = createChunkRecorder();

      const response = request.send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write('{"items":[1,');
      await recorder.untilLoaded(12);
      await exchange.end("2,3]}");
      await response;

      expect(client.cache.get(request.cacheKey)?.data).toEqual({ items: [1, 2, 3] });
    });

    it("should answer from the cache without a request or chunks with the cache-first policy", async () => {
      const client = new Client({ url: baseUrl, mode: "client" });
      const request = createStream(client, "GET");

      const first = request.send();
      await respond("cached body");
      await first;
      const onResponseChunk = vi.fn();
      const second = await request.send({ cachePolicy: "cache-first", onResponseChunk });

      expect(second.data).toBe("cached body");
      expect(server.exchanges).toHaveLength(1);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should emit cache events only once the stream ended", async () => {
      const client = new Client({ url: baseUrl, mode: "client" });
      const request = createStream(client, "GET");
      const recorder = createChunkRecorder();
      const onCacheData = vi.fn();
      client.cache.events.onData(onCacheData);

      const response = request.send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("first|");
      await recorder.untilLoaded(6);
      expect(onCacheData).not.toHaveBeenCalled();
      await exchange.end("second");
      await response;

      expect(onCacheData).toHaveBeenCalledTimes(1);
      expect(onCacheData.mock.calls[0][0].data).toBe("first|second");
    });
  });

  describe("when the request is deduplicated", () => {
    it("should send one request and give both sends every chunk when they start together", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client, "GET");
      const first = createChunkRecorder();
      const second = createChunkRecorder();
      const onDeduplicated = vi.fn();
      client.requestManager.events.onDeduplicated(onDeduplicated);

      const firstResponse = request.send({ onResponseChunk: first.record });
      const secondResponse = request.send({ onResponseChunk: second.record });
      const exchange = await server.next();
      await exchange.write("a|");
      await second.untilLoaded(2);
      await exchange.end("b");
      const [firstResult, secondResult] = await Promise.all([firstResponse, secondResponse]);

      expect(server.exchanges).toHaveLength(1);
      expect(onDeduplicated).toHaveBeenCalledTimes(1);
      expect(firstResult.data).toBe("a|b");
      expect(secondResult.data).toBe("a|b");
      expect(first.chunks).toEqual(second.chunks);
      expect(first.text()).toBe("a|b");
    });

    it("should give a send that joins a running stream only the chunks that arrive after it joined", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client, "GET");
      const first = createChunkRecorder();
      const late = createChunkRecorder();

      const firstResponse = request.send({ onResponseChunk: first.record });
      const exchange = await server.next();
      await exchange.write("early|");
      await first.untilLoaded(6);
      const lateResponse = request.send({ onResponseChunk: late.record });
      await exchange.write("shared|");
      await late.untilCount(1);
      await exchange.end("end");
      const [firstResult, lateResult] = await Promise.all([firstResponse, lateResponse]);

      expect(server.exchanges).toHaveLength(1);
      expect(first.text()).toBe("early|shared|end");
      // The joined send missed "early|" - its index and loaded still describe the position in the whole body
      expect(late.chunks.map(({ text, index, loaded }) => [text, index, loaded])).toEqual([
        ["shared|", 1, 13],
        ["end", 2, 16],
      ]);
      // Both resolve with the complete body
      expect(firstResult.data).toBe("early|shared|end");
      expect(lateResult.data).toBe("early|shared|end");
    });

    it("should send separate requests when deduplication is turned off", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client, "GET").setDeduplicate(false);
      const first = createChunkRecorder();
      const second = createChunkRecorder();

      const firstResponse = request.send({ onResponseChunk: first.record });
      const firstExchange = await server.next();
      const secondResponse = request.send({ onResponseChunk: second.record });
      const secondExchange = await server.next();
      await firstExchange.end("one");
      await secondExchange.end("two");
      await Promise.all([firstResponse, secondResponse]);

      expect(first.text()).toBe("one");
      expect(second.text()).toBe("two");
    });
  });

  describe("when the request is queued", () => {
    it("should start the second stream only after the first one ended", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client).setQueued(true);
      const first = createChunkRecorder();
      const second = createChunkRecorder();
      const order: string[] = [];

      const firstResponse = request.send({
        onResponseChunk: (event) => {
          order.push(`first:${event.text}`);
          first.record(event);
        },
      });
      const secondResponse = request.send({
        onResponseChunk: (event) => {
          order.push(`second:${event.text}`);
          second.record(event);
        },
      });
      const firstExchange = await server.next();
      await firstExchange.write("a|");
      await first.untilLoaded(2);

      // The second request waits in the queue - it did not reach the server yet
      expect(server.exchanges).toHaveLength(1);
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(2);
      expect(client.submitDispatcher.getRunningRequests(request.queryKey)).toHaveLength(1);

      await firstExchange.end("b");
      await firstResponse;
      const secondExchange = await server.next();
      await secondExchange.end("c");
      const { data } = await secondResponse;

      expect(data).toBe("c");
      expect(order).toEqual(["first:a|", "first:b", "second:c"]);
      expect(second.chunks.map(({ index, loaded }) => [index, loaded])).toEqual([[0, 1]]);
    });

    it("should continue with the next stream after the running one was aborted", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client).setQueued(true);
      const first = createChunkRecorder();
      const second = createChunkRecorder();
      let firstId = "";

      const firstResponse = request.send({
        onBeforeSent: ({ requestId }) => {
          firstId = requestId;
        },
        onResponseChunk: first.record,
      });
      const secondResponse = request.send({ onResponseChunk: second.record });
      const firstExchange = await server.next();
      await firstExchange.write("partial");
      await first.untilLoaded(7);
      client.requestManager.abortByRequestId(request.abortKey, firstId);
      const firstResult = await firstResponse;
      const secondExchange = await server.next();
      await secondExchange.end("next");
      const secondResult = await secondResponse;

      expect(firstResult.error).toBeInstanceOf(AbortError);
      expect(secondResult.data).toBe("next");
      expect(second.text()).toBe("next");
    });
  });

  describe("when the request is cancelable", () => {
    it("should abort the running stream when the request is sent again", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client).setCancelable(true);
      const first = createChunkRecorder();
      const second = createChunkRecorder();

      const firstResponse = request.send({ onResponseChunk: first.record });
      const firstExchange = await server.next();
      await firstExchange.write("old|");
      await first.untilLoaded(4);
      const secondResponse = request.send({ onResponseChunk: second.record });
      const firstResult = await firstResponse;
      await firstExchange.closed;
      const secondExchange = await server.next();
      await secondExchange.write("new|");
      await second.untilLoaded(4);
      await secondExchange.end("stream");
      const secondResult = await secondResponse;

      expect(firstResult.data).toBeNull();
      expect(firstResult.success).toBe(false);
      expect(firstExchange.wasDropped()).toBe(true);
      expect(first.text()).toBe("old|");
      expect(secondResult.data).toBe("new|stream");
      expect(second.chunks.map(({ text, index }) => [text, index])).toEqual([
        ["new|", 0],
        ["stream", 1],
      ]);
    });
  });

  describe("when the application is offline", () => {
    it("should hold the stream until the network is back", async () => {
      const client = new Client({ url: baseUrl });
      client.appManager.setOnline(false);
      const request = createStream(client);
      const recorder = createChunkRecorder();
      const onRequestStart = vi.fn();
      let resolved = false;

      const response = request.send({ onResponseChunk: recorder.record, onRequestStart }).then((result) => {
        resolved = true;
        return result;
      });

      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
      expect(client.submitDispatcher.hasRunningRequests(request.queryKey)).toBe(false);
      expect(onRequestStart).not.toHaveBeenCalled();
      expect(resolved).toBe(false);

      client.appManager.setOnline(true);
      const exchange = await server.next();
      await exchange.end("online again");
      const { data } = await response;

      expect(server.exchanges).toHaveLength(1);
      expect(data).toBe("online again");
      expect(recorder.text()).toBe("online again");
    });

    it("should stream again from the start when the connection is lost while offline", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const recorder = createChunkRecorder();
      const onRequestStart = vi.fn();
      const onResponse = vi.fn();
      const failed = createDeferred();
      client.requestManager.events.onResponse(({ response }) => {
        if (!response.success) {
          failed.resolve();
        }
      });

      const response = request.send({ onResponseChunk: recorder.record, onRequestStart, onResponse });
      const broken = await server.next();
      await broken.write("lost|");
      await recorder.untilLoaded(5);
      client.appManager.setOnline(false);
      broken.destroy();
      await failed.promise;

      // The failed attempt is kept for later instead of being reported
      expect(onResponse).not.toHaveBeenCalled();
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(1);

      client.appManager.setOnline(true);
      const retried = await server.next();
      await retried.end("recovered");
      const { data, success } = await response;

      expect(success).toBe(true);
      expect(data).toBe("recovered");
      expect(onRequestStart).toHaveBeenCalledTimes(2);
      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(recorder.chunks.map(({ text, index, loaded }) => [text, index, loaded])).toEqual([
        ["lost|", 0, 5],
        ["recovered", 0, 9],
      ]);
    });
  });

  describe("when download progress is tracked", () => {
    it("should report the progress of a chunk right before the chunk", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const order: string[] = [];

      const response = createStream(client).send({
        onDownloadProgress: ({ loaded }) => order.push(`progress:${loaded}`),
        onResponseChunk: (event) => {
          order.push(`chunk:${event.loaded}`);
          recorder.record(event);
        },
      });
      const exchange = await server.next();
      await exchange.write("abc");
      await recorder.untilLoaded(3);
      await exchange.end("de");
      await response;

      expect(order.indexOf("progress:3")).toBe(order.indexOf("chunk:3") - 1);
      expect(order.indexOf("progress:5")).toBe(order.indexOf("chunk:5") - 1);
    });

    it("should report the same loaded bytes as the chunks and the content length as the total", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const progress: { loaded: number; total: number; progress: number }[] = [];

      const response = createStream(client).send({
        onDownloadProgress: (event) =>
          progress.push({ loaded: event.loaded, total: event.total, progress: event.progress }),
        onResponseChunk: recorder.record,
      });
      const exchange = await server.next();
      exchange.head(200, { "Content-Type": "text/plain", "Content-Length": "8" });
      await exchange.write("ab");
      await recorder.untilLoaded(2);
      await exchange.write("cd");
      await recorder.untilLoaded(4);
      await exchange.end("efgh");
      await response;

      expect(progress).toEqual([
        // Response start
        { loaded: 0, total: 1, progress: 0 },
        { loaded: 2, total: 8, progress: 25 },
        { loaded: 4, total: 8, progress: 50 },
        // The response end repeats the last progress, so it is not reported again
        { loaded: 8, total: 8, progress: 100 },
      ]);
    });

    it("should use the bytes received so far as the total when the content length is unknown", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const progress: { loaded: number; total: number }[] = [];

      const response = createStream(client).send({
        onDownloadProgress: ({ loaded, total }) => progress.push({ loaded, total }),
        onResponseChunk: recorder.record,
      });
      const exchange = await server.next();
      await exchange.write("abc");
      await recorder.untilLoaded(3);
      await exchange.end("de");
      await response;

      expect(progress).toEqual([
        { loaded: 0, total: 1 },
        { loaded: 3, total: 3 },
        { loaded: 5, total: 5 },
      ]);
    });
  });

  describe("when a timeout is set", () => {
    it("should time out when the headers do not arrive in time", async () => {
      // Only the adapter's timeout timer is faked - the network keeps running on real timers
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const client = new Client({ url: baseUrl });
      const request = createStream(client).setOptions({ streaming: true, timeout: 1000 });
      const onResponseChunk = vi.fn();

      const response = request.send({ onResponseChunk });
      const exchange = await server.next();
      vi.advanceTimersByTime(1000);
      const { data, error, status } = await response;
      await exchange.closed;

      expect(error).toBeInstanceOf(TimeoutError);
      expect(data).toBeNull();
      expect(status).toBe(0);
      expect(exchange.wasDropped()).toBe(true);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should not time out a stream that is still running after the timeout, once the headers arrived", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const client = new Client({ url: baseUrl });
      const request = createStream(client).setOptions({ streaming: true, timeout: 1000 });
      const recorder = createChunkRecorder();

      const response = request.send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("slow|");
      await recorder.untilLoaded(5);
      // The timeout only guards the wait for the headers: a long answer may take much longer
      vi.advanceTimersByTime(60_000);
      await exchange.end("answer");
      const { data, error } = await response;

      expect(error).toBeNull();
      expect(data).toBe("slow|answer");
      expect(exchange.wasDropped()).toBe(false);
    });
  });

  describe("when the response is modified", () => {
    it("should run response interceptors on the full body after the last chunk", async () => {
      const order: string[] = [];
      const client = new Client({ url: baseUrl }).onResponse((response) => {
        order.push("interceptor");
        return { ...response, data: `${response.data}!` };
      });
      const recorder = createChunkRecorder();

      const response = createStream(client).send({
        onResponseChunk: (event) => {
          order.push(`chunk:${event.text}`);
          recorder.record(event);
        },
      });
      const exchange = await server.next();
      await exchange.write("a");
      await recorder.untilLoaded(1);
      await exchange.end("b");
      const { data } = await response;

      expect(order).toEqual(["chunk:a", "chunk:b", "interceptor"]);
      expect(recorder.text()).toBe("ab");
      expect(data).toBe("ab!");
    });

    it("should map the resolved response without touching the chunks", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client).setResponseMapper(
        (response) =>
          ({ ...response, data: response.data ? response.data.toUpperCase() : response.data }) as typeof response,
      );
      const recorder = createChunkRecorder();

      const response = request.send({ onResponseChunk: recorder.record });
      await respond("mapped");
      const { data } = await response;

      expect(recorder.text()).toBe("mapped");
      expect(data).toBe("MAPPED");
    });
  });

  describe("when the request carries a payload and headers", () => {
    it("should send them and stream the answer", async () => {
      const client = new Client({ url: baseUrl });
      const request = client
        .createRequest<{ response: string; payload: { prompt: string } }>()({ endpoint: "/chat", method: "POST" })
        .setOptions({ streaming: true })
        .setHeaders({ Authorization: "Bearer test-token" });
      const recorder = createChunkRecorder();

      const response = request.send({ payload: { prompt: "zażółć" }, onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.end(`echo: ${JSON.parse(exchange.body.toString()).prompt}`);
      const { data } = await response;

      expect(exchange.path).toBe("/chat");
      expect(exchange.headers.authorization).toBe("Bearer test-token");
      expect(recorder.loaded()).toBe(byteLength("echo: zażółć"));
      expect(data).toBe("echo: zażółć");
    });
  });
});
