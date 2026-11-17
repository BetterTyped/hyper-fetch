import type {
  AGUIMessageType,
  ChatMessageType,
  ChatPrepareRequestContextType,
  ChatStreamEventType,
} from "@hyper-fetch/ai";
import {
  aguiProtocol,
  createAGUIEventMapper,
  encodeAGUIStream,
  fromAGUIMessages,
  splitIntoChunks,
  tanstackAIProtocol,
  toAGUIMessages,
} from "@hyper-fetch/ai";

const decode = (protocol = aguiProtocol(), pieces: string[] = []) => {
  const events: ChatStreamEventType[] = [];
  const decoder = protocol.createDecoder((event) => events.push(event));
  pieces.forEach((piece) => decoder.feed(piece));
  decoder.flush();
  return events;
};

const mapAll = (events: Record<string, unknown>[]) => {
  const mapper = createAGUIEventMapper();
  return events.flatMap((event) => mapper.map(event as { type: string }));
};

const context = (overrides: Partial<ChatPrepareRequestContextType> = {}): ChatPrepareRequestContextType => ({
  chatId: "thread-1",
  runId: "run-2",
  messages: [],
  trigger: "submit-message",
  body: {},
  state: undefined,
  tools: [],
  resume: [],
  ...overrides,
});

describe("AG-UI protocol", () => {
  describe("when mapping events", () => {
    it("should map a run with text, reasoning and tool calls", () => {
      expect(
        mapAll([
          { type: "RUN_STARTED", threadId: "t", runId: "r" },
          { type: "REASONING_START", messageId: "r1" },
          { type: "REASONING_MESSAGE_START", messageId: "r1", role: "reasoning" },
          { type: "REASONING_MESSAGE_CONTENT", messageId: "r1", delta: "think" },
          { type: "REASONING_MESSAGE_END", messageId: "r1" },
          { type: "REASONING_END", messageId: "r1" },
          { type: "TEXT_MESSAGE_START", messageId: "m1", role: "assistant" },
          { type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: "Hi" },
          { type: "TEXT_MESSAGE_END", messageId: "m1" },
          { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "search", parentMessageId: "m1" },
          { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"q":' },
          { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '"cats"}' },
          { type: "TOOL_CALL_END", toolCallId: "c1" },
          { type: "TOOL_CALL_RESULT", messageId: "m2", toolCallId: "c1", content: '{"hits":2}' },
          {
            type: "RUN_FINISHED",
            threadId: "t",
            runId: "r",
            outcome: { type: "success" },
            usage: [{ inputTokens: 3, outputTokens: 4 }, { inputTokens: 1 }],
          },
        ]),
      ).toEqual([
        { type: "run-start", threadId: "t", runId: "r" },
        { type: "message-start" },
        { type: "step-start" },
        { type: "reasoning-start", id: "r1" },
        { type: "reasoning-delta", id: "r1", delta: "think" },
        { type: "reasoning-end", id: "r1" },
        { type: "text-start", id: "m1" },
        { type: "text-delta", id: "m1", delta: "Hi" },
        { type: "text-end", id: "m1" },
        { type: "tool-input-start", toolCallId: "c1", toolName: "search" },
        { type: "tool-input-delta", toolCallId: "c1", delta: '{"q":' },
        { type: "tool-input-delta", toolCallId: "c1", delta: '"cats"}' },
        { type: "tool-input-available", toolCallId: "c1", toolName: "search", input: { q: "cats" } },
        { type: "tool-output-available", toolCallId: "c1", output: { hits: 2 } },
        { type: "usage", usage: { inputTokens: 4, outputTokens: 4 } },
        { type: "finish", finishReason: "stop" },
      ]);
    });

    it("should expand CHUNK events into start, content and end", () => {
      expect(
        mapAll([
          { type: "TEXT_MESSAGE_CHUNK", messageId: "m1", delta: "a" },
          { type: "TEXT_MESSAGE_CHUNK", delta: "b" },
          { type: "TOOL_CALL_CHUNK", toolCallId: "c1", toolCallName: "x", delta: '{"a"' },
          { type: "TOOL_CALL_CHUNK", delta: ":1}" },
          { type: "REASONING_MESSAGE_CHUNK", messageId: "r", delta: "hm" },
          { type: "TEXT_MESSAGE_CHUNK", messageId: "m2", delta: "c" },
          { type: "RUN_FINISHED", outcome: { type: "success" } },
        ]),
      ).toEqual([
        { type: "message-start" },
        { type: "step-start" },
        { type: "text-start", id: "m1" },
        { type: "text-delta", id: "m1", delta: "a" },
        { type: "text-delta", id: "m1", delta: "b" },
        { type: "text-end", id: "m1" },
        { type: "tool-input-start", toolCallId: "c1", toolName: "x" },
        { type: "tool-input-delta", toolCallId: "c1", delta: '{"a"' },
        { type: "tool-input-delta", toolCallId: "c1", delta: ":1}" },
        { type: "tool-input-available", toolCallId: "c1", toolName: "x", input: { a: 1 } },
        { type: "reasoning-start", id: "r" },
        { type: "reasoning-delta", id: "r", delta: "hm" },
        { type: "reasoning-end", id: "r" },
        { type: "text-start", id: "m2" },
        { type: "text-delta", id: "m2", delta: "c" },
        { type: "text-end", id: "m2" },
        { type: "finish", finishReason: "stop" },
      ]);
    });

    it("should upgrade legacy THINKING events", () => {
      expect(
        mapAll([
          { type: "THINKING_START" },
          { type: "THINKING_TEXT_MESSAGE_START" },
          { type: "THINKING_TEXT_MESSAGE_CONTENT", delta: "x" },
          { type: "THINKING_TEXT_MESSAGE_END" },
          { type: "THINKING_END" },
        ]),
      ).toEqual([
        { type: "message-start" },
        { type: "step-start" },
        { type: "reasoning-start", id: "reasoning" },
        { type: "reasoning-delta", id: "reasoning", delta: "x" },
        { type: "reasoning-end", id: "reasoning" },
      ]);
    });

    it("should handle tool calls without arguments, invalid arguments and plain text results", () => {
      expect(
        mapAll([
          { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "now" },
          { type: "TOOL_CALL_END", toolCallId: "c1" },
          { type: "TOOL_CALL_START", toolCallId: "c2", toolCallName: "bad" },
          { type: "TOOL_CALL_ARGS", toolCallId: "c2", delta: "{oops" },
          { type: "TOOL_CALL_END", toolCallId: "c2" },
          { type: "TOOL_CALL_RESULT", toolCallId: "c1", content: "12:00" },
        ]).filter((event) => event.type !== "tool-input-start" && event.type !== "tool-input-delta"),
      ).toEqual([
        { type: "message-start" },
        { type: "step-start" },
        { type: "tool-input-available", toolCallId: "c1", toolName: "now", input: {} },
        {
          type: "tool-input-error",
          toolCallId: "c2",
          toolName: "bad",
          input: "{oops",
          errorText: "Invalid tool call arguments: not valid JSON",
        },
        { type: "tool-output-available", toolCallId: "c1", output: "12:00" },
      ]);
    });

    it("should prefer TanStack parsed arguments from metadata", () => {
      const events = mapAll([
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "x" },
        { type: "TOOL_CALL_END", toolCallId: "c1", metadata: { tanstack: { args: { parsed: true } } } },
      ]);
      expect(events.at(-1)).toEqual({
        type: "tool-input-available",
        toolCallId: "c1",
        toolName: "x",
        input: { parsed: true },
      });
    });

    it("should map state, messages, activity, custom and raw events", () => {
      const events = mapAll([
        { type: "STATE_SNAPSHOT", snapshot: { step: 1 } },
        { type: "STATE_DELTA", delta: [{ op: "replace", path: "/step", value: 2 }] },
        { type: "MESSAGES_SNAPSHOT", messages: [{ id: "u", role: "user", content: "hi" }] },
        { type: "ACTIVITY_SNAPSHOT", messageId: "a1", activityType: "plan", content: { steps: [] } },
        {
          type: "ACTIVITY_DELTA",
          messageId: "a1",
          activityType: "plan",
          patch: [
            { op: "add", path: "/steps/-", value: "x" },
            { op: "move", from: "/a", path: "/b" },
          ],
        },
        { type: "CUSTOM", name: "ui-resource", value: { uri: "x" } },
        { type: "RAW", event: { anything: true } },
        { type: "STEP_STARTED", stepName: "plan" },
      ]);
      expect(events).toEqual([
        { type: "state-snapshot", state: { step: 1 } },
        { type: "state-delta", patch: [{ op: "replace", path: "/step", value: 2 }] },
        {
          type: "messages-snapshot",
          messages: [{ id: "u", role: "user", parts: [{ type: "text", id: "u-0", text: "hi", state: "done" }] }],
        },
        { type: "message-start" },
        { type: "step-start" },
        { type: "data", name: "activity", id: "a1", data: { activityType: "plan", content: { steps: [] } } },
        {
          type: "data-patch",
          name: "activity",
          id: "a1",
          patch: [
            { op: "add", path: "/content/steps/-", value: "x" },
            { op: "move", from: "/content/a", path: "/content/b" },
          ],
        },
        { type: "data", name: "ui-resource", data: { uri: "x" }, transient: true },
        { type: "raw", protocol: "ag-ui", value: { type: "RAW", event: { anything: true } } },
        { type: "raw", protocol: "ag-ui", value: { type: "STEP_STARTED", stepName: "plan" } },
      ]);
    });

    it("should map TanStack interrupts to approvals, client tools and generic interrupts", () => {
      const events = mapAll([
        {
          type: "RUN_FINISHED",
          outcome: {
            type: "interrupt",
            interrupts: [
              {
                id: "ap-1",
                reason: "tool_call",
                message: "Approve payment?",
                toolCallId: "c1",
                metadata: { kind: "approval" },
              },
              {
                id: "client_tool_c2",
                reason: "tanstack:client_tool_execution",
                toolCallId: "c2",
                metadata: { kind: "client_tool" },
              },
              { id: "human-1", reason: "confirm", message: "Continue?" },
            ],
          },
        },
      ]);
      expect(events).toEqual([
        {
          type: "tool-approval-request",
          toolCallId: "c1",
          approvalId: "ap-1",
          interruptId: "ap-1",
          reason: "Approve payment?",
        },
        { type: "tool-client-execution", toolCallId: "c2", interruptId: "client_tool_c2" },
        { type: "interrupt", interrupts: [{ id: "human-1", reason: "confirm", message: "Continue?" }] },
        { type: "finish", finishReason: "tool-calls" },
      ]);
    });

    it("should map finish reasons and errors", () => {
      expect(mapAll([{ type: "RUN_FINISHED", metadata: { tanstack: { finishReason: "content_filter" } } }])).toEqual([
        { type: "finish", finishReason: "content-filter" },
      ]);
      expect(mapAll([{ type: "RUN_FINISHED", metadata: { tanstack: { finishReason: "weird" } } }])).toEqual([
        { type: "finish", finishReason: "other" },
      ]);
      expect(mapAll([{ type: "RUN_FINISHED", outcome: { type: "cancelled" } }])).toEqual([
        { type: "finish", finishReason: "interrupted" },
      ]);
      expect(mapAll([{ type: "RUN_ERROR", message: "Rate limited", usage: [{ outputTokens: 2 }] }])).toEqual([
        { type: "usage", usage: { outputTokens: 2 } },
        { type: "error", errorText: "Rate limited" },
      ]);
      expect(mapAll([{ type: "RUN_ERROR" }])).toEqual([{ type: "error", errorText: "Run failed" }]);
    });
  });

  describe("when decoding framed streams", () => {
    const events = [
      { type: "RUN_STARTED", threadId: "t", runId: "r" },
      { type: "TEXT_MESSAGE_START", messageId: "m", role: "assistant" },
      { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "zażółć 🚀" },
      { type: "TEXT_MESSAGE_END", messageId: "m" },
      { type: "RUN_FINISHED", threadId: "t", runId: "r" },
    ];
    const expected = mapAll(events);

    it.each(["sse", "ndjson"] as const)("should auto-detect %s framing however the stream is split", (framing) => {
      const pieces = encodeAGUIStream(events, { framing });
      [1, 5, 1000].forEach((size) => {
        expect(decode(aguiProtocol(), splitIntoChunks(pieces, size))).toEqual(expected);
      });
    });

    it("should unwrap TanStack durable NDJSON envelopes", () => {
      const pieces = events.map((event, index) => `${JSON.stringify({ id: String(index), chunk: event })}\n`);
      expect(decode(tanstackAIProtocol(), pieces)).toEqual(expected);
    });

    it("should read SSE event ids and ignore comments", () => {
      const pieces = [
        ": ping\n\n",
        ...events.map((event, index) => `id: ${index}\ndata: ${JSON.stringify(event)}\n\n`),
      ];
      expect(decode(aguiProtocol({ framing: "sse" }), pieces)).toEqual(expected);
    });

    it("should close open parts when the stream ends without RUN_FINISHED", () => {
      const pieces = encodeAGUIStream([
        { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "cut" },
        { type: "TOOL_CALL_CHUNK", toolCallId: "c", toolCallName: "x", delta: "{}" },
      ]);
      expect(decode(aguiProtocol(), pieces).slice(-1)).toEqual([
        { type: "tool-input-available", toolCallId: "c", toolName: "x", input: {} },
      ]);
    });

    it("should detect framing from a stream buffered until flush", () => {
      const decoderEvents: ChatStreamEventType[] = [];
      const decoder = aguiProtocol().createDecoder((event) => decoderEvents.push(event));
      decoder.feed("   ");
      decoder.feed(JSON.stringify({ type: "TEXT_MESSAGE_CHUNK", messageId: "m", delta: "x" }));
      decoder.flush();
      expect(decoderEvents.map((event) => event.type)).toEqual([
        "message-start",
        "step-start",
        "text-start",
        "text-delta",
        "text-end",
      ]);
    });

    it("should throw on invalid SSE JSON and reset cleanly", () => {
      const decoder = aguiProtocol().createDecoder(() => {});
      expect(() => decoder.feed("data: {oops\n\n")).toThrow("Invalid AG-UI event");
      decoder.reset();
      expect(() => decoder.feed(`data: ${JSON.stringify({ type: "RUN_STARTED" })}\n\n`)).not.toThrow();
    });
  });

  describe("when preparing requests", () => {
    const messages: ChatMessageType[] = [
      { id: "s", role: "system", parts: [{ type: "text", id: "s0", text: "Be nice", state: "done" }] },
      { id: "u", role: "user", parts: [{ type: "text", id: "u0", text: "Weather?", state: "done" }] },
      {
        id: "a",
        role: "assistant",
        parts: [
          { type: "step-start" },
          { type: "text", id: "t", text: "Checking", state: "done" },
          {
            type: "tool",
            toolName: "weather",
            toolCallId: "c1",
            state: "output-available",
            input: { city: "Oslo" },
            output: { temp: 3 },
          },
          { type: "tool", toolName: "fail", toolCallId: "c2", state: "output-error", input: {}, errorText: "down" },
          { type: "step-start" },
          { type: "text", id: "t2", text: "It is 3 degrees", state: "done" },
        ],
      },
    ];

    it("should send a RunAgentInput", () => {
      const prepared = aguiProtocol({ context: () => [{ description: "tz", value: "UTC" }] }).prepareRequest(
        context({
          messages,
          parentRunId: "run-1",
          state: { step: 1 },
          body: { model: "x" },
          tools: [{ name: "confirm", description: "Ask the user", parameters: { type: "object" } }],
          resume: [{ interruptId: "i1", status: "resolved", payload: true }],
        }),
      );
      expect(prepared.headers).toEqual({ Accept: "text/event-stream" });
      expect(prepared.payload).toEqual({
        threadId: "thread-1",
        runId: "run-2",
        parentRunId: "run-1",
        state: { step: 1 },
        messages: [
          { id: "s", role: "system", content: "Be nice" },
          { id: "u", role: "user", content: "Weather?" },
          {
            id: "a",
            role: "assistant",
            content: "Checking",
            toolCalls: [
              { id: "c1", type: "function", function: { name: "weather", arguments: '{"city":"Oslo"}' } },
              { id: "c2", type: "function", function: { name: "fail", arguments: "{}" } },
            ],
          },
          { id: "c1-result", role: "tool", toolCallId: "c1", content: '{"temp":3}' },
          // The model reads the content, so the error is in both places (like TanStack AI's own client sends it)
          { id: "c2-result", role: "tool", toolCallId: "c2", content: '{"error":"down"}', error: "down" },
          { id: "a-1", role: "assistant", content: "It is 3 degrees" },
        ],
        tools: [{ name: "confirm", description: "Ask the user", parameters: { type: "object" } }],
        context: [{ description: "tz", value: "UTC" }],
        forwardedProps: { model: "x" },
        resume: [{ interruptId: "i1", status: "resolved", payload: true }],
      });
    });

    it("should send TanStack's run id header and no body when resuming", () => {
      expect(tanstackAIProtocol().prepareRequest(context()).headers).toEqual({ "X-Run-Id": "run-2" });
      expect(tanstackAIProtocol().prepareRequest(context({ trigger: "resume-stream" }))).toEqual({
        payload: undefined,
        headers: { "X-Run-Id": "run-2" },
      });
      expect(aguiProtocol().prepareRequest(context({ trigger: "resume-stream" })).payload).toBeUndefined();
    });

    it("should let prepareBody replace the body", () => {
      const { payload } = tanstackAIProtocol({
        prepareBody: ({ defaultBody }) => ({ wrapped: defaultBody.threadId }),
      }).prepareRequest(context());
      expect(payload).toEqual({ wrapped: "thread-1" });
    });

    it("should send user files as content parts", () => {
      const [message] = toAGUIMessages([
        {
          id: "u",
          role: "user",
          parts: [
            { type: "text", id: "t", text: "Look", state: "done" },
            { type: "file", url: "data:image/png;base64,AAAA", mediaType: "image/png" },
            { type: "file", url: "https://x.com/a.pdf", mediaType: "application/pdf" },
            { type: "file", url: "https://x.com/a.mp3", mediaType: "audio/mpeg" },
            { type: "file", url: "https://x.com/a.mp4", mediaType: "video/mp4" },
          ],
        },
      ]);
      expect(message).toEqual({
        id: "u",
        role: "user",
        content: [
          { type: "text", text: "Look" },
          { type: "image", source: { type: "data", value: "AAAA", mimeType: "image/png" } },
          { type: "document", source: { type: "url", value: "https://x.com/a.pdf", mimeType: "application/pdf" } },
          { type: "audio", source: { type: "url", value: "https://x.com/a.mp3", mimeType: "audio/mpeg" } },
          { type: "video", source: { type: "url", value: "https://x.com/a.mp4", mimeType: "video/mp4" } },
        ],
      });
    });

    it("should report denied tools as errors", () => {
      const result = toAGUIMessages([
        {
          id: "a",
          role: "assistant",
          parts: [
            {
              type: "tool",
              toolName: "x",
              toolCallId: "c",
              state: "output-denied",
              input: {},
              approval: { id: "ap", approved: false },
            },
          ],
        },
      ]);
      expect(result.at(-1)).toEqual({
        id: "c-result",
        role: "tool",
        toolCallId: "c",
        content: '{"error":"Tool execution was denied"}',
        error: "Tool execution was denied",
      });
    });
  });

  describe("when converting AG-UI messages", () => {
    it("should merge assistant, tool, reasoning and activity messages into one assistant message", () => {
      const agui: AGUIMessageType[] = [
        { id: "d", role: "developer", content: "rules" },
        {
          id: "u",
          role: "user",
          content: [
            { type: "text", text: "hi" },
            { type: "image", source: { type: "data", value: "AA", mimeType: "image/png" } },
          ],
        },
        { id: "r", role: "reasoning", content: "hmm" },
        {
          id: "a1",
          role: "assistant",
          content: "Let me check",
          toolCalls: [{ id: "c1", type: "function", function: { name: "w", arguments: '{"x":1}' } }],
        },
        { id: "t1", role: "tool", toolCallId: "c1", content: '{"ok":true}' },
        { id: "t2", role: "tool", toolCallId: "unknown", content: "x" },
        {
          id: "a2",
          role: "assistant",
          toolCalls: [{ id: "c2", type: "function", function: { name: "v", arguments: "" } }],
        },
        { id: "t3", role: "tool", toolCallId: "c2", content: "", error: "failed" },
        { id: "act", role: "activity", activityType: "plan", content: { a: 1 } },
        { id: "u2", role: "user", content: "next" },
      ];
      expect(fromAGUIMessages(agui)).toEqual([
        { id: "d", role: "system", parts: [{ type: "text", id: "d-0", text: "rules", state: "done" }] },
        {
          id: "u",
          role: "user",
          parts: [
            { type: "text", id: "u-0", text: "hi", state: "done" },
            { type: "file", mediaType: "image/png", url: "data:image/png;base64,AA" },
          ],
        },
        {
          id: "r",
          role: "assistant",
          parts: [
            { type: "reasoning", id: "r", text: "hmm", state: "done" },
            { type: "step-start" },
            { type: "text", id: "a1", text: "Let me check", state: "done" },
            {
              type: "tool",
              toolName: "w",
              toolCallId: "c1",
              state: "output-available",
              input: { x: 1 },
              output: { ok: true },
            },
            { type: "step-start" },
            { type: "tool", toolName: "v", toolCallId: "c2", state: "output-error", input: {}, errorText: "failed" },
            { type: "data", name: "activity", id: "act", data: { activityType: "plan", content: { a: 1 } } },
          ],
        },
        { id: "u2", role: "user", parts: [{ type: "text", id: "u2-0", text: "next", state: "done" }] },
      ]);
    });
  });
});
