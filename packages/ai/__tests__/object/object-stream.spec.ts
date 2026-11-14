import {
  aguiObjectProtocol,
  encodeAGUIStream,
  ObjectStream,
  ObjectStreamError,
  SchemaValidationError,
  textObjectProtocol,
} from "@hyper-fetch/ai";
import { Client } from "@hyper-fetch/core";
import { z } from "zod";

const fast = { requestTime: 0, responseTime: 0 };
const schema = z.object({ title: z.string(), tags: z.array(z.string()) });

const createRequest = (chunks: string[], extra: Record<string, unknown> = {}) => {
  const client = new Client({ url: "http://object.test" });
  const calls: { payload: unknown; headers: unknown }[] = [];
  const request = client
    .createRequest<{ response: string; payload: { topic: string } }>()({ endpoint: "/api/object", method: "POST" })
    .setMock(
      ({ request: sent }) => {
        calls.push({ payload: sent.payload, headers: sent.headers });
        return { chunks, status: 200, ...extra } as never;
      },
      { ...fast, chunkTime: 1 },
    );
  return { request, calls };
};

describe("ObjectStream", () => {
  it("should stream partial objects and validate the final one", async () => {
    const { request, calls } = createRequest(['{"title":"Gr', 'eat","tags":["a"', ',"b"]}']);
    const stream = new ObjectStream({ request, schema });
    const objects: unknown[] = [];
    const statuses: string[] = [];
    stream.subscribe(() => {
      const snapshot = stream.getSnapshot();
      objects.push(snapshot.object);
      if (statuses.at(-1) !== snapshot.status) {
        statuses.push(snapshot.status);
      }
    });

    await stream.submit({ topic: "x" });

    expect(calls[0].payload).toEqual({ topic: "x" });
    expect(objects).toContainEqual({ title: "Gr" });
    expect(objects).toContainEqual({ title: "Great", tags: ["a"] });
    expect(stream.getSnapshot()).toMatchObject({
      object: { title: "Great", tags: ["a", "b"] },
      status: "ready",
      error: undefined,
      text: '{"title":"Great","tags":["a","b"]}',
    });
    expect(statuses).toEqual(["submitted", "streaming", "ready"]);
  });

  it("should not notify for chunks that don't change the parsed object", async () => {
    const { request } = createRequest(['{"title":', " ", " ", '"x","tags":[]}']);
    const stream = new ObjectStream({ request, schema });
    const objects: unknown[] = [];
    stream.subscribe(() => objects.push(stream.getSnapshot().object));
    await stream.submit({ topic: "x" });
    const distinct = objects.filter(
      (object, index) => index === 0 || JSON.stringify(object) !== JSON.stringify(objects[index - 1]),
    );
    expect(distinct.length).toBeLessThan(objects.length);
  });

  it("should fail when the final object does not match the schema", async () => {
    const onError = vi.fn();
    const onFinish = vi.fn();
    const { request } = createRequest(['{"title":1,"tags":[]}']);
    const stream = new ObjectStream({ request, schema, onError, onFinish });

    await stream.submit({ topic: "x" });

    expect(stream.getSnapshot().status).toBe("error");
    expect(stream.getSnapshot().error).toBeInstanceOf(SchemaValidationError);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith({ object: undefined, error: stream.getSnapshot().error });
  });

  it("should fail when the stream ends with incomplete JSON", async () => {
    const { request } = createRequest(['{"title":"cut']);
    const stream = new ObjectStream({ request, schema });

    await stream.submit({ topic: "x" });

    expect(stream.getSnapshot().error).toBeInstanceOf(ObjectStreamError);
    expect(stream.getSnapshot().object).toEqual({ title: "cut" });
  });

  it("should expose request errors", async () => {
    const { request } = createRequest([], { data: null, error: { message: "nope" }, status: 500, success: false });
    const stream = new ObjectStream({ request, schema });

    await stream.submit({ topic: "x" });

    expect(stream.getSnapshot()).toMatchObject({ status: "error", error: { message: "nope" } });
  });

  it("should stop, keep the partial object and abort a previous submit when submitting again", async () => {
    const { request } = createRequest(['{"title":"a', "b", "c", '","tags":[]}']);
    const stream = new ObjectStream({ request, schema });
    stream.subscribe(() => {
      if (stream.getSnapshot().text === '{"title":"a') {
        stream.stop();
      }
    });

    await stream.submit({ topic: "x" });

    expect(stream.getSnapshot()).toMatchObject({ status: "ready", object: { title: "a" }, error: undefined });

    stream.clear();
    expect(stream.getSnapshot()).toEqual({ object: undefined, text: "", status: "ready", error: undefined });
  });

  it("should ignore the result of a superseded submit", async () => {
    const { request } = createRequest(['{"title":"x","tags":[]}']);
    const stream = new ObjectStream({ request, schema });

    const first = stream.submit({ topic: "1" });
    const second = stream.submit({ topic: "2" });
    await Promise.all([first, second]);

    expect(stream.getSnapshot()).toMatchObject({ status: "ready", object: { title: "x", tags: [] } });
  });

  it("should start from the initial value", () => {
    const { request } = createRequest([]);
    const stream = new ObjectStream({ request, schema, initialValue: { title: "draft" } });
    expect(stream.getSnapshot().object).toEqual({ title: "draft" });
  });

  it("should let prepareBody shape the text protocol payload", async () => {
    const { request, calls } = createRequest(['{"title":"x","tags":[]}']);
    const stream = new ObjectStream({
      request,
      schema,
      protocol: textObjectProtocol({ prepareBody: (input) => ({ input }) }),
    });
    await stream.submit({ topic: "x" });
    expect(calls[0].payload).toEqual({ input: { topic: "x" } });
  });

  describe("when using AG-UI structured output (TanStack AI)", () => {
    const events = [
      { type: "RUN_STARTED", threadId: "t", runId: "r" },
      { type: "CUSTOM", name: "structured-output.start", value: { messageId: "m" } },
      { type: "TEXT_MESSAGE_START", messageId: "m", role: "assistant" },
      { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: '{"title":"Tan' },
      { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: 'Stack","tags":["ai"]}' },
      { type: "TEXT_MESSAGE_END", messageId: "m" },
      {
        type: "CUSTOM",
        name: "structured-output.complete",
        value: { object: { title: "TanStack", tags: ["ai", "final"] }, raw: "" },
      },
      { type: "RUN_FINISHED", threadId: "t", runId: "r" },
    ];

    it("should stream partial objects and prefer the completed object", async () => {
      const { request, calls } = createRequest(encodeAGUIStream(events));
      const stream = new ObjectStream({ request, schema, protocol: aguiObjectProtocol() });
      const objects: unknown[] = [];
      stream.subscribe(() => objects.push(stream.getSnapshot().object));

      await stream.submit({ topic: "ai" });

      expect(objects).toContainEqual({ title: "Tan" });
      expect(stream.getSnapshot().object).toEqual({ title: "TanStack", tags: ["ai", "final"] });
      const payload = calls[0].payload as { messages: { role: string; content: string }[]; runId: string };
      expect(payload.messages).toEqual([expect.objectContaining({ role: "user", content: '{"topic":"ai"}' })]);
      expect(calls[0].headers).toMatchObject({ "X-Run-Id": payload.runId });
    });

    it("should report RUN_ERROR", async () => {
      const { request } = createRequest(encodeAGUIStream([{ type: "RUN_ERROR", message: "No structured output" }]));
      const stream = new ObjectStream({ request, schema, protocol: aguiObjectProtocol() });
      await stream.submit({ topic: "ai" });
      expect(stream.getSnapshot().error).toBeInstanceOf(ObjectStreamError);
      expect((stream.getSnapshot().error as Error).message).toBe("No structured output");
    });

    it("should support a custom body", async () => {
      const { request, calls } = createRequest(encodeAGUIStream(events));
      const stream = new ObjectStream({
        request,
        schema,
        protocol: aguiObjectProtocol({
          prepareBody: (input, { runId }) => ({ input, runId }),
          headers: { "X-Extra": "1" },
        }),
      });
      await stream.submit("plain prompt");
      expect(calls[0].payload).toEqual({ input: "plain prompt", runId: expect.any(String) });
      expect(calls[0].headers).toMatchObject({ "X-Extra": "1" });
    });
  });
});
