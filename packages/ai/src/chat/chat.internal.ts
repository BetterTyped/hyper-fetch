import type { ChatClientToolDefinitionType, ChatResumeEntryType } from "../protocols/protocol.types";
import { getJSONSchema, SchemaValidationError } from "../schema/standard-schema";
import type { StandardSchemaV1 } from "../schema/standard-schema.types";
import type { ChatClientToolType } from "./chat.options";
import type { ChatMessageType, ChatToolPartType, ChatUsageType } from "./chat.types";

/* -------------------------------------------------------------------------------------------------
 * Helpers of the Chat store - not part of the public API
 * -----------------------------------------------------------------------------------------------*/

export const findLastIndexById = (messages: { id: string }[], id: string) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].id === id) {
      return i;
    }
  }
  return -1;
};

export const findLastToolPart = (
  messages: ChatMessageType<any>[],
  toolCallId: string,
): ChatToolPartType | undefined => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const { parts } = messages[i];
    for (let j = parts.length - 1; j >= 0; j -= 1) {
      const part = parts[j];
      if (part.type === "tool" && part.toolCallId === toolCallId) {
        return part as ChatToolPartType;
      }
    }
  }
  return undefined;
};

/** Add up token counts reported in several parts. */
export const addUsage = (current: ChatUsageType | undefined, next: ChatUsageType): ChatUsageType => {
  const total: Record<string, unknown> = { ...current };
  Object.entries(next).forEach(([key, value]) => {
    const previous = total[key];
    total[key] = typeof value === "number" && typeof previous === "number" ? previous + value : value;
  });
  return total as ChatUsageType;
};

export const findToolCallIdByApproval = (messages: ChatMessageType<any>[], approvalId: string): string | undefined => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const part = messages[i].parts.find(
      (item) => item.type === "tool" && "approval" in item && item.approval?.id === approvalId,
    ) as ChatToolPartType | undefined;
    if (part) {
      return part.toolCallId;
    }
  }
  return undefined;
};

/**
 * Resume entries for tool interrupts answered since they were last sent (TanStack AI client tools, approvals). The
 * interrupts of the returned entries are added to `sentInterrupts`.
 */
export const collectResumeEntries = (
  messages: ChatMessageType<any>[],
  sentInterrupts: Set<string>,
): ChatResumeEntryType[] => {
  const entries: ChatResumeEntryType[] = [];
  messages.forEach((message) => {
    message.parts.forEach((item) => {
      if (item.type !== "tool") {
        return;
      }
      const part = item as ChatToolPartType & {
        output?: unknown;
        errorText?: string;
        approval?: { approved?: boolean; responseReason?: string };
      };
      const { interruptId } = part;
      if (!interruptId || sentInterrupts.has(interruptId)) {
        return;
      }

      let entry: ChatResumeEntryType | null = null;
      if (part.state === "approval-responded" || part.state === "output-denied") {
        const approved = part.approval?.approved === true;
        const reason = part.approval?.responseReason;
        entry = { interruptId, status: "resolved", payload: reason === undefined ? approved : { approved, reason } };
      } else if (part.state === "output-available") {
        entry = { interruptId, status: "resolved", payload: part.output };
      } else if (part.state === "output-error") {
        entry = {
          interruptId,
          status: "resolved",
          payload: { error: part.errorText },
          metadata: { tanstack: { state: "output-error" } },
        };
      }
      if (entry) {
        sentInterrupts.add(interruptId);
        entries.push(entry);
      }
    });
  });
  return entries;
};

/** Describe the client tools to backends that accept tool definitions from the client (AG-UI). */
export const getClientToolDefinitions = (tools: object | undefined): ChatClientToolDefinitionType[] => {
  const entries = Object.entries((tools ?? {}) as Record<string, ChatClientToolType<unknown, unknown> | undefined>);
  return entries
    .filter((entry): entry is [string, ChatClientToolType<unknown, unknown>] => !!entry[1])
    .map(([name, tool]) => {
      // AG-UI requires both fields (TanStack AI rejects tools without a description)
      return {
        name,
        description: tool.description ?? "",
        parameters: tool.parameters ?? getJSONSchema(tool.inputSchema) ?? { type: "object", properties: {} },
      };
    });
};

/** Validate with a synchronous Standard Schema - stream events are handled synchronously, so async schemas fail. */
export const validateSync = <V>(
  schema: StandardSchemaV1<unknown, V> | undefined,
  value: unknown,
  context: string,
): { ok: true; value: V } | { ok: false; error: SchemaValidationError } => {
  if (!schema) {
    return { ok: true, value: value as V };
  }
  const result = schema["~standard"].validate(value);
  if (result instanceof Promise) {
    return {
      ok: false,
      error: new SchemaValidationError([{ message: "Async schemas are not supported here" }], value, context),
    };
  }
  if (result.issues) {
    return { ok: false, error: new SchemaValidationError(result.issues, value, context) };
  }
  return { ok: true, value: result.value };
};
