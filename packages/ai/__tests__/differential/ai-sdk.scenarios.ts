/**
 * AI SDK UI message stream scenarios (typed as the AI SDK's own `UIMessageChunk`), shared by the differential and the
 * chunk-boundary tests. Every scenario is a stream the AI SDK client accepts.
 */
import type { UIMessageChunk } from "ai";

const LINE_SEPARATOR = String.fromCodePoint(0x20_28);

const start = (messageId = "msg-1"): UIMessageChunk => ({ type: "start", messageId });
const finish = (finishReason: "stop" | "tool-calls" | "length" = "stop"): UIMessageChunk => ({
  type: "finish",
  finishReason,
});

const text = (id: string, value: string, size = 4): UIMessageChunk[] => [
  { type: "text-start", id },
  ...(value.match(new RegExp(`[\\s\\S]{1,${size}}`, "g")) ?? []).map(
    (delta): UIMessageChunk => ({ type: "text-delta", id, delta }),
  ),
  { type: "text-end", id },
];

const reasoning = (id: string, value: string): UIMessageChunk[] => [
  { type: "reasoning-start", id },
  ...(value.match(/[\s\S]{1,5}/g) ?? []).map((delta): UIMessageChunk => ({ type: "reasoning-delta", id, delta })),
  { type: "reasoning-end", id },
];

const streamedTool = (
  toolCallId: string,
  toolName: string,
  { input, ...extra }: { input: unknown; dynamic?: boolean; providerExecuted?: boolean; title?: string },
): UIMessageChunk[] => [
  { type: "tool-input-start", toolCallId, toolName, ...extra },
  ...(JSON.stringify(input).match(/[\s\S]{1,3}/g) ?? []).map(
    (inputTextDelta): UIMessageChunk => ({ type: "tool-input-delta", toolCallId, inputTextDelta }),
  ),
  { type: "tool-input-available", toolCallId, toolName, input, ...extra },
];

const step = (...chunks: UIMessageChunk[]): UIMessageChunk[] => [
  { type: "start-step" },
  ...chunks,
  { type: "finish-step" },
];

