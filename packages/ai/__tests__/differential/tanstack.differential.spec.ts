/**
 * @vitest-environment node
 *
 * Differential tests against TanStack AI (1.x): real `chat()` runs with TanStack's scripted fake adapter, encoded
 * with TanStack's own SSE and NDJSON encoders. TanStack's client-side `StreamProcessor` and our AG-UI decoder +
 * message builder read the same events and must show the same conversation.
 */
import type { AGUIMessageType, AGUIStreamEventType, ChatMessageType } from "@hyper-fetch/ai";
import { createRunAgentInput, encodeAGUIStream, fromAGUIMessages, toAGUIMessages } from "@hyper-fetch/ai";
import type { StreamChunk } from "@tanstack/ai";
import { chatParamsFromRequestBody, uiMessagesToWire } from "@tanstack/ai";
import type { FakeResponseStep } from "@tanstack/ai/testing";

import type { AGUISchemasType } from "./ag-ui.schemas";
import { expectValid, loadAGUISchemas } from "./ag-ui.schemas";
import {
  parseWire,
  readWithOurs,
  readWithTanstack,
  runTanstack,
  summarizeOurs,
  summarizeTanstack,
  toNDJSON,
  toSSE,
  withUniqueMessageIds,
} from "./tanstack.reference";

const scenarios: Record<string, FakeResponseStep[]> = {
  "plain text": [{ text: "Hello from TanStack AI, nice to meet you." }],
  "thinking then text": [{ thinking: "The user said hi. I should greet them.", text: "Hello!" }],
  "thinking only": [{ thinking: "Nothing to say." }],
  "unicode text": [{ text: 'Zażółć gęślą jaźń 👩‍👩‍👧‍👦 "quotes" \\ back\nslash\r\n\ttab data: [DONE]' }],
  "a server tool between two texts": [
    { text: "Let me check. ", toolCalls: [{ id: "call-1", name: "getWeather", input: { city: "Oslo" } }] },
    { text: "It is 12 degrees." },
  ],
  "thinking in every iteration": [
    { thinking: "I need the weather.", toolCalls: [{ id: "call-1", name: "getWeather", input: { city: "Oslo" } }] },
    { thinking: "Now I know.", text: "12 degrees." },
  ],
  "three iterations of tool calls": [
    { toolCalls: [{ id: "call-1", name: "getWeather", input: { city: "Oslo" } }] },
    { text: "One more. ", toolCalls: [{ id: "call-2", name: "getWeather", input: { city: "Rome" } }] },
    { text: "Done." },
  ],
  "a failing server tool": [
    { toolCalls: [{ id: "call-1", name: "explode", input: { why: "disk full" } }] },
    { text: "The tool failed." },
  ],
  "a server tool returning plain text": [
    { toolCalls: [{ id: "call-1", name: "plainText", input: {} }] },
    { text: "Got text." },
  ],
  "a tool call without input": [{ toolCalls: [{ id: "call-1", name: "plainText" }] }, { text: "Ok." }],
  "a call to an unknown tool": [{ toolCalls: [{ id: "call-1", name: "nope", input: { a: 1 } }] }, { text: "Hm." }],
  "parallel tool calls": [
    {
      text: "Running. ",
      toolCalls: [
        { id: "a", name: "getWeather", input: { city: "Oslo" } },
        { id: "b", name: "explode", input: { why: "y" } },
        { id: "c", name: "plainText" },
      ],
    },
    { text: "All done." },
  ],
  "a client tool the run waits for": [
    { text: "Where are you? ", toolCalls: [{ id: "call-1", name: "getLocation", input: { precise: true } }] },
  ],
  "a tool that needs approval": [
    { text: "Deleting. ", toolCalls: [{ id: "call-1", name: "deleteFile", input: { path: "/tmp/x" } }] },
  ],
  "a client tool next to a server tool": [
    {
      toolCalls: [
        { id: "a", name: "getWeather", input: { city: "Oslo" } },
        { id: "b", name: "getLocation", input: { precise: false } },
      ],
    },
  ],
  "a provider error": [{ error: "Provider unavailable" }],
  "an error after a tool call": [
    { text: "Checking. ", toolCalls: [{ id: "call-1", name: "getWeather", input: { city: "Oslo" } }] },
    { error: "Rate limited" },
  ],
  "an answer cut off by the length limit": [{ text: "This answer is cut", finishReason: "length" }],
  "a content filter stop": [{ text: "I cannot", finishReason: "content_filter" }],
};

const names = Object.keys(scenarios);

/** Real adapters mint a message id per model call; the events are otherwise exactly what `chat()` produced. */
const record = async (name: string) => withUniqueMessageIds(parseWire(await runTanstack(scenarios[name])));

