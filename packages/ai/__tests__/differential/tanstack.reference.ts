/**
 * Differential test helpers for TanStack AI (1.x): a real `chat()` run with TanStack's scripted fake adapter produces
 * the AG-UI events, TanStack's own client-side `StreamProcessor` is the reference reader, and our AG-UI decoder +
 * message builder read the same bytes.
 */
import type { AGUIFramingType, ChatMessageType, ChatStreamEventType } from "@hyper-fetch/ai";
import { ChatMessageBuilder, createAGUIDecoder } from "@hyper-fetch/ai";
import type { StreamChunk, UIMessage } from "@tanstack/ai";
import { chat, StreamProcessor, toHttpResponse, toolDefinition, toServerSentEventsResponse } from "@tanstack/ai";
import type { FakeResponseStep } from "@tanstack/ai/testing";
import { fakeText } from "@tanstack/ai/testing";
import { z } from "zod";

/* -------------------------------------------------------------------------------------------------
 * "Server" - TanStack AI tools and a scripted run
 * -----------------------------------------------------------------------------------------------*/

export const getWeather = toolDefinition({
  name: "getWeather",
  description: "Weather in a city",
  inputSchema: z.object({ city: z.string() }),
  outputSchema: z.object({ temperature: z.number() }),
}).server(async ({ city }) => ({ temperature: city.length * 3 }));

export const explode = toolDefinition({
  name: "explode",
  description: "Always fails",
  inputSchema: z.object({ why: z.string() }),
}).server(async ({ why }) => {
  throw new Error(`Exploded: ${why}`);
});

export const plainText = toolDefinition({
  name: "plainText",
  description: "Returns a string that is not JSON",
  inputSchema: z.object({}),
}).server(async () => "just some text");

// Client tool - executed in the browser
export const getLocation = toolDefinition({
  name: "getLocation",
  description: "Where the user is",
  inputSchema: z.object({ precise: z.boolean() }),
  outputSchema: z.object({ city: z.string() }),
});

export const deleteFile = toolDefinition({
  name: "deleteFile",
  description: "Delete a file",
  needsApproval: true,
  inputSchema: z.object({ path: z.string() }),
  outputSchema: z.object({ deleted: z.boolean() }),
}).server(async () => ({ deleted: true }));

export const tanstackTools = [getWeather, explode, plainText, getLocation, deleteFile];

export type TanstackRunOptionsType = {
  framing?: "sse" | "ndjson";
  messages?: unknown[];
  resume?: unknown[];
  runId?: string;
  parentRunId?: string;
};

/** Run TanStack AI's `chat()` with scripted model answers and return the exact response body. */
export const runTanstack = async (responses: FakeResponseStep[], options: TanstackRunOptionsType = {}) => {
  const adapter = fakeText();
  adapter.setResponses(responses);
  const stream = chat({
    adapter,
    threadId: "thread-1",
    runId: options.runId ?? "run-1",
    ...(options.parentRunId !== undefined && { parentRunId: options.parentRunId }),
    ...(options.resume !== undefined && { resume: options.resume }),
    messages: options.messages ?? [{ id: "user-1", role: "user", content: "Hi" }],
    tools: tanstackTools,
  } as unknown as Parameters<typeof chat>[0]) as unknown as AsyncIterable<StreamChunk>;
  const response = options.framing === "ndjson" ? toHttpResponse(stream) : toServerSentEventsResponse(stream);
  return response.text();
};

/** Parse a TanStack response body back to its AG-UI events (the reference reader takes events, not bytes). */
export const parseWire = (wire: string): StreamChunk[] =>
  wire
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== "data: [DONE]")
    .map((line) => JSON.parse(line.startsWith("data:") ? line.slice("data:".length) : line) as StreamChunk);

/* -------------------------------------------------------------------------------------------------
 * Readers
 * -----------------------------------------------------------------------------------------------*/

/** TanStack AI's own client-side reader. */
export const readWithTanstack = (events: StreamChunk[]): UIMessage[] => {
  const processor = new StreamProcessor();
  processor.prepareAssistantMessage();
  events.forEach((event) => processor.processChunk(event));
  processor.finalizeStream();
  return processor.getMessages();
};

