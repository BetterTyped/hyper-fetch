import type { StreamParserType } from "@hyper-fetch/core";

import type { ChatMessageType, ChatStreamEventType } from "../chat/chat.types";
import type { JSONSchemaType } from "../schema/standard-schema.types";

export type ChatRequestTriggerType = "submit-message" | "regenerate-message" | "resume-stream";

/** A client-side tool, described to backends that accept tool definitions from the client (AG-UI). */
export type ChatClientToolDefinitionType = {
  name: string;
  description?: string;
  parameters?: JSONSchemaType;
};

/** An answer to a backend interrupt (AG-UI `RunAgentInput.resume`). */
export type ChatResumeEntryType = {
  interruptId: string;
  status: "resolved" | "cancelled";
  payload?: unknown;
  metadata?: Record<string, unknown>;
};

export type ChatPrepareRequestContextType = {
  /** Stable id of the chat (AI SDK `id`, AG-UI `threadId`) */
  chatId: string;
  /** Unique id of this request (AG-UI `runId`) */
  runId: string;
  /** Id of the previous request, when there was one */
  parentRunId?: string;
  messages: ChatMessageType[];
  trigger: ChatRequestTriggerType;
  /** Message being regenerated */
  messageId?: string;
  /** Extra body fields from the chat options and the current call */
  body: Record<string, unknown>;
  /** Shared agent state (AG-UI) */
  state: unknown;
  /** Client tools the backend may call */
  tools: ChatClientToolDefinitionType[];
  /** Interrupts answered since the last request */
  resume: ChatResumeEntryType[];
};

export type ChatPreparedRequestType = {
  /** Request body. `undefined` sends no body (e.g. resuming a stream with GET). */
  payload: unknown;
  /** Headers added to this request only */
  headers?: Record<string, string>;
};

/**
 * Connects the chat to one backend wire format: builds the request body from the chat state and decodes the streamed
 * response into normalized {@link ChatStreamEventType} events.
 */
export type ChatProtocolType = {
  name: string;
  prepareRequest: (context: ChatPrepareRequestContextType) => ChatPreparedRequestType;
  createDecoder: (emit: (event: ChatStreamEventType) => void) => StreamParserType;
};
