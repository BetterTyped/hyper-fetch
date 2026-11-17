import type {
  AGUIEventType,
  AGUIFramingType,
  AGUIMessageType,
  ChatMessageType,
  ChatStreamEventType,
} from "@hyper-fetch/ai";
import {
  aguiProtocol,
  ChatMessageBuilder,
  createAGUIDecoder,
  createAGUIEventMapper,
  fromAGUIMessages,
  parseToolContent,
  splitIntoChunks,
  tanstackAIProtocol,
  toAGUIMessages,
} from "@hyper-fetch/ai";

const map = (events: AGUIEventType[]) => {
  const mapper = createAGUIEventMapper();
  return [...events.flatMap((event) => mapper.map(event)), ...mapper.end()];
};

const decode = (wire: string | string[], framing?: AGUIFramingType) => {
  const events: ChatStreamEventType[] = [];
  const decoder = createAGUIDecoder((event) => events.push(event), framing);
  (typeof wire === "string" ? [wire] : wire).forEach((piece) => decoder.feed(piece));
  decoder.flush();
  return events;
};

const build = (events: AGUIEventType[], base?: ChatMessageType) => {
  const builder = new ChatMessageBuilder(base ?? { id: "local", role: "assistant", parts: [] });
  map(events).forEach((event) => builder.apply(event));
  return builder.message;
};

const types = (events: ChatStreamEventType[]) => events.map((event) => event.type);

