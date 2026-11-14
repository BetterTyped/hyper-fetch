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

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Shallow-merge object metadata, replace anything else. */
export const mergeMetadata = (current: unknown, next: unknown): unknown => {
  if (next === undefined) {
    return current;
  }
  if (isObject(current) && isObject(next)) {
    return { ...current, ...next };
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

  private replacePart(index: number, part: ChatPartType) {
    const parts = [...this.message.parts];
    parts[index] = part;
    this.setParts(parts);
  }

  private pushPart(part: ChatPartType) {
    this.setParts([...this.message.parts, part]);
  }

  private updateTool(toolCallId: string, update: (part: AnyToolPart) => Record<string, unknown>): boolean {
    const index = this.findTool(toolCallId);
    if (index === -1) {
      return false;
    }
    const part = this.message.parts[index] as AnyToolPart;
    this.replacePart(index, update(part) as unknown as ChatPartType);
    return true;
  }

  private appendText(type: "text" | "reasoning", id: string, delta: string) {
    const index = this.findIndex((part) => part.type === type && part.id === id);
    if (index === -1) {
      this.pushPart({ type, id, text: delta, state: "streaming" });
      return;
    }
    const part = this.message.parts[index] as ChatTextPartType | ChatReasoningPartType;
    this.replacePart(index, { ...part, text: part.text + delta });
  }

  private endText(type: "text" | "reasoning", id: string): boolean {
    const index = this.findIndex((part) => part.type === type && part.id === id);
    if (index === -1) {
      return false;
    }
    const part = this.message.parts[index] as ChatTextPartType | ChatReasoningPartType;
    if (part.state === "done") {
      return false;
    }
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
        if (event.metadata === undefined) {
          return false;
        }
        this.message = { ...this.message, metadata: mergeMetadata(this.message.metadata, event.metadata) };
        return true;
      }
      case "step-start": {
        this.stepStartIndex = this.message.parts.length;
        this.pushPart({ type: "step-start" });
        return true;
      }
      case "step-reset": {
        if (this.message.parts.length === this.stepStartIndex) {
          return false;
        }
        this.setParts(this.message.parts.slice(0, this.stepStartIndex));
        return true;
      }
      case "text-start":
      case "reasoning-start": {
        const type = event.type === "text-start" ? "text" : "reasoning";
        if (this.findIndex((part) => part.type === type && part.id === event.id) !== -1) {
          return false;
        }
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
        if (this.findTool(event.toolCallId) !== -1) {
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
        return this.updateTool(event.toolCallId, (part) =>
          part.state === "input-streaming" ? { ...part, rawInput: raw, input: parsePartialJSON(raw).value } : part,
        );
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
        const updated = this.updateTool(event.toolCallId, (part) => {
          const { rawInput: _rawInput, ...rest } = part as AnyToolPart & { rawInput?: string };
          return { ...rest, ...next };
        });
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
        const updated = this.updateTool(event.toolCallId, (part) => ({ ...part, ...next }));
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
        return this.updateTool(event.toolCallId, (part) => {
          const {
            errorText: _errorText,
            rawInput: _rawInput,
            preliminary: _preliminary,
            ...rest
          } = part as AnyToolPart & {
            errorText?: string;
            rawInput?: string;
            preliminary?: boolean;
          };
          return {
            ...rest,
            state: "output-available",
            output: event.output,
            ...(event.preliminary && { preliminary: true }),
          };
        });
      }
      case "tool-output-error": {
        return this.updateTool(event.toolCallId, (part) => ({
          ...part,
          state: "output-error",
          errorText: event.errorText,
        }));
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
