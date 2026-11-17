/**
 * @vitest-environment node
 */
import { Client, Plugin, getResponseChunkByIdKey } from "@hyper-fetch/core";
import type { RequestInstance, RequestResponseChunkEventType } from "@hyper-fetch/core";

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

type ChunkEvent = RequestResponseChunkEventType<RequestInstance>;

const summarize = ({ requestId, chunk, text, index, loaded }: ChunkEvent) => ({
  requestId,
  bytes: [...chunk],
  text,
  index,
  loaded,
});

describe("E2E [ Streaming channels ]", () => {
  const createStream = (client: Client, endpoint = "/stream") =>
    client.createRequest<{ response: string }>()({ endpoint, method: "POST" }).setOptions({ streaming: true });

  describe("when a chunk arrives", () => {
    it("should deliver it to every channel in a fixed order", async () => {
      const order: string[] = [];
      const client = new Client({ url: baseUrl });
      client.addPlugin(new Plugin({ name: "order" }).onResponseChunk(({ text }) => order.push(`plugin:${text}`)));
      const request = createStream(client);
      request.$hooks.onResponseChunk(({ text }) => order.push(`hook:${text}`));
      client.requestManager.events.onResponseChunk(({ text }) => order.push(`global:${text}`));
      client.requestManager.events.onResponseChunkByQueue(request.queryKey, ({ text }) => order.push(`queue:${text}`));
      const recorder = createChunkRecorder();

      const response = request.send({
        onResponseChunk: (event) => {
          order.push(`send:${event.text}`);
          recorder.record(event);
        },
      });
      const exchange = await server.next();
      await exchange.write("a");
      await recorder.untilLoaded(1);
      await exchange.end("b");
      await response;

      expect(order).toEqual([
        "global:a",
        "send:a",
        "hook:a",
        "queue:a",
        "plugin:a",
        "global:b",
        "send:b",
        "hook:b",
        "queue:b",
        "plugin:b",
      ]);
    });

    it("should deliver the same payload to every channel", async () => {
      const received: Record<string, ReturnType<typeof summarize>[]> = {
        send: [],
        hook: [],
        global: [],
        queue: [],
        id: [],
        plugin: [],
      };
      const client = new Client({ url: baseUrl });
      client.addPlugin(
        new Plugin({ name: "payload" }).onResponseChunk((event) =>
          received.plugin.push(summarize(event as ChunkEvent)),
        ),
      );
      const request = createStream(client);
      request.$hooks.onResponseChunk((event) => received.hook.push(summarize(event)));
      client.requestManager.events.onResponseChunk((event) => received.global.push(summarize(event)));
      client.requestManager.events.onResponseChunkByQueue(request.queryKey, (event) =>
        received.queue.push(summarize(event)),
      );
      const recorder = createChunkRecorder();
      let sentId = "";

      const response = request.send({
        onBeforeSent: ({ requestId }) => {
          sentId = requestId;
          client.requestManager.events.onResponseChunkById(requestId, (event) => received.id.push(summarize(event)));
        },
        onResponseChunk: (event) => {
          received.send.push(summarize(event));
          recorder.record(event);
        },
      });
      const exchange = await server.next();
      await exchange.write("zażółć ");
      await recorder.untilLoaded(byteLength("zażółć "));
      await exchange.end("🚀");
      await response;

      expect(received.send).toEqual([
        { requestId: sentId, bytes: [...Buffer.from("zażółć ")], text: "zażółć ", index: 0, loaded: 11 },
        { requestId: sentId, bytes: [...Buffer.from("🚀")], text: "🚀", index: 1, loaded: 15 },
      ]);
      Object.values(received).forEach((events) => {
        expect(events).toEqual(received.send);
      });
    });

    it("should carry the request that was sent, with its streaming option", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client, "/carried");
      const events: ChunkEvent[] = [];
      client.requestManager.events.onResponseChunk((event) => events.push(event));

      const response = request.send();
      const exchange = await server.next();
      await exchange.end("a");
      await response;

      expect(events).toHaveLength(1);
      expect(events[0].request.endpoint).toBe("/carried");
      expect(events[0].request.options).toEqual({ streaming: true });
      expect(events[0].chunk).toBeInstanceOf(Uint8Array);
    });
  });

  describe("when several chunks arrive", () => {
    it("should count index from zero and loaded as the bytes received so far", async () => {
      const parts = ["one|", "zażółć|", "🚀🚀|", "x", "the end"];
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      let written = 0;
      for (const part of parts) {
        written += byteLength(part);
        // eslint-disable-next-line no-await-in-loop
        await exchange.write(part);
        // eslint-disable-next-line no-await-in-loop
        await recorder.untilLoaded(written);
        // Every part is delivered before the next one is even written
        expect(recorder.text()).toBe(parts.slice(0, parts.indexOf(part) + 1).join(""));
      }
      await exchange.end();
      const { data } = await response;

      expect(recorder.chunks.map(({ index }) => index)).toEqual(recorder.chunks.map((_, position) => position));
      let total = 0;
      recorder.chunks.forEach(({ bytes, loaded }) => {
        total += bytes.length;
        expect(loaded).toBe(total);
      });
      expect(total).toBe(byteLength(parts.join("")));
      expect(recorder.chunks.length).toBeGreaterThanOrEqual(parts.length);
      expect(data).toBe(parts.join(""));
    });

    it("should keep the request pending until the body ends", async () => {
      const client = new Client({ url: baseUrl });
      const onRequestSuccess = vi.fn();
      const onRequestFinished = vi.fn();
      client.addPlugin(
        new Plugin({ name: "pending" }).onRequestSuccess(onRequestSuccess).onRequestFinished(onRequestFinished),
      );
      const request = createStream(client);
      const recorder = createChunkRecorder();
      const onResponse = vi.fn();
      const onManagerResponse = vi.fn();
      client.requestManager.events.onResponse(onManagerResponse);
      let resolved = false;

      const response = request.send({ onResponseChunk: recorder.record, onResponse }).then((result) => {
        resolved = true;
        return result;
      });
      const exchange = await server.next();
      await exchange.write("first|");
      await recorder.untilLoaded(6);
      await exchange.write("second|");
      await recorder.untilLoaded(13);

      expect(resolved).toBe(false);
      expect(onResponse).not.toHaveBeenCalled();
      expect(onManagerResponse).not.toHaveBeenCalled();
      expect(onRequestSuccess).not.toHaveBeenCalled();
      expect(onRequestFinished).not.toHaveBeenCalled();
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
      expect(client.submitDispatcher.hasRunningRequests(request.queryKey)).toBe(true);

      await exchange.end("third");
      const { data } = await response;

      expect(data).toBe("first|second|third");
      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(onManagerResponse).toHaveBeenCalledTimes(1);
      expect(onRequestSuccess).toHaveBeenCalledTimes(1);
      expect(onRequestFinished).toHaveBeenCalledTimes(1);
      expect(client.submitDispatcher.hasRunningRequests(request.queryKey)).toBe(false);
    });

    it("should run the send callbacks in the request lifecycle order", async () => {
      const client = new Client({ url: baseUrl });
      const order: string[] = [];
      const recorder = createChunkRecorder();

      const response = createStream(client).send({
        onBeforeSent: () => order.push("before-sent"),
        onRequestStart: () => order.push("request-start"),
        onResponseStart: () => order.push("response-start"),
        onResponseChunk: (event) => {
          order.push(`chunk:${event.text}`);
          recorder.record(event);
        },
        onResponse: () => order.push("response"),
      });
      const exchange = await server.next();
      await exchange.write("a");
      await recorder.untilLoaded(1);
      await exchange.end("b");
      await response;

      expect(order).toEqual(["before-sent", "request-start", "response-start", "chunk:a", "chunk:b", "response"]);
    });

    it("should run the plugin methods in the request lifecycle order", async () => {
      const order: string[] = [];
      const signal = createSignal();
      const client = new Client({ url: baseUrl });
      client.addPlugin(
        new Plugin({ name: "lifecycle" })
          .onRequestTrigger(() => order.push("trigger"))
          .onRequestStart(() => order.push("start"))
          .onResponseChunk(({ text }) => {
            order.push(`chunk:${text}`);
            signal.notify();
          })
          .onRequestSuccess(() => order.push("success"))
          .onRequestError(() => order.push("error"))
          .onRequestFinished(() => order.push("finished")),
      );

      const response = createStream(client).send();
      const exchange = await server.next();
      await exchange.write("a");
      await signal.until(() => order.includes("chunk:a"));
      await exchange.end("b");
      await response;

      expect(order).toEqual(["trigger", "start", "chunk:a", "chunk:b", "success", "finished"]);
    });

    it("should emit the request manager events in the request lifecycle order", async () => {
      const order: string[] = [];
      const signal = createSignal();
      const client = new Client({ url: baseUrl });
      const { events } = client.requestManager;
      events.onLoading(({ loading }) => order.push(`loading:${loading}`));
      events.onRequestStart(() => order.push("request-start"));
      events.onResponseStart(() => order.push("response-start"));
      events.onResponseChunk(({ text }) => {
        order.push(`chunk:${text}`);
        signal.notify();
      });
      events.onResponse(() => order.push("response"));
      events.onRemove(() => order.push("remove"));

      const response = createStream(client).send();
      const exchange = await server.next();
      await exchange.write("a");
      await signal.until(() => order.includes("chunk:a"));
      await exchange.end("b");
      await response;

      expect(order).toEqual([
        "loading:true",
        "request-start",
        "response-start",
        "chunk:a",
        "chunk:b",
        "response",
        "loading:false",
        "remove",
      ]);
    });

    it("should report the response start when the headers arrive, before any chunk", async () => {
      const client = new Client({ url: baseUrl });
      const responseStarted = createDeferred();
      const recorder = createChunkRecorder();

      const response = createStream(client).send({
        onResponseStart: () => responseStarted.resolve(),
        onResponseChunk: recorder.record,
      });
      const exchange = await server.next();
      exchange.head();
      await responseStarted.promise;

      expect(recorder.chunks).toHaveLength(0);

      await exchange.end("body");
      await response;
      expect(recorder.text()).toBe("body");
    });
  });

  describe("when the request resolved", () => {
    it("should remove the chunk listener of the send call", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const onResponseChunk = vi.fn();
      let requestId = "";

      const response = request.send({
        onBeforeSent: (event) => {
          requestId = event.requestId;
        },
        onResponseChunk,
      });
      const exchange = await server.next();
      expect(client.requestManager.emitter.listenerCount(getResponseChunkByIdKey(requestId))).toBe(1);
      await exchange.end("a");
      await response;

      expect(onResponseChunk).toHaveBeenCalledTimes(1);
      expect(client.requestManager.emitter.listenerCount(getResponseChunkByIdKey(requestId))).toBe(0);

      client.requestManager.events.emitResponseChunk({
        requestId,
        request,
        chunk: Uint8Array.of(1),
        text: "late",
        index: 1,
        loaded: 2,
      });
      expect(onResponseChunk).toHaveBeenCalledTimes(1);
    });

    it("should not emit anything for the request anymore", async () => {
      const client = new Client({ url: baseUrl });
      const emitted: string[] = [];
      let resolved = false;
      client.requestManager.emitter.onEmit((event) => {
        if (resolved) {
          emitted.push(event);
        }
      });
      const removed = createDeferred();
      client.requestManager.events.onRemove(() => removed.resolve());

      const response = createStream(client).send();
      const exchange = await server.next();
      await exchange.write("a");
      await exchange.end("b");
      await response;
      // The dispatcher finishes its bookkeeping right after the response event
      await removed.promise;
      resolved = true;
      // The server confirms the response is over - there is nothing left that could still arrive
      await exchange.closed;

      expect(exchange.wasDropped()).toBe(false);
      expect(emitted).toEqual([]);
    });

    it("should keep the request hooks registered for the next send", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const texts: string[] = [];
      request.$hooks.onResponseChunk(({ text }) => texts.push(text));

      const first = request.send();
      await respond("first");
      await first;
      const second = request.send();
      await respond("second");
      await second;

      expect(texts).toEqual(["first", "second"]);
    });
  });

  describe("when request hooks are used", () => {
    it("should call every hook listener in the order they were registered", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const order: string[] = [];
      request.$hooks.onResponseChunk(() => order.push("first"));
      request.$hooks.onResponseChunk(() => order.push("second"));
      request.$hooks.onResponseChunk(() => order.push("third"));

      const response = request.send();
      await respond("a");
      await response;

      expect(order).toEqual(["first", "second", "third"]);
    });

    it("should use the hook listeners that were registered when the request was sent", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const recorder = createChunkRecorder();
      const removedMidStream: string[] = [];
      const addedMidStream: string[] = [];
      const unsubscribe = request.$hooks.onResponseChunk(({ text }) => removedMidStream.push(text));

      // Sending takes a snapshot of the hooks: changes made while the stream runs apply to the next send
      const response = request.send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("a");
      await recorder.untilLoaded(1);
      unsubscribe();
      request.$hooks.onResponseChunk(({ text }) => addedMidStream.push(text));
      await exchange.end("b");
      await response;

      expect(removedMidStream).toEqual(["a", "b"]);
      expect(addedMidStream).toEqual([]);

      const nextResponse = request.send();
      await respond("c");
      await nextResponse;

      expect(removedMidStream).toEqual(["a", "b"]);
      expect(addedMidStream).toEqual(["c"]);
    });

    it("should stop calling a request manager listener that unsubscribed in the middle of the stream", async () => {
      const client = new Client({ url: baseUrl });
      const recorder = createChunkRecorder();
      const leaving: string[] = [];
      const unsubscribe = client.requestManager.events.onResponseChunk(({ text }) => leaving.push(text));

      const response = createStream(client).send({ onResponseChunk: recorder.record });
      const exchange = await server.next();
      await exchange.write("a");
      await recorder.untilLoaded(1);
      unsubscribe();
      await exchange.end("b");
      await response;

      expect(leaving).toEqual(["a"]);
      expect(recorder.text()).toBe("ab");
    });
  });

  describe("when two streams run at the same time", () => {
    it("should keep their chunks, counters and listeners apart", async () => {
      const client = new Client({ url: baseUrl });
      const left = createStream(client, "/left");
      const right = createStream(client, "/right");
      const leftRecorder = createChunkRecorder();
      const rightRecorder = createChunkRecorder();
      const global: string[] = [];
      const leftQueue: string[] = [];
      const rightQueue: string[] = [];
      client.requestManager.events.onResponseChunk(({ text }) => global.push(text));
      client.requestManager.events.onResponseChunkByQueue(left.queryKey, ({ text }) => leftQueue.push(text));
      client.requestManager.events.onResponseChunkByQueue(right.queryKey, ({ text }) => rightQueue.push(text));

      const leftResponse = left.send({ onResponseChunk: leftRecorder.record });
      const leftExchange = await server.next();
      const rightResponse = right.send({ onResponseChunk: rightRecorder.record });
      const rightExchange = await server.next();
      expect(leftExchange.path).toBe("/left");
      expect(rightExchange.path).toBe("/right");

      await leftExchange.write("L1|");
      await leftRecorder.untilLoaded(3);
      await rightExchange.write("R1|");
      await rightRecorder.untilLoaded(3);
      await rightExchange.write("R2|");
      await rightRecorder.untilLoaded(6);
      await leftExchange.write("L2|");
      await leftRecorder.untilLoaded(6);
      await rightExchange.end();
      const rightResult = await rightResponse;
      await leftExchange.end("L3");
      const leftResult = await leftResponse;

      expect(leftResult.data).toBe("L1|L2|L3");
      expect(rightResult.data).toBe("R1|R2|");
      expect(leftRecorder.chunks.map(({ text, index, loaded }) => [text, index, loaded])).toEqual([
        ["L1|", 0, 3],
        ["L2|", 1, 6],
        ["L3", 2, 8],
      ]);
      expect(rightRecorder.chunks.map(({ text, index, loaded }) => [text, index, loaded])).toEqual([
        ["R1|", 0, 3],
        ["R2|", 1, 6],
      ]);
      expect(leftQueue).toEqual(["L1|", "L2|", "L3"]);
      expect(rightQueue).toEqual(["R1|", "R2|"]);
      expect(global).toEqual(["L1|", "R1|", "R2|", "L2|", "L3"]);
    });

    it("should give two sends of the same request their own chunks", async () => {
      const client = new Client({ url: baseUrl });
      const request = createStream(client);
      const first = createChunkRecorder();
      const second = createChunkRecorder();

      const firstResponse = request.send({ onResponseChunk: first.record });
      const firstExchange = await server.next();
      const secondResponse = request.send({ onResponseChunk: second.record });
      const secondExchange = await server.next();

      await firstExchange.end("for the first");
      await secondExchange.end("for the second");
      await Promise.all([firstResponse, secondResponse]);

      expect(first.text()).toBe("for the first");
      expect(second.text()).toBe("for the second");
    });
  });
});
