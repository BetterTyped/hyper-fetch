/**
 * Chunk-boundary robustness: a network delivers the response body in pieces of any size. Every realistic stream is
 * cut at every single character offset, and fed one character at a time - the decoded events must never change.
 */
import type { AGUIStreamEventType, ChatProtocolType, ChatStreamEventType } from "@hyper-fetch/ai";
import {
  aguiProtocol,
  aguiTextAnswer,
  aiSDKProtocol,
  aiSDKTextAnswer,
  aiSDKTextProtocol,
  ChatMessageBuilder,
  encodeAGUIStream,
  encodeAISDKStream,
  splitIntoChunks,
  tanstackAIProtocol,
} from "@hyper-fetch/ai";

import { aiSDKScenarioNames, aiSDKScenarios } from "../differential/ai-sdk.scenarios";

const decode = (protocol: ChatProtocolType, pieces: string[]) => {
  const events: ChatStreamEventType[] = [];
  const builder = new ChatMessageBuilder({ id: "local", role: "assistant", parts: [] });
  const decoder = protocol.createDecoder((event) => {
    events.push(event);
    builder.apply(event);
  });
  pieces.forEach((piece) => decoder.feed(piece));
  decoder.flush();
  return { events, message: builder.message, decoder };
};

const aguiEvents: Record<string, AGUIStreamEventType[]> = {
  "text answer": aguiTextAnswer("Hello there, how are you today?"),
  "reasoning, tool call and unicode text": [
    { type: "RUN_STARTED", threadId: "t", runId: "r" },
    { type: "REASONING_START", messageId: "r1" },
    { type: "REASONING_MESSAGE_START", messageId: "r1", role: "reasoning" },
    { type: "REASONING_MESSAGE_CONTENT", messageId: "r1", delta: "Zażółć " },
    { type: "REASONING_MESSAGE_CONTENT", messageId: "r1", delta: "gęślą 👩‍👩‍👧‍👦" },
    { type: "REASONING_MESSAGE_END", messageId: "r1" },
    { type: "REASONING_END", messageId: "r1" },
    { type: "TEXT_MESSAGE_START", messageId: "m1", role: "assistant" },
    { type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: 'data: {"fake":true}\n\n' },
    {
      type: "TEXT_MESSAGE_CONTENT",
      messageId: "m1",
      delta: `line\r\nbreaks ${String.fromCodePoint(0x20_28)} and [DONE]`,
    },
    { type: "TEXT_MESSAGE_END", messageId: "m1" },
    { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "getWeather", parentMessageId: "m1" },
    { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"city":' },
    { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '"Oslo"}' },
    { type: "TOOL_CALL_END", toolCallId: "c1" },
    { type: "TOOL_CALL_RESULT", messageId: "tr1", toolCallId: "c1", content: '{"temperature":3}', role: "tool" },
    { type: "STATE_SNAPSHOT", snapshot: { step: 1 } },
    { type: "STATE_DELTA", delta: [{ op: "replace", path: "/step", value: 2 }] },
    { type: "ACTIVITY_SNAPSHOT", messageId: "a1", activityType: "plan", content: { steps: ["a"] } },
    {
      type: "ACTIVITY_DELTA",
      messageId: "a1",
      activityType: "plan",
      patch: [{ op: "add", path: "/steps/-", value: "b" }],
    },
    { type: "CUSTOM", name: "toast", value: { text: "hi" } },
    { type: "RUN_FINISHED", threadId: "t", runId: "r", outcome: { type: "success" } },
  ],
  "chunk events": [
    { type: "RUN_STARTED", threadId: "t", runId: "r" },
    { type: "TEXT_MESSAGE_CHUNK", messageId: "m1", role: "assistant", delta: "Hel" },
    { type: "TEXT_MESSAGE_CHUNK", delta: "lo" },
    { type: "TOOL_CALL_CHUNK", toolCallId: "c1", toolCallName: "search", delta: '{"q":' },
    { type: "TOOL_CALL_CHUNK", delta: '"x"}' },
    { type: "REASONING_MESSAGE_CHUNK", messageId: "r1", delta: "hmm" },
    { type: "RUN_FINISHED", threadId: "t", runId: "r" },
  ],
  "interrupted run": [
    { type: "RUN_STARTED", threadId: "t", runId: "r" },
    { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "deleteFile" },
    { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"path":"/x"}' },
    { type: "TOOL_CALL_END", toolCallId: "c1" },
    {
      type: "RUN_FINISHED",
      threadId: "t",
      runId: "r",
      usage: [{ inputTokens: 3, outputTokens: 4, totalTokens: 7 }],
      outcome: {
        type: "interrupt",
        interrupts: [
          { id: "i1", reason: "tool_call", toolCallId: "c1", message: "Approve?", metadata: { kind: "approval" } },
          { id: "i2", reason: "human_input", message: "Your name?" },
        ],
      },
    },
  ],
};

type StreamCase = { name: string; protocol: ChatProtocolType; wire: string };

const cases: StreamCase[] = [
  ...aiSDKScenarioNames.map((name) => ({
    name: `AI SDK: ${name}`,
    protocol: aiSDKProtocol(),
    wire: encodeAISDKStream(aiSDKScenarios[name] as { type: string }[]).join(""),
  })),
  ...Object.entries(aguiEvents).flatMap(([name, events]) => [
    { name: `AG-UI SSE: ${name}`, protocol: aguiProtocol(), wire: encodeAGUIStream(events).join("") },
    {
      name: `AG-UI NDJSON: ${name}`,
      protocol: tanstackAIProtocol(),
      wire: encodeAGUIStream(events, { framing: "ndjson" }).join(""),
    },
    {
      name: `AG-UI durable NDJSON: ${name}`,
      protocol: tanstackAIProtocol(),
      wire: events.map((chunk, index) => `${JSON.stringify({ id: String(index), chunk })}\n`).join(""),
    },
    {
      name: `AG-UI SSE with CRLF, ids, comments and keep-alives: ${name}`,
      protocol: aguiProtocol(),
      wire: `\uFEFF: connected\r\n\r\n${events
        .map((event, index) => `id: ${index}\r\nevent: message\r\ndata: ${JSON.stringify(event)}\r\n\r\n: ping\r\n\r\n`)
        .join("")}data: [DONE]\r\n\r\n`,
    },
  ]),
  { name: "AI SDK text stream", protocol: aiSDKTextProtocol(), wire: "Plain text, no framing at all.\n\nZażółć 👩‍👩‍👧‍👦" },
  {
    name: "AI SDK without the last blank line",
    protocol: aiSDKProtocol(),
    wire: encodeAISDKStream(aiSDKTextAnswer("Unterminated answer"), { done: false }).join("").trimEnd(),
  },
];

/** The text protocol emits one delta per network piece - compare what the pieces add up to. */
const comparable = (events: ChatStreamEventType[]) => {
  const merged: ChatStreamEventType[] = [];
  events.forEach((event) => {
    const last = merged.at(-1);
    if (event.type === "text-delta" && last?.type === "text-delta" && last.id === event.id) {
      merged[merged.length - 1] = { ...last, delta: last.delta + event.delta };
    } else {
      merged.push(event);
    }
  });
  return merged;
};

describe("Chunk boundaries", () => {
  describe.each(cases)("when streaming $name", ({ protocol, wire }) => {
    const whole = decode(protocol, [wire]);

    it("should decode something", () => {
      expect(whole.events.length).toBeGreaterThan(0);
    });

    it("should decode the same events when the stream is cut at any offset", () => {
      for (let offset = 1; offset < wire.length; offset += 1) {
        const cut = decode(protocol, [wire.slice(0, offset), wire.slice(offset)]);
        if (JSON.stringify(comparable(cut.events)) !== JSON.stringify(comparable(whole.events))) {
          // Only build the readable diff for the offset that fails
          expect(comparable(cut.events), `cut at offset ${offset}`).toEqual(comparable(whole.events));
        }
      }
    });

    it("should decode the same events one character at a time", () => {
      const single = decode(protocol, splitIntoChunks([wire], 1));

      expect(comparable(single.events)).toEqual(comparable(whole.events));
      expect(single.message).toEqual(whole.message);
    });

    it.each([2, 3, 7, 16, 64])("should decode the same events in pieces of %i characters", (size) => {
      const pieces = decode(protocol, splitIntoChunks([wire], size));

      expect(comparable(pieces.events)).toEqual(comparable(whole.events));
      expect(pieces.message).toEqual(whole.message);
    });

    it("should replay to the same events after a reset in the middle of the stream", () => {
      for (const offset of [1, Math.floor(wire.length / 3), Math.floor(wire.length / 2), wire.length - 1]) {
        const events: ChatStreamEventType[] = [];
        const decoder = protocol.createDecoder((event) => events.push(event));
        decoder.feed(wire.slice(0, offset));
        decoder.reset();
        events.length = 0;

        decoder.feed(wire);
        decoder.flush();

        expect(comparable(events), `reset at offset ${offset}`).toEqual(comparable(whole.events));
      }
    });

    it("should not emit anything on a second flush", () => {
      const before = whole.events.length;
      whole.decoder.flush();
      expect(whole.events).toHaveLength(before);
    });
  });

  describe("when splitting test streams", () => {
    it("should keep the text and respect the size", () => {
      const pieces = splitIntoChunks(["abc", "defg"], 3);
      expect(pieces).toEqual(["abc", "def", "g"]);
      expect(splitIntoChunks([], 5)).toEqual([]);
      expect(splitIntoChunks(["ab"], 10)).toEqual(["ab"]);
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      "should reject the size %s instead of hanging",
      (size) => {
        expect(() => splitIntoChunks(["abc"], size)).toThrow(RangeError);
      },
    );

    it("should encode streams like the helpers document", () => {
      expect(encodeAISDKStream([{ type: "start" }])).toEqual(['data: {"type":"start"}\n\n', "data: [DONE]\n\n"]);
      expect(encodeAISDKStream([{ type: "start" }], { done: false })).toEqual(['data: {"type":"start"}\n\n']);
      expect(encodeAGUIStream([{ type: "RUN_STARTED" }])).toEqual(['data: {"type":"RUN_STARTED"}\n\n']);
      expect(encodeAGUIStream([{ type: "RUN_STARTED" }], { framing: "ndjson" })).toEqual(['{"type":"RUN_STARTED"}\n']);
    });

    it("should build answers that decode to the given text", () => {
      const aiSDK = decode(aiSDKProtocol(), encodeAISDKStream(aiSDKTextAnswer("One two  three", { messageId: "m" })));
      expect(aiSDK.message).toEqual({
        id: "m",
        role: "assistant",
        parts: [{ type: "step-start" }, { type: "text", id: "t1", text: "One two  three", state: "done" }],
      });
      const single = aiSDKTextAnswer("One two", { words: false });
      expect(single.filter((chunk) => chunk.type === "text-delta")).toEqual([
        { type: "text-delta", id: "t1", delta: "One two" },
      ]);
      const agui = decode(aguiProtocol(), encodeAGUIStream(aguiTextAnswer("One two  three", { messageId: "m9" })));
      expect(agui.message.parts).toEqual([
        { type: "step-start" },
        { type: "text", id: "m9", text: "One two  three", state: "done" },
      ]);
      expect(agui.events[0]).toEqual({ type: "run-start", threadId: "thread-1", runId: "run-1" });
    });
  });
});
