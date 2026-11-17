import { createNDJSONParser, createSSEParser } from "@hyper-fetch/core";
import type { StreamParserType } from "@hyper-fetch/core";

import type {
  ChatFinishReasonType,
  ChatInterruptType,
  ChatStreamEventType,
  ChatUsageType,
} from "../../chat/chat.types";
import type { JSONPatchOperationType } from "../../utils/json-patch";
import type { ChatPrepareRequestContextType, ChatProtocolType } from "../protocol.types";
import type { AGUIMessageType } from "./ag-ui.messages";
import { fromAGUIMessages, parseToolContent, toAGUIMessages } from "./ag-ui.messages";

export type AGUIEventType = { type: string; [key: string]: unknown };

export type AGUIFramingType = "sse" | "ndjson" | "auto";

export type AGUIProtocolOptionsType = {
  /**
   * How events are framed on the wire. `auto` (default) detects SSE (`data: {...}`) or NDJSON (`{...}\n`, e.g.
   * TanStack AI `toHttpResponse`) from the first bytes.
   */
  framing?: AGUIFramingType;
  /** `RunAgentInput.context` sent with every run */
  context?: { description: string; value: string }[] | (() => { description: string; value: string }[]);
  /** Replace the request body. Receives the default `RunAgentInput`, return the body to send. */
  prepareBody?: (context: ChatPrepareRequestContextType & { defaultBody: Record<string, unknown> }) => unknown;
};

type AGUIDecoderStateType = {
  toolCalls: Map<string, { name: string; args: string; ended: boolean }>;
  openText: string | null;
  openReasoning: string | null;
  openToolCall: string | null;
  started: boolean;
  /** A run finished - whatever the backend sends next (TanStack AI's next agent loop iteration) is a new step */
  finished: boolean;
};

const str = (value: unknown) => (typeof value === "string" ? value : "");

const TANSTACK_FINISH_REASONS: Record<string, ChatFinishReasonType> = {
  stop: "stop",
  length: "length",
  content_filter: "content-filter",
  tool_calls: "tool-calls",
};

const sumUsage = (usage: unknown): ChatUsageType | undefined => {
  if (!Array.isArray(usage) || usage.length === 0) {
    return undefined;
  }
  const total: ChatUsageType = {};
  const keys: (keyof ChatUsageType)[] = [
    "inputTokens",
    "outputTokens",
    "totalTokens",
    "reasoningTokens",
    "cachedInputTokens",
  ];
  usage.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }
    keys.forEach((key) => {
      const value = (entry as Record<string, unknown>)[key];
      if (typeof value === "number") {
        total[key] = (total[key] ?? 0) + value;
      }
    });
  });
  return total;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const getTanstackMetadata = (event: AGUIEventType) => {
  const metadata = event.metadata as { tanstack?: Record<string, unknown> } | undefined;
  return isRecord(metadata) && isRecord(metadata.tanstack) ? metadata.tanstack : undefined;
};

/** Error message of a failed tool result - TanStack AI sends `{"error": "..."}` as the result content. */
const getToolErrorText = (output: unknown): string => {
  if (isRecord(output) && typeof output.error === "string") {
    return output.error;
  }
  return typeof output === "string" && output ? output : "Tool execution failed";
};

/**
 * Map AG-UI 1.0 events to normalized events. Stateful (CHUNK events and tool call arguments), so use one mapper per
 * response. Also understands TanStack AI conventions (approval and client tool interrupts, `metadata.tanstack`).
 */
