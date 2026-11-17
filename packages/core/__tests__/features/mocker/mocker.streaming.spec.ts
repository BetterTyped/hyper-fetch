import { AbortError, TimeoutError } from "adapter";
import { Client } from "client";
import { Plugin } from "plugin";
import type { RequestInstance } from "request";

import { createChunkRecorder, createDeferred, hex } from "../../utils/streaming.utils";

const encode = (value: string) => new TextEncoder().encode(value);

describe("Mocker [ Streaming ]", () => {
  // No simulated upload/download time - the mocker goes straight to the chunks
  const fast = { requestTime: 0, responseTime: 0 };

  let client = new Client({ url: "http://mocked" });

  beforeEach(() => {
    client = new Client({ url: "http://mocked" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Step fake timers one millisecond at a time until the condition is met. */
  const advanceUntil = async (condition: () => boolean, limit = 5000) => {
    let elapsed = 0;
    while (!condition() && elapsed < limit) {
      // eslint-disable-next-line no-await-in-loop
      await vi.advanceTimersByTimeAsync(1);
      elapsed += 1;
    }
    expect(condition()).toBe(true);
  };

  const createRequest = <Response = unknown>() =>
    client.createRequest<{ response: Response; error: { message: string } }>()({ endpoint: "/stream", method: "POST" });

  describe("when the mock returns chunks without data", () => {
    it("should resolve with the joined text of string chunks", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: ["Hello", ", ", "world"], status: 200 }), fast);

      const { data, error, success, status } = await request.send();

      expect(data).toBe("Hello, world");
      expect(error).toBeNull();
      expect(success).toBe(true);
      expect(status).toBe(200);
    });

    it("should resolve with the decoded text of byte chunks", async () => {
      const request = createRequest<string>().setMock(
        () => ({ chunks: [encode("zażółć "), encode("🚀")], status: 200 }),
        fast,
      );

      const { data } = await request.send();

      expect(data).toBe("zażółć 🚀");
    });

    it("should decode multi-byte characters split between byte chunks", async () => {
      const bytes = encode("gęślą 🚀 jaźń");
      const request = createRequest<string>().setMock(
        () => ({ chunks: [bytes.slice(0, 2), bytes.slice(2, 9), bytes.slice(9)], status: 200 }),
        fast,
      );
      const recorder = createChunkRecorder();

      const { data } = await request.send({ onResponseChunk: recorder.record });

      expect(data).toBe("gęślą 🚀 jaźń");
      expect(recorder.text()).toBe("gęślą 🚀 jaźń");
    });

    it("should join string and byte chunks in order", async () => {
      const request = createRequest<string>().setMock(
        () => ({ chunks: ["a", encode("b"), "c", encode("d")], status: 200 }),
        fast,
      );

      const { data } = await request.send();

      expect(data).toBe("abcd");
    });

    it("should parse the joined chunks as JSON when they form a JSON document", async () => {
      const request = createRequest<{ items: number[] }>().setMock(
        () => ({ chunks: ['{"items":', "[1,2", ",3]}"], status: 200 }),
        fast,
      );

      const { data } = await request.send();

      expect(data).toEqual({ items: [1, 2, 3] });
    });

    it("should keep the joined chunks as text when they are not JSON", async () => {
      const request = createRequest<string>().setMock(
        () => ({ chunks: ['data: {"a":1}\n\n', "data: [DONE]\n\n"], status: 200 }),
        fast,
      );

      const { data } = await request.send();

      expect(data).toBe('data: {"a":1}\n\ndata: [DONE]\n\n');
    });

    it("should resolve with an empty text for an empty list of chunks", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: [], status: 200 }), fast);
      const onResponseChunk = vi.fn();

      const { data, success } = await request.send({ onResponseChunk });

      expect(data).toBe("");
      expect(success).toBe(true);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should resolve with the same text as the chunk events when the last character is cut off", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: [hex("61 f0 9f")], status: 200 }), fast);
      const recorder = createChunkRecorder();

      const { data } = await request.send({ onResponseChunk: recorder.record });

      expect(data).toBe("a�");
      expect(recorder.text()).toBe(data);
    });

    it("should resolve with the same text as the chunk events when a string follows a cut off character", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: [hex("f0 9f"), "abc"], status: 200 }), fast);
      const recorder = createChunkRecorder();

      const { data } = await request.send({ onResponseChunk: recorder.record });

      expect(data).toBe("�abc");
      expect(recorder.text()).toBe(data);
    });
  });

  describe("when the mock returns chunks with data", () => {
    it("should resolve with the explicit data", async () => {
      const request = createRequest<{ final: boolean }>().setMock(
        () => ({ chunks: ["a", "b"], data: { final: true }, status: 200 }),
        fast,
      );
      const recorder = createChunkRecorder();

      const { data } = await request.send({ onResponseChunk: recorder.record });

      expect(data).toEqual({ final: true });
      expect(recorder.text()).toBe("ab");
    });

    it("should keep explicit falsy data instead of joining the chunks", async () => {
      const request = createRequest<number>().setMock(() => ({ chunks: ["a", "b"], data: 0, status: 200 }), fast);

      const { data } = await request.send();

      expect(data).toBe(0);
    });

    it("should keep explicit null data instead of joining the chunks", async () => {
      const request = createRequest<null>().setMock(() => ({ chunks: ["a", "b"], data: null, status: 200 }), fast);

      const { data } = await request.send();

      expect(data).toBeNull();
    });
  });

  describe("when chunks are emitted", () => {
    it("should emit every chunk with its index and the bytes loaded so far", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", encode("żó"), "🚀"], status: 200 }), fast);
      const recorder = createChunkRecorder();

      await request.send({ onResponseChunk: recorder.record });

      expect(recorder.chunks).toEqual([
        { text: "a", bytes: [...encode("a")], index: 0, loaded: 1 },
        { text: "żó", bytes: [...encode("żó")], index: 1, loaded: 5 },
        { text: "🚀", bytes: [...encode("🚀")], index: 2, loaded: 9 },
      ]);
    });

    it("should emit chunks after the response start and before the response", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b"], status: 200 }), fast);
      const order: string[] = [];

      await request.send({
        onBeforeSent: () => order.push("before-sent"),
        onRequestStart: () => order.push("request-start"),
        onResponseStart: () => order.push("response-start"),
        onResponseChunk: ({ text }) => order.push(`chunk:${text}`),
        onResponse: () => order.push("response"),
      });

      expect(order).toEqual(["before-sent", "request-start", "response-start", "chunk:a", "chunk:b", "response"]);
    });

    it("should emit chunks through the send option, request hooks, request manager events and plugins", async () => {
      const order: string[] = [];
      client.addPlugin(new Plugin({ name: "chunks" }).onResponseChunk(({ index }) => order.push(`plugin:${index}`)));
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b"], status: 200 }), fast);
      request.$hooks.onResponseChunk(({ index }) => order.push(`hook:${index}`));
      client.requestManager.events.onResponseChunk(({ index }) => order.push(`global:${index}`));
      client.requestManager.events.onResponseChunkByQueue(request.queryKey, ({ index }) =>
        order.push(`queue:${index}`),
      );
      let unmountById: VoidFunction = () => {};

      await request.send({
        onBeforeSent: ({ requestId }) => {
          unmountById = client.requestManager.events.onResponseChunkById(requestId, ({ index }) =>
            order.push(`id:${index}`),
          );
        },
        onResponseChunk: ({ index }) => order.push(`send:${index}`),
      });
      unmountById();

      const forChunk = (index: number) =>
        ["global", "id", "send", "hook", "queue", "plugin"].map((channel) => `${channel}:${index}`);
      expect(order).toEqual([...forChunk(0), ...forChunk(1)]);
    });

    it("should emit chunks without the streaming adapter option", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: ["a"], status: 200 }), fast);
      const onResponseChunk = vi.fn();

      await request.send({ onResponseChunk });

      expect(request.options).toBeUndefined();
      expect(onResponseChunk).toHaveBeenCalledTimes(1);
    });

    it("should emit the same chunks with the streaming adapter option", async () => {
      const request = createRequest<string>()
        .setOptions({ streaming: true })
        .setMock(() => ({ chunks: ["a", "b"], status: 200 }), fast);
      const recorder = createChunkRecorder();

      const { data } = await request.send({ onResponseChunk: recorder.record });

      expect(recorder.text()).toBe("ab");
      expect(data).toBe("ab");
    });

    it("should not emit chunks when the mock returns only data", async () => {
      const request = createRequest<string>()
        .setOptions({ streaming: true })
        .setMock(() => ({ data: "whole", status: 200 }), fast);
      const onResponseChunk = vi.fn();

      const { data } = await request.send({ onResponseChunk });

      expect(data).toBe("whole");
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should give every call of an async mock its own chunks", async () => {
      let call = 0;
      const request = createRequest<string>().setMock(async () => {
        call += 1;
        return { chunks: [`call-${call}-a|`, `call-${call}-b`], status: 200 };
      }, fast);
      const first = createChunkRecorder();
      const second = createChunkRecorder();

      const [firstResponse, secondResponse] = await Promise.all([
        request.send({ onResponseChunk: first.record }),
        request.send({ onResponseChunk: second.record }),
      ]);

      expect(first.text()).toBe(firstResponse.data);
      expect(second.text()).toBe(secondResponse.data);
      expect(new Set([first.text(), second.text()])).toEqual(new Set(["call-1-a|call-1-b", "call-2-a|call-2-b"]));
      expect(first.chunks.map(({ index }) => index)).toEqual([0, 1]);
      expect(second.chunks.map(({ index }) => index)).toEqual([0, 1]);
    });

    it("should wait for an async mock before emitting anything", async () => {
      const gate = createDeferred();
      const started = createDeferred();
      const request = createRequest<string>().setMock(async () => {
        started.resolve();
        await gate.promise;
        return { chunks: ["late"], status: 200 };
      }, fast);
      const onRequestStart = vi.fn();
      const onResponseChunk = vi.fn();

      const response = request.send({ onRequestStart, onResponseChunk });
      await started.promise;

      expect(onRequestStart).not.toHaveBeenCalled();
      expect(onResponseChunk).not.toHaveBeenCalled();

      gate.resolve();
      await response;

      expect(onRequestStart).toHaveBeenCalledTimes(1);
      expect(onResponseChunk).toHaveBeenCalledTimes(1);
    });
  });

  describe("when chunkTime is set", () => {
    it("should emit all chunks in the same tick by default", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), fast);
      const ticks: number[] = [];
      let tick = 0;

      const response = request.send({
        onResponseChunk: () => {
          ticks.push(tick);
          // Runs after the current synchronous block - a later chunk in the same block still sees the old value
          queueMicrotask(() => {
            tick += 1;
          });
        },
      });
      await response;

      expect(ticks).toEqual([0, 0, 0]);
    });

    it("should wait chunkTime before every chunk, including the first one", async () => {
      vi.useFakeTimers();
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), {
        ...fast,
        chunkTime: 1000,
      });
      const recorder = createChunkRecorder();
      let downloaded = false;

      const response = request.send({
        onResponseChunk: recorder.record,
        onDownloadProgress: ({ progress }) => {
          downloaded = progress === 100;
        },
      });
      // The chunks start once the simulated download has finished
      await advanceUntil(() => downloaded);
      expect(recorder.chunks).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(999);
      expect(recorder.text()).toBe("");
      await vi.advanceTimersByTimeAsync(1);
      expect(recorder.text()).toBe("a");
      await vi.advanceTimersByTimeAsync(999);
      expect(recorder.text()).toBe("a");
      await vi.advanceTimersByTimeAsync(1);
      expect(recorder.text()).toBe("ab");
      await vi.advanceTimersByTimeAsync(1000);
      expect(recorder.text()).toBe("abc");

      await vi.runAllTimersAsync();
      await expect(response).resolves.toMatchObject({ data: "abc", success: true });
    });

    it("should not resolve before the last chunk was emitted", async () => {
      vi.useFakeTimers();
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b"], status: 200 }), {
        ...fast,
        chunkTime: 500,
      });
      const onResponse = vi.fn();
      const recorder = createChunkRecorder();

      const response = request.send({ onResponse, onResponseChunk: recorder.record });
      await advanceUntil(() => recorder.chunks.length === 1);
      await vi.advanceTimersByTimeAsync(499);

      expect(recorder.text()).toBe("a");
      expect(onResponse).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      await response;

      expect(recorder.text()).toBe("ab");
      expect(onResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the request is aborted", () => {
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

    it.each(abortWays)("should stop emitting chunks after %s during the chunk delivery", async (_name, abort) => {
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), fast);
      const recorder = createChunkRecorder();
      const onAbort = vi.fn();
      client.requestManager.events.onAbort(onAbort);

      const { data, error, success, status } = await request.send({
        onResponseChunk: (event) => {
          recorder.record(event);
          abort(request, event.requestId);
        },
      });

      expect(recorder.text()).toBe("a");
      expect(error).toBeInstanceOf(AbortError);
      expect(data).toBeNull();
      expect(success).toBe(false);
      expect(status).toBe(0);
      expect(onAbort).toHaveBeenCalledTimes(1);
    });

    it("should stop emitting chunks when aborted between two delayed chunks", async () => {
      vi.useFakeTimers();
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), {
        ...fast,
        chunkTime: 1000,
      });
      const recorder = createChunkRecorder();

      const response = request.send({ onResponseChunk: recorder.record });
      await advanceUntil(() => recorder.chunks.length === 1);
      await vi.advanceTimersByTimeAsync(500);
      expect(recorder.text()).toBe("a");

      request.abort();
      await vi.runAllTimersAsync();

      await expect(response).resolves.toMatchObject({ data: null, success: false, error: expect.any(AbortError) });
      expect(recorder.text()).toBe("a");
    });

    it("should not emit any chunk when aborted before the first one", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b"], status: 200 }), fast);
      const onResponseChunk = vi.fn();

      const { error } = await request.send({
        onRequestStart: () => request.abort(),
        onResponseChunk,
      });

      expect(error).toBeInstanceOf(AbortError);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should not emit any chunk when aborted while the mock is still being resolved", async () => {
      const gate = createDeferred();
      const started = createDeferred();
      const request = createRequest<string>().setMock(async () => {
        started.resolve();
        await gate.promise;
        return { chunks: ["a", "b"], status: 200 };
      }, fast);
      const onResponseChunk = vi.fn();

      const response = request.send({ onResponseChunk });
      await started.promise;
      request.abort();
      gate.resolve();

      const { error } = await response;
      expect(error).toBeInstanceOf(AbortError);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });

    it("should detach the send option listener once the aborted request resolved", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), fast);
      const onResponseChunk = vi.fn(() => request.abort());
      let requestId = "";

      await request.send({
        onBeforeSent: (event) => {
          requestId = event.requestId;
        },
        onResponseChunk,
      });
      expect(onResponseChunk).toHaveBeenCalledTimes(1);

      // Even a chunk emitted for the very same request id no longer reaches the callback
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

    it("should let a request sent after the abort stream normally", async () => {
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b"], status: 200 }), fast);

      const aborted = await request.send({ onResponseChunk: () => request.abort() });
      const recorder = createChunkRecorder();
      const fresh = await request.send({ onResponseChunk: recorder.record });

      expect(aborted.error).toBeInstanceOf(AbortError);
      expect(fresh.data).toBe("ab");
      expect(recorder.chunks.map(({ index }) => index)).toEqual([0, 1]);
    });
  });

  describe("when the mock times out", () => {
    it("should stop emitting chunks and resolve with the timeout error", async () => {
      vi.useFakeTimers();
      const request = createRequest<string>().setMock(() => ({ chunks: ["a", "b", "c"], status: 200 }), {
        ...fast,
        chunkTime: 1000,
        timeout: 1500,
      });
      const recorder = createChunkRecorder();

      const response = request.send({ onResponseChunk: recorder.record });
      await vi.runAllTimersAsync();

      await expect(response).resolves.toMatchObject({ data: null, success: false, error: expect.any(TimeoutError) });
      expect(recorder.text()).toBe("a");
    });
  });

  describe("when the mocked response is an error", () => {
    it("should resolve with the error when chunks are returned with success false", async () => {
      const request = createRequest<string>().setMock(
        () => ({ chunks: ["partial"], error: { message: "dropped" }, status: 500, success: false }),
        fast,
      );

      const { data, error, success, status } = await request.send();

      expect(success).toBe(false);
      expect(error).toEqual({ message: "dropped" });
      expect(data).toBeNull();
      expect(status).toBe(500);
    });

    it("should emit the chunks before the error, like a stream that breaks in the middle", async () => {
      const request = createRequest<string>().setMock(
        () => ({ chunks: ["par", "tial"], error: { message: "dropped" }, status: 500, success: false }),
        fast,
      );
      const order: string[] = [];

      await request.send({
        onResponseChunk: ({ text }) => order.push(`chunk:${text}`),
        onResponse: ({ response }) => order.push(`response:${response.success}`),
      });

      expect(order).toEqual(["chunk:par", "chunk:tial", "response:false"]);
    });

    it("should call the error plugin hooks and not the success hook", async () => {
      const onRequestSuccess = vi.fn();
      const onRequestError = vi.fn();
      const onRequestFinished = vi.fn();
      client.addPlugin(
        new Plugin({ name: "result" })
          .onRequestSuccess(onRequestSuccess)
          .onRequestError(onRequestError)
          .onRequestFinished(onRequestFinished),
      );
      const request = createRequest<string>().setMock(
        () => ({ chunks: ["partial"], error: { message: "dropped" }, status: 500, success: false }),
        fast,
      );

      await request.send();

      expect(onRequestSuccess).not.toHaveBeenCalled();
      expect(onRequestError).toHaveBeenCalledTimes(1);
      expect(onRequestFinished).toHaveBeenCalledTimes(1);
    });

    it("should not emit chunks for an error mock without chunks", async () => {
      const request = createRequest<string>().setMock(
        () => ({ error: { message: "nope" }, status: 422, success: false }),
        fast,
      );
      const onResponseChunk = vi.fn();

      const { error, status } = await request.send({ onResponseChunk });

      expect(error).toEqual({ message: "nope" });
      expect(status).toBe(422);
      expect(onResponseChunk).not.toHaveBeenCalled();
    });
  });

  describe("when the request is retried", () => {
    const createFlakyRequest = () => {
      let attempt = 0;
      const request = createRequest<string>()
        .setRetry(2)
        .setRetryTime(0)
        .setMock(() => {
          attempt += 1;
          if (attempt === 1) {
            return { chunks: ["broken-1|", "broken-2"], error: { message: "dropped" }, status: 500, success: false };
          }
          if (attempt === 2) {
            return { chunks: ["again"], error: { message: "dropped again" }, status: 502, success: false };
          }
          return { chunks: ["fresh-1|", "fresh-2|", "fresh-3"], status: 200 };
        }, fast);
      return { request, attempts: () => attempt };
    };

    it("should restart the chunk counters on every attempt", async () => {
      const { request, attempts } = createFlakyRequest();
      const recorder = createChunkRecorder();

      const { data, success } = await request.send({ onResponseChunk: recorder.record });

      expect(attempts()).toBe(3);
      expect(success).toBe(true);
      expect(data).toBe("fresh-1|fresh-2|fresh-3");
      expect(recorder.chunks.map(({ text, index, loaded }) => [text, index, loaded])).toEqual([
        ["broken-1|", 0, 9],
        ["broken-2", 1, 17],
        ["again", 0, 5],
        ["fresh-1|", 0, 8],
        ["fresh-2|", 1, 16],
        ["fresh-3", 2, 23],
      ]);
    });

    it("should fire the request start before the chunks of every attempt", async () => {
      const { request } = createFlakyRequest();
      const order: string[] = [];

      await request.send({
        onRequestStart: () => order.push("request-start"),
        onResponseStart: () => order.push("response-start"),
        onResponseChunk: ({ text }) => order.push(text),
        onResponse: ({ response }) => order.push(`response:${response.success}`),
      });

      expect(order).toEqual([
        "request-start",
        "response-start",
        "broken-1|",
        "broken-2",
        "request-start",
        "response-start",
        "again",
        "request-start",
        "response-start",
        "fresh-1|",
        "fresh-2|",
        "fresh-3",
        "response:true",
      ]);
    });

    it("should keep the same request id for the chunks of every attempt", async () => {
      const { request } = createFlakyRequest();
      const ids = new Set<string>();
      let sentId = "";

      await request.send({
        onBeforeSent: ({ requestId }) => {
          sentId = requestId;
        },
        onResponseChunk: ({ requestId }) => ids.add(requestId),
      });

      expect([...ids]).toEqual([sentId]);
    });

    it("should resolve with the last error when every attempt fails", async () => {
      const request = createRequest<string>()
        .setRetry(1)
        .setRetryTime(0)
        .setMock(() => ({ chunks: ["x"], error: { message: "always" }, status: 500, success: false }), fast);
      const recorder = createChunkRecorder();
      const onResponse = vi.fn();

      const { error, success } = await request.send({ onResponseChunk: recorder.record, onResponse });

      expect(success).toBe(false);
      expect(error).toEqual({ message: "always" });
      expect(recorder.chunks.map(({ text, index }) => [text, index])).toEqual([
        ["x", 0],
        ["x", 0],
      ]);
      expect(onResponse).toHaveBeenCalledTimes(1);
    });
  });
});
