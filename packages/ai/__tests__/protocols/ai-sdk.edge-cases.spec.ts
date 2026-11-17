import type { ChatMessageType, ChatStreamEventType } from "@hyper-fetch/ai";
import {
  aiSDKProtocol,
  aiSDKTextProtocol,
  ChatMessageBuilder,
  encodeAISDKStream,
  fromAISDKMessages,
  mapAISDKChunk,
  toAISDKMessages,
} from "@hyper-fetch/ai";

type Chunk = { type: string; [key: string]: unknown };

const decode = (wire: string | string[], protocol = aiSDKProtocol()) => {
  const events: ChatStreamEventType[] = [];
  const decoder = protocol.createDecoder((event) => events.push(event));
  (typeof wire === "string" ? [wire] : wire).forEach((piece) => decoder.feed(piece));
  decoder.flush();
  return events;
};

const build = (chunks: Chunk[], base?: ChatMessageType) => {
  const builder = new ChatMessageBuilder(base ?? { id: "local", role: "assistant", parts: [] });
  decode(encodeAISDKStream(chunks)).forEach((event) => builder.apply(event));
  return builder.message;
};

describe("AI SDK protocol [ edge cases ]", () => {
  describe("when chunks miss fields or carry wrong types", () => {
    it.each<[Chunk, ChatStreamEventType]>([
      [{ type: "start", messageId: 42 }, { type: "message-start" }],
      [{ type: "start", messageMetadata: null }, { type: "message-start" }],
      [
        { type: "start", messageMetadata: 0 },
        { type: "message-start", metadata: 0 },
      ],
      [{ type: "text-start" }, { type: "text-start", id: "" }],
      [
        { type: "text-delta", id: 7, delta: 5 },
        { type: "text-delta", id: "7", delta: "5" },
      ],
      [
        { type: "text-delta", id: "t", delta: null },
        { type: "text-delta", id: "t", delta: "" },
      ],
      [
        { type: "reasoning-delta", id: "r" },
        { type: "reasoning-delta", id: "r", delta: "" },
      ],
      [{ type: "tool-input-start" }, { type: "tool-input-start", toolCallId: "", toolName: "" }],
      [
        { type: "tool-input-start", toolCallId: "c", toolName: "t", providerExecuted: "yes", dynamic: 1, title: 5 },
        { type: "tool-input-start", toolCallId: "c", toolName: "t" },
      ],
      [
        { type: "tool-input-delta", toolCallId: "c" },
        { type: "tool-input-delta", toolCallId: "c", delta: "" },
      ],
      [
        { type: "tool-input-available", toolCallId: "c", toolName: "t" },
        { type: "tool-input-available", toolCallId: "c", toolName: "t", input: undefined },
      ],
      [
        { type: "tool-approval-response", approvalId: "a", approved: "true" },
        { type: "tool-approval-response", approvalId: "a", approved: false },
      ],
      [
        { type: "tool-output-available", toolCallId: "c", preliminary: "yes" },
        { type: "tool-output-available", toolCallId: "c", output: undefined },
      ],
      [
        { type: "tool-output-error", toolCallId: "c" },
        { type: "tool-output-error", toolCallId: "c", errorText: "" },
      ],
      [{ type: "source-url" }, { type: "source", sourceType: "url", sourceId: "", url: "" }],
      [{ type: "file" }, { type: "file", url: "", mediaType: "" }],
      [{ type: "finish", finishReason: 5 }, { type: "finish" }],
      [
        { type: "finish", finishReason: "made-up" },
        { type: "finish", finishReason: "other" },
      ],
      [
        { type: "finish", finishReason: "unknown" },
        { type: "finish", finishReason: "unknown" },
      ],
      [{ type: "finish", messageMetadata: null }, { type: "finish" }],
      [{ type: "message-metadata" }, { type: "message-metadata", metadata: undefined }],
      [
        { type: "message-metadata", messageMetadata: null },
        { type: "message-metadata", metadata: undefined },
      ],
      [{ type: "error" }, { type: "error", errorText: "An error occurred." }],
      [
        { type: "error", errorText: "" },
        { type: "error", errorText: "An error occurred." },
      ],
      [{ type: "abort", reason: 5 }, { type: "abort" }],
      [{ type: "data-x" }, { type: "data", name: "x", data: undefined }],
      [
        { type: "data-x", id: 5, data: 1, transient: "yes" },
        { type: "data", name: "x", data: 1 },
      ],
      [
        { type: "data-", data: 1 },
        { type: "data", name: "", data: 1 },
      ],
      [
        { type: "data-a-b-c", data: 1 },
        { type: "data", name: "a-b-c", data: 1 },
      ],
    ])("should map %j", (chunk, expected) => {
      expect(mapAISDKChunk(chunk)).toEqual([expected]);
    });

    it.each([
      [{ type: "custom", kind: "openai.compaction" }],
      [{ type: "reasoning-file", url: "data:image/png;base64,AA", mediaType: "image/png" }],
      [{ type: "steering-message", id: "s1", parts: [{ type: "text", text: "wait" }] }],
      [{ type: "brand-new" }],
      [{ type: 5 }],
      [{}],
    ])("should pass %j through as a raw event", (chunk) => {
      expect(mapAISDKChunk(chunk as Chunk)).toEqual([{ type: "raw", protocol: "ai-sdk", value: chunk }]);
    });

    it.each([null, 42, "text", true, [1, 2]])("should pass the JSON value %j through as a raw event", (value) => {
      const events = decode(`data: ${JSON.stringify(value)}\n\n`);
      expect(events).toEqual([{ type: "raw", protocol: "ai-sdk", value }]);
    });

    it("should name the broken chunk when the JSON is invalid", () => {
      expect(() => decode('data: {"type":"text-delta","id":\n\n')).toThrow(
        /Invalid AI SDK stream chunk: \{"type":"text-delta"/,
      );
      const long = `data: {"type":"${"x".repeat(500)}\n\n`;
      expect(() => decode(long)).toThrow(Error);
      try {
        decode(long);
      } catch (error) {
        expect((error as Error).message.length).toBeLessThan(260);
        expect((error as Error).cause).toBeInstanceOf(SyntaxError);
      }
    });
  });

  describe("when the SSE framing is unusual", () => {
    const chunk = { type: "text-delta", id: "t", delta: "x" };
    const event: ChatStreamEventType = { type: "text-delta", id: "t", delta: "x" };
    const json = JSON.stringify(chunk);

    it.each([
      ["no space after the colon", `data:${json}\n\n`],
      ["CRLF line endings", `data: ${json}\r\n\r\n`],
      ["CR line endings", `data: ${json}\r\r`],
      ["a byte order mark", `\uFEFFdata: ${json}\n\n`],
      ["comments and keep-alive pings", `: hello\n\n:\n\ndata: ${json}\n\n: ping\n\n`],
      ["event, id and retry fields", `event: message\nid: 7\nretry: 100\ndata: ${json}\n\n`],
      ["an unknown field", `foo: bar\ndata: ${json}\n\n`],
      ["no terminating blank line", `data: ${json}`],
      ["a [DONE] terminator", `data: ${json}\n\ndata: [DONE]\n\n`],
      ["an empty data line", `data:\n\ndata: ${json}\n\n`],
      ["blank lines before the first event", `\n\n\ndata: ${json}\n\n`],
    ])("should decode a stream with %s", (_name, wire) => {
      expect(decode(wire)).toEqual([event]);
    });

    it("should join multi-line data fields before parsing", () => {
      expect(decode('data: {"type":"text-delta",\ndata: "id":"t","delta":"x"}\n\n')).toEqual([event]);
    });

    it("should decode nothing from an empty or comment-only body", () => {
      expect(decode("")).toEqual([]);
      expect(decode(": nothing here\n\n")).toEqual([]);
      expect(decode("data: [DONE]\n\n")).toEqual([]);
    });
  });

  describe("when events arrive out of order", () => {
    it("should open a part for a delta without a start and ignore an end without a part", () => {
      const message = build([
        { type: "text-end", id: "ghost" },
        { type: "reasoning-end", id: "ghost" },
        { type: "reasoning-delta", id: "r", delta: "think" },
        { type: "text-delta", id: "t", delta: "say" },
        { type: "text-end", id: "t" },
      ]);
      expect(message.parts).toEqual([
        { type: "reasoning", id: "r", text: "think", state: "streaming" },
        { type: "text", id: "t", text: "say", state: "done" },
      ]);
    });

    it("should start a new part for a delta that arrives after the part ended", () => {
      const message = build([
        { type: "text-start", id: "t" },
        { type: "text-delta", id: "t", delta: "one" },
        { type: "text-end", id: "t" },
        { type: "text-end", id: "t" },
        { type: "text-delta", id: "t", delta: "two" },
      ]);
      expect(message.parts).toEqual([
        { type: "text", id: "t", text: "one", state: "done" },
        { type: "text", id: "t", text: "two", state: "streaming" },
      ]);
    });

    it("should ignore tool results, approvals and input deltas for unknown tool calls", () => {
      const message = build([
        { type: "tool-input-delta", toolCallId: "nope", inputTextDelta: "{" },
        { type: "tool-output-available", toolCallId: "nope", output: 1 },
        { type: "tool-output-error", toolCallId: "nope", errorText: "x" },
        { type: "tool-output-denied", toolCallId: "nope" },
        { type: "tool-approval-request", toolCallId: "nope", approvalId: "a" },
        { type: "tool-approval-response", approvalId: "a", approved: true },
      ]);
      expect(message.parts).toEqual([]);
    });

    it("should ignore a second start of a tool call that is still open", () => {
      const message = build([
        { type: "tool-input-start", toolCallId: "c", toolName: "search" },
        { type: "tool-input-delta", toolCallId: "c", inputTextDelta: '{"q":' },
        { type: "tool-input-start", toolCallId: "c", toolName: "search" },
        { type: "tool-input-delta", toolCallId: "c", inputTextDelta: '"x"}' },
      ]);
      expect(message.parts).toEqual([
        {
          type: "tool",
          toolName: "search",
          toolCallId: "c",
          state: "input-streaming",
          input: { q: "x" },
          rawInput: '{"q":"x"}',
        },
      ]);
    });

    it("should not touch the input of a tool call that already has its full input", () => {
      const message = build([
        { type: "tool-input-available", toolCallId: "c", toolName: "search", input: { q: "x" } },
        { type: "tool-input-delta", toolCallId: "c", inputTextDelta: '{"late":true}' },
      ]);
      expect(message.parts).toEqual([
        { type: "tool", toolName: "search", toolCallId: "c", state: "input-available", input: { q: "x" } },
      ]);
    });
  });

  describe("when tool input is streamed", () => {
    it("should keep invalid JSON as raw input until the backend reports the error", () => {
      const partial = build([
        { type: "tool-input-start", toolCallId: "c", toolName: "search" },
        { type: "tool-input-delta", toolCallId: "c", inputTextDelta: "not json at all" },
      ]);
      expect(partial.parts[0]).toMatchObject({ state: "input-streaming", rawInput: "not json at all" });

      const failed = build([
        { type: "tool-input-start", toolCallId: "c", toolName: "search" },
        { type: "tool-input-delta", toolCallId: "c", inputTextDelta: "not json at all" },
        {
          type: "tool-input-error",
          toolCallId: "c",
          toolName: "search",
          input: "not json at all",
          errorText: "Bad JSON",
        },
      ]);
      expect(failed.parts).toEqual([
        {
          type: "tool",
          toolName: "search",
          toolCallId: "c",
          state: "output-error",
          input: "not json at all",
          errorText: "Bad JSON",
        },
      ]);
    });

    it("should handle an empty input stream", () => {
      const message = build([
        { type: "tool-input-start", toolCallId: "c", toolName: "now" },
        { type: "tool-input-delta", toolCallId: "c", inputTextDelta: "" },
        { type: "tool-input-available", toolCallId: "c", toolName: "now", input: {} },
      ]);
      expect(message.parts).toEqual([
        { type: "tool", toolName: "now", toolCallId: "c", state: "input-available", input: {} },
      ]);
    });

    it("should treat a finished tool call id that is used again in a later step as a new call", () => {
      const message = build([
        { type: "start-step" },
        { type: "tool-input-available", toolCallId: "call_0", toolName: "search", input: { q: "a" } },
        { type: "tool-output-available", toolCallId: "call_0", output: "A" },
        { type: "finish-step" },
        { type: "start-step" },
        { type: "tool-input-start", toolCallId: "call_0", toolName: "search" },
        { type: "tool-input-delta", toolCallId: "call_0", inputTextDelta: '{"q":"b"}' },
        { type: "tool-input-available", toolCallId: "call_0", toolName: "search", input: { q: "b" } },
        { type: "tool-output-available", toolCallId: "call_0", output: "B" },
        { type: "finish-step" },
      ]);
      expect(message.parts).toEqual([
        { type: "step-start" },
        {
          type: "tool",
          toolName: "search",
          toolCallId: "call_0",
          state: "output-available",
          input: { q: "a" },
          output: "A",
        },
        { type: "step-start" },
        {
          type: "tool",
          toolName: "search",
          toolCallId: "call_0",
          state: "output-available",
          input: { q: "b" },
          output: "B",
        },
      ]);
    });

    it("should continue a pending tool call of an earlier step instead of duplicating it", () => {
      const message = build([
        { type: "start-step" },
        { type: "tool-input-available", toolCallId: "c", toolName: "search", input: { q: "a" } },
        { type: "finish-step" },
        { type: "start-step" },
        { type: "tool-input-available", toolCallId: "c", toolName: "search", input: { q: "a" } },
        { type: "tool-output-available", toolCallId: "c", output: "A" },
      ]);
      expect(message.parts).toEqual([
        { type: "step-start" },
        {
          type: "tool",
          toolName: "search",
          toolCallId: "c",
          state: "output-available",
          input: { q: "a" },
          output: "A",
        },
        { type: "step-start" },
      ]);
    });
  });

  describe("when using the text stream protocol", () => {
    it("should keep every character, including what looks like SSE", () => {
      const pieces = ["data: {", '"type":"x"}\n\n', "\uFEFF", " \n", "end"];
      const events = decode(pieces, aiSDKTextProtocol());
      const text = events
        .filter((event) => event.type === "text-delta")
        .map((event) => (event.type === "text-delta" ? event.delta : ""))
        .join("");
      expect(text).toBe(pieces.join(""));
      expect(events.map((event) => event.type)).toEqual([
        "message-start",
        "step-start",
        "text-start",
        ...pieces.map(() => "text-delta"),
        "text-end",
        "step-finish",
        "finish",
      ]);
    });

    it("should start over after a reset", () => {
      const events: ChatStreamEventType[] = [];
      const decoder = aiSDKTextProtocol().createDecoder((event) => events.push(event));
      decoder.feed("first");
      decoder.reset();
      decoder.feed("second");
      decoder.flush();
      decoder.flush();
      expect(events.map((event) => event.type)).toEqual([
        "message-start",
        "step-start",
        "text-start",
        "text-delta",
        "message-start",
        "step-start",
        "text-start",
        "text-delta",
        "text-end",
        "step-finish",
        "finish",
      ]);
    });

    it("should send the same request body as the UI message stream protocol", () => {
      const context = {
        chatId: "c",
        runId: "r",
        messages: [],
        trigger: "submit-message" as const,
        body: { extra: 1 },
        state: undefined,
        tools: [],
        resume: [],
      };
      expect(aiSDKTextProtocol().prepareRequest(context)).toEqual(aiSDKProtocol().prepareRequest(context));
      expect(aiSDKTextProtocol().name).toBe("ai-sdk-text");
      expect(aiSDKProtocol().name).toBe("ai-sdk");
    });
  });

  describe("when preparing requests", () => {
    const base = {
      chatId: "chat-1",
      runId: "run-1",
      messages: [] as ChatMessageType[],
      body: {},
      state: undefined,
      tools: [],
      resume: [],
    };

    it("should not let extra body fields replace the protocol fields", () => {
      const { payload } = aiSDKProtocol().prepareRequest({
        ...base,
        trigger: "regenerate-message",
        messageId: "m1",
        body: { id: "spoofed", messages: "spoofed", trigger: "spoofed", messageId: "spoofed", model: "gpt" },
      });
      expect(payload).toEqual({
        id: "chat-1",
        messages: [],
        trigger: "regenerate-message",
        messageId: "m1",
        model: "gpt",
      });
    });

    it("should hand the default body and the context to prepareBody", () => {
      const prepareBody = vi.fn(({ defaultBody }: { defaultBody: Record<string, unknown> }) => ({
        ...defaultBody,
        wrapped: true,
      }));
      const { payload } = aiSDKProtocol({ prepareBody }).prepareRequest({ ...base, trigger: "submit-message" });
      expect(payload).toEqual({
        id: "chat-1",
        messages: [],
        trigger: "submit-message",
        messageId: undefined,
        wrapped: true,
      });
      expect(prepareBody).toHaveBeenCalledWith(expect.objectContaining({ chatId: "chat-1", runId: "run-1" }));
    });

    it("should not call prepareBody when resuming a stream", () => {
      const prepareBody = vi.fn();
      expect(aiSDKProtocol({ prepareBody }).prepareRequest({ ...base, trigger: "resume-stream" })).toEqual({
        payload: undefined,
      });
      expect(prepareBody).not.toHaveBeenCalled();
    });
  });

  describe("when converting messages", () => {
    it("should keep the request reason of an approval in both directions", () => {
      const message: ChatMessageType = {
        id: "a",
        role: "assistant",
        parts: [
          {
            type: "tool",
            toolName: "pay",
            toolCallId: "c",
            state: "approval-responded",
            input: { amount: 5 },
            approval: { id: "ap", reason: "Costs money", approved: true, responseReason: "Fine" },
          },
        ],
      };
      const [converted] = toAISDKMessages([message]);
      expect(converted.parts[0].approval).toEqual({
        id: "ap",
        requestReason: "Costs money",
        approved: true,
        reason: "Fine",
      });
      expect(fromAISDKMessages([converted])).toEqual([message]);
    });

    it("should skip part types it does not know and keep the rest in order", () => {
      const [message] = fromAISDKMessages([
        {
          id: "a",
          role: "assistant",
          parts: [
            { type: "custom", kind: "x" },
            { type: "text", text: "kept" },
            { type: "reasoning-file", url: "u", mediaType: "image/png" },
            { type: "steering-message", id: "s", parts: [] },
            { type: "data-note", data: 1 },
          ],
        },
      ]);
      expect(message.parts).toEqual([
        { type: "text", id: "a-1", text: "kept", state: "done" },
        { type: "data", name: "note", data: 1 },
      ]);
    });

    it("should convert empty lists and messages without parts", () => {
      expect(toAISDKMessages([])).toEqual([]);
      expect(fromAISDKMessages([])).toEqual([]);
      expect(toAISDKMessages([{ id: "a", role: "assistant", parts: [] }])).toEqual([
        { id: "a", role: "assistant", parts: [] },
      ]);
    });

    it("should keep falsy metadata and drop undefined metadata", () => {
      expect(toAISDKMessages([{ id: "a", role: "assistant", metadata: 0, parts: [] }])[0]).toHaveProperty(
        "metadata",
        0,
      );
      expect(toAISDKMessages([{ id: "a", role: "assistant", parts: [] }])[0]).not.toHaveProperty("metadata");
    });
  });
});