export const createAGUIEventMapper = () => {
  const state: AGUIDecoderStateType = {
    toolCalls: new Map(),
    openText: null,
    openReasoning: null,
    openToolCall: null,
    started: false,
    finished: false,
  };

  const out: ChatStreamEventType[] = [];

  const ensureStarted = () => {
    // Every AG-UI run is one step of the assistant message, like a model call in AI SDK
    if (!state.started) {
      state.started = true;
      out.push({ type: "message-start" });
      out.push({ type: "step-start" });
      return;
    }
    if (state.finished) {
      // Content after `RUN_FINISHED` - the next run (or the next TanStack AI agent loop iteration) of this response
      state.finished = false;
      out.push({ type: "step-start" });
    }
  };

  const closeText = () => {
    if (state.openText === null) {
      return;
    }
    out.push({ type: "text-end", id: state.openText });
    state.openText = null;
  };

  const closeReasoning = () => {
    if (state.openReasoning === null) {
      return;
    }
    out.push({ type: "reasoning-end", id: state.openReasoning });
    state.openReasoning = null;
  };

  const startToolCall = (toolCallId: string, toolName: string) => {
    if (state.toolCalls.has(toolCallId)) {
      return;
    }
    ensureStarted();
    state.toolCalls.set(toolCallId, { name: toolName, args: "", ended: false });
    out.push({ type: "tool-input-start", toolCallId, toolName });
  };

  const appendToolArgs = (toolCallId: string, delta: string) => {
    const call = state.toolCalls.get(toolCallId);
    if (!call || !delta) {
      return;
    }
    call.args += delta;
    out.push({ type: "tool-input-delta", toolCallId, delta });
  };

  const endToolCall = (toolCallId: string, final: { input?: unknown; args?: string } = {}) => {
    const call = state.toolCalls.get(toolCallId);
    if (!call || call.ended) {
      return;
    }
    call.ended = true;
    if (final.input !== undefined) {
      out.push({ type: "tool-input-available", toolCallId, toolName: call.name, input: final.input });
      return;
    }
    if (final.args !== undefined) {
      // The complete arguments sent with the end event win over the streamed ones
      call.args = final.args;
    }
    if (!call.args.trim()) {
      out.push({ type: "tool-input-available", toolCallId, toolName: call.name, input: {} });
      return;
    }
    try {
      out.push({ type: "tool-input-available", toolCallId, toolName: call.name, input: JSON.parse(call.args) });
    } catch {
      out.push({
        type: "tool-input-error",
        toolCallId,
        toolName: call.name,
        input: call.args,
        errorText: "Invalid tool call arguments: not valid JSON",
      });
    }
  };

  const closeToolCallChunk = () => {
    if (state.openToolCall === null) {
      return;
    }
    endToolCall(state.openToolCall);
    state.openToolCall = null;
  };

  const closeAll = () => {
    closeText();
    closeReasoning();
    closeToolCallChunk();
  };

  /** A finished run has no tool call still streaming its arguments - end the ones the backend forgot to end. */
  const endOpenToolCalls = () => {
    state.toolCalls.forEach((call, toolCallId) => {
      if (!call.ended) {
        endToolCall(toolCallId);
      }
    });
  };

  const handleInterrupts = (interrupts: unknown) => {
    if (!Array.isArray(interrupts)) {
      return;
    }
    const generic: ChatInterruptType[] = [];
    interrupts.forEach((value) => {
      if (!value || typeof value !== "object") {
        return;
      }
      const interrupt = value as ChatInterruptType;
      const kind = interrupt.metadata?.kind;
      if (kind === "approval" && interrupt.toolCallId) {
        out.push({
          type: "tool-approval-request",
          toolCallId: interrupt.toolCallId,
          approvalId: interrupt.id,
          interruptId: interrupt.id,
          ...(interrupt.message !== undefined && { reason: interrupt.message }),
        });
      } else if (
        (kind === "client_tool" || interrupt.reason === "tanstack:client_tool_execution") &&
        interrupt.toolCallId
      ) {
        out.push({ type: "tool-client-execution", toolCallId: interrupt.toolCallId, interruptId: interrupt.id });
      } else {
        generic.push(interrupt);
      }
    });
    if (generic.length > 0) {
      out.push({ type: "interrupt", interrupts: generic });
    }
  };

  const map = (event: AGUIEventType): ChatStreamEventType[] => {
    out.length = 0;

    if (!isRecord(event)) {
      // Not an event at all (e.g. a bare `null` or a number on the wire)
      return [{ type: "raw", protocol: "ag-ui", value: event }];
    }

    switch (event.type) {
      case "RUN_STARTED": {
        out.push({
          type: "run-start",
          ...(typeof event.threadId === "string" && { threadId: event.threadId }),
          ...(typeof event.runId === "string" && { runId: event.runId }),
        });
        ensureStarted();
        break;
      }
      case "TEXT_MESSAGE_START": {
        closeAll();
        ensureStarted();
        state.openText = str(event.messageId);
        out.push({ type: "text-start", id: state.openText });
        break;
      }
      case "TEXT_MESSAGE_CONTENT": {
        const id = str(event.messageId);
        if (state.openText !== id) {
          closeAll();
          ensureStarted();
          state.openText = id;
          out.push({ type: "text-start", id });
        }
        out.push({ type: "text-delta", id, delta: str(event.delta) });
        break;
      }
      case "TEXT_MESSAGE_END": {
        if (state.openText === str(event.messageId)) {
          closeText();
        }
        break;
      }
      case "TEXT_MESSAGE_CHUNK": {
        const id = str(event.messageId) || state.openText || "text";
        if (state.openText !== id) {
          closeAll();
          ensureStarted();
          state.openText = id;
          out.push({ type: "text-start", id });
        }
        if (event.delta) {
          out.push({ type: "text-delta", id, delta: str(event.delta) });
        }
        break;
      }
      case "REASONING_MESSAGE_START":
      case "THINKING_TEXT_MESSAGE_START": {
        closeAll();
        ensureStarted();
        state.openReasoning = str(event.messageId) || "reasoning";
        out.push({ type: "reasoning-start", id: state.openReasoning });
        break;
      }
      case "REASONING_MESSAGE_CONTENT":
      case "THINKING_TEXT_MESSAGE_CONTENT":
      case "REASONING_MESSAGE_CHUNK": {
        const id = str(event.messageId) || state.openReasoning || "reasoning";
        if (state.openReasoning !== id) {
          closeAll();
          ensureStarted();
          state.openReasoning = id;
          out.push({ type: "reasoning-start", id });
        }
        if (event.delta) {
          out.push({ type: "reasoning-delta", id, delta: str(event.delta) });
        }
        break;
      }
      case "REASONING_MESSAGE_END":
      case "THINKING_TEXT_MESSAGE_END": {
        closeReasoning();
        break;
      }
      case "REASONING_START":
      case "REASONING_END":
      case "THINKING_START":
      case "THINKING_END": {
        // Grouping events - the message events inside carry the content
        break;
      }
      case "TOOL_CALL_START": {
        closeAll();
        startToolCall(str(event.toolCallId), str(event.toolCallName) || str(event.toolName));
        break;
      }
      case "TOOL_CALL_ARGS": {
        appendToolArgs(str(event.toolCallId), str(event.delta));
        break;
      }
      case "TOOL_CALL_END": {
        const toolCallId = str(event.toolCallId);
        // TanStack AI repeats the final arguments on the end event: `args` is the raw JSON, `input` the parsed value.
        // Adapters that don't stream arguments (provider-executed tools) send them only here.
        const tanstack = getTanstackMetadata(event);
        const input = [event.input, tanstack?.input, event.args, tanstack?.args].find(isRecord);
        const args = [event.args, tanstack?.args].find((value) => typeof value === "string");
        endToolCall(toolCallId, { ...(input !== undefined && { input }), ...(args !== undefined && { args }) });
        if (state.openToolCall === toolCallId) {
          state.openToolCall = null;
        }
        break;
      }
      case "TOOL_CALL_CHUNK": {
        const toolCallId = str(event.toolCallId) || state.openToolCall;
        if (!toolCallId) {
          break;
        }
        if (state.openToolCall !== toolCallId) {
          closeAll();
          startToolCall(toolCallId, str(event.toolCallName));
          state.openToolCall = toolCallId;
        }
        appendToolArgs(toolCallId, str(event.delta));
        break;
      }
      case "TOOL_CALL_RESULT": {
        const toolCallId = str(event.toolCallId);
        closeToolCallChunk();
        endToolCall(toolCallId);
        const output = parseToolContent(event.content);
        // TanStack AI marks failed, cancelled and denied tool calls in the metadata of the result
        const tanstack = getTanstackMetadata(event);
        const outcome = tanstack?.toolResultOutcome;
        if (outcome === "denied") {
          out.push({ type: "tool-output-denied", toolCallId });
        } else if (event.state === "output-error" || tanstack?.state === "output-error" || outcome === "cancelled") {
          out.push({ type: "tool-output-error", toolCallId, errorText: getToolErrorText(output) });
        } else {
          out.push({ type: "tool-output-available", toolCallId, output });
        }
        break;
      }
      case "STATE_SNAPSHOT": {
        out.push({ type: "state-snapshot", state: event.snapshot });
        break;
      }
      case "STATE_DELTA": {
        out.push({ type: "state-delta", patch: (event.delta ?? []) as JSONPatchOperationType[] });
        break;
      }
      case "MESSAGES_SNAPSHOT": {
        out.push({
          type: "messages-snapshot",
          messages: fromAGUIMessages((event.messages ?? []) as AGUIMessageType[]),
        });
        break;
      }
      case "ACTIVITY_SNAPSHOT": {
        ensureStarted();
        out.push({
          type: "data",
          name: "activity",
          id: str(event.messageId),
          data: { activityType: event.activityType, content: event.content },
        });
        break;
      }
      case "ACTIVITY_DELTA": {
        const patch = ((event.patch ?? []) as JSONPatchOperationType[]).map((operation) => ({
          ...operation,
          path: `/content${operation.path}`,
          ...("from" in operation && { from: `/content${operation.from}` }),
        })) as JSONPatchOperationType[];
        out.push({ type: "data-patch", name: "activity", id: str(event.messageId), patch });
        break;
      }
      case "CUSTOM": {
        out.push({ type: "data", name: str(event.name), data: event.value, transient: true });
        break;
      }
      case "RUN_FINISHED": {
        closeAll();
        endOpenToolCalls();
        state.finished = state.started;
        const usage = sumUsage(event.usage);
        if (usage) {
          out.push({ type: "usage", usage });
        }
        const outcome = event.outcome as { type?: string; interrupts?: unknown } | undefined;
        if (outcome?.type === "interrupt") {
          handleInterrupts(outcome.interrupts);
        }
        const tanstackReason = event.finishReason ?? getTanstackMetadata(event)?.finishReason;
        let finishReason: ChatFinishReasonType = "stop";
        if (typeof tanstackReason === "string") {
          finishReason = TANSTACK_FINISH_REASONS[tanstackReason] ?? "other";
        } else if (outcome?.type === "interrupt") {
          finishReason = "tool-calls";
        } else if (outcome?.type === "cancelled") {
          finishReason = "interrupted";
        }
        out.push({ type: "finish", finishReason });
        break;
      }
      case "RUN_ERROR": {
        closeAll();
        const usage = sumUsage(event.usage);
        if (usage) {
          out.push({ type: "usage", usage });
        }
        out.push({ type: "error", errorText: str(event.message) || "Run failed" });
        break;
      }
      default: {
        out.push({ type: "raw", protocol: "ag-ui", value: event });
      }
    }

    return [...out];
  };

  /** Close whatever is still open, e.g. when the stream ends without `RUN_FINISHED`. */
  const end = (): ChatStreamEventType[] => {
    out.length = 0;
    closeAll();
    return [...out];
  };

  const reset = () => {
    state.toolCalls.clear();
    state.openText = null;
    state.openReasoning = null;
    state.openToolCall = null;
    state.started = false;
    state.finished = false;
  };

  return { map, end, reset };
};