export const readWithOurs = (
  wire: string | string[],
  options: { framing?: AGUIFramingType; base?: ChatMessageType } = {},
) => {
  const events: ChatStreamEventType[] = [];
  const builder = new ChatMessageBuilder(options.base ?? { id: "local", role: "assistant", parts: [] });
  const decoder = createAGUIDecoder((event) => {
    events.push(event);
    builder.apply(event);
  }, options.framing);
  (typeof wire === "string" ? [wire] : wire).forEach((piece) => decoder.feed(piece));
  decoder.flush();
  return { events, builder, message: builder.message };
};

/* -------------------------------------------------------------------------------------------------
 * Comparison - both message models reduced to what the user sees
 * -----------------------------------------------------------------------------------------------*/

export type SummaryPartType =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | {
      type: "tool";
      toolName: string;
      toolCallId: string;
      input: unknown;
      status: "streaming" | "waiting" | "approval" | "done" | "error";
      output?: unknown;
      errorText?: string;
      approvalId?: string;
    };

type TanstackPart = UIMessage["parts"][number];

const parse = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

/** What TanStack AI's reader shows: every assistant message, parts in order, tool results merged into their call. */
export const summarizeTanstack = (messages: UIMessage[]): SummaryPartType[] => {
  const parts = messages.filter((message) => message.role === "assistant").flatMap((message) => message.parts);
  const results = new Map(
    parts
      .filter((part): part is Extract<TanstackPart, { type: "tool-result" }> => part.type === "tool-result")
      .map((part) => [part.toolCallId, part]),
  );
  const summary: SummaryPartType[] = [];
  parts.forEach((part) => {
    if (part.type === "text" && part.content) {
      summary.push({ type: "text", text: part.content });
    } else if (part.type === "thinking") {
      summary.push({ type: "reasoning", text: part.content });
    } else if (part.type === "tool-call") {
      const result = results.get(part.id);
      const base = { type: "tool" as const, toolName: part.name, toolCallId: part.id, input: part.input };
      if (result?.state === "error") {
        summary.push({ ...base, status: "error", errorText: result.error ?? "" });
      } else if (result) {
        summary.push({ ...base, status: "done", output: parse(result.content) });
      } else if (part.state === "approval-requested" && part.approval) {
        summary.push({ ...base, status: "approval", approvalId: part.approval.id });
      } else {
        summary.push({ ...base, status: part.state === "input-complete" ? "waiting" : "streaming" });
      }
    }
  });
  return summary;
};

export const summarizeOurs = (message: ChatMessageType): SummaryPartType[] => {
  const summary: SummaryPartType[] = [];
  message.parts.forEach((part) => {
    if (part.type === "text" && part.text) {
      summary.push({ type: "text", text: part.text });
    } else if (part.type === "reasoning") {
      summary.push({ type: "reasoning", text: part.text });
    } else if (part.type === "tool") {
      const base = { type: "tool" as const, toolName: part.toolName, toolCallId: part.toolCallId, input: part.input };
      if (part.state === "output-error") {
        summary.push({ ...base, status: "error", errorText: part.errorText });
      } else if (part.state === "output-denied") {
        summary.push({ ...base, status: "error", errorText: "denied" });
      } else if (part.state === "output-available") {
        summary.push({ ...base, status: "done", output: part.output });
      } else if (part.state === "approval-requested") {
        summary.push({ ...base, status: "approval", approvalId: part.approval.id });
      } else {
        summary.push({ ...base, status: part.state === "input-available" ? "waiting" : "streaming" });
      }
    }
  });
  return summary;
};

/**
 * TanStack's fake adapter names every text message of a run `<runId>-text`, also across agent loop iterations. Real
 * provider adapters mint a new message id for every model call - give every iteration its own ids like they do.
 */
export const withUniqueMessageIds = (events: StreamChunk[]): StreamChunk[] => {
  let iteration = 0;
  return events.map((event) => {
    const value = event as StreamChunk & { messageId?: string };
    const renamed =
      iteration > 0 && typeof value.messageId === "string" && event.type !== "TOOL_CALL_RESULT"
        ? ({ ...value, messageId: `${value.messageId}-${iteration}` } as StreamChunk)
        : event;
    if (event.type === "RUN_FINISHED") {
      iteration += 1;
    }
    return renamed;
  });
};

export const toSSE = (events: StreamChunk[]) => events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
export const toNDJSON = (events: StreamChunk[]) => events.map((event) => `${JSON.stringify(event)}\n`).join("");