describe("TanStack AI differential", () => {
  let schemas: AGUISchemasType;

  beforeAll(async () => {
    schemas = await loadAGUISchemas();
  });

  describe.each(names)("when streaming: %s", (name) => {
    let events: StreamChunk[];

    beforeAll(async () => {
      events = await record(name);
    });

    it("should receive events that are valid AG-UI 1.0", () => {
      expect(schemas.PROTOCOL_VERSION).toBe("1.0");
      events.forEach((event) => expectValid(schemas.EventSchemas, event));
    });

    it("should show the same conversation as TanStack's own reader", () => {
      const reference = summarizeTanstack(readWithTanstack(events));
      const ours = readWithOurs(toSSE(events));

      expect(summarizeOurs(ours.message)).toEqual(reference);
    });

    it("should decode SSE and NDJSON to the same events", () => {
      const sse = readWithOurs(toSSE(events));
      const ndjson = readWithOurs(toNDJSON(events));
      const forced = readWithOurs(toNDJSON(events), { framing: "ndjson" });

      expect(ndjson.events).toEqual(sse.events);
      expect(forced.events).toEqual(sse.events);
      expect(ndjson.message).toEqual(sse.message);
    });

    it("should decode what TanStack's SSE and NDJSON encoders send", async () => {
      const [sse, ndjson] = await Promise.all([
        runTanstack(scenarios[name], { framing: "sse" }),
        runTanstack(scenarios[name], { framing: "ndjson" }),
      ]);

      // Timestamps and generated message ids differ between two runs - the conversation does not
      expect(summarizeOurs(readWithOurs(ndjson).message)).toEqual(summarizeOurs(readWithOurs(sse).message));
      expect(readWithOurs(ndjson).events.map((event) => event.type)).toEqual(
        readWithOurs(sse).events.map((event) => event.type),
      );
    });

    it("should read the fake adapter's reused message ids like unique ones", async () => {
      // The fake adapter names the text of every agent loop iteration `<runId>-text`
      const raw = await runTanstack(scenarios[name]);

      expect(summarizeOurs(readWithOurs(raw).message)).toEqual(summarizeOurs(readWithOurs(toSSE(events)).message));
    });

    it("should encode test streams the way TanStack does", async () => {
      const [sse, ndjson] = await Promise.all([
        runTanstack(scenarios[name], { framing: "sse" }),
        runTanstack(scenarios[name], { framing: "ndjson" }),
      ]);

      expect(encodeAGUIStream(parseWire(sse) as unknown as AGUIStreamEventType[]).join("")).toBe(sse);
      expect(
        encodeAGUIStream(parseWire(ndjson) as unknown as AGUIStreamEventType[], { framing: "ndjson" }).join(""),
      ).toBe(ndjson);
    });

    it("should send the conversation back the way TanStack's client does", async () => {
      const reference = readWithTanstack(events);
      const ours = readWithOurs(toSSE(events));

      // Reasoning is not sent back by us, and a MESSAGES_SNAPSHOT puts the user message into TanStack's reader
      const referenceRows = uiMessagesToWire(reference).filter(
        (row) => row.role !== "reasoning" && row.role !== "user",
      );
      const ourRows = toAGUIMessages([ours.message]);
      const comparable = (rows: readonly object[]) =>
        rows
          .map((row) => {
            const { id: _id, metadata: _metadata, ...rest } = row as { id?: string; metadata?: unknown };
            return rest;
          })
          // TanStack keeps an empty assistant row for a run that produced nothing
          .filter((row) => Object.keys(row).length > 1);

      expect(comparable(ourRows)).toEqual(comparable(referenceRows));
      ourRows.forEach((row) => expectValid(schemas.MessageSchema, row));
    });

    it("should build a request body that AG-UI and TanStack AI accept", async () => {
      const ours = readWithOurs(toSSE(events));
      const user: ChatMessageType = {
        id: "user-1",
        role: "user",
        parts: [{ type: "text", id: "user-1-text", text: "Hi", state: "done" }],
      };
      const body = createRunAgentInput({
        chatId: "thread-1",
        runId: "run-2",
        parentRunId: "run-1",
        messages: [user, ours.message],
        trigger: "submit-message",
        body: { model: "fake-model" },
        state: undefined,
        tools: [{ name: "getLocation", description: "Where the user is", parameters: { type: "object" } }],
        resume: [],
      });
      const wire = JSON.stringify(body);
      const sent = JSON.parse(wire) as Record<string, unknown>;

      expectValid(schemas.RunAgentInputSchema, sent);
      const params = await chatParamsFromRequestBody(sent);
      expect(params.threadId).toBe("thread-1");
      expect(params.runId).toBe("run-2");
      expect(params.parentRunId).toBe("run-1");
      expect(params.messages).toEqual(sent.messages);
    });

    it("should survive a round trip through AG-UI messages", () => {
      const ours = readWithOurs(toSSE(events));
      const rows = toAGUIMessages([ours.message]);

      const [restored] = fromAGUIMessages(rows as AGUIMessageType[]);

      // Reasoning is not sent back, everything else comes back in the same order with the same content
      const withoutReasoning = summarizeOurs(ours.message).filter((part) => part.type !== "reasoning");
      const pendingAsWaiting = withoutReasoning.map((part) =>
        part.type === "tool" && part.status === "approval"
          ? {
              type: part.type,
              toolName: part.toolName,
              toolCallId: part.toolCallId,
              input: part.input,
              status: "waiting",
            }
          : part,
      );
      expect(restored === undefined ? [] : summarizeOurs(restored)).toEqual(pendingAsWaiting);
      expect(toAGUIMessages(restored === undefined ? [] : [restored])).toEqual(rows);
    });
  });
});
