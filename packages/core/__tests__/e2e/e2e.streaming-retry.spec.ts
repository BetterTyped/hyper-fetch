/**
 * @vitest-environment node
 */
import { Client, Plugin } from "@hyper-fetch/core";

import { createChunkRecorder, createStreamServer, hex } from "../utils/streaming.utils";

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

describe("E2E [ Streaming retries ]", () => {
  const createStream = (client: Client, retry = 1) =>
    client
      .createRequest<{ response: string; error: { message: string } }>()({ endpoint: "/stream", method: "POST" })
      .setOptions({ streaming: true })
      .setRetry(retry)
      .setRetryTime(0);

  /** First attempt: the server sends `partial` and drops the connection. Returns once the retry reached the server. */
  const breakFirstAttempt = async (recorder: ReturnType<typeof createChunkRecorder>, partial: string | Uint8Array) => {
    const broken = await server.next();
    await broken.write(partial);
    await recorder.untilLoaded(typeof partial === "string" ? Buffer.byteLength(partial) : partial.byteLength);
    broken.destroy();
    return server.next();
  };

  describe("when the stream breaks in the middle of the body", () => {
    it("should send the request again and resolve with the body of the successful attempt", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const retried = await breakFirstAttempt(recorder, "broken answer");
      await retried.end("fresh answer");
      const { data, error, status, success } = await response;

      expect(server.exchanges).toHaveLength(2);
      expect(success).toBe(true);
      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).toBe("fresh answer");
    });

    it("should restart the chunk counters for the retried attempt", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const broken = await server.next();
      await broken.write("one|");
      await recorder.untilLoaded(4);
      await broken.write("two|");
      await recorder.untilLoaded(8);
      broken.destroy();
      const retried = await server.next();
      await retried.write("fresh|");
      await recorder.untilCount(3);
      await retried.end("answer");
      await response;

      expect(recorder.chunks.map(({ text, index, loaded }) => [text, index, loaded])).toEqual([
        ["one|", 0, 4],
        ["two|", 1, 8],
        ["fresh|", 0, 6],
        ["answer", 1, 12],
      ]);
    });

    it("should fire the request start and the response start again before the chunks of the retry", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const order: string[] = [];

      const response = createStream(client).send({
        onBeforeSent: () => order.push("before-sent"),
        onRequestStart: () => order.push("request-start"),
        onResponseStart: () => order.push("response-start"),
        onResponseChunk: (event) => {
          order.push(`chunk:${event.text}`);
          recorder.record(event);
        },
        onResponse: ({ response: result }) => order.push(`response:${result.success}`),
      });
      const retried = await breakFirstAttempt(recorder, "broken");
      await retried.end("fresh");
      await response;

      expect(order).toEqual([
        "before-sent",
        "request-start",
        "response-start",
        "chunk:broken",
        "request-start",
        "response-start",
        "chunk:fresh",
        "response:true",
      ]);
    });

    it("should give listeners that reset on request start a clean second attempt", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      let text = "";

      const response = createStream(client).send({
        onRequestStart: () => {
          text = "";
        },
        onResponseChunk: (event) => {
          text += event.text;
          recorder.record(event);
        },
      });
      const retried = await breakFirstAttempt(recorder, "broken answer");
      await retried.end("fresh answer");
      const { data } = await response;

      expect(text).toBe("fresh answer");
      expect(text).toBe(data);
    });

    it("should not carry an unfinished character of the failed attempt into the retry", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      // The first attempt dies after the first two bytes of a four-byte emoji
      const retried = await breakFirstAttempt(recorder, hex("f0 9f"));
      await retried.end("ok");
      const { data } = await response;

      expect(recorder.chunks.map(({ text }) => text)).toEqual(["", "ok"]);
      expect(data).toBe("ok");
    });

    it("should keep the same request id for every attempt", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const ids: string[] = [];
      let sentId = "";

      const response = createStream(client).send({
        onBeforeSent: ({ requestId }) => {
          sentId = requestId;
        },
        onResponseChunk: (event) => {
          ids.push(event.requestId);
          recorder.record(event);
        },
      });
      const retried = await breakFirstAttempt(recorder, "broken");
      await retried.end("fresh");
      await response;

      expect(ids).toEqual([sentId, sentId]);
    });

    it("should report the failed attempt to the request manager and plugins, and the send call only once", async () => {
      const client = new Client({ url: baseUrl });
      const pluginOrder: string[] = [];
      client.addPlugin(
        new Plugin({ name: "retry" })
          .onRequestStart(() => pluginOrder.push("start"))
          .onResponseChunk(({ text }) => pluginOrder.push(`chunk:${text}`))
          .onRequestError(() => pluginOrder.push("error"))
          .onRequestSuccess(() => pluginOrder.push("success"))
          .onRequestFinished(() => pluginOrder.push("finished")),
      );
      const attempts: { success: boolean; willRetry: boolean; retries: number }[] = [];
      client.requestManager.events.onResponse(({ response: result, details }) => {
        attempts.push({ success: result.success, willRetry: details.willRetry, retries: details.retries });
      });
      const recorder = createChunkRecorder();
      const onResponse = vi.fn();

      const response = createStream(client).send({ onResponseChunk: recorder.record, onResponse });
      const retried = await breakFirstAttempt(recorder, "broken");
      await retried.end("fresh");
      await response;

      expect(pluginOrder).toEqual([
        "start",
        "chunk:broken",
        "error",
        "finished",
        "start",
        "chunk:fresh",
        "success",
        "finished",
      ]);
      expect(attempts).toEqual([
        { success: false, willRetry: true, retries: 0 },
        { success: true, willRetry: false, retries: 1 },
      ]);
      expect(onResponse).toHaveBeenCalledTimes(1);
    });

    it("should resolve with the network error when every attempt breaks", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const onRequestStart = vi.fn();

      const response = createStream(client, 2).send({ onResponseChunk: recorder.record, onRequestStart });
      const first = await server.next();
      await first.write("1");
      await recorder.untilCount(1);
      first.destroy();
      const second = await server.next();
      await second.write("2");
      await recorder.untilCount(2);
      second.destroy();
      const third = await server.next();
      await third.write("3");
      await recorder.untilCount(3);
      third.destroy();
      const { data, error, status, success } = await response;

      expect(server.exchanges).toHaveLength(3);
      expect(onRequestStart).toHaveBeenCalledTimes(3);
      expect(success).toBe(false);
      expect(data).toBeNull();
      expect(status).toBe(0);
      expect(error).toBeInstanceOf(Error);
      expect(recorder.chunks.map(({ text, index }) => [text, index])).toEqual([
        ["1", 0],
        ["2", 0],
        ["3", 0],
      ]);
    });

    it("should resolve with the network error right away without retries", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const onRequestSuccess = vi.fn();
      client.addPlugin(new Plugin({ name: "no-retry" }).onRequestSuccess(onRequestSuccess));

      const response = createStream(client, 0).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("partial");
      await recorder.untilLoaded(7);
      exchange.destroy();
      const { data, error, status, success } = await response;

      expect(server.exchanges).toHaveLength(1);
      expect(success).toBe(false);
      expect(data).toBeNull();
      expect(status).toBe(0);
      expect(error).toBeInstanceOf(Error);
      expect(recorder.text()).toBe("partial");
      expect(onRequestSuccess).not.toHaveBeenCalled();
    });
  });

  describe("when an attempt fails with an error status", () => {
    it("should stream the retried attempt from index zero without chunks of the error body", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const onRequestStart = vi.fn();

      const response = createStream(client).send({ onResponseChunk: recorder.record, onRequestStart });
      const failed = await server.next();
      failed.head(503, { "Content-Type": "application/json" });
      await failed.end(JSON.stringify({ message: "busy" }));
      const retried = await server.next();
      await retried.write("fresh|");
      await recorder.untilLoaded(6);
      await retried.end("answer");
      const { data, success } = await response;

      expect(success).toBe(true);
      expect(data).toBe("fresh|answer");
      expect(onRequestStart).toHaveBeenCalledTimes(2);
      expect(recorder.chunks.map(({ text, index, loaded }) => [text, index, loaded])).toEqual([
        ["fresh|", 0, 6],
        ["answer", 1, 12],
      ]);
    });

    it("should resolve with the parsed error of the last attempt when the retries run out", async () => {
      const client = new Client({ url: baseUrl });
      const onResponseChunk = vi.fn();

      const response = createStream(client).send({ onResponseChunk });
      const first = await server.next();
      first.head(503, { "Content-Type": "application/json" });
      await first.end(JSON.stringify({ message: "busy" }));
      const second = await server.next();
      second.head(500, { "Content-Type": "application/json" });
      await second.end(JSON.stringify({ message: "broken" }));
      const { data, error, status, success } = await response;

      expect(success).toBe(false);
      expect(data).toBeNull();
      expect(status).toBe(500);
      expect(error).toEqual({ message: "broken" });
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should only retry when retryOnError allows it", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const request = createStream(client, 3).setRetryOnError((result) => result.status === 0);

      const response = request.send({ onResponseChunk: recorder.record });
      // A dropped connection (status 0) is retried...
      const retried = await breakFirstAttempt(recorder, "broken");
      // ...a 400 is not
      retried.head(400, { "Content-Type": "application/json" });
      await retried.end(JSON.stringify({ message: "invalid" }));
      const { error, status } = await response;

      expect(server.exchanges).toHaveLength(2);
      expect(status).toBe(400);
      expect(error).toEqual({ message: "invalid" });
      expect(recorder.text()).toBe("broken");
    });
  });
});
