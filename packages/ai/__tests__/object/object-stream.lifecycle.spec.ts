import type { StandardSchemaV1 } from "@hyper-fetch/ai";
import {
  aguiObjectProtocol,
  encodeAGUIStream,
  ObjectStream,
  ObjectStreamError,
  textObjectProtocol,
} from "@hyper-fetch/ai";
import { Client, scopeKey } from "@hyper-fetch/core";
import { z } from "zod";

import { deferred } from "../chat/chat.utils";

const fast = { requestTime: 0, responseTime: 0 };
const schema = z.object({ title: z.string() });

type MockedResponseType = { chunks?: string[]; error?: unknown; status?: number };

const createEndpoint = (responses: MockedResponseType[], config: { chunkTime?: number } = {}) => {
  const client = new Client({ url: "http://object-lifecycle.test" });
  const calls: unknown[] = [];
  const request = client
    .createRequest<{ response: string; payload: { topic: string } }>()({ endpoint: "/api/object", method: "POST" })
    .setMock(
      ({ request: sent }) => {
        calls.push(sent.payload);
        const response = responses[Math.min(calls.length - 1, responses.length - 1)];
        if (response.error !== undefined) {
          return {
            data: null,
            error: response.error,
            status: response.status ?? 500,
            success: false,
            ...(response.chunks && { chunks: response.chunks }),
          } as never;
        }
        return { chunks: response.chunks ?? [], status: response.status ?? 200 } as never;
      },
      { ...fast, ...config },
    );
  const queue = () => client.submitDispatcher.getQueue(scopeKey(request.queryKey, request.scope)).requests;
  return { client, request, calls, queue };
};

/** Resolves once the stream first shows the given partial object. */
const untilObject = (stream: ObjectStream<any, any>, expected: unknown) => {
  const seen = deferred();
  const unsubscribe = stream.subscribe(() => {
    if (JSON.stringify(stream.getSnapshot().object) === JSON.stringify(expected)) {
      unsubscribe();
      seen.resolve();
    }
  });
  return seen.promise;
};