const unwrapDurableEnvelope = (value: unknown): AGUIEventType => {
  // TanStack AI durable NDJSON wraps events as {"id":"<offset>","chunk":{...}}
  if (value && typeof value === "object" && "chunk" in value && !("type" in value)) {
    return (value as { chunk: AGUIEventType }).chunk;
  }
  return value as AGUIEventType;
};

/** Decoder for AG-UI events framed as SSE or NDJSON (auto-detected by default). */
export const createAGUIDecoder = (
  emit: (event: ChatStreamEventType) => void,
  framing: AGUIFramingType = "auto",
): StreamParserType => {
  const mapper = createAGUIEventMapper();

  const handleEvent = (value: unknown) => {
    mapper.map(unwrapDurableEnvelope(value)).forEach(emit);
  };

  const handleSSEData = (data: string) => {
    if (!data || data === "[DONE]") {
      return;
    }
    let value: unknown;
    try {
      value = JSON.parse(data);
    } catch (error) {
      throw new Error(`Invalid AG-UI event: ${data.slice(0, 200)}`, { cause: error });
    }
    handleEvent(value);
  };

  const sse = createSSEParser({ onEvent: ({ data }) => handleSSEData(data) });
  const ndjson = createNDJSONParser({ onValue: handleEvent });

  let detected: "sse" | "ndjson" | null = framing === "auto" ? null : framing;
  let buffered = "";

  const parser = () => (detected === "ndjson" ? ndjson : sse);

  return {
    feed: (text) => {
      if (detected) {
        parser().feed(text);
        return;
      }
      buffered += text;
      const trimmed = buffered.trimStart();
      if (!trimmed) {
        return;
      }
      detected = trimmed.startsWith("{") ? "ndjson" : "sse";
      const pending = buffered;
      buffered = "";
      parser().feed(pending);
    },
    flush: () => {
      if (!detected && buffered.trim()) {
        detected = buffered.trimStart().startsWith("{") ? "ndjson" : "sse";
        parser().feed(buffered);
        buffered = "";
      }
      if (detected) {
        parser().flush();
      }
      mapper.end().forEach(emit);
    },
    reset: () => {
      buffered = "";
      detected = framing === "auto" ? null : framing;
      sse.reset();
      ndjson.reset();
      mapper.reset();
    },
  };
};

