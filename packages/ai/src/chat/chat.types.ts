import type { JSONPatchOperationType } from "../utils/json-patch";
import type { DeepPartial } from "../utils/types";

/* -------------------------------------------------------------------------------------------------
 * Chat types - one definition that flows through messages, parts, callbacks and hooks
 * -----------------------------------------------------------------------------------------------*/

/** Input and output types of every tool the backend (or the client) can call, keyed by tool name. */
export type ChatToolTypes = Record<string, { input: unknown; output: unknown }>;

/**
 * Describes everything that is specific to one chat backend. Every key is optional - leave it out and the chat falls
 * back to `unknown` for it. Derive it from your backend types with `InferAISDKChatTypes` or `InferChatTools` to get
 * end-to-end type safety.
 *
 * @example
 * type MyChat = {
 *   metadata: { createdAt: number; model: string };
 *   data: { weather: { city: string; temperature: number } };
 *   tools: { getWeather: { input: { city: string }; output: { temperature: number } } };
 *   state: { step: "research" | "write" };
 * };
 */
export type ChatTypes = {
  metadata?: unknown;
  data?: Record<string, unknown>;
  tools?: ChatToolTypes;
  state?: unknown;
};

export type ChatMetadataType<T extends ChatTypes> = T extends { metadata: infer Metadata } ? Metadata : unknown;
export type ChatDataType<T extends ChatTypes> = T extends { data: infer Data extends Record<string, unknown> }
  ? Data
  : Record<string, unknown>;
export type ChatToolsType<T extends ChatTypes> = T extends { tools: infer Tools extends ChatToolTypes }
  ? Tools
  : ChatToolTypes;
export type ChatStateType<T extends ChatTypes> = T extends { state: infer State } ? State : unknown;

export type ChatToolNameType<T extends ChatTypes> = keyof ChatToolsType<T> & string;
export type ChatToolInputType<T extends ChatTypes, Name extends ChatToolNameType<T>> = ChatToolsType<T>[Name]["input"];
export type ChatToolOutputType<
  T extends ChatTypes,
  Name extends ChatToolNameType<T>,
> = ChatToolsType<T>[Name]["output"];
export type ChatDataNameType<T extends ChatTypes> = keyof ChatDataType<T> & string;

/* -------------------------------------------------------------------------------------------------
 * Message parts
 * -----------------------------------------------------------------------------------------------*/

export type ChatPartStateType = "streaming" | "done";

export type ChatTextPartType = {
  type: "text";
  id: string;
  text: string;
  state: ChatPartStateType;
};

export type ChatReasoningPartType = {
  type: "reasoning";
  id: string;
  text: string;
  state: ChatPartStateType;
};

export type ChatSourcePartType = {
  type: "source";
  sourceId: string;
  sourceType: "url" | "document";
  url?: string;
  title?: string;
  mediaType?: string;
  filename?: string;
};

export type ChatFilePartType = {
  type: "file";
  url: string;
  mediaType: string;
  filename?: string;
};

/** Marks the beginning of a new step (one model call) inside an assistant message. */
export type ChatStepStartPartType = {
  type: "step-start";
};

export type ChatDataPartType<T extends ChatTypes = ChatTypes> = {
  [Name in ChatDataNameType<T>]: {
    type: "data";
    name: Name;
    id?: string;
    data: ChatDataType<T>[Name];
  };
}[ChatDataNameType<T>];

export type ChatToolApprovalType = {
  /** Approval id to answer with `addToolApprovalResponse` */
  id: string;
  /** Why the backend asks for approval */
  reason?: string;
  approved?: boolean;
  /** Reason given together with the approval response */
  responseReason?: string;
};

export type ChatToolPartStateType =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

type ToolPartBaseType<Name extends string> = {
  type: "tool";
  toolName: Name;
  toolCallId: string;
  /** The tool was executed by the backend/provider, not by the client */
  providerExecuted?: boolean;
  /** The tool is not known up front (e.g. MCP tools) */
  dynamic?: boolean;
  title?: string;
  /** Protocol-specific id the backend waits on to resume (TanStack AI / AG-UI interrupts) */
  interruptId?: string;
};

/** A tool call part. Narrow with `part.toolName` and `part.state` to get typed `input` and `output`. */
export type ChatToolPartByNameType<Name extends string, Input, Output> = ToolPartBaseType<Name> &
  (
    | { state: "input-streaming"; input: DeepPartial<Input> | undefined; rawInput?: string }
    | { state: "input-available"; input: Input }
    | { state: "approval-requested"; input: Input; approval: ChatToolApprovalType }
    | { state: "approval-responded"; input: Input; approval: ChatToolApprovalType & { approved: boolean } }
    | {
        state: "output-available";
        input: Input;
        output: Output;
        preliminary?: boolean;
        approval?: ChatToolApprovalType;
      }
    | {
        state: "output-error";
        input: Input | undefined;
        rawInput?: string;
        errorText: string;
        approval?: ChatToolApprovalType;
      }
    | { state: "output-denied"; input: Input; approval: ChatToolApprovalType & { approved: false } }
  );

export type ChatToolPartType<T extends ChatTypes = ChatTypes> = {
  [Name in ChatToolNameType<T>]: ChatToolPartByNameType<Name, ChatToolInputType<T, Name>, ChatToolOutputType<T, Name>>;
}[ChatToolNameType<T>];