describe("AG-UI protocol [ edge cases ]", () => {
  describe("when a response holds more than one run", () => {
    it("should start a new step for content after a finished run, like TanStack AI's agent loop sends it", () => {
      const message = build([
        { type: "RUN_STARTED", threadId: "t", runId: "r" },
        { type: "TEXT_MESSAGE_START", messageId: "m" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "Checking. " },
        { type: "TEXT_MESSAGE_END", messageId: "m" },
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "getWeather" },
        { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"city":"Oslo"}' },
        { type: "TOOL_CALL_END", toolCallId: "c1" },
        { type: "RUN_FINISHED", threadId: "t", runId: "r", metadata: { tanstack: { finishReason: "tool_calls" } } },
        { type: "TOOL_CALL_RESULT", messageId: "m", toolCallId: "c1", content: '{"temperature":12}' },
        { type: "TEXT_MESSAGE_START", messageId: "m" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "It is 12." },
        { type: "TEXT_MESSAGE_END", messageId: "m" },
        { type: "RUN_FINISHED", threadId: "t", runId: "r", metadata: { tanstack: { finishReason: "stop" } } },
      ]);

      expect(message.parts).toEqual([
        { type: "step-start" },
        { type: "text", id: "m", text: "Checking. ", state: "done" },
        {
          type: "tool",
          toolName: "getWeather",
          toolCallId: "c1",
          state: "output-available",
          input: { city: "Oslo" },
          output: { temperature: 12 },
        },
        { type: "step-start" },
        { type: "text", id: "m", text: "It is 12.", state: "done" },
      ]);
    });

    it("should not start a step for a tool result or a snapshot that follows a finished run", () => {
      const events = map([
        { type: "RUN_STARTED", threadId: "t", runId: "r" },
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "x" },
        { type: "TOOL_CALL_END", toolCallId: "c1" },
        { type: "RUN_FINISHED", threadId: "t", runId: "r" },
        { type: "TOOL_CALL_RESULT", messageId: "m", toolCallId: "c1", content: "ok" },
        { type: "STATE_SNAPSHOT", snapshot: {} },
        { type: "MESSAGES_SNAPSHOT", messages: [] },
        { type: "CUSTOM", name: "x", value: 1 },
      ]);
      expect(types(events).filter((type) => type === "step-start")).toHaveLength(1);
    });

    it("should start a step for every run of a response", () => {
      const events = map([
        { type: "RUN_STARTED", threadId: "t", runId: "r1" },
        { type: "RUN_FINISHED", threadId: "t", runId: "r1" },
        { type: "RUN_STARTED", threadId: "t", runId: "r2" },
        { type: "RUN_FINISHED", threadId: "t", runId: "r2" },
      ]);
      expect(types(events)).toEqual([
        "run-start",
        "message-start",
        "step-start",
        "finish",
        "run-start",
        "step-start",
        "finish",
      ]);
    });

    it("should read a result that arrives before the run starts (TanStack AI resume)", () => {
      const previous: ChatMessageType = {
        id: "a",
        role: "assistant",
        parts: [
          { type: "step-start" },
          {
            type: "tool",
            toolName: "deleteFile",
            toolCallId: "c1",
            state: "approval-responded",
            input: { path: "/x" },
            approval: { id: "approval_c1", approved: true },
          },
        ],
      };
      const message = build(
        [
          { type: "TOOL_CALL_RESULT", messageId: "a", toolCallId: "c1", content: '{"deleted":true}', role: "tool" },
          { type: "RUN_STARTED", threadId: "t", runId: "r2", parentRunId: "r1" },
          { type: "TEXT_MESSAGE_START", messageId: "m2" },
          { type: "TEXT_MESSAGE_CONTENT", messageId: "m2", delta: "Deleted." },
          { type: "TEXT_MESSAGE_END", messageId: "m2" },
          { type: "RUN_FINISHED", threadId: "t", runId: "r2" },
        ],
        previous,
      );
      expect(message.parts).toEqual([
        { type: "step-start" },
        {
          type: "tool",
          toolName: "deleteFile",
          toolCallId: "c1",
          state: "output-available",
          input: { path: "/x" },
          approval: { id: "approval_c1", approved: true },
          output: { deleted: true },
        },
        { type: "step-start" },
        { type: "text", id: "m2", text: "Deleted.", state: "done" },
      ]);
    });
  });

  describe("when tool results carry TanStack AI outcomes", () => {
    const call: AGUIEventType[] = [
      { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "x" },
      { type: "TOOL_CALL_END", toolCallId: "c1" },
    ];
    const result = (extra: Record<string, unknown>): AGUIEventType => ({
      type: "TOOL_CALL_RESULT",
      messageId: "m",
      toolCallId: "c1",
      ...extra,
    });

    it.each<[string, AGUIEventType, ChatStreamEventType]>([
      [
        "a failed tool",
        result({ content: '{"error":"kaboom"}', metadata: { tanstack: { state: "output-error" } } }),
        { type: "tool-output-error", toolCallId: "c1", errorText: "kaboom" },
      ],
      [
        "a failed tool with a plain text error",
        result({ content: "It broke", metadata: { tanstack: { state: "output-error" } } }),
        { type: "tool-output-error", toolCallId: "c1", errorText: "It broke" },
      ],
      [
        "a failed tool without a readable error",
        result({ content: '{"code":500}', metadata: { tanstack: { state: "output-error" } } }),
        { type: "tool-output-error", toolCallId: "c1", errorText: "Tool execution failed" },
      ],
      [
        "a failed tool with an empty result",
        result({ content: "", metadata: { tanstack: { state: "output-error" } } }),
        { type: "tool-output-error", toolCallId: "c1", errorText: "Tool execution failed" },
      ],
      [
        "an error state on the event itself",
        result({ content: '{"error":"old format"}', state: "output-error" }),
        { type: "tool-output-error", toolCallId: "c1", errorText: "old format" },
      ],
      [
        "a cancelled tool",
        result({ content: '{"error":"Cancelled"}', metadata: { tanstack: { toolResultOutcome: "cancelled" } } }),
        { type: "tool-output-error", toolCallId: "c1", errorText: "Cancelled" },
      ],
      [
        "a denied tool",
        result({
          content: '{"error":"User declined tool execution"}',
          metadata: { tanstack: { state: "output-error", toolResultOutcome: "denied" } },
        }),
        { type: "tool-output-denied", toolCallId: "c1" },
      ],
      [
        "a successful tool that returns an error-shaped object",
        result({ content: '{"error":"this is data"}' }),
        { type: "tool-output-available", toolCallId: "c1", output: { error: "this is data" } },
      ],
      [
        "metadata that is not an object",
        result({ content: "1", metadata: "nope" }),
        { type: "tool-output-available", toolCallId: "c1", output: 1 },
      ],
      [
        "content parts",
        result({ content: [{ type: "text", text: "hi" }] }),
        { type: "tool-output-available", toolCallId: "c1", output: [{ type: "text", text: "hi" }] },
      ],
    ])("should map %s", (_name, event, expected) => {
      expect(map([...call, event]).at(-1)).toEqual(expected);
    });

    it("should show a denied approval as denied, not as a successful result", () => {
      const previous: ChatMessageType = {
        id: "a",
        role: "assistant",
        parts: [
          {
            type: "tool",
            toolName: "deleteFile",
            toolCallId: "c1",
            state: "approval-responded",
            input: { path: "/x" },
            approval: { id: "approval_c1", approved: false, responseReason: "nope" },
            interruptId: "approval_c1",
          },
        ],
      };
      const message = build(
        [
          result({
            content: '{"error":"User declined tool execution"}',
            metadata: { tanstack: { state: "output-error", toolResultOutcome: "denied" } },
          }),
        ],
        previous,
      );
      expect(message.parts).toEqual([
        {
          type: "tool",
          toolName: "deleteFile",
          toolCallId: "c1",
          state: "output-denied",
          input: { path: "/x" },
          approval: { id: "approval_c1", approved: false, responseReason: "nope" },
          interruptId: "approval_c1",
        },
      ]);
    });
  });

  describe("when tool call arguments end", () => {
    const end = (events: AGUIEventType[]) =>
      map([{ type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "search" }, ...events]).filter(
        (event) => event.type === "tool-input-available" || event.type === "tool-input-error",
      );
    const available = (input: unknown): ChatStreamEventType[] => [
      { type: "tool-input-available", toolCallId: "c1", toolName: "search", input },
    ];

    it("should use the arguments TanStack AI sends on the end event when nothing was streamed", () => {
      // Adapters that deliver the whole input at once (provider-executed tools) send no TOOL_CALL_ARGS
      expect(
        end([{ type: "TOOL_CALL_END", toolCallId: "c1", metadata: { tanstack: { args: '{"query":"sse"}' } } }]),
      ).toEqual(available({ query: "sse" }));
      expect(
        end([{ type: "TOOL_CALL_END", toolCallId: "c1", metadata: { tanstack: { input: { query: "sse" } } } }]),
      ).toEqual(available({ query: "sse" }));
      expect(end([{ type: "TOOL_CALL_END", toolCallId: "c1", args: '{"query":"top"}' }])).toEqual(
        available({ query: "top" }),
      );
      expect(end([{ type: "TOOL_CALL_END", toolCallId: "c1", input: { query: "top" } }])).toEqual(
        available({ query: "top" }),
      );
    });

    it("should let the final arguments win over the streamed ones", () => {
      expect(
        end([
          { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"query":null}' },
          { type: "TOOL_CALL_END", toolCallId: "c1", metadata: { tanstack: { args: '{"query":"final"}' } } },
        ]),
      ).toEqual(available({ query: "final" }));
      expect(
        end([
          { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: "{broken" },
          { type: "TOOL_CALL_END", toolCallId: "c1", metadata: { tanstack: { input: { query: "parsed" } } } },
        ]),
      ).toEqual(available({ query: "parsed" }));
    });

    it("should fall back to the streamed arguments when the end event has none", () => {
      expect(
        end([
          { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"query":"streamed"}' },
          { type: "TOOL_CALL_END", toolCallId: "c1", metadata: { tanstack: { model: "m", args: 5, input: "x" } } },
        ]),
      ).toEqual(available({ query: "streamed" }));
    });

    it.each(["", "   ", "\n"])("should read the empty arguments %j as an empty object", (delta) => {
      expect(
        end([
          { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta },
          { type: "TOOL_CALL_END", toolCallId: "c1" },
        ]),
      ).toEqual(available({}));
    });

    it.each(["[1,2]", '"text"', "42", "null", "true"])("should accept the JSON arguments %s", (delta) => {
      expect(
        end([
          { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta },
          { type: "TOOL_CALL_END", toolCallId: "c1" },
        ]),
      ).toEqual(available(JSON.parse(delta)));
    });

    it.each(['{"query":', "{'a':1}", "undefined", '{"a":1}}'])("should report the invalid arguments %s", (delta) => {
      expect(
        end([
          { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta },
          { type: "TOOL_CALL_END", toolCallId: "c1" },
        ]),
      ).toEqual([
        {
          type: "tool-input-error",
          toolCallId: "c1",
          toolName: "search",
          input: delta,
          errorText: "Invalid tool call arguments: not valid JSON",
        },
      ]);
    });

    it("should end a tool call only once", () => {
      expect(
        end([
          { type: "TOOL_CALL_END", toolCallId: "c1" },
          { type: "TOOL_CALL_END", toolCallId: "c1" },
          { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: "late" },
          { type: "TOOL_CALL_RESULT", messageId: "m", toolCallId: "c1", content: "1" },
          { type: "RUN_FINISHED", threadId: "t", runId: "r" },
        ]),
      ).toEqual(available({}));
    });

    it("should end tool calls the backend forgot to end when the run finishes", () => {
      // TanStack AI's own reader completes every open tool call on RUN_FINISHED
      const events = map([
        { type: "RUN_STARTED", threadId: "t", runId: "r" },
        { type: "TOOL_CALL_START", toolCallId: "a", toolCallName: "one" },
        { type: "TOOL_CALL_ARGS", toolCallId: "a", delta: '{"x":1}' },
        { type: "TOOL_CALL_START", toolCallId: "b", toolCallName: "two" },
        { type: "RUN_FINISHED", threadId: "t", runId: "r" },
      ]);
      expect(events.slice(-3)).toEqual([
        { type: "tool-input-available", toolCallId: "a", toolName: "one", input: { x: 1 } },
        { type: "tool-input-available", toolCallId: "b", toolName: "two", input: {} },
        { type: "finish", finishReason: "stop" },
      ]);
    });

    it("should leave a tool call open when the stream just ends", () => {
      const events = map([
        { type: "TOOL_CALL_START", toolCallId: "a", toolCallName: "one" },
        { type: "TOOL_CALL_ARGS", toolCallId: "a", delta: '{"x":' },
      ]);
      expect(types(events)).toEqual(["message-start", "step-start", "tool-input-start", "tool-input-delta"]);
    });

    it("should ignore arguments, ends and duplicate starts it cannot place", () => {
      const events = map([
        { type: "TOOL_CALL_ARGS", toolCallId: "ghost", delta: "{}" },
        { type: "TOOL_CALL_END", toolCallId: "ghost" },
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "x" },
        { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "y" },
        { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: "" },
      ]);
      expect(events).toEqual([
        { type: "message-start" },
        { type: "step-start" },
        { type: "tool-input-start", toolCallId: "c1", toolName: "x" },
      ]);
    });

    it("should read the tool name from the legacy toolName field", () => {
      expect(map([{ type: "TOOL_CALL_START", toolCallId: "c1", toolName: "legacy" }]).at(-1)).toEqual({
        type: "tool-input-start",
        toolCallId: "c1",
        toolName: "legacy",
      });
    });

    it("should report a result for an unknown tool call without inventing the call", () => {
      expect(map([{ type: "TOOL_CALL_RESULT", messageId: "m", toolCallId: "ghost", content: "1" }])).toEqual([
        { type: "tool-output-available", toolCallId: "ghost", output: 1 },
      ]);
    });
  });

  describe("when text and reasoning events are incomplete", () => {
    it("should open text for content without a start and close it at the end of the stream", () => {
      expect(map([{ type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "Hi" }])).toEqual([
        { type: "message-start" },
        { type: "step-start" },
        { type: "text-start", id: "m" },
        { type: "text-delta", id: "m", delta: "Hi" },
        { type: "text-end", id: "m" },
      ]);
    });

    it("should ignore an end for a message that is not open", () => {
      expect(map([{ type: "TEXT_MESSAGE_END", messageId: "ghost" }])).toEqual([]);
      expect(map([{ type: "REASONING_MESSAGE_END", messageId: "ghost" }])).toEqual([]);
      expect(
        types(
          map([
            { type: "TEXT_MESSAGE_START", messageId: "a" },
            { type: "TEXT_MESSAGE_END", messageId: "b" },
            { type: "TEXT_MESSAGE_CONTENT", messageId: "a", delta: "still open" },
          ]),
        ),
      ).toEqual(["message-start", "step-start", "text-start", "text-delta", "text-end"]);
    });

    it("should close the open message when another one starts", () => {
      const events = map([
        { type: "TEXT_MESSAGE_START", messageId: "a" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "a", delta: "A" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "b", delta: "B" },
        { type: "REASONING_MESSAGE_CONTENT", messageId: "r", delta: "R" },
        { type: "TOOL_CALL_START", toolCallId: "c", toolCallName: "x" },
        { type: "TEXT_MESSAGE_START", messageId: "a" },
      ]);
      expect(events.slice(2)).toEqual([
        { type: "text-start", id: "a" },
        { type: "text-delta", id: "a", delta: "A" },
        { type: "text-end", id: "a" },
        { type: "text-start", id: "b" },
        { type: "text-delta", id: "b", delta: "B" },
        { type: "text-end", id: "b" },
        { type: "reasoning-start", id: "r" },
        { type: "reasoning-delta", id: "r", delta: "R" },
        { type: "reasoning-end", id: "r" },
        { type: "tool-input-start", toolCallId: "c", toolName: "x" },
        { type: "text-start", id: "a" },
        { type: "text-end", id: "a" },
      ]);
    });

    it("should keep text of the same message id around a tool call apart", () => {
      const message = build([
        { type: "TEXT_MESSAGE_START", messageId: "m" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "Before." },
        { type: "TOOL_CALL_START", toolCallId: "c", toolCallName: "x", parentMessageId: "m" },
        { type: "TOOL_CALL_END", toolCallId: "c" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "After." },
        { type: "TEXT_MESSAGE_END", messageId: "m" },
      ]);
      expect(message.parts).toEqual([
        { type: "step-start" },
        { type: "text", id: "m", text: "Before.", state: "done" },
        { type: "tool", toolName: "x", toolCallId: "c", state: "input-available", input: {} },
        { type: "text", id: "m", text: "After.", state: "done" },
      ]);
    });

    it("should handle wrong-typed fields without throwing", () => {
      expect(
        map([
          { type: "TEXT_MESSAGE_CONTENT", messageId: 5, delta: 7 },
          { type: "TOOL_CALL_START", toolCallId: null, toolCallName: {} },
          { type: "STATE_DELTA" },
          { type: "MESSAGES_SNAPSHOT" },
          { type: "RUN_ERROR", message: 500 },
          { type: "RUN_FINISHED", usage: "lots", outcome: "done", metadata: [] },
        ]),
      ).toEqual([
        { type: "message-start" },
        { type: "step-start" },
        { type: "text-start", id: "" },
        { type: "text-delta", id: "", delta: "" },
        { type: "text-end", id: "" },
        { type: "tool-input-start", toolCallId: "", toolName: "" },
        { type: "state-delta", patch: [] },
        { type: "messages-snapshot", messages: [] },
        { type: "error", errorText: "Run failed" },
        { type: "tool-input-available", toolCallId: "", toolName: "", input: {} },
        { type: "finish", finishReason: "stop" },
      ]);
    });

    it.each([null, 42, "text", true, [1]])("should pass the JSON value %j through as a raw event", (value) => {
      expect(decode(`${JSON.stringify(value)}\n`, "ndjson")).toEqual([{ type: "raw", protocol: "ag-ui", value }]);
      expect(decode(`data: ${JSON.stringify(value)}\n\n`, "sse")).toEqual([{ type: "raw", protocol: "ag-ui", value }]);
    });

    it.each([
      [{ type: "STEP_STARTED", stepName: "plan" }],
      [{ type: "STEP_FINISHED", stepName: "plan" }],
      [{ type: "RAW", event: { any: "thing" }, source: "openai" }],
      [{ type: "REASONING_ENCRYPTED_VALUE", subtype: "message", entityId: "r", encryptedValue: "abc" }],
      [{ type: "SUBAGENT_STARTED", subagentRunId: "s" }],
      [{ type: "BRAND_NEW" }],
      [{ noType: true }],
    ])("should pass %j through as a raw event", (event) => {
      expect(map([event as AGUIEventType])).toEqual([{ type: "raw", protocol: "ag-ui", value: event }]);
    });

    it.each(["REASONING_START", "REASONING_END", "THINKING_START", "THINKING_END"])(
      "should not emit anything for the grouping event %s",
      (type) => {
        expect(map([{ type, messageId: "r" }])).toEqual([]);
      },
    );
  });

  describe("when the backend sends convenience and legacy events", () => {
    it("should continue the open message for chunks without an id", () => {
      const message = build([
        { type: "TEXT_MESSAGE_CHUNK", messageId: "m", role: "assistant", delta: "Hel" },
        { type: "TEXT_MESSAGE_CHUNK", delta: "lo" },
        { type: "TEXT_MESSAGE_CHUNK" },
        { type: "REASONING_MESSAGE_CHUNK", messageId: "r", delta: "Hm" },
        { type: "REASONING_MESSAGE_CHUNK", delta: "m" },
        { type: "TOOL_CALL_CHUNK", toolCallId: "c", toolCallName: "search", delta: '{"q"' },
        { type: "TOOL_CALL_CHUNK", delta: ':"x"}' },
        { type: "TOOL_CALL_CHUNK", toolCallId: "d", toolCallName: "other" },
        { type: "TEXT_MESSAGE_CHUNK", messageId: "m2", delta: "Bye" },
      ]);
      expect(message.parts).toEqual([
        { type: "step-start" },
        { type: "text", id: "m", text: "Hello", state: "done" },
        { type: "reasoning", id: "r", text: "Hmm", state: "done" },
        { type: "tool", toolName: "search", toolCallId: "c", state: "input-available", input: { q: "x" } },
        { type: "tool", toolName: "other", toolCallId: "d", state: "input-available", input: {} },
        { type: "text", id: "m2", text: "Bye", state: "done" },
      ]);
    });

    it("should drop a tool call chunk that continues nothing", () => {
      expect(map([{ type: "TOOL_CALL_CHUNK", delta: "{}" }])).toEqual([]);
    });

    it("should name text and reasoning chunks that carry no id at all", () => {
      expect(map([{ type: "TEXT_MESSAGE_CHUNK", delta: "x" }]).at(2)).toEqual({ type: "text-start", id: "text" });
      expect(map([{ type: "REASONING_MESSAGE_CHUNK", delta: "x" }]).at(2)).toEqual({
        type: "reasoning-start",
        id: "reasoning",
      });
      expect(map([{ type: "THINKING_TEXT_MESSAGE_START" }]).at(2)).toEqual({
        type: "reasoning-start",
        id: "reasoning",
      });
    });

    it("should close a chunk-opened tool call when its result arrives", () => {
      const events = map([
        { type: "TOOL_CALL_CHUNK", toolCallId: "c", toolCallName: "search", delta: '{"q":"x"}' },
        { type: "TOOL_CALL_RESULT", messageId: "m", toolCallId: "c", content: "found" },
      ]);
      expect(events.slice(-2)).toEqual([
        { type: "tool-input-available", toolCallId: "c", toolName: "search", input: { q: "x" } },
        { type: "tool-output-available", toolCallId: "c", output: "found" },
      ]);
    });

    it("should read legacy THINKING events as reasoning", () => {
      const message = build([
        { type: "THINKING_START", title: "Planning" },
        { type: "THINKING_TEXT_MESSAGE_START" },
        { type: "THINKING_TEXT_MESSAGE_CONTENT", delta: "Step 1. " },
        { type: "THINKING_TEXT_MESSAGE_CONTENT", delta: "Step 2." },
        { type: "THINKING_TEXT_MESSAGE_END" },
        { type: "THINKING_END" },
        { type: "TEXT_MESSAGE_START", messageId: "m" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "Done." },
        { type: "TEXT_MESSAGE_END", messageId: "m" },
      ]);
      expect(message.parts).toEqual([
        { type: "step-start" },
        { type: "reasoning", id: "reasoning", text: "Step 1. Step 2.", state: "done" },
        { type: "text", id: "m", text: "Done.", state: "done" },
      ]);
    });
  });

  describe("when a run finishes", () => {
    const finish = (event: Record<string, unknown>) =>
      map([{ type: "RUN_FINISHED", threadId: "t", runId: "r", ...event }]).filter((item) => item.type !== "usage");

    it.each<[string, Record<string, unknown>, string]>([
      ["no outcome", {}, "stop"],
      ["a success outcome", { outcome: { type: "success" } }, "stop"],
      ["a cancelled outcome", { outcome: { type: "cancelled" } }, "interrupted"],
      [
        "an interrupt outcome",
        { outcome: { type: "interrupt", interrupts: [{ id: "i", reason: "x" }] } },
        "tool-calls",
      ],
      ["a TanStack stop", { metadata: { tanstack: { finishReason: "stop" } } }, "stop"],
      ["a TanStack length stop", { metadata: { tanstack: { finishReason: "length" } } }, "length"],
      ["a TanStack content filter", { metadata: { tanstack: { finishReason: "content_filter" } } }, "content-filter"],
      ["TanStack tool calls", { metadata: { tanstack: { finishReason: "tool_calls" } } }, "tool-calls"],
      ["an unknown TanStack reason", { metadata: { tanstack: { finishReason: "weird" } } }, "other"],
      ["a finish reason on the event itself", { finishReason: "length" }, "length"],
      [
        "a TanStack reason next to an interrupt",
        { outcome: { type: "interrupt", interrupts: [] }, metadata: { tanstack: { finishReason: "stop" } } },
        "stop",
      ],
    ])("should map %s", (_name, event, finishReason) => {
      expect(finish(event).at(-1)).toEqual({ type: "finish", finishReason });
    });

    it("should add up the usage of every model call of the run", () => {
      const events = map([
        {
          type: "RUN_FINISHED",
          threadId: "t",
          runId: "r",
          usage: [
            { inputTokens: 1, outputTokens: 2, totalTokens: 3, reasoningTokens: 1, cachedInputTokens: 4 },
            { inputTokens: 10, outputTokens: 20, provider: "x", cacheWriteInputTokens: 9 },
            null,
            "junk",
          ],
        },
      ]);
      expect(events[0]).toEqual({
        type: "usage",
        usage: { inputTokens: 11, outputTokens: 22, totalTokens: 3, reasoningTokens: 1, cachedInputTokens: 4 },
      });
      expect(types(map([{ type: "RUN_FINISHED", usage: [] }]))).toEqual(["finish"]);
      expect(map([{ type: "RUN_ERROR", message: "x", usage: [{ inputTokens: 5 }] }])).toEqual([
        { type: "usage", usage: { inputTokens: 5 } },
        { type: "error", errorText: "x" },
      ]);
    });

    it("should sort interrupts into approvals, client tools and generic ones", () => {
      const events = map([
        {
          type: "RUN_FINISHED",
          threadId: "t",
          runId: "r",
          outcome: {
            type: "interrupt",
            interrupts: [
              { id: "i1", reason: "tool_call", toolCallId: "c1", metadata: { kind: "approval" } },
              { id: "i2", reason: "tool_call", toolCallId: "c2", message: "Why", metadata: { kind: "approval" } },
              { id: "i3", reason: "tanstack:client_tool_execution", toolCallId: "c3" },
              { id: "i4", reason: "x", toolCallId: "c4", metadata: { kind: "client_tool" } },
              { id: "i5", reason: "approval without a tool call", metadata: { kind: "approval" } },
              { id: "i6", reason: "human_input", message: "Name?", responseSchema: { type: "string" } },
              null,
              "junk",
            ],
          },
        },
      ]);
      expect(events).toEqual([
        { type: "tool-approval-request", toolCallId: "c1", approvalId: "i1", interruptId: "i1" },
        { type: "tool-approval-request", toolCallId: "c2", approvalId: "i2", interruptId: "i2", reason: "Why" },
        { type: "tool-client-execution", toolCallId: "c3", interruptId: "i3" },
        { type: "tool-client-execution", toolCallId: "c4", interruptId: "i4" },
        {
          type: "interrupt",
          interrupts: [
            { id: "i5", reason: "approval without a tool call", metadata: { kind: "approval" } },
            { id: "i6", reason: "human_input", message: "Name?", responseSchema: { type: "string" } },
          ],
        },
        { type: "finish", finishReason: "tool-calls" },
      ]);
    });

    it("should close what is open before reporting an error", () => {
      const events = map([
        { type: "TEXT_MESSAGE_START", messageId: "m" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: "Half" },
        { type: "RUN_ERROR", message: "Provider down", code: "503" },
      ]);
      expect(events.slice(-2)).toEqual([
        { type: "text-end", id: "m" },
        { type: "error", errorText: "Provider down" },
      ]);
    });
  });

  describe("when detecting the framing", () => {
    const event = { type: "CUSTOM", name: "ping", value: 1 };
    const expected: ChatStreamEventType[] = [{ type: "data", name: "ping", data: 1, transient: true }];
    const json = JSON.stringify(event);

    it.each([
      ["NDJSON", `${json}\n`],
      ["NDJSON without a final newline", json],
      ["NDJSON after blank lines", `\n\n  \n${json}\n`],
      ["NDJSON after a byte order mark", `\uFEFF${json}\n`],
      ["NDJSON with CRLF", `${json}\r\n`],
      ["NDJSON with indentation", `   ${json}   \n`],
      ["a durable NDJSON envelope", `${JSON.stringify({ id: "0", chunk: event })}\n`],
      ["SSE", `data: ${json}\n\n`],
      ["SSE without a space", `data:${json}\n\n`],
      ["SSE after a byte order mark", `\uFEFFdata: ${json}\n\n`],
      ["SSE after a comment", `: keep-alive\n\ndata: ${json}\n\n`],
      ["SSE after blank lines", `\n\ndata: ${json}\n\n`],
      ["SSE starting with an event field", `event: message\ndata: ${json}\n\n`],
      ["SSE starting with an id", `id: 5\ndata: ${json}\n\n`],
      ["SSE with CRLF", `data: ${json}\r\n\r\n`],
      ["SSE ending with [DONE]", `data: ${json}\n\ndata: [DONE]\n\n`],
      ["SSE without the final blank line", `data: ${json}`],
    ])("should detect %s", (_name, wire) => {
      expect(decode(wire)).toEqual(expected);
      expect(decode(splitIntoChunks([wire], 1))).toEqual(expected);
    });

    it("should wait for the first visible character before deciding", () => {
      expect(decode(["", " ", "\n", "\uFEFF", "\t", json, "\n"])).toEqual(expected);
      expect(decode([" ", "\n", "da", "ta: ", json, "\n\n"])).toEqual(expected);
    });

    it("should decode nothing from an empty or blank body", () => {
      expect(decode("")).toEqual([]);
      expect(decode("  \n\n ")).toEqual([]);
      expect(decode(": only a comment\n\n")).toEqual([]);
    });

    it("should use the configured framing without looking at the body", () => {
      expect(decode(`data: ${json}\n\n`, "sse")).toEqual(expected);
      expect(decode(`${json}\n`, "ndjson")).toEqual(expected);
      // An NDJSON body is not SSE: no field of it is a data line
      expect(decode(`${json}\n`, "sse")).toEqual([]);
      expect(() => decode(`data: ${json}\n\n`, "ndjson")).toThrow(/Invalid NDJSON line/);
    });

    it("should not unwrap an event that happens to have a chunk field", () => {
      const tricky = { type: "CUSTOM", name: "x", value: 1, chunk: { type: "RUN_ERROR", message: "no" } };
      expect(decode(`${JSON.stringify(tricky)}\n`)).toEqual([{ type: "data", name: "x", data: 1, transient: true }]);
    });

    it("should detect the framing again after a reset", () => {
      const events: ChatStreamEventType[] = [];
      const decoder = createAGUIDecoder((item) => events.push(item));
      decoder.feed(`data: ${json}\n\n`);
      decoder.reset();
      decoder.feed(`${json}\n`);
      decoder.flush();
      expect(events).toEqual([...expected, ...expected]);
    });

    it("should name the broken event when the JSON is invalid", () => {
      expect(() => decode('data: {"type":\n\n')).toThrow(/Invalid AG-UI event: \{"type":/);
      expect(() => decode('{"type":\n')).toThrow(/Invalid NDJSON line/);
    });
  });

  describe("when preparing requests", () => {
    const context = {
      chatId: "thread-1",
      runId: "run-1",
      messages: [] as ChatMessageType[],
      trigger: "submit-message" as const,
      body: {},
      state: undefined,
      tools: [],
      resume: [],
    };

    it("should send an empty state object and no optional fields by default", () => {
      expect(aguiProtocol().prepareRequest(context)).toEqual({
        payload: {
          threadId: "thread-1",
          runId: "run-1",
          state: {},
          messages: [],
          tools: [],
          context: [],
          forwardedProps: {},
        },
        headers: { Accept: "text/event-stream" },
      });
      expect(tanstackAIProtocol().prepareRequest(context).headers).toEqual({ "X-Run-Id": "run-1" });
    });

    it.each([0, "", false, [], { nested: [1] }])("should send the state %j as it is", (state) => {
      expect(aguiProtocol().prepareRequest({ ...context, state }).payload).toMatchObject({ state });
    });

    it("should read the context from a list or a function on every request", () => {
      let zone = "UTC";
      const protocol = aguiProtocol({ context: () => [{ description: "tz", value: zone }] });
      expect(protocol.prepareRequest(context).payload).toMatchObject({
        context: [{ description: "tz", value: "UTC" }],
      });
      zone = "CET";
      expect(protocol.prepareRequest(context).payload).toMatchObject({
        context: [{ description: "tz", value: "CET" }],
      });
      expect(
        aguiProtocol({ context: [{ description: "a", value: "b" }] }).prepareRequest(context).payload,
      ).toMatchObject({ context: [{ description: "a", value: "b" }] });
    });

    it("should not call prepareBody when resuming a stream", () => {
      const prepareBody = vi.fn();
      const prepared = aguiProtocol({ prepareBody }).prepareRequest({ ...context, trigger: "resume-stream" });
      expect(prepared).toEqual({ payload: undefined, headers: { Accept: "text/event-stream" } });
      expect(prepareBody).not.toHaveBeenCalled();
      expect(aguiProtocol().name).toBe("ag-ui");
      expect(tanstackAIProtocol().name).toBe("tanstack-ai");
    });
  });

  describe("when converting messages", () => {
    const tool = (state: string, extra: Record<string, unknown> = {}) =>
      ({
        type: "tool",
        toolName: "x",
        toolCallId: `c-${state}`,
        state,
        input: { a: 1 },
        ...extra,
      }) as ChatMessageType["parts"][number];

    it("should send text that follows a tool call as its own assistant message", () => {
      const rows = toAGUIMessages([
        {
          id: "a",
          role: "assistant",
          parts: [
            { type: "text", id: "t1", text: "Before. ", state: "done" },
            { type: "text", id: "t2", text: "Still before.", state: "done" },
            tool("output-available", { output: { ok: true } }),
            { type: "text", id: "t3", text: "After.", state: "done" },
            tool("output-error", { errorText: "down" }),
            { type: "text", id: "t4", text: "The end.", state: "done" },
          ],
        },
      ]);
      expect(rows).toEqual([
        {
          id: "a",
          role: "assistant",
          content: "Before. Still before.",
          toolCalls: [{ id: "c-output-available", type: "function", function: { name: "x", arguments: '{"a":1}' } }],
        },
        { id: "c-output-available-result", role: "tool", toolCallId: "c-output-available", content: '{"ok":true}' },
        {
          id: "a-1",
          role: "assistant",
          content: "After.",
          toolCalls: [{ id: "c-output-error", type: "function", function: { name: "x", arguments: '{"a":1}' } }],
        },
        {
          id: "c-output-error-result",
          role: "tool",
          toolCallId: "c-output-error",
          content: '{"error":"down"}',
          error: "down",
        },
        { id: "a-2", role: "assistant", content: "The end." },
      ]);
    });

    it("should send a tool result only for finished tool calls", () => {
      const rows = toAGUIMessages([
        {
          id: "a",
          role: "assistant",
          parts: [
            tool("input-streaming", { input: undefined }),
            tool("input-available"),
            tool("approval-requested", { approval: { id: "ap" } }),
            tool("approval-responded", { approval: { id: "ap", approved: true } }),
            tool("output-available", { output: "text result" }),
            tool("output-available", { toolCallId: "c-null", output: null }),
            tool("output-available", { toolCallId: "c-undefined", output: undefined }),
            tool("output-denied", { approval: { id: "ap", approved: false } }),
          ],
        },
      ]);
      expect(rows[0]).toMatchObject({ role: "assistant" });
      expect((rows[0] as { toolCalls: { function: { arguments: string } }[] }).toolCalls[0].function.arguments).toBe(
        "{}",
      );
      expect(rows.slice(1)).toEqual([
        { id: "c-output-available-result", role: "tool", toolCallId: "c-output-available", content: "text result" },
        { id: "c-null-result", role: "tool", toolCallId: "c-null", content: "null" },
        { id: "c-undefined-result", role: "tool", toolCallId: "c-undefined", content: "null" },
        {
          id: "c-output-denied-result",
          role: "tool",
          toolCallId: "c-output-denied",
          content: '{"error":"Tool execution was denied"}',
          error: "Tool execution was denied",
        },
      ]);
    });

    it("should leave out steps without text and tool calls", () => {
      expect(
        toAGUIMessages([
          {
            id: "a",
            role: "assistant",
            parts: [
              { type: "step-start" },
              { type: "reasoning", id: "r", text: "hm", state: "done" },
              { type: "step-start" },
              { type: "step-start" },
              { type: "data", name: "x", data: 1 },
              { type: "source", sourceType: "url", sourceId: "s", url: "https://a.com" },
              { type: "step-start" },
              { type: "text", id: "t", text: "Only this", state: "done" },
            ],
          } as ChatMessageType,
        ]),
      ).toEqual([{ id: "a-2", role: "assistant", content: "Only this" }]);
      expect(toAGUIMessages([{ id: "a", role: "assistant", parts: [] }])).toEqual([]);
      expect(toAGUIMessages([])).toEqual([]);
    });

    it("should send user files by media type and data URLs as inline data", () => {
      const [row] = toAGUIMessages([
        {
          id: "u",
          role: "user",
          parts: [
            { type: "file", mediaType: "image/svg+xml", url: "data:image/svg+xml;utf8,<svg/>" },
            { type: "file", mediaType: "application/zip", url: "https://x.com/a.zip", filename: "a.zip" },
            { type: "data", name: "ignored", data: 1 },
          ],
        } as ChatMessageType,
      ]);
      expect(row).toEqual({
        id: "u",
        role: "user",
        content: [
          { type: "image", source: { type: "data", value: "<svg/>", mimeType: "image/svg+xml" } },
          { type: "document", source: { type: "url", value: "https://x.com/a.zip", mimeType: "application/zip" } },
        ],
      });
    });

    it("should read messages snapshots with roles and shapes it does not know", () => {
      const snapshot = [
        { id: "x", role: "moderator", content: "?" },
        { id: "u", role: "user", content: [{ type: "video", source: { type: "url", value: "https://v.mp4" } }] },
        { id: "t0", role: "tool", toolCallId: "orphan", content: "no assistant yet" },
        { id: "a", role: "assistant" },
        { id: "a2", role: "assistant", content: "", toolCalls: [] },
        {
          id: "a3",
          role: "assistant",
          toolCalls: [{ id: "c", type: "function", function: { name: "x", arguments: "{oops" } }],
        },
        { id: "t1", role: "tool", toolCallId: "c", content: [{ type: "text", text: "parts" }] },
      ] as unknown as AGUIMessageType[];

      expect(fromAGUIMessages(snapshot)).toEqual([
        {
          id: "u",
          role: "user",
          parts: [{ type: "file", mediaType: "application/octet-stream", url: "https://v.mp4" }],
        },
        {
          id: "t0",
          role: "assistant",
          parts: [
            {
              type: "tool",
              toolName: "x",
              toolCallId: "c",
              state: "output-available",
              input: "{oops",
              output: [{ type: "text", text: "parts" }],
            },
          ],
        },
      ]);
    });

    it("should parse tool content only when it is JSON", () => {
      expect(parseToolContent('{"a":1}')).toEqual({ a: 1 });
      expect(parseToolContent("12")).toBe(12);
      expect(parseToolContent("plain text")).toBe("plain text");
      expect(parseToolContent("")).toBe("");
      const { missing } = {} as { missing?: unknown };
      expect(parseToolContent(missing)).toBeUndefined();
      expect(parseToolContent([{ type: "text", text: "x" }])).toEqual([{ type: "text", text: "x" }]);
    });
  });
});