describe("ObjectStream [ Lifecycle ]", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the request can't be built", () => {
    it("should fail instead of staying busy and work again afterwards", async () => {
      const { request, calls } = createEndpoint([{ chunks: ['{"title":"ok"}'] }]);
      const failure = new Error("No session");
      let shouldFail = true;
      const onError = vi.fn();
      const onFinish = vi.fn();
      const stream = new ObjectStream({
        request,
        schema,
        protocol: textObjectProtocol({
          prepareBody: (input) => {
            if (shouldFail) {
              throw failure;
            }
            return input;
          },
        }),
        onError,
        onFinish,
      });

      await stream.submit({ topic: "x" });

      expect(calls).toHaveLength(0);
      expect(stream.getSnapshot()).toMatchObject({ status: "error", error: failure, object: undefined, text: "" });
      expect(onError).toHaveBeenCalledWith(failure);
      expect(onFinish).toHaveBeenCalledWith({ object: undefined, error: failure });

      shouldFail = false;
      await stream.submit({ topic: "x" });

      expect(calls).toHaveLength(1);
      expect(stream.getSnapshot()).toMatchObject({ status: "ready", error: undefined, object: { title: "ok" } });
    });
  });

  describe("when the request retries", () => {
    it("should drop the text of the failed attempt", async () => {
      const { request, calls } = createEndpoint([
        { error: { message: "dropped" }, chunks: ['{"title":"bro'] },
        { chunks: ['{"title":', '"fresh"}'] },
      ]);
      const stream = new ObjectStream({ request: request.setRetry(1).setRetryTime(0), schema });
      const texts: string[] = [];
      stream.subscribe(() => texts.push(stream.getSnapshot().text));

      await stream.submit({ topic: "x" });

      expect(calls).toHaveLength(2);
      expect(stream.getSnapshot()).toMatchObject({
        status: "ready",
        error: undefined,
        text: '{"title":"fresh"}',
        object: { title: "fresh" },
      });
      expect(texts).toContain('{"title":"bro');
      expect(texts.filter((text) => text.includes("bro") && text.includes("fresh"))).toEqual([]);
    });

    it("should show nothing of the failed attempt while the retry is on its way", async () => {
      const { request } = createEndpoint([
        { error: { message: "dropped" }, chunks: ['{"title":"broken"'] },
        { chunks: ['{"title":"fresh"}'] },
      ]);
      const stream = new ObjectStream({ request: request.setRetry(1).setRetryTime(0), schema });
      const snapshots: { status: string; object: unknown }[] = [];
      stream.subscribe(() => {
        const { status, object } = stream.getSnapshot();
        snapshots.push({ status, object });
      });

      await stream.submit({ topic: "x" });

      const broken = snapshots.findIndex((snapshot) => (snapshot.object as { title?: string })?.title === "broken");
      expect(broken).not.toBe(-1);
      expect(snapshots.slice(broken + 1)).toContainEqual({ status: "submitted", object: undefined });
      expect(snapshots.at(-1)).toEqual({ status: "ready", object: { title: "fresh" } });
    });

    it("should not let a stream error or a completed object from the failed attempt leak into the retry", async () => {
      const failed = encodeAGUIStream([
        { type: "RUN_STARTED", threadId: "t", runId: "r" },
        { type: "CUSTOM", name: "structured-output.complete", value: { object: { title: "stale" } } },
        { type: "RUN_ERROR", message: "boom" },
      ]);
      const fresh = encodeAGUIStream([
        { type: "RUN_STARTED", threadId: "t", runId: "r" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: '{"title":"fresh"}' },
        { type: "RUN_FINISHED", threadId: "t", runId: "r" },
      ]);
      const { request } = createEndpoint([{ error: { message: "dropped" }, chunks: failed }, { chunks: fresh }]);
      const onError = vi.fn();
      const stream = new ObjectStream({
        request: request.setRetry(1).setRetryTime(0),
        schema,
        protocol: aguiObjectProtocol(),
        onError,
      });

      await stream.submit({ topic: "x" });

      expect(onError).not.toHaveBeenCalled();
      expect(stream.getSnapshot()).toMatchObject({ status: "ready", error: undefined, object: { title: "fresh" } });
    });

    it("should report the error when every attempt fails", async () => {
      const { request, calls } = createEndpoint([{ error: { message: "down" }, status: 503 }]);
      const stream = new ObjectStream({ request: request.setRetry(2).setRetryTime(0), schema });

      await stream.submit({ topic: "x" });

      expect(calls).toHaveLength(3);
      expect(stream.getSnapshot()).toMatchObject({ status: "error", error: { message: "down" } });
    });
  });

  describe("when stopping", () => {
    it("should abort a request stopped before it started", async () => {
      const { client, request, queue } = createEndpoint([{ chunks: ['{"title":"never"}'] }], { chunkTime: 2 });
      const chunk = vi.fn();
      client.requestManager.events.onResponseChunk(chunk);
      const onFinish = vi.fn();
      const stream = new ObjectStream({ request, schema, onFinish });

      const submitted = stream.submit({ topic: "x" });
      stream.stop();
      await submitted;

      expect(stream.getSnapshot()).toMatchObject({ status: "ready", error: undefined, object: undefined, text: "" });
      expect(chunk).not.toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalledWith({ object: undefined, error: undefined });
      expect(queue()).toHaveLength(0);
    });

    it("should stop a request that is waiting for the network", async () => {
      const { client, request, calls, queue } = createEndpoint([{ chunks: ['{"title":"never"}'] }]);
      client.appManager.setOnline(false);
      const stream = new ObjectStream({ request, schema });

      const submitted = stream.submit({ topic: "x" });
      expect(stream.getSnapshot().status).toBe("submitted");
      stream.stop();
      await submitted;

      expect(stream.getSnapshot().status).toBe("ready");
      expect(queue()).toHaveLength(0);
      client.appManager.setOnline(true);
      expect(calls).toHaveLength(0);
    });

    it("should stop a request that is waiting to be retried", async () => {
      vi.useFakeTimers();
      const { request, calls, queue } = createEndpoint([
        { error: { message: "dropped" } },
        { chunks: ['{"title":"never"}'] },
      ]);
      const stream = new ObjectStream({ request: request.setRetry(2).setRetryTime(500), schema });

      const submitted = stream.submit({ topic: "x" });
      await vi.advanceTimersByTimeAsync(200);
      expect(calls).toHaveLength(1);
      stream.stop();
      await submitted;
      await vi.advanceTimersByTimeAsync(5000);

      expect(stream.getSnapshot()).toMatchObject({ status: "ready", error: undefined });
      expect(calls).toHaveLength(1);
      expect(queue()).toHaveLength(0);
    });

    it("should keep the partial object and ignore chunks that arrive after stop()", async () => {
      const { request } = createEndpoint([{ chunks: ['{"title":"par', "tial", ' and more"}'] }], { chunkTime: 2 });
      const stream = new ObjectStream({ request, schema });
      const partial = untilObject(stream, { title: "par" });

      const submitted = stream.submit({ topic: "x" });
      await partial;
      stream.stop();
      await submitted;

      expect(stream.getSnapshot()).toMatchObject({ status: "ready", object: { title: "par" }, text: '{"title":"par' });
    });

    it("should stay cleared when clear() is called while streaming", async () => {
      const { request } = createEndpoint([{ chunks: ['{"title":"par', 'tial"}'] }], { chunkTime: 2 });
      const onFinish = vi.fn();
      const stream = new ObjectStream({ request, schema, onFinish, initialValue: { title: "initial" } });
      const partial = untilObject(stream, { title: "par" });

      const submitted = stream.submit({ topic: "x" });
      await partial;
      stream.clear();
      await submitted;

      expect(stream.getSnapshot()).toEqual({ status: "ready", object: undefined, text: "", error: undefined });
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledWith({ object: undefined, error: undefined });
    });
  });

  describe("when submitting again", () => {
    it("should start from a clean state after an error", async () => {
      const { request } = createEndpoint([{ chunks: ['{"title":1}'] }, { chunks: ['{"title":"ok"}'] }]);
      const stream = new ObjectStream({ request, schema });

      await stream.submit({ topic: "x" });
      expect(stream.getSnapshot().status).toBe("error");

      const statuses: string[] = [];
      const errors: unknown[] = [];
      stream.subscribe(() => {
        statuses.push(stream.getSnapshot().status);
        errors.push(stream.getSnapshot().error);
      });
      await stream.submit({ topic: "x" });

      expect(statuses[0]).toBe("submitted");
      expect(errors.every((error) => error === undefined)).toBe(true);
      expect(stream.getSnapshot()).toMatchObject({ status: "ready", object: { title: "ok" }, text: '{"title":"ok"}' });
    });

    it("should not let an older submit overwrite a newer one while its schema validates", async () => {
      const gate = deferred();
      const validating = deferred();
      let validations = 0;
      const slowSchema = {
        "~standard": {
          version: 1,
          vendor: "test",
          validate: async (value: unknown) => {
            validations += 1;
            if (validations === 1) {
              validating.resolve();
              await gate.promise;
            }
            return { value: value as { title: string } };
          },
        },
      } as StandardSchemaV1<unknown, { title: string }>;
      const { request } = createEndpoint([{ chunks: ['{"title":"old"}'] }, { chunks: ['{"title":"new"}'] }]);
      const onFinish = vi.fn();
      const stream = new ObjectStream({ request, schema: slowSchema, onFinish });

      const first = stream.submit({ topic: "1" });
      await validating.promise;
      await stream.submit({ topic: "2" });
      gate.resolve();
      await first;

      expect(stream.getSnapshot()).toMatchObject({ status: "ready", object: { title: "new" } });
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledWith({ object: { title: "new" }, error: undefined });
    });

    it("should stay cleared when clear() is called while the schema validates", async () => {
      const gate = deferred();
      const validating = deferred();
      const slowSchema = {
        "~standard": {
          version: 1,
          vendor: "test",
          validate: async (value: unknown) => {
            validating.resolve();
            await gate.promise;
            return { value: value as { title: string } };
          },
        },
      } as StandardSchemaV1<unknown, { title: string }>;
      const { request } = createEndpoint([{ chunks: ['{"title":"old"}'] }]);
      const stream = new ObjectStream({ request, schema: slowSchema });

      const submitted = stream.submit({ topic: "1" });
      await validating.promise;
      stream.clear();
      gate.resolve();
      await submitted;

      expect(stream.getSnapshot()).toEqual({ status: "ready", object: undefined, text: "", error: undefined });
    });

    it("should fail when the schema itself throws", async () => {
      const throwingSchema = {
        "~standard": {
          version: 1,
          vendor: "test",
          validate: () => {
            throw new Error("Schema exploded");
          },
        },
      } as StandardSchemaV1<unknown, { title: string }>;
      const { request } = createEndpoint([{ chunks: ['{"title":"x"}'] }]);
      const onError = vi.fn();
      const stream = new ObjectStream({ request, schema: throwingSchema, onError });

      await stream.submit({ topic: "1" });

      expect(stream.getSnapshot().status).toBe("error");
      expect((stream.getSnapshot().error as Error).message).toBe("Schema exploded");
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the stream is unusual", () => {
    it.each([
      ["an empty body", [] as string[]],
      ["only whitespace", ["  ", "\n"]],
      ["a cut off object", ['{"title":"x"']],
      ["text that is not JSON", ["Sorry, I can't do that."]],
    ])("should fail with incomplete JSON for %s", async (_name, chunks) => {
      const { request } = createEndpoint([{ chunks }]);
      const stream = new ObjectStream({ request, schema });

      await stream.submit({ topic: "x" });

      expect(stream.getSnapshot().status).toBe("error");
      expect(stream.getSnapshot().error).toBeInstanceOf(ObjectStreamError);
    });

    it("should produce the same object however the text is split", async () => {
      const expected = { title: 'Zażółć gęślą jaźń 🚀 "quoted" \\ end' };
      const text = JSON.stringify(expected);
      for (const size of [1, 2, 3, 7, text.length]) {
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += size) {
          chunks.push(text.slice(i, i + size));
        }
        const { request } = createEndpoint([{ chunks }]);
        const stream = new ObjectStream({ request, schema });
        // eslint-disable-next-line no-await-in-loop
        await stream.submit({ topic: "x" });
        expect(stream.getSnapshot()).toMatchObject({ status: "ready", object: expected, text });
      }
    });

    it("should never show an object that goes backwards while streaming", async () => {
      const text = '{"title":"abcdefghij"}';
      const { request } = createEndpoint([{ chunks: [...text] }]);
      const stream = new ObjectStream({ request, schema });
      const titles: string[] = [];
      stream.subscribe(() => {
        const title = (stream.getSnapshot().object as { title?: string } | undefined)?.title;
        if (title !== undefined) {
          titles.push(title);
        }
      });

      await stream.submit({ topic: "x" });

      titles.forEach((title, index) => {
        if (index > 0) {
          expect(title.startsWith(titles[index - 1])).toBe(true);
        }
      });
      expect(titles.at(-1)).toBe("abcdefghij");
    });
  });
});