const resolveContext = (context: AGUIProtocolOptionsType["context"]) =>
  (typeof context === "function" ? context() : context) ?? [];

/** Build an AG-UI `RunAgentInput` from the chat request context. */
export const createRunAgentInput = (
  context: ChatPrepareRequestContextType,
  options: Pick<AGUIProtocolOptionsType, "context"> = {},
) => ({
  threadId: context.chatId,
  runId: context.runId,
  ...(context.parentRunId !== undefined && { parentRunId: context.parentRunId }),
  state: context.state ?? {},
  messages: toAGUIMessages(context.messages),
  tools: context.tools,
  context: resolveContext(options.context),
  forwardedProps: context.body,
  ...(context.resume.length > 0 && { resume: context.resume }),
});

/**
 * AG-UI protocol (https://docs.ag-ui.com) - POSTs a `RunAgentInput` and decodes AG-UI events. Works with any AG-UI
 * backend: LangGraph, Mastra, CrewAI, Pydantic AI, ...
 */
export const aguiProtocol = (options: AGUIProtocolOptionsType = {}): ChatProtocolType => ({
  name: "ag-ui",
  prepareRequest: (context) => {
    const headers = { Accept: "text/event-stream" };
    if (context.trigger === "resume-stream") {
      return { payload: undefined, headers };
    }
    const defaultBody = createRunAgentInput(context, options);
    return {
      payload: options.prepareBody ? options.prepareBody({ ...context, defaultBody }) : defaultBody,
      headers,
    };
  },
  createDecoder: (emit) => createAGUIDecoder(emit, options.framing),
});

/**
 * TanStack AI protocol (`@tanstack/ai` 1.x `toServerSentEventsResponse` / `toHttpResponse`). TanStack AI speaks AG-UI
 * on the wire; this adds its conventions - the `X-Run-Id` header, approval and client tool interrupts answered with
 * `resume` entries, and `metadata.tanstack` finish reasons.
 */
export const tanstackAIProtocol = (options: AGUIProtocolOptionsType = {}): ChatProtocolType => ({
  name: "tanstack-ai",
  prepareRequest: (context) => {
    const headers = { "X-Run-Id": context.runId };
    if (context.trigger === "resume-stream") {
      return { payload: undefined, headers };
    }
    const defaultBody = createRunAgentInput(context, options);
    return {
      payload: options.prepareBody ? options.prepareBody({ ...context, defaultBody }) : defaultBody,
      headers,
    };
  },
  createDecoder: (emit) => createAGUIDecoder(emit, options.framing),
});