export type ChatPartType<T extends ChatTypes = ChatTypes> =
  | ChatTextPartType
  | ChatReasoningPartType
  | ChatSourcePartType
  | ChatFilePartType
  | ChatStepStartPartType
  | ChatDataPartType<T>
  | ChatToolPartType<T>;

export type ChatRoleType = "system" | "user" | "assistant";

export type ChatMessageType<T extends ChatTypes = ChatTypes> = {
  id: string;
  role: ChatRoleType;
  metadata?: ChatMetadataType<T>;
  parts: ChatPartType<T>[];
};

/* -------------------------------------------------------------------------------------------------
 * Normalized stream events - every protocol decodes its wire format into these
 * -----------------------------------------------------------------------------------------------*/

export type ChatFinishReasonType =
  | "stop"
  | "length"
  | "content-filter"
  | "tool-calls"
  | "error"
  | "interrupted"
  | "other"
  | "unknown";

export type ChatUsageType = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
};

/** A run paused by the backend, waiting for the client (AG-UI interrupts). */
export type ChatInterruptType = {
  id: string;
  reason: string;
  message?: string;
  toolCallId?: string;
  responseSchema?: unknown;
  metadata?: Record<string, unknown>;
};

export type ChatStreamEventType =
  | { type: "message-start"; messageId?: string; metadata?: unknown }
  | { type: "message-metadata"; metadata: unknown }
  | { type: "run-start"; threadId?: string; runId?: string }
  | { type: "step-start" }
  | { type: "step-finish" }
  /** Drop every part added since the last step start (AI SDK `reset-step`) */
  | { type: "step-reset" }
  | { type: "text-start"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "text-end"; id: string }
  | { type: "reasoning-start"; id: string }
  | { type: "reasoning-delta"; id: string; delta: string }
  | { type: "reasoning-end"; id: string }
  | {
      type: "tool-input-start";
      toolCallId: string;
      toolName: string;
      providerExecuted?: boolean;
      dynamic?: boolean;
      title?: string;
    }
  | { type: "tool-input-delta"; toolCallId: string; delta: string }
  | {
      type: "tool-input-available";
      toolCallId: string;
      toolName: string;
      input: unknown;
      providerExecuted?: boolean;
      dynamic?: boolean;
      title?: string;
    }
  | { type: "tool-input-error"; toolCallId: string; toolName: string; input: unknown; errorText: string }
  | { type: "tool-approval-request"; toolCallId: string; approvalId: string; reason?: string; interruptId?: string }
  | { type: "tool-approval-response"; approvalId: string; approved: boolean; reason?: string }
  | { type: "tool-output-available"; toolCallId: string; output: unknown; preliminary?: boolean }
  | { type: "tool-output-error"; toolCallId: string; errorText: string }
  | { type: "tool-output-denied"; toolCallId: string }
  /** The backend waits for the client to execute this tool (TanStack AI client tools) */
  | { type: "tool-client-execution"; toolCallId: string; interruptId?: string }
  | (Omit<ChatSourcePartType, "type"> & { type: "source" })
  | (Omit<ChatFilePartType, "type"> & { type: "file" })
  | { type: "data"; name: string; id?: string; data: unknown; transient?: boolean }
  | { type: "data-patch"; name: string; id: string; patch: JSONPatchOperationType[] }
  | { type: "state-snapshot"; state: unknown }
  | { type: "state-delta"; patch: JSONPatchOperationType[] }
  | { type: "messages-snapshot"; messages: ChatMessageType[] }
  | { type: "interrupt"; interrupts: ChatInterruptType[] }
  | { type: "usage"; usage: ChatUsageType }
  | { type: "finish"; finishReason?: ChatFinishReasonType; metadata?: unknown }
  | { type: "error"; errorText: string }
  | { type: "abort"; reason?: string }
  /** Anything a protocol understands but has no normalized event for, e.g. AG-UI `RAW` or AI SDK `custom` */
  | { type: "raw"; protocol: string; value: unknown };

export type ChatStreamEventByType<Type extends ChatStreamEventType["type"]> = Extract<
  ChatStreamEventType,
  { type: Type }
>;

/* -------------------------------------------------------------------------------------------------
 * Typed callback payloads
 * -----------------------------------------------------------------------------------------------*/

/** A tool call the client should handle, discriminated by `toolName`. */
export type ChatToolCallType<T extends ChatTypes = ChatTypes> = {
  [Name in ChatToolNameType<T>]: {
    toolName: Name;
    toolCallId: string;
    input: ChatToolInputType<T, Name>;
    dynamic?: boolean;
  };
}[ChatToolNameType<T>];

/** Result of a client tool, for `addToolResult`. */
export type ChatToolResultType<T extends ChatTypes = ChatTypes> = {
  [Name in ChatToolNameType<T>]:
    | { tool: Name; toolCallId: string; output: ChatToolOutputType<T, Name> }
    | { tool: Name; toolCallId: string; state: "output-error"; errorText: string };
}[ChatToolNameType<T>];

/** A data part as delivered to `onData`, discriminated by `name`. Transient parts are not stored in messages. */
export type ChatDataEventType<T extends ChatTypes = ChatTypes> = {
  [Name in ChatDataNameType<T>]: { name: Name; id?: string; data: ChatDataType<T>[Name]; transient?: boolean };
}[ChatDataNameType<T>];
