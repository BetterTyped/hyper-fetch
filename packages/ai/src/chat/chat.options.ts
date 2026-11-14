import type { ExtractErrorType, RequestInstance } from "@hyper-fetch/core";

import type { ChatProtocolType } from "../protocols/protocol.types";
import type { SchemaValidationError } from "../schema/standard-schema";
import type { JSONSchemaType, StandardSchemaV1 } from "../schema/standard-schema.types";
import type {
  ChatDataEventType,
  ChatDataNameType,
  ChatDataType,
  ChatFinishReasonType,
  ChatInterruptType,
  ChatMessageType,
  ChatMetadataType,
  ChatPartType,
  ChatStateType,
  ChatStreamEventType,
  ChatToolCallType,
  ChatToolInputType,
  ChatToolNameType,
  ChatToolOutputType,
  ChatTypes,
  ChatUsageType,
} from "./chat.types";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

/**
 * - `ready` - idle, a new message can be sent
 * - `submitted` - the request was sent, waiting for the first event
 * - `streaming` - events are arriving
 * - `error` - the last request failed, see `error`
 */
export type ChatStatusType = "ready" | "submitted" | "streaming" | "error";

/** Thrown into `chat.error` when the stream itself reports an error (AI SDK `error` chunk, AG-UI `RUN_ERROR`). */
export class ChatStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatStreamError";
  }
}

export type ChatErrorType<R extends RequestInstance = RequestInstance> =
  | ExtractErrorType<R>
  | ChatStreamError
  | SchemaValidationError
  | Error;

/** A tool the client executes itself. The input and output types come from the chat types. */
export type ChatClientToolType<Input, Output> = {
  description?: string;
  /** Validates the input before `execute` runs. Also used to describe the tool to AG-UI backends when possible. */
  inputSchema?: StandardSchemaV1<unknown, Input>;
  /** JSON Schema of the input, sent to AG-UI backends as the tool `parameters` */
  parameters?: JSONSchemaType;
  /** Runs the tool. The returned value becomes the tool output; a thrown error becomes `output-error`. */
  execute?: (input: Input, context: { toolCallId: string }) => Output | Promise<Output>;
};

export type ChatClientToolsType<T extends ChatTypes> = {
  [Name in ChatToolNameType<T>]?: ChatClientToolType<ChatToolInputType<T, Name>, ChatToolOutputType<T, Name>>;
};

export type ChatFinishResultType<T extends ChatTypes> = {
  /** The assistant message produced by this request (`undefined` when nothing arrived) */
  message: ChatMessageType<T> | undefined;
  messages: ChatMessageType<T>[];
  isAbort: boolean;
  isError: boolean;
  finishReason: ChatFinishReasonType | undefined;
  usage: ChatUsageType | undefined;
};

export type ChatOptionsType<T extends ChatTypes, R extends RequestInstance> = {
  /** HyperFetch request that talks to your chat endpoint. Clients, plugins, auth, retries and devtools all apply. */
  request: R;
  /** Wire format of the backend, e.g. `aiSDKProtocol()` or `aguiProtocol()` */
  protocol: ChatProtocolType;
  /** Request used by `resumeStream()` to reconnect to a running stream (AI SDK `GET /api/chat/:id/stream`) */
  resumeRequest?: RequestInstance | ((chatId: string) => RequestInstance);
  /** Chat id, generated when not provided */
  id?: string;
  /** Initial messages */
  messages?: ChatMessageType<T>[];
  /** Initial shared agent state (AG-UI) */
  state?: ChatStateType<T>;
  /** Extra fields sent with every request */
  body?: Record<string, unknown> | (() => Record<string, unknown>);
  /** Tools the client can execute */
  tools?: ChatClientToolsType<T>;
  /**
   * Called when the backend asks the client to run a tool. Return nothing and answer later with `addToolResult`, or
   * use `tools[name].execute` to answer automatically.
   */
  onToolCall?: (toolCall: ChatToolCallType<T>) => void | Promise<void>;
  /** Called for every data part, including transient ones that are not stored in messages */
  onData?: (data: ChatDataEventType<T>) => void;
  /** Called for every normalized stream event */
  onEvent?: (event: ChatStreamEventType) => void;
  onFinish?: (result: ChatFinishResultType<T>) => void;
  onError?: (error: ChatErrorType<R>) => void;
  /** Send the next request automatically, e.g. with `lastAssistantMessageIsCompleteWithToolCalls` */
  sendAutomaticallyWhen?: (context: { messages: ChatMessageType<T>[] }) => boolean;
  /**
   * Safety limit for consecutive automatic requests without a user action, so a misbehaving backend can't loop
   * forever. Defaults to 20.
   */
  maxAutomaticSends?: number;
  generateId?: () => string;
  /** Validates message metadata */
  metadataSchema?: StandardSchemaV1<unknown, ChatMetadataType<T>>;
  /** Validates data parts by name (synchronous schemas only) */
  dataSchemas?: { [Name in ChatDataNameType<T>]?: StandardSchemaV1<unknown, ChatDataType<T>[Name]> };
};

export type ChatSnapshotType<T extends ChatTypes, R extends RequestInstance> = {
  id: string;
  messages: ChatMessageType<T>[];
  status: ChatStatusType;
  error: ChatErrorType<R> | undefined;
  state: ChatStateType<T> | undefined;
  /** Interrupts the backend is waiting on (AG-UI) */
  interrupts: ChatInterruptType[];
  /** Token usage of the last request */
  usage: ChatUsageType | undefined;
};

export type ChatSendMessageType<T extends ChatTypes> =
  | string
  | {
      text?: string;
      parts?: ChatPartType<T>[];
      metadata?: ChatMetadataType<T>;
      id?: string;
    };

export type ChatRequestOptionsType = {
  /** Extra body fields for this request only */
  body?: Record<string, unknown>;
};
