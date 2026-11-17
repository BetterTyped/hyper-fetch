import { applyJSONPatch } from "../utils/json-patch";
import { parsePartialJSON } from "../utils/partial-json";
import type {
  ChatDataPartType,
  ChatMessageType,
  ChatPartType,
  ChatReasoningPartType,
  ChatStreamEventType,
  ChatTextPartType,
  ChatToolPartType,
} from "./chat.types";

type AnyToolPart = ChatToolPartType & Record<string, unknown>;

/** A tool part without what its previous state left behind: the streamed raw input and an earlier result. */
const withoutResult = (part: AnyToolPart): Record<string, unknown> => {
  const {
    rawInput: _rawInput,
    output: _output,
    errorText: _errorText,
    preliminary: _preliminary,
    ...rest
  } = part as AnyToolPart & { rawInput?: string; output?: unknown; errorText?: string; preliminary?: boolean };
  return rest;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const mergeObjects = (current: Record<string, unknown>, next: Record<string, unknown>): Record<string, unknown> => {
  const result = { ...current };
  Object.keys(next).forEach((key) => {
    const value = next[key];
    if (value === undefined || UNSAFE_KEYS.has(key)) {
      return;
    }
    const previous = result[key];
    result[key] = isObject(previous) && isObject(value) ? mergeObjects(previous, value) : value;
  });
  return result;
};

/**
 * Merge message metadata like AI SDK does: objects are merged deeply (arrays and other values are replaced), a
 * missing (`undefined` or `null`) update keeps the current metadata, anything else replaces it.
 */
export const mergeMetadata = (current: unknown, next: unknown): unknown => {
  if (next === undefined || next === null) {
    return current;
  }
  if (isObject(current) && isObject(next)) {
    return mergeObjects(current, next);
  }
  return next;
};

/**
 * Builds one assistant message from normalized stream events. Every change produces a new message object and a new
 * parts array, while untouched parts keep their identity - so React can skip re-rendering them.
 */
export class ChatMessageBuilder {
  message: ChatMessageType;

  private rawToolInputs = new Map<string, string>();
  /** Index of the first part of the current step - what `step-reset` drops */
  private stepStartIndex = 0;

  constructor(message: ChatMessageType) {
    this.message = message;
    this.stepStartIndex = message.parts.length;
  }

  /** Continue building on another version of the message (e.g. reconciled with a snapshot), keeping stream state. */
  rebase(message: ChatMessageType) {
    this.message = message;
    this.stepStartIndex = Math.min(this.stepStartIndex, message.parts.length);
  }

  private setParts(parts: ChatPartType[]) {
    this.message = { ...this.message, parts };
  }

  private findIndex(predicate: (part: ChatPartType) => boolean): number {
    const { parts } = this.message;
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      if (predicate(parts[i])) {
        return i;
      }
    }
    return -1;
  }

  private findTool(toolCallId: string): number {
    return this.findIndex((part) => part.type === "tool" && part.toolCallId === toolCallId);
  }

  /**
   * The tool call that input events (`tool-input-*`) for this id belong to: one of the current step, or one of an
   * earlier step that still waits for its result. A finished call of an earlier step is never reopened - some
   * providers reuse tool call ids in every step, and AI SDK treats those as separate calls.
   */
  private findOpenTool(toolCallId: string): number {
    const index = this.findTool(toolCallId);
    if (index === -1) {
      return -1;
    }
    const { parts } = this.message;
    const isCurrentStep = !parts.slice(index + 1).some((part) => part.type === "step-start");
    const { state } = parts[index] as ChatToolPartType;
    const isFinished = state === "output-available" || state === "output-error" || state === "output-denied";
    return isCurrentStep || !isFinished ? index : -1;
  }

  private replacePart(index: number, part: ChatPartType) {
    const parts = [...this.message.parts];
    parts[index] = part;
    this.setParts(parts);
  }

  private pushPart(part: ChatPartType) {
    this.setParts([...this.message.parts, part]);
  }

  private updateTool(toolCallId: string, update: (part: AnyToolPart) => Record<string, unknown>): boolean {
    return this.updateToolAt(this.findTool(toolCallId), update);
  }

  private updateToolAt(index: number, update: (part: AnyToolPart) => Record<string, unknown>): boolean {
    if (index === -1) {
      return false;
    }
    const part = this.message.parts[index] as AnyToolPart;
    this.replacePart(index, update(part) as unknown as ChatPartType);
    return true;
  }

  /**
   * The text or reasoning part that is still streaming for this id. Ids are only unique while a part is open -
   * providers reuse them in every step (e.g. "0") - so a finished part with the same id is never continued.
   */
  private findStreaming(type: "text" | "reasoning", id: string): number {
    const index = this.findIndex((part) => part.type === type && part.id === id);
    if (index === -1) {
      return -1;
    }
    return (this.message.parts[index] as ChatTextPartType | ChatReasoningPartType).state === "streaming" ? index : -1;
  }

  private appendText(type: "text" | "reasoning", id: string, delta: string) {
    const index = this.findStreaming(type, id);
    if (index === -1) {
      // A delta without a start (or after the part was dropped by a step reset) opens a new part
      this.pushPart({ type, id, text: delta, state: "streaming" });
      return;
    }
    const part = this.message.parts[index] as ChatTextPartType | ChatReasoningPartType;
    this.replacePart(index, { ...part, text: part.text + delta });
  }

  private endText(type: "text" | "reasoning", id: string): boolean {
    const index = this.findStreaming(type, id);
    if (index === -1) {
      return false;
    }
    const part = this.message.parts[index] as ChatTextPartType | ChatReasoningPartType;
    this.replacePart(index, { ...part, state: "done" });
    return true;
  }

  /**
   * Apply one event. Returns `true` when the message changed. Events that don't belong to the message (state, usage,
   * finish, ...) are ignored here and handled by the chat.
   */
  apply(event: ChatStreamEventType): boolean {
    switch (event.type) {
      case "message-start": {
        if (event.messageId === undefined && event.metadata === undefined) {
          return false;
        }
        this.message = {
          ...this.message,
          id: event.messageId ?? this.message.id,
          metadata: mergeMetadata(this.message.metadata, event.metadata),
        };
        return true;
      }
      case "message-metadata":
      case "finish": {
        const metadata = mergeMetadata(this.message.metadata, event.metadata);
        if (metadata === this.message.metadata) {
          return false;
        }
        this.message = { ...this.message, metadata };
        return true;
      }
      case "step-start": {
        this.pushPart({ type: "step-start" });
        // The step boundary itself survives a reset - only what the step produced is dropped
        this.stepStartIndex = this.message.parts.length;
        return true;
      }
      case "step-reset": {
        // Half-streamed tool inputs of the dropped step must not leak into the retried one
        this.rawToolInputs.clear();
        if (this.message.parts.length <= this.stepStartIndex) {
          return false;
        }
        this.setParts(this.message.parts.slice(0, this.stepStartIndex));
        return true;
      }
      case "text-start":
      case "reasoning-start": {
        const type = event.type === "text-start" ? "text" : "reasoning";
        // A start always opens a new part, even when the id was used before (providers reuse ids in every step)
        this.pushPart({ type, id: event.id, text: "", state: "streaming" });
        return true;
      }
      case "text-delta": {
        this.appendText("text", event.id, event.delta);
        return true;
      }
      case "reasoning-delta": {
        this.appendText("reasoning", event.id, event.delta);
        return true;
      }
      case "text-end": {
        return this.endText("text", event.id);
      }
      case "reasoning-end": {
        return this.endText("reasoning", event.id);
      }
      case "tool-input-start": {
        if (this.findOpenTool(event.toolCallId) !== -1) {
          return false;
        }
        this.rawToolInputs.set(event.toolCallId, "");
        this.pushPart({
          type: "tool",
          toolName: event.toolName,
          toolCallId: event.toolCallId,
          state: "input-streaming",
          input: undefined,
          ...(event.providerExecuted !== undefined && { providerExecuted: event.providerExecuted }),
          ...(event.dynamic !== undefined && { dynamic: event.dynamic }),
          ...(event.title !== undefined && { title: event.title }),
        } as ChatPartType);
        return true;
      }
      case "tool-input-delta": {
        const raw = (this.rawToolInputs.get(event.toolCallId) ?? "") + event.delta;
        this.rawToolInputs.set(event.toolCallId, raw);
        const index = this.findOpenTool(event.toolCallId);
        if (index === -1 || (this.message.parts[index] as ChatToolPartType).state !== "input-streaming") {
          return false;
        }
        return this.updateToolAt(index, (part) => ({ ...part, rawInput: raw, input: parsePartialJSON(raw).value }));
      }
      case "tool-input-available": {
        this.rawToolInputs.delete(event.toolCallId);
        const next = {
          type: "tool",
          toolName: event.toolName,
          toolCallId: event.toolCallId,
          state: "input-available",
          input: event.input,
          ...(event.providerExecuted !== undefined && { providerExecuted: event.providerExecuted }),
          ...(event.dynamic !== undefined && { dynamic: event.dynamic }),
          ...(event.title !== undefined && { title: event.title }),
        };
        const updated = this.updateToolAt(this.findOpenTool(event.toolCallId), (part) => ({
          ...withoutResult(part),
          ...next,
        }));
        if (!updated) {
          this.pushPart(next as ChatPartType);
        }
        return true;
      }
      case "tool-input-error": {
        this.rawToolInputs.delete(event.toolCallId);
        const next = {
          type: "tool",
          toolName: event.toolName,
          toolCallId: event.toolCallId,
          state: "output-error",
          input: event.input,
          errorText: event.errorText,
        };
        const updated = this.updateToolAt(this.findOpenTool(event.toolCallId), (part) => ({
          ...withoutResult(part),
          ...next,
        }));
        if (!updated) {
          this.pushPart(next as ChatPartType);
        }
        return true;
      }
      case "tool-approval-request": {
        return this.updateTool(event.toolCallId, (part) => ({
          ...part,
          state: "approval-requested",
          approval: { id: event.approvalId, ...(event.reason !== undefined && { reason: event.reason }) },
          ...(event.interruptId !== undefined && { interruptId: event.interruptId }),
        }));
      }
      case "tool-approval-response": {
        const index = this.findIndex(
          (part) =>
            part.type === "tool" &&
            (part as AnyToolPart & { approval?: { id: string } }).approval?.id === event.approvalId,
        );
        if (index === -1) {
          return false;
        }
        const part = this.message.parts[index] as AnyToolPart & { approval: Record<string, unknown> };
        this.replacePart(index, {
          ...part,
          state: "approval-responded",
          approval: {
            ...part.approval,
            approved: event.approved,
            ...(event.reason !== undefined && { responseReason: event.reason }),
          },
        } as unknown as ChatPartType);
        return true;
      }
      case "tool-output-available": {
        return this.updateTool(event.toolCallId, (part) => ({
          ...withoutResult(part),
          state: "output-available",
          output: event.output,
          ...(event.preliminary && { preliminary: true }),
        }));
      }
      case "tool-output-error": {
        return this.updateTool(event.toolCallId, (part) => {
          // A preliminary output is replaced by the error - AI SDK rejects error parts that still carry an output
          const {
            output: _output,
            preliminary: _preliminary,
            ...rest
          } = part as AnyToolPart & {
            output?: unknown;
            preliminary?: boolean;
          };
          return { ...rest, state: "output-error", errorText: event.errorText };
        });
      }
      case "tool-output-denied": {
        return this.updateTool(event.toolCallId, (part) => ({
          ...part,
          state: "output-denied",
          approval: { ...((part as { approval?: object }).approval ?? { id: event.toolCallId }), approved: false },
        }));
      }
      case "tool-client-execution": {
        if (event.interruptId === undefined) {
          return false;
        }
        return this.updateTool(event.toolCallId, (part) => ({ ...part, interruptId: event.interruptId }));
      }
      case "source": {
        const { type: _type, ...source } = event;
        this.pushPart({ type: "source", ...source });
        return true;
      }
      case "file": {
        const { type: _type, ...file } = event;
        this.pushPart({ type: "file", ...file });
        return true;
      }
      case "data": {
        if (event.transient) {
          return false;
        }
        const part = {
          type: "data",
          name: event.name,
          ...(event.id !== undefined && { id: event.id }),
          data: event.data,
        } as ChatDataPartType;
        // Parts with the same name and id are reconciled (replaced) instead of appended
        const index =
          event.id === undefined
            ? -1
            : this.findIndex((item) => item.type === "data" && item.name === event.name && item.id === event.id);
        if (index === -1) {
          this.pushPart(part);
        } else {
          this.replacePart(index, part);
        }
        return true;
      }
      case "data-patch": {
        const index = this.findIndex(
          (item) => item.type === "data" && item.name === event.name && item.id === event.id,
        );
        if (index === -1) {
          return false;
        }
        const part = this.message.parts[index] as ChatDataPartType;
        this.replacePart(index, { ...part, data: applyJSONPatch(part.data, event.patch) });
        return true;
      }
      default: {
        return false;
      }
    }
  }

  /** Mark every streaming text and reasoning part as done (stream ended, aborted or failed). */
  finalize(): boolean {
    let changed = false;
    const parts = this.message.parts.map((part) => {
      if ((part.type === "text" || part.type === "reasoning") && part.state === "streaming") {
        changed = true;
        return { ...part, state: "done" as const };
      }
      return part;
    });
    if (changed) {
      this.setParts(parts);
    }
    return changed;
  }
}