export const aiSDKScenarios: Record<string, UIMessageChunk[]> = {
  "plain text": [start(), ...step(...text("t1", "Hello there, how are you?")), finish()],

  "text with empty and unicode deltas": [
    start(),
    ...step(
      { type: "text-start", id: "t1" },
      { type: "text-delta", id: "t1", delta: "" },
      { type: "text-delta", id: "t1", delta: "Zażółć gęślą jaźń " },
      { type: "text-delta", id: "t1", delta: `👩‍👩‍👧‍👦 ${LINE_SEPARATOR} "quoted" \\ \n\r\n\t` },
      { type: "text-delta", id: "t1", delta: "data: [DONE]\n\ndata: {}" },
      { type: "text-end", id: "t1" },
    ),
    finish(),
  ],

  "reasoning then text": [
    start(),
    ...step(...reasoning("r1", "Let me think about this."), ...text("t1", "Here is the answer.")),
    finish(),
  ],

  "interleaved text parts with different ids": [
    start(),
    ...step(
      { type: "text-start", id: "a" },
      { type: "text-start", id: "b" },
      { type: "text-delta", id: "a", delta: "A1 " },
      { type: "text-delta", id: "b", delta: "B1 " },
      { type: "text-delta", id: "a", delta: "A2" },
      { type: "text-end", id: "a" },
      { type: "text-delta", id: "b", delta: "B2" },
      { type: "text-end", id: "b" },
    ),
    finish(),
  ],

  "interleaved reasoning and text": [
    start(),
    ...step(
      { type: "reasoning-start", id: "x" },
      { type: "text-start", id: "x" },
      { type: "reasoning-delta", id: "x", delta: "thinking" },
      { type: "text-delta", id: "x", delta: "saying" },
      { type: "reasoning-end", id: "x" },
      { type: "text-end", id: "x" },
    ),
    finish(),
  ],

  "text part left open": [
    start(),
    ...step({ type: "text-start", id: "t1" }, { type: "text-delta", id: "t1", delta: "cut" }),
  ],

  "streamed tool call with output": [
    start(),
    ...step(...streamedTool("call-1", "getWeather", { input: { city: "Oslo", days: [1, 2], nested: { unit: "C" } } }), {
      type: "tool-output-available",
      toolCallId: "call-1",
      output: { temperature: 21 },
    }),
    finish(),
  ],

  "tool call without input streaming": [
    start(),
    ...step(
      { type: "tool-input-available", toolCallId: "call-1", toolName: "getWeather", input: { city: "Oslo" } },
      { type: "tool-output-available", toolCallId: "call-1", output: "sunny" },
    ),
    finish(),
  ],

  "tool call with empty and primitive inputs": [
    start(),
    ...step(
      { type: "tool-input-start", toolCallId: "call-1", toolName: "now" },
      { type: "tool-input-available", toolCallId: "call-1", toolName: "now", input: {} },
      { type: "tool-output-available", toolCallId: "call-1", output: null },
      { type: "tool-input-available", toolCallId: "call-2", toolName: "echo", input: "just a string" },
      { type: "tool-output-available", toolCallId: "call-2", output: 0 },
      { type: "tool-input-available", toolCallId: "call-3", toolName: "flag", input: null },
      { type: "tool-output-available", toolCallId: "call-3", output: false },
    ),
    finish(),
  ],

  "dynamic tool call": [
    start(),
    ...step(...streamedTool("call-1", "mcp_search", { input: { query: "docs" }, dynamic: true }), {
      type: "tool-output-available",
      toolCallId: "call-1",
      output: { hits: 3 },
      dynamic: true,
    }),
    finish(),
  ],

  "dynamic tool call without input streaming": [
    start(),
    ...step(
      {
        type: "tool-input-available",
        toolCallId: "call-1",
        toolName: "mcp_search",
        input: { query: "x" },
        dynamic: true,
      },
      { type: "tool-output-error", toolCallId: "call-1", errorText: "MCP server down", dynamic: true },
    ),
    finish(),
  ],

  "provider-executed tool call": [
    start(),
    ...step(
      ...text("t1", "Searching the web. "),
      ...streamedTool("call-1", "web_search", { input: { query: "hyper fetch" }, providerExecuted: true }),
      { type: "tool-output-available", toolCallId: "call-1", output: { results: ["a", "b"] }, providerExecuted: true },
      ...text("t2", "Found it."),
    ),
    finish(),
  ],

  "tool call with a title": [
    start(),
    ...step(...streamedTool("call-1", "getWeather", { input: { city: "Oslo" }, title: "Weather lookup" }), {
      type: "tool-output-available",
      toolCallId: "call-1",
      output: 1,
    }),
    finish(),
  ],

  "parallel tool calls with interleaved input": [
    start(),
    ...step(
      { type: "tool-input-start", toolCallId: "a", toolName: "getWeather" },
      { type: "tool-input-start", toolCallId: "b", toolName: "getTime" },
      { type: "tool-input-delta", toolCallId: "a", inputTextDelta: '{"city":' },
      { type: "tool-input-delta", toolCallId: "b", inputTextDelta: '{"zone":"U' },
      { type: "tool-input-delta", toolCallId: "a", inputTextDelta: '"Oslo"}' },
      { type: "tool-input-delta", toolCallId: "b", inputTextDelta: 'TC"}' },
      { type: "tool-input-available", toolCallId: "b", toolName: "getTime", input: { zone: "UTC" } },
      { type: "tool-input-available", toolCallId: "a", toolName: "getWeather", input: { city: "Oslo" } },
      { type: "tool-output-available", toolCallId: "b", output: "12:00" },
      { type: "tool-output-available", toolCallId: "a", output: { temperature: 3 } },
    ),
    finish(),
  ],

  "preliminary tool outputs then the final one": [
    start(),
    ...step(
      { type: "tool-input-available", toolCallId: "call-1", toolName: "research", input: { topic: "sse" } },
      { type: "tool-output-available", toolCallId: "call-1", output: { progress: 10 }, preliminary: true },
      { type: "tool-output-available", toolCallId: "call-1", output: { progress: 60 }, preliminary: true },
      { type: "tool-output-available", toolCallId: "call-1", output: { done: true } },
    ),
    finish(),
  ],

  "preliminary tool outputs then an error": [
    start(),
    ...step(
      { type: "tool-input-available", toolCallId: "call-1", toolName: "research", input: { topic: "sse" } },
      { type: "tool-output-available", toolCallId: "call-1", output: { progress: 10 }, preliminary: true },
      { type: "tool-output-error", toolCallId: "call-1", errorText: "Research failed" },
    ),
    finish(),
  ],

  "tool output error": [
    start(),
    ...step(...streamedTool("call-1", "getWeather", { input: { city: "Atlantis" } }), {
      type: "tool-output-error",
      toolCallId: "call-1",
      errorText: "City not found",
    }),
    finish(),
  ],

  "tool input error after streaming": [
    start(),
    ...step(
      { type: "tool-input-start", toolCallId: "call-1", toolName: "getWeather" },
      { type: "tool-input-delta", toolCallId: "call-1", inputTextDelta: '{"city": 4' },
      { type: "tool-input-delta", toolCallId: "call-1", inputTextDelta: "2}" },
      {
        type: "tool-input-error",
        toolCallId: "call-1",
        toolName: "getWeather",
        input: { city: 42 },
        errorText: "Invalid input: city must be a string",
      },
    ),
    finish(),
  ],

  "tool input error without streaming": [
    start(),
    ...step({
      type: "tool-input-error",
      toolCallId: "call-1",
      toolName: "getWeather",
      input: '{"city": ',
      errorText: "Invalid JSON",
    }),
    finish(),
  ],

  "tool approval request": [
    start(),
    ...step(
      { type: "tool-input-available", toolCallId: "call-1", toolName: "deleteFile", input: { path: "/tmp/x" } },
      { type: "tool-approval-request", approvalId: "approval-1", toolCallId: "call-1" },
    ),
    finish("tool-calls"),
  ],

  "tool approval request with a reason, then an automatic response": [
    start(),
    ...step(
      { type: "tool-input-available", toolCallId: "call-1", toolName: "deleteFile", input: { path: "/tmp/x" } },
      { type: "tool-approval-request", approvalId: "approval-1", toolCallId: "call-1", reason: "Deletes a file" },
      { type: "tool-approval-response", approvalId: "approval-1", approved: true, reason: "Allowed by policy" },
      { type: "tool-output-available", toolCallId: "call-1", output: { deleted: true } },
    ),
    finish(),
  ],

  "tool approval denied by the backend": [
    start(),
    ...step(
      { type: "tool-input-available", toolCallId: "call-1", toolName: "deleteFile", input: { path: "/tmp/x" } },
      { type: "tool-approval-request", approvalId: "approval-1", toolCallId: "call-1" },
      { type: "tool-approval-response", approvalId: "approval-1", approved: false, reason: "Not allowed" },
      { type: "tool-output-denied", toolCallId: "call-1" },
    ),
    finish(),
  ],

  "two steps reusing the same text id": [
    start(),
    ...step(
      ...text("0", "Let me check the weather. "),
      ...streamedTool("call-1", "getWeather", { input: { city: "Oslo" } }),
      { type: "tool-output-available", toolCallId: "call-1", output: { temperature: 21 } },
    ),
    ...step(...text("0", "It is 21 degrees in Oslo.")),
    finish(),
  ],

  "two steps reusing the same reasoning id": [
    start(),
    ...step(...reasoning("0", "I need the weather."), {
      type: "tool-input-available",
      toolCallId: "call-1",
      toolName: "getWeather",
      input: { city: "Oslo" },
    }),
    { type: "tool-output-available", toolCallId: "call-1", output: { temperature: 21 } },
    ...step(...reasoning("0", "Now I can answer."), ...text("1", "21 degrees.")),
    finish(),
  ],

  "the same text id started again in one step": [
    start(),
    ...step(...text("t1", "First. "), ...text("t1", "Second.")),
    finish(),
  ],

  "three steps with tools in each": [
    start(),
    ...step(
      { type: "tool-input-available", toolCallId: "call-1", toolName: "search", input: { q: "a" } },
      { type: "tool-output-available", toolCallId: "call-1", output: ["x"] },
    ),
    ...step(
      { type: "tool-input-available", toolCallId: "call-2", toolName: "search", input: { q: "b" } },
      { type: "tool-output-available", toolCallId: "call-2", output: ["y"] },
    ),
    ...step(...text("t1", "Done searching.")),
    finish(),
  ],

  "tool output arriving in a later step": [
    start(),
    ...step({ type: "tool-input-available", toolCallId: "call-1", toolName: "slow", input: {} }),
    ...step({ type: "tool-output-available", toolCallId: "call-1", output: "late" }, ...text("t1", "Got it.")),
    finish(),
  ],

  "sources and files": [
    start(),
    ...step(
      { type: "source-url", sourceId: "s1", url: "https://example.com/a", title: "Example A" },
      { type: "source-url", sourceId: "s2", url: "https://example.com/b" },
      { type: "source-document", sourceId: "s3", mediaType: "application/pdf", title: "Report", filename: "r.pdf" },
      { type: "source-document", sourceId: "s4", mediaType: "text/plain", title: "Notes" },
      { type: "file", url: "data:image/png;base64,iVBORw0KGgo=", mediaType: "image/png" },
      { type: "file", url: "https://example.com/audio.mp3", mediaType: "audio/mpeg" },
      ...text("t1", "See the sources."),
    ),
    finish(),
  ],

  "data parts with id reconciliation": [
    start(),
    { type: "data-weather", id: "w1", data: { city: "Oslo", status: "loading" } },
    ...step(
      { type: "data-note", data: "first" },
      { type: "data-note", data: "second" },
      { type: "data-weather", id: "w2", data: { city: "Rome", status: "loading" } },
      ...text("t1", "Working"),
      { type: "data-weather", id: "w1", data: { city: "Oslo", status: "done", temperature: 3 } },
      { type: "data-forecast", id: "w1", data: { days: 3 } },
      { type: "data-weather", id: "w2", data: null },
    ),
    finish(),
  ],

  "transient data parts": [
    start(),
    ...step(
      { type: "data-toast", data: "Saving...", transient: true },
      { type: "data-toast", id: "t", data: "Saved", transient: true },
      { type: "data-progress", id: "p", data: 10 },
      { type: "data-progress", id: "p", data: 100, transient: true },
      ...text("t1", "ok"),
    ),
    finish(),
  ],

  "metadata merged from start, message-metadata and finish": [
    { type: "start", messageId: "msg-1", messageMetadata: { model: "m1", usage: { input: 3 }, tags: ["a"] } },
    ...step(...text("t1", "Hi")),
    { type: "message-metadata", messageMetadata: { usage: { output: 5 }, tags: ["b"], nested: { deep: { a: 1 } } } },
    { type: "message-metadata", messageMetadata: { nested: { deep: { b: 2 } } } },
    { type: "finish", finishReason: "stop", messageMetadata: { usage: { total: 8 }, finished: true } },
  ],

  "null metadata": [
    { type: "start", messageId: "msg-1", messageMetadata: { model: "m1" } },
    ...step(...text("t1", "Hi")),
    { type: "message-metadata", messageMetadata: null },
    { type: "finish", messageMetadata: null },
  ],

  "reset-step drops the parts of the current step": [
    start(),
    ...step(...text("t1", "Kept. ")),
    { type: "start-step" },
    ...text("t2", "Dropped. "),
    { type: "tool-input-start", toolCallId: "call-1", toolName: "getWeather" },
    { type: "tool-input-delta", toolCallId: "call-1", inputTextDelta: '{"ci' },
    { type: "reset-step" },
    ...text("t2", "Retried."),
    ...streamedTool("call-1", "getWeather", { input: { city: "Oslo" } }),
    { type: "finish-step" },
    finish(),
  ],

  "reset-step in the first step": [
    start(),
    { type: "start-step" },
    { type: "text-start", id: "t1" },
    { type: "text-delta", id: "t1", delta: "Oops" },
    { type: "reset-step" },
    { type: "reset-step" },
    ...text("t1", "Better."),
    { type: "finish-step" },
    finish(),
  ],

  "stream without step markers": [start(), ...text("t1", "No steps here."), finish()],

  "stream without start and finish": [...text("t1", "Bare text.")],

  "finish reasons and an abort": [
    start(),
    ...step(...text("t1", "Partial")),
    { type: "abort", reason: "user stopped" },
    { type: "finish", finishReason: "length" },
  ],
};

export const aiSDKScenarioNames = Object.keys(aiSDKScenarios);
