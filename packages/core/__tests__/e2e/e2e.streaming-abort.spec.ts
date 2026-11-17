/**
 * @vitest-environment node
 */
import { AbortError, Client, Plugin } from "@hyper-fetch/core";
import type { RequestInstance } from "@hyper-fetch/core";

import { createChunkRecorder, createDeferred, createStreamServer } from "../utils/streaming.utils";

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

describe("E2E [ Streaming abort ]", () => {
  const createStream = (client: Client, endpoint = "/stream") =>
    client.createRequest<{ response: string }>()({ endpoint, method: "POST" }).setOptions({ streaming: true });

  const abortWays = [
    ["request.abort()", (request: RequestInstance) => request.abort()],
    ["abortByKey", (request: RequestInstance) => request.client.requestManager.abortByKey(request.abortKey)],
    [
      "abortByRequestId",
      (request: RequestInstance, requestId: string) =>
        request.client.requestManager.abortByRequestId(request.abortKey, requestId),
    ],
    ["abortAll", (request: RequestInstance) => request.client.requestManager.abortAll()],
  ] as const;

  describe.each(abortWays)("when the stream is aborted with %s", (_name, abort) => {
    it("should resolve with the abort error in the middle of the body", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const recorder = createChunkRecorder();
      let requestId = "";

      const response = request.send({
        onBeforeSent: (event) => {
          requestId = event.requestId;
        },
        onResponseChunk: recorder.record,
      });
      const exchange = await server.next();
      await exchange.write("partial");
      await recorder.untilLoaded(7);
      abort(request, requestId);
      const { data, error, status, success } = await response;

      expect(error).toBeInstanceOf(AbortError);
      expect(data).toBeNull();
      expect(status).toBe(0);
      expect(success).toBe(false);
      expect(recorder.text()).toBe("partial");
    });

    it("should close the connection to the server", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const recorder = createChunkRecorder();
      let requestId = "";

      const response = request.send({
        onBeforeSent: (event) => {
          requestId = event.requestId;
        },
        onResponseChunk: recorder.record,
      });
      const exchange = await server.next();
      await exchange.write("partial");
      await recorder.untilLoaded(7);
      expect(exchange.isClosed()).toBe(false);

      abort(request, requestId);
      await response;
      await exchange.closed;

      expect(exchange.wasDropped()).toBe(true);
    });

    it("should not deliver any chunk after the abort", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const recorder = createChunkRecorder();
      const afterAbort = vi.fn();
      let aborted = false;
      client.requestManager.events.onResponseChunk(() => {
        if (aborted) {
          afterAbort();
        }
      });

      const response = request.send({
        onResponseChunk: (event) => {
          recorder.record(event);
          aborted = true;
          abort(request, event.requestId);
        },
      });
      const exchange = await server.next();
      // More than one chunk is on its way when the first one is handled
      await exchange.write("one|");
      await exchange.write("two|");
      await exchange.write("three|");
      await response;
      await exchange.closed;

      expect(recorder.chunks).toHaveLength(1);
      expect(afterAbort).not.toHaveBeenCalled();
    });
  });

  describe("when the stream is aborted", () => {
    it("should emit the abort event once and call the error plugin methods once", async () => {
      const client = new Client({ url: baseUrl });
      const onRequestSuccess = vi.fn();
      const onRequestError = vi.fn();
      const onRequestFinished = vi.fn();
      client.addPlugin(
        new Plugin({ name: "abort" })
          .onRequestSuccess(onRequestSuccess)
          .onRequestError(onRequestError)
          .onRequestFinished(onRequestFinished),
      );
      const onAbort = vi.fn();
      client.requestManager.events.onAbort(onAbort);
      const request = createStream(client);
      const recorder = createChunkRecorder();
      const onResponse = vi.fn();

      const response = request.send({ onResponseChunk: recorder.record, onResponse });
      const exchange = await server.next();
      await exchange.write("partial");
      await recorder.untilLoaded(7);
      request.abort();
      await response;
      await exchange.closed;

      expect(onAbort).toHaveBeenCalledTimes(1);
      expect(onRequestSuccess).not.toHaveBeenCalled();
      expect(onRequestError).toHaveBeenCalledTimes(1);
      expect(onRequestFinished).toHaveBeenCalledTimes(1);
      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(onResponse.mock.calls[0][0].details.isCanceled).toBe(true);
    });

    it("should not deliver the chunk that arrived together with an abort made in the download progress callback", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const recorder = createChunkRecorder();
      const progressed = createDeferred();

      const response = request.send({
        onResponseChunk: recorder.record,
        onDownloadProgress: ({ loaded }) => {
          // The progress of a chunk is reported right before the chunk itself
          if (loaded === 7) {
            request.abort();
            progressed.resolve();
          }
        },
      });
      const exchange = await server.next();
      await exchange.write("partial");
      await progressed.promise;
      const { error } = await response;

      expect(error).toBeInstanceOf(AbortError);
      expect(recorder.chunks).toHaveLength(0);
    });

    it("should resolve with the abort error before the response headers arrive", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const onResponseStart = vi.fn();
      const onResponseChunk = vi.fn();

      const response = request.send({ onResponseStart, onResponseChunk });
      const exchange = await server.next();
      request.abort();
      const { error, status } = await response;
      await exchange.closed;

      expect(error).toBeInstanceOf(AbortError);
      expect(status).toBe(0);
      expect(exchange.wasDropped()).toBe(true);
      expect(onResponseStart).not.toHaveBeenCalled();
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should resolve with the abort error between the headers and the first chunk", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const responseStarted = createDeferred();
      const onResponseChunk = vi.fn();

      const response = request.send({ onResponseStart: () => responseStarted.resolve(), onResponseChunk });
      const exchange = await server.next();
      exchange.head();
      await responseStarted.promise;
      request.abort();
      const { error } = await response;
      await exchange.closed;

      expect(error).toBeInstanceOf(AbortError);
      expect(exchange.wasDropped()).toBe(true);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should resolve with the abort error when aborted in the response start callback", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const onResponseChunk = vi.fn();

      const response = request.send({ onResponseStart: () => request.abort(), onResponseChunk });
      const exchange = await server.next();
      await exchange.write("never delivered");
      const { error } = await response;
      await exchange.closed;

      expect(error).toBeInstanceOf(AbortError);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should resolve with the abort error after the last chunk while the response is still open", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const recorder = createChunkRecorder();

      const response = request.send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("everything");
      await recorder.untilLoaded(10);
      request.abort();
      const { data, error } = await response;
      await exchange.closed;

      // The server never finished the response, so it does not count as complete
      expect(error).toBeInstanceOf(AbortError);
      expect(data).toBeNull();
      expect(exchange.wasDropped()).toBe(true);
    });

    it("should do nothing when aborted after the request resolved", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const onAbort = vi.fn();
      client.requestManager.events.onAbort(onAbort);
      const onResponse = vi.fn();
      let requestId = "";

      const response = request.send({
        onBeforeSent: (event) => {
          requestId = event.requestId;
        },
        onResponse,
      });
      const exchange = await server.next();
      await exchange.end("complete");
      const { data, error } = await response;
      await exchange.closed;

      request.abort();
      client.requestManager.abortByRequestId(request.abortKey, requestId);
      client.requestManager.abortAll();

      expect(data).toBe("complete");
      expect(error).toBeNull();
      expect(exchange.wasDropped()).toBe(false);
      expect(onAbort).not.toHaveBeenCalled();
      expect(onResponse).toHaveBeenCalledTimes(1);
    });

    it("should not store the partial body in the cache", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const recorder = createChunkRecorder();

      const response = request.send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("partial");
      await recorder.untilLoaded(7);
      request.abort();
      await response;

      expect(client.cache.get(request.cacheKey)?.data ?? null).toBeNull();
    });

    it("should only abort the stream with the given request id", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const stopped = createChunkRecorder();
      const running = createChunkRecorder();
      let stoppedId = "";

      const stoppedResponse = request.send({
        onBeforeSent: (event) => {
          stoppedId = event.requestId;
        },
        onResponseChunk: stopped.record,
      });
      const stoppedExchange = await server.next();
      const runningResponse = request.send({ onResponseChunk: running.record });
      const runningExchange = await server.next();
      await stoppedExchange.write("a");
      await stopped.untilLoaded(1);
      await runningExchange.write("b");
      await running.untilLoaded(1);

      client.requestManager.abortByRequestId(request.abortKey, stoppedId);
      const stoppedResult = await stoppedResponse;
      await stoppedExchange.closed;
      await runningExchange.end("c");
      const runningResult = await runningResponse;

      expect(stoppedResult.error).toBeInstanceOf(AbortError);
      expect(stoppedExchange.wasDropped()).toBe(true);
      expect(runningResult.error).toBeNull();
      expect(runningResult.data).toBe("bc");
      expect(runningExchange.wasDropped()).toBe(false);
    });

    it("should abort every stream sharing the abort key", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);

      const firstResponse = request.send();
      const firstExchange = await server.next();
      const secondResponse = request.send();
      const secondExchange = await server.next();
      firstExchange.head();
      secondExchange.head();

      request.abort();
      const [first, second] = await Promise.all([firstResponse, secondResponse]);
      await Promise.all([firstExchange.closed, secondExchange.closed]);

      expect(first.error).toBeInstanceOf(AbortError);
      expect(second.error).toBeInstanceOf(AbortError);
      expect(firstExchange.wasDropped()).toBe(true);
      expect(secondExchange.wasDropped()).toBe(true);
    });

    it("should let the same request stream again after an abort", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const first = createChunkRecorder();

      const abortedResponse = request.send({ onResponseChunk: first.record });
      const abortedExchange = await server.next();
      await abortedExchange.write("old");
      await first.untilLoaded(3);
      request.abort();
      await abortedResponse;

      const second = createChunkRecorder();
      const freshResponse = request.send({ onResponseChunk: second.record });
      const freshExchange = await server.next();
      await freshExchange.end("new");
      const { data, error } = await freshResponse;

      expect(error).toBeNull();
      expect(data).toBe("new");
      expect(second.chunks.map(({ text, index, loaded }) => [text, index, loaded])).toEqual([["new", 0, 3]]);
    });

    it("should not retry an aborted stream", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client).setRetry(3).setRetryTime(0);
      const recorder = createChunkRecorder();
      const onRequestStart = vi.fn();
      const removed = createDeferred();
      client.requestManager.events.onRemove(() => removed.resolve());

      const response = request.send({ onResponseChunk: recorder.record, onRequestStart });
      const exchange = await server.next();
      await exchange.write("partial");
      await recorder.untilLoaded(7);
      request.abort();
      const { error } = await response;
      await removed.promise;

      expect(error).toBeInstanceOf(AbortError);
      expect(onRequestStart).toHaveBeenCalledTimes(1);
      expect(server.exchanges).toHaveLength(1);
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });
  });
});
