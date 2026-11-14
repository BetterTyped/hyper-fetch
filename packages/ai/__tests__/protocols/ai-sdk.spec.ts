import type {
  AISDKUIMessageType,
  ChatMessageType,
  ChatPrepareRequestContextType,
  ChatStreamEventType,
} from "@hyper-fetch/ai";
import {
  aiSDKProtocol,
  aiSDKTextProtocol,
  encodeAISDKStream,
  fromAISDKMessages,
  mapAISDKChunk,
  splitIntoChunks,
  toAISDKMessages,
} from "@hyper-fetch/ai";

const decode = (protocol: ReturnType<typeof aiSDKProtocol>, pieces: string[]) => {
  const events: ChatStreamEventType[] = [];
  const decoder = protocol.createDecoder((event) => events.push(event));
  pieces.forEach((piece) => decoder.feed(piece));
  decoder.flush();
  return events;
};

const context = (overrides: Partial<ChatPrepareRequestContextType> = {}): ChatPrepareRequestContextType => ({
  chatId: "chat-1",
  runId: "run-1",
  messages: [],
  trigger: "submit-message",
  body: {},
  state: undefined,
  tools: [],
  resume: [],
  ...overrides,
});

describe("AI SDK protocol", () => {
  describe("when decoding the UI message stream", () => {
    const chunks = [
      { type: "start", messageId: "msg-1", messageMetadata: { model: "m" } },
      { type: "start-step" },
      { type: "reasoning-start", id: "r1" },
      { type: "reasoning-delta", id: "r1", delta: "hmm" },
      { type: "reasoning-end", id: "r1" },
      { type: "text-start", id: "t1" },
      { type: "text-delta", id: "t1", delta: "Hi" },
      { type: "text-end", id: "t1" },
      { type: "tool-input-start", toolCallId: "c1", toolName: "weather", dynamic: false, title: "Weather" },
      { type: "tool-input-delta", toolCallId: "c1", inputTextDelta: '{"city":' },
      { type: "tool-input-available", toolCallId: "c1", toolName: "weather", input: { city: "Oslo" } },
      { type: "tool-approval-request", approvalId: "a1", toolCallId: "c1", reason: "sure?" },
      { type: "tool-approval-response", approvalId: "a1", approved: true },
      { type: "tool-output-available", toolCallId: "c1", output: { temp: 1 }, preliminary: true },
      { type: "tool-output-error", toolCallId: "c2", errorText: "x" },
      { type: "tool-output-denied", toolCallId: "c3" },
      { type: "tool-input-error", toolCallId: "c4", toolName: "t", input: "bad", errorText: "bad input" },
      { type: "source-url", sourceId: "s1", url: "https://a.com", title: "A" },
      { type: "source-document", sourceId: "s2", mediaType: "application/pdf", title: "Doc", filename: "a.pdf" },
      { type: "file", url: "https://f.png", mediaType: "image/png" },
      { type: "data-weather", id: "w1", data: { temp: 3 } },
      { type: "data-toast", data: "hi", transient: true },
      { type: "message-metadata", messageMetadata: { tokens: 3 } },
      { type: "finish-step" },
      { type: "reset-step" },
      { type: "finish", finishReason: "tool-calls", messageMetadata: { done: true } },
      { type: "custom", kind: "vendor.thing" },
    ];

    const expected: ChatStreamEventType[] = [
      { type: "message-start", messageId: "msg-1", metadata: { model: "m" } },
      { type: "step-start" },
      { type: "reasoning-start", id: "r1" },
      { type: "reasoning-delta", id: "r1", delta: "hmm" },
      { type: "reasoning-end", id: "r1" },
      { type: "text-start", id: "t1" },
      { type: "text-delta", id: "t1", delta: "Hi" },
      { type: "text-end", id: "t1" },
      { type: "tool-input-start", toolCallId: "c1", toolName: "weather", dynamic: false, title: "Weather" },
      { type: "tool-input-delta", toolCallId: "c1", delta: '{"city":' },
      { type: "tool-input-available", toolCallId: "c1", toolName: "weather", input: { city: "Oslo" } },
      { type: "tool-approval-request", approvalId: "a1", toolCallId: "c1", reason: "sure?" },
      { type: "tool-approval-response", approvalId: "a1", approved: true },
      { type: "tool-output-available", toolCallId: "c1", output: { temp: 1 }, preliminary: true },
      { type: "tool-output-error", toolCallId: "c2", errorText: "x" },
      { type: "tool-output-denied", toolCallId: "c3" },
      { type: "tool-input-error", toolCallId: "c4", toolName: "t", input: "bad", errorText: "bad input" },
      { type: "source", sourceType: "url", sourceId: "s1", url: "https://a.com", title: "A" },
      {
        type: "source",
        sourceType: "document",
        sourceId: "s2",
        mediaType: "application/pdf",
        title: "Doc",
        filename: "a.pdf",
      },
      { type: "file", url: "https://f.png", mediaType: "image/png" },
      { type: "data", name: "weather", id: "w1", data: { temp: 3 } },
      { type: "data", name: "toast", data: "hi", transient: true },
      { type: "message-metadata", metadata: { tokens: 3 } },
      { type: "step-finish" },
      { type: "step-reset" },
      { type: "finish", finishReason: "tool-calls", metadata: { done: true } },
      { type: "raw", protocol: "ai-sdk", value: { type: "custom", kind: "vendor.thing" } },
    ];

    it("should map every chunk type", () => {
      expect(decode(aiSDKProtocol(), encodeAISDKStream(chunks))).toEqual(expected);
    });

    it("should decode the same events no matter how the network splits the stream", () => {
      const pieces = encodeAISDKStream(chunks);
      [1, 3, 7, 64].forEach((size) => {
        expect(decode(aiSDKProtocol(), splitIntoChunks(pieces, size))).toEqual(expected);
      });
    });

    it("should ignore SSE comments and the [DONE] terminator", () => {
      const events = decode(aiSDKProtocol(), [
        ": stream-open\n\n",
        ": keep-alive\n\n",
        'data: {"type":"start"}\n\n',
        "data: [DONE]\n\n",
      ]);
      expect(events).toEqual([{ type: "message-start" }]);
    });

    it("should map errors, aborts and unknown finish reasons", () => {
      expect(mapAISDKChunk({ type: "error", errorText: "Boom" })).toEqual([{ type: "error", errorText: "Boom" }]);
      expect(mapAISDKChunk({ type: "error" })).toEqual([{ type: "error", errorText: "An error occurred." }]);
      expect(mapAISDKChunk({ type: "abort", reason: "user" })).toEqual([{ type: "abort", reason: "user" }]);
      expect(mapAISDKChunk({ type: "abort" })).toEqual([{ type: "abort" }]);
      expect(mapAISDKChunk({ type: "finish", finishReason: "something-new" })).toEqual([
        { type: "finish", finishReason: "other" },
      ]);
      expect(mapAISDKChunk({ type: "finish" })).toEqual([{ type: "finish" }]);
    });

    it("should throw on invalid JSON", () => {
      const decoder = aiSDKProtocol().createDecoder(() => {});
      expect(() => decoder.feed("data: {nope\n\n")).toThrow("Invalid AI SDK stream chunk");
    });
  });

  describe("when preparing requests", () => {
    it("should send the AI SDK default body", () => {
      const messages: ChatMessageType[] = [
        { id: "u1", role: "user", parts: [{ type: "text", id: "p", text: "Hi", state: "done" }] },
      ];
      const { payload } = aiSDKProtocol().prepareRequest(
        context({ messages, trigger: "regenerate-message", messageId: "m2", body: { custom: 1 } }),
      );
      expect(payload).toEqual({
        custom: 1,
        id: "chat-1",
        messages: [{ id: "u1", role: "user", parts: [{ type: "text", text: "Hi", state: "done" }] }],
        trigger: "regenerate-message",
        messageId: "m2",
      });
    });

    it("should let prepareBody replace the body", () => {
      const protocol = aiSDKProtocol({
        prepareBody: ({ defaultBody, messages }) => ({ last: messages.at(-1)?.id, keys: Object.keys(defaultBody) }),
      });
      const { payload } = protocol.prepareRequest(context({ messages: [{ id: "x", role: "user", parts: [] }] }));
      expect(payload).toEqual({ last: "x", keys: ["id", "messages", "trigger", "messageId"] });
    });

    it("should send no body when resuming a stream", () => {
      expect(aiSDKProtocol().prepareRequest(context({ trigger: "resume-stream" }))).toEqual({ payload: undefined });
    });
  });

  describe("when converting messages", () => {
    const aiSDKMessages: AISDKUIMessageType[] = [
      {
        id: "u1",
        role: "user",
        metadata: { at: 1 },
        parts: [
          { type: "text", text: "Hi" },
          { type: "file", mediaType: "image/png", url: "u", filename: "f.png" },
        ],
      },
      {
        id: "a1",
        role: "assistant",
        parts: [
          { type: "step-start" },
          { type: "reasoning", text: "r", state: "done" },
          { type: "text", text: "Hello", state: "done" },
          {
            type: "tool-weather",
            toolCallId: "c1",
            state: "output-available",
            input: { city: "Oslo" },
            output: { temp: 1 },
          },
          {
            type: "dynamic-tool",
            toolName: "mcp_search",
            toolCallId: "c2",
            state: "output-error",
            input: {},
            errorText: "x",
          },
          {
            type: "tool-pay",
            toolCallId: "c3",
            state: "approval-responded",
            input: {},
            approval: { id: "ap", approved: false, reason: "no" },
          },
          { type: "data-weather", id: "w", data: { temp: 2 } },
          { type: "source-url", sourceId: "s", url: "https://a.com" },
          { type: "source-document", sourceId: "d", mediaType: "application/pdf", title: "Doc" },
          { type: "unknown-part" },
        ],
      },
    ];

    it("should convert AI SDK messages to chat messages", () => {
      const messages = fromAISDKMessages(aiSDKMessages);
      expect(messages[0]).toEqual({
        id: "u1",
        role: "user",
        metadata: { at: 1 },
        parts: [
          { type: "text", id: "u1-0", text: "Hi", state: "done" },
          { type: "file", mediaType: "image/png", url: "u", filename: "f.png" },
        ],
      });
      expect(messages[1].parts).toEqual([
        { type: "step-start" },
        { type: "reasoning", id: "a1-1", text: "r", state: "done" },
        { type: "text", id: "a1-2", text: "Hello", state: "done" },
        {
          type: "tool",
          toolName: "weather",
          toolCallId: "c1",
          state: "output-available",
          input: { city: "Oslo" },
          output: { temp: 1 },
        },
        {
          type: "tool",
          toolName: "mcp_search",
          toolCallId: "c2",
          state: "output-error",
          input: {},
          errorText: "x",
          dynamic: true,
        },
        {
          type: "tool",
          toolName: "pay",
          toolCallId: "c3",
          state: "approval-responded",
          input: {},
          approval: { id: "ap", approved: false, responseReason: "no" },
        },
        { type: "data", name: "weather", id: "w", data: { temp: 2 } },
        { type: "source", sourceType: "url", sourceId: "s", url: "https://a.com" },
        { type: "source", sourceType: "document", sourceId: "d", mediaType: "application/pdf", title: "Doc" },
      ]);
    });

    it("should round-trip through the AI SDK format", () => {
      const messages = fromAISDKMessages(aiSDKMessages);
      expect(fromAISDKMessages(toAISDKMessages(messages))).toEqual(messages);
    });

    it("should write tool parts the way AI SDK expects", () => {
      const [, assistant] = toAISDKMessages(fromAISDKMessages(aiSDKMessages));
      expect(assistant.parts).toContainEqual({
        type: "tool-weather",
        toolCallId: "c1",
        state: "output-available",
        input: { city: "Oslo" },
        output: { temp: 1 },
      });
      expect(assistant.parts).toContainEqual({
        type: "dynamic-tool",
        toolName: "mcp_search",
        toolCallId: "c2",
        state: "output-error",
        input: {},
        errorText: "x",
      });
      expect(assistant.parts).toContainEqual({
        type: "tool-pay",
        toolCallId: "c3",
        state: "approval-responded",
        input: {},
        approval: { id: "ap", approved: false, reason: "no" },
      });
    });
  });

  describe("when using the text stream protocol", () => {
    it("should turn raw text into a single text part", () => {
      expect(decode(aiSDKTextProtocol(), ["Hel", "lo"])).toEqual([
        { type: "message-start" },
        { type: "step-start" },
        { type: "text-start", id: "text-1" },
        { type: "text-delta", id: "text-1", delta: "Hel" },
        { type: "text-delta", id: "text-1", delta: "lo" },
        { type: "text-end", id: "text-1" },
        { type: "step-finish" },
        { type: "finish", finishReason: "stop" },
      ]);
    });

    it("should emit nothing for an empty body and restart after reset", () => {
      expect(decode(aiSDKTextProtocol(), [""])).toEqual([]);
      const events: ChatStreamEventType[] = [];
      const decoder = aiSDKTextProtocol().createDecoder((event) => events.push(event));
      decoder.feed("a");
      decoder.reset();
      decoder.feed("b");
      expect(events.filter((event) => event.type === "message-start")).toHaveLength(2);
    });
  });
});
